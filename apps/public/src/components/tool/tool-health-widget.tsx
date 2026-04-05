import { StarIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScoreBar } from '@/components/ui/score-bar';
import { TrendArrow, formatStars } from '@/components/ui/trend-arrow';
import { Separator } from '@/components/ui/separator';
import { formatLastCommit } from '@/lib/format-health';

interface ToolHealthWidgetProps {
  health: {
    maintenance_score: number;
    stars: number;
    stars_velocity_90d: number;
    last_commit_date: string;
    commit_velocity_30d: number;
    contributor_count: number;
    open_issues: number;
  };
}

export function ToolHealthWidget({ health }: ToolHealthWidgetProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Health &amp; Activity
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        {/* Maintenance Score */}
        <ScoreBar score={health.maintenance_score} label="Maintenance Score" showPercent />

        <Separator />

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <StatItem label="Stars">
            <span className="inline-flex items-center gap-1.5">
              <StarIcon className="size-3 text-[var(--tp-health-slowing)]" aria-hidden="true" />
              {formatStars(health.stars)}
              <TrendArrow velocity={health.stars_velocity_90d} />
            </span>
          </StatItem>

          <StatItem label="Commits / month">
            <span>{Math.round(health.commit_velocity_30d)}</span>
          </StatItem>

          <StatItem label="Last Commit">
            <span>{formatLastCommit(health.last_commit_date)}</span>
          </StatItem>

          <StatItem label="Contributors">
            <span>{health.contributor_count}</span>
          </StatItem>

          <StatItem label="Open Issues">
            <span>{health.open_issues.toLocaleString()}</span>
          </StatItem>
        </div>
      </CardContent>
    </Card>
  );
}

function StatItem({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <span className="text-sm font-semibold text-foreground">{children}</span>
    </div>
  );
}
