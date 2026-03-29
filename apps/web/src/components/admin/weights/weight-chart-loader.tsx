'use client';

import type { EdgeWeightSummaryRow } from '@toolpilot/graph';
import dynamic from 'next/dynamic';

// Recharts uses browser APIs — ssr: false only allowed in Client Components.
const WeightHistoryChartDynamic = dynamic(
  () => import('./weight-history-chart').then((m) => m.WeightHistoryChart),
  { ssr: false },
);

interface Props {
  edgeWeightSummary: EdgeWeightSummaryRow[];
}

export function WeightChartLoader({ edgeWeightSummary }: Props) {
  return <WeightHistoryChartDynamic edgeWeightSummary={edgeWeightSummary} />;
}
