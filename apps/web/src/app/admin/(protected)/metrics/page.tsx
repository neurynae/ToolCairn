import type { MetricsData } from '@/lib/admin/metrics.service';
import { getMetrics } from '@/lib/admin/metrics.service';
import { PROXY_ENABLED, proxyGet } from '@/lib/admin/api-proxy';
import { QuestionEffectivenessTable } from '@/components/admin/metrics/question-effectiveness-table';
import {
  OutcomeDistributionChartLoader as OutcomeDistributionChart,
  SessionFunnelChartLoader as SessionFunnelChart,
} from '@/components/admin/metrics/metric-charts-loader';
import { PageHeader } from '@/components/admin/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <Card>
      <CardHeader className="pb-1">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-bold">{value}</p>
      </CardContent>
    </Card>
  );
}

export default async function MetricsPage() {
  let data: MetricsData | null = null;

  try {
    if (PROXY_ENABLED) {
      const res = await proxyGet('/metrics', new URLSearchParams({ days: '30' }));
      const json = (await res.json()) as { ok: boolean; data?: MetricsData };
      if (json.ok && json.data) data = json.data;
    } else {
      data = await getMetrics(30);
    }
  } catch {
    // Postgres unavailable
  }

  if (!data) {
    return (
      <>
        <PageHeader title="Metrics" description="Search session analytics" />
        <Card className="border-destructive/50">
          <CardContent className="pt-6 text-sm text-muted-foreground">
            Could not load metrics. Is PostgreSQL running?
          </CardContent>
        </Card>
      </>
    );
  }

  const completionRatePct = Math.round(data.sessionStats.completionRate * 100);

  return (
    <>
      <PageHeader
        title="Metrics"
        description="Search session funnel, clarification effectiveness, and outcome distribution (last 30 days)"
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Total Sessions" value={data.sessionStats.total} />
        <StatCard label="Completed" value={data.sessionStats.completed} />
        <StatCard label="Abandoned" value={data.sessionStats.abandoned} />
        <StatCard label="Completion Rate" value={`${completionRatePct}%`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
            Daily Session Volume
          </p>
          <SessionFunnelChart dailyVolume={data.dailySessionVolume} />
        </div>
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
            Outcome Distribution
          </p>
          <OutcomeDistributionChart distribution={data.outcomeDistribution} />
        </div>
      </div>

      {data.topChosenTools.length > 0 && (
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
            Top Chosen Tools
          </p>
          <div className="flex flex-wrap gap-2">
            {data.topChosenTools.map((t) => (
              <Badge key={t.tool} variant="outline" className="gap-1.5 px-3 py-1">
                {t.tool}
                <span className="text-muted-foreground text-xs">{t.count}</span>
              </Badge>
            ))}
          </div>
        </div>
      )}

      <div>
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
          Clarification Question Effectiveness
        </p>
        <QuestionEffectivenessTable data={data.clarificationEffectiveness} />
      </div>
    </>
  );
}
