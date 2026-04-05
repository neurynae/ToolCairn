import { PrismaClient } from '@toolpilot/db';
import { ClarificationEngine, SearchPipeline, SearchSessionManager } from '@toolpilot/search';
import pino from 'pino';
import { errResult, okResult } from '../utils.js';
import {
  buildLowCredibilityWarning,
  buildNonIndexedGuidance,
  formatResults,
} from './format-results.js';

const logger = pino({ name: '@toolcairn/mcp-server:search-tools-respond' });
const prisma = new PrismaClient();
const sessionManager = new SearchSessionManager(prisma);
const pipeline = new SearchPipeline(sessionManager);
const clarificationEngine = new ClarificationEngine();

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

    // Get all dimensions asked so far (including this round's answers)
    const allAskedDimensions = await sessionManager.getAskedDimensions(args.query_id);

    // Check if another clarification round is warranted (max 3 rounds)
    if (allAskedDimensions.size < 3) {
      // Filter corpus by the answers just given to produce an updated candidate set
      const corpus = await pipeline.loadToolCorpus();
      const idSet = new Set(candidateIds);
      const candidateTools = corpus.filter((t) => idSet.has(t.id));
      const filteredCandidates = clarificationEngine.applyAnswers(candidateTools, args.answers);

      const nextQuestions = clarificationEngine.getClarification(
        filteredCandidates,
        allAskedDimensions,
      );

      if (nextQuestions.length > 0) {
        // Persist the questions (no answers yet) for this upcoming round
        await sessionManager.appendClarification(args.query_id, nextQuestions, []);

        const clarificationRound = allAskedDimensions.size + 1;
        logger.info(
          {
            sessionId: args.query_id,
            clarificationRound,
            questionCount: nextQuestions.length,
          },
          'search_tools_respond: next clarification round',
        );

        return okResult({
          done: false,
          query_id: args.query_id,
          status: 'clarification_needed',
          stage: 2,
          clarification_round: clarificationRound,
          questions: nextQuestions,
        });
      }
    }

    // No more clarification needed — run stages 2-4 with saved candidates + updated context filters
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
