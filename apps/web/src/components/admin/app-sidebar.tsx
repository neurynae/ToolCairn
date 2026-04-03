'use client';

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from '@/components/ui/sidebar';
import {
  Activity,
  BarChart3,
  CheckCircle,
  FileText,
  GitBranch,
  LayoutDashboard,
  Link,
  LogOut,
  Network,
  Package,
  Scale,
  Settings,
} from 'lucide-react';
import { usePathname } from 'next/navigation';

type NavItem = {
  href: string;
  label: string;
  icon: React.ElementType;
};

type NavGroup = {
  label?: string;
  items: NavItem[];
};

const NAV_GROUPS: NavGroup[] = [
  {
    items: [{ href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard }],
  },
  {
    label: 'Graph',
    items: [
      { href: '/admin/graph', label: 'Graph Mesh', icon: Network },
      { href: '/admin/tools', label: 'Tools', icon: Package },
      { href: '/admin/graph/edges', label: 'Edges', icon: Link },
    ],
  },
  {
    label: 'Data',
    items: [
      { href: '/admin/indexer', label: 'Indexer', icon: GitBranch },
      { href: '/admin/review', label: 'Review Queue', icon: CheckCircle },
      { href: '/admin/weights', label: 'Weights', icon: Scale },
    ],
  },
  {
    label: 'Analytics',
    items: [
      { href: '/admin/metrics', label: 'Metrics', icon: BarChart3 },
      { href: '/admin/events', label: 'Events', icon: Activity },
      { href: '/admin/reports', label: 'Reports', icon: FileText },
    ],
  },
  {
    label: 'System',
    items: [{ href: '/admin/settings', label: 'Settings', icon: Settings }],
  },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar collapsible="icon" variant="inset">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex items-center gap-2 px-1 py-1.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground text-xs font-bold shrink-0">
                TC
              </div>
              <div className="flex flex-col leading-none group-data-[collapsible=icon]:hidden">
                <span className="font-semibold text-sm">ToolCairn</span>
                <span className="text-xs text-muted-foreground">Admin</span>
              </div>
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {NAV_GROUPS.map((group, i) => (
          <SidebarGroup key={i}>
            {group.label && <SidebarGroupLabel>{group.label}</SidebarGroupLabel>}
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const isActive =
                    item.href === '/admin/dashboard'
                      ? pathname === '/admin/dashboard'
                      : pathname === item.href || pathname.startsWith(`${item.href}/`);
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        render={<a href={item.href} />}
                        isActive={isActive}
                        tooltip={item.label}
                      >
                        <item.icon />
                        <span>{item.label}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarSeparator />
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <form action="/api/admin/logout" method="POST">
              <SidebarMenuButton
                render={<button type="submit" className="w-full" />}
                tooltip="Sign out"
                className="text-muted-foreground hover:text-foreground"
              >
                <LogOut />
                <span>Sign out</span>
              </SidebarMenuButton>
            </form>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
