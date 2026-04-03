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

interface OutcomeReport {
  id: string;
  query_id: string;
  chosen_tool: string;
  reason: string | null;
  outcome: string | null;
  feedback: string | null;
  processed: boolean;
  processed_at: string | null;
  created_at: string;
}

interface ReportsData {
  items: OutcomeReport[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

const OUTCOME_BADGE: Record<string, string> = {
  success: 'text-emerald-400 border-emerald-400/30 bg-emerald-400/10',
  failure: 'text-red-400 border-red-400/30 bg-red-400/10',
  replaced: 'text-amber-400 border-amber-400/30 bg-amber-400/10',
  pending: 'text-sky-400 border-sky-400/30 bg-sky-400/10',
};

export default function ReportsPage() {
  const [data, setData] = useState<ReportsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [outcome, setOutcome] = useState('');
  const [processed, setProcessed] = useState('');
  const [page, setPage] = useState(1);

  const fetchReports = useCallback(async (o: string, pr: string, p: number) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(p), pageSize: '25' });
      if (o) params.set('outcome', o);
      if (pr !== '') params.set('processed', pr);
      const res = await fetch(`/api/admin/outcomes?${params}`);
      const json = (await res.json()) as { ok: boolean; data: ReportsData };
      if (json.ok) setData(json.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchReports(outcome, processed, page);
  }, [fetchReports, outcome, processed, page]);

  const handleOutcome = (val: string) => { setOutcome(val); setPage(1); };
  const handleProcessed = (val: string) => { setProcessed(val); setPage(1); };

  return (
    <>
      <PageHeader
        title="Reports"
        description={data ? `${data.total.toLocaleString()} outcome reports from the feedback loop` : 'Loading…'}
      />

      {/* Filters */}
      <div className="flex items-center gap-3">
        <Select value={outcome} onValueChange={(v) => handleOutcome(v ?? '')}>
          <SelectTrigger size="sm" className="w-40">
            <SelectValue placeholder="All outcomes" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All outcomes</SelectItem>
            <SelectItem value="success">success</SelectItem>
            <SelectItem value="failure">failure</SelectItem>
            <SelectItem value="replaced">replaced</SelectItem>
            <SelectItem value="pending">pending</SelectItem>
          </SelectContent>
        </Select>
        <Select value={processed} onValueChange={(v) => handleProcessed(v ?? '')}>
          <SelectTrigger size="sm" className="w-40">
            <SelectValue placeholder="All records" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All records</SelectItem>
            <SelectItem value="false">Unprocessed</SelectItem>
            <SelectItem value="true">Processed</SelectItem>
          </SelectContent>
        </Select>
        {(outcome || processed) && (
          <Button size="sm" variant="ghost" onClick={() => { setOutcome(''); setProcessed(''); setPage(1); }}>
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
                <TableHead>Chosen Tool</TableHead>
                <TableHead>Outcome</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Feedback</TableHead>
                <TableHead>Processed</TableHead>
                <TableHead>Time</TableHead>
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
                : data?.items.length === 0
                  ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                          No outcome reports yet
                        </TableCell>
                      </TableRow>
                    )
                  : data?.items.map((report) => (
                      <TableRow key={report.id}>
                        <TableCell className="font-medium text-sm">{report.chosen_tool}</TableCell>
                        <TableCell>
                          {report.outcome ? (
                            <Badge variant="outline" className={OUTCOME_BADGE[report.outcome] ?? ''}>
                              {report.outcome}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground text-xs">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground max-w-xs truncate">
                          {report.reason ?? '—'}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground max-w-xs truncate">
                          {report.feedback ?? '—'}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              report.processed
                                ? 'text-emerald-400 border-emerald-400/30'
                                : 'text-muted-foreground border-border'
                            }
                          >
                            {report.processed ? 'yes' : 'no'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(report.created_at), { addSuffix: true })}
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
