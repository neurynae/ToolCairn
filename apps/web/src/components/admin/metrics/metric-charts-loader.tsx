'use client';

import type { DailySessionVolume, OutcomeDistribution } from '@/lib/admin/metrics.service';
import dynamic from 'next/dynamic';

// Recharts uses browser APIs — ssr: false only allowed in Client Components.
const SessionFunnelChartDynamic = dynamic(
  () => import('./session-funnel-chart').then((m) => m.SessionFunnelChart),
  { ssr: false },
);

const OutcomeDistributionChartDynamic = dynamic(
  () => import('./outcome-distribution-chart').then((m) => m.OutcomeDistributionChart),
  { ssr: false },
);

export function SessionFunnelChartLoader({ dailyVolume }: { dailyVolume: DailySessionVolume[] }) {
  return <SessionFunnelChartDynamic dailyVolume={dailyVolume} />;
}

export function OutcomeDistributionChartLoader({
  distribution,
}: { distribution: OutcomeDistribution[] }) {
  return <OutcomeDistributionChartDynamic distribution={distribution} />;
}
