import type { ToolCategory } from '@toolpilot/core';
import { MemgraphToolRepository } from '@toolpilot/graph';
import { NextResponse } from 'next/server';
import pino from 'pino';
import { z } from 'zod';

const logger = pino({ name: '@toolpilot/public:api-tools' });
const repo = new MemgraphToolRepository();

const ALL_CATEGORIES: ToolCategory[] = [
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

const ListToolsSchema = z.object({
  category: z
    .string()
    .refine((v) => (ALL_CATEGORIES as string[]).includes(v), { message: 'Invalid tool category' })
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

    let toolsResult;
    if (category) {
      toolsResult = await repo.findByCategory(category as ToolCategory);
    } else {
      toolsResult = await repo.findByCategories(ALL_CATEGORIES);
    }

    if (!toolsResult.ok) {
      logger.error({ err: toolsResult.error, category }, 'list tools failed');
      return NextResponse.json(
        { ok: false, error: 'db_error', message: toolsResult.error.message },
        { status: 500 },
      );
    }

    const allTools = toolsResult.data.sort(
      (a, b) => b.health.maintenance_score - a.health.maintenance_score,
    );

    const total = allTools.length;
    const paged = allTools.slice(offset, offset + limit);

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
