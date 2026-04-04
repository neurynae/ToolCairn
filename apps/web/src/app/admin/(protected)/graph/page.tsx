import neo4j from 'neo4j-driver';
import { GET_GRAPH_TOPOLOGY, getMemgraphSession, type TopologyRow } from '@toolpilot/graph';
import { GraphCanvasLoader } from '@/components/admin/graph/graph-canvas-loader';
import type { GraphTopologyResult, TopicEdge } from '@/lib/admin/graph-topology';
import { mapTopologyRows } from '@/lib/admin/graph-topology';
import { PageHeader } from '@/components/admin/page-header';
import { Button } from '@/components/ui/button';
import { PROXY_ENABLED, proxyGet } from '@/lib/admin/api-proxy';

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

async function fetchTopology(): Promise<GraphTopologyResult> {
  const session = getMemgraphSession();
  try {
    const result = await session.run(GET_GRAPH_TOPOLOGY.text, {
      category: '',
      nodeLimit: neo4j.int(200),
    });

    const rows: TopologyRow[] = result.records.map((r) => ({
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

    const toolIds = [...new Set(rows.map((r) => r.sourceId))];
    const topicEdges: TopicEdge[] = [];

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

    return mapTopologyRows(rows, topicEdges);
  } finally {
    await session.close();
  }
}

async function fetchTopologyViaProxy(): Promise<GraphTopologyResult> {
  const res = await proxyGet('/graph', new URLSearchParams({ limit: '200' }));
  // apps/api now returns { rows: TopologyRow[], topicEdges: TopicEdge[] }
  const json = (await res.json()) as {
    ok: boolean;
    data?: { rows: TopologyRow[]; topicEdges: TopicEdge[] };
    error?: string;
  };
  if (!json.ok || !json.data) throw new Error(json.error ?? 'Graph API error');
  return mapTopologyRows(json.data.rows, json.data.topicEdges);
}

export default async function GraphPage() {
  let initialData: GraphTopologyResult;

  try {
    initialData = PROXY_ENABLED ? await fetchTopologyViaProxy() : await fetchTopology();
  } catch {
    initialData = { nodes: [], edges: [], stats: { totalNodes: 0, totalEdges: 0, categories: [] } };
  }

  return (
    <>
      <PageHeader
        title="Graph Mesh"
        description={`${initialData.stats.totalNodes} nodes · ${initialData.stats.totalEdges} edges — hover to inspect, drag to rotate`}
        actions={
          <Button render={<a href="/admin/graph/edges" />} size="sm" variant="outline">
            Browse Edges
          </Button>
        }
      />
      <div className="flex-1 min-h-0 rounded-lg border border-border overflow-hidden" style={{ height: 'calc(100vh - 200px)' }}>
        <GraphCanvasLoader initialData={initialData} />
      </div>
    </>
  );
}
