import type { ReviewItem } from '@/lib/admin/staged-review.service';
import { listPendingReview } from '@/lib/admin/staged-review.service';
import { ReviewQueue } from '@/components/admin/review/review-queue';

export default async function ReviewPage() {
  let items: ReviewItem[] = [];
  let total = 0;
  let pendingCount = 0;

  try {
    const result = await listPendingReview(1, 20);
    items = result.items;
    total = result.total;
    pendingCount = result.pendingCount;
  } catch {
    // Postgres unavailable — render empty state
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-lg font-semibold text-gray-900">Review Queue</h1>
        <p className="text-sm text-gray-500">
          Approve or reject AI-generated nodes before they graduate to the graph.
        </p>
      </div>

      <ReviewQueue
        initialItems={items}
        initialTotal={total}
        initialPendingCount={pendingCount}
      />
    </div>
  );
}
