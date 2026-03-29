'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense } from 'react';
import { AmbientBackground } from '@/components/layout/ambient-background';
import { SiteHeader } from '@/components/layout/site-header';
import { SiteFooter } from '@/components/layout/site-footer';
import { CategoryGrid } from '@/components/explore/category-grid';
import { ToolList } from '@/components/explore/tool-list';

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
    <section className="mx-auto max-w-6xl px-6 pb-20 pt-12">
      <div className="mb-10 text-center">
        <h1
          className="mb-3 text-4xl font-bold tracking-tight"
          style={{ color: 'var(--color-text-primary)' }}
        >
          Explore Tools
        </h1>
        <p className="text-lg" style={{ color: 'var(--color-text-secondary)' }}>
          Browse 12,000+ tools by category
        </p>
      </div>

      <div className="flex flex-col gap-8">
        <CategoryGrid
          onCategorySelect={handleCategorySelect}
          selectedCategory={selectedCategory}
        />

        {selectedCategory && (
          <div className="fade-up">
            <h2
              className="mb-4 text-xl font-semibold capitalize"
              style={{ color: 'var(--color-text-primary)' }}
            >
              {selectedCategory.replace(/-/g, ' ')}
            </h2>
            <ToolList category={selectedCategory} />
          </div>
        )}
      </div>
    </section>
  );
}

export default function ExplorePage() {
  return (
    <>
      <AmbientBackground />
      <div className="flex min-h-dvh flex-col">
        <SiteHeader />
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
