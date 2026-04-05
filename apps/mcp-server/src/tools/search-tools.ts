import { PrismaClient } from '@toolpilot/db';
import { enqueueSearchEvent } from '@toolpilot/queue';
import {
  ClarificationEngine,
  SearchPipeline,
  SearchSessionManager,
  stage1HybridSearch,
} from '@toolpilot/search';
import pino from 'pino';
import { errResult, okResult } from '../utils.js';
import {
  buildLowCredibilityWarning,
  buildNonIndexedGuidance,
  formatResults,
} from './format-results.js';

const logger = pino({ name: '@toolcairn/mcp-server:search-tools' });
const prisma = new PrismaClient();
const sessionManager = new SearchSessionManager(prisma);
const pipeline = new SearchPipeline(sessionManager);
const clarificationEngine = new ClarificationEngine();

const CLARIFICATION_THRESHOLD = 3; // ask questions if > this many candidates

export async function handleSearchTools(args: {
  query: string;
  context?: { filters: Record<string, unknown> };
  query_id?: string;
  user_id?: string;
}) {
  try {
    const sessionId = args.query_id ?? (await sessionManager.createSession(args.query));
    logger.info({ sessionId, query: args.query }, 'search_tools called');

    if (args.context) {
      await sessionManager.updateContext(sessionId, args.context);
    }

    const t0 = Date.now();

    // Stage 1 — hybrid retrieval (BM25 + optional vector)
    const corpus = await pipeline.loadToolCorpus();
    const stage1 = await stage1HybridSearch(args.query, corpus);

    // Build candidate set from Stage 1 IDs
    const idSet = new Set(stage1.ids);
    const candidates = corpus.filter((t) => idSet.has(t.id));

    // Check if clarification is warranted
    const askedDimensions = await sessionManager.getAskedDimensions(sessionId);
    const questions = clarificationEngine.getClarification(candidates, askedDimensions);

    if (questions.length > 0 && candidates.length > CLARIFICATION_THRESHOLD) {
      // Save Stage 1 candidate IDs so search_tools_respond can use them
      await sessionManager.saveCandidates(sessionId, stage1.ids);
      // Record questions in clarification history (no answers yet)
      await sessionManager.appendClarification(sessionId, questions, []);

      enqueueSearchEvent(args.query, sessionId).catch((e: unknown) => {
        logger.warn({ err: e }, 'Failed to enqueue search event');
      });

      logger.info(
        { sessionId, candidateCount: candidates.length, questionCount: questions.length },
        'Clarification needed',
      );
      const askedDimsList = [...askedDimensions];
      const clarificationRound = pipeline.getClarificationRound(askedDimsList);
      return okResult({
        query_id: sessionId,
        status: 'clarification_needed',
        stage: 1,
        clarification_round: clarificationRound,
        candidate_count: candidates.length,
        questions,
        hint: 'Answer to narrow the search. Up to 2 more rounds of clarification may follow.',
      });
    }

    // No clarification needed — run stages 2-4 directly
    const { results, is_two_option, stage2_ms, stage3_ms, stage4_ms } =
      await pipeline.runStages2to4(stage1.ids, args.context, sessionId);

    enqueueSearchEvent(args.query, sessionId).catch((e: unknown) => {
      logger.warn({ err: e }, 'Failed to enqueue search event');
    });

    const total_ms = Date.now() - t0;
    logger.info({ sessionId, total_ms, resultCount: results.length }, 'search_tools complete');

    const formattedResults = formatResults(results, is_two_option);
    const nonIndexedGuidance = buildNonIndexedGuidance(formattedResults, args.query);
    const credibilityWarning = buildLowCredibilityWarning(formattedResults);

    return okResult({
      query_id: sessionId,
      status: 'complete',
      stage: 4,
      results: formattedResults,
      is_two_option,
      timing: { stage1_ms: stage1.elapsed_ms, stage2_ms, stage3_ms, stage4_ms, total_ms },
      ...(nonIndexedGuidance ? { non_indexed_guidance: nonIndexedGuidance } : {}),
      ...(credibilityWarning ? { credibility_warning: credibilityWarning } : {}),
    });
  } catch (e) {
    logger.error({ err: e, query: args.query }, 'search_tools failed');
    return errResult('search_error', e instanceof Error ? e.message : String(e));
  }
}
