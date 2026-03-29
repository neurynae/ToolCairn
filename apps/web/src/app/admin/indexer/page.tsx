import { prisma } from '@/lib/admin/prisma';

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
    prisma.indexedTool.groupBy({
      by: ['index_status'],
      _count: { index_status: true },
    }),
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

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    indexed: 'bg-green-50 text-green-700 ring-green-600/20',
    pending: 'bg-yellow-50 text-yellow-700 ring-yellow-600/20',
    failed: 'bg-red-50 text-red-700 ring-red-600/20',
    skipped: 'bg-gray-50 text-gray-600 ring-gray-500/20',
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${styles[status] ?? styles.skipped}`}
    >
      {status}
    </span>
  );
}

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: string;
}) {
  return (
    <div className={`rounded-lg border bg-white p-4 ${accent ?? 'border-gray-200'}`}>
      <p className="text-sm text-gray-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
    </div>
  );
}

export default async function IndexerPage() {
  let stats: IndexerStats | null = null;

  try {
    stats = await fetchIndexerStats();
  } catch {
    // Postgres unavailable
  }

  if (!stats) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-lg font-semibold text-gray-900">Indexer</h1>
        <p className="text-sm text-red-500">Could not load indexer stats. Is Postgres running?</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-lg font-semibold text-gray-900">Indexer</h1>
        <p className="text-sm text-gray-500">
          GitHub crawler status — {stats.total} tools tracked.
          {stats.lastIndexedAt && (
            <> Last indexed: {new Date(stats.lastIndexedAt).toLocaleString()}.</>
          )}
        </p>
      </div>

      {/* Status counters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Indexed" value={stats.counts.indexed} accent="border-green-200" />
        <StatCard label="Pending" value={stats.counts.pending} accent="border-yellow-200" />
        <StatCard label="Failed" value={stats.counts.failed} accent="border-red-200" />
        <StatCard label="Skipped" value={stats.counts.skipped} />
      </div>

      {/* Recently indexed */}
      <div>
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Recently Indexed</h2>
        {stats.recentlyIndexed.length === 0 ? (
          <p className="text-sm text-gray-400">No tools indexed yet. Run pnpm indexer:run to start.</p>
        ) : (
          <div className="overflow-hidden rounded-lg border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Repository
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Node ID
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Indexed At
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {stats.recentlyIndexed.map((tool) => (
                  <tr key={tool.github_url} className="hover:bg-gray-50">
                    <td className="px-4 py-2 font-mono text-xs text-gray-700 max-w-xs truncate">
                      {tool.github_url.replace('https://github.com/', '')}
                    </td>
                    <td className="px-4 py-2 font-mono text-xs text-gray-400">
                      {tool.graph_node_id ?? '—'}
                    </td>
                    <td className="px-4 py-2 text-xs text-gray-500">
                      {tool.last_indexed_at
                        ? new Date(tool.last_indexed_at).toLocaleString()
                        : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Recent failures */}
      {stats.recentFailures.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-700 mb-3">
            Recent Failures{' '}
            <span className="text-gray-400 font-normal">(last 5)</span>
          </h2>
          <div className="overflow-hidden rounded-lg border border-red-100">
            <table className="min-w-full divide-y divide-red-50 text-sm">
              <thead className="bg-red-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-red-500 uppercase tracking-wider">
                    Repository
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-red-500 uppercase tracking-wider">
                    Error
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-red-500 uppercase tracking-wider">
                    Retries
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-red-50">
                {stats.recentFailures.map((tool) => (
                  <tr key={tool.github_url}>
                    <td className="px-4 py-2 font-mono text-xs text-gray-700 max-w-xs truncate">
                      {tool.github_url.replace('https://github.com/', '')}
                    </td>
                    <td className="px-4 py-2 text-xs text-red-600 max-w-sm truncate">
                      {tool.error_message ?? '—'}
                    </td>
                    <td className="px-4 py-2 text-xs text-gray-500">{tool.retry_count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* No failures empty state */}
      {stats.recentFailures.length === 0 && stats.counts.indexed > 0 && (
        <div className="rounded-lg border border-green-100 bg-green-50 px-4 py-3">
          <p className="text-sm text-green-700">No indexer failures. All systems nominal.</p>
        </div>
      )}
    </div>
  );
}
