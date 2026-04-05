import { PrismaClient } from '@toolpilot/db';
import { enqueueIndexJob } from '@toolpilot/queue';
import { type NextRequest, NextResponse } from 'next/server';
import { withProxyPost } from '@/lib/api/proxy';
import pino from 'pino';
import { z } from 'zod';

const logger = pino({ name: '@toolpilot/public:api-outcome' });
const prisma = new PrismaClient();

const OutcomeSchema = z.object({
  query_id: z.string().min(1),
  chosen_tool: z.string().min(1),
  outcome: z.enum(['success', 'failure', 'replaced', 'pending']),
  reason: z.string().optional(),
  feedback: z.string().optional(),
});

async function directHandler(request: NextRequest) {
  try {
    const body: unknown = await request.json();
    const parsed = OutcomeSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: 'validation_error', message: parsed.error.issues[0]?.message ?? 'Invalid input' },
        { status: 400 },
      );
    }

    const { query_id, chosen_tool, outcome, reason, feedback } = parsed.data;

    await prisma.outcomeReport.create({
      data: { query_id, chosen_tool, reason, outcome, feedback },
    });

    if (outcome === 'failure') {
      const result = await enqueueIndexJob(chosen_tool, 1);
      if (!result.ok) {
        logger.warn({ tool: chosen_tool, err: result.error }, 'Failed to enqueue re-index');
      }
    }

    logger.info({ query_id, outcome }, 'Outcome recorded');

    return NextResponse.json({ ok: true, data: { recorded: true } });
  } catch (e) {
    logger.error({ err: e }, 'report outcome failed');
    return NextResponse.json(
      { ok: false, error: 'storage_error', message: e instanceof Error ? e.message : String(e) },
      { status: 500 },
    );
  }
}

export const POST = withProxyPost('/feedback/outcome', directHandler);
