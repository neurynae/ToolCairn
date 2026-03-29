import {
  GET_EDGE_WEIGHT_SUMMARY,
  getMemgraphSession,
  type EdgeWeightSummaryRow,
} from '@toolpilot/graph';
import type { ToolHealthRow } from '@/app/api/admin/weights/route';
import { WeightChartLoader } from '@/components/admin/weights/weight-chart-loader';
import { EmergingToolsList } from '@/components/admin/weights/emerging-tools-list';
import { ToolHealthGrid } from '@/components/admin/weights/tool-health-grid';

/** Convert neo4j Integer objects to plain JS numbers */
function toNum(val: unknown): number {
  if (val == null) return 0;
  if (typeof val === 'number') return val;
  if (typeof val === 'object' && typeof (val as Record<string, unknown>).toNumber === 'function') {
    return (val as { toNumber(): number }).toNumber();
  }
  return Number(val) || 0;
}

const GET_TOOL_HEALTH = `
MATCH (t:Tool)
RETURN
  t.id AS id,
  t.name AS name,
  t.display_name AS displayName,
  t.category AS category,
  t.health_maintenance_score AS maintenanceScore,
  t.health_stars AS stars,
  t.health_stars_velocity_90d AS starsVelocity90d,
  t.health_commit_velocity_30d AS commitVelocity30d,
  t.health_last_commit_date AS lastCommitDate,
  t.health_contributor_count AS contributorCount,
  t.health_open_issues AS openIssues
ORDER BY t.health_maintenance_score DESC
`;

async function fetchWeightsData(): Promise<{
  tools: ToolHealthRow[];
  edgeWeightSummary: EdgeWeightSummaryRow[];
}> {
  const session = getMemgraphSession();
  try {
    const toolsResult = await session.run(GET_TOOL_HEALTH);
    const edgesResult = await session.run(GET_EDGE_WEIGHT_SUMMARY.text);

    const tools: ToolHealthRow[] = toolsResult.records.map((r) => ({
      id: r.get('id') as string,
      name: r.get('name') as string,
      displayName: (r.get('displayName') as string) ?? (r.get('name') as string),
      category: r.get('category') as string,
      maintenanceScore: toNum(r.get('maintenanceScore')),
      stars: toNum(r.get('stars')),
      starsVelocity90d: toNum(r.get('starsVelocity90d')),
      commitVelocity30d: toNum(r.get('commitVelocity30d')),
      lastCommitDate: (r.get('lastCommitDate') as string) ?? '',
      contributorCount: toNum(r.get('contributorCount')),
      openIssues: toNum(r.get('openIssues')),
    }));

    const edgeWeightSummary: EdgeWeightSummaryRow[] = edgesResult.records.map((r) => ({
      edgeType: r.get('edgeType') as string,
      avgEffectiveWeight: toNum(r.get('avgEffectiveWeight')),
      edgeCount: toNum(r.get('edgeCount')),
    }));

    return { tools, edgeWeightSummary };
  } finally {
    await session.close();
  }
}

export default async function WeightsPage() {
  let tools: ToolHealthRow[] = [];
  let edgeWeightSummary: EdgeWeightSummaryRow[] = [];

  try {
    ({ tools, edgeWeightSummary } = await fetchWeightsData());
  } catch {
    // Memgraph unavailable — render empty state
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-lg font-semibold text-gray-900">Weights</h1>
        <p className="text-sm text-gray-500">
          Tool health signals and edge weight distribution across the graph.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Edge Weight by Type</h2>
          <WeightChartLoader edgeWeightSummary={edgeWeightSummary} />
        </div>

        <div>
          <h2 className="text-sm font-semibold text-gray-700 mb-3">
            Emerging Tools <span className="text-gray-400 font-normal">(90d star velocity)</span>
          </h2>
          <EmergingToolsList tools={tools} />
        </div>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-gray-700 mb-3">
          Tool Health Grid{' '}
          <span className="text-gray-400 font-normal">({tools.length} tools)</span>
        </h2>
        <ToolHealthGrid tools={tools} />
      </div>
    </div>
  );
}
