import type { ToolNode } from '@toolpilot/core';
import { COLLECTION_NAME, qdrantClient } from '@toolpilot/vector';
import pino from 'pino';
import { ClarificationEngine } from './clarification/engine.js';
import type { SearchSessionManager } from './session.js';
import { stage1HybridSearch } from './stages/stage1-hybrid.js';
import { stage2ApplyFilters } from './stages/stage2-filters.js';
import { stage3GraphRerank } from './stages/stage3-graph.js';
import { stage4Select } from './stages/stage4-select.js';
import type {
  SearchContext,
  SearchPipelineInput,
  SearchPipelineResult,
  ToolScoredResult,
} from './types.js';

const logger = pino({ name: '@toolpilot/search:pipeline' });

export interface RunStages2to4Result {
  results: ToolScoredResult[];
  is_two_option: boolean;
  stage2_ms: number;
  stage3_ms: number;
  stage4_ms: number;
}

export class SearchPipeline {
  private readonly clarificationEngine = new ClarificationEngine();

  constructor(private readonly sessionManager: SearchSessionManager) {}

  async run(input: SearchPipelineInput): Promise<SearchPipelineResult> {
    const t0 = Date.now();
    const { query, sessionId, context } = input;

    await this.sessionManager.touchSession(sessionId);

    // Load tool corpus from Qdrant (full payloads stored at index time)
    const allTools = await this.loadToolCorpus();

    logger.debug({ sessionId, query, toolCount: allTools.length }, 'Pipeline run started');

    // Stage 1 — hybrid retrieval
    const stage1 = await stage1HybridSearch(query, allTools);
    logger.debug({ elapsed_ms: stage1.elapsed_ms, count: stage1.ids.length }, 'Stage 1 complete');

    // Stage 2 — payload filters
    const stage2 = await stage2ApplyFilters(stage1.ids, context);
    logger.debug({ elapsed_ms: stage2.elapsed_ms, count: stage2.hits.length }, 'Stage 2 complete');

    // Stage 3 — graph re-ranking
    const stage3 = await stage3GraphRerank(stage2);
    logger.debug(
      { elapsed_ms: stage3.elapsed_ms, count: stage3.results.length },
      'Stage 3 complete',
    );

    // Stage 4 — precision selection
    const stage4 = stage4Select(stage3);
    logger.debug(
      { elapsed_ms: stage4.elapsed_ms, is_two_option: stage4.is_two_option },
      'Stage 4 complete',
    );

    const total_ms = Date.now() - t0;
    logger.info({ sessionId, total_ms, is_two_option: stage4.is_two_option }, 'Pipeline complete');

    const result: SearchPipelineResult = {
      sessionId,
      query,
      results: stage4.results,
      is_two_option: stage4.is_two_option,
      stage1_ms: stage1.elapsed_ms,
      stage2_ms: stage2.elapsed_ms,
      stage3_ms: stage3.elapsed_ms,
      stage4_ms: stage4.elapsed_ms,
      total_ms,
    };

    await this.sessionManager.saveResults(sessionId, result);
    return result;
  }

  /**
   * Run stages 2–4 against a pre-computed set of candidate IDs (from Stage 1).
   * Used by search_tools_respond so it doesn't re-run Stage 1 after clarification.
   */
  async runStages2to4(
    candidateIds: string[],
    context: SearchContext | undefined,
    sessionId: string,
  ): Promise<RunStages2to4Result> {
    const stage2 = await stage2ApplyFilters(candidateIds, context);
    const stage3 = await stage3GraphRerank(stage2);
    const stage4 = stage4Select(stage3);
    await this.sessionManager.saveResults(sessionId, stage4.results);
    return {
      results: stage4.results,
      is_two_option: stage4.is_two_option,
      stage2_ms: stage2.elapsed_ms,
      stage3_ms: stage3.elapsed_ms,
      stage4_ms: stage4.elapsed_ms,
    };
  }

  /**
   * Load the full tool corpus from Qdrant (payload stored at index time).
   * Public so callers (e.g. search_tools handler) can build the BM25 index themselves.
   */
  async loadToolCorpus(): Promise<ToolNode[]> {
    const { points } = await qdrantClient().scroll(COLLECTION_NAME, {
      limit: 10_000,
      with_payload: true,
      with_vector: false,
    });
    return (points as Array<{ payload: Record<string, unknown> | null }>)
      .filter((p) => p.payload != null)
      .map((p) => p.payload as unknown as ToolNode);
  }
}
