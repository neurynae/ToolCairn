import { getMemgraphSession } from '@toolpilot/graph';
import neo4j from 'neo4j-driver';
import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { withProxyGet } from '@/lib/admin/api-proxy';

const QuerySchema = z.object({
  search: z.string().default(''),
  category: z.string().default(''),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(30),
});

const GET_TOOLS_PAGINATED = `
MATCH (t:Tool)
WHERE ($category = '' OR t.category = $category)
  AND ($search = '' OR toLower(t.name) CONTAINS toLower($search)
       OR toLower(coalesce(t.display_name, '')) CONTAINS toLower($search))
RETURN
  t.id AS id,
  t.name AS name,
  t.display_name AS displayName,
  t.category AS category,
  t.language AS language,
  t.github_url AS githubUrl,
  t.health_maintenance_score AS maintenanceScore,
  t.health_stars AS stars,
  t.health_stars_velocity_90d AS starsVelocity90d,
  t.health_last_commit_date AS lastCommitDate,
  t.health_contributor_count AS contributorCount
ORDER BY t.health_maintenance_score DESC
SKIP $skip LIMIT $limit
`;

const GET_TOOLS_COUNT = `
MATCH (t:Tool)
WHERE ($category = '' OR t.category = $category)
  AND ($search = '' OR toLower(t.name) CONTAINS toLower($search)
       OR toLower(coalesce(t.display_name, '')) CONTAINS toLower($search))
RETURN count(t) AS total
`;

function toNum(val: unknown): number {
  if (val == null) return 0;
  if (typeof val === 'number') return val;
  if (typeof val === 'object' && typeof (val as Record<string, unknown>).toNumber === 'function') {
    return (val as { toNumber(): number }).toNumber();
  }
  return Number(val) || 0;
}

async function directGET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = request.nextUrl;
  const parsed = QuerySchema.safeParse(Object.fromEntries(searchParams));

  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: parsed.error.flatten() }, { status: 400 });
  }

  const { search, category, page, pageSize } = parsed.data;
  const skip = (page - 1) * pageSize;

  const session = getMemgraphSession();
  try {
    // Sequential — Memgraph sessions don't support parallel queries
    const countResult = await session.run(GET_TOOLS_COUNT, { search, category });
    const total = toNum(countResult.records[0]?.get('total'));

    const toolsResult = await session.run(GET_TOOLS_PAGINATED, {
      search,
      category,
      skip: neo4j.int(skip),
      limit: neo4j.int(pageSize),
    });

    const tools = toolsResult.records.map((r) => ({
      id: r.get('id') as string,
      name: r.get('name') as string,
      displayName: (r.get('displayName') as string | null) ?? (r.get('name') as string),
      category: r.get('category') as string,
      language: (r.get('language') as string | null) ?? '',
      githubUrl: (r.get('githubUrl') as string | null) ?? '',
      maintenanceScore: toNum(r.get('maintenanceScore')),
      stars: toNum(r.get('stars')),
      starsVelocity90d: toNum(r.get('starsVelocity90d')),
      lastCommitDate: (r.get('lastCommitDate') as string | null) ?? '',
      contributorCount: toNum(r.get('contributorCount')),
    }));

    return NextResponse.json({
      ok: true,
      data: { tools, total, page, pageSize, totalPages: Math.ceil(total / pageSize) },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  } finally {
    await session.close();
  }
}

export const GET = withProxyGet('/tools', directGET);
