'use client';

import { AmbientBackground } from '@/components/layout/ambient-background';
import { SiteHeader } from '@/components/layout/site-header';
import { SiteFooter } from '@/components/layout/site-footer';
import { StackBuilder } from '@/components/stack/stack-builder';
import { useCommandPalette } from '@/components/providers/command-palette-provider';
import { LayersIcon } from 'lucide-react';

export default function StackPage() {
  const { toggle } = useCommandPalette();

  return (
    <>
      <AmbientBackground />
      <div className="flex min-h-dvh flex-col">
        <SiteHeader onOpenSearch={toggle} />
        <main className="flex-1">
          <section className="mx-auto max-w-4xl px-4 pb-20 pt-12 sm:px-6">
            <div className="mb-8">
              <div className="mb-2 flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <LayersIcon className="size-4" />
                Stack Builder
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Build Your Stack
              </h1>
              <p className="mt-2 text-muted-foreground">
                Describe your project and get curated tool recommendations from the graph.
              </p>
            </div>
            <StackBuilder />
          </section>
        </main>
        <SiteFooter />
      </div>
    </>
  );
}
