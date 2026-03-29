'use client';

import { useCallback, useState } from 'react';
import { checkIssue } from '@/lib/api-client';
import type { IssueCheckResponse } from '@/lib/api-client';

interface ToolIssueEmbedProps {
  toolName: string;
}

const statusConfig = {
  confirmed_known_issue: { label: 'Known Issue', color: '#ef4444' },
  possibly_related: { label: 'Possibly Related', color: '#f59e0b' },
  unreported: { label: 'Unreported', color: '#10b981' },
} as const;

export function ToolIssueEmbed({ toolName }: ToolIssueEmbedProps) {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<
    Extract<IssueCheckResponse, { ok: true }>['data'] | null
  >(null);
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
    <section className="flex flex-col gap-4">
      <h2
        className="text-sm font-semibold uppercase tracking-wider"
        style={{ color: 'var(--color-text-muted)' }}
      >
        Issue Checker
      </h2>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Describe your issue…"
          className="flex-1 rounded-lg px-3 py-2 text-sm outline-none transition-colors"
          style={{
            background: 'var(--color-surface-1)',
            color: 'var(--color-text-primary)',
            border: '1px solid var(--color-border-subtle)',
          }}
        />
        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="rounded-lg px-4 py-2 text-sm font-medium transition-all duration-150 disabled:opacity-50"
          style={{ background: 'var(--color-accent)', color: '#fff' }}
        >
          {loading ? 'Checking…' : 'Check'}
        </button>
      </form>

      {/* Results */}
      {result && (
        <div
          className="flex flex-col gap-2 rounded-lg p-4"
          style={{
            background: 'var(--color-surface-1)',
            border: '1px solid var(--color-border-subtle)',
          }}
        >
          <div className="flex items-center gap-2">
            <span
              className="inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold"
              style={{
                background: `${statusConfig[result.status].color}22`,
                color: statusConfig[result.status].color,
              }}
            >
              {statusConfig[result.status].label}
            </span>
          </div>

          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            {result.message}
          </p>

          {result.top_match && (
            <a
              href={result.top_match.github_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-medium transition-colors"
              style={{ color: 'var(--color-accent)' }}
            >
              #{result.top_match.issue_number} — {result.top_match.title} ↗
            </a>
          )}

          <a
            href={`/tool/${encodeURIComponent(toolName)}/issues`}
            className="mt-1 text-xs font-medium"
            style={{ color: 'var(--color-accent)' }}
          >
            Full issue diagnosis →
          </a>
        </div>
      )}

      {error && (
        <p className="text-sm" style={{ color: '#ef4444' }}>
          {error}
        </p>
      )}
    </section>
  );
}
