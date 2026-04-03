'use client';

import { useCallback, useEffect, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { PageHeader } from '@/components/admin/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

interface McpEvent {
  id: string;
  tool_name: string;
  query_id: string | null;
  duration_ms: number;
  status: string;
  metadata: unknown;
  created_at: string;
}

interface EventsData {
  items: McpEvent[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export default function EventsPage() {
  const [data, setData] = useState<EventsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [toolName, setToolName] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [expanded, setExpanded] = useState<string | null>(null);

  const fetchEvents = useCallback(async (tool: string, st: string, p: number) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(p), pageSize: '25' });
      if (tool) params.set('toolName', tool);
      if (st) params.set('status', st);
      const res = await fetch(`/api/admin/events?${params}`);
      const json = (await res.json()) as { ok: boolean; data: EventsData };
      if (json.ok) setData(json.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchEvents(toolName, status, page);
  }, [fetchEvents, toolName, status, page]);

  const handleSearch = (val: string) => { setToolName(val); setPage(1); };
  const handleStatus = (val: string) => { setStatus(val); setPage(1); };

  const errRate = data
    ? Math.round((data.items.filter((e) => e.status === 'error').length / Math.max(data.items.length, 1)) * 100)
    : 0;
  const avgMs = data && data.items.length > 0
    ? Math.round(data.items.reduce((s, e) => s + e.duration_ms, 0) / data.items.length)
    : 0;

  return (
    <>
      <PageHeader
        title="Events"
        description={data ? `${data.total.toLocaleString()} MCP tool invocations` : 'Loading…'}
      />

      {/* Stats row */}
      {data && (
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-1"><CardTitle className="text-sm font-medium text-muted-foreground">Total (page)</CardTitle></CardHeader>
            <CardContent><p className="text-2xl font-bold">{data.items.length}</p></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-1"><CardTitle className="text-sm font-medium text-muted-foreground">Error rate</CardTitle></CardHeader>
            <CardContent><p className={`text-2xl font-bold ${errRate > 10 ? 'text-red-400' : 'text-emerald-400'}`}>{errRate}%</p></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-1"><CardTitle className="text-sm font-medium text-muted-foreground">Avg latency</CardTitle></CardHeader>
            <CardContent><p className="text-2xl font-bold">{avgMs}ms</p></CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-3">
        <Input
          placeholder="Filter by tool name…"
          value={toolName}
          onChange={(e) => handleSearch(e.target.value)}
          className="w-64"
        />
        <Select value={status} onValueChange={(v) => handleStatus(v ?? '')}>
          <SelectTrigger size="sm" className="w-36">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All statuses</SelectItem>
            <SelectItem value="ok">ok</SelectItem>
            <SelectItem value="error">error</SelectItem>
          </SelectContent>
        </Select>
        {(toolName || status) && (
          <Button size="sm" variant="ghost" onClick={() => { setToolName(''); setStatus(''); setPage(1); }}>
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
                <TableHead>Tool</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Duration</TableHead>
                <TableHead>Query ID</TableHead>
                <TableHead>Time</TableHead>
                <TableHead className="w-8" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading
                ? Array.from({ length: 8 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 6 }).map((_, j) => (
                        <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                      ))}
                    </TableRow>
                  ))
                : data?.items.map((event) => (
                    <>
                      <TableRow
                        key={event.id}
                        className="cursor-pointer"
                        onClick={() => setExpanded(expanded === event.id ? null : event.id)}
                      >
                        <TableCell className="font-mono text-xs">{event.tool_name}</TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              event.status === 'ok'
                                ? 'text-emerald-400 border-emerald-400/30 bg-emerald-400/10'
                                : 'text-red-400 border-red-400/30 bg-red-400/10'
                            }
                          >
                            {event.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right text-sm">{event.duration_ms}ms</TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          {event.query_id?.slice(0, 8) ?? '—'}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(event.created_at), { addSuffix: true })}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {expanded === event.id ? '▲' : '▼'}
                        </TableCell>
                      </TableRow>
                      {expanded === event.id && (
                        <TableRow key={`${event.id}-meta`}>
                          <TableCell colSpan={6} className="bg-muted/30 py-3">
                            <pre className="text-xs text-muted-foreground overflow-auto max-h-32 whitespace-pre-wrap">
                              {event.metadata
                                ? JSON.stringify(event.metadata, null, 2)
                                : 'No metadata'}
                            </pre>
                          </TableCell>
                        </TableRow>
                      )}
                    </>
                  ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Showing {(data.page - 1) * data.pageSize + 1}–{Math.min(data.page * data.pageSize, data.total)} of {data.total.toLocaleString()}
          </span>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
            <span>Page {data.page} / {data.totalPages}</span>
            <Button size="sm" variant="outline" disabled={page >= data.totalPages} onClick={() => setPage((p) => p + 1)}>Next</Button>
          </div>
        </div>
      )}
    </>
  );
}
