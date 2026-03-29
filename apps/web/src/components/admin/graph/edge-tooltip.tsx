'use client';

import {
  BaseEdge,
  type Edge,
  EdgeLabelRenderer,
  type EdgeProps,
  getBezierPath,
} from '@xyflow/react';
import { useState } from 'react';

export type TooltipEdgeData = {
  edgeType: string;
  baseWeight: number;
  effectiveWeight: number;
  confidence: number;
  edgeSource: string;
};

export type TooltipEdge = Edge<TooltipEdgeData>;

export function EdgeTooltip({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style,
  data,
}: EdgeProps<TooltipEdge>) {
  const [hovered, setHovered] = useState(false);

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const effective = ((data?.effectiveWeight ?? 0) * 100).toFixed(0);
  const base = ((data?.baseWeight ?? 0) * 100).toFixed(0);
  const confidence = ((data?.confidence ?? 0) * 100).toFixed(0);

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        style={style}
        interactionWidth={12}
        markerEnd={undefined}
        className="cursor-pointer"
      />
      {/* Invisible wider hit area */}
      <path
        d={edgePath}
        strokeWidth={12}
        stroke="transparent"
        fill="none"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className="cursor-pointer"
      />
      {hovered && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: 'none',
            }}
            className="rounded-md border border-gray-200 bg-white px-2.5 py-1.5 shadow-lg text-[11px] leading-snug"
          >
            <p className="font-semibold text-gray-800">{data?.edgeType ?? 'EDGE'}</p>
            <p className="text-gray-500">
              <span className="text-gray-700 font-medium">{effective}%</span> effective
              {' · '}
              <span className="text-gray-700 font-medium">{base}%</span> base
            </p>
            <p className="text-gray-400">
              conf {confidence}% · {data?.edgeSource ?? '—'}
            </p>
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}
