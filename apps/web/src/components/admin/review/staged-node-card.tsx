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
  const confBadgeClass =
    confidencePct >= 70
      ? 'text-emerald-400 border-emerald-400/30 bg-emerald-400/10'
      : confidencePct >= 40
        ? 'text-amber-400 border-amber-400/30 bg-amber-400/10'
        : 'text-red-400 border-red-400/30 bg-red-400/10';

  const displayName =
    (item.nodeData.display_name as string) ?? (item.nodeData.name as string) ?? item.id;
  const description = (item.nodeData.description as string) ?? '';

  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-2">
        {/* Badge row: type + source + confidence all inline, no overflow */}
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className="text-xs uppercase tracking-wider shrink-0">
            {item.nodeType}
          </Badge>
          <span className="text-xs text-muted-foreground shrink-0">{item.source}</span>
          <Badge
            variant="outline"
            className={`ml-auto text-xs font-semibold shrink-0 ${confBadgeClass}`}
          >
            {confidencePct}%
          </Badge>
        </div>
        {/* Title — truncates correctly within card width */}
        <h3 className="mt-2 text-sm font-semibold leading-snug line-clamp-2">{displayName}</h3>
        {description && (
          <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{description}</p>
        )}
      </CardHeader>
      <CardContent className="pt-0 mt-auto">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[10px] text-muted-foreground">
            {item.supportingQueries.length} supporting{' '}
            {item.supportingQueries.length === 1 ? 'query' : 'queries'}
          </p>
          <div className="flex gap-2 shrink-0">
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
