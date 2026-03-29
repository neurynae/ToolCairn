import type { ToolNode } from '@toolpilot/core';
import { getHealthTier } from './format-health';

export interface FormattedResult {
  type: 'stable' | 'emerging';
  tool: string;
  display_name: string;
  description: string;
  category: string;
  fit_score: number;
  reasons: string[];
  github_url: string;
  docs: {
    readme: string | null;
    official: string | null;
    api: string | null;
    changelog: string | null;
  };
  health: {
    tier: ReturnType<typeof getHealthTier>;
    maintenance_score: number;
    stars: number;
    stars_velocity_90d: number;
    last_commit_date: string;
    language: string | null;
    license: string | null;
  };
}

/**
 * Format a raw pipeline result into a display-ready shape.
 * Adapted from apps/mcp-server/src/tools/search-tools.ts formatResults().
 */
export function formatResults(
  results: Array<{ tool: ToolNode; score: number }>,
  isTwoOption: boolean,
): FormattedResult[] {
  return results.map((r, idx) => {
    const type: 'stable' | 'emerging' = isTwoOption && idx === 1 ? 'emerging' : 'stable';

    // Build human-readable reasons from the tool's properties
    const reasons: string[] = [];
    if (r.tool.health.maintenance_score >= 0.8) reasons.push('Actively maintained');
    if (r.tool.license) reasons.push(`${r.tool.license} license`);
    if (r.tool.language) reasons.push(`${r.tool.language}`);
    if (r.tool.health.stars > 10_000) {
      reasons.push(`${Math.round(r.tool.health.stars / 1000)}k stars`);
    }
    if (r.tool.health.stars_velocity_90d > 100) reasons.push('Trending');
    if (reasons.length === 0) reasons.push('Best match for your query');

    return {
      type,
      tool: r.tool.name,
      display_name: r.tool.display_name,
      description: r.tool.description,
      category: r.tool.category,
      fit_score: Math.round(r.score * 100) / 100,
      reasons,
      github_url: r.tool.github_url,
      docs: {
        readme: r.tool.docs.readme_url ?? null,
        official: r.tool.docs.docs_url ?? null,
        api: r.tool.docs.api_url ?? null,
        changelog: r.tool.docs.changelog_url ?? null,
      },
      health: {
        tier: getHealthTier(r.tool.health.maintenance_score),
        maintenance_score: Math.round(r.tool.health.maintenance_score * 100) / 100,
        stars: r.tool.health.stars,
        stars_velocity_90d: r.tool.health.stars_velocity_90d ?? 0,
        last_commit_date: r.tool.health.last_commit_date,
        language: r.tool.language ?? null,
        license: r.tool.license ?? null,
      },
    };
  });
}
