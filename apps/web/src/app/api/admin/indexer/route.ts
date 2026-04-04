import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
import { Redis } from 'ioredis';
import { prisma } from '@/lib/admin/prisma';
import { withProxyGet } from '@/lib/admin/api-proxy';

async function directGET(): Promise<NextResponse> {
  const [statusCounts, recentlyIndexed, recentFailures, lastIndexedAt] = await Promise.all([
    prisma.indexedTool.groupBy({
      by: ['index_status'],
      _count: { index_status: true },
    }),
    prisma.indexedTool.findMany({
      where: { index_status: 'indexed', last_indexed_at: { not: null } },
      orderBy: { last_indexed_at: 'desc' },
      take: 10,
      select: {
        github_url: true,
        graph_node_id: true,
        last_indexed_at: true,
      },
    }),
    prisma.indexedTool.findMany({
      where: { index_status: 'failed' },
      orderBy: { updated_at: 'desc' },
      take: 5,
      select: {
        github_url: true,
        error_message: true,
        retry_count: true,
        updated_at: true,
      },
    }),
    prisma.indexedTool.findFirst({
      where: { index_status: 'indexed', last_indexed_at: { not: null } },
      orderBy: { last_indexed_at: 'desc' },
      select: { last_indexed_at: true },
    }),
  ]);

  const counts = { pending: 0, indexed: 0, failed: 0, skipped: 0 };
  for (const row of statusCounts) {
    const key = row.index_status as keyof typeof counts;
    if (key in counts) counts[key] = row._count.index_status;
  }

  // Always include queue depth — read from Redis directly
  let queueDepth = { index: 0, scheduler: 0 };
  const redis = new Redis(process.env.REDIS_URL ?? 'redis://localhost:6379', {
    lazyConnect: true,
    connectTimeout: 2000,
    maxRetriesPerRequest: 0,
  });
  try {
    await redis.connect();
    const { getQueueDepth } = await import('@/lib/admin/queue');
    const [indexLen, schedulerLen] = await Promise.all([
      getQueueDepth(redis, 'toolpilot:index'),
      getQueueDepth(redis, 'toolpilot:scheduler'),
    ]);
    queueDepth = { index: indexLen, scheduler: schedulerLen };
  } catch {
    // Redis unavailable — return 0
  } finally {
    redis.disconnect();
  }

  return NextResponse.json({
    ok: true,
    data: {
      counts,
      total: counts.pending + counts.indexed + counts.failed + counts.skipped,
      lastIndexedAt: lastIndexedAt?.last_indexed_at ?? null,
      recentlyIndexed,
      recentFailures,
      queueDepth,
    },
  });
}

export const GET = withProxyGet('/indexer/status', directGET);
