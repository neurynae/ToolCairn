'use client';

import { CategoryBadge } from '@/components/ui/category-badge';
import { GlassCard } from '@/components/ui/glass-card';
import { HealthTierBadge } from '@/components/ui/health-tier-badge';
import type { StackTool } from '@/lib/api-client';
import { getHealthTier } from '@/lib/format-health';
import { useState } from 'react';

interface StackResultCardProps {
  tool: StackTool;
}

export function StackResultCard({ tool }: StackResultCardProps) {
  const tier = getHealthTier(tool.maintenance_score);
  const [linkHovered, setLinkHovered] = useState(false);

  return (
    <GlassCard padding="lg" className="fade-up flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-lg font-bold" style={{ color: 'var(--tp-text-primary)' }}>
          {tool.display_name}
        </h3>
        <div className="flex shrink-0 items-center gap-2">
          <CategoryBadge category={tool.category} size="sm" />
          <HealthTierBadge tier={tier} size="sm" />
        </div>
      </div>

      {/* Description */}
      <p className="text-sm leading-relaxed" style={{ color: 'var(--tp-text-secondary)' }}>
        {tool.description}
      </p>

      {/* Score */}
      <div className="text-xs" style={{ color: 'var(--tp-text-muted)' }}>
        Maintenance score: {Math.round(tool.maintenance_score * 100)}%
      </div>

      {/* Links */}
      <div
        className="flex items-center gap-4 border-t pt-4"
        style={{ borderColor: 'var(--tp-border-subtle)' }}
      >
        <a
          href={tool.github_url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-medium transition-colors"
          style={{ color: 'var(--tp-accent)' }}
        >
          GitHub ↗
        </a>
        <a
          href={`/tool/${tool.name}`}
          className="ml-auto text-xs font-medium transition-colors"
          style={{ color: linkHovered ? 'var(--tp-accent-hover)' : 'var(--tp-accent)' }}
          onMouseEnter={() => setLinkHovered(true)}
          onMouseLeave={() => setLinkHovered(false)}
        >
          View Profile →
        </a>
      </div>
    </GlassCard>
  );
}
