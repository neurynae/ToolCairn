'use client';

import { GlassCard } from '@/components/ui/glass-card';
import type { IssueMatch } from '@/lib/api-client';
import { useState } from 'react';

type IssueStatus = 'confirmed_known_issue' | 'possibly_related' | 'unreported';

interface IssueMatchCardProps {
  match: IssueMatch;
  status: IssueStatus;
}

const STATUS_CONFIG: Record<IssueStatus, { label: string; color: string; bg: string }> = {
  confirmed_known_issue: {
    label: 'Known Issue',
    color: '#34d399',
    bg: 'rgba(52, 211, 153, 0.1)',
  },
  possibly_related: {
    label: 'Possibly Related',
    color: '#fbbf24',
    bg: 'rgba(251, 191, 36, 0.1)',
  },
  unreported: {
    label: 'No Matches Found',
    color: 'var(--tp-text-muted)',
    bg: 'var(--tp-surface-1)',
  },
};

export function IssueMatchCard({ match, status }: IssueMatchCardProps) {
  const config = STATUS_CONFIG[status];
  const [linkHovered, setLinkHovered] = useState(false);
  const similarity = Math.round(match.similarity * 100);

  return (
    <GlassCard padding="md" className="flex flex-col gap-3">
      {/* Status + similarity */}
      <div className="flex items-center justify-between gap-3">
        <span
          className="rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider"
          style={{ background: config.bg, color: config.color }}
        >
          {config.label}
        </span>
        <span className="text-xs font-medium" style={{ color: 'var(--tp-text-muted)' }}>
          {similarity}% match
        </span>
      </div>

      {/* Issue title + number */}
      <div>
        <h3 className="text-sm font-semibold" style={{ color: 'var(--tp-text-primary)' }}>
          #{match.issue_number}: {match.title}
        </h3>
        <span
          className="mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-medium uppercase"
          style={{
            background:
              match.state === 'open' ? 'rgba(52, 211, 153, 0.1)' : 'rgba(139, 92, 246, 0.1)',
            color: match.state === 'open' ? '#34d399' : '#a78bfa',
          }}
        >
          {match.state}
        </span>
      </div>

      {/* Labels */}
      {match.labels.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {match.labels.map((label) => (
            <span
              key={label}
              className="rounded-md px-2 py-0.5 text-[10px] font-medium"
              style={{
                background: 'var(--tp-surface-2)',
                color: 'var(--tp-text-muted)',
              }}
            >
              {label}
            </span>
          ))}
        </div>
      )}

      {/* Link */}
      <a
        href={match.github_url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-xs font-medium transition-colors"
        style={{
          color: linkHovered ? 'var(--tp-accent-hover)' : 'var(--tp-accent)',
        }}
        onMouseEnter={() => setLinkHovered(true)}
        onMouseLeave={() => setLinkHovered(false)}
      >
        View on GitHub ↗
      </a>
    </GlassCard>
  );
}
