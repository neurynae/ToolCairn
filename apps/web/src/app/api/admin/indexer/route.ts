import { NextResponse } from 'next/server';
import { prisma } from '@/lib/admin/prisma';

export async function GET() {
  try {
    const [statusCounts, recentlyIndexed, recentFailures, lastIndexedAt] = await Promise.all([
      prisma.indexedTool.groupBy({
        by: ['index_status'],
        _count: { index_status: true },
      }),
      prisma.indexedTool.findMany({
        where: { index_status: 'indexed' },
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

    return NextResponse.json({
      ok: true,
      data: {
        counts,
        total: counts.pending + counts.indexed + counts.failed + counts.skipped,
        lastIndexedAt: lastIndexedAt?.last_indexed_at ?? null,
        recentlyIndexed,
        recentFailures,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
