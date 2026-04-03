import type { ToolNode } from '@toolpilot/core';
import pino from 'pino';
import type { ToolDeps } from '../types.js';
import { errResult, okResult } from '../utils.js';

const logger = pino({ name: '@toolpilot/tools:get-stack' });

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

function extractKeywords(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[\s,./\-+:;!?()[\]{}|'"]+/)
    .filter((w) => w.length >= 3 && !STOP_WORDS.has(w));
}

function deduplicateByName(tools: ToolNode[]): ToolNode[] {
  const seen = new Set<string>();
  return tools.filter((t) => {
    if (seen.has(t.name)) return false;
    seen.add(t.name);
    return true;
  });
}

export function createGetStackHandler(deps: Pick<ToolDeps, 'graphRepo'>) {
  return async function handleGetStack(args: {
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

      const detectedNeeds = Object.entries(NEED_KEYWORDS)
        .filter(([, keywords]) => keywords.some((k) => lcUseCase.includes(k)))
        .map(([need]) => need);

      logger.debug({ use_case, detectedNeeds }, 'Detected needs from use_case');

      let rawTools: ToolNode[] = [];

      if (detectedNeeds.length > 1) {
        const branchResults = await Promise.all(
          detectedNeeds.map((need) => deps.graphRepo.findByUseCases([need], 3)),
        );
        const allBranchTools = branchResults.flatMap((r) => (r.ok ? r.data : []));
        rawTools = deduplicateByName(allBranchTools);
        if (rawTools.length < 3) {
          const keywords = extractKeywords(use_case);
          const supplementResult = await deps.graphRepo.findByUseCases(keywords, limit * 2);
          if (supplementResult.ok) {
            rawTools = deduplicateByName([...rawTools, ...supplementResult.data]);
          }
        }
      } else {
        const keywords =
          detectedNeeds.length === 1 ? [detectedNeeds[0] as string] : extractKeywords(use_case);
        const graphResult = await deps.graphRepo.findByUseCases(keywords, limit * 3);
        if (!graphResult.ok) {
          return errResult('db_error', graphResult.error.message);
        }
        rawTools = graphResult.data;
        if (rawTools.length < 3) {
          const fallbackResult = await deps.graphRepo.findByCategories(['other']);
          if (fallbackResult.ok) {
            rawTools = deduplicateByName([...rawTools, ...fallbackResult.data]);
          }
        }
      }

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
  };
}
