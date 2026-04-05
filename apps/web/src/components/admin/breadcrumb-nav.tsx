'use client';

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { usePathname } from 'next/navigation';

const SEGMENT_LABELS: Record<string, string> = {
  admin: 'Admin',
  dashboard: 'Dashboard',
  graph: 'Graph Mesh',
  edges: 'Edges',
  tools: 'Tools',
  indexer: 'Indexer',
  review: 'Review Queue',
  weights: 'Weights',
  metrics: 'Metrics',
  sessions: 'Sessions',
  events: 'Events',
  reports: 'Reports',
  settings: 'Settings',
};

export function BreadcrumbNav() {
  const pathname = usePathname();
  const segments = pathname.split('/').filter(Boolean);

  // Build breadcrumb items — skip 'admin' as it's implied
  const crumbs = segments
    .map((seg, i) => ({
      label: SEGMENT_LABELS[seg] ?? seg,
      href: `/${segments.slice(0, i + 1).join('/')}`,
      isLast: i === segments.length - 1,
    }))
    .filter((c) => c.label !== 'Admin'); // hide the 'admin' root segment

  if (crumbs.length === 0) return null;

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {crumbs.map((crumb, i) => (
          <span key={crumb.href} className="flex items-center gap-1.5">
            {i > 0 && <BreadcrumbSeparator />}
            <BreadcrumbItem>
              {crumb.isLast ? (
                <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink href={crumb.href}>{crumb.label}</BreadcrumbLink>
              )}
            </BreadcrumbItem>
          </span>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
