'use client';

import { CategoryBadge } from '@/components/ui/category-badge';
import { GlassCard } from '@/components/ui/glass-card';
import { HealthTierBadge } from '@/components/ui/health-tier-badge';
import { getHealthTier } from '@/lib/format-health';
import { useState } from 'react';

interface CompactTool {
  name: string;
  display_name: string;
  description: string;
  category: string;
  github_url: string;
  maintenance_score: number;
  stars: number;
  language: string;
  license: string;
}

interface ToolCardCompactProps {
  tool: CompactTool;
}

function formatStars(stars: number): string {
  if (stars >= 1000) return `${(stars / 1000).toFixed(1)}k`;
  return String(stars);
}

export function ToolCardCompact({ tool }: ToolCardCompactProps) {
  const tier = getHealthTier(tool.maintenance_score);
  const [hovered, setHovered] = useState(false);

  return (
    <a
      href={`/tool/${tool.name}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="block no-underline"
    >
      <GlassCard padding="md" className="flex flex-col gap-3 transition-all">
        {/* Top row: name + badges */}
        <div className="flex items-start justify-between gap-3">
          <h3
            className="text-sm font-semibold"
            style={{
              color: hovered ? 'var(--color-accent)' : 'var(--color-text-primary)',
              transition: 'color 0.15s',
            }}
          >
            {tool.display_name}
          </h3>
          <div className="flex shrink-0 items-center gap-1.5">
            <CategoryBadge category={tool.category} size="sm" />
            <HealthTierBadge tier={tier} size="sm" />
          </div>
        </div>

        {/* Description (single line truncated) */}
        <p
          className="line-clamp-1 text-xs leading-relaxed"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          {tool.description}
        </p>

        {/* Metadata row */}
        <div
          className="flex flex-wrap items-center gap-3 text-[11px]"
          style={{ color: 'var(--color-text-muted)' }}
        >
          <span className="inline-flex items-center gap-1">
            <StarIcon />
            {formatStars(tool.stars)}
          </span>
          {tool.language && <span>{tool.language}</span>}
          {tool.license && <span>{tool.license}</span>}
        </div>
      </GlassCard>
    </a>
  );
}

function StarIcon() {
  return (
    <svg
      width="11"
      height="11"
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
