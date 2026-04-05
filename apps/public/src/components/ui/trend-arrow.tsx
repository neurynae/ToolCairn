import { TrendingUpIcon, TrendingDownIcon, ArrowRightIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TrendArrowProps {
  velocity: number; // stars_velocity_90d
  showLabel?: boolean;
  className?: string;
}

export function TrendArrow({ velocity, showLabel = false, className }: TrendArrowProps) {
  const isUp = velocity > 50;
  const isDown = velocity < -50;

  if (isUp) {
    return (
      <span
        className={cn('inline-flex items-center gap-0.5 text-xs font-medium text-[var(--tp-health-active)]', className)}
        title={`+${velocity} stars in 90d`}
      >
        <TrendingUpIcon className="size-3" />
        {showLabel && 'Trending'}
      </span>
    );
  }

  if (isDown) {
    return (
      <span
        className={cn('inline-flex items-center gap-0.5 text-xs font-medium text-[var(--tp-health-at-risk)]', className)}
        title={`${velocity} stars in 90d`}
      >
        <TrendingDownIcon className="size-3" />
        {showLabel && 'Declining'}
      </span>
    );
  }

  return (
    <span
      className={cn('inline-flex items-center gap-0.5 text-xs text-muted-foreground', className)}
      title="Stable growth"
    >
      <ArrowRightIcon className="size-3" />
      {showLabel && 'Stable'}
    </span>
  );
}

export function formatStars(stars: number): string {
  if (stars >= 1_000_000) return `${(stars / 1_000_000).toFixed(1)}M`;
  if (stars >= 1_000) return `${(stars / 1_000).toFixed(1)}k`;
  return String(stars);
}
