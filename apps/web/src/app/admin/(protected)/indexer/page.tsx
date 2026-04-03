import { Redis } from 'ioredis';
import { config } from '@toolpilot/config';
import { prisma } from '@/lib/admin/prisma';
import { PROXY_ENABLED, proxyGet } from '@/lib/admin/api-proxy';
import { PageHeader } from '@/components/admin/page-header';
import { IndexerActions } from '@/components/admin/indexer/indexer-actions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface IndexerStats {
  counts: { pending: number; indexed: number; failed: number; skipped: number };
  total: number;
  lastIndexedAt: string | null;
  recentlyIndexed: Array<{
    github_url: string;
    graph_node_id: string | null;
    last_indexed_at: Date | null;
  }>;
  recentFailures: Array<{
    github_url: string;
    error_message: string | null;
    retry_count: number;
    updated_at: Date;
  }>;
}

async function fetchIndexerStats(): Promise<IndexerStats> {
  const [statusCounts, recentlyIndexed, recentFailures, lastIndexed] = await Promise.all([
    prisma.indexedTool.groupBy({ by: ['index_status'], _count: { index_status: true } }),
    prisma.indexedTool.findMany({
      where: { index_status: 'indexed' },
      orderBy: { last_indexed_at: 'desc' },
      take: 10,
      select: { github_url: true, graph_node_id: true, last_indexed_at: true },
    }),
    prisma.indexedTool.findMany({
      where: { index_status: 'failed' },
      orderBy: { updated_at: 'desc' },
      take: 5,
      select: { github_url: true, error_message: true, retry_count: true, updated_at: true },
    }),
    prisma.indexedTool.findFirst({
      where: { index_status: 'indexed' },
      orderBy: { last_indexed_at: 'desc' },
      select: { last_indexed_at: true },
    }),
  ]);

  const counts = { pending: 0, indexed: 0, failed: 0, skipped: 0 };
  for (const row of statusCounts) {
    const key = row.index_status as keyof typeof counts;
    if (key in counts) counts[key] = row._count.index_status;
  }

  return {
    counts,
    total: counts.pending + counts.indexed + counts.failed + counts.skipped,
    lastIndexedAt: lastIndexed?.last_indexed_at?.toISOString() ?? null,
    recentlyIndexed,
    recentFailures,
  };
}

async function fetchQueueDepth(): Promise<{ index: number; scheduler: number }> {
  const redis = new Redis(config.REDIS_URL, { lazyConnect: true, connectTimeout: 3000 });
  try {
    await redis.connect();
    const [indexLen, schedulerLen] = await Promise.all([
      redis.xlen('toolpilot:index').catch(() => 0),
      redis.xlen('toolpilot:scheduler').catch(() => 0),
    ]);
    return { index: indexLen, scheduler: schedulerLen };
  } catch {
    return { index: 0, scheduler: 0 };
  } finally {
    redis.disconnect();
  }
}

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  indexed: { label: 'indexed', className: 'text-emerald-400 border-emerald-400/30 bg-emerald-400/10' },
  pending: { label: 'pending', className: 'text-amber-400 border-amber-400/30 bg-amber-400/10' },
  failed: { label: 'failed', className: 'text-red-400 border-red-400/30 bg-red-400/10' },
  skipped: { label: 'skipped', className: 'text-muted-foreground border-border' },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_BADGE[status] ?? STATUS_BADGE.skipped;
  return (
    <Badge variant="outline" className={cfg?.className}>
      {cfg?.label ?? status}
    </Badge>
  );
}

export default async function IndexerPage() {
  let stats: IndexerStats | null = null;
  let queueDepth = { index: 0, scheduler: 0 };

  try {
    if (PROXY_ENABLED) {
      // In proxy mode: get indexer status (incl. queue depth) from apps/api
      const res = await proxyGet('/indexer/status');
      const json = (await res.json()) as {
        ok: boolean;
        data?: {
          counts: IndexerStats['counts'];
          total: number;
          lastIndexedAt: string | null;
          recentlyIndexed: IndexerStats['recentlyIndexed'];
          recentFailures: IndexerStats['recentFailures'];
          queueDepth: { index: number; scheduler: number };
        };
      };
      if (json.ok && json.data) {
        const { queueDepth: qd, ...rest } = json.data;
        stats = rest;
        queueDepth = qd;
      }
    } else {
      [stats, queueDepth] = await Promise.all([fetchIndexerStats(), fetchQueueDepth()]);
    }
  } catch {
    // Postgres/Redis unavailable
    if (!stats) {
      try { stats = await fetchIndexerStats(); } catch { /* ignore */ }
    }
  }

  if (!stats) {
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

  const lastIndexedLabel = stats.lastIndexedAt
    ? new Date(stats.lastIndexedAt).toLocaleString()
    : 'Never';

  return (
    <>
      <PageHeader
        title="Indexer"
        description={`${stats.total} tools tracked · Last indexed: ${lastIndexedLabel}`}
      />

      {/* Actions + queue depth */}
      <IndexerActions queueDepth={queueDepth} />

      {/* Status counters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {(
          [
            { label: 'Indexed', key: 'indexed', status: 'indexed' },
            { label: 'Pending', key: 'pending', status: 'pending' },
            { label: 'Failed', key: 'failed', status: 'failed' },
            { label: 'Skipped', key: 'skipped', status: 'skipped' },
          ] as const
        ).map(({ label, key, status }) => (
          <Card key={key}>
            <CardHeader className="pb-1">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
                <StatusBadge status={status} />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{stats.counts[key]}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recently indexed */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Recently Indexed</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {stats.recentlyIndexed.length === 0 ? (
            <p className="text-sm text-muted-foreground px-6 pb-6">
              No tools indexed yet. Run the indexer to start.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Repository</TableHead>
                  <TableHead>Node ID</TableHead>
                  <TableHead>Indexed At</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.recentlyIndexed.map((tool) => (
                  <TableRow key={tool.github_url}>
                    <TableCell className="font-mono text-xs">
                      {tool.github_url.replace('https://github.com/', '')}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {tool.graph_node_id?.slice(0, 8) ?? '—'}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {tool.last_indexed_at ? new Date(tool.last_indexed_at).toLocaleString() : '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Recent failures */}
      {stats.recentFailures.length > 0 && (
        <Card className="border-red-500/20">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-red-400">
              Recent Failures
              <span className="text-muted-foreground font-normal ml-1">(last 5)</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Repository</TableHead>
                  <TableHead>Error</TableHead>
                  <TableHead>Retries</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.recentFailures.map((tool) => (
                  <TableRow key={tool.github_url}>
                    <TableCell className="font-mono text-xs">
                      {tool.github_url.replace('https://github.com/', '')}
                    </TableCell>
                    <TableCell className="text-xs text-red-400 max-w-sm truncate">
                      {tool.error_message ?? '—'}
                    </TableCell>
                    <TableCell className="text-xs">{tool.retry_count}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {stats.recentFailures.length === 0 && stats.counts.indexed > 0 && (
        <Card className="border-emerald-500/20 bg-emerald-500/5">
          <CardContent className="pt-4 pb-4 text-sm text-emerald-400">
            No indexer failures — all systems nominal.
          </CardContent>
        </Card>
      )}
    </>
  );
}
