import {
  GET_EDGE_WEIGHT_SUMMARY,
  getMemgraphSession,
  type EdgeWeightSummaryRow,
} from '@toolpilot/graph';
import { NextResponse } from 'next/server';

export interface ToolHealthRow {
  id: string;
  name: string;
  displayName: string;
  category: string;
  maintenanceScore: number;
  stars: number;
  starsVelocity90d: number;
  commitVelocity30d: number;
  lastCommitDate: string;
  contributorCount: number;
  openIssues: number;
}

export interface WeightsData {
  tools: ToolHealthRow[];
  edgeWeightSummary: EdgeWeightSummaryRow[];
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

export async function GET() {
  const session = getMemgraphSession();
  try {
    const toolsResult = await session.run(GET_TOOL_HEALTH);
    const edgesResult = await session.run(GET_EDGE_WEIGHT_SUMMARY.text);

    const tools: ToolHealthRow[] = toolsResult.records.map((r) => ({
      id: r.get('id') as string,
      name: r.get('name') as string,
      displayName: (r.get('displayName') as string) ?? (r.get('name') as string),
      category: r.get('category') as string,
      maintenanceScore: (r.get('maintenanceScore') as number) ?? 0,
      stars: (r.get('stars') as number) ?? 0,
      starsVelocity90d: (r.get('starsVelocity90d') as number) ?? 0,
      commitVelocity30d: (r.get('commitVelocity30d') as number) ?? 0,
      lastCommitDate: (r.get('lastCommitDate') as string) ?? '',
      contributorCount: (r.get('contributorCount') as number) ?? 0,
      openIssues: (r.get('openIssues') as number) ?? 0,
    }));

    const edgeWeightSummary: EdgeWeightSummaryRow[] = edgesResult.records.map((r) => ({
      edgeType: r.get('edgeType') as string,
      avgEffectiveWeight: (r.get('avgEffectiveWeight') as number) ?? 0,
      edgeCount: (r.get('edgeCount') as number) ?? 0,
    }));

    return NextResponse.json({ ok: true, data: { tools, edgeWeightSummary } });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  } finally {
    await session.close();
  }
}
