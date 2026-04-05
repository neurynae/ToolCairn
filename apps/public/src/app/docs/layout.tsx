'use client';

import { SiteHeader } from '@/components/layout/site-header';
import { SiteFooter } from '@/components/layout/site-footer';
import { DocsLayoutShell } from '@/components/docs/docs-layout-shell';
import { useCommandPalette } from '@/components/providers/command-palette-provider';

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  const { toggle } = useCommandPalette();

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <SiteHeader onOpenSearch={toggle} />
      <DocsLayoutShell>{children}</DocsLayoutShell>
      <SiteFooter />
    </div>
  );
}
