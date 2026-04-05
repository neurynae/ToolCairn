'use client';

import Link from 'next/link';
import { StarIcon, GitCompareArrowsIcon } from 'lucide-react';
import { CategoryBadge } from '@/components/ui/category-badge';
import { HealthTierBadge } from '@/components/ui/health-tier-badge';
import { Button } from '@/components/ui/button';
import { getHealthTier } from '@/lib/format-health';
import { formatStars } from '@/components/ui/trend-arrow';
import { cn } from '@/lib/utils';

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

export function ToolCardCompact({ tool }: ToolCardCompactProps) {
  const tier = getHealthTier(tool.maintenance_score);

  return (
    <div className={cn('glass-card group relative flex flex-col gap-3 p-4 no-underline')}>
      {/* Top row: name + badges */}
      <div className="flex items-start justify-between gap-3">
        <Link
          href={`/tool/${tool.name}`}
          className="text-sm font-semibold text-foreground transition-colors group-hover:text-[var(--tp-accent)]"
        >
          {tool.display_name}
        </Link>
        <div className="flex shrink-0 items-center gap-1.5">
          <HealthTierBadge tier={tier} size="sm" />
        </div>
      </div>

      {/* Category */}
      <CategoryBadge category={tool.category} size="sm" className="w-fit" />

      {/* Description */}
      <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
        {tool.description}
      </p>

      {/* Footer: metadata + compare button */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-0.5">
            <StarIcon className="size-3 text-[var(--tp-health-slowing)]" aria-hidden="true" />
            {formatStars(tool.stars)}
          </span>
          {tool.language && <span>{tool.language}</span>}
          {tool.license && <span>{tool.license}</span>}
        </div>
        <Button
          variant="ghost"
          size="icon-xs"
          title={`Compare ${tool.display_name}`}
          nativeButton={false} render={<Link href={`/compare?a=${tool.name}`} />}
        >
          <GitCompareArrowsIcon className="size-3" />
        </Button>
      </div>
    </div>
  );
}
