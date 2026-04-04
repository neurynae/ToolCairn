import { prisma } from '@/lib/admin/prisma';
import { SettingsForm, type AppSettingsClient } from './settings-form';
import { PageHeader } from '@/components/admin/page-header';
import { PROXY_ENABLED, proxyGet } from '@/lib/admin/api-proxy';

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
    if (PROXY_ENABLED) {
      const res = await proxyGet('/settings');
      const json = (await res.json()) as { ok: boolean; data?: AppSettingsServer };
      return json.ok && json.data ? json.data : null;
    }
    const settings = await prisma.appSettings.findUnique({ where: { id: 'global' } });
    return settings as AppSettingsServer | null;
  } catch {
    return null;
  }
}

export default async function SettingsPage() {
  const settings = await fetchSettings();

  const defaults: AppSettingsServer = {
    id: 'global',
    reindex_scheduler_enabled: true,
    discovery_scheduler_enabled: false,
    discovery_topics: [
      'ai', 'mcp', 'mcp-server', 'vector-db', 'llm', 'rag', 'embedding',
      'chatbot', 'agent', 'autonomous-agent', 'machine-learning',
    ],
    discovery_batch_size: 20,
    discovery_interval_hours: 24,
    discovery_min_stars: 100,
    discovery_last_pushed_days: 90,
    last_discovery_run: null,
    last_reindex_run: null,
    updated_at: new Date(),
  };

  const src = settings ?? defaults;
  // updated_at / last_*_run may be a Date (Prisma) or ISO string (API proxy) at runtime
  const toISO = (v: Date | string | null): string | null =>
    v == null ? null : v instanceof Date ? v.toISOString() : String(v);

  const data: AppSettingsClient = {
    ...src,
    last_discovery_run: toISO(src.last_discovery_run),
    last_reindex_run: toISO(src.last_reindex_run),
    updated_at: toISO(src.updated_at) ?? new Date().toISOString(),
  };

  return (
    <>
      <PageHeader
        title="Settings"
        description="Configure indexer schedulers and discovery options."
      />
      <SettingsForm settings={data} />
    </>
  );
}
