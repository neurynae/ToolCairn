'use client';

import { useState, Suspense, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  ZapIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  XCircleIcon,
  AlertCircleIcon,
  HelpCircleIcon,
  ShareIcon,
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { AmbientBackground } from '@/components/layout/ambient-background';
import { SiteHeader } from '@/components/layout/site-header';
import { SiteFooter } from '@/components/layout/site-footer';
import { ToolAutocomplete } from '@/components/compare/tool-autocomplete';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useCommandPalette } from '@/components/providers/command-palette-provider';
import { cn } from '@/lib/utils';

interface CompatibilityResult {
  status: string;
  confidence?: number;
  signals?: string[];
  recommendation?: string;
}

const STATUS_CONFIG = {
  compatible: {
    icon: CheckCircleIcon,
    label: 'Compatible',
    description: 'These tools work well together.',
    className: 'text-[var(--tp-health-active)] bg-[var(--tp-health-active)]/10 border-[var(--tp-health-active)]/20',
  },
  conflicts: {
    icon: XCircleIcon,
    label: 'Conflicts',
    description: 'These tools have known conflicts.',
    className: 'text-[var(--tp-health-at-risk)] bg-[var(--tp-health-at-risk)]/10 border-[var(--tp-health-at-risk)]/20',
  },
  requires: {
    icon: AlertCircleIcon,
    label: 'Requires',
    description: 'One of these tools requires the other.',
    className: 'text-[var(--tp-health-slowing)] bg-[var(--tp-health-slowing)]/10 border-[var(--tp-health-slowing)]/20',
  },
  unknown: {
    icon: HelpCircleIcon,
    label: 'Unknown',
    description: 'No relationship data found. This could mean they are compatible but untested together.',
    className: 'text-muted-foreground bg-muted border-border',
  },
};

function CompatibilityContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toggle } = useCommandPalette();

  const [toolA, setToolA] = useState(searchParams.get('a') ?? '');
  const [toolB, setToolB] = useState(searchParams.get('b') ?? '');
  const [result, setResult] = useState<CompatibilityResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runCheck = useCallback(async (a: string, b: string) => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch('/api/compatibility', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tool_a: a, tool_b: b }),
      });
      const data = (await res.json()) as { ok: boolean; data?: CompatibilityResult; message?: string };
      if (data.ok && data.data) setResult(data.data);
      else setError(data.message ?? 'Check failed');
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleCheck = useCallback(async () => {
    if (!toolA.trim() || !toolB.trim()) return;
    router.replace(`/compatibility?a=${encodeURIComponent(toolA.trim())}&b=${encodeURIComponent(toolB.trim())}`, { scroll: false });
    await runCheck(toolA.trim(), toolB.trim());
  }, [toolA, toolB, router, runCheck]);

  useEffect(() => {
    const a = searchParams.get('a');
    const b = searchParams.get('b');
    if (a && b) {
      setToolA(a);
      setToolB(b);
      void runCheck(a, b);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const statusConfig = result?.status ? STATUS_CONFIG[result.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.unknown : null;
  const StatusIcon = statusConfig?.icon ?? HelpCircleIcon;

  const handleShare = async () => {
    await navigator.clipboard.writeText(window.location.href);
    toast.success('Link copied to clipboard');
  };

  return (
    <section className="mx-auto max-w-3xl px-4 pb-20 pt-12 sm:px-6">
      <div className="mb-8">
        <div className="mb-2 flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <ZapIcon className="size-4" />
          Compatibility Check
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Do these tools work together?
        </h1>
        <p className="mt-2 text-muted-foreground">
          Check graph relationships between any two tools in the ToolCairn index.
        </p>
      </div>

      {/* Input */}
      <Card className="mb-8">
        <CardContent className="pt-4">
          <div className="grid gap-4 sm:grid-cols-[1fr_auto_1fr]">
            <ToolAutocomplete value={toolA} onChange={setToolA} placeholder="e.g. react" label="Tool A" />
            <div className="flex items-end pb-0.5 sm:items-center">
              <ZapIcon className="size-4 text-muted-foreground" />
            </div>
            <ToolAutocomplete value={toolB} onChange={setToolB} placeholder="e.g. next" label="Tool B" />
          </div>
          <div className="mt-4 flex justify-end">
            <Button onClick={handleCheck} disabled={!toolA.trim() || !toolB.trim() || loading}>
              {loading ? 'Checking...' : 'Check Compatibility'}
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

      {/* Result */}
      {result && statusConfig && (
        <div className="animate-fade-up flex flex-col gap-4">
          {/* Status */}
          <div className={cn('rounded-xl border p-6', statusConfig.className)}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <StatusIcon className="size-8 shrink-0" />
                <div>
                  <p className="text-lg font-bold">{statusConfig.label}</p>
                  <p className="text-sm opacity-80">{statusConfig.description}</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={handleShare}>
                <ShareIcon className="size-3.5" />
              </Button>
            </div>

            {/* Confidence */}
            {result.confidence !== undefined && (
              <div className="mt-4 flex items-center gap-2 text-sm">
                <span className="opacity-70">Confidence:</span>
                <span className="font-semibold">{Math.round(result.confidence * 100)}%</span>
              </div>
            )}
          </div>

          {/* Signals */}
          {result.signals && result.signals.length > 0 && (
            <Card>
              <CardContent className="pt-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Evidence</p>
                <ul className="flex flex-col gap-1.5">
                  {result.signals.map((signal, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-foreground">
                      <CheckCircleIcon className="size-3.5 shrink-0 text-[var(--tp-health-active)]" />
                      {signal}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Recommendation */}
          {result.recommendation && (
            <Card>
              <CardContent className="pt-4">
                <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Recommendation</p>
                <p className="text-sm text-foreground">{result.recommendation}</p>
              </CardContent>
            </Card>
          )}

          {/* Unknown: suggest relationship */}
          {result.status === 'unknown' && (
            <div className="rounded-xl border border-border bg-muted/30 p-4 text-center">
              <p className="text-sm text-muted-foreground">
                Know that these tools work together?{' '}
                <Link href={`/suggest?type=new_edge&source=${toolA}&target=${toolB}`} className="text-[var(--tp-accent)] hover:underline">
                  Suggest this relationship
                </Link>
              </p>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

export default function CompatibilityPage() {
  const { toggle } = useCommandPalette();
  return (
    <>
      <AmbientBackground />
      <div className="flex min-h-dvh flex-col">
        <SiteHeader onOpenSearch={toggle} />
        <main className="flex-1">
          <Suspense>
            <CompatibilityContent />
          </Suspense>
        </main>
        <SiteFooter />
      </div>
    </>
  );
}
