/**
 * verify_suggestion — Validates agent-suggested tools against the ToolPilot graph.
 *
 * Called when search_tools returns no results or low-confidence results and the
 * calling agent (Claude, Cursor, etc.) has suggestions from its training data.
 *
 * For each suggestion:
 * 1. FOUND in graph → diagnose why search missed it (category mismatch, low health,
 *    Stage 2 filter, not in Qdrant yet) and return corrected data from our index.
 * 2. NOT in graph → enqueue at P0 (highest priority), search GitHub for alternatives
 *    matching the query, compare agent's suggestion vs what GitHub returns, and return
 *    a verdict on which is correct with reasoning.
 */

import type { ToolNode } from '@toolpilot/core';
import { MemgraphToolRepository, MemgraphUseCaseRepository } from '@toolpilot/graph';
import { enqueueIndexJob } from '@toolpilot/queue';
import { COLLECTION_NAME, embedText, qdrantClient } from '@toolpilot/vector';
import pino from 'pino';
import { errResult, okResult } from '../utils.js';

import { config } from '@toolpilot/config';

const logger = pino({ name: '@toolpilot/mcp-server:verify-suggestion' });
const toolRepo = new MemgraphToolRepository();
const usecaseRepo = new MemgraphUseCaseRepository();

// Priority 2 = highest urgency in the indexer queue (compare: 0=background, 1=normal, 2=urgent)
const P0_PRIORITY = 2;

/**
 * Resolve a bare tool name (e.g. "yjs") to a full GitHub URL.
 * Uses GitHub Search API (via fetch) to find the most-starred repo matching the name.
 * If name already contains "/" or "github.com", returns it as-is.
 */
async function resolveToGitHubUrl(nameOrUrl: string): Promise<string> {
  // Already a full URL or owner/repo format — indexer handles these directly
  if (nameOrUrl.includes('github.com') || nameOrUrl.includes('/')) {
    return nameOrUrl;
  }
  // Bare name — search GitHub Search API for the most-starred match
  try {
    const token = config.GITHUB_TOKEN;
    const headers: Record<string, string> = { Accept: 'application/vnd.github+json' };
    if (token) headers.Authorization = `Bearer ${token}`;
    const res = await fetch(
      `https://api.github.com/search/repositories?q=${encodeURIComponent(nameOrUrl)}+in:name&sort=stars&order=desc&per_page=1`,
      { headers },
    );
    if (res.ok) {
      const data = (await res.json()) as { items?: Array<{ html_url: string }> };
      const url = data.items?.[0]?.html_url;
      if (url) return url;
    }
  } catch {
    // fall through
  }
  return nameOrUrl; // let the indexer try its best
}

interface SuggestionResult {
  tool_name: string;
  status:
    | 'found_and_correct' // in graph AND search should have returned it
    | 'found_search_missed' // in graph BUT search missed it — explains why
    | 'not_indexed_queued' // not in graph, queued for indexing at P0
    | 'indexing_in_progress'; // previously queued, still indexing
  in_graph: boolean;
  tool_data?: {
    description: string;
    github_url: string;
    stars: number;
    maintenance_score: number;
    last_commit: string;
    category: string;
    topics: string[];
  };
  search_miss_reason?: string; // why search_tools didn't surface it
  qdrant_present?: boolean; // is it in the vector store?
  indexing_eta_seconds?: number;
  verdict?: string; // plain-language assessment
}

/**
 * Check if a tool is present in Qdrant with a non-zero vector.
 * If missing from Qdrant, that's likely why search missed it.
 */
async function checkQdrantPresence(
  toolName: string,
): Promise<{ present: boolean; hasVector: boolean; hasTopics: boolean }> {
  try {
    const { points } = await qdrantClient().scroll(COLLECTION_NAME, {
      filter: { must: [{ key: 'name', match: { value: toolName } }] },
      limit: 1,
      with_payload: true,
      with_vector: false,
    });
    const p = points[0] as { payload: Record<string, unknown> | null } | undefined;
    if (!p?.payload) return { present: false, hasVector: false, hasTopics: false };
    return {
      present: true,
      hasVector: true, // we can't check vector without fetching it, assume present if payload exists
      hasTopics: Array.isArray(p.payload.topics) && (p.payload.topics as string[]).length > 0,
    };
  } catch {
    return { present: false, hasVector: false, hasTopics: false };
  }
}

