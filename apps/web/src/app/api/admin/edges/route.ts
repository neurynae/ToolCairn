import { getMemgraphSession } from '@toolpilot/graph';
import neo4j from 'neo4j-driver';
import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { withProxyGet } from '@/lib/admin/api-proxy';

const QuerySchema = z.object({
  edgeType: z.string().default(''),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(30),
});

const GET_EDGES_PAGINATED = `
MATCH (a:Tool)-[e]->(b:Tool)
WHERE $edgeType = '' OR type(e) = $edgeType
WITH a, b, e,
     e.weight * exp(-e.decay_rate *
       CASE WHEN e.last_verified IS NULL THEN 0
            ELSE (datetime() - datetime(e.last_verified)).day END
     ) AS effectiveWeight
RETURN
  a.id AS sourceId,
  a.name AS sourceName,
  coalesce(a.display_name, a.name) AS sourceDisplayName,
  b.id AS targetId,
  b.name AS targetName,
  coalesce(b.display_name, b.name) AS targetDisplayName,
  type(e) AS edgeType,
  e.weight AS baseWeight,
  effectiveWeight AS effectiveWeight,
  e.confidence AS confidence,
  e.source AS edgeSource,
  e.last_verified AS lastVerified
ORDER BY effectiveWeight DESC
SKIP $skip LIMIT $limit
`;

const GET_EDGES_COUNT = `
MATCH (a:Tool)-[e]->(b:Tool)
WHERE $edgeType = '' OR type(e) = $edgeType
RETURN count(e) AS total
`;

const GET_EDGE_TYPES = `
MATCH ()-[e]->()
RETURN DISTINCT type(e) AS edgeType ORDER BY edgeType
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

  const { edgeType, page, pageSize } = parsed.data;
  const skip = (page - 1) * pageSize;

  const session = getMemgraphSession();
  try {
    const countResult = await session.run(GET_EDGES_COUNT, { edgeType });
    const total = toNum(countResult.records[0]?.get('total'));

    const edgesResult = await session.run(GET_EDGES_PAGINATED, {
      edgeType,
      skip: neo4j.int(skip),
      limit: neo4j.int(pageSize),
    });

    const edgeTypesResult = await session.run(GET_EDGE_TYPES);
    const edgeTypes = edgeTypesResult.records.map((r) => r.get('edgeType') as string);

    const edges = edgesResult.records.map((r) => ({
      sourceId: r.get('sourceId') as string,
      sourceName: r.get('sourceName') as string,
      sourceDisplayName: r.get('sourceDisplayName') as string,
      targetId: r.get('targetId') as string,
      targetName: r.get('targetName') as string,
      targetDisplayName: r.get('targetDisplayName') as string,
      edgeType: r.get('edgeType') as string,
      baseWeight: toNum(r.get('baseWeight')),
      effectiveWeight: toNum(r.get('effectiveWeight')),
      confidence: toNum(r.get('confidence')),
      edgeSource: (r.get('edgeSource') as string | null) ?? '',
      lastVerified: (r.get('lastVerified') as string | null) ?? null,
    }));

    return NextResponse.json({
      ok: true,
      data: { edges, total, page, pageSize, totalPages: Math.ceil(total / pageSize), edgeTypes },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  } finally {
    await session.close();
  }
}

export const GET = withProxyGet('/edges', directGET);
