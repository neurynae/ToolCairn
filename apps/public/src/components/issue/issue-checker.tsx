'use client';

import { EmptyState } from '@/components/ui/empty-state';
import { SkeletonCard } from '@/components/ui/skeleton';
import { checkIssue } from '@/lib/api-client';
import type { IssueMatch } from '@/lib/api-client';
import { useState } from 'react';
import { IssueMatchCard } from './issue-match-card';

interface IssueCheckerProps {
  toolName?: string;
}

type IssueStatus = 'confirmed_known_issue' | 'possibly_related' | 'unreported';

export function IssueChecker({ toolName: initialToolName }: IssueCheckerProps) {
  const [toolName, setToolName] = useState(initialToolName ?? '');
  const [issueDescription, setIssueDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [matches, setMatches] = useState<IssueMatch[]>([]);
  const [status, setStatus] = useState<IssueStatus | null>(null);
  const [searched, setSearched] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!toolName.trim() || !issueDescription.trim()) return;

    setLoading(true);
    setError('');
    setMatches([]);
    setStatus(null);
    setSearched(true);

    const res = await checkIssue(toolName.trim(), issueDescription.trim());

    setLoading(false);

    if (res.ok) {
      setMatches(res.data.matches);
      setStatus(res.data.status);
    } else {
      setError(res.message);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Tool name input */}
        {!initialToolName && (
          <div className="flex flex-col gap-2">
            <label
              htmlFor="issue-tool-name"
              className="text-xs font-semibold uppercase tracking-wider"
              style={{ color: 'var(--tp-text-muted)' }}
            >
              Tool Name
            </label>
            <input
              id="issue-tool-name"
              type="text"
              placeholder="e.g. qdrant, prisma, langchain"
              value={toolName}
              onChange={(e) => setToolName(e.target.value)}
              className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-colors"
              style={{
                background: 'var(--tp-surface-1)',
                color: 'var(--tp-text-primary)',
                border: '1px solid var(--tp-border-subtle)',
              }}
            />
          </div>
        )}

        {/* Issue description */}
        <div className="flex flex-col gap-2">
          <label
            htmlFor="issue-description"
            className="text-xs font-semibold uppercase tracking-wider"
            style={{ color: 'var(--tp-text-muted)' }}
          >
            Describe the Issue
          </label>
          <textarea
            id="issue-description"
            placeholder="Describe the problem you're experiencing…"
            value={issueDescription}
            onChange={(e) => setIssueDescription(e.target.value)}
            rows={3}
            className="w-full resize-y rounded-xl px-4 py-3 text-sm outline-none transition-colors"
            style={{
              background: 'var(--tp-surface-1)',
              color: 'var(--tp-text-primary)',
              border: '1px solid var(--tp-border-subtle)',
            }}
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={!toolName.trim() || !issueDescription.trim() || loading}
          className="inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white transition-all disabled:cursor-not-allowed disabled:opacity-50"
          style={{ background: 'var(--tp-accent)' }}
        >
          {loading ? (
            <>
              <Spinner />
              Checking…
            </>
          ) : (
            'Check Issue'
          )}
        </button>
      </form>

      {/* Error */}
      {error && (
        <div
          className="rounded-lg px-4 py-3 text-sm"
          style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#f87171' }}
        >
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex flex-col gap-3">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      )}

      {/* Results */}
      {!loading && status && matches.length > 0 && (
        <div className="flex flex-col gap-3">
          {matches.map((match) => (
            <IssueMatchCard key={match.issue_number} match={match} status={status} />
          ))}
        </div>
      )}

      {/* Unreported */}
      {!loading && searched && status === 'unreported' && matches.length === 0 && !error && (
        <EmptyState
          title="No matching issues found"
          description="This issue appears to be unreported. Consider opening a new issue on the tool's GitHub repository."
        />
      )}
    </div>
  );
}

function Spinner() {
  return (
    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}
