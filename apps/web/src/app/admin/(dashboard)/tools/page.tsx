'use client';

import { useCallback, useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/admin/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
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

interface Tool {
  id: string;
  name: string;
  displayName: string;
  category: string;
  language: string;
  githubUrl: string;
  maintenanceScore: number;
  stars: number;
  starsVelocity90d: number;
  lastCommitDate: string;
  contributorCount: number;
}

interface ToolsData {
  tools: Tool[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

const CATEGORIES = [
  'web-framework', 'testing', 'relational-database', 'vector-database',
  'graph-database', 'cache', 'queue', 'auth', 'monitoring', 'llm-framework',
  'agent-framework', 'embedding', 'search', 'devops', 'other',
] as const;

const SCORE_BADGE: Record<string, string> = {};
function scoreBadgeClass(score: number): string {
  const pct = Math.round(score * 100);
  if (pct >= 70) return 'text-emerald-400 border-emerald-400/30 bg-emerald-400/10';
  if (pct >= 40) return 'text-amber-400 border-amber-400/30 bg-amber-400/10';
  return 'text-red-400 border-red-400/30 bg-red-400/10';
}

export default function ToolsPage() {
  const router = useRouter();
  const [data, setData] = useState<ToolsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [page, setPage] = useState(1);
  const [, startTransition] = useTransition();

  const fetchTools = useCallback(
    async (s: string, cat: string, p: number) => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          search: s,
          category: cat,
          page: String(p),
          pageSize: '30',
        });
        const res = await fetch(`/api/admin/tools?${params}`);
        const json = (await res.json()) as { ok: boolean; data: ToolsData };
        if (json.ok) setData(json.data);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    void fetchTools(search, category, page);
  }, [fetchTools, search, category, page]);

  // Debounced search
  const handleSearch = (val: string) => {
    setSearch(val);
    setPage(1);
  };

  const handleCategory = (val: string) => {
    setCategory(val);
    setPage(1);
  };

  return (
    <>
      <PageHeader
        title="Tools"
        description={data ? `${data.total.toLocaleString()} tools in the graph` : 'Loading…'}
      />

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <Input
          placeholder="Search by name…"
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          className="w-64"
        />
        <Select value={category} onValueChange={(v) => handleCategory(v ?? '')}>
          <SelectTrigger size="sm" className="w-44">
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All categories</SelectItem>
            {CATEGORIES.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {(search || category) && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setSearch('');
              setCategory('');
              setPage(1);
            }}
          >
            Clear filters
          </Button>
        )}
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tool</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Language</TableHead>
                <TableHead className="text-right">Health</TableHead>
                <TableHead className="text-right">Stars</TableHead>
                <TableHead className="text-right">+90d</TableHead>
                <TableHead className="text-right">Contributors</TableHead>
                <TableHead className="w-8" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading
                ? Array.from({ length: 10 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 8 }).map((_, j) => (
                        <TableCell key={j}>
                          <Skeleton className="h-4 w-full" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                : data?.tools.map((tool) => {
                    const pct = Math.round(tool.maintenanceScore * 100);
                    return (
                      <TableRow
                        key={tool.id}
                        className="cursor-pointer"
                        onClick={() => router.push(`/admin/tools/${encodeURIComponent(tool.name)}`)}
                      >
                        <TableCell>
                          <div>
                            <p className="font-medium text-sm">{tool.displayName}</p>
                            <p className="text-xs text-muted-foreground font-mono">{tool.name}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs capitalize">
                            {tool.category}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {tool.language || '—'}
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant="outline" className={scoreBadgeClass(tool.maintenanceScore)}>
                            {pct}%
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right text-sm">
                          {tool.stars.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right text-sm text-emerald-400">
                          +{tool.starsVelocity90d.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right text-sm">
                          {tool.contributorCount}
                        </TableCell>
                        <TableCell>
                          {tool.githubUrl && (
                            <a
                              href={tool.githubUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-muted-foreground hover:text-foreground"
                              onClick={(e) => e.stopPropagation()}
                            >
                              ↗
                            </a>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
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
