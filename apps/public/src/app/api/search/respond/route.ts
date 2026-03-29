import { PrismaClient } from '@toolpilot/db';
import { SearchPipeline, SearchSessionManager } from '@toolpilot/search';
import { NextResponse } from 'next/server';
import pino from 'pino';
import { z } from 'zod';
import { formatResults } from '@/lib/format-results';

const logger = pino({ name: '@toolpilot/public:api-search-respond' });
const prisma = new PrismaClient();
const sessionManager = new SearchSessionManager(prisma);
const pipeline = new SearchPipeline(sessionManager);

const RespondRequestSchema = z.object({
  query_id: z.string().min(1, 'query_id must not be empty'),
  answers: z
    .array(
      z.object({
        dimension: z.string().min(1),
        value: z.string().min(1),
      }),
    )
    .min(1, 'answers must contain at least one entry'),
});

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();
    const parsed = RespondRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: 'validation_error', message: parsed.error.issues[0]?.message ?? 'Invalid input' },
        { status: 400 },
      );
    }

    const { query_id, answers } = parsed.data;

    const session = await sessionManager.getSession(query_id);
    if (!session) {
      return NextResponse.json(
        { ok: false, error: 'session_not_found', message: `No session found for query_id: ${query_id}` },
        { status: 404 },
      );
    }

    logger.info({ sessionId: query_id, answerCount: answers.length }, 'search respond called');

    // Load saved Stage 1 candidates
    const candidateIds = await sessionManager.getCandidates(query_id);
    if (candidateIds.length === 0) {
      return NextResponse.json(
        { ok: false, error: 'no_candidates', message: 'No saved candidates for this session. Call /api/search first.' },
        { status: 400 },
      );
    }

    // Build updated context from clarification answers
    const filterUpdates: Record<string, string> = {};
    for (const answer of answers) {
      filterUpdates[answer.dimension] = answer.value;
    }
    const prevContext = (session.context as Record<string, unknown> | null) ?? {};
    const updatedContext = {
      ...prevContext,
      filters: {
        ...((prevContext.filters as Record<string, unknown>) ?? {}),
        ...filterUpdates,
      },
    };

    await sessionManager.updateContext(query_id, updatedContext);
    await sessionManager.appendClarification(query_id, [], answers);

    // Run stages 2-4 with saved candidates + updated context filters
    const { results, is_two_option } = await pipeline.runStages2to4(
      candidateIds,
      updatedContext,
      query_id,
    );

    logger.info({ sessionId: query_id, resultCount: results.length }, 'search respond complete');

    return NextResponse.json({
      ok: true,
      data: {
        query_id,
        status: 'complete' as const,
        results: formatResults(results, is_two_option),
        is_two_option,
        timing: { stage1_ms: 0, stage2_ms: 0, stage3_ms: 0, stage4_ms: 0, total_ms: 0 },
      },
    });
  } catch (e) {
    logger.error({ err: e, query_id: (e as Record<string, unknown>)?.query_id }, 'search respond failed');
    return NextResponse.json(
      { ok: false, error: 'search_error', message: e instanceof Error ? e.message : String(e) },
      { status: 500 },
    );
  }
}
