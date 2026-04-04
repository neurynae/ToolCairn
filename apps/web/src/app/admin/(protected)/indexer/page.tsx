// Prevent static prerendering — page requires live DB/Redis data at runtime
export const dynamic = 'force-dynamic';

import { Redis } from 'ioredis';
import { config } from '@toolpilot/config';
import { prisma } from '@/lib/admin/prisma';
import { PROXY_ENABLED, proxyGet } from '@/lib/admin/api-proxy';
import { PageHeader } from '@/components/admin/page-header';
import { IndexerActions } from '@/components/admin/indexer/indexer-actions';
import { Card, CardContent } from '@/components/ui/card';

interface InitialData {
  counts: { pending: number; indexed: number; failed: number; skipped: number };
  total: number;
  lastIndexedAt: string | null;
  queueDepth: { index: number; scheduler: number };
  recentlyIndexed: Array<{ github_url: string; graph_node_id?: string | null; last_indexed_at: string | null }>;
  recentFailures: Array<{ github_url: string; error_message?: string | null; retry_count: number }>;
}

async function fetchInitialData(): Promise<InitialData> {
  if (PROXY_ENABLED) {
    const res = await proxyGet('/indexer/status');
    const json = (await res.json()) as { ok: boolean; data?: InitialData };
    if (json.ok && json.data) return json.data;
  }

  // Single Redis connection for all queue depth queries
  let indexLen = 0;
  let schedulerLen = 0;
  const redis = new Redis(config.REDIS_URL, { lazyConnect: true, connectTimeout: 3000 });
  try {
    await redis.connect();
    const { getQueueDepth } = await import('@/lib/admin/queue');
    [indexLen, schedulerLen] = await Promise.all([
      getQueueDepth(redis, 'toolpilot:index'),
      getQueueDepth(redis, 'toolpilot:scheduler'),
    ]);
  } catch { /* Redis unavailable */ } finally {
    redis.disconnect();
  }

  const [statusCounts, lastIndexed] = await Promise.all([
    prisma.indexedTool.groupBy({ by: ['index_status'], _count: { index_status: true } }),
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

  const [recentlyIndexed, recentFailures] = await Promise.all([
    prisma.indexedTool.findMany({
      where: { index_status: 'indexed', last_indexed_at: { not: null } },
      orderBy: { last_indexed_at: 'desc' },
      take: 10,
      select: { github_url: true, graph_node_id: true, last_indexed_at: true },
    }),
    prisma.indexedTool.findMany({
      where: { index_status: 'failed' },
      orderBy: { updated_at: 'desc' },
      take: 5,
      select: { github_url: true, error_message: true, retry_count: true },
    }),
  ]);

  return {
    counts,
    total: counts.pending + counts.indexed + counts.failed + counts.skipped,
    lastIndexedAt: lastIndexed?.last_indexed_at?.toISOString() ?? null,
    queueDepth: { index: indexLen, scheduler: schedulerLen },
    recentlyIndexed: recentlyIndexed.map((t) => ({
      github_url: t.github_url,
      graph_node_id: t.graph_node_id,
      last_indexed_at: t.last_indexed_at?.toISOString() ?? null,
    })),
    recentFailures: recentFailures.map((t) => ({
      github_url: t.github_url,
      error_message: t.error_message,
      retry_count: t.retry_count,
    })),
  };
}

export default async function IndexerPage() {
  let data: InitialData | null = null;

  try {
    data = await fetchInitialData();
  } catch {
    // will render error state
  }

  if (!data) {
    return (
      <>
        <PageHeader title="Indexer" description="GitHub crawler status" />
        <Card className="border-destructive/50">
          <CardContent className="pt-6 text-sm text-muted-foreground">
            Could not load indexer stats. Is PostgreSQL running?
          </CardContent>
        </Card>
      </>
    );
  }

  const lastIndexedLabel = data.lastIndexedAt
    ? new Date(data.lastIndexedAt).toLocaleString()
    : 'Never';

  return (
    <>
      <PageHeader
        title="Indexer"
        description={`${data.total} tools tracked · Last indexed: ${lastIndexedLabel}`}
      />
      {/* Everything below polls every 3s — no static numbers */}
      <IndexerActions
        queueDepth={data.queueDepth}
        initialCounts={data.counts}
        initialRecentlyIndexed={data.recentlyIndexed}
        initialRecentFailures={data.recentFailures}
      />
    </>
  );
}
