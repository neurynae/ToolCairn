'use client';

import { CategoryBadge } from '@/components/ui/category-badge';
import { GlassCard } from '@/components/ui/glass-card';
import { HealthTierBadge } from '@/components/ui/health-tier-badge';
import { ScoreBar } from '@/components/ui/score-bar';
import { TrendArrow, formatStars } from '@/components/ui/trend-arrow';
import { formatLastCommit } from '@/lib/format-health';
import type { FormattedResult } from '@/lib/format-results';

interface ResultCardProps {
  result: FormattedResult;
  label?: string;
}

export function ResultCard({ result, label }: ResultCardProps) {
  const { docs, health } = result;
  const isFeatured = label === 'Recommended';

  const docLinks = [
    { href: result.github_url, label: 'GitHub' },
    { href: docs.official, label: 'Docs' },
    { href: docs.api, label: 'API' },
    { href: docs.changelog, label: 'Changelog' },
  ].filter((l) => l.href);

  return (
    <GlassCard
      variant={isFeatured ? 'featured' : 'default'}
      padding="lg"
      className="flex flex-col gap-5"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-2">
          {label && (
            <span
              className="inline-block w-fit rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider"
              style={{
                background: isFeatured ? 'rgba(99, 102, 241, 0.15)' : 'rgba(245, 158, 11, 0.12)',
                color: isFeatured ? 'var(--color-accent)' : '#fbbf24',
              }}
            >
              {label}
            </span>
          )}
          <h3
            className="font-bold leading-tight"
            style={{
              fontSize: '1.375rem',
              letterSpacing: '-0.025em',
              color: 'var(--color-text-primary)',
            }}
          >
            {result.display_name}
          </h3>
          <div className="flex flex-wrap items-center gap-2">
            <CategoryBadge category={result.category} size="sm" />
            <HealthTierBadge tier={health.tier} size="sm" />
          </div>
        </div>
      </div>

      {/* Description */}
      <p style={{ fontSize: '15px', lineHeight: '1.5rem', color: 'var(--color-text-secondary)' }}>
        {result.description}
      </p>

      {/* Why this matches */}
      {result.reasons.length > 0 && (
        <div>
          <p
            className="mb-2 text-xs font-semibold uppercase tracking-wider"
            style={{ color: 'var(--color-text-muted)' }}
          >
            Why this matches
          </p>
          <ul
            className="flex flex-col gap-1.5 border-l-2 pl-3"
            style={{ borderColor: 'rgba(99, 102, 241, 0.25)' }}
          >
            {result.reasons.map((reason) => (
              <li
                key={reason}
                className="flex items-start gap-2 text-[13px]"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                <span
                  className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
                  style={{ background: 'var(--color-accent)', opacity: 0.7 }}
                />
                {reason}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Fit score */}
      <ScoreBar score={result.fit_score} showPercent />

      {/* Health stats — 3-column inset grid */}
      <div className="surface-inset grid grid-cols-3 gap-3 p-3">
        <div className="flex flex-col gap-0.5">
          <span className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>
            Stars
          </span>
          <span
            className="flex items-center gap-1 text-sm font-semibold"
            style={{ color: 'var(--color-text-primary)' }}
          >
            <StarIcon />
            {formatStars(health.stars)}
            <TrendArrow velocity={health.stars_velocity_90d} />
          </span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>
            Health
          </span>
          <span className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
            {Math.round(health.maintenance_score * 100)}%
          </span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>
            Last commit
          </span>
          <span className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
            {formatLastCommit(health.last_commit_date)}
          </span>
        </div>
      </div>

      {/* Secondary meta */}
      {(health.language ?? health.license) && (
        <p className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>
          {[health.language, health.license].filter(Boolean).join(' · ')}
        </p>
      )}

      {/* Doc links + profile CTA */}
      {docLinks.length > 0 && (
        <div
          className="flex flex-wrap items-center gap-3 border-t pt-4"
          style={{ borderColor: 'var(--color-border-subtle)' }}
        >
          {docLinks.map((link) => (
            <a
              key={link.label}
              href={link.href as string}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-medium transition-colors hover:text-[var(--color-text-secondary)]"
              style={{ color: 'var(--color-text-muted)' }}
            >
              {link.label} ↗
            </a>
          ))}
          <a
            href={`/tool/${result.tool}`}
            className="ml-auto inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-semibold transition-all duration-150 hover:bg-[rgba(99,102,241,0.12)]"
            style={{
              color: 'var(--color-accent)',
              border: '1px solid rgba(99, 102, 241, 0.25)',
              borderRadius: 'var(--radius-sm)',
            }}
          >
            View Profile →
          </a>
        </div>
      )}
    </GlassCard>
  );
}

/* ─── Inline Star Icon ───────────────────────────────────────────────── */

function StarIcon() {
  return (
    <svg
      width="12"
      height="12"
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
