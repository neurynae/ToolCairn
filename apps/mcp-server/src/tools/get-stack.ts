import type { ToolNode } from '@toolpilot/core';
import { MemgraphToolRepository } from '@toolpilot/graph';
import pino from 'pino';
import { errResult, okResult } from '../utils.js';

const logger = pino({ name: '@toolcairn/mcp-server:get-stack' });
const toolRepo = new MemgraphToolRepository();

/**
 * Detect if a use_case string mentions multiple distinct needs.
 * Maps need-name to list of indicator keywords (all lowercase).
 */
const NEED_KEYWORDS: Record<string, string[]> = {
  auth: ['auth', 'authentication', 'authorization', 'login', 'jwt', 'oauth', 'session'],
  database: ['database', 'db', 'sql', 'orm', 'data', 'storage', 'postgres', 'mysql'],
  queue: ['queue', 'job', 'background', 'worker', 'task', 'cron', 'schedule', 'message'],
  cache: ['cache', 'caching', 'redis', 'memcache', 'fast'],
  search: ['search', 'fulltext', 'index', 'elasticsearch', 'typesense'],
  monitoring: ['monitor', 'log', 'trace', 'metric', 'observ'],
  testing: ['test', 'spec', 'e2e', 'unit'],
  realtime: ['realtime', 'websocket', 'socket', 'live', 'push'],
};

/** Stop-words to exclude from keyword extraction */
const STOP_WORDS = new Set([
  'a',
  'an',
  'the',
  'for',
  'to',
  'of',
  'in',
  'on',
  'at',
  'by',
  'i',
  'is',
  'it',
  'be',
  'as',
  'do',
  'so',
  'or',
  'and',
  'but',
  'not',
  'with',
  'that',
  'this',
  'from',
  'use',
  'need',
  'want',
  'build',
  'my',
  'me',
  'we',
  'our',
]);

/**
 * Split a use_case string into meaningful lowercase keywords,
 * removing punctuation, stop-words, and words under 3 characters.
 */
function extractKeywords(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[\s,./\-+:;!?()[\]{}|'"]+/)
    .filter((w) => w.length >= 3 && !STOP_WORDS.has(w));
}

/** Deduplicate ToolNode array by name, keeping first occurrence */
function deduplicateByName(tools: ToolNode[]): ToolNode[] {
  const seen = new Set<string>();
  return tools.filter((t) => {
    if (seen.has(t.name)) return false;
    seen.add(t.name);
    return true;
  });
}

export async function handleGetStack(args: {
  use_case: string;
  constraints?: {
    deployment_model?: 'self-hosted' | 'cloud' | 'embedded' | 'serverless';
    language?: string;
    license?: string;
  };
  limit: number;
}) {
  try {
    const { use_case, constraints, limit } = args;
    const lcUseCase = use_case.toLowerCase();

    // Step 1: Detect distinct needs (multi-branch composition)
    const detectedNeeds = Object.entries(NEED_KEYWORDS)
      .filter(([, keywords]) => keywords.some((k) => lcUseCase.includes(k)))
      .map(([need]) => need);

    logger.debug({ use_case, detectedNeeds }, 'Detected needs from use_case');

    let rawTools: ToolNode[] = [];

    if (detectedNeeds.length > 1) {
      // Multi-branch: get top tools per detected need, then merge
      logger.debug({ detectedNeeds }, 'Multi-branch composition');

      const branchResults = await Promise.all(
        detectedNeeds.map((need) => toolRepo.findByUseCases([need], 3)),
      );

      const allBranchTools = branchResults.flatMap((r) => (r.ok ? r.data : []));
      rawTools = deduplicateByName(allBranchTools);

      // If too few results, supplement with a general keyword search
      if (rawTools.length < 3) {
        const keywords = extractKeywords(use_case);
        const supplementResult = await toolRepo.findByUseCases(keywords, limit * 2);
        if (supplementResult.ok) {
          rawTools = deduplicateByName([...rawTools, ...supplementResult.data]);
        }
      }
    } else {
      // Single need: general keyword extraction
      const keywords =
        detectedNeeds.length === 1 ? [detectedNeeds[0] as string] : extractKeywords(use_case);

      logger.debug({ keywords }, 'Single-need keyword search');

      const graphResult = await toolRepo.findByUseCases(keywords, limit * 3);

      if (!graphResult.ok) {
        logger.error({ err: graphResult.error, use_case }, 'get_stack findByUseCases failed');
        return errResult('db_error', graphResult.error.message);
      }

      rawTools = graphResult.data;

      // Fallback: if graph returns fewer than 3 results, supplement with 'other' category
      if (rawTools.length < 3) {
        logger.debug({ count: rawTools.length }, 'Sparse graph results, falling back to category');
        const fallbackResult = await toolRepo.findByCategories(['other']);
        if (fallbackResult.ok) {
          rawTools = deduplicateByName([...rawTools, ...fallbackResult.data]);
        }
      }
    }

    // Step 2: Apply constraints
    let tools = rawTools;
    if (constraints) {
      if (constraints.deployment_model) {
        const dm = constraints.deployment_model;
        tools = tools.filter((t) => t.deployment_models.includes(dm));
      }
      if (constraints.language) {
        const lang = constraints.language;
        tools = tools.filter((t) => t.language === lang);
      }
      if (constraints.license) {
        const lic = constraints.license;
        tools = tools.filter((t) => t.license === lic);
      }
    }

    // Step 3: Sort by maintenance_score, take top `limit`
    const results = tools
      .sort((a, b) => b.health.maintenance_score - a.health.maintenance_score)
      .slice(0, limit)
      .map((t) => ({
        name: t.name,
        display_name: t.display_name,
        description: t.description,
        category: t.category,
        github_url: t.github_url,
        maintenance_score: t.health.maintenance_score,
      }));

    logger.info({ use_case, detectedNeeds, resultCount: results.length }, 'get_stack complete');
    return okResult({ use_case, tools: results });
  } catch (e) {
    logger.error({ err: e }, 'get_stack threw');
    return errResult('internal_error', e instanceof Error ? e.message : String(e));
  }
}
