'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { GitBranch, RefreshCw, RotateCcw } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

async function post(path: string): Promise<{ message?: string; error?: string }> {
  const res = await fetch(path, { method: 'POST' });
  return res.json() as Promise<{ message?: string; error?: string }>;
}

export function IndexerActions({
  queueDepth,
}: { queueDepth: { index: number; scheduler: number } }) {
  const [busy, setBusy] = useState<string | null>(null);

  async function run(path: string, label: string) {
    setBusy(label);
    try {
      const result = await post(path);
      if (result.error) throw new Error(result.error);
      toast.success(result.message ?? `${label} triggered`);
    } catch (err) {
      toast.error(`${label} failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setBusy(null);
    }
  }

  return (
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
            <span className="font-semibold tabular-nums">{queueDepth.index.toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Scheduler queue</span>
            <span className="font-semibold tabular-nums">
              {queueDepth.scheduler.toLocaleString()}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Action buttons */}
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
            onClick={() => run('/api/admin/settings/run-discovery', 'Discovery')}
            className="gap-2"
          >
            <GitBranch className="h-3.5 w-3.5" />
            {busy === 'Discovery' ? 'Running…' : 'Run Discovery'}
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={busy !== null}
            onClick={() => run('/api/admin/settings/run-reindex', 'Reindex')}
            className="gap-2"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            {busy === 'Reindex' ? 'Running…' : 'Run Reindex'}
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={busy !== null}
            onClick={() => run('/api/admin/indexer/retry-failed', 'Retry failed')}
            className="gap-2 text-amber-400 border-amber-400/30 hover:bg-amber-400/10"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            {busy === 'Retry failed' ? 'Retrying…' : 'Retry Failed'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
