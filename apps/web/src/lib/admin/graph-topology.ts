import type { TopologyRow } from '@toolpilot/graph';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface FlowNode {
  id: string;
  type: 'toolNode';
  position: { x: number; y: number };
  data: {
    name: string;
    displayName: string;
    category: string;
    nodeType: 'Tool' | 'UseCase' | 'Pattern' | 'Stack';
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

// Topic edge from the second Memgraph query
export interface TopicEdge {
  toolId: string;
  topicId: string;
  topicNodeType: string;
  edgeType: string;
}

// ─── Edge colors ──────────────────────────────────────────────────────────────

const EDGE_COLORS: Record<string, string> = {
  REQUIRES: '#818cf8', // violet
  INTEGRATES_WITH: '#34d399', // emerald
  SOLVES: '#f59e0b', // amber
  FOLLOWS: '#f97316', // orange
  BELONGS_TO: '#0ea5e9', // sky
  REPLACES: '#f43f5e', // rose
  CONFLICTS_WITH: '#ef4444', // red
  COMPATIBLE_WITH: '#06b6d4', // cyan
  POPULAR_WITH: '#a855f7', // purple
};

function edgeColor(edgeType: string): string {
  return EDGE_COLORS[edgeType] ?? '#94a3b8';
}

// ─── Layout ───────────────────────────────────────────────────────────────────

function computePositions(nodes: FlowNode[]): void {
  const clusters = new Map<string, FlowNode[]>();
  for (const node of nodes) {
    const key = `${node.data.nodeType}:${node.data.category}`;
    if (!clusters.has(key)) clusters.set(key, []);
    clusters.get(key)?.push(node);
  }

  const clusterKeys = [...clusters.keys()];
  const CLUSTER_RADIUS = 400;
  const NODE_SPACING = 160;
  const NODES_PER_ROW = 4;

  clusterKeys.forEach((key, idx) => {
    const angle = (2 * Math.PI * idx) / clusterKeys.length - Math.PI / 2;
    const cx = Math.cos(angle) * CLUSTER_RADIUS;
    const cy = Math.sin(angle) * CLUSTER_RADIUS;
    const clusterNodes = clusters.get(key)!;
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

// ─── Mapper ───────────────────────────────────────────────────────────────────

export function mapTopologyRows(
  rows: TopologyRow[],
  topicEdges: TopicEdge[] = [],
): GraphTopologyResult {
  const nodeMap = new Map<string, FlowNode>();
  const edgeSet = new Set<string>();
  const edges: FlowEdge[] = [];

  // ── Tool nodes + Tool-to-Tool edges ──────────────────────────────────────
  for (const row of rows) {
    if (!nodeMap.has(row.sourceId)) {
      nodeMap.set(row.sourceId, {
        id: row.sourceId,
        type: 'toolNode',
        position: { x: 0, y: 0 },
        data: {
          name: row.sourceName,
          displayName: row.sourceDisplayName ?? row.sourceName,
          category: row.sourceCategory,
          nodeType: 'Tool',
          maintenanceScore: row.sourceMaintenanceScore ?? 0,
          stars: row.sourceStars ?? 0,
        },
      });
    }

    if (row.targetId == null || row.edgeType == null || row.effectiveWeight == null) continue;

    const [a, b] =
      row.sourceId < row.targetId ? [row.sourceId, row.targetId] : [row.targetId, row.sourceId];
    const key = `${a}__${b}__${row.edgeType}`;
    if (edgeSet.has(key)) continue;
    edgeSet.add(key);

    const weight = Math.max(0, Math.min(1, row.effectiveWeight));
    edges.push({
      id: key,
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
      style: { strokeWidth: 1 + weight * 5, stroke: edgeColor(row.edgeType) },
    });
  }

  // ── Topic nodes (UseCase/Pattern/Stack) + their edges to Tools ───────────
  for (const te of topicEdges) {
    // Add topic node if not already present
    const topicNodeType = te.topicNodeType as 'UseCase' | 'Pattern' | 'Stack';
    if (!nodeMap.has(te.topicId)) {
      nodeMap.set(te.topicId, {
        id: te.topicId,
        type: 'toolNode',
        position: { x: 0, y: 0 },
        data: {
          name: te.topicId,
          displayName: te.topicId,
          category: topicNodeType.toLowerCase(),
          nodeType: topicNodeType,
          maintenanceScore: 0,
          stars: 0,
        },
      });
    }

    // Topic edge: Tool → UseCase/Pattern/Stack
    const edgeKey = `${te.toolId}__${te.topicId}__${te.edgeType}`;
    if (edgeSet.has(edgeKey)) continue;
    edgeSet.add(edgeKey);

    edges.push({
      id: edgeKey,
      source: te.toolId,
      target: te.topicId,
      type: 'default',
      data: {
        edgeType: te.edgeType,
        baseWeight: 0.5,
        effectiveWeight: 0.5,
        confidence: 0,
        edgeSource: '',
      },
      style: { strokeWidth: 1.5, stroke: edgeColor(te.edgeType) },
    });
  }

  const nodes = [...nodeMap.values()];
  computePositions(nodes);

  // Only include Tool categories in the category filter
  const categories = [
    ...new Set(nodes.filter((n) => n.data.nodeType === 'Tool').map((n) => n.data.category)),
  ].sort();

  return {
    nodes,
    edges,
    stats: { totalNodes: nodes.length, totalEdges: edges.length, categories },
  };
}
