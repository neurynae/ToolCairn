'use client';

import type { ReviewItem } from '@/lib/admin/staged-review.service';
import { useCallback, useState } from 'react';
import { RejectionDialog } from './rejection-dialog';
import { StagedNodeCard } from './staged-node-card';

interface ReviewQueueProps {
  initialItems: ReviewItem[];
  initialTotal: number;
  initialPendingCount: number;
}

type ActionState = { type: 'approve' | 'reject'; id: string } | null;

export function ReviewQueue({ initialItems, initialTotal, initialPendingCount }: ReviewQueueProps) {
  const [items, setItems] = useState<ReviewItem[]>(initialItems);
  const [total, setTotal] = useState(initialTotal);
  const [pendingCount, setPendingCount] = useState(initialPendingCount);
  const [action, setAction] = useState<ActionState>(null);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [pendingRejectId, setPendingRejectId] = useState<string | null>(null);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
    setTotal((t) => Math.max(0, t - 1));
    setPendingCount((c) => Math.max(0, c - 1));
  }, []);

  async function sendAction(
    id: string,
    body: { action: 'approve' } | { action: 'reject'; reason: string },
  ) {
    setAction({ type: body.action, id });
    try {
      const res = await fetch(`/api/admin/review/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.ok) removeItem(id);
    } finally {
      setAction(null);
    }
  }

  function handleApprove(id: string) {
    void sendAction(id, { action: 'approve' });
  }

  function handleRejectClick(id: string) {
    setPendingRejectId(id);
    setRejectDialogOpen(true);
  }

  function handleRejectConfirm(reason: string) {
    if (!pendingRejectId) return;
    setRejectDialogOpen(false);
    void sendAction(pendingRejectId, { action: 'reject', reason });
    setPendingRejectId(null);
  }

  return (
    <>
      <div className="mb-4 flex items-center gap-3">
        <span className="text-sm text-gray-500">
          <span className="font-semibold text-gray-900">{pendingCount}</span> pending
        </span>
        <span className="text-sm text-gray-400">·</span>
        <span className="text-sm text-gray-500">
          <span className="font-semibold text-gray-900">{total}</span> total
        </span>
      </div>

      {items.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-200 py-16 text-center">
          <p className="text-sm font-medium text-gray-400">Queue is empty</p>
          <p className="mt-1 text-xs text-gray-300">All nodes have been reviewed.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {items.map((item) => (
            <StagedNodeCard
              key={item.id}
              item={item}
              onApprove={() => handleApprove(item.id)}
              onReject={() => handleRejectClick(item.id)}
              approvePending={action?.type === 'approve' && action.id === item.id}
              rejectPending={action?.type === 'reject' && action.id === item.id}
            />
          ))}
        </div>
      )}

      <RejectionDialog
        open={rejectDialogOpen}
        onOpenChange={setRejectDialogOpen}
        onConfirm={handleRejectConfirm}
        pending={action?.type === 'reject'}
      />
    </>
  );
}
