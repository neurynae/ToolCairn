'use client';

import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

const ForceGraph3D = dynamic(() => import('react-force-graph-3d').then((mod) => mod.default), {
  ssr: false,
  loading: () => (
    <div className="flex h-[360px] items-center justify-center">
      <Skeleton className="h-full w-full rounded-lg" />
    </div>
  ),
});

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
    const nodes: Array<{ id: string; isCenter: boolean }> = [{ id: center, isCenter: true }];
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
      if (typeof node.id === 'string') {
        router.push(`/tool/${encodeURIComponent(node.id)}`);
      }
    },
    [router],
  );

  const nodeColor = useCallback(
    (node: Record<string, unknown>) => (node.id === centerName ? ACCENT : DIM),
    [centerName],
  );

  const nodeVal = useCallback(
    (node: Record<string, unknown>) => (node.id === centerName ? 6 : 3),
    [centerName],
  );

  if (!graphData) return null;

  return (
    <Card className="hidden lg:flex lg:flex-col">
      <CardHeader>
        <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Relationships
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 p-0">
        <div style={{ height: 320 }}>
          <ForceGraph3D
            graphData={graphData}
            width={400}
            height={320}
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
      </CardContent>
    </Card>
  );
}
