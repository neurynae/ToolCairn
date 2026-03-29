import Link from 'next/link';
import { CategoryBadge } from '@/components/ui/category-badge';
import { HealthTierBadge } from '@/components/ui/health-tier-badge';
import type { HealthTier } from '@/lib/format-health';

interface ToolHeaderProps {
  name: string;
  displayName: string;
  category: string;
  githubUrl: string;
  tier: HealthTier;
}

export function ToolHeader({ displayName, category, githubUrl, tier }: ToolHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-col gap-2">
        <h1
          className="text-3xl font-bold tracking-tight"
          style={{ color: 'var(--color-text-primary)' }}
        >
          {displayName}
        </h1>
        <div className="flex flex-wrap items-center gap-2">
          <CategoryBadge category={category} />
          <HealthTierBadge tier={tier} />
        </div>
      </div>

      <Link
        href={githubUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex w-fit items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-150 hover:brightness-125"
        style={{
          background: 'var(--color-surface-2)',
          color: 'var(--color-text-primary)',
          border: '1px solid var(--color-border-subtle)',
        }}
      >
        <GitHubIcon />
        View on GitHub
      </Link>
    </div>
  );
}

function GitHubIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
    </svg>
  );
}
