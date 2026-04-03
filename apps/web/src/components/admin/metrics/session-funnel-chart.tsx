'use client';

import type { DailySessionVolume } from '@/lib/admin/metrics.service';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

interface SessionFunnelChartProps {
  dailyVolume: DailySessionVolume[];
}

const GRID = 'rgba(255,255,255,0.08)';
const TICK = 'hsl(var(--muted-foreground))';
const TOOLTIP_STYLE = {
  fontSize: 12,
  backgroundColor: 'hsl(var(--card))',
  border: '1px solid hsl(var(--border))',
  color: 'hsl(var(--foreground))',
};

export function SessionFunnelChart({ dailyVolume }: SessionFunnelChartProps) {
  if (dailyVolume.length === 0) {
    return (
      <div className="h-72 flex items-center justify-center text-sm text-muted-foreground">
        No session data for this period.
      </div>
    );
  }

  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={dailyVolume} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={GRID} />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10, fill: TICK }}
            tickFormatter={(d: string) => d.slice(5)}
          />
          <YAxis tick={{ fontSize: 11, fill: TICK }} allowDecimals={false} />
          <Tooltip
            labelFormatter={(label: string) => `Date: ${label}`}
            contentStyle={TOOLTIP_STYLE}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Bar dataKey="sessions" fill="#6366f1" radius={[3, 3, 0, 0]} name="Sessions" />
          <Bar dataKey="completions" fill="#10b981" radius={[3, 3, 0, 0]} name="Completions" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
