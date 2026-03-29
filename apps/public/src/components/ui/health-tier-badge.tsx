import type { HealthTier } from '@/lib/format-health';

interface HealthTierBadgeProps {
  tier: HealthTier;
  size?: 'sm' | 'md';
}

const tierConfig: Record<HealthTier, { label: string; bg: string; text: string; dot: string }> = {
  active: {
    label: 'Active',
    bg: 'rgba(16, 185, 129, 0.12)',
    text: '#34d399',
    dot: '#10b981',
  },
  stable: {
    label: 'Stable',
    bg: 'rgba(59, 130, 246, 0.12)',
    text: '#60a5fa',
    dot: '#3b82f6',
  },
  slowing: {
    label: 'Slowing',
    bg: 'rgba(245, 158, 11, 0.12)',
    text: '#fbbf24',
    dot: '#f59e0b',
  },
  'at-risk': {
    label: 'At Risk',
    bg: 'rgba(239, 68, 68, 0.12)',
    text: '#f87171',
    dot: '#ef4444',
  },
};

export function HealthTierBadge({ tier, size = 'md' }: HealthTierBadgeProps) {
  const config = tierConfig[tier];
  const fontSize = size === 'sm' ? '11px' : '12px';
  const padding = size === 'sm' ? '2px 7px' : '3px 9px';

  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full font-medium"
      style={{
        fontSize,
        padding,
        background: config.bg,
        color: config.text,
        border: `1px solid ${config.text}30`,
      }}
    >
      <span
        className="inline-block rounded-full"
        style={{
          width: '6px',
          height: '6px',
          background: config.dot,
          flexShrink: 0,
        }}
      />
      {config.label}
    </span>
  );
}
