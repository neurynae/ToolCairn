'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense } from 'react';
import { CompassIcon } from 'lucide-react';
import { AmbientBackground } from '@/components/layout/ambient-background';
import { SiteHeader } from '@/components/layout/site-header';
import { SiteFooter } from '@/components/layout/site-footer';
import { CategoryGrid } from '@/components/explore/category-grid';
import { ToolList } from '@/components/explore/tool-list';
import { useCommandPalette } from '@/components/providers/command-palette-provider';

function ExploreContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const selectedCategory = searchParams.get('category');

  function handleCategorySelect(category: string) {
    if (category) {
      router.push(`/explore?category=${encodeURIComponent(category)}`);
    } else {
      router.push('/explore');
    }
  }

  return (
    <section className="mx-auto max-w-6xl px-4 pb-20 pt-12 sm:px-6">
      {/* Page header */}
      <div className="mb-10">
        <div className="mb-2 flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <CompassIcon className="size-4" />
          Browse by Category
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Explore Tools
        </h1>
        <p className="mt-2 text-muted-foreground">
          12,000+ tools indexed and ranked by health score.
        </p>
      </div>

      <div className="flex flex-col gap-8">
        <CategoryGrid
          onCategorySelect={handleCategorySelect}
          selectedCategory={selectedCategory}
        />

        {selectedCategory && (
          <div className="animate-fade-up">
            <div className="mb-4 flex items-center justify-between gap-4">
              <h2 className="text-xl font-semibold capitalize text-foreground">
                {selectedCategory.replace(/-/g, ' ')}
              </h2>
            </div>
            <ToolList category={selectedCategory} />
          </div>
        )}

        {!selectedCategory && (
          <div className="py-12 text-center text-muted-foreground">
            <p className="text-sm">Select a category above to browse tools.</p>
          </div>
        )}
      </div>
    </section>
  );
}

export default function ExplorePage() {
  const { toggle } = useCommandPalette();

  return (
    <>
      <AmbientBackground />
      <div className="flex min-h-dvh flex-col">
        <SiteHeader onOpenSearch={toggle} />
        <main className="flex-1">
          <Suspense>
            <ExploreContent />
          </Suspense>
        </main>
        <SiteFooter />
      </div>
    </>
  );
}
