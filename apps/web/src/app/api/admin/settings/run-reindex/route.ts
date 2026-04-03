import { NextResponse } from 'next/server';
import { enqueueReindexTrigger } from '@toolpilot/queue';
import pino from 'pino';

const logger = pino({ name: 'api:admin:settings:run-reindex' });

export async function POST() {
  try {
    const result = await enqueueReindexTrigger();

    if (!result.ok) {
      logger.error({ error: result.error }, 'Failed to enqueue reindex trigger');
      return NextResponse.json({ error: 'Failed to trigger reindex' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Reindex triggered — the worker will process it asynchronously.',
    });
  } catch (err) {
    logger.error({ err }, 'Failed to trigger reindex');
    return NextResponse.json({ error: 'Failed to trigger reindex' }, { status: 500 });
  }
}
