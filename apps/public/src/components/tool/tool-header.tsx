'use client';

import Link from 'next/link';
import { GithubIcon, GitCompareArrowsIcon, ShareIcon, ArrowLeftIcon } from 'lucide-react';
import { toast } from 'sonner';
import { CategoryBadge } from '@/components/ui/category-badge';
import { HealthTierBadge } from '@/components/ui/health-tier-badge';
import { Button } from '@/components/ui/button';
import type { HealthTier } from '@/lib/format-health';

interface ToolHeaderProps {
  name: string;
  displayName: string;
  category: string;
  githubUrl: string;
  tier: HealthTier;
}

export function ToolHeader({ name, displayName, category, githubUrl, tier }: ToolHeaderProps) {
  const handleShare = async () => {
    await navigator.clipboard.writeText(window.location.href);
    toast.success('Link copied to clipboard');
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Breadcrumb */}
      <div>
        <Link
          href="/explore"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeftIcon className="size-3" />
          Explore
        </Link>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {displayName}
          </h1>
          <div className="flex flex-wrap items-center gap-2">
            <CategoryBadge category={category} />
            <HealthTierBadge tier={tier} />
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="ghost" size="sm" onClick={handleShare} aria-label="Share tool profile">
            <ShareIcon className="size-3.5" />
            Share
          </Button>
          <Button variant="outline" size="sm" nativeButton={false} render={<Link href={`/compare?a=${name}`} />}>
            <GitCompareArrowsIcon className="size-3.5" />
            Compare
          </Button>
          <Button variant="outline" size="sm" nativeButton={false} render={<a href={githubUrl} target="_blank" rel="noopener noreferrer" />}>
            <GithubIcon className="size-3.5" />
            GitHub
          </Button>
        </div>
      </div>
    </div>
  );
}
