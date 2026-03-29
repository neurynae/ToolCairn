import type { ToolNode } from '@toolpilot/core';
import { COLLECTION_NAME, qdrantClient } from '@toolpilot/vector';
import pino from 'pino';
import type { SearchContext, Stage2Result } from '../types.js';

const logger = pino({ name: '@toolpilot/search:stage2' });
const STAGE2_LIMIT = 15;

/**
 * Apply Qdrant payload filters from clarification context.
 * Filterable fields: category, deployment_model, language, license.
 *
 * Graceful degradation: if the full filter set returns 0 results,
 * progressively drop the most restrictive filters (language, license)
 * and retry — matching the ClarificationEngine's fallback behaviour.
 */
export async function stage2ApplyFilters(
  candidateIds: string[],
  context: SearchContext | undefined,
): Promise<Stage2Result> {
  const t0 = Date.now();

  // Try full filters first
  const hits = await scrollWithFilter(candidateIds, context);

  if (hits.length > 0) {
    return { hits, elapsed_ms: Date.now() - t0 };
  }

  // Graceful degradation: drop language + license, keep category + deployment
  if (context?.filters) {
    const relaxed = { ...context, filters: { ...context.filters } } as SearchContext;
    const filters = relaxed.filters as Record<string, unknown>;
    delete filters.language;
    delete filters.license;

    logger.info({ candidateIds: candidateIds.length }, 'stage2 relaxing filters (dropped language + license)');
    const relaxedHits = await scrollWithFilter(candidateIds, relaxed);

    if (relaxedHits.length > 0) {
      return { hits: relaxedHits, elapsed_ms: Date.now() - t0 };
    }
  }

  // Final fallback: only has_id, no payload filters
  logger.info({ candidateIds: candidateIds.length }, 'stage2 falling back to has_id only');
  const fallbackHits = await scrollWithFilter(candidateIds, undefined);
  return { hits: fallbackHits, elapsed_ms: Date.now() - t0 };
}

async function scrollWithFilter(
  candidateIds: string[],
  context: SearchContext | undefined,
): Promise<Array<{ tool: ToolNode; score: number }>> {
  const filter = buildQdrantFilter(candidateIds, context);

  const { points } = await qdrantClient().scroll(COLLECTION_NAME, {
    filter,
    limit: STAGE2_LIMIT,
    with_payload: true,
    with_vector: false,
  });

  return (points as Array<{ id: string | number; payload: Record<string, unknown> | null }>)
    .filter((p) => p.payload != null)
    .map((p, idx) => ({
      tool: p.payload as unknown as ToolNode,
      score: 1 / (idx + 1),
    }));
}

function buildQdrantFilter(
  candidateIds: string[],
  context: SearchContext | undefined,
): Record<string, unknown> {
  const must: unknown[] = [{ has_id: candidateIds }];

  if (context?.filters) {
    const { category, deployment_model, language, license } = context.filters as Record<
      string,
      string | undefined
    >;

    if (category) {
      must.push({ key: 'category', match: { value: category } });
    }
    if (deployment_model) {
      must.push({ key: 'deployment_models', match: { any: [deployment_model] } });
    }
    if (language) {
      // Match against the languages array (SDK/client languages) not just the primary language
      must.push({
        should: [
          { key: 'language', match: { value: language } },
          { key: 'languages', match: { any: [language] } },
        ],
      });
    }
    if (license) {
      must.push({ key: 'license', match: { value: license } });
    }
  }

  return { must };
}
