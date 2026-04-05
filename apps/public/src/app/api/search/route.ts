import { PrismaClient } from '@toolpilot/db';
import { enqueueSearchEvent } from '@toolpilot/queue';
import { type NextRequest } from 'next/server';
import { withProxyPost } from '@/lib/api/proxy';
import {
  ClarificationEngine,
  SearchPipeline,
  SearchSessionManager,
  stage1HybridSearch,
} from '@toolpilot/search';
import { NextResponse } from 'next/server';
import pino from 'pino';
import { z } from 'zod';
import { formatResults } from '@/lib/format-results';

const logger = pino({ name: '@toolpilot/public:api-search' });
const prisma = new PrismaClient();
const sessionManager = new SearchSessionManager(prisma);
const pipeline = new SearchPipeline(sessionManager);
const clarificationEngine = new ClarificationEngine();

const CLARIFICATION_THRESHOLD = 3;

const SearchRequestSchema = z.object({
  query: z.string().min(1, 'query must not be empty').max(500),
});

async function directHandler(request: NextRequest) {
  try {
    const body: unknown = await request.json();
    const parsed = SearchRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: 'validation_error', message: parsed.error.issues[0]?.message ?? 'Invalid input' },
        { status: 400 },
      );
    }

    const { query } = parsed.data;
    const sessionId = await sessionManager.createSession(query);
    logger.info({ sessionId, query }, 'search called');

    const t0 = Date.now();

    // Stage 1 — hybrid retrieval (BM25 + optional vector)
    const corpus = await pipeline.loadToolCorpus();
    const stage1 = await stage1HybridSearch(query, corpus);

    // Build candidate set from Stage 1 IDs
    const idSet = new Set(stage1.ids);
    const candidates = corpus.filter((t) => idSet.has(t.id));

    // Check if clarification is warranted
    const askedDimensions = await sessionManager.getAskedDimensions(sessionId);
    const questions = clarificationEngine.getClarification(candidates, askedDimensions);

    if (questions.length > 0 && candidates.length > CLARIFICATION_THRESHOLD) {
      await sessionManager.saveCandidates(sessionId, stage1.ids);
      await sessionManager.appendClarification(sessionId, questions, []);

      enqueueSearchEvent(query, sessionId).catch((e: unknown) => {
        logger.warn({ err: e }, 'Failed to enqueue search event');
      });

      logger.info(
        { sessionId, candidateCount: candidates.length, questionCount: questions.length },
        'Clarification needed',
      );

      return NextResponse.json({
        ok: true,
        data: {
          query_id: sessionId,
          status: 'clarification_needed' as const,
          stage: 1,
          candidate_count: candidates.length,
          questions,
        },
      });
    }

    // No clarification needed — run stages 2-4 directly
    const { results, is_two_option, stage2_ms, stage3_ms, stage4_ms } =
      await pipeline.runStages2to4(stage1.ids, undefined, sessionId);

    enqueueSearchEvent(query, sessionId).catch((e: unknown) => {
      logger.warn({ err: e }, 'Failed to enqueue search event');
    });

    const total_ms = Date.now() - t0;
    logger.info({ sessionId, total_ms, resultCount: results.length }, 'search complete');

    return NextResponse.json({
      ok: true,
      data: {
        query_id: sessionId,
        status: 'complete' as const,
        results: formatResults(results, is_two_option),
        is_two_option,
        timing: {
          stage1_ms: stage1.elapsed_ms,
          stage2_ms,
          stage3_ms,
          stage4_ms,
          total_ms,
        },
      },
    });
  } catch (e) {
    logger.error({ err: e }, 'search failed');
    return NextResponse.json(
      { ok: false, error: 'search_error', message: e instanceof Error ? e.message : String(e) },
      { status: 500 },
    );
  }
}

export const POST = withProxyPost('/search', directHandler);
