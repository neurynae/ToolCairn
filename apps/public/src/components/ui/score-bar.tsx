interface ScoreBarProps {
  score: number; // 0.0 – 1.0
  label?: string;
  showPercent?: boolean;
}

function getTierColor(score: number): string {
  if (score >= 0.85) return '#6366f1';
  if (score >= 0.7) return '#818cf8';
  if (score >= 0.5) return '#f59e0b';
  return '#ef4444';
}

function getTierLabel(score: number): string {
  if (score >= 0.85) return 'Excellent match';
  if (score >= 0.7) return 'Good match';
  if (score >= 0.5) return 'Partial match';
  return 'Weak match';
}

export function ScoreBar({ score, label, showPercent = false }: ScoreBarProps) {
  const clamped = Math.max(0, Math.min(1, score));
  const pct = Math.round(clamped * 100);
  const color = getTierColor(clamped);
  const tierLabel = label ?? getTierLabel(clamped);

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>
          {tierLabel}
        </span>
        {showPercent && (
          <span className="text-xs font-semibold" style={{ color }}>
            {pct}%
          </span>
        )}
      </div>
      <div
        className="h-1.5 w-full overflow-hidden rounded-full"
        style={{ background: 'rgba(255,255,255,0.08)' }}
      >
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${pct}%`,
            background: `linear-gradient(90deg, ${color}bb, ${color})`,
          }}
        />
      </div>
    </div>
  );
}
