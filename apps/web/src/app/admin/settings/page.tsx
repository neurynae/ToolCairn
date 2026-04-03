import { prisma } from '@/lib/admin/prisma';
import { SettingsForm, type AppSettingsClient } from './settings-form';

interface AppSettingsServer {
  id: string;
  reindex_scheduler_enabled: boolean;
  discovery_scheduler_enabled: boolean;
  discovery_topics: string[];
  discovery_batch_size: number;
  discovery_interval_hours: number;
  discovery_min_stars: number;
  discovery_last_pushed_days: number;
  last_discovery_run: Date | null;
  last_reindex_run: Date | null;
  updated_at: Date;
}

async function fetchSettings(): Promise<AppSettingsServer | null> {
  try {
    const settings = await prisma.appSettings.findUnique({
      where: { id: 'global' },
    });
    return settings as AppSettingsServer | null;
  } catch {
    return null;
  }
}

export default async function SettingsPage() {
  const settings = await fetchSettings();

  // Provide defaults if no settings exist
  const defaults: AppSettingsServer = {
    id: 'global',
    reindex_scheduler_enabled: true,
    discovery_scheduler_enabled: false,
    discovery_topics: [
      'ai', 'mcp', 'mcp-server', 'vector-db', 'llm', 'rag', 'embedding',
      'chatbot', 'agent', 'autonomous-agent', 'machine-learning'
    ],
    discovery_batch_size: 20,
    discovery_interval_hours: 24,
    discovery_min_stars: 100,
    discovery_last_pushed_days: 90,
    last_discovery_run: null,
    last_reindex_run: null,
    updated_at: new Date(),
  };

  const data = {
    ...(settings ?? defaults),
    last_discovery_run: settings?.last_discovery_run?.toISOString() ?? null,
    last_reindex_run: settings?.last_reindex_run?.toISOString() ?? null,
    updated_at: (settings ?? defaults).updated_at.toISOString(),
  } as AppSettingsClient;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-lg font-semibold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500">
          Configure indexer schedulers and discovery options.
        </p>
      </div>

      <SettingsForm settings={data} />
    </div>
  );
}