'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import type { ReviewItem } from '@/lib/admin/staged-review.service';

interface StagedNodeCardProps {
  item: ReviewItem;
  onApprove: () => void;
  onReject: () => void;
  approvePending: boolean;
  rejectPending: boolean;
}

export function StagedNodeCard({
  item,
  onApprove,
  onReject,
  approvePending,
  rejectPending,
}: StagedNodeCardProps) {
  const confidencePct = Math.round(item.confidence * 100);
  const confColor =
    confidencePct >= 70
      ? 'text-emerald-400'
      : confidencePct >= 40
        ? 'text-amber-400'
        : 'text-red-400';

  const displayName =
    (item.nodeData.display_name as string) ?? (item.nodeData.name as string) ?? item.id;
  const description = (item.nodeData.description as string) ?? '';

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className="text-xs uppercase tracking-wider">
                {item.nodeType}
              </Badge>
              <span className="text-xs text-muted-foreground">{item.source}</span>
            </div>
            <h3 className="mt-1.5 text-sm font-semibold truncate">{displayName}</h3>
            {description && (
              <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">{description}</p>
            )}
          </div>
          <div className="shrink-0 text-right">
            <p className={`text-lg font-bold ${confColor}`}>{confidencePct}%</p>
            <p className="text-[10px] text-muted-foreground">confidence</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center justify-between">
          <p className="text-[10px] text-muted-foreground">
            {item.supportingQueries.length} supporting{' '}
            {item.supportingQueries.length === 1 ? 'query' : 'queries'}
          </p>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={rejectPending || approvePending}
              onClick={onReject}
              className="text-red-400 border-red-400/30 hover:bg-red-400/10 h-7 text-xs"
            >
              {rejectPending ? 'Rejecting…' : 'Reject'}
            </Button>
            <Button
              size="sm"
              disabled={approvePending || rejectPending}
              onClick={onApprove}
              className="bg-emerald-600 hover:bg-emerald-700 text-white h-7 text-xs"
            >
              {approvePending ? 'Approving…' : 'Approve'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
