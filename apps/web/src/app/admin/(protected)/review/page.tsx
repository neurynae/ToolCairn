import type { ReviewItem } from '@/lib/admin/staged-review.service';
import { listPendingReview } from '@/lib/admin/staged-review.service';
import { ReviewQueue } from '@/components/admin/review/review-queue';
import { PageHeader } from '@/components/admin/page-header';
import { Badge } from '@/components/ui/badge';
import { PROXY_ENABLED, proxyGet } from '@/lib/admin/api-proxy';

export default async function ReviewPage() {
  let items: ReviewItem[] = [];
  let total = 0;
  let pendingCount = 0;

  try {
    if (PROXY_ENABLED) {
      const res = await proxyGet('/review/nodes', new URLSearchParams({ page: '1', pageSize: '20' }));
      const json = (await res.json()) as {
        ok: boolean;
        data?: { items: ReviewItem[]; total: number; pendingCount: number };
      };
      if (json.ok && json.data) {
        items = json.data.items;
        total = json.data.total;
        pendingCount = json.data.pendingCount;
      }
    } else {
      const result = await listPendingReview(1, 20);
      items = result.items;
      total = result.total;
      pendingCount = result.pendingCount;
    }
  } catch {
    // API unavailable — render empty state
  }

  return (
    <>
      <PageHeader
        title="Review Queue"
        description="Approve or reject AI-generated nodes before they graduate to the graph."
        actions={
          pendingCount > 0 ? (
            <Badge variant="outline" className="text-amber-400 border-amber-400/30 bg-amber-400/10">
              {pendingCount} pending
            </Badge>
          ) : undefined
        }
      />
      <ReviewQueue initialItems={items} initialTotal={total} initialPendingCount={pendingCount} />
    </>
  );
}
