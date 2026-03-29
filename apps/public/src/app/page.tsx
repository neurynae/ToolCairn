import { AmbientBackground } from '@/components/layout/ambient-background';
import { SiteHeader } from '@/components/layout/site-header';
import { SiteFooter } from '@/components/layout/site-footer';
import { SearchHero } from '@/components/search/search-hero';

export default function HomePage() {
  return (
    <>
      <AmbientBackground />
      <div className="flex min-h-dvh flex-col">
        <SiteHeader />
        <main className="flex-1">
          <SearchHero />
        </main>
        <SiteFooter />
      </div>
    </>
  );
}
