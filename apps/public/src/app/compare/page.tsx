'use client';

import { useState, Suspense, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  GitCompareArrowsIcon,
  ArrowRightIcon,
  TrophyIcon,
  MinusIcon,
  CheckCircleIcon,
  XCircleIcon,
  HelpCircleIcon,
  AlertCircleIcon,
  ExternalLinkIcon,
  ShareIcon,
} from 'lucide-react';
import { toast } from 'sonner';
import { AmbientBackground } from '@/components/layout/ambient-background';
import { SiteHeader } from '@/components/layout/site-header';
import { SiteFooter } from '@/components/layout/site-footer';
import { ToolAutocomplete } from '@/components/compare/tool-autocomplete';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ScoreBar } from '@/components/ui/score-bar';
import { HealthTierBadge } from '@/components/ui/health-tier-badge';
import { getHealthTier, formatLastCommit } from '@/lib/format-health';
import { formatStars } from '@/components/ui/trend-arrow';
import { useCommandPalette } from '@/components/providers/command-palette-provider';
import { cn } from '@/lib/utils';

interface ComparisonResult {
  status: string;
  tool_a?: {
    name: string;
    display_name: string;
    description: string;
    github_url: string;
    health: {
      stars: number;
      maintenance_score: number;
      last_commit_date: string;
      open_issues: number;
      contributor_count: number;
    };
  };
  tool_b?: {
    name: string;
    display_name: string;
    description: string;
    github_url: string;
    health: {
      stars: number;
      maintenance_score: number;
      last_commit_date: string;
      open_issues: number;
      contributor_count: number;
    };
  };
  dimensions?: Array<{
    dimension: string;
    tool_a: number;
    tool_b: number;
    winner: string;
    note: string;
  }>;
  graph_relationship?: {
    compatibility_signal: string;
    edges: Array<{ type: string; direction: string; confidence: number }>;
  };
  recommendation?: 'tool_a' | 'tool_b' | 'either';
  dominant_winner?: string;
}

function CompatibilityBadge({ signal }: { signal: string }) {
  const config = {
    compatible: { icon: CheckCircleIcon, label: 'Compatible', className: 'text-[var(--tp-health-active)] bg-[var(--tp-health-active)]/10 border-[var(--tp-health-active)]/20' },
    conflicts: { icon: XCircleIcon, label: 'Conflicts', className: 'text-[var(--tp-health-at-risk)] bg-[var(--tp-health-at-risk)]/10 border-[var(--tp-health-at-risk)]/20' },
    requires: { icon: AlertCircleIcon, label: 'Requires', className: 'text-[var(--tp-health-slowing)] bg-[var(--tp-health-slowing)]/10 border-[var(--tp-health-slowing)]/20' },
    one_replaces_other: { icon: ArrowRightIcon, label: 'One replaces other', className: 'text-muted-foreground bg-muted border-border' },
    unknown: { icon: HelpCircleIcon, label: 'Unknown relationship', className: 'text-muted-foreground bg-muted border-border' },
  }[signal] ?? { icon: HelpCircleIcon, label: signal, className: 'text-muted-foreground bg-muted border-border' };

  const Icon = config.icon;
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-medium', config.className)}>
      <Icon className="size-4" />
      {config.label}
    </span>
  );
}

function CompareContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toggle } = useCommandPalette();

  const [toolA, setToolA] = useState(searchParams.get('a') ?? '');
  const [toolB, setToolB] = useState(searchParams.get('b') ?? '');
  const [useCase, setUseCase] = useState(searchParams.get('use_case') ?? '');
  const [result, setResult] = useState<ComparisonResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCompare = useCallback(async () => {
    if (!toolA.trim() || !toolB.trim()) return;
    setLoading(true);
    setError(null);

    // Update URL for shareability
    const params = new URLSearchParams({ a: toolA.trim(), b: toolB.trim() });
    if (useCase.trim()) params.set('use_case', useCase.trim());
    router.replace(`/compare?${params.toString()}`, { scroll: false });

    try {
      const res = await fetch('/api/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tool_a: toolA.trim(), tool_b: toolB.trim(), use_case: useCase.trim() || undefined }),
      });
      const data = (await res.json()) as { ok: boolean; data?: ComparisonResult; message?: string };
      if (data.ok && data.data) {
        setResult(data.data);
      } else {
        setError(data.message ?? 'Comparison failed');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [toolA, toolB, useCase, router]);

  // Auto-trigger if URL has params
  useEffect(() => {
    const a = searchParams.get('a');
    const b = searchParams.get('b');
    if (a && b) {
      setToolA(a);
      setToolB(b);
      void (async () => {
        setLoading(true);
        setError(null);
        try {
          const res = await fetch('/api/compare', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tool_a: a, tool_b: b, use_case: searchParams.get('use_case') ?? undefined }),
          });
          const data = (await res.json()) as { ok: boolean; data?: ComparisonResult; message?: string };
          if (data.ok && data.data) setResult(data.data);
          else setError(data.message ?? 'Comparison failed');
        } catch {
          setError('Network error.');
        } finally {
          setLoading(false);
        }
      })();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleShare = async () => {
    await navigator.clipboard.writeText(window.location.href);
    toast.success('Link copied to clipboard');
  };

  return (
    <section className="mx-auto max-w-5xl px-4 pb-20 pt-12 sm:px-6">
      {/* Page header */}
      <div className="mb-8">
        <div className="mb-2 flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <GitCompareArrowsIcon className="size-4" />
          Tool Comparison
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Compare Tools
        </h1>
        <p className="mt-2 text-muted-foreground">
          Side-by-side health metrics and compatibility analysis.
        </p>
      </div>

      {/* Input form */}
      <Card className="mb-8">
        <CardContent className="pt-4">
          <div className="grid gap-4 sm:grid-cols-[1fr_auto_1fr]">
            <ToolAutocomplete
              value={toolA}
              onChange={setToolA}
              placeholder="e.g. prisma"
              label="First tool"
            />
            <div className="flex items-end pb-0.5 sm:items-center sm:pb-0">
              <span className="text-muted-foreground font-medium text-sm">vs</span>
            </div>
            <ToolAutocomplete
              value={toolB}
              onChange={setToolB}
              placeholder="e.g. drizzle"
              label="Second tool"
            />
          </div>
          <div className="mt-3 flex items-center gap-3">
            <input
              type="text"
              value={useCase}
              onChange={(e) => setUseCase(e.target.value)}
              placeholder="Optional: use case context (e.g. edge runtime, TypeScript monorepo)"
              className="h-9 flex-1 rounded-lg border border-input bg-transparent px-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
            />
            <Button
              onClick={handleCompare}
              disabled={!toolA.trim() || !toolB.trim() || loading}
              className="shrink-0"
            >
              {loading ? 'Comparing...' : 'Compare'}
              {!loading && <ArrowRightIcon className="size-4" />}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Error */}
      {error && (
        <div className="mb-6 rounded-lg border border-destructive/20 bg-destructive/8 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Results */}
      {result?.status === 'complete' && result.tool_a && result.tool_b && (
        <div className="animate-fade-up flex flex-col gap-6">
          {/* Compatibility signal */}
          {result.graph_relationship && (
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <CompatibilityBadge signal={result.graph_relationship.compatibility_signal} />
                {result.graph_relationship.edges.length > 0 && (
                  <span className="text-xs text-muted-foreground">
                    {result.graph_relationship.edges.length} graph edge{result.graph_relationship.edges.length !== 1 ? 's' : ''} found
                  </span>
                )}
              </div>
              <Button variant="ghost" size="sm" onClick={handleShare}>
                <ShareIcon className="size-3.5" />
                Share
              </Button>
            </div>
          )}

          {/* Recommendation banner */}
          {result.recommendation && result.recommendation !== 'either' && (
            <div className="surface-featured rounded-xl p-4">
              <div className="flex items-center gap-2">
                <TrophyIcon className="size-5 text-[var(--tp-accent)]" />
                <p className="text-sm font-semibold text-foreground">
                  Recommendation:{' '}
                  <span className="text-[var(--tp-accent)]">
                    {result.recommendation === 'tool_a' ? result.tool_a.display_name : result.tool_b.display_name}
                  </span>
                </p>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Based on health scores, community size, and graph relationships.
              </p>
            </div>
          )}
          {result.recommendation === 'either' && (
            <div className="rounded-xl border border-border bg-muted/50 p-4">
              <p className="text-sm font-medium text-foreground">Either tool is a solid choice.</p>
              <p className="mt-1 text-xs text-muted-foreground">Both score similarly across dimensions. Choose based on your team's familiarity and ecosystem fit.</p>
            </div>
          )}

          {/* Side-by-side tool cards */}
          <div className="grid gap-4 sm:grid-cols-2">
            {([result.tool_a, result.tool_b] as const).map((tool, i) => {
              const isRecommended =
                (i === 0 && result.recommendation === 'tool_a') ||
                (i === 1 && result.recommendation === 'tool_b');
              const tier = getHealthTier(tool.health.maintenance_score);

              return (
                <Card key={tool.name} className={cn(isRecommended && 'ring-1 ring-[var(--tp-accent)]/40')}>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle>{tool.display_name}</CardTitle>
                      <div className="flex items-center gap-1.5">
                        {isRecommended && (
                          <Badge className="bg-[var(--tp-accent)]/15 text-[var(--tp-accent)] border-[var(--tp-accent)]/20">
                            Recommended
                          </Badge>
                        )}
                        <HealthTierBadge tier={tier} size="sm" />
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">{tool.description}</p>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-3">
                    <ScoreBar score={tool.health.maintenance_score} label="Health Score" showPercent />
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-muted-foreground">Stars</span>
                        <p className="font-semibold text-foreground">{formatStars(tool.health.stars)}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Contributors</span>
                        <p className="font-semibold text-foreground">{tool.health.contributor_count}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Open Issues</span>
                        <p className="font-semibold text-foreground">{tool.health.open_issues}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Last Commit</span>
                        <p className="font-semibold text-foreground">{formatLastCommit(tool.health.last_commit_date)}</p>
                      </div>
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <a
                        href={tool.github_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                      >
                        GitHub <ExternalLinkIcon className="size-3" />
                      </a>
                      <Button variant="ghost" size="xs" nativeButton={false} render={<a href={`/tool/${tool.name}`} />}>
                        View Profile
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Dimension comparison table */}
          {result.dimensions && result.dimensions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Dimension Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-3">
                  {result.dimensions.map((dim) => {
                    const aWins = dim.winner === result.tool_a?.name;
                    const bWins = dim.winner === result.tool_b?.name;
                    const maxVal = Math.max(dim.tool_a, dim.tool_b, 1);

                    return (
                      <div key={dim.dimension} className="flex flex-col gap-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-medium text-foreground">{dim.dimension}</span>
                          <span className="text-muted-foreground">{dim.note}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="flex items-center gap-2">
                            {aWins && <TrophyIcon className="size-3 shrink-0 text-[var(--tp-accent)]" />}
                            {!aWins && <MinusIcon className="size-3 shrink-0 text-muted-foreground/40" />}
                            <div className="flex-1">
                              <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                                <div
                                  className={cn('h-full rounded-full transition-all', aWins ? 'bg-[var(--tp-accent)]' : 'bg-muted-foreground/30')}
                                  style={{ width: `${(dim.tool_a / maxVal) * 100}%` }}
                                />
                              </div>
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {typeof dim.tool_a === 'number' && dim.tool_a < 2 ? `${Math.round(dim.tool_a * 100)}%` : formatStars(dim.tool_a)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            {bWins && <TrophyIcon className="size-3 shrink-0 text-[var(--tp-accent)]" />}
                            {!bWins && <MinusIcon className="size-3 shrink-0 text-muted-foreground/40" />}
                            <div className="flex-1">
                              <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                                <div
                                  className={cn('h-full rounded-full transition-all', bWins ? 'bg-[var(--tp-accent)]' : 'bg-muted-foreground/30')}
                                  style={{ width: `${(dim.tool_b / maxVal) * 100}%` }}
                                />
                              </div>
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {typeof dim.tool_b === 'number' && dim.tool_b < 2 ? `${Math.round(dim.tool_b * 100)}%` : formatStars(dim.tool_b)}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Not indexed state */}
      {result?.status === 'not_indexed' && (
        <div className="rounded-xl border border-[var(--tp-health-slowing)]/30 bg-[var(--tp-health-slowing)]/8 p-6 text-center">
          <p className="font-medium text-foreground">Tools not yet indexed</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Indexing has been triggered for both tools. Results will be available in ~2 minutes. Try again shortly.
          </p>
        </div>
      )}
    </section>
  );
}

export default function ComparePage() {
  const { toggle } = useCommandPalette();
  return (
    <>
      <AmbientBackground />
      <div className="flex min-h-dvh flex-col">
        <SiteHeader onOpenSearch={toggle} />
        <main className="flex-1">
          <Suspense>
            <CompareContent />
          </Suspense>
        </main>
        <SiteFooter />
      </div>
    </>
  );
}
