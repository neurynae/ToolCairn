'use client';

import { useState, useTransition } from 'react';
import { Toggle } from '@/components/admin/settings/toggle';
import { ProgressTracker } from '@/components/admin/settings/progress-tracker';

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

  const updateField = <K extends keyof AppSettingsClient>(field: K, value: AppSettingsClient[K]) => {
    setData((prev) => ({ ...prev, [field]: value }));
  };

  const saveSettings = async () => {
    setMessage(null);
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
  };

  const triggerDiscovery = async () => {
    setMessage(null);
    setRunningJob('discovery');
    try {
      const res = await fetch('/api/admin/settings/run-discovery', { method: 'POST' });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed');
      setMessage({
        type: 'success',
        text: result.message || 'Discovery triggered.',
      });
    } catch (err) {
      setMessage({ type: 'error', text: `Failed: ${err instanceof Error ? err.message : 'Unknown error'}` });
      setRunningJob(null);
    }
  };

  const triggerReindex = async () => {
    setMessage(null);
    setRunningJob('reindex');
    try {
      const res = await fetch('/api/admin/settings/run-reindex', { method: 'POST' });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed');
      setMessage({
        type: 'success',
        text: result.message || 'Reindex triggered.',
      });
    } catch (err) {
      setMessage({ type: 'error', text: `Failed: ${err instanceof Error ? err.message : 'Unknown error'}` });
      setRunningJob(null);
    }
  };

  const topicsString = data.discovery_topics.join(', ');

  return (
    <div className="flex flex-col gap-8 max-w-2xl">
      {/* Message banner */}
      {message && (
        <div
          className={`rounded-lg px-4 py-3 text-sm ${
            message.type === 'success'
              ? 'bg-green-50 text-green-700 border border-green-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Scheduler Toggles */}
      <section className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-4">Scheduler Controls</h2>
        <div className="space-y-4">
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
        </div>
      </section>

      {/* Discovery Settings */}
      <section className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-4">Discovery Configuration</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Topics (comma-separated)
            </label>
            <textarea
              value={topicsString}
              onChange={(e) =>
                updateField(
                  'discovery_topics',
                  e.target.value.split(',').map((t) => t.trim()).filter(Boolean),
                )
              }
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm font-mono"
              rows={4}
            />
            <p className="mt-1 text-xs text-gray-500">
              GitHub topics to search for. More topics = more discoveries but slower.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Batch Size
              </label>
              <input
                type="number"
                min={1}
                max={100}
                value={data.discovery_batch_size}
                onChange={(e) => updateField('discovery_batch_size', parseInt(e.target.value) || 20)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Interval (hours)
              </label>
              <input
                type="number"
                min={1}
                max={168}
                value={data.discovery_interval_hours}
                onChange={(e) => updateField('discovery_interval_hours', parseInt(e.target.value) || 24)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Min Stars
              </label>
              <input
                type="number"
                min={0}
                value={data.discovery_min_stars}
                onChange={(e) => updateField('discovery_min_stars', parseInt(e.target.value) || 100)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Pushed Within (days)
              </label>
              <input
                type="number"
                min={1}
                max={365}
                value={data.discovery_last_pushed_days}
                onChange={(e) => updateField('discovery_last_pushed_days', parseInt(e.target.value) || 90)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Manual Triggers */}
      <section className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-4">Manual Triggers</h2>
        <div className="flex gap-3">
          <button
            onClick={triggerDiscovery}
            disabled={isPending}
            className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            Run Discovery Now
          </button>
          <button
            onClick={triggerReindex}
            disabled={isPending}
            className="px-4 py-2 bg-gray-600 text-white text-sm rounded-md hover:bg-gray-700 disabled:opacity-50"
          >
            Run Reindex Now
          </button>
        </div>
        <p className="mt-2 text-xs text-gray-500">
          Last discovery: {data.last_discovery_run ? new Date(data.last_discovery_run).toLocaleString() : 'Never'} <br />
          Last reindex: {data.last_reindex_run ? new Date(data.last_reindex_run).toLocaleString() : 'Never'}
        </p>
        {runningJob && (
          <ProgressTracker
            onComplete={() => {
              setRunningJob(null);
              setMessage({
                type: 'success',
                text: runningJob === 'discovery'
                  ? 'Discovery complete! New tools have been indexed.'
                  : 'Reindex complete! Tool health signals updated.',
              });
            }}
          />
        )}
      </section>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={saveSettings}
          disabled={isPending}
          className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 disabled:opacity-50"
        >
          {isPending ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
}