'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CircleDot, GitBranch, RefreshCw, RotateCcw, Square } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';

interface StatusSnapshot {
  counts: { pending: number; indexed: number; failed: number; skipped: number };
  recentlyIndexed: Array<{ github_url: string; last_indexed_at: string | null }>;
  queueDepth?: { index: number; scheduler: number };
}

interface LogEntry {
  ts: string;
  text: string;
  type: 'info' | 'success' | 'error' | 'muted';
}

async function triggerAction(path: string): Promise<{ message?: string; error?: string }> {
  const res = await fetch(path, { method: 'POST' });
  return res.json() as Promise<{ message?: string; error?: string }>;
}

async function fetchStatus(): Promise<StatusSnapshot | null> {
  try {
    const res = await fetch('/api/admin/indexer', { cache: 'no-store' });
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

export function IndexerActions({
  queueDepth: initialQueueDepth,
}: { queueDepth: { index: number; scheduler: number } }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [watching, setWatching] = useState(false);
  const [done, setDone] = useState(false); // job finished but panel still open
  const [log, setLog] = useState<LogEntry[]>([]);
  const [liveQueue, setLiveQueue] = useState(initialQueueDepth);
  const [liveCounts, setLiveCounts] = useState<StatusSnapshot['counts'] | null>(null);

  // Track newest last_indexed_at seen — any tool with a newer timestamp is new activity
  const prevLatestAt = useRef<string | null>(null);
  const prevFailed = useRef(0);
  const zeroStreak = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const logEndRef = useRef<HTMLDivElement>(null);
  // Use a ref for the poll fn so the interval always calls the latest version
  const pollRef = useRef<() => Promise<void>>(async () => {});

  const addLog = useCallback((text: string, type: LogEntry['type'] = 'info') => {
    setLog((prev) => [...prev, { ts: now(), text, type }]);
  }, []);

  // stopPolling: stops the interval but keeps panel open (shows "done" state)
  const stopPolling = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;
    setDone(true);
  }, []);

  // closePanel: user-initiated close — hides panel and refreshes server data
  const closePanel = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;
    setWatching(false);
    setDone(false);
    setLog([]);
    router.refresh();
  }, [router]);

  // Auto-scroll log to bottom
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [log]);

  const poll = useCallback(async () => {
    const snap = await fetchStatus();
    if (!snap) return;

    const qd = snap.queueDepth ?? { index: 0, scheduler: 0 };
    setLiveQueue(qd);
    setLiveCounts(snap.counts);

    // Detect newly indexed / reindexed repos by comparing last_indexed_at timestamp.
    // This catches both new tools (Discovery) and re-indexed tools (Reindex) because
    // reindexing updates last_indexed_at even on existing tools.
    const cutoff = prevLatestAt.current;
    const newlyIndexed = snap.recentlyIndexed.filter(
      (r) => r.last_indexed_at != null && (cutoff == null || r.last_indexed_at > cutoff),
    );
    for (const tool of newlyIndexed) {
      const repo = tool.github_url.replace('https://github.com/', '');
      addLog(`✓ Indexed: ${repo}`, 'success');
    }
    if (newlyIndexed.length > 0) {
      // Update cutoff to the newest timestamp we've seen
      const newest = newlyIndexed.reduce((a, b) =>
        (a.last_indexed_at ?? '') > (b.last_indexed_at ?? '') ? a : b,
      );
      prevLatestAt.current = newest.last_indexed_at ?? prevLatestAt.current;
    }

    // Detect new failures (use ref to avoid stale closure)
    if (snap.counts.failed > prevFailed.current) {
      addLog(`⚠ ${snap.counts.failed} tool(s) failed`, 'error');
    }
    prevFailed.current = snap.counts.failed;

    // Track queue emptying — only auto-stop when server returns queueDepth
    // (in local dev without proxy, queueDepth is undefined so we skip auto-stop)
    if (snap.queueDepth !== undefined) {
      if (qd.index === 0) {
        zeroStreak.current += 1;
        if (zeroStreak.current === 1) {
          addLog('Queue empty — waiting for in-flight jobs…', 'muted');
        }
        if (zeroStreak.current >= 3) {
          addLog('✓ Job complete — click Close to refresh page data', 'success');
          stopPolling();
        }
      } else {
        zeroStreak.current = 0;
      }
    }
  }, [addLog, stopPolling]);

  // Keep pollRef current so the interval always calls the latest version
  useEffect(() => {
    pollRef.current = poll;
  }, [poll]);

  const startWatching = useCallback((label: string) => {
    // Seed prevIndexed with current state so we only log NEW ones
    fetchStatus().then((snap) => {
      if (snap) {
        // Seed cutoff with the newest last_indexed_at so only future activity is logged
        const latest = snap.recentlyIndexed.find((r) => r.last_indexed_at != null);
        prevLatestAt.current = latest?.last_indexed_at ?? null;
        prevFailed.current = snap.counts.failed ?? 0;
      }
      zeroStreak.current = 0;
      setDone(false);
      setLog([{ ts: now(), text: `▶ ${label} triggered`, type: 'info' }]);
      setWatching(true);
      intervalRef.current = setInterval(() => pollRef.current(), 2000);
    });
  }, []);

  // Clean up on unmount
  useEffect(
    () => () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    },
    [],
  );

  async function run(apiPath: string, label: string, watchLabel: string) {
    setBusy(label);
    try {
      const result = await triggerAction(apiPath);
      if (result.error) throw new Error(result.error);
      startWatching(watchLabel);
    } catch (err) {
      addLog(`✗ ${label} failed: ${err instanceof Error ? err.message : 'Unknown'}`, 'error');
      setWatching(true); // show log even on error
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Queue depth */}
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

        {/* Actions */}
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
              onClick={() => run('/api/admin/settings/run-discovery', 'Discovery', 'Discovery')}
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

      {/* Live status log — shown while watching or done */}
      {watching && (
        <Card
          className={
            done ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-sky-500/20 bg-sky-500/5'
          }
        >
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {done ? (
                  <CircleDot className="h-3.5 w-3.5 text-emerald-400" />
                ) : (
                  <CircleDot className="h-3.5 w-3.5 text-sky-400 animate-pulse" />
                )}
                <CardTitle
                  className={`text-sm font-medium ${done ? 'text-emerald-400' : 'text-sky-400'}`}
                >
                  {done ? 'Job Complete' : 'Live Status'}
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
              <Button
                size="sm"
                variant="ghost"
                onClick={closePanel}
                className="h-7 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
              >
                <Square className="h-3 w-3" />
                {done ? 'Close & refresh' : 'Stop watching'}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="bg-black/40 rounded-md p-3 h-52 overflow-y-auto font-mono text-xs space-y-0.5 border border-border/40">
              {log.map((entry, i) => (
                <div key={i} className="flex gap-3 leading-relaxed">
                  <span className="text-muted-foreground shrink-0">{entry.ts}</span>
                  <span className={logTypeClass[entry.type]}>{entry.text}</span>
                </div>
              ))}
              <div ref={logEndRef} />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
