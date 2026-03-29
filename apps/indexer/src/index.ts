import { ensureAllCollections } from '@toolpilot/vector';
import pino from 'pino';
import { startIndexWorker } from './workers/index-worker.js';

const logger = pino({ name: '@toolpilot/indexer' });

async function main(): Promise<void> {
  logger.info('ToolPilot Indexer starting');
  await ensureAllCollections();
  logger.info('Qdrant collections ready');
  await startIndexWorker();
}

main().catch((error: unknown) => {
  logger.error({ err: error }, 'Indexer failed to start');
  process.exit(1);
});
