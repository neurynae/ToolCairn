'use client';

import type { OutcomeDistribution } from '@/lib/admin/metrics.service';
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';

interface OutcomeDistributionChartProps {
  distribution: OutcomeDistribution[];
}

const OUTCOME_COLORS: Record<string, string> = {
  success: '#10b981',
  failure: '#ef4444',
  replaced: '#f59e0b',
  pending: '#94a3b8',
  unknown: '#d1d5db',
};

function outcomeColor(outcome: string): string {
  return OUTCOME_COLORS[outcome] ?? '#94a3b8';
}

export function OutcomeDistributionChart({ distribution }: OutcomeDistributionChartProps) {
  if (distribution.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-sm text-gray-400">
        No outcome data yet.
      </div>
    );
  }

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={distribution}
            dataKey="count"
            nameKey="outcome"
            cx="50%"
            cy="50%"
            outerRadius={80}
            label={({ outcome, percent }) => `${outcome} ${((percent ?? 0) * 100).toFixed(0)}%`}
            labelLine={false}
          >
            {distribution.map((entry) => (
              <Cell key={entry.outcome} fill={outcomeColor(entry.outcome)} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number, name: string) => [value, name]}
            contentStyle={{ fontSize: 12 }}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
