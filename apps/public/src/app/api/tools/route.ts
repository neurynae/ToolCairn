import { MemgraphToolRepository } from '@toolpilot/graph';
import { NextResponse } from 'next/server';
import pino from 'pino';
import { z } from 'zod';

const logger = pino({ name: '@toolpilot/public:api-tools' });
const repo = new MemgraphToolRepository();

// Our UI category slugs — the graph stores raw GitHub topics in t.category,
// so these may not match directly. We search both t.category AND t.topics.
const ALL_CATEGORIES = [
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
] as const;

type CategorySlug = (typeof ALL_CATEGORIES)[number];

// Map our UI slugs to related topic keywords so topic-based search works
const CATEGORY_TOPIC_MAP: Record<CategorySlug, string[]> = {
  'vector-database': ['vector-database', 'vector-search', 'vector-search-engine', 'embeddings-similarity', 'similarity-search'],
  'graph-database': ['graph-database', 'graph', 'neo4j', 'knowledge-graph'],
  'relational-database': ['database', 'sql', 'postgresql', 'mysql', 'sqlite', 'orm', 'relational-database'],
  'llm-framework': ['llm', 'large-language-model', 'openai', 'anthropic', 'llm-framework', 'ai', 'chatgpt'],
  'agent-framework': ['agent', 'agents', 'multi-agent', 'ai-agent', 'rag'],
  'web-framework': ['web-framework', 'http', 'express', 'fastify', 'hono', 'koa', 'nestjs'],
  auth: ['auth', 'authentication', 'authorization', 'oauth', 'jwt', 'identity'],
  testing: ['testing', 'test', 'jest', 'vitest', 'playwright', 'e2e'],
  devops: ['devops', 'ci-cd', 'docker', 'kubernetes', 'automation'],
  'mcp-server': ['mcp', 'mcp-server', 'model-context-protocol'],
  queue: ['queue', 'message-queue', 'redis', 'kafka', 'rabbitmq', 'background-jobs'],
  cache: ['cache', 'caching', 'redis', 'memcached'],
  search: ['search', 'full-text-search', 'elasticsearch', 'typesense', 'meilisearch'],
  embedding: ['embeddings', 'embedding', 'sentence-transformers', 'nomic', 'semantic-search'],
  monitoring: ['monitoring', 'observability', 'logging', 'tracing', 'metrics', 'opentelemetry'],
  other: ['other'],
};

const ListToolsSchema = z.object({
  category: z
    .string()
    .refine((v) => (ALL_CATEGORIES as ReadonlyArray<string>).includes(v), { message: 'Invalid tool category' })
    .optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const parsed = ListToolsSchema.safeParse({
      category: searchParams.get('category') ?? undefined,
      limit: searchParams.get('limit') ?? undefined,
      offset: searchParams.get('offset') ?? undefined,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: 'validation_error', message: parsed.error.issues[0]?.message ?? 'Invalid input' },
        { status: 400 },
      );
    }

    const { category, limit, offset } = parsed.data;

    let allTools: Awaited<ReturnType<typeof repo.findByCategory>>['data'] & object[] = [];

    if (category) {
      const slug = category as CategorySlug;

      // 1. Try exact category match first
      const exactResult = await repo.findByCategory(slug);
      if (exactResult.ok && exactResult.data.length > 0) {
        allTools = exactResult.data;
      } else {
        // 2. Fall back to topics-based Cypher search
        const topics = CATEGORY_TOPIC_MAP[slug] ?? [slug];
        const topicsResult = await repo.findByTopics(topics);
        if (topicsResult.ok) {
          allTools = topicsResult.data;
        } else {
          logger.warn({ category, err: topicsResult.error }, 'topics fallback failed');
        }
      }
    } else {
      // No category — return all tools across all our categories
      const allResult = await repo.findByCategories(Array.from(ALL_CATEGORIES));
      if (allResult.ok) allTools = allResult.data;
    }

    if (!allTools) {
      return NextResponse.json({ ok: true, data: { tools: [], total: 0 } });
    }

    const sorted = allTools.sort((a, b) => b.health.maintenance_score - a.health.maintenance_score);
    const total = sorted.length;
    const paged = sorted.slice(offset, offset + limit);

    const tools = paged.map((t) => ({
      name: t.name,
      display_name: t.display_name,
      description: t.description,
      category: t.category,
      github_url: t.github_url,
      maintenance_score: t.health.maintenance_score,
      stars: t.health.stars,
      language: t.language,
      license: t.license,
    }));

    logger.info({ category: category ?? 'all', total, returned: tools.length }, 'list tools complete');
    return NextResponse.json({ ok: true, data: { tools, total } });
  } catch (e) {
    logger.error({ err: e }, 'list tools failed');
    return NextResponse.json(
      { ok: false, error: 'internal_error', message: e instanceof Error ? e.message : String(e) },
      { status: 500 },
    );
  }
}
