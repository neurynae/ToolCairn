import { getMemgraphSession, GET_TOOL_NEIGHBORHOOD } from '@toolpilot/graph';
import { NextResponse, type NextRequest } from 'next/server';

function toNum(val: unknown): number {
  if (val == null) return 0;
  if (typeof val === 'number') return val;
  if (typeof val === 'object' && typeof (val as Record<string, unknown>).toNumber === 'function') {
    return (val as { toNumber(): number }).toNumber();
  }
  return Number(val) || 0;
}

function nodeProps(node: unknown): Record<string, unknown> {
  if (node && typeof node === 'object' && 'properties' in node) {
    return (node as { properties: Record<string, unknown> }).properties;
  }
  return {};
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ name: string }> },
) {
  const { name } = await params;
  const decodedName = decodeURIComponent(name);

  const session = getMemgraphSession();
  try {
    // GET_TOOL_NEIGHBORHOOD returns: t, related, edgeType, effectiveWeight, confidence
    const result = await session.run(GET_TOOL_NEIGHBORHOOD.text, { name: decodedName });

    if (result.records.length === 0) {
      return NextResponse.json({ ok: false, error: 'Tool not found' }, { status: 404 });
    }

    // First record always has the center tool (even if related is null)
    const firstRecord = result.records[0];
    const tNode = firstRecord?.get('t') as unknown;
    const p = nodeProps(tNode);

    const tool = {
      id: p.id as string,
      name: p.name as string,
      displayName: (p.display_name as string | null) ?? (p.name as string),
      description: (p.description as string | null) ?? '',
      category: (p.category as string | null) ?? '',
      language: (p.language as string | null) ?? '',
      languages: (p.languages as string[] | null) ?? [],
      githubUrl: (p.github_url as string | null) ?? '',
      homepageUrl: (p.homepage_url as string | null) ?? null,
      license: (p.license as string | null) ?? '',
      deploymentModels: (p.deployment_models as string[] | null) ?? [],
      topics: (p.topics as string[] | null) ?? [],
      health: {
        stars: toNum(p.health_stars),
        starsVelocity90d: toNum(p.health_stars_velocity_90d),
        maintenanceScore: toNum(p.health_maintenance_score),
        lastCommitDate: (p.health_last_commit_date as string | null) ?? '',
        commitVelocity30d: toNum(p.health_commit_velocity_30d),
        openIssues: toNum(p.health_open_issues),
        closedIssues30d: toNum(p.health_closed_issues_30d),
        contributorCount: toNum(p.health_contributor_count),
        prResponseTimeHours: toNum(p.health_pr_response_time_hours),
        lastReleaseDate: (p.health_last_release_date as string | null) ?? '',
      },
      docs: {
        readmeUrl: (p.docs_readme_url as string | null) ?? null,
        docsUrl: (p.docs_docs_url as string | null) ?? null,
        apiUrl: (p.docs_api_url as string | null) ?? null,
        changelogUrl: (p.docs_changelog_url as string | null) ?? null,
      },
    };

    // Collect neighbor edges (skip rows where related is null)
    const neighbors = result.records
      .filter((r) => r.get('related') !== null)
      .map((r) => {
        const rp = nodeProps(r.get('related') as unknown);
        return {
          toolName: rp.name as string,
          toolDisplayName: (rp.display_name as string | null) ?? (rp.name as string),
          edgeType: r.get('edgeType') as string,
          effectiveWeight: toNum(r.get('effectiveWeight')),
          confidence: toNum(r.get('confidence')),
        };
      });

    return NextResponse.json({ ok: true, data: { tool, neighbors } });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  } finally {
    await session.close();
  }
}
