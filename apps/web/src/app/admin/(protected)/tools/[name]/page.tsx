import { ExternalLink, Star, GitBranch, Users, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { PageHeader } from '@/components/admin/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { PROXY_ENABLED, proxyGet } from '@/lib/admin/api-proxy';
import { getMemgraphSession, GET_TOOL_NEIGHBORHOOD } from '@toolpilot/graph';

interface ToolDetail {
  id: string;
  name: string;
  displayName: string;
  description: string;
  category: string;
  language: string;
  languages: string[];
  githubUrl: string;
  homepageUrl: string | null;
  license: string;
  deploymentModels: string[];
  topics: string[];
  health: {
    stars: number;
    starsVelocity90d: number;
    maintenanceScore: number;
    lastCommitDate: string;
    commitVelocity30d: number;
    openIssues: number;
    closedIssues30d: number;
    contributorCount: number;
    prResponseTimeHours: number;
    lastReleaseDate: string;
  };
  docs: {
    readmeUrl: string | null;
    docsUrl: string | null;
    apiUrl: string | null;
    changelogUrl: string | null;
  };
}

interface Neighbor {
  toolName: string;
  toolDisplayName: string;
  edgeType: string;
  effectiveWeight: number;
  confidence: number;
}

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

async function fetchTool(name: string): Promise<{ tool: ToolDetail; neighbors: Neighbor[] } | null> {
  try {
    if (PROXY_ENABLED) {
      const res = await proxyGet(`/tools/${encodeURIComponent(name)}`);
      const json = (await res.json()) as {
        ok: boolean;
        data?: { tool: ToolDetail; neighbors: Neighbor[] };
        error?: string;
      };
      if (!json.ok || !json.data) return null;
      return json.data;
    }

    // Local dev: direct Memgraph
    const session = getMemgraphSession();
    try {
      const result = await session.run(GET_TOOL_NEIGHBORHOOD.text, { name });
      if (result.records.length === 0) return null;

      const firstRecord = result.records[0];
      const tNode = firstRecord?.get('t') as unknown;
      const p = nodeProps(tNode);

      const tool: ToolDetail = {
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

      return { tool, neighbors };
    } finally {
      await session.close();
    }
  } catch {
    return null;
  }
}

const EDGE_BADGE: Record<string, string> = {
  REQUIRES: 'text-violet-400 border-violet-400/30 bg-violet-400/10',
  INTEGRATES_WITH: 'text-emerald-400 border-emerald-400/30 bg-emerald-400/10',
  SOLVES: 'text-amber-400 border-amber-400/30 bg-amber-400/10',
  REPLACES: 'text-rose-400 border-rose-400/30 bg-rose-400/10',
  CONFLICTS_WITH: 'text-red-400 border-red-400/30 bg-red-400/10',
};

function scoreBadgeClass(score: number) {
  const pct = Math.round(score * 100);
  if (pct >= 70) return 'text-emerald-400 border-emerald-400/30 bg-emerald-400/10';
  if (pct >= 40) return 'text-amber-400 border-amber-400/30 bg-amber-400/10';
  return 'text-red-400 border-red-400/30 bg-red-400/10';
}

export default async function ToolDetailPage({ params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  const decodedName = decodeURIComponent(name);
  const data = await fetchTool(decodedName);

  if (!data) {
    return (
      <>
        <PageHeader title="Tool not found" />
        <Card className="border-destructive/50">
          <CardContent className="pt-6 text-sm text-muted-foreground">
            Tool &ldquo;{decodedName}&rdquo; was not found in the graph.
          </CardContent>
        </Card>
      </>
    );
  }

  const { tool, neighbors } = data;
  const healthPct = Math.round(tool.health.maintenanceScore * 100);

  return (
    <>
      <PageHeader
        title={tool.displayName}
        description={tool.description || tool.name}
        actions={
          <div className="flex gap-2">
            {tool.githubUrl && (
              <Button
                render={<a href={tool.githubUrl} target="_blank" rel="noopener noreferrer" />}
                size="sm"
                variant="outline"
                className="gap-2"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                GitHub
              </Button>
            )}
            {tool.docs.docsUrl && (
              <Button
                render={<a href={tool.docs.docsUrl} target="_blank" rel="noopener noreferrer" />}
                size="sm"
                variant="outline"
                className="gap-2"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Docs
              </Button>
            )}
          </div>
        }
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <Star className="h-3 w-3" />Stars
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{tool.health.stars.toLocaleString()}</p>
            <p className="text-xs text-emerald-400">+{tool.health.starsVelocity90d.toLocaleString()} (90d)</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-xs font-medium text-muted-foreground">Health Score</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{healthPct}%</p>
            <Badge variant="outline" className={`text-xs mt-1 ${scoreBadgeClass(tool.health.maintenanceScore)}`}>
              {healthPct >= 70 ? 'Healthy' : healthPct >= 40 ? 'Fair' : 'Poor'}
            </Badge>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <GitBranch className="h-3 w-3" />Commits/30d
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{tool.health.commitVelocity30d}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <Users className="h-3 w-3" />Contributors
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{tool.health.contributorCount}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-sm font-medium">Metadata</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Category</span>
              <Badge variant="outline" className="capitalize">{tool.category}</Badge>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-muted-foreground">Language</span>
              <span>{tool.language || '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">License</span>
              <span>{tool.license || '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Open Issues</span>
              <span className="flex items-center gap-1">
                <AlertCircle className="h-3 w-3 text-amber-400" />{tool.health.openIssues}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">PR Response</span>
              <span>{tool.health.prResponseTimeHours ? `${Math.round(tool.health.prResponseTimeHours)}h` : '—'}</span>
            </div>
            {tool.topics.length > 0 && (
              <>
                <Separator />
                <div>
                  <p className="text-muted-foreground mb-2">Topics</p>
                  <div className="flex flex-wrap gap-1">
                    {tool.topics.slice(0, 8).map((t) => (
                      <Badge key={t} variant="outline" className="text-xs">{t}</Badge>
                    ))}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm font-medium">Health Signals</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            {[
              { label: 'Last commit', value: tool.health.lastCommitDate ? new Date(tool.health.lastCommitDate).toLocaleDateString() : '—' },
              { label: 'Last release', value: tool.health.lastReleaseDate ? new Date(tool.health.lastReleaseDate).toLocaleDateString() : '—' },
              { label: 'Closed issues (30d)', value: String(tool.health.closedIssues30d) },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between">
                <span className="text-muted-foreground">{label}</span>
                <span>{value}</span>
              </div>
            ))}
            <Separator />
            {tool.docs.readmeUrl && (
              <a href={tool.docs.readmeUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
                README <ExternalLink className="h-3 w-3" />
              </a>
            )}
            {tool.docs.changelogUrl && (
              <a href={tool.docs.changelogUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
                Changelog <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm font-medium">Deployment</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            {tool.deploymentModels.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {tool.deploymentModels.map((m) => (
                  <Badge key={m} variant="outline" className="text-xs capitalize">{m}</Badge>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No deployment models specified</p>
            )}
            {tool.languages.length > 1 && (
              <>
                <Separator />
                <div>
                  <p className="text-muted-foreground mb-1">Languages</p>
                  <div className="flex flex-wrap gap-1">
                    {tool.languages.map((l) => (
                      <Badge key={l} variant="outline" className="text-xs">{l}</Badge>
                    ))}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {neighbors.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Related Tools ({neighbors.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tool</TableHead>
                  <TableHead>Relationship</TableHead>
                  <TableHead className="text-right">Effective Weight</TableHead>
                  <TableHead className="text-right">Confidence</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {neighbors.map((n, i) => (
                  <TableRow key={`${n.toolName}-${n.edgeType}-${i}`} className="cursor-pointer hover:bg-muted/50">
                    <TableCell className="font-medium text-sm">
                      <Link href={`/admin/tools/${encodeURIComponent(n.toolName)}`} className="hover:underline">
                        {n.toolDisplayName}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={EDGE_BADGE[n.edgeType] ?? 'text-muted-foreground border-border'}>
                        {n.edgeType}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right text-sm">{Math.round(n.effectiveWeight * 100)}%</TableCell>
                    <TableCell className="text-right text-sm">{Math.round(n.confidence * 100)}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </>
  );
}
