'use client';

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
      ? 'text-emerald-600'
      : confidencePct >= 40
        ? 'text-amber-600'
        : 'text-red-500';

  const displayName =
    (item.nodeData.display_name as string) ?? (item.nodeData.name as string) ?? item.id;
  const description = (item.nodeData.description as string) ?? '';

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-medium uppercase tracking-wider text-gray-400 bg-gray-100 rounded px-1.5 py-0.5">
              {item.nodeType}
            </span>
            <span className="text-xs text-gray-400">{item.source}</span>
          </div>
          <h3 className="mt-1 text-sm font-semibold text-gray-900 truncate">{displayName}</h3>
          {description && (
            <p className="mt-0.5 text-xs text-gray-500 line-clamp-2">{description}</p>
          )}
        </div>

        <div className="shrink-0 text-right">
          <p className={`text-lg font-bold ${confColor}`}>{confidencePct}%</p>
          <p className="text-[10px] text-gray-400">confidence</p>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <p className="text-[10px] text-gray-400">
          {item.supportingQueries.length} supporting{' '}
          {item.supportingQueries.length === 1 ? 'query' : 'queries'}
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={rejectPending || approvePending}
            onClick={onReject}
            className="px-3 py-1 text-xs rounded-md border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-40 transition-colors"
          >
            {rejectPending ? 'Rejecting…' : 'Reject'}
          </button>
          <button
            type="button"
            disabled={approvePending || rejectPending}
            onClick={onApprove}
            className="px-3 py-1 text-xs rounded-md bg-emerald-500 text-white font-medium hover:bg-emerald-600 disabled:opacity-40 transition-colors"
          >
            {approvePending ? 'Approving…' : 'Approve'}
          </button>
        </div>
      </div>
    </div>
  );
}
