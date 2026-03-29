import type { MetricsData } from '@/lib/admin/metrics.service';
import { getMetrics } from '@/lib/admin/metrics.service';
import { QuestionEffectivenessTable } from '@/components/admin/metrics/question-effectiveness-table';
import {
  OutcomeDistributionChartLoader as OutcomeDistributionChart,
  SessionFunnelChartLoader as SessionFunnelChart,
} from '@/components/admin/metrics/metric-charts-loader';

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
    </div>
  );
}

export default async function MetricsPage() {
  let data: MetricsData | null = null;

  try {
    data = await getMetrics(30);
  } catch {
    // Postgres unavailable
  }

  if (!data) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-lg font-semibold text-gray-900">Metrics</h1>
        <p className="text-sm text-red-500">Could not load metrics. Is Postgres running?</p>
      </div>
    );
  }

  const completionRatePct = Math.round(data.sessionStats.completionRate * 100);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-lg font-semibold text-gray-900">Metrics</h1>
        <p className="text-sm text-gray-500">
          Search session funnel, clarification effectiveness, and outcome distribution (last 30 days).
        </p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Total Sessions" value={data.sessionStats.total} />
        <StatCard label="Completed" value={data.sessionStats.completed} />
        <StatCard label="Abandoned" value={data.sessionStats.abandoned} />
        <StatCard label="Completion Rate" value={`${completionRatePct}%`} />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Daily Session Volume</h2>
          <SessionFunnelChart dailyVolume={data.dailySessionVolume} />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Outcome Distribution</h2>
          <OutcomeDistributionChart distribution={data.outcomeDistribution} />
        </div>
      </div>

      {/* Top chosen tools */}
      {data.topChosenTools.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Top Chosen Tools</h2>
          <div className="flex flex-wrap gap-2">
            {data.topChosenTools.map((t) => (
              <span
                key={t.tool}
                className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1 text-sm text-indigo-700 font-medium"
              >
                {t.tool}
                <span className="text-indigo-400 text-xs">{t.count}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Clarification effectiveness */}
      <div>
        <h2 className="text-sm font-semibold text-gray-700 mb-3">
          Clarification Question Effectiveness
        </h2>
        <QuestionEffectivenessTable data={data.clarificationEffectiveness} />
      </div>
    </div>
  );
}
