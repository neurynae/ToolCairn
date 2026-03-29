'use client';

import {
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  useEdgesState,
  useNodesState,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import type { FlowEdge, FlowNode, GraphTopologyResult } from '@/lib/admin/graph-topology';
import { useCallback, useEffect, useState } from 'react';
import { EdgeTooltip } from './edge-tooltip';
import { GraphControls } from './graph-controls';
import { ToolNodeCard } from './tool-node-card';

const NODE_TYPES = { toolNode: ToolNodeCard };
const EDGE_TYPES = { default: EdgeTooltip };

interface GraphCanvasProps {
  initialData: GraphTopologyResult;
}

export function GraphCanvas({ initialData }: GraphCanvasProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState<FlowNode>(initialData.nodes as FlowNode[]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<FlowEdge>(initialData.edges as FlowEdge[]);
  const [stats, setStats] = useState(initialData.stats);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [nodeLimit, setNodeLimit] = useState(200);
  const [loading, setLoading] = useState(false);

  const fetchTopology = useCallback(
    async (category: string, limit: number) => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (category) params.set('category', category);
        params.set('limit', String(limit));

        const res = await fetch(`/api/admin/graph?${params.toString()}`);
        if (!res.ok) return;

        const json = (await res.json()) as { ok: boolean; data: GraphTopologyResult };
        if (!json.ok) return;

        setNodes(json.data.nodes as FlowNode[]);
        setEdges(json.data.edges as FlowEdge[]);
        setStats(json.data.stats);
      } finally {
        setLoading(false);
      }
    },
    [setNodes, setEdges],
  );

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    void fetchTopology(category, nodeLimit);
  };

  const handleNodeLimitChange = (limit: number) => {
    setNodeLimit(limit);
    void fetchTopology(selectedCategory, limit);
  };

  // Keep initial data in sync on first mount (SSR data passed as prop).
  // Intentionally runs once — initialData is the SSR seed, not a live prop.
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional mount-only effect
  useEffect(() => {
    setNodes(initialData.nodes as FlowNode[]);
    setEdges(initialData.edges as FlowEdge[]);
    setStats(initialData.stats);
  }, []);

  return (
    <div className="flex flex-col gap-3 h-full">
      <GraphControls
        categories={stats.categories}
        selectedCategory={selectedCategory}
        nodeLimit={nodeLimit}
        onCategoryChange={handleCategoryChange}
        onNodeLimitChange={handleNodeLimitChange}
        totalNodes={stats.totalNodes}
        totalEdges={stats.totalEdges}
      />

      <div className="relative flex-1 min-h-0 rounded-lg border border-gray-200 overflow-hidden bg-gray-50">
        {loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/60">
            <span className="text-sm text-gray-500">Loading…</span>
          </div>
        )}
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={NODE_TYPES}
          edgeTypes={EDGE_TYPES}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          minZoom={0.05}
          maxZoom={2}
          proOptions={{ hideAttribution: true }}
        >
          <Background gap={24} size={1} color="#e5e7eb" />
          <Controls />
          <MiniMap
            nodeColor={(node) => {
              const data = node.data as { category?: string };
              const colors: Record<string, string> = {
                ai: '#6366f1',
                search: '#0ea5e9',
                database: '#10b981',
                devtools: '#f59e0b',
                monitoring: '#ef4444',
                infra: '#8b5cf6',
                messaging: '#ec4899',
                storage: '#14b8a6',
              };
              return colors[(data.category ?? '').toLowerCase()] ?? '#94a3b8';
            }}
            maskColor="rgba(255,255,255,0.6)"
          />
        </ReactFlow>
      </div>
    </div>
  );
}
