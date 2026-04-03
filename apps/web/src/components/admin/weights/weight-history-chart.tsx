'use client';

import type { EdgeWeightSummaryRow } from '@toolpilot/graph';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

interface WeightHistoryChartProps {
  edgeWeightSummary: EdgeWeightSummaryRow[];
}

const EDGE_COLORS: Record<string, string> = {
  SIMILAR_TO: '#6366f1',
  SOLVES: '#0ea5e9',
  REQUIRES: '#10b981',
  INTEGRATES_WITH: '#f59e0b',
  REPLACES: '#ef4444',
  CONFLICTS_WITH: '#dc2626',
  POPULAR_WITH: '#8b5cf6',
  BREAKS_FROM: '#ec4899',
  HAS_VERSION: '#14b8a6',
  COMPATIBLE_WITH: '#64748b',
};

function edgeColor(type: string): string {
  return EDGE_COLORS[type] ?? '#94a3b8';
}

export function WeightHistoryChart({ edgeWeightSummary }: WeightHistoryChartProps) {
  if (edgeWeightSummary.length === 0) {
    return (
      <div className="h-72 flex items-center justify-center text-sm text-muted-foreground">
        No edge data yet.
      </div>
    );
  }

  const data = edgeWeightSummary.map((row) => ({
    type: row.edgeType,
    avgWeight: Math.round(row.avgEffectiveWeight * 100) / 100,
    count: row.edgeCount,
  }));

  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 4, right: 16, left: 0, bottom: 40 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
          <XAxis
            dataKey="type"
            tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
            angle={-30}
            textAnchor="end"
            interval={0}
          />
          <YAxis
            tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
            domain={[0, 1]}
            tickFormatter={(v: number) => v.toFixed(1)}
          />
          <Tooltip
            formatter={(value: number, name: string) => [
              name === 'avgWeight' ? `${(value * 100).toFixed(0)}%` : value,
              name === 'avgWeight' ? 'Avg effective weight' : 'Edge count',
            ]}
            contentStyle={{
              fontSize: 12,
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              color: 'hsl(var(--foreground))',
            }}
          />
          <Bar dataKey="avgWeight" radius={[4, 4, 0, 0]}>
            {data.map((entry) => (
              <Cell key={entry.type} fill={edgeColor(entry.type)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
