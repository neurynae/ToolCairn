'use client';

import { Handle, type Node, type NodeProps, Position } from '@xyflow/react';

export type ToolNodeData = {
  name: string;
  displayName: string;
  category: string;
  maintenanceScore: number;
  stars: number;
};

export type ToolNodeType = Node<ToolNodeData, 'toolNode'>;

const CATEGORY_BG: Record<string, string> = {
  ai: 'bg-indigo-50 border-indigo-200',
  search: 'bg-sky-50 border-sky-200',
  database: 'bg-emerald-50 border-emerald-200',
  devtools: 'bg-amber-50 border-amber-200',
  monitoring: 'bg-red-50 border-red-200',
  infra: 'bg-violet-50 border-violet-200',
  messaging: 'bg-pink-50 border-pink-200',
  storage: 'bg-teal-50 border-teal-200',
};

function categoryBg(category: string): string {
  return CATEGORY_BG[category.toLowerCase()] ?? 'bg-gray-50 border-gray-200';
}

export function ToolNodeCard({ data }: NodeProps<ToolNodeType>) {
  const score = Math.round((data.maintenanceScore ?? 0) * 100);
  const scoreColor =
    score >= 70 ? 'text-emerald-600' : score >= 40 ? 'text-amber-600' : 'text-red-500';

  return (
    <>
      <Handle type="target" position={Position.Top} className="!bg-gray-400" />
      <div
        className={`min-w-[140px] max-w-[180px] rounded-lg border px-3 py-2 shadow-sm ${categoryBg(data.category)}`}
      >
        <p className="truncate text-xs font-semibold text-gray-900 leading-tight">
          {data.displayName}
        </p>
        <p className="mt-0.5 text-[10px] text-gray-400 uppercase tracking-wide">{data.category}</p>
        <div className="mt-1.5 flex items-center gap-2 text-[10px]">
          <span className={`font-medium ${scoreColor}`}>{score}%</span>
          <span className="text-gray-400">★ {data.stars}</span>
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} className="!bg-gray-400" />
    </>
  );
}
