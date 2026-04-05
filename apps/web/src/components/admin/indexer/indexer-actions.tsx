'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { CircleDot, GitBranch, RefreshCw, RotateCcw, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';

type Counts = { pending: number; indexed: number; failed: number; skipped: number };

interface StatusSnapshot {
  counts: { pending: number; indexed: number; failed: number; skipped: number };
  recentlyIndexed: Array<{
    github_url: string;
    graph_node_id?: string | null;
    last_indexed_at: string | null;
  }>;
  recentFailures?: Array<{
    github_url: string;
    error_message?: string | null;
    retry_count: number;
  }>;
  queueDepth?: { index: number; scheduler: number };
}

interface ProgressState {
  phase: string;
  detail?: string;
  counts?: Record<string, number>;
  ts: string;
}

interface LogEntry {
  ts: string;
  text: string;
  type: 'info' | 'success' | 'error' | 'muted';
}

const SESSION_KEY = 'indexer_log';

function loadLog(): LogEntry[] {
  try {
    const s = sessionStorage.getItem(SESSION_KEY);
    return s ? (JSON.parse(s) as LogEntry[]) : [];
  } catch {
    return [];
  }
}

function saveLog(log: LogEntry[]) {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(log.slice(-200)));
  } catch {
    /* ignore */
  }
}

import { adminFetch } from '@/lib/admin/fetch';

async function triggerAction(path: string): Promise<{ message?: string; error?: string }> {
  const res = await adminFetch(path, { method: 'POST' });
  return res.json() as Promise<{ message?: string; error?: string }>;
}

async function fetchProgress(): Promise<ProgressState | null> {
  try {
    const res = await adminFetch('/api/admin/indexer/progress', { cache: 'no-store' });
    const json = (await res.json()) as { ok: boolean; data?: { progress: ProgressState | null } };
    return json.ok ? (json.data?.progress ?? null) : null;
  } catch {
    return null;
  }
}

async function fetchStatus(): Promise<StatusSnapshot | null> {
  try {
    const res = await adminFetch('/api/admin/indexer', { cache: 'no-store' });
    const json = (await res.json()) as { ok: boolean; data?: StatusSnapshot };
    return json.ok && json.data ? json.data : null;
  } catch {
    return null;
  }
}

