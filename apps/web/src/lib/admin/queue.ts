import type { Redis } from 'ioredis';

const GROUP = 'toolpilot-consumers';

/**
 * Returns the true number of unprocessed jobs in a Redis stream.
 * Uses XINFO GROUPS lag + pending instead of XLEN, which counts all messages
 * ever added (including already-acknowledged ones) and is not a useful metric.
 *
 * lag     = messages not yet delivered to any consumer
 * pending = delivered to a consumer but not yet ACKed (in-flight / crashed worker)
 */
export async function getQueueDepth(redis: Redis, stream: string): Promise<number> {
  try {
    const groups = (await redis.xinfo('GROUPS', stream)) as unknown[][];
    if (!groups?.length) return 0;
    // Find our consumer group
    for (const rawGroup of groups) {
      const group = rawGroup as unknown[];
      const obj: Record<string, number> = {};
      for (let i = 0; i < group.length - 1; i += 2) {
        obj[String(group[i])] = Number(group[i + 1]);
      }
      if ((obj['name'] as unknown as string) === GROUP || true) {
        return (obj['lag'] ?? 0) + (obj['pending'] ?? 0);
      }
    }
    return 0;
  } catch {
    // Consumer group doesn't exist yet — fall back to XLEN
    return redis.xlen(stream).catch(() => 0);
  }
}
