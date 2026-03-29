import { GET_GRAPH_TOPOLOGY, getMemgraphSession, type TopologyRow } from '@toolpilot/graph';
import neo4j from 'neo4j-driver';
import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { mapTopologyRows } from '@/lib/admin/graph-topology';

const QuerySchema = z.object({
  category: z.string().default(''),
  limit: z.coerce.number().int().min(1).max(500).default(200),
});

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const parsed = QuerySchema.safeParse({
    category: searchParams.get('category') ?? '',
    limit: searchParams.get('limit') ?? 200,
  });

  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { category, limit } = parsed.data;

  const session = getMemgraphSession();
  try {
    const result = await session.run(GET_GRAPH_TOPOLOGY.text, {
      category,
      nodeLimit: neo4j.int(limit),
    });

    const rows: TopologyRow[] = result.records.map((r) => ({
      sourceId: r.get('sourceId') as string,
      sourceName: r.get('sourceName') as string,
      sourceDisplayName: r.get('sourceDisplayName') as string,
      sourceCategory: r.get('sourceCategory') as string,
      sourceMaintenanceScore: (r.get('sourceMaintenanceScore') as number) ?? 0,
      sourceStars: (r.get('sourceStars') as number) ?? 0,
      targetId: r.get('targetId') as string | null,
      edgeType: r.get('edgeType') as string | null,
      baseWeight: r.get('baseWeight') as number | null,
      effectiveWeight: r.get('effectiveWeight') as number | null,
      confidence: r.get('confidence') as number | null,
      edgeSource: r.get('edgeSource') as string | null,
    }));

    const topology = mapTopologyRows(rows);
    return NextResponse.json({ ok: true, data: topology });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  } finally {
    await session.close();
  }
}
