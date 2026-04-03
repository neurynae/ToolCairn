import type { ReactNode } from 'react';
import { AppSidebar } from '@/components/admin/app-sidebar';
import { BreadcrumbNav } from '@/components/admin/breadcrumb-nav';
import { Separator } from '@/components/ui/separator';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-12 shrink-0 items-center gap-2 border-b border-border px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="h-4" />
          <BreadcrumbNav />
        </header>
        <div className="flex flex-1 flex-col gap-6 p-6 overflow-auto">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
