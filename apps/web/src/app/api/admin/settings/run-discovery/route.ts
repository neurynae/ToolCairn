import { NextResponse, type NextRequest } from 'next/server';
import { Redis } from 'ioredis';
import { enqueueDiscoveryTrigger } from '@toolpilot/queue';
import pino from 'pino';
import { withProxyPost } from '@/lib/admin/api-proxy';

const logger = pino({ name: 'api:admin:settings:run-discovery' });

const INDEX_STREAM = 'toolpilot:index';
const SCHEDULER_STREAM = 'toolpilot:scheduler';

async function directPOST(_request: NextRequest): Promise<NextResponse> {
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

export const POST = withProxyPost('/indexer/discovery', directPOST);

export async function GET() {
  let redis: Redis | undefined;
  try {
    redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
    const { getQueueDepth } = await import('@/lib/admin/queue');
    const pendingJobs = await getQueueDepth(redis, INDEX_STREAM);
    const pendingScheduler = await getQueueDepth(redis, SCHEDULER_STREAM);

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
