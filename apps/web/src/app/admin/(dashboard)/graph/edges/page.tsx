'use client';

import { useCallback, useEffect, useState } from 'react';
import { PageHeader } from '@/components/admin/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface Edge {
  sourceId: string;
  sourceName: string;
  sourceDisplayName: string;
  targetId: string;
  targetName: string;
  targetDisplayName: string;
  edgeType: string;
  baseWeight: number;
  effectiveWeight: number;
  confidence: number;
  edgeSource: string;
  lastVerified: string | null;
}

interface EdgesData {
  edges: Edge[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  edgeTypes: string[];
}

const EDGE_COLORS: Record<string, string> = {
  REQUIRES: 'text-violet-400 border-violet-400/30 bg-violet-400/10',
  INTEGRATES_WITH: 'text-emerald-400 border-emerald-400/30 bg-emerald-400/10',
  SOLVES: 'text-amber-400 border-amber-400/30 bg-amber-400/10',
  FOLLOWS: 'text-orange-400 border-orange-400/30 bg-orange-400/10',
  BELONGS_TO: 'text-sky-400 border-sky-400/30 bg-sky-400/10',
  REPLACES: 'text-rose-400 border-rose-400/30 bg-rose-400/10',
  CONFLICTS_WITH: 'text-red-400 border-red-400/30 bg-red-400/10',
};

function edgeBadgeClass(type: string): string {
  return EDGE_COLORS[type] ?? 'text-muted-foreground border-border';
}

function weightBar(value: number) {
  const pct = Math.round(value * 100);
  const color = pct >= 60 ? 'bg-emerald-500' : pct >= 30 ? 'bg-amber-500' : 'bg-red-500';
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-16 rounded-full bg-muted overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-muted-foreground w-8 text-right">{pct}%</span>
    </div>
  );
}

export default function EdgesPage() {
  const [data, setData] = useState<EdgesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [edgeType, setEdgeType] = useState('');
  const [page, setPage] = useState(1);

  const fetchEdges = useCallback(async (et: string, p: number) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ edgeType: et, page: String(p), pageSize: '30' });
      const res = await fetch(`/api/admin/edges?${params}`);
      const json = (await res.json()) as { ok: boolean; data: EdgesData };
      if (json.ok) setData(json.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchEdges(edgeType, page);
  }, [fetchEdges, edgeType, page]);

  const handleEdgeType = (val: string) => {
    setEdgeType(val);
    setPage(1);
  };

  return (
    <>
      <PageHeader
        title="Edges"
        description={data ? `${data.total.toLocaleString()} edges in the graph` : 'Loading…'}
      />

      {/* Filter */}
      <div className="flex items-center gap-3">
        <Select value={edgeType} onValueChange={(v) => handleEdgeType(v ?? '')}>
          <SelectTrigger size="sm" className="w-48">
            <SelectValue placeholder="All edge types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All edge types</SelectItem>
            {data?.edgeTypes.map((et) => (
              <SelectItem key={et} value={et}>
                {et}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {edgeType && (
          <Button size="sm" variant="ghost" onClick={() => handleEdgeType('')}>
            Clear
          </Button>
        )}
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Source</TableHead>
                <TableHead>Target</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Effective Weight</TableHead>
                <TableHead className="text-right">Base Weight</TableHead>
                <TableHead className="text-right">Confidence</TableHead>
                <TableHead>Source</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading
                ? Array.from({ length: 10 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 7 }).map((_, j) => (
                        <TableCell key={j}>
                          <Skeleton className="h-4 w-full" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                : data?.edges.map((edge, i) => (
                    <TableRow key={`${edge.sourceId}-${edge.targetId}-${edge.edgeType}-${i}`}>
                      <TableCell>
                        <p className="text-sm font-medium">{edge.sourceDisplayName}</p>
                        <p className="text-xs text-muted-foreground font-mono">{edge.sourceName}</p>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm font-medium">{edge.targetDisplayName}</p>
                        <p className="text-xs text-muted-foreground font-mono">{edge.targetName}</p>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={edgeBadgeClass(edge.edgeType)}>
                          {edge.edgeType}
                        </Badge>
                      </TableCell>
                      <TableCell>{weightBar(edge.effectiveWeight)}</TableCell>
                      <TableCell className="text-right text-sm">
                        {Math.round(edge.baseWeight * 100)}%
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {Math.round(edge.confidence * 100)}%
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {edge.edgeSource || '—'}
                      </TableCell>
                    </TableRow>
                  ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination */}
      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Showing {(data.page - 1) * data.pageSize + 1}–
            {Math.min(data.page * data.pageSize, data.total)} of {data.total.toLocaleString()}
          </span>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </Button>
            <span>
              Page {data.page} / {data.totalPages}
            </span>
            <Button
              size="sm"
              variant="outline"
              disabled={page >= data.totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
