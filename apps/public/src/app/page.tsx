'use client';

import { Suspense } from 'react';
import { AmbientBackground } from '@/components/layout/ambient-background';
import { SiteHeader } from '@/components/layout/site-header';
import { SiteFooter } from '@/components/layout/site-footer';
import { SearchHero } from '@/components/search/search-hero';
import { useCommandPalette } from '@/components/providers/command-palette-provider';

export default function HomePage() {
  const { toggle } = useCommandPalette();

  return (
    <>
      <AmbientBackground />
      <div className="flex min-h-dvh flex-col">
        <SiteHeader onOpenSearch={toggle} />
        <main className="flex-1">
          <Suspense>
            <SearchHero />
          </Suspense>
        </main>
        <SiteFooter />
      </div>
    </>
  );
}
