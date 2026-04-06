import type { MetadataRoute } from 'next';

const BASE_URL = (process.env['NEXT_PUBLIC_APP_URL'] ?? 'https://toolcairn.neurynae.com').trim().replace(/\/$/, '');

// Static platform pages
const STATIC_ROUTES: { path: string; priority: number; changeFreq: MetadataRoute.Sitemap[0]['changeFrequency'] }[] = [
  { path: '/', priority: 1.0, changeFreq: 'weekly' },
  { path: '/explore', priority: 0.9, changeFreq: 'daily' },
  { path: '/compare', priority: 0.8, changeFreq: 'weekly' },
  { path: '/stack', priority: 0.8, changeFreq: 'weekly' },
  { path: '/compatibility', priority: 0.7, changeFreq: 'weekly' },
  { path: '/about', priority: 0.6, changeFreq: 'monthly' },
  { path: '/privacy', priority: 0.3, changeFreq: 'monthly' },
  { path: '/terms', priority: 0.3, changeFreq: 'monthly' },
  { path: '/suggest', priority: 0.5, changeFreq: 'monthly' },
  { path: '/docs', priority: 0.9, changeFreq: 'weekly' },
  { path: '/docs/getting-started', priority: 0.8, changeFreq: 'weekly' },
  { path: '/docs/quickstart/claude', priority: 0.8, changeFreq: 'monthly' },
  { path: '/docs/quickstart/cursor', priority: 0.8, changeFreq: 'monthly' },
  { path: '/docs/quickstart/windsurf', priority: 0.7, changeFreq: 'monthly' },
  { path: '/docs/concepts/search-pipeline', priority: 0.7, changeFreq: 'monthly' },
  { path: '/docs/mcp-tools/overview', priority: 0.7, changeFreq: 'monthly' },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map(({ path, priority, changeFreq }) => ({
    url: `${BASE_URL}${path}`,
    lastModified: now,
    changeFrequency: changeFreq,
    priority,
  }));

  // Attempt to fetch tool names for dynamic /tool/[name] pages
  let toolEntries: MetadataRoute.Sitemap = [];
  try {
    const res = await fetch(`${BASE_URL}/api/tools/names`, {
      next: { revalidate: 86400 }, // 24h cache
    });
    if (res.ok) {
      const data = (await res.json()) as { names?: string[] };
      toolEntries = (data.names ?? []).slice(0, 500).map((name) => ({
        url: `${BASE_URL}/tool/${encodeURIComponent(name)}`,
        lastModified: now,
        changeFrequency: 'weekly' as const,
        priority: 0.6,
      }));
    }
  } catch {
    // Non-fatal — sitemap still works without tool pages
  }

  return [...staticEntries, ...toolEntries];
}
