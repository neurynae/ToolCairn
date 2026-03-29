import type { ToolCategory } from '@toolpilot/core';
import { MemgraphToolRepository } from '@toolpilot/graph';
import pino from 'pino';
import { errResult, okResult } from '../utils.js';

const logger = pino({ name: '@toolpilot/mcp-server:get-stack' });
const repo = new MemgraphToolRepository();

/** Map natural-language use_case to one or more ToolCategory values. */
function resolveCategories(useCase: string): ToolCategory[] {
  const lc = useCase.toLowerCase();

  // Check for direct slug match first (e.g. "web-framework")
  const allCategories: ToolCategory[] = [
    'vector-database',
    'graph-database',
    'relational-database',
    'llm-framework',
    'agent-framework',
    'web-framework',
    'auth',
    'testing',
    'devops',
    'mcp-server',
    'queue',
    'cache',
    'search',
    'embedding',
    'monitoring',
    'other',
  ];
  const slug = lc.replace(/\s+/g, '-');
  if ((allCategories as string[]).includes(slug)) return [slug as ToolCategory];

  // Fuzzy keyword mapping
  if (/web|http|server|api|rest|express|fastify|hono|koa|nest/.test(lc)) return ['web-framework'];
  if (/database|db/.test(lc)) return ['relational-database', 'vector-database', 'graph-database'];
  if (/relational|sql|postgres|mysql|sqlite/.test(lc)) return ['relational-database'];
  if (/vector|embed|semantic/.test(lc)) return ['vector-database', 'embedding'];
  if (/graph/.test(lc)) return ['graph-database'];
  if (/llm|large.language|openai|anthropic|ai.framework|ml.framework/.test(lc))
    return ['llm-framework', 'agent-framework'];
  if (/agent/.test(lc)) return ['agent-framework'];
  if (/test|spec|unit|vitest|jest|pytest/.test(lc)) return ['testing'];
  if (/auth|oauth|jwt|session|login|identity/.test(lc)) return ['auth'];
  if (/queue|message|stream|kafka|redis.*queue|pub.?sub/.test(lc)) return ['queue'];
  if (/cache|redis|memcache/.test(lc)) return ['cache'];
  if (/search|elasticsearch|typesense|meilisearch/.test(lc)) return ['search'];
  if (/monitor|observ|log|trace|metric|otel/.test(lc)) return ['monitoring'];
  if (/devops|docker|ci.?cd|deploy|k8s|kubernetes/.test(lc)) return ['devops'];
  if (/mcp/.test(lc)) return ['mcp-server'];

  return ['other'];
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
    const categories = resolveCategories(args.use_case);
    logger.debug({ use_case: args.use_case, categories }, 'Resolved categories');

    const categoryResult = await repo.findByCategories(categories);

    if (!categoryResult.ok) {
      logger.error({ err: categoryResult.error, use_case: args.use_case }, 'get_stack failed');
      return errResult('db_error', categoryResult.error.message);
    }

    let tools = categoryResult.data;

    // Apply constraints
    const { constraints, limit } = args;
    if (constraints) {
      if (constraints.deployment_model) {
        tools = tools.filter((t) =>
          t.deployment_models.includes(
            constraints.deployment_model as (typeof t.deployment_models)[0],
          ),
        );
      }
      if (constraints.language) {
        tools = tools.filter((t) => t.language === constraints.language);
      }
      if (constraints.license) {
        tools = tools.filter((t) => t.license === constraints.license);
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

    logger.info(
      { use_case: args.use_case, categories, count: results.length },
      'get_stack complete',
    );
    return okResult({ use_case: args.use_case, tools: results });
  } catch (e) {
    logger.error({ err: e }, 'get_stack threw');
    return errResult('internal_error', e instanceof Error ? e.message : String(e));
  }
}
