'use client';

import { useState, useTransition } from 'react';
import { Toggle } from '@/components/admin/settings/toggle';
import { ProgressTracker } from '@/components/admin/settings/progress-tracker';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export interface AppSettingsClient {
  id: string;
  reindex_scheduler_enabled: boolean;
  discovery_scheduler_enabled: boolean;
  discovery_topics: string[];
  discovery_batch_size: number;
  discovery_interval_hours: number;
  discovery_min_stars: number;
  discovery_last_pushed_days: number;
  last_discovery_run: string | null;
  last_reindex_run: string | null;
  updated_at: string;
}

interface SettingsFormProps {
  settings: AppSettingsClient;
}

export function SettingsForm({ settings }: SettingsFormProps) {
  const [data, setData] = useState(settings);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [runningJob, setRunningJob] = useState<'discovery' | 'reindex' | null>(null);

  const updateField = <K extends keyof AppSettingsClient>(
    field: K,
    value: AppSettingsClient[K],
  ) => {
    setData((prev) => ({ ...prev, [field]: value }));
  };

  const saveSettings = async () => {
    setMessage(null);
    startTransition(async () => {
      try {
        const res = await fetch('/api/admin/settings', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            reindex_scheduler_enabled: data.reindex_scheduler_enabled,
            discovery_scheduler_enabled: data.discovery_scheduler_enabled,
            discovery_topics: data.discovery_topics,
            discovery_batch_size: data.discovery_batch_size,
            discovery_interval_hours: data.discovery_interval_hours,
            discovery_min_stars: data.discovery_min_stars,
            discovery_last_pushed_days: data.discovery_last_pushed_days,
          }),
        });
        if (!res.ok) throw new Error('Failed to save');
        setMessage({ type: 'success', text: 'Settings saved successfully' });
      } catch {
        setMessage({ type: 'error', text: 'Failed to save settings' });
      }
    });
  };

  const triggerDiscovery = async () => {
    setMessage(null);
    setRunningJob('discovery');
    try {
      const res = await fetch('/api/admin/settings/run-discovery', { method: 'POST' });
      const result = (await res.json()) as { message?: string; error?: string };
      if (!res.ok) throw new Error(result.error ?? 'Failed');
      setMessage({ type: 'success', text: result.message ?? 'Discovery triggered.' });
    } catch (err) {
      setMessage({
        type: 'error',
        text: `Failed: ${err instanceof Error ? err.message : 'Unknown error'}`,
      });
      setRunningJob(null);
    }
  };

  const triggerReindex = async () => {
    setMessage(null);
    setRunningJob('reindex');
    try {
      const res = await fetch('/api/admin/settings/run-reindex', { method: 'POST' });
      const result = (await res.json()) as { message?: string; error?: string };
      if (!res.ok) throw new Error(result.error ?? 'Failed');
      setMessage({ type: 'success', text: result.message ?? 'Reindex triggered.' });
    } catch (err) {
      setMessage({
        type: 'error',
        text: `Failed: ${err instanceof Error ? err.message : 'Unknown error'}`,
      });
      setRunningJob(null);
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      {message && (
        <div
          className={`rounded-lg px-4 py-3 text-sm border ${
            message.type === 'success'
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
              : 'bg-red-500/10 text-red-400 border-red-500/20'
          }`}
        >
          {message.text}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Scheduler Controls</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Toggle
            enabled={data.reindex_scheduler_enabled}
            onChange={(v) => updateField('reindex_scheduler_enabled', v)}
            label="Reindex Scheduler"
            description="Automatically refresh stale tool health signals"
          />
          <Toggle
            enabled={data.discovery_scheduler_enabled}
            onChange={(v) => updateField('discovery_scheduler_enabled', v)}
            label="Auto-Discovery Scheduler"
            description="Automatically discover new tools from GitHub"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Discovery Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>Topics (comma-separated)</Label>
            <Textarea
              value={data.discovery_topics.join(', ')}
              onChange={(e) =>
                updateField(
                  'discovery_topics',
                  e.target.value
                    .split(',')
                    .map((t) => t.trim())
                    .filter(Boolean),
                )
              }
              className="font-mono text-xs"
              rows={4}
            />
            <p className="text-xs text-muted-foreground">
              GitHub topics to search for. More topics = more discoveries but slower.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Batch Size</Label>
              <Input
                type="number"
                min={1}
                max={100}
                value={data.discovery_batch_size}
                onChange={(e) =>
                  updateField('discovery_batch_size', Number.parseInt(e.target.value) || 20)
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>Interval (hours)</Label>
              <Input
                type="number"
                min={1}
                max={168}
                value={data.discovery_interval_hours}
                onChange={(e) =>
                  updateField('discovery_interval_hours', Number.parseInt(e.target.value) || 24)
                }
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Min Stars</Label>
              <Input
                type="number"
                min={0}
                value={data.discovery_min_stars}
                onChange={(e) =>
                  updateField('discovery_min_stars', Number.parseInt(e.target.value) || 100)
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>Pushed Within (days)</Label>
              <Input
                type="number"
                min={1}
                max={365}
                value={data.discovery_last_pushed_days}
                onChange={(e) =>
                  updateField('discovery_last_pushed_days', Number.parseInt(e.target.value) || 90)
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Manual Triggers</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3">
            <Button variant="outline" onClick={triggerDiscovery} disabled={isPending || runningJob !== null}>
              Run Discovery Now
            </Button>
            <Button variant="outline" onClick={triggerReindex} disabled={isPending || runningJob !== null}>
              Run Reindex Now
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Last discovery:{' '}
            {data.last_discovery_run
              ? new Date(data.last_discovery_run).toLocaleString()
              : 'Never'}
            <br />
            Last reindex:{' '}
            {data.last_reindex_run ? new Date(data.last_reindex_run).toLocaleString() : 'Never'}
          </p>
          {runningJob && (
            <ProgressTracker
              onComplete={() => {
                setRunningJob(null);
                setMessage({
                  type: 'success',
                  text:
                    runningJob === 'discovery'
                      ? 'Discovery complete! New tools have been indexed.'
                      : 'Reindex complete! Tool health signals updated.',
                });
              }}
            />
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={saveSettings} disabled={isPending}>
          {isPending ? 'Saving…' : 'Save Settings'}
        </Button>
      </div>
    </div>
  );
}
