'use client';

import { useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';

const ForceGraph3D = dynamic(
  () => import('react-force-graph-3d').then((mod) => mod.default),
  { ssr: false },
);

interface NeighborNode {
  tool: { name: string };
  edgeType: string;
  weight: number;
}

interface ToolGraphMiniProps {
  neighborhood: {
    center: { name: string };
    neighbors: NeighborNode[];
  } | null;
}

const ACCENT = '#6366f1';
const DIM = '#4b5563';

export function ToolGraphMini({ neighborhood }: ToolGraphMiniProps) {
  const router = useRouter();

  const { centerName, graphData } = useMemo(() => {
    if (!neighborhood) return { centerName: '', graphData: null };

    const center = neighborhood.center.name;
    const nodes: Array<{ id: string; isCenter: boolean }> = [
      { id: center, isCenter: true },
    ];
    const links: Array<{ source: string; target: string; label: string }> = [];
    const seen = new Set<string>([center]);

    for (const neighbor of neighborhood.neighbors) {
      const name = neighbor.tool.name;
      if (!seen.has(name)) {
        seen.add(name);
        nodes.push({ id: name, isCenter: false });
      }
      links.push({ source: center, target: name, label: neighbor.edgeType });
    }

    return { centerName: center, graphData: { nodes, links } };
  }, [neighborhood]);

  const handleNodeClick = useCallback(
    (node: Record<string, unknown>) => {
      if (typeof node['id'] === 'string') {
        router.push(`/tool/${encodeURIComponent(node['id'])}`);
      }
    },
    [router],
  );

  const nodeColor = useCallback(
    (node: Record<string, unknown>) =>
      node['id'] === centerName ? ACCENT : DIM,
    [centerName],
  );

  const nodeVal = useCallback(
    (node: Record<string, unknown>) =>
      node['id'] === centerName ? 6 : 3,
    [centerName],
  );

  if (!graphData) return null;

  return (
    <div className="hidden lg:block" style={{ height: 360 }}>
      <ForceGraph3D
        graphData={graphData}
        width={400}
        height={360}
        backgroundColor="rgba(0,0,0,0)"
        nodeLabel="id"
        nodeColor={nodeColor}
        nodeVal={nodeVal}
        nodeOpacity={0.9}
        linkColor={() => 'rgba(99,102,241,0.3)'}
        linkWidth={1}
        linkDirectionalParticles={1}
        linkDirectionalParticleSpeed={0.005}
        onNodeClick={handleNodeClick}
        enableNavigationControls
        showNavInfo={false}
      />
    </div>
  );
}
