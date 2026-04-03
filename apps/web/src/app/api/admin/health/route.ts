import { NextResponse, type NextRequest } from 'next/server';
import { memgraphHealthCheck, getMemgraphSession } from '@toolpilot/graph';
import { withProxyGet } from '@/lib/admin/api-proxy';
import { qdrantHealthCheck, qdrantClient } from '@toolpilot/vector';
import { Redis } from 'ioredis';
import { config } from '@toolpilot/config';
import { prisma } from '@/lib/admin/prisma';

async function directGET(_request: NextRequest): Promise<NextResponse> {
  const start = Date.now();

  const [memgraph, qdrant, postgres, redis, stats] = await Promise.allSettled([
    checkMemgraph(),
    checkQdrant(),
    checkPostgres(),
    checkRedis(),
    getStats(),
  ]);

  return NextResponse.json({
    ok: true,
    data: {
      latencyMs: Date.now() - start,
      memgraph: memgraph.status === 'fulfilled' ? memgraph.value : { ok: false, error: String(memgraph.reason) },
      qdrant: qdrant.status === 'fulfilled' ? qdrant.value : { ok: false, error: String(qdrant.reason) },
      postgres: postgres.status === 'fulfilled' ? postgres.value : { ok: false, error: String(postgres.reason) },
      redis: redis.status === 'fulfilled' ? redis.value : { ok: false, error: String(redis.reason) },
      stats: stats.status === 'fulfilled' ? stats.value : null,
    },
  });
}

async function checkMemgraph() {
  return memgraphHealthCheck();
}

async function checkQdrant() {
  const result = await qdrantHealthCheck();
  if (!result.ok) return result;
  try {
    const { collections } = await qdrantClient().getCollections();
    const collectionStats: Record<string, number> = {};
    for (const col of collections) {
      try {
        const info = await qdrantClient().getCollection(col.name);
        collectionStats[col.name] = info.points_count ?? 0;
      } catch {
        collectionStats[col.name] = -1;
      }
    }
    return { ok: true, collections: collectionStats };
  } catch {
    return result;
  }
}

async function checkPostgres() {
  const start = Date.now();
  await prisma.$queryRaw`SELECT 1`;
  return { ok: true, latencyMs: Date.now() - start };
}

async function checkRedis() {
  const redis = new Redis(config.REDIS_URL, { lazyConnect: true, connectTimeout: 3000 });
  try {
    await redis.connect();
    const start = Date.now();
    await redis.ping();
    const latencyMs = Date.now() - start;
    const [indexQueueLen, schedulerQueueLen] = await Promise.all([
      redis.xlen('toolpilot:index').catch(() => 0),
      redis.xlen('toolpilot:scheduler').catch(() => 0),
    ]);
    return { ok: true, latencyMs, queueDepth: { index: indexQueueLen, scheduler: schedulerQueueLen } };
  } finally {
    redis.disconnect();
  }
}

type Neo4jInt = { toNumber?: () => number };

function toNum(val: unknown): number {
  if (val && typeof val === 'object' && 'toNumber' in val) {
    return (val as Neo4jInt).toNumber?.() ?? 0;
  }
  return typeof val === 'number' ? val : 0;
}

async function getStats() {
  // Memgraph sessions must be used sequentially — no parallel session.run() calls
  const s1 = getMemgraphSession();
  let toolCount = 0;
  let edgeCount = 0;
  try {
    const r1 = await s1.run('MATCH (t:Tool) RETURN count(t) AS n');
    toolCount = toNum(r1.records[0]?.get('n'));
    const r2 = await s1.run('MATCH ()-[e]->() RETURN count(e) AS n');
    edgeCount = toNum(r2.records[0]?.get('n'));
  } finally {
    await s1.close();
  }

  const [pendingReview, pendingIndex] = await Promise.all([
    prisma.stagedNode.count({ where: { graduated: false } }),
    prisma.indexedTool.count({ where: { index_status: 'pending' } }),
  ]);

  return { toolCount, edgeCount, pendingReview, pendingIndex };
}

export const GET = withProxyGet('/health', directGET);
