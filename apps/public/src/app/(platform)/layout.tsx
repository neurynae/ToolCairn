'use client';

import type { ReactNode } from 'react';
import { AmbientBackground } from '@/components/layout/ambient-background';
import { SiteHeader } from '@/components/layout/site-header';
import { SiteFooter } from '@/components/layout/site-footer';
import { useCommandPalette } from '@/components/providers/command-palette-provider';

export default function PlatformLayout({ children }: { children: ReactNode }) {
  const { toggle } = useCommandPalette();

  return (
    <>
      <AmbientBackground />
      <div className="flex min-h-dvh flex-col">
        <SiteHeader onOpenSearch={toggle} />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </div>
    </>
  );
}
