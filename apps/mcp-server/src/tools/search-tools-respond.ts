import { PrismaClient } from '@toolpilot/db';
import { ClarificationEngine, SearchPipeline, SearchSessionManager } from '@toolpilot/search';
import pino from 'pino';
import { errResult, okResult } from '../utils.js';
import {
  buildLowCredibilityWarning,
  buildNonIndexedGuidance,
  formatResults,
} from './format-results.js';

const logger = pino({ name: '@toolpilot/mcp-server:search-tools-respond' });
const prisma = new PrismaClient();
const sessionManager = new SearchSessionManager(prisma);
const pipeline = new SearchPipeline(sessionManager);
const _clarificationEngine = new ClarificationEngine();

export async function handleSearchToolsRespond(args: {
  query_id: string;
  answers: Array<{ dimension: string; value: string }>;
}) {
  try {
    const session = await sessionManager.getSession(args.query_id);
    if (!session) {
      return errResult('session_not_found', `No session found for query_id: ${args.query_id}`);
    }

    logger.info(
      { sessionId: args.query_id, answerCount: args.answers.length },
      'search_tools_respond called',
    );

    // Load saved Stage 1 candidates
    const candidateIds = await sessionManager.getCandidates(args.query_id);
    if (candidateIds.length === 0) {
      return errResult(
        'no_candidates',
        'No saved candidates for this session. Call search_tools first.',
      );
    }

    // Build updated context from clarification answers
    const filterUpdates: Record<string, string> = {};
    for (const answer of args.answers) {
      filterUpdates[answer.dimension] = answer.value;
    }
    const prevContext = (session.context as Record<string, unknown> | null) ?? {};
    const updatedContext = {
      ...prevContext, // preserve stage1_ids and any other session fields
      filters: {
        ...((prevContext.filters as Record<string, unknown>) ?? {}),
        ...filterUpdates,
      },
    };
    await sessionManager.updateContext(args.query_id, updatedContext);
    await sessionManager.appendClarification(args.query_id, [], args.answers);

    // Run stages 2-4 with saved candidates + updated context filters
    const { results, is_two_option } = await pipeline.runStages2to4(
      candidateIds,
      updatedContext,
      args.query_id,
    );

    logger.info(
      { sessionId: args.query_id, resultCount: results.length },
      'search_tools_respond complete',
    );

    const sessionForQuery = await sessionManager.getSession(args.query_id);
    const originalQuery = (sessionForQuery?.query as string) ?? '';
    const formattedResults = formatResults(results, is_two_option);
    const nonIndexedGuidance = buildNonIndexedGuidance(formattedResults, originalQuery);
    const credibilityWarning = buildLowCredibilityWarning(formattedResults);

    return okResult({
      done: true,
      query_id: args.query_id,
      status: 'complete',
      stage: 4,
      results: formattedResults,
      is_two_option,
      ...(nonIndexedGuidance ? { non_indexed_guidance: nonIndexedGuidance } : {}),
      ...(credibilityWarning ? { credibility_warning: credibilityWarning } : {}),
    });
  } catch (e) {
    logger.error({ err: e, query_id: args.query_id }, 'search_tools_respond failed');
    return errResult('search_error', e instanceof Error ? e.message : String(e));
  }
}
