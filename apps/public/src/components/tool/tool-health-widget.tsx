import { GlassCard } from '@/components/ui/glass-card';
import { ScoreBar } from '@/components/ui/score-bar';
import { TrendArrow, formatStars } from '@/components/ui/trend-arrow';
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
    <GlassCard padding="lg" hover={false} as="section" className="flex flex-col gap-5">
      <h2
        className="text-sm font-semibold uppercase tracking-wider"
        style={{ color: 'var(--color-text-muted)' }}
      >
        Health &amp; Activity
      </h2>

      {/* Maintenance Score */}
      <div className="flex flex-col gap-1">
        <ScoreBar score={health.maintenance_score} label="Maintenance Score" showPercent />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <StatItem label="Stars">
          <span className="inline-flex items-center gap-1.5">
            <StarIcon />
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
    </GlassCard>
  );
}

function StatItem({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span
        className="text-[11px] font-medium uppercase tracking-wider"
        style={{ color: 'var(--color-text-muted)' }}
      >
        {label}
      </span>
      <span className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
        {children}
      </span>
    </div>
  );
}

function StarIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      className="inline-block"
      aria-hidden="true"
    >
      <path
        d="M6 1l1.545 3.13L11 4.635 8.5 7.07l.59 3.44L6 8.885 2.91 10.51l.59-3.44L1 4.635l3.455-.505L6 1z"
        fill="currentColor"
      />
    </svg>
  );
}
