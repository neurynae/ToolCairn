'use client';

import { useCallback, useState } from 'react';
import { Loader2Icon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { checkIssue } from '@/lib/api-client';
import type { IssueCheckResponse } from '@/lib/api-client';
import { cn } from '@/lib/utils';

interface ToolIssueEmbedProps {
  toolName: string;
}

const statusConfig = {
  confirmed_known_issue: {
    label: 'Known Issue',
    className: 'bg-[var(--tp-health-at-risk)]/15 text-[var(--tp-health-at-risk)] border-[var(--tp-health-at-risk)]/25',
  },
  possibly_related: {
    label: 'Possibly Related',
    className: 'bg-[var(--tp-health-slowing)]/15 text-[var(--tp-health-slowing)] border-[var(--tp-health-slowing)]/25',
  },
  unreported: {
    label: 'Unreported',
    className: 'bg-[var(--tp-health-active)]/15 text-[var(--tp-health-active)] border-[var(--tp-health-active)]/25',
  },
} as const;

export function ToolIssueEmbed({ toolName }: ToolIssueEmbedProps) {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Extract<IssueCheckResponse, { ok: true }>['data'] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const trimmed = query.trim();
      if (!trimmed) return;

      setLoading(true);
      setResult(null);
      setError(null);

      try {
        const res = await checkIssue(toolName, trimmed);
        if (res.ok) {
          setResult(res.data);
        } else {
          setError(res.message);
        }
      } catch {
        setError('Failed to check issue. Please try again.');
      } finally {
        setLoading(false);
      }
    },
    [query, toolName],
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Issue Checker
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Describe your issue to find related GitHub issues for this tool.
        </p>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Describe your issue…"
            className="h-9 flex-1 rounded-lg border border-input bg-transparent px-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
          />
          <Button type="submit" size="sm" disabled={loading || !query.trim()}>
            {loading ? <Loader2Icon className="size-4 animate-spin" /> : 'Check'}
          </Button>
        </form>

        {/* Results */}
        {result && (
          <div className="flex flex-col gap-2 rounded-lg border border-border bg-muted/30 p-4">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold',
                  statusConfig[result.status]?.className ?? 'bg-muted text-muted-foreground',
                )}
              >
                {statusConfig[result.status]?.label ?? result.status}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">{result.message}</p>
            {result.top_match && (
              <a
                href={result.top_match.github_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-medium text-[var(--tp-accent)] transition-colors hover:underline"
              >
                #{result.top_match.issue_number} — {result.top_match.title} ↗
              </a>
            )}
            <a
              href={`/tool/${encodeURIComponent(toolName)}/issues`}
              className="mt-1 text-xs font-medium text-[var(--tp-accent)] transition-colors hover:underline"
            >
              Full issue diagnosis →
            </a>
          </div>
        )}

        {error && <p className="text-sm text-destructive">{error}</p>}
      </CardContent>
    </Card>
  );
}
