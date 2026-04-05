'use client';

import { useState, useCallback } from 'react';
import { Loader2Icon, LayersIcon, SlidersHorizontalIcon, ShareIcon } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { EmptyState } from '@/components/ui/empty-state';
import { SkeletonCard } from '@/components/ui/skeleton';
import { getStack } from '@/lib/api-client';
import type { StackTool } from '@/lib/api-client';
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
  const [showFilters, setShowFilters] = useState(false);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
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
      if (res.data.tools.length > 0) {
        toast.success(`Found ${res.data.tools.length} tools for your stack`);
      }
    } else {
      setError(res.message);
      toast.error('Stack search failed');
    }
  }, [useCase, deployment, language, license]);

  const handleShare = useCallback(async () => {
    const params = new URLSearchParams({ use_case: useCase });
    if (language) params.set('language', language);
    if (license && license !== 'Any') params.set('license', license);
    if (deployment.length > 0) params.set('deployment', deployment.join(','));
    const url = `${window.location.origin}/stack?${params.toString()}`;
    await navigator.clipboard.writeText(url);
    toast.success('Link copied to clipboard');
  }, [useCase, language, license, deployment]);

  return (
    <div className="flex flex-col gap-8">
      {/* Form */}
      <form onSubmit={handleSubmit} className="glass-card p-6">
        <div className="flex flex-col gap-5">
          {/* Use case */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="use-case-input" className="text-sm font-medium text-foreground">
              What are you building?
            </Label>
            <textarea
              id="use-case-input"
              placeholder="Describe your project… e.g. AI-powered search engine with vector storage, TypeScript, edge deployment"
              value={useCase}
              onChange={(e) => setUseCase(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-input bg-transparent px-3 py-2.5 text-sm text-foreground outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 resize-none"
            />
          </div>

          {/* Refine toggle */}
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className="flex w-fit items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <SlidersHorizontalIcon className="size-3.5" />
            {showFilters ? 'Hide filters' : 'Refine with filters'}
          </button>

          {/* Constraints (collapsible) */}
          {showFilters && (
            <StackConstraints
              deployment={deployment}
              onDeploymentChange={setDeployment}
              language={language}
              onLanguageChange={setLanguage}
              license={license}
              onLicenseChange={setLicense}
            />
          )}

          {/* Submit */}
          <div className="flex items-center justify-between gap-3">
            <Button
              type="submit"
              disabled={!useCase.trim() || loading}
              className="w-full sm:w-auto"
            >
              {loading ? (
                <>
                  <Loader2Icon className="size-4 animate-spin" />
                  Finding tools…
                </>
              ) : (
                <>
                  <LayersIcon className="size-4" />
                  Find Stack
                </>
              )}
            </Button>

            {results.length > 0 && (
              <Button type="button" variant="ghost" size="sm" onClick={handleShare}>
                <ShareIcon className="size-3.5" />
                Share
              </Button>
            )}
          </div>
        </div>
      </form>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/8 px-4 py-3 text-sm text-destructive">
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
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Recommended Stack · {results.length} tool{results.length !== 1 ? 's' : ''}
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {results.map((tool, i) => (
              <div key={tool.name} className={`animate-fade-up-delay-${Math.min(i + 1, 4)}`}>
                <StackResultCard tool={tool} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!loading && searched && results.length === 0 && !error && (
        <EmptyState
          icon={<LayersIcon className="size-5" />}
          title="No tools found"
          description="Try a different description or adjust your constraints."
        />
      )}
    </div>
  );
}