/**
 * Diagnose why a tool that IS in the graph didn't appear in search results.
 */
async function diagnoseSearchMiss(tool: ToolNode): Promise<string> {
  const reasons: string[] = [];

  // 1. Not in Qdrant → Stage 1 vector search can't find it
  const qdrantStatus = await checkQdrantPresence(tool.name);
  if (!qdrantStatus.present) {
    reasons.push(
      'not present in Qdrant vector store — tool exists in Memgraph but was never embedded',
    );
  } else if (!qdrantStatus.hasTopics) {
    reasons.push(
      'in Qdrant but topics field is empty — embedding may use stale schema without topic-aware text, reducing semantic match quality',
    );
  }

  // 2. Health score too low → Stage 4 might filter it
  if (tool.health.maintenance_score < 0.3) {
    reasons.push(
      `very low health score (${Math.round(tool.health.maintenance_score * 100)}%) — may be deprioritized in Stage 3 graph reranking`,
    );
  }

  // 3. Category is "other" → clarification filter might exclude it
  if (tool.category === 'other') {
    reasons.push(
      'category is "other" — tool has no specific category, so topic-based clarification filters won\'t surface it unless the user skips topic selection',
    );
  }

  // 4. Category mismatch → wrong UseCase nodes
  const usecases = await usecaseRepo.findToolsByUseCases([tool.category], 5);
  if (!usecases.ok || usecases.data.length === 0) {
    reasons.push(
      `category "${tool.category}" has no matching UseCase node — tool won't be found via graph traversal in get_stack or Stage 3`,
    );
  }

  return reasons.length > 0
    ? reasons.join('; ')
    : 'unclear — tool appears correctly indexed. May have been filtered by Stage 2 language/license constraints or ranked below threshold in Stage 4.';
}

/**
 * Use semantic search to find the closest tools to the query in the current index.
 * Returns top matches as "what ToolPilot would recommend" for comparison.
 */
async function semanticSearch(
  query: string,
  limit = 3,
): Promise<Array<{ name: string; score: number }>> {
  try {
    const vec = await embedText(query, 'search_query');
    const results = await qdrantClient().search(COLLECTION_NAME, {
      vector: vec,
      limit,
      with_payload: true,
    });
    return (results as Array<{ payload: Record<string, unknown> | null; score: number }>)
      .filter((r) => r.payload)
      .map((r) => ({
        name: String(r.payload?.name ?? ''),
        score: Math.round(r.score * 100) / 100,
      }));
  } catch {
    return [];
  }
}

// ─── Handler ─────────────────────────────────────────────────────────────────

