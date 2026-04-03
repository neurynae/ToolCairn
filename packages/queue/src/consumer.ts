import { config } from '@toolpilot/config';
import { Redis } from 'ioredis';
import pino from 'pino';
import type { QueueMessage } from './types.js';

const logger = pino({ name: '@toolpilot/queue:consumer' });

const INDEX_STREAM = 'toolpilot:index';
const SEARCH_STREAM = 'toolpilot:search';
const SCHEDULER_STREAM = 'toolpilot:scheduler';

export interface QueueHandlers {
  onIndexJob: (toolId: string, priority: number) => Promise<void>;
  onSearchEvent: (query: string, sessionId: string) => Promise<void>;
  onRunDiscovery?: () => Promise<void>;
  onRunReindex?: () => Promise<void>;
}

let redisClient: Redis | undefined;

function getRedisClient(): Redis {
  if (!redisClient) {
    redisClient = new Redis(config.REDIS_URL);
  }
  return redisClient;
}

async function ensureConsumerGroup(stream: string, group: string): Promise<void> {
  const redis = getRedisClient();
  try {
    await redis.xgroup('CREATE', stream, group, '0', 'MKSTREAM');
  } catch {
    // Group already exists — ignore
  }
}

type StreamMessage = QueueMessage & { _streamKey: string; _entryId: string };

/**
 * Read messages from both streams using consumer groups.
 * Returned messages carry _streamKey and _entryId for correct acknowledgement.
 */
export async function readFromStream(
  group: string,
  consumer: string,
  count: number,
): Promise<StreamMessage[]> {
  const redis = getRedisClient();

  await ensureConsumerGroup(INDEX_STREAM, group);
  await ensureConsumerGroup(SEARCH_STREAM, group);
  await ensureConsumerGroup(SCHEDULER_STREAM, group);

  const [indexResult, searchResult, schedulerResult] = await Promise.all([
    redis.xreadgroup(
      'GROUP',
      group,
      consumer,
      'COUNT',
      String(count),
      'STREAMS',
      INDEX_STREAM,
      '>',
    ),
    redis.xreadgroup(
      'GROUP',
      group,
      consumer,
      'COUNT',
      String(count),
      'STREAMS',
      SEARCH_STREAM,
      '>',
    ),
    redis.xreadgroup(
      'GROUP',
      group,
      consumer,
      'COUNT',
      String(count),
      'STREAMS',
      SCHEDULER_STREAM,
      '>',
    ),
  ]);

  const messages: StreamMessage[] = [];

  const streams: Array<[typeof indexResult, string]> = [
    [indexResult, INDEX_STREAM],
    [searchResult, SEARCH_STREAM],
    [schedulerResult, SCHEDULER_STREAM],
  ];

  for (const [streamResult, streamKey] of streams) {
    if (!streamResult) continue;
    for (const [, entries] of streamResult as [string, [string, string[]][]][]) {
      for (const [entryId, fields] of entries) {
        const map: Record<string, string> = {};
        for (let i = 0; i < fields.length; i += 2) {
          map[fields[i] ?? ''] = fields[i + 1] ?? '';
        }
        const appId = map.id;
        const type = map.type;
        const payload = map.payload;
        const timestamp = map.timestamp;
        if (!appId || !type || !payload || !timestamp) continue;
        messages.push({
          id: appId,
          type,
          payload: JSON.parse(payload),
          timestamp: Number(timestamp),
          _streamKey: streamKey,
          _entryId: entryId,
        });
      }
    }
  }

  return messages;
}

/**
 * Start the consumer loop — reads messages and dispatches to handlers.
 * Backs off on empty polls (100ms → 1s). Exits cleanly on SIGTERM/SIGINT.
 */
export async function startConsumer(handlers: QueueHandlers): Promise<void> {
  const group = 'toolpilot-consumers';
  const consumer = `consumer-${process.pid}`;
  let running = true;
  let emptyPollCount = 0;

  const shutdown = () => {
    running = false;
  };
  process.once('SIGTERM', shutdown);
  process.once('SIGINT', shutdown);

  try {
    while (running) {
      const messages = await readFromStream(group, consumer, 10);

      if (messages.length === 0) {
        // Exponential backoff: 100ms base, +50ms per consecutive empty poll, max 1s
        const delay = Math.min(100 + emptyPollCount * 50, 1000);
        emptyPollCount++;
        await new Promise<void>((r) => setTimeout(r, delay));
        continue;
      }

      emptyPollCount = 0;

      for (const msg of messages) {
        try {
          if (msg.type === 'index-job') {
            const { toolId, priority } = msg.payload as { toolId: string; priority: number };
            await handlers.onIndexJob(toolId, priority);
          } else if (msg.type === 'search-event') {
            const { query, sessionId } = msg.payload as { query: string; sessionId: string };
            await handlers.onSearchEvent(query, sessionId);
          } else if (msg.type === 'run-discovery' && handlers.onRunDiscovery) {
            await handlers.onRunDiscovery();
          } else if (msg.type === 'run-reindex' && handlers.onRunReindex) {
            await handlers.onRunReindex();
          }
        } catch (e) {
          logger.error(
            { err: e, messageId: msg.id, messageType: msg.type },
            'Message processing failed',
          );
        }
      }

      // Acknowledge each message only against its originating stream
      const redis = getRedisClient();
      const indexIds = messages.filter((m) => m._streamKey === INDEX_STREAM).map((m) => m._entryId);
      const searchIds = messages
        .filter((m) => m._streamKey === SEARCH_STREAM)
        .map((m) => m._entryId);
      const schedulerIds = messages
        .filter((m) => m._streamKey === SCHEDULER_STREAM)
        .map((m) => m._entryId);

      if (indexIds.length > 0) await redis.xack(INDEX_STREAM, group, ...indexIds);
      if (searchIds.length > 0) await redis.xack(SEARCH_STREAM, group, ...searchIds);
      if (schedulerIds.length > 0) await redis.xack(SCHEDULER_STREAM, group, ...schedulerIds);
    }
  } finally {
    process.off('SIGTERM', shutdown);
    process.off('SIGINT', shutdown);
    logger.info('Consumer loop stopped');
  }
}
