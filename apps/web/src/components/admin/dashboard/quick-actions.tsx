'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckSquare, GitBranch, RefreshCw } from 'lucide-react';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';

async function triggerAction(path: string, label: string): Promise<void> {
  const res = await fetch(path, { method: 'POST' });
  const json = (await res.json()) as { ok: boolean; error?: string };
  if (!json.ok) throw new Error(json.error ?? 'Unknown error');
  toast.success(`${label} triggered`);
}

export function QuickActions() {
  const [, startTransition] = useTransition();
  const [busy, setBusy] = useState<string | null>(null);

  function run(path: string, label: string) {
    setBusy(label);
    startTransition(async () => {
      try {
        await triggerAction(path, label);
      } catch (err) {
        toast.error(`${label} failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
      } finally {
        setBusy(null);
      }
    });
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">Quick Actions</CardTitle>
        <CardDescription className="text-xs">
          Trigger indexer and scheduler operations
        </CardDescription>
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
        {/* biome-ignore lint/a11y/useAnchorContent: content provided as children via render prop */}
        <Button size="sm" variant="outline" render={<a href="/admin/review" />} className="gap-2">
          <CheckSquare className="h-3.5 w-3.5" />
          Review Queue
        </Button>
      </CardContent>
    </Card>
  );
}
