import type { Metadata } from 'next';
import { LandingHeader } from '@/components/landing/landing-header';
import { HeroSection } from '@/components/landing/hero-section';
import { ValueProps } from '@/components/landing/value-props';
import { StatsStrip } from '@/components/landing/stats-strip';
import { PipelineSection } from '@/components/landing/pipeline-section';
import { McpSection } from '@/components/landing/mcp-section';
import { CtaSection } from '@/components/landing/cta-section';
import { LandingFooter } from '@/components/landing/landing-footer';
import { ForceLightMode } from '@/components/landing/force-light-mode';
import { JsonLd } from '@/components/seo/json-ld';

export const metadata: Metadata = {
  title: "ToolCairn — Find the right tool for what you're building",
  description:
    'Graph-powered tool intelligence for AI agents and developers. Find, compare, and build your perfect stack with guided multi-stage discovery across 12,000+ open source tools.',
};

const BASE_URL = process.env['NEXT_PUBLIC_APP_URL'] ?? 'https://toolcairn.neurynae.com';

const websiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'ToolCairn',
  url: BASE_URL,
  description: 'Graph-powered tool intelligence for AI agents and developers.',
  potentialAction: {
    '@type': 'SearchAction',
    target: { '@type': 'EntryPoint', urlTemplate: `${BASE_URL}/explore?q={search_term_string}` },
    'query-input': 'required name=search_term_string',
  },
};

const orgSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'NEURYNAE',
  url: BASE_URL,
  logo: `${BASE_URL}/logo/icon-512.png`,
  sameAs: ['https://github.com/NEURYNAE/ToolCairn'],
};

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900 antialiased">
      <ForceLightMode />
      <JsonLd data={websiteSchema} />
      <JsonLd data={orgSchema} />
      <LandingHeader />
      <HeroSection />
      <StatsStrip />
      <ValueProps />
      <PipelineSection />
      <McpSection />
      <CtaSection />
      <LandingFooter />
    </div>
  );
}
