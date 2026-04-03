import { GET_GRAPH_TOPOLOGY, getMemgraphSession, type TopologyRow } from '@toolpilot/graph';
import neo4j from 'neo4j-driver';
import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { mapTopologyRows } from '@/lib/admin/graph-topology';
import { withProxyGet } from '@/lib/admin/api-proxy';

const QuerySchema = z.object({
  category: z.string().default(''),
  limit: z.coerce.number().int().min(1).max(500).default(200),
});

// Top-N topic nodes (UseCase/Pattern/Stack) to show per graph load
const TOPIC_LIMIT = 40;

const GET_TOOL_TOPIC_EDGES = `
UNWIND $toolIds AS toolId
MATCH (t:Tool {id: toolId})-[e]->(topic)
WHERE topic:UseCase OR topic:Pattern OR topic:Stack
WITH topic.name AS topicId,
     CASE WHEN topic:UseCase THEN 'UseCase'
          WHEN topic:Pattern THEN 'Pattern'
          ELSE 'Stack' END AS topicNodeType,
     collect({toolId: t.id, edgeType: type(e)}) AS edges,
     count(DISTINCT t.id) AS connCount
ORDER BY connCount DESC
LIMIT ${TOPIC_LIMIT}
UNWIND edges AS edge
RETURN edge.toolId AS toolId, topicId, topicNodeType, edge.edgeType AS edgeType
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
  const parsed = QuerySchema.safeParse({
    category: searchParams.get('category') ?? '',
    limit: searchParams.get('limit') ?? 200,
  });

  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: parsed.error.flatten() }, { status: 400 });
  }

  const { category, limit } = parsed.data;
  const session = getMemgraphSession();

  try {
    // Query 1: Tool nodes + Tool-to-Tool edges (sequential — Memgraph sessions don't support parallel)
    const toolResult = await session.run(GET_GRAPH_TOPOLOGY.text, {
      category,
      nodeLimit: neo4j.int(limit),
    });

    const rows: TopologyRow[] = toolResult.records.map((r) => ({
      sourceId: r.get('sourceId') as string,
      sourceName: r.get('sourceName') as string,
      sourceDisplayName: r.get('sourceDisplayName') as string,
      sourceCategory: r.get('sourceCategory') as string,
      sourceMaintenanceScore: toNum(r.get('sourceMaintenanceScore')),
      sourceStars: toNum(r.get('sourceStars')),
      targetId: r.get('targetId') as string | null,
      edgeType: r.get('edgeType') as string | null,
      baseWeight: r.get('baseWeight') as number | null,
      effectiveWeight: r.get('effectiveWeight') as number | null,
      confidence: r.get('confidence') as number | null,
      edgeSource: r.get('edgeSource') as string | null,
    }));

    // Query 2: Topic nodes (UseCase/Pattern/Stack) connected to the loaded tools
    const toolIds = [...new Set(rows.map((r) => r.sourceId))];
    const topicEdges: Array<{
      toolId: string;
      topicId: string;
      topicNodeType: string;
      edgeType: string;
    }> = [];

    if (toolIds.length > 0) {
      const topicResult = await session.run(GET_TOOL_TOPIC_EDGES, { toolIds });
      for (const rec of topicResult.records) {
        topicEdges.push({
          toolId: rec.get('toolId') as string,
          topicId: rec.get('topicId') as string,
          topicNodeType: rec.get('topicNodeType') as string,
          edgeType: rec.get('edgeType') as string,
        });
      }
    }

    const topology = mapTopologyRows(rows, topicEdges);
    return NextResponse.json({ ok: true, data: topology });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  } finally {
    await session.close();
  }
}

export const GET = withProxyGet('/graph', directGET);
