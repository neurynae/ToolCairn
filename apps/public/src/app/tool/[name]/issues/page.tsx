'use client';

import { useCallback, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { checkIssue } from '@/lib/api-client';
import type { IssueMatch, IssueCheckResponse } from '@/lib/api-client';

const statusConfig = {
  confirmed_known_issue: { label: 'Known Issue', color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
  possibly_related: { label: 'Possibly Related', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
  unreported: { label: 'Unreported', color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
} as const;

export default function ToolIssuesPage() {
  const params = useParams<{ name: string }>();
  const toolName = decodeURIComponent(params.name);

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
    <main
      className="mx-auto flex max-w-3xl flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8"
      style={{ color: 'var(--tp-text-primary)' }}
    >
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--tp-text-muted)' }}>
        <Link
          href={`/tool/${encodeURIComponent(toolName)}`}
          className="transition-colors"
          style={{ color: 'var(--tp-accent)' }}
        >
          {toolName}
        </Link>
        <span>/</span>
        <span>Issues</span>
      </div>

      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1
          className="text-2xl font-bold tracking-tight"
          style={{ color: 'var(--tp-text-primary)' }}
        >
          Issue Diagnosis
        </h1>
        <p className="text-sm" style={{ color: 'var(--tp-text-secondary)' }}>
          Describe your issue and we&apos;ll check if it&apos;s a known problem with{' '}
          <strong>{toolName}</strong>.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <textarea
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Describe the issue you're experiencing…"
          rows={4}
          className="w-full rounded-lg px-4 py-3 text-sm outline-none transition-colors"
          style={{
            background: 'var(--tp-surface-1)',
            color: 'var(--tp-text-primary)',
            border: '1px solid var(--tp-border-subtle)',
            resize: 'vertical',
          }}
        />
        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="w-fit rounded-lg px-6 py-2.5 text-sm font-medium transition-all duration-150 disabled:opacity-50"
          style={{ background: 'var(--tp-accent)', color: '#fff' }}
        >
          {loading ? 'Checking…' : 'Check Issue'}
        </button>
      </form>

      {/* Error */}
      {error && (
        <p className="text-sm" style={{ color: '#ef4444' }}>
          {error}
        </p>
      )}

      {/* Results */}
      {result && (
        <div className="flex flex-col gap-6">
          {/* Status */}
          <div
            className="flex items-center gap-3 rounded-lg p-4"
            style={{
              background: statusConfig[result.status].bg,
              border: `1px solid ${statusConfig[result.status].color}33`,
            }}
          >
            <span
              className="rounded-full px-3 py-1 text-xs font-bold"
              style={{
                background: `${statusConfig[result.status].color}22`,
                color: statusConfig[result.status].color,
              }}
            >
              {statusConfig[result.status].label}
            </span>
            <p className="text-sm" style={{ color: 'var(--tp-text-secondary)' }}>
              {result.message}
            </p>
          </div>

          {/* Match Cards */}
          {result.matches.length > 0 && (
            <div className="flex flex-col gap-3">
              <h2
                className="text-sm font-semibold uppercase tracking-wider"
                style={{ color: 'var(--tp-text-muted)' }}
              >
                Matching Issues ({result.matches.length})
              </h2>

              {result.matches.map((match) => (
                <IssueMatchCard key={match.issue_number} match={match} />
              ))}
            </div>
          )}
        </div>
      )}
    </main>
  );
}

function IssueMatchCard({ match }: { match: IssueMatch }) {
  const stateColor = match.state === 'open' ? '#10b981' : '#6b7280';

  return (
    <a
      href={match.github_url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex flex-col gap-2 rounded-lg p-4 transition-colors duration-150 hover:brightness-110"
      style={{
        background: 'var(--tp-surface-1)',
        border: '1px solid var(--tp-border-subtle)',
      }}
    >
      <div className="flex items-center gap-2">
        <span
          className="rounded-full px-2 py-0.5 text-[11px] font-semibold"
          style={{ background: `${stateColor}22`, color: stateColor }}
        >
          {match.state}
        </span>
        <span className="text-xs" style={{ color: 'var(--tp-text-muted)' }}>
          #{match.issue_number}
        </span>
        <span className="ml-auto text-xs" style={{ color: 'var(--tp-text-muted)' }}>
          {Math.round(match.similarity * 100)}% match
        </span>
      </div>

      <span className="text-sm font-medium" style={{ color: 'var(--tp-text-primary)' }}>
        {match.title}
      </span>

      {match.labels.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {match.labels.map((label) => (
            <span
              key={label}
              className="rounded-full px-2 py-0.5 text-[10px] font-medium"
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
    </a>
  );
}
