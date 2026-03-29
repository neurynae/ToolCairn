import { PrismaClient } from '@toolpilot/db';
import pino from 'pino';
import { IndexerError } from '../errors.js';

const logger = pino({ name: '@toolpilot/indexer:prisma-writer' });

let _prisma: PrismaClient | undefined;

function getPrismaClient(): PrismaClient {
  if (!_prisma) {
    _prisma = new PrismaClient();
  }
  return _prisma;
}

/**
 * Upsert an IndexedTool record in PostgreSQL.
 * Sets graph_node_id, last_indexed_at, index_status, and increments retry_count.
 */
export async function upsertIndexedTool(
  githubUrl: string,
  graphNodeId: string,
  status: string,
): Promise<void> {
  const prisma = getPrismaClient();

  try {
    await prisma.indexedTool.upsert({
      where: { github_url: githubUrl },
      update: {
        graph_node_id: graphNodeId,
        last_indexed_at: new Date(),
        index_status: status,
        retry_count: { increment: 1 },
        updated_at: new Date(),
      },
      create: {
        github_url: githubUrl,
        graph_node_id: graphNodeId,
        last_indexed_at: new Date(),
        index_status: status,
        retry_count: 0,
      },
    });

    logger.info({ githubUrl, graphNodeId, status }, 'IndexedTool upserted in PostgreSQL');
  } catch (e) {
    throw new IndexerError(
      `Failed to upsert IndexedTool for ${githubUrl}: ${e instanceof Error ? e.message : String(e)}`,
      e,
    );
  }
}
