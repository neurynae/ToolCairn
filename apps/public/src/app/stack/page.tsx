import type { Metadata } from 'next';
import { AmbientBackground } from '@/components/layout/ambient-background';
import { SiteHeader } from '@/components/layout/site-header';
import { SiteFooter } from '@/components/layout/site-footer';
import { StackBuilder } from '@/components/stack/stack-builder';

export const metadata: Metadata = {
  title: 'Stack Builder',
  description:
    'Describe your project and get AI-powered tool recommendations. Find the perfect stack from 12,000+ open-source tools.',
};

export default function StackPage() {
  return (
    <>
      <AmbientBackground />
      <div className="flex min-h-dvh flex-col">
        <SiteHeader />
        <main className="flex-1">
          <section className="mx-auto max-w-4xl px-6 pb-20 pt-12">
            <div className="mb-10 text-center">
              <h1
                className="mb-3 text-4xl font-bold tracking-tight"
                style={{ color: 'var(--color-text-primary)' }}
              >
                Stack Builder
              </h1>
              <p className="text-lg" style={{ color: 'var(--color-text-secondary)' }}>
                Describe your project and get tool recommendations
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