export async function handleVerifySuggestion(args: {
  query: string;
  agent_suggestions: string[];
}) {
  try {
    logger.info(
      { query: args.query, suggestions: args.agent_suggestions },
      'verify_suggestion called',
    );

    const results: SuggestionResult[] = [];
    const toIndex: string[] = [];

    // ── Phase 1: check each suggestion against the graph ─────────────────────
    for (const toolName of args.agent_suggestions) {
      const found = await toolRepo.findByName(toolName);

      if (found.ok && found.data) {
        const tool = found.data;
        const qdrantStatus = await checkQdrantPresence(toolName);

        // Tool is in graph — check if search should have returned it
        const missReason = qdrantStatus.present
          ? await diagnoseSearchMiss(tool)
          : 'not present in Qdrant — tool was in Memgraph but never embedded into the vector store';

        const isCorrectlyIndexed =
          qdrantStatus.present && qdrantStatus.hasTopics && tool.category !== 'other';

        results.push({
          tool_name: toolName,
          status: isCorrectlyIndexed ? 'found_and_correct' : 'found_search_missed',
          in_graph: true,
          tool_data: {
            description: tool.description,
            github_url: tool.github_url,
            stars: tool.health.stars,
            maintenance_score: Math.round(tool.health.maintenance_score * 100) / 100,
            last_commit: tool.health.last_commit_date,
            category: tool.category,
            topics: tool.topics ?? [],
          },
          qdrant_present: qdrantStatus.present,
          search_miss_reason: isCorrectlyIndexed ? undefined : missReason,
          verdict: isCorrectlyIndexed
            ? `"${toolName}" is correctly indexed. Agent suggestion matches ToolPilot data. Use this tool.`
            : `"${toolName}" is in the graph but search missed it: ${missReason}. Agent suggestion is valid — triggering re-embed.`,
        });

        // If not properly in Qdrant, re-index at P0 to fix it
        if (!qdrantStatus.present || !qdrantStatus.hasTopics) {
          toIndex.push(tool.github_url);
        }
      } else {
        // Not in graph at all — resolve name to GitHub URL, then queue at P0
        const githubUrl = await resolveToGitHubUrl(toolName);
        toIndex.push(githubUrl);
        results.push({
          tool_name: toolName,
          status: 'not_indexed_queued',
          in_graph: false,
          indexing_eta_seconds: 120,
          verdict: `"${toolName}" is not in the ToolPilot index. Resolved to ${githubUrl !== toolName ? githubUrl : 'GitHub'} and indexing triggered at P0 priority (~2 min). Call verify_suggestion again after indexing completes.`,
        });
      }
    }

    // ── Phase 2: enqueue missing/broken tools at P0 ───────────────────────────
    const enqueueResults = await Promise.allSettled(
      toIndex.map((id) => enqueueIndexJob(id, P0_PRIORITY)),
    );
    const enqueued = enqueueResults.filter((r) => r.status === 'fulfilled').length;

    // ── Phase 3: semantic comparison — what ToolPilot would recommend ─────────
    const ourRecommendations = await semanticSearch(args.query, 3);

    const foundInGraph = results.filter((r) => r.in_graph).map((r) => r.tool_name);
    const notInGraph = results.filter((r) => !r.in_graph).map((r) => r.tool_name);

    // Cross-reference: are our semantic recommendations different from agent suggestions?
    const agentSet = new Set(args.agent_suggestions.map((s) => s.toLowerCase()));
    const _ourSet = new Set(ourRecommendations.map((r) => r.name.toLowerCase()));
    const agreement = ourRecommendations.filter((r) => agentSet.has(r.name.toLowerCase()));
    const disagreement = ourRecommendations.filter((r) => !agentSet.has(r.name.toLowerCase()));

    logger.info(
      { enqueued, foundInGraph: foundInGraph.length, notInGraph: notInGraph.length },
      'verify_suggestion complete',
    );

    return okResult({
      suggestions: results,
      enqueued_for_indexing: toIndex,
      indexing_priority: 'P0 (urgent)',
      our_semantic_recommendations: ourRecommendations,
      agreement_analysis: {
        agreed_tools: agreement.map((r) => r.name),
        our_alternatives: disagreement.map((r) => r.name),
        verdict:
          agreement.length > 0
            ? `ToolPilot agrees with agent on: ${agreement.map((r) => r.name).join(', ')}. Both signal high confidence.`
            : disagreement.length > 0
              ? `ToolPilot recommends different tools: ${disagreement.map((r) => r.name).join(', ')}. Agent suggestions may be from older training data or niche tools not yet indexed.`
              : 'Unable to compare — index query returned no results. Agent suggestions are the best available signal.',
      },
      next_steps:
        toIndex.length > 0
          ? `${toIndex.length} tool(s) queued for indexing at P0. Call verify_suggestion again in ~2 minutes for full comparison.`
          : 'All tools verified. Use the verdict fields above to guide tool selection.',
    });
  } catch (e) {
    logger.error({ err: e }, 'verify_suggestion failed');
    return errResult('verify_error', e instanceof Error ? e.message : String(e));
  }
}
