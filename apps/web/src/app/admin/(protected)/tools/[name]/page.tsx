'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { ExternalLink, Star, GitBranch, Users, AlertCircle } from 'lucide-react';
import { PageHeader } from '@/components/admin/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

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

export default function ToolDetailPage() {
  const params = useParams<{ name: string }>();
  const [tool, setTool] = useState<ToolDetail | null>(null);
  const [neighbors, setNeighbors] = useState<Neighbor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!params.name) return;
    fetch(`/api/admin/tools/${encodeURIComponent(params.name)}`)
      .then((r) => r.json())
      .then((j: { ok: boolean; data?: { tool: ToolDetail; neighbors: Neighbor[] }; error?: string }) => {
        if (j.ok && j.data) {
          setTool(j.data.tool);
          setNeighbors(j.data.neighbors);
        } else {
          setError(j.error ?? 'Failed to load tool');
        }
      })
      .catch(() => setError('Network error'))
      .finally(() => setLoading(false));
  }, [params.name]);

  if (loading) {
    return (
      <>
        <div className="flex gap-4 items-start">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-8 w-24 ml-auto" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i}><CardContent className="pt-6"><Skeleton className="h-24 w-full" /></CardContent></Card>
          ))}
        </div>
      </>
    );
  }

  if (error || !tool) {
    return (
      <>
        <PageHeader title="Tool not found" />
        <Card className="border-destructive/50">
          <CardContent className="pt-6 text-sm text-muted-foreground">{error}</CardContent>
        </Card>
      </>
    );
  }

  const healthPct = Math.round(tool.health.maintenanceScore * 100);

  return (
    <>
      <PageHeader
        title={tool.displayName}
        description={tool.description || tool.name}
        actions={
          <div className="flex gap-2">
            {tool.githubUrl && (
              <Button render={<a href={tool.githubUrl} target="_blank" rel="noopener noreferrer" />} size="sm" variant="outline" className="gap-2">
                <ExternalLink className="h-3.5 w-3.5" />
                GitHub
              </Button>
            )}
            {tool.docs.docsUrl && (
              <Button render={<a href={tool.docs.docsUrl} target="_blank" rel="noopener noreferrer" />} size="sm" variant="outline" className="gap-2">
                <ExternalLink className="h-3.5 w-3.5" />
                Docs
              </Button>
            )}
          </div>
        }
      />

      {/* Overview cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-1"><CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1"><Star className="h-3 w-3" />Stars</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{tool.health.stars.toLocaleString()}</p><p className="text-xs text-emerald-400">+{tool.health.starsVelocity90d.toLocaleString()} (90d)</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1"><CardTitle className="text-xs font-medium text-muted-foreground">Health Score</CardTitle></CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{healthPct}%</p>
            <Badge variant="outline" className={`text-xs mt-1 ${scoreBadgeClass(tool.health.maintenanceScore)}`}>
              {healthPct >= 70 ? 'Healthy' : healthPct >= 40 ? 'Fair' : 'Poor'}
            </Badge>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1"><CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1"><GitBranch className="h-3 w-3" />Commits/30d</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{tool.health.commitVelocity30d}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1"><CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1"><Users className="h-3 w-3" />Contributors</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{tool.health.contributorCount}</p></CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Metadata */}
        <Card>
          <CardHeader><CardTitle className="text-sm font-medium">Metadata</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Category</span><Badge variant="outline" className="capitalize">{tool.category}</Badge></div>
            <Separator />
            <div className="flex justify-between"><span className="text-muted-foreground">Language</span><span>{tool.language || '—'}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">License</span><span>{tool.license || '—'}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Open Issues</span><span className="flex items-center gap-1"><AlertCircle className="h-3 w-3 text-amber-400" />{tool.health.openIssues}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">PR Response</span><span>{tool.health.prResponseTimeHours ? `${Math.round(tool.health.prResponseTimeHours)}h` : '—'}</span></div>
            <Separator />
            {tool.topics.length > 0 && (
              <div>
                <p className="text-muted-foreground mb-2">Topics</p>
                <div className="flex flex-wrap gap-1">
                  {tool.topics.slice(0, 8).map((t) => (
                    <Badge key={t} variant="outline" className="text-xs">{t}</Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Health signals */}
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
            {tool.docs.readmeUrl && <a href={tool.docs.readmeUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">README <ExternalLink className="h-3 w-3" /></a>}
            {tool.docs.changelogUrl && <a href={tool.docs.changelogUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">Changelog <ExternalLink className="h-3 w-3" /></a>}
          </CardContent>
        </Card>

        {/* Deployment */}
        <Card>
          <CardHeader><CardTitle className="text-sm font-medium">Deployment</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            {tool.deploymentModels.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {tool.deploymentModels.map((m) => <Badge key={m} variant="outline" className="text-xs capitalize">{m}</Badge>)}
              </div>
            ) : <p className="text-muted-foreground">No deployment models specified</p>}
            <Separator />
            {tool.languages.length > 1 && (
              <div>
                <p className="text-muted-foreground mb-1">Languages</p>
                <div className="flex flex-wrap gap-1">
                  {tool.languages.map((l) => <Badge key={l} variant="outline" className="text-xs">{l}</Badge>)}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Related tools */}
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
                  <TableRow key={`${n.toolName}-${n.edgeType}-${i}`} className="cursor-pointer" onClick={() => window.location.href = `/admin/tools/${encodeURIComponent(n.toolName)}`}>
                    <TableCell className="font-medium text-sm">{n.toolDisplayName}</TableCell>
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
