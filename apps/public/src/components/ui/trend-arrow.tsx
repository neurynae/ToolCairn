interface TrendArrowProps {
  velocity: number; // stars_velocity_90d
  showLabel?: boolean;
}

export function TrendArrow({ velocity, showLabel = false }: TrendArrowProps) {
  const isUp = velocity > 50;
  const isDown = velocity < -50;
  const isFlat = !isUp && !isDown;

  if (isUp) {
    return (
      <span
        className="inline-flex items-center gap-0.5 text-xs font-medium"
        style={{ color: '#10b981' }}
        title={`+${velocity} stars in 90d`}
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M6 2L10 7H2L6 2Z" fill="currentColor" />
        </svg>
        {showLabel && 'Trending'}
      </span>
    );
  }

  if (isDown) {
    return (
      <span
        className="inline-flex items-center gap-0.5 text-xs font-medium"
        style={{ color: '#ef4444' }}
        title={`${velocity} stars in 90d`}
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M6 10L2 5H10L6 10Z" fill="currentColor" />
        </svg>
        {showLabel && 'Declining'}
      </span>
    );
  }

  // Flat
  return (
    <span
      className="inline-flex items-center gap-0.5 text-xs"
      style={{ color: 'var(--color-text-muted)' }}
      title="Stable growth"
    >
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
        <path
          d="M2 6H10M7 3L10 6L7 9"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
      {showLabel && 'Stable'}
    </span>
  );
}

export function formatStars(stars: number): string {
  if (stars >= 1_000_000) return `${(stars / 1_000_000).toFixed(1)}M`;
  if (stars >= 1_000) return `${(stars / 1_000).toFixed(1)}k`;
  return String(stars);
}
