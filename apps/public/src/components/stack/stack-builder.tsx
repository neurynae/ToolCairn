'use client';

import { EmptyState } from '@/components/ui/empty-state';
import { SkeletonCard } from '@/components/ui/skeleton';
import { getStack } from '@/lib/api-client';
import type { StackTool } from '@/lib/api-client';
import { useState } from 'react';
import { StackConstraints } from './stack-constraints';
import { StackResultCard } from './stack-result-card';

export function StackBuilder() {
  const [useCase, setUseCase] = useState('');
  const [deployment, setDeployment] = useState<string[]>([]);
  const [language, setLanguage] = useState('');
  const [license, setLicense] = useState('');
  const [results, setResults] = useState<StackTool[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!useCase.trim()) return;

    setLoading(true);
    setError('');
    setResults([]);
    setSearched(true);

    const constraints: Record<string, string> = {};
    if (deployment.length > 0) constraints.deployment_model = deployment.join(',');
    if (language) constraints.language = language;
    if (license && license !== 'Any') constraints.license = license;

    const res = await getStack(
      useCase.trim(),
      Object.keys(constraints).length > 0 ? constraints : undefined,
    );

    setLoading(false);

    if (res.ok) {
      setResults(res.data.tools);
    } else {
      setError(res.message);
    }
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Search form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {/* Use case input */}
        <div className="flex flex-col gap-2">
          <label
            htmlFor="use-case-input"
            className="text-xs font-semibold uppercase tracking-wider"
            style={{ color: 'var(--color-text-muted)' }}
          >
            What are you building?
          </label>
          <input
            id="use-case-input"
            type="text"
            placeholder="Describe what you're building… e.g. AI-powered search engine"
            value={useCase}
            onChange={(e) => setUseCase(e.target.value)}
            className="w-full rounded-xl px-5 py-3.5 text-base outline-none transition-colors"
            style={{
              background: 'var(--color-surface-1)',
              color: 'var(--color-text-primary)',
              border: '1px solid var(--color-border-subtle)',
            }}
          />
        </div>

        {/* Constraints */}
        <StackConstraints
          deployment={deployment}
          onDeploymentChange={setDeployment}
          language={language}
          onLanguageChange={setLanguage}
          license={license}
          onLicenseChange={setLicense}
        />

        {/* Submit */}
        <button
          type="submit"
          disabled={!useCase.trim() || loading}
          className="inline-flex items-center justify-center gap-2 rounded-xl px-8 py-3 text-sm font-semibold text-white transition-all disabled:cursor-not-allowed disabled:opacity-50"
          style={{
            background: 'var(--color-accent)',
          }}
        >
          {loading ? (
            <>
              <Spinner />
              Finding tools…
            </>
          ) : (
            'Find Stack'
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

      {/* Loading skeletons */}
      {loading && (
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, idx) => (
            <SkeletonCard key={`skeleton-${idx.toString()}`} />
          ))}
        </div>
      )}

      {/* Results */}
      {!loading && results.length > 0 && (
        <div className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>
            Recommended Stack ({results.length} tool{results.length !== 1 ? 's' : ''})
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {results.map((tool) => (
              <StackResultCard key={tool.name} tool={tool} />
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!loading && searched && results.length === 0 && !error && (
        <EmptyState
          title="No tools found"
          description="Try a different description or adjust your constraints."
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
