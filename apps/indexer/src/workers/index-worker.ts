import { startConsumer } from '@toolpilot/queue';
import type { QueueHandlers } from '@toolpilot/queue';
import pino from 'pino';
import { handleIndexJob } from '../queue-consumers/index-consumer.js';

const logger = pino({ name: '@toolpilot/indexer:index-worker' });

async function logSearchEvent(query: string, sessionId: string): Promise<void> {
  logger.info({ query, sessionId }, 'Search event received');
}

/**
 * Start the index worker — connects to Redis and begins consuming queue messages.
 */
export async function startIndexWorker(): Promise<void> {
  logger.info('Starting index worker');

  const handlers: QueueHandlers = {
    onIndexJob: handleIndexJob,
    onSearchEvent: logSearchEvent,
  };

  await startConsumer(handlers);
}
