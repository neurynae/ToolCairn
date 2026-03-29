import type { TopologyRow } from '@toolpilot/graph';

// React Flow node/edge types (inline to avoid SSR import of @xyflow/react in server code)
export interface FlowNode {
  id: string;
  type: 'toolNode';
  position: { x: number; y: number };
  data: {
    name: string;
    displayName: string;
    category: string;
    maintenanceScore: number;
    stars: number;
  };
}

export interface FlowEdge {
  id: string;
  source: string;
  target: string;
  type: 'default';
  data: {
    edgeType: string;
    baseWeight: number;
    effectiveWeight: number;
    confidence: number;
    edgeSource: string;
  };
  style: { strokeWidth: number; stroke: string };
  label?: string;
}

export interface GraphTopologyResult {
  nodes: FlowNode[];
  edges: FlowEdge[];
  stats: {
    totalNodes: number;
    totalEdges: number;
    categories: string[];
  };
}

// Category → hue mapping for edge colouring (deterministic)
const CATEGORY_COLORS: Record<string, string> = {
  ai: '#6366f1',
  search: '#0ea5e9',
  database: '#10b981',
  devtools: '#f59e0b',
  monitoring: '#ef4444',
  infra: '#8b5cf6',
  messaging: '#ec4899',
  storage: '#14b8a6',
};

function categoryColor(category: string): string {
  return CATEGORY_COLORS[category.toLowerCase()] ?? '#94a3b8';
}

/**
 * Cluster nodes by category in a radial layout.
 * Categories arranged in a circle; nodes within each cluster on a sub-grid.
 */
function computePositions(nodes: FlowNode[]): void {
  // Group by category
  const clusters = new Map<string, FlowNode[]>();
  for (const node of nodes) {
    const cat = node.data.category;
    if (!clusters.has(cat)) clusters.set(cat, []);
    clusters.get(cat)?.push(node);
  }

  const categories = [...clusters.keys()];
  const CLUSTER_RADIUS = 400;
  const NODE_SPACING = 160;
  const NODES_PER_ROW = 4;

  categories.forEach((cat, catIdx) => {
    const angle = (2 * Math.PI * catIdx) / categories.length - Math.PI / 2;
    const cx = Math.cos(angle) * CLUSTER_RADIUS;
    const cy = Math.sin(angle) * CLUSTER_RADIUS;

    // biome-ignore lint/style/noNonNullAssertion: cat was just inserted into clusters above
    const clusterNodes = clusters.get(cat)!;
    clusterNodes.forEach((node, i) => {
      const col = i % NODES_PER_ROW;
      const row = Math.floor(i / NODES_PER_ROW);
      node.position = {
        x:
          cx +
          col * NODE_SPACING -
          ((Math.min(clusterNodes.length, NODES_PER_ROW) - 1) * NODE_SPACING) / 2,
        y: cy + row * NODE_SPACING,
      };
    });
  });
}

/**
 * Map raw Memgraph topology rows to React Flow nodes + edges.
 *
 * Key rules:
 * - Deduplicate nodes by sourceId (rows fan out for each edge).
 * - Skip edge creation when targetId is null (isolated node).
 * - Deduplicate edges by source+target+edgeType.
 * - Edge strokeWidth is proportional to effectiveWeight (1–6px range).
 */
export function mapTopologyRows(rows: TopologyRow[]): GraphTopologyResult {
  const nodeMap = new Map<string, FlowNode>();
  const edgeSet = new Set<string>();
  const edges: FlowEdge[] = [];

  for (const row of rows) {
    // Upsert source node
    if (!nodeMap.has(row.sourceId)) {
      nodeMap.set(row.sourceId, {
        id: row.sourceId,
        type: 'toolNode',
        position: { x: 0, y: 0 }, // positioned after all nodes are collected
        data: {
          name: row.sourceName,
          displayName: row.sourceDisplayName ?? row.sourceName,
          category: row.sourceCategory,
          maintenanceScore: row.sourceMaintenanceScore ?? 0,
          stars: row.sourceStars ?? 0,
        },
      });
    }

    // Skip edge rows with no target
    if (row.targetId == null || row.edgeType == null || row.effectiveWeight == null) {
      continue;
    }

    // Deduplicate edges (undirected — canonicalize source < target)
    const [a, b] =
      row.sourceId < row.targetId ? [row.sourceId, row.targetId] : [row.targetId, row.sourceId];
    const edgeKey = `${a}__${b}__${row.edgeType}`;
    if (edgeSet.has(edgeKey)) continue;
    edgeSet.add(edgeKey);

    const weight = Math.max(0, Math.min(1, row.effectiveWeight));
    const strokeWidth = 1 + weight * 5; // 1–6 px

    edges.push({
      id: edgeKey,
      source: row.sourceId,
      target: row.targetId,
      type: 'default',
      data: {
        edgeType: row.edgeType,
        baseWeight: row.baseWeight ?? 0,
        effectiveWeight: row.effectiveWeight,
        confidence: row.confidence ?? 0,
        edgeSource: row.edgeSource ?? '',
      },
      style: {
        strokeWidth,
        stroke: categoryColor(row.sourceCategory),
      },
    });
  }

  const nodes = [...nodeMap.values()];
  computePositions(nodes);

  const categories = [...new Set(nodes.map((n) => n.data.category))].sort();

  return {
    nodes,
    edges,
    stats: {
      totalNodes: nodes.length,
      totalEdges: edges.length,
      categories,
    },
  };
}