function now() {
  return new Date().toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

const STATUS_BADGE: Record<string, string> = {
  indexed: 'text-emerald-400 border-emerald-400/30 bg-emerald-400/10',
  pending: 'text-amber-400 border-amber-400/30 bg-amber-400/10',
  failed: 'text-red-400 border-red-400/30 bg-red-400/10',
  skipped: 'text-muted-foreground border-border',
};

export function IndexerActions({
  queueDepth: initialQueueDepth,
  initialCounts,
  initialRecentlyIndexed = [],
  initialRecentFailures = [],
}: {
  queueDepth: { index: number; scheduler: number };
  initialCounts: Counts;
  initialRecentlyIndexed?: StatusSnapshot['recentlyIndexed'];
  initialRecentFailures?: NonNullable<StatusSnapshot['recentFailures']>;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [log, setLog] = useState<LogEntry[]>(loadLog);
  const [liveQueue, setLiveQueue] = useState(initialQueueDepth);
  const [liveCounts, setLiveCounts] = useState<Counts>(initialCounts);
  const [recentlyIndexed, setRecentlyIndexed] =
    useState<StatusSnapshot['recentlyIndexed']>(initialRecentlyIndexed);
  const [recentFailures, setRecentFailures] =
    useState<NonNullable<StatusSnapshot['recentFailures']>>(initialRecentFailures);
  // active = indexer currently processing (queue > 0)
  const [active, setActive] = useState(false);

  // Seed refs from server-rendered initial data so the first poll doesn't
  // treat already-seen tools as new (prevents log duplication on refresh).
  const prevLatestAt = useRef<string | null>(
    initialRecentlyIndexed.reduce<string | null>(
      (max, r) =>
        r.last_indexed_at != null && (max == null || r.last_indexed_at > max)
          ? r.last_indexed_at
          : max,
      null,
    ),
  );
  const prevFailed = useRef(initialCounts.failed);
  const prevQueueIndex = useRef<number | null>(initialQueueDepth.index);
  const prevSchedulerIndex = useRef<number | null>(initialQueueDepth.scheduler);
  const prevProgressTs = useRef<string | null>(null);
  const logContainerRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<() => Promise<void>>(async () => {});
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const addLog = useCallback((text: string, type: LogEntry['type'] = 'info') => {
    setLog((prev) => {
      const next = [...prev, { ts: now(), text, type }];
      saveLog(next);
      return next;
    });
  }, []);

  // Scroll log container (not page) to bottom on new entries
  useEffect(() => {
    const el = logContainerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [log]);

  const poll = useCallback(async () => {
    const snap = await fetchStatus();
    if (!snap) return;

    const qd = snap.queueDepth ?? { index: 0, scheduler: 0 };
    if (snap.queueDepth !== undefined) {
      setLiveQueue(qd);
      if (prevQueueIndex.current !== null && qd.index !== prevQueueIndex.current) {
        addLog(`Index queue: ${prevQueueIndex.current} → ${qd.index} jobs`, 'muted');
      }
      prevQueueIndex.current = qd.index;
      if (prevSchedulerIndex.current !== null && qd.scheduler !== prevSchedulerIndex.current) {
        addLog(
          `Scheduler queue: ${prevSchedulerIndex.current} → ${qd.scheduler} (discovery jobs pending)`,
          'muted',
        );
      }
      prevSchedulerIndex.current = qd.scheduler;
      setActive(qd.index > 0 || qd.scheduler > 0);
    }
    setLiveCounts(snap.counts);

    // Detect newly indexed / reindexed tools by last_indexed_at timestamp
    const cutoff = prevLatestAt.current;
    const newlyIndexed = snap.recentlyIndexed.filter(
      (r) => r.last_indexed_at != null && (cutoff == null || r.last_indexed_at > cutoff),
    );
    for (const tool of newlyIndexed) {
      addLog(`✓ Indexed: ${tool.github_url.replace('https://github.com/', '')}`, 'success');
    }
    if (newlyIndexed.length > 0) {
      const newest = newlyIndexed.reduce((a, b) =>
        (a.last_indexed_at ?? '') > (b.last_indexed_at ?? '') ? a : b,
      );
      prevLatestAt.current = newest.last_indexed_at ?? prevLatestAt.current;
    }

    // Update the recently indexed and failure tables
    setRecentlyIndexed(snap.recentlyIndexed);
    if (snap.recentFailures) setRecentFailures(snap.recentFailures);

    // Detect new failures
    if (snap.counts.failed > prevFailed.current) {
      addLog(`⚠ ${snap.counts.failed} tool(s) failed`, 'error');
    }
    prevFailed.current = snap.counts.failed;

    // Poll indexer progress (discovery/reindex phase messages)
    const progress = await fetchProgress();
    if (progress && progress.ts !== prevProgressTs.current) {
      prevProgressTs.current = progress.ts;
      const detail = progress.detail ? ` — ${progress.detail}` : '';
      addLog(`⚙ ${progress.phase}${detail}`, 'muted');
    }
  }, [addLog]);

  // Keep pollRef up to date
  useEffect(() => {
    pollRef.current = poll;
  }, [poll]);

  // Always poll — 2s when active, 5s when idle. Starts on mount, never stops.
  useEffect(() => {
    const tick = () => pollRef.current();
    tick(); // immediate first poll
    intervalRef.current = setInterval(tick, 3000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const clearLog = useCallback(() => {
    setLog([]);
    saveLog([]);
    router.refresh();
  }, [router]);

  async function run(apiPath: string, label: string, triggerLabel: string) {
    setBusy(label);
    try {
      const result = await triggerAction(apiPath);
      if (result.error) throw new Error(result.error);
      addLog(`▶ ${triggerLabel} triggered`, 'info');
      setActive(true);
      // Seed timestamp cutoff fresh so new activity shows immediately
      fetchStatus().then((snap) => {
        if (!snap) return;
        const latest = snap.recentlyIndexed.find((r) => r.last_indexed_at != null);
        prevLatestAt.current = latest?.last_indexed_at ?? null;
        prevFailed.current = snap.counts.failed ?? 0;
        prevQueueIndex.current = snap.queueDepth?.index ?? null;
        prevSchedulerIndex.current = snap.queueDepth?.scheduler ?? null;
      });
    } catch (err) {
      addLog(
        `✗ ${triggerLabel} failed: ${err instanceof Error ? err.message : 'Unknown'}`,
        'error',
      );
    } finally {
      setBusy(null);
    }
  }

  const logTypeClass: Record<LogEntry['type'], string> = {
    info: 'text-foreground',
    success: 'text-emerald-400',
    error: 'text-red-400',
    muted: 'text-muted-foreground',
  };

  return (
    <div className="space-y-4">
      {/* Queue depth + Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Queue Depth</CardTitle>
            <CardDescription className="text-xs">Current Redis stream lengths</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Index queue</span>
              <span className="font-semibold tabular-nums">{liveQueue.index.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Scheduler queue</span>
              <span className="font-semibold tabular-nums">
                {liveQueue.scheduler.toLocaleString()}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Actions</CardTitle>
            <CardDescription className="text-xs">Trigger indexer operations</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={busy !== null}
              onClick={() =>
                run(
                  '/api/admin/settings/run-discovery',
                  'Discovery',
                  'Discovery — searching GitHub for new repos (may take 5–10 min)',
                )
              }
              className="gap-2"
            >
              <GitBranch className="h-3.5 w-3.5" />
              {busy === 'Discovery' ? 'Triggering…' : 'Run Discovery'}
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={busy !== null}
              onClick={() => run('/api/admin/settings/run-reindex', 'Reindex', 'Reindex')}
              className="gap-2"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              {busy === 'Reindex' ? 'Triggering…' : 'Run Reindex'}
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={busy !== null}
              onClick={() => run('/api/admin/indexer/retry-failed', 'Retry', 'Retry Failed')}
              className="gap-2 text-amber-400 border-amber-400/30 hover:bg-amber-400/10"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              {busy === 'Retry' ? 'Triggering…' : 'Retry Failed'}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Activity log — always visible */}
      <Card className={active ? 'border-sky-500/20 bg-sky-500/5' : 'border-border/50'}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CircleDot
                className={`h-3.5 w-3.5 ${active ? 'text-sky-400 animate-pulse' : 'text-muted-foreground'}`}
              />
              <CardTitle
                className={`text-sm font-medium ${active ? 'text-sky-400' : 'text-muted-foreground'}`}
              >
                {active ? 'Indexer Active' : 'Activity Log'}
              </CardTitle>
              {liveCounts && (
                <div className="flex gap-1.5 ml-2">
                  <Badge
                    variant="outline"
                    className="text-xs text-amber-400 border-amber-400/30 bg-amber-400/10"
                  >
                    {liveCounts.pending} pending
                  </Badge>
                  <Badge
                    variant="outline"
                    className="text-xs text-emerald-400 border-emerald-400/30 bg-emerald-400/10"
                  >
                    {liveCounts.indexed} indexed
                  </Badge>
                  {liveCounts.failed > 0 && (
                    <Badge
                      variant="outline"
                      className="text-xs text-red-400 border-red-400/30 bg-red-400/10"
                    >
                      {liveCounts.failed} failed
                    </Badge>
                  )}
                </div>
              )}
            </div>
            {log.length > 0 && (
              <Button
                size="sm"
                variant="ghost"
                onClick={clearLog}
                className="h-7 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
              >
                <Trash2 className="h-3 w-3" />
                Clear
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div
            ref={logContainerRef}
            className="bg-black/40 rounded-md p-3 h-52 overflow-y-auto font-mono text-xs border border-border/40"
          >
            {log.length === 0 ? (
              <p className="text-muted-foreground/50 text-center mt-16">
                Idle — trigger an action to see live activity
              </p>
            ) : (
              <div className="space-y-0.5">
                {log.map((entry, i) => (
                  <div key={i} className="flex gap-3 leading-relaxed">
                    <span className="text-muted-foreground shrink-0">{entry.ts}</span>
                    <span className={logTypeClass[entry.type]}>{entry.text}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Status counters — live via polling */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {(
          [
            { label: 'Indexed', key: 'indexed' },
            { label: 'Pending', key: 'pending' },
            { label: 'Failed', key: 'failed' },
            { label: 'Skipped', key: 'skipped' },
          ] as const
        ).map(({ label, key }) => (
          <Card key={key}>
            <CardHeader className="pb-1">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
                <Badge variant="outline" className={`text-xs ${STATUS_BADGE[key]}`}>
                  {key}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{liveCounts[key]}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recently Indexed — live via polling */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Recently Indexed</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {recentlyIndexed.length === 0 ? (
            <p className="text-sm text-muted-foreground px-6 pb-6">No tools indexed yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Repository</TableHead>
                  <TableHead>Node ID</TableHead>
                  <TableHead>Indexed At</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentlyIndexed.map((tool) => (
                  <TableRow key={tool.github_url}>
                    <TableCell className="font-mono text-xs">
                      {tool.github_url.replace('https://github.com/', '')}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {tool.graph_node_id?.slice(0, 8) ?? '—'}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {tool.last_indexed_at ? new Date(tool.last_indexed_at).toLocaleString() : '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Recent Failures — live via polling */}
      {recentFailures.length > 0 ? (
        <Card className="border-red-500/20">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-red-400">
              Recent Failures <span className="text-muted-foreground font-normal">(last 5)</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Repository</TableHead>
                  <TableHead>Error</TableHead>
                  <TableHead>Retries</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentFailures.map((tool) => (
                  <TableRow key={tool.github_url}>
                    <TableCell className="font-mono text-xs">
                      {tool.github_url.replace('https://github.com/', '')}
                    </TableCell>
                    <TableCell className="text-xs text-red-400 max-w-sm truncate">
                      {tool.error_message ?? '—'}
                    </TableCell>
                    <TableCell className="text-xs">{tool.retry_count}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : liveCounts.indexed > 0 ? (
        <Card className="border-emerald-500/20 bg-emerald-500/5">
          <CardContent className="pt-4 pb-4 text-sm text-emerald-400">
            No indexer failures — all systems nominal.
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
