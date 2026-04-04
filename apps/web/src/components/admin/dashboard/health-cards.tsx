'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Activity, CheckCircle, Clock, Database, XCircle, Zap } from 'lucide-react';
import { useEffect, useState } from 'react';

interface ServiceHealth {
  ok: boolean;
  latencyMs?: number;
  error?: string;
}

interface QdrantHealth {
  ok: boolean;
  collections?: Record<string, number>;
  error?: string;
}

interface RedisHealth {
  ok: boolean;
  latencyMs?: number;
  queueDepth?: { index: number; scheduler: number };
  error?: string;
}

interface HealthData {
  latencyMs: number;
  memgraph: ServiceHealth;
  qdrant: QdrantHealth;
  postgres: ServiceHealth;
  redis: RedisHealth;
  stats: {
    toolCount: number;
    edgeCount: number;
    pendingReview: number;
    pendingIndex: number;
  } | null;
}

function StatusBadge({ ok }: { ok: boolean }) {
  return ok ? (
    <Badge
      variant="outline"
      className="text-emerald-400 border-emerald-400/30 bg-emerald-400/10 gap-1"
    >
      <CheckCircle className="h-3 w-3" />
      Healthy
    </Badge>
  ) : (
    <Badge variant="outline" className="text-red-400 border-red-400/30 bg-red-400/10 gap-1">
      <XCircle className="h-3 w-3" />
      Down
    </Badge>
  );
}

function ServiceCard({
  title,
  icon: Icon,
  health,
  children,
}: {
  title: string;
  icon: React.ElementType;
  health: { ok: boolean };
  children?: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
          </div>
          <StatusBadge ok={health.ok} />
        </div>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

export function HealthCards() {
  const [data, setData] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/health')
      .then((r) => r.json())
      .then((j: { ok: boolean; data: HealthData }) => {
        if (j.ok) setData(j.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-5 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-4 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!data) {
    return (
      <Card className="border-destructive/50">
        <CardContent className="pt-6 text-sm text-muted-foreground">
          Failed to load health data.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <ServiceCard title="Memgraph" icon={Database} health={data.memgraph}>
          {data.memgraph.ok ? (
            <div className="space-y-1">
              <p className="text-2xl font-semibold">{data.stats?.toolCount ?? '—'}</p>
              <p className="text-xs text-muted-foreground">
                tools · {data.stats?.edgeCount ?? '—'} edges
              </p>
              {data.memgraph.latencyMs !== undefined && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {data.memgraph.latencyMs}ms
                </p>
              )}
            </div>
          ) : (
            <p className="text-xs text-red-400">{data.memgraph.error}</p>
          )}
        </ServiceCard>

        <ServiceCard title="Qdrant" icon={Zap} health={data.qdrant}>
          {data.qdrant.ok ? (
            data.qdrant.collections && Object.keys(data.qdrant.collections).length > 0 ? (
              <div className="space-y-1">
                {Object.entries(data.qdrant.collections).map(([name, count]) => (
                  <div key={name} className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">{name}</span>
                    <span className="text-sm font-medium">{count.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">No collections yet</p>
            )
          ) : (
            <p className="text-xs text-red-400">{data.qdrant.error}</p>
          )}
        </ServiceCard>

        <ServiceCard title="PostgreSQL" icon={Database} health={data.postgres}>
          {data.postgres.ok ? (
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Pending review</span>
                <span className="text-sm font-medium">{data.stats?.pendingReview ?? '—'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Pending index</span>
                <span className="text-sm font-medium">{data.stats?.pendingIndex ?? '—'}</span>
              </div>
              {data.postgres.latencyMs !== undefined && (
                <p className="text-xs text-muted-foreground flex items-center gap-1 pt-1">
                  <Clock className="h-3 w-3" />
                  {data.postgres.latencyMs}ms
                </p>
              )}
            </div>
          ) : (
            <p className="text-xs text-red-400">{data.postgres.error}</p>
          )}
        </ServiceCard>

        <ServiceCard title="Redis" icon={Activity} health={data.redis}>
          {data.redis.ok && data.redis.queueDepth ? (
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Index queue</span>
                <span className="text-sm font-medium">{data.redis.queueDepth.index}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Scheduler queue</span>
                <span className="text-sm font-medium">{data.redis.queueDepth.scheduler}</span>
              </div>
              {data.redis.latencyMs !== undefined && (
                <p className="text-xs text-muted-foreground flex items-center gap-1 pt-1">
                  <Clock className="h-3 w-3" />
                  {data.redis.latencyMs}ms
                </p>
              )}
            </div>
          ) : (
            <p className="text-xs text-red-400">{data.redis.error}</p>
          )}
        </ServiceCard>
      </div>
    </div>
  );
}
