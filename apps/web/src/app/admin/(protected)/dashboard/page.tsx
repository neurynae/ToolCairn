import { PageHeader } from '@/components/admin/page-header';
import { HealthCards } from '@/components/admin/dashboard/health-cards';
import { QuickActions } from '@/components/admin/dashboard/quick-actions';
import { ActivityFeed } from '@/components/admin/dashboard/activity-feed';

export default function DashboardPage() {
  return (
    <>
      <PageHeader
        title="Dashboard"
        description="System health and operational overview"
      />

      <HealthCards />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <QuickActions />
        </div>
        <div className="lg:col-span-2">
          <ActivityFeed />
        </div>
      </div>
    </>
  );
}
