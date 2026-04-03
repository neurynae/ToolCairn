'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';
import { useEffect, useState } from 'react';

interface McpEvent {
  id: string;
  tool_name: string;
  status: string;
  duration_ms: number;
  created_at: string;
}

export function ActivityFeed() {
  const [events, setEvents] = useState<McpEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/events?pageSize=10')
      .then((r) => r.json())
      .then((j: { ok: boolean; data?: { items: McpEvent[] } }) => {
        if (j.ok && j.data) setEvents(j.data.items);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">Recent MCP Events</CardTitle>
      </CardHeader>
      <CardContent className="space-y-0">
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-12 ml-auto" />
              </div>
            ))}
          </div>
        ) : events.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">No events yet</p>
        ) : (
          <div className="divide-y divide-border">
            {events.map((event) => (
              <div key={event.id} className="flex items-center gap-3 py-2.5 text-sm">
                <span className="font-mono text-xs text-muted-foreground truncate max-w-[180px]">
                  {event.tool_name}
                </span>
                <Badge
                  variant="outline"
                  className={
                    event.status === 'ok'
                      ? 'text-emerald-400 border-emerald-400/30 bg-emerald-400/10 text-xs'
                      : 'text-red-400 border-red-400/30 bg-red-400/10 text-xs'
                  }
                >
                  {event.status}
                </Badge>
                <span className="text-xs text-muted-foreground ml-auto whitespace-nowrap">
                  {event.duration_ms}ms ·{' '}
                  {formatDistanceToNow(new Date(event.created_at), { addSuffix: true })}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
