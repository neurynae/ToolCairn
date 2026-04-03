import { NextResponse } from 'next/server';
import { Redis } from 'ioredis';
import { enqueueDiscoveryTrigger } from '@toolpilot/queue';
import pino from 'pino';

const logger = pino({ name: 'api:admin:settings:run-discovery' });

const INDEX_STREAM = 'toolpilot:index';
const SCHEDULER_STREAM = 'toolpilot:scheduler';

export async function POST() {
  try {
    const result = await enqueueDiscoveryTrigger();

    if (!result.ok) {
      logger.error({ error: result.error }, 'Failed to enqueue discovery trigger');
      return NextResponse.json({ error: 'Failed to trigger discovery' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Discovery triggered — the worker will process it asynchronously.',
    });
  } catch (err) {
    logger.error({ err }, 'Failed to trigger discovery');
    return NextResponse.json({ error: 'Failed to trigger discovery' }, { status: 500 });
  }
}

export async function GET() {
  let redis: Redis | undefined;
  try {
    redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
    const pendingJobs = await redis.xlen(INDEX_STREAM);
    const pendingScheduler = await redis.xlen(SCHEDULER_STREAM);

    return NextResponse.json({
      pendingIndexJobs: pendingJobs,
      pendingSchedulerJobs: pendingScheduler,
    });
  } catch (err) {
    logger.error({ err }, 'Failed to get queue status');
    return NextResponse.json({ error: 'Failed to get queue status' }, { status: 500 });
  } finally {
    redis?.disconnect();
  }
}
