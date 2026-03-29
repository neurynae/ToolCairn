/**
 * Reindex Scheduler — finds stale tools and enqueues low-priority re-index jobs.
 *
 * "Stale" = last_indexed_at older than STALE_THRESHOLD_DAYS, or never indexed.
 * Rate-limited to BATCH_SIZE tools per run to avoid exhausting the GitHub API.
 */

import { PrismaClient } from '@toolpilot/db';
import { enqueueBatchReindex } from '@toolpilot/queue';
import pino from 'pino';

const logger = pino({ name: '@toolpilot/indexer:reindex-scheduler' });

const STALE_THRESHOLD_DAYS = 7;
const BATCH_SIZE = 50;

export async function runReindexScheduler(): Promise<{
  found: number;
  enqueued: number;
}> {
  const prisma = new PrismaClient();
  try {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - STALE_THRESHOLD_DAYS);

    // Find tools that are either never indexed or indexed more than STALE_THRESHOLD_DAYS ago
    const staleTools = await prisma.indexedTool.findMany({
      where: {
        index_status: { in: ['indexed', 'pending'] },
        OR: [{ last_indexed_at: null }, { last_indexed_at: { lt: cutoff } }],
      },
      select: {
        github_url: true,
        last_indexed_at: true,
        index_status: true,
      },
      orderBy: { last_indexed_at: 'asc' }, // oldest first
      take: BATCH_SIZE,
    });

    if (staleTools.length === 0) {
      logger.info('No stale tools found — reindex scheduler done');
      return { found: 0, enqueued: 0 };
    }

    const toolIds = staleTools.map((t) => t.github_url);
    logger.info({ count: toolIds.length }, 'Enqueueing batch reindex');

    const result = await enqueueBatchReindex(toolIds);
    const enqueued = result.ok ? result.data : 0;

    logger.info({ found: staleTools.length, enqueued }, 'Reindex scheduler complete');
    return { found: staleTools.length, enqueued };
  } finally {
    await prisma.$disconnect();
  }
}
