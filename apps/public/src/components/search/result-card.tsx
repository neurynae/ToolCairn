'use client';

import Link from 'next/link';
import { ExternalLinkIcon, ArrowRightIcon, GitCompareArrowsIcon, StarIcon } from 'lucide-react';
import { CategoryBadge } from '@/components/ui/category-badge';
import { HealthTierBadge } from '@/components/ui/health-tier-badge';
import { ScoreBar } from '@/components/ui/score-bar';
import { TrendArrow, formatStars } from '@/components/ui/trend-arrow';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { formatLastCommit } from '@/lib/format-health';
import { cn } from '@/lib/utils';
import type { FormattedResult } from '@/lib/format-results';

interface ResultCardProps {
  result: FormattedResult;
  label?: string;
}

export function ResultCard({ result, label }: ResultCardProps) {
  const { docs, health } = result;
  const isFeatured = label === 'Recommended';

  const docLinks = [
    { href: docs.official, label: 'Docs' },
    { href: docs.api, label: 'API' },
    { href: docs.changelog, label: 'Changelog' },
    { href: result.github_url, label: 'GitHub' },
  ].filter((l) => l.href);

  return (
    <div
      className={cn(
        'flex flex-col gap-5 rounded-xl p-6',
        isFeatured ? 'surface-featured' : 'glass-card',
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-2">
          {label && (
            <Badge
              variant={isFeatured ? 'default' : 'secondary'}
              className={cn(
                'w-fit rounded-full text-[11px] uppercase tracking-wider',
                isFeatured
                  ? 'bg-[var(--tp-accent)]/15 text-[var(--tp-accent)] border-[var(--tp-accent)]/20'
                  : 'bg-[var(--tp-health-slowing)]/15 text-[var(--tp-health-slowing)] border-[var(--tp-health-slowing)]/20',
              )}
            >
              {label}
            </Badge>
          )}
          <h3 className="text-2xl font-bold leading-tight tracking-tight text-foreground">
            {result.display_name}
          </h3>
          <div className="flex flex-wrap items-center gap-2">
            <CategoryBadge category={result.category} size="sm" />
            <HealthTierBadge tier={health.tier} size="sm" />
          </div>
        </div>
      </div>

      {/* Description */}
      <p className="text-[15px] leading-relaxed text-muted-foreground">{result.description}</p>

      {/* Why this matches */}
      {result.reasons.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Why this matches
          </p>
          <ul className="flex flex-col gap-1.5 border-l-2 border-[var(--tp-accent)]/25 pl-3">
            {result.reasons.map((reason) => (
              <li
                key={reason}
                className="flex items-start gap-2 text-[13px] text-muted-foreground"
              >
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--tp-accent)] opacity-70" />
                {reason}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Fit score */}
      <ScoreBar score={result.fit_score} showPercent />

      {/* Health stats grid */}
      <div className="surface-inset grid grid-cols-3 gap-3 p-3">
        <div className="flex flex-col gap-0.5">
          <span className="text-[11px] text-muted-foreground">Stars</span>
          <span className="flex items-center gap-1 text-sm font-semibold text-foreground">
            <StarIcon className="size-3 text-[var(--tp-health-slowing)]" aria-hidden="true" />
            {formatStars(health.stars)}
            <TrendArrow velocity={health.stars_velocity_90d} />
          </span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-[11px] text-muted-foreground">Health</span>
          <span className="text-sm font-semibold text-foreground">
            {Math.round(health.maintenance_score * 100)}%
          </span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-[11px] text-muted-foreground">Last commit</span>
          <span className="text-sm font-semibold text-foreground">
            {formatLastCommit(health.last_commit_date)}
          </span>
        </div>
      </div>

      {/* Secondary meta */}
      {(health.language ?? health.license) && (
        <p className="text-[11px] text-muted-foreground">
          {[health.language, health.license].filter(Boolean).join(' · ')}
        </p>
      )}

      {/* Actions */}
      <div>
        <Separator className="mb-4" />
        <div className="flex flex-wrap items-center gap-2">
          {docLinks.map((link) => (
            <a
              key={link.label}
              href={link.href as string}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
              <ExternalLinkIcon className="size-3" />
            </a>
          ))}
          <div className="ml-auto flex items-center gap-2">
            <Button variant="outline" size="sm" nativeButton={false} render={<Link href={`/compare?a=${result.tool}`} />}>
              <GitCompareArrowsIcon className="size-3.5" />
              Compare
            </Button>
            <Button size="sm" nativeButton={false} render={<Link href={`/tool/${result.tool}`} />}>
              View Profile
              <ArrowRightIcon className="size-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
