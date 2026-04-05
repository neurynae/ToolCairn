import { cn } from '@/lib/utils';
import type { HealthTier } from '@/lib/format-health';

interface HealthTierBadgeProps {
  tier: HealthTier;
  size?: 'sm' | 'md';
  className?: string;
}

const tierConfig: Record<
  HealthTier,
  { label: string; dotClass: string; textClass: string; bgClass: string; borderClass: string }
> = {
  active: {
    label: 'Active',
    dotClass: 'bg-[var(--tp-health-active)]',
    textClass: 'text-[var(--tp-health-active)]',
    bgClass: 'bg-[var(--tp-health-active)]/10',
    borderClass: 'border-[var(--tp-health-active)]/25',
  },
  stable: {
    label: 'Stable',
    dotClass: 'bg-[var(--tp-health-stable)]',
    textClass: 'text-[var(--tp-health-stable)]',
    bgClass: 'bg-[var(--tp-health-stable)]/10',
    borderClass: 'border-[var(--tp-health-stable)]/25',
  },
  slowing: {
    label: 'Slowing',
    dotClass: 'bg-[var(--tp-health-slowing)]',
    textClass: 'text-[var(--tp-health-slowing)]',
    bgClass: 'bg-[var(--tp-health-slowing)]/10',
    borderClass: 'border-[var(--tp-health-slowing)]/25',
  },
  'at-risk': {
    label: 'At Risk',
    dotClass: 'bg-[var(--tp-health-at-risk)]',
    textClass: 'text-[var(--tp-health-at-risk)]',
    bgClass: 'bg-[var(--tp-health-at-risk)]/10',
    borderClass: 'border-[var(--tp-health-at-risk)]/25',
  },
};

export function HealthTierBadge({ tier, size = 'md', className }: HealthTierBadgeProps) {
  const config = tierConfig[tier];

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border font-medium',
        config.bgClass,
        config.textClass,
        config.borderClass,
        size === 'sm' ? 'px-1.5 py-0.5 text-[11px]' : 'px-2 py-0.5 text-xs',
        className,
      )}
    >
      <span
        className={cn('inline-block shrink-0 rounded-full', config.dotClass)}
        style={{ width: '6px', height: '6px' }}
      />
      {config.label}
    </span>
  );
}
