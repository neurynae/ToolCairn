'use client';

import { EmptyState } from '@/components/ui/empty-state';
import { SkeletonCard } from '@/components/ui/skeleton';
import { useEffect, useState } from 'react';
import { ToolCardCompact } from './tool-card-compact';

interface ToolData {
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

interface ToolListProps {
  category: string | null;
}

export function ToolList({ category }: ToolListProps) {
  const [tools, setTools] = useState<ToolData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!category) {
      setTools([]);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError('');

    fetch(`/api/tools?category=${encodeURIComponent(category)}`)
      .then((res) => res.json())
      .then((data: { ok: boolean; data?: { tools: ToolData[] }; message?: string }) => {
        if (cancelled) return;
        if (data.ok && data.data) {
          setTools(data.data.tools);
        } else {
          setError(data.message ?? 'Failed to load tools');
        }
      })
      .catch(() => {
        if (!cancelled) setError('Failed to load tools');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [category]);

  if (!category) return null;

  if (loading) {
    return (
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, idx) => (
          <SkeletonCard key={`skeleton-${idx.toString()}`} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="rounded-lg px-4 py-3 text-sm"
        style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#f87171' }}
      >
        {error}
      </div>
    );
  }

  if (tools.length === 0) {
    return (
      <EmptyState
        title="No tools found"
        description={`No tools found in the "${category}" category yet.`}
      />
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {tools.map((tool) => (
        <ToolCardCompact key={tool.name} tool={tool} />
      ))}
    </div>
  );
}
