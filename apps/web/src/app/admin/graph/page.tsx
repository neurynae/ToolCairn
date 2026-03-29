import neo4j from 'neo4j-driver';
import { GET_GRAPH_TOPOLOGY, getMemgraphSession, type TopologyRow } from '@toolpilot/graph';
import { GraphCanvasLoader } from '@/components/admin/graph/graph-canvas-loader';
import type { GraphTopologyResult } from '@/lib/admin/graph-topology';
import { mapTopologyRows } from '@/lib/admin/graph-topology';

/** Convert neo4j Integer objects to plain JS numbers */
function toNum(val: unknown): number {
  if (val == null) return 0;
  if (typeof val === 'number') return val;
  if (typeof val === 'object' && typeof (val as Record<string, unknown>).toNumber === 'function') {
    return (val as { toNumber(): number }).toNumber();
  }
  return Number(val) || 0;
}

function toNumOrNull(val: unknown): number | null {
  if (val == null) return null;
  return toNum(val);
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
      baseWeight: toNumOrNull(r.get('baseWeight')),
      effectiveWeight: toNumOrNull(r.get('effectiveWeight')),
      confidence: toNumOrNull(r.get('confidence')),
      edgeSource: r.get('edgeSource') as string | null,
    }));

    return mapTopologyRows(rows);
  } finally {
    await session.close();
  }
}

export default async function GraphPage() {
  let initialData: GraphTopologyResult;

  try {
    initialData = await fetchTopology();
  } catch {
    initialData = { nodes: [], edges: [], stats: { totalNodes: 0, totalEdges: 0, categories: [] } };
  }

  return (
    <div className="flex flex-col gap-4 h-full">
      <div>
        <h1 className="text-lg font-semibold text-gray-900">Graph Mesh</h1>
        <p className="text-sm text-gray-500">
          Tool nodes and relationship edges — hover an edge to inspect weights.
        </p>
      </div>
      <div className="flex-1 min-h-0">
        <GraphCanvasLoader initialData={initialData} />
      </div>
    </div>
  );
}
