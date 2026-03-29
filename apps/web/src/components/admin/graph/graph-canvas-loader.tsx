'use client';

import type { GraphTopologyResult } from '@/lib/admin/graph-topology';
import dynamic from 'next/dynamic';

// Three.js / WebGL — browser-only, must disable SSR.
// ssr: false is only allowed in Client Components in Next.js 15 App Router.
const GraphCanvasDynamic = dynamic(() => import('./graph-canvas-3d').then((m) => m.GraphCanvas3D), {
  ssr: false,
  loading: () => (
    <div className="flex-1 min-h-0 rounded-xl animate-pulse" style={{ background: '#070b18' }} />
  ),
});

interface Props {
  initialData: GraphTopologyResult;
}

export function GraphCanvasLoader({ initialData }: Props) {
  return <GraphCanvasDynamic initialData={initialData} />;
}
