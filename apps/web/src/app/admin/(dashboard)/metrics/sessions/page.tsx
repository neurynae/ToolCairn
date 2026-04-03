'use client';

import { useCallback, useEffect, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
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

interface SearchSession {
  id: string;
  query: string;
  status: string;
  stage: number;
  created_at: string;
  updated_at: string;
  expires_at: string;
}

interface SessionsData {
  items: SearchSession[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

const STATUS_BADGE: Record<string, string> = {
  active: 'text-sky-400 border-sky-400/30 bg-sky-400/10',
  completed: 'text-emerald-400 border-emerald-400/30 bg-emerald-400/10',
  abandoned: 'text-muted-foreground border-border',
};

export default function SessionsPage() {
  const [data, setData] = useState<SessionsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);

  const fetchSessions = useCallback(async (st: string, p: number) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(p), pageSize: '25' });
      if (st) params.set('status', st);
      const res = await fetch(`/api/admin/sessions?${params}`);
      const json = (await res.json()) as { ok: boolean; data: SessionsData };
      if (json.ok) setData(json.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchSessions(status, page);
  }, [fetchSessions, status, page]);

  const handleStatus = (val: string) => { setStatus(val); setPage(1); };

  return (
    <>
      <PageHeader
        title="Search Sessions"
        description={data ? `${data.total.toLocaleString()} sessions` : 'Loading…'}
      />

      {/* Filter */}
      <div className="flex items-center gap-3">
        <Select value={status} onValueChange={(v) => handleStatus(v ?? '')}>
          <SelectTrigger size="sm" className="w-44">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All statuses</SelectItem>
            <SelectItem value="active">active</SelectItem>
            <SelectItem value="completed">completed</SelectItem>
            <SelectItem value="abandoned">abandoned</SelectItem>
          </SelectContent>
        </Select>
        {status && (
          <Button size="sm" variant="ghost" onClick={() => handleStatus('')}>Clear</Button>
        )}
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Query</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Stage</TableHead>
                <TableHead>Started</TableHead>
                <TableHead>Expires</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading
                ? Array.from({ length: 8 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 5 }).map((_, j) => (
                        <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                      ))}
                    </TableRow>
                  ))
                : data?.items.length === 0
                  ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                          No sessions yet
                        </TableCell>
                      </TableRow>
                    )
                  : data?.items.map((session) => (
                      <TableRow key={session.id}>
                        <TableCell className="max-w-xs">
                          <p className="text-sm font-medium truncate">{session.query}</p>
                          <p className="text-xs text-muted-foreground font-mono">{session.id.slice(0, 8)}</p>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={STATUS_BADGE[session.status] ?? ''}>
                            {session.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right text-sm">{session.stage}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(session.created_at), { addSuffix: true })}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {new Date(session.expires_at) < new Date() ? (
                            <span className="text-red-400">expired</span>
                          ) : (
                            formatDistanceToNow(new Date(session.expires_at), { addSuffix: true })
                          )}
                        </TableCell>
                      </TableRow>
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
