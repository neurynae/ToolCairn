import { cn } from '@/lib/utils';

interface ScoreBarProps {
  score: number; // 0.0 – 1.0
  label?: string;
  showPercent?: boolean;
  className?: string;
}

function getScoreColorClass(score: number): string {
  if (score >= 0.85) return 'bg-[var(--tp-accent)]';
  if (score >= 0.7) return 'bg-[var(--tp-accent-hover)]';
  if (score >= 0.5) return 'bg-[var(--tp-health-slowing)]';
  return 'bg-[var(--tp-health-at-risk)]';
}

function getScoreLabel(score: number): string {
  if (score >= 0.85) return 'Excellent match';
  if (score >= 0.7) return 'Good match';
  if (score >= 0.5) return 'Partial match';
  return 'Weak match';
}

export function ScoreBar({ score, label, showPercent = false, className }: ScoreBarProps) {
  const clamped = Math.max(0, Math.min(1, score));
  const pct = Math.round(clamped * 100);
  const colorClass = getScoreColorClass(clamped);
  const displayLabel = label ?? getScoreLabel(clamped);

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">{displayLabel}</span>
        {showPercent && (
          <span className={cn('text-xs font-semibold', colorClass.replace('bg-', 'text-'))}>
            {pct}%
          </span>
        )}
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={cn('h-full rounded-full transition-all duration-500', colorClass)}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
