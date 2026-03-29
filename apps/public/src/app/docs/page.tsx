import type { Metadata } from 'next';
import Link from 'next/link';
import { docsNavigation } from '@/lib/docs-navigation';
import { PopularPageLinks } from '@/components/docs/popular-page-links';

export const metadata: Metadata = {
  title: 'Documentation',
  description: 'ToolPilot documentation — guides, API reference, and architecture.',
};

const SECTION_DESCRIPTIONS: Record<string, string> = {
  'Getting Started': 'Learn what ToolPilot is and how it works',
  'Quick Start': 'Set up ToolPilot with your AI agent in minutes',
  'Core Concepts': 'Understand the graph mesh, search pipeline, and scoring',
  'MCP Tools': 'Complete API reference for all 5 MCP tools',
  Guides: 'Step-by-step tutorials for common workflows',
  Architecture: 'System design, data flow, and contributing guide',
  Reference: 'Graph schema, formulas, and changelog',
};

const POPULAR_PAGES = [
  { title: 'search_tools Reference', href: '/docs/mcp-tools/search-tools' },
  { title: 'Claude Quick Start', href: '/docs/quickstart/claude' },
  { title: 'Search Pipeline', href: '/docs/concepts/search-pipeline' },
  { title: 'Graph Schema', href: '/docs/reference/graph-schema' },
  { title: 'System Overview', href: '/docs/architecture/overview' },
] as const;

export default function DocsPage() {
  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: '48px 24px 80px' }}>
      {/* ─── Hero ─── */}
      <section style={{ textAlign: 'center', marginBottom: 56 }}>
        <h1
          className="text-4xl font-bold tracking-tight sm:text-5xl"
          style={{
            color: 'var(--color-text-primary)',
            lineHeight: 1.15,
          }}
        >
          ToolPilot Documentation
        </h1>
        <p
          className="mx-auto mt-4 max-w-2xl text-base sm:text-lg"
          style={{
            color: 'var(--color-text-secondary)',
            lineHeight: 1.6,
          }}
        >
          Everything you need to integrate, configure, and understand ToolPilot&rsquo;s
          agent-first tool intelligence platform.
        </p>
      </section>

      {/* ─── Quick Start CTA ─── */}
      <section style={{ marginBottom: 56 }}>
        <Link
          href="/docs/quickstart/claude"
          className="group flex items-center justify-between rounded-xl px-6 py-5 transition-all duration-200"
          style={{
            background: 'linear-gradient(135deg, rgba(99,102,241,0.12), rgba(129,140,248,0.06))',
            border: '1px solid rgba(99,102,241,0.25)',
          }}
        >
          <div>
            <span
              className="text-sm font-semibold uppercase tracking-wider"
              style={{ color: 'var(--color-accent)' }}
            >
              Quick Start
            </span>
            <h2
              className="mt-1 text-xl font-semibold"
              style={{ color: 'var(--color-text-primary)' }}
            >
              Get started in 2 minutes
            </h2>
            <p
              className="mt-1 text-sm"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              Set up ToolPilot with Claude, Cursor, or any MCP-compatible agent.
            </p>
          </div>
          <span
            className="hidden text-2xl transition-transform duration-200 group-hover:translate-x-1 sm:block"
            style={{ color: 'var(--color-accent)' }}
          >
            →
          </span>
        </Link>
      </section>

      {/* ─── Section Cards Grid ─── */}
      <section style={{ marginBottom: 56 }}>
        <h2
          className="mb-6 text-lg font-semibold"
          style={{ color: 'var(--color-text-primary)' }}
        >
          Browse by section
        </h2>
        <div
          className="grid gap-4"
          style={{
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          }}
        >
          {docsNavigation.map((section) => (
            <SectionCard
              key={section.href}
              href={section.href}
              icon={section.icon}
              title={section.title}
              description={SECTION_DESCRIPTIONS[section.title] ?? ''}
              pageCount={section.pages.length}
            />
          ))}
        </div>
      </section>

      {/* ─── Popular Pages ─── */}
      <section>
        <h2
          className="mb-4 text-lg font-semibold"
          style={{ color: 'var(--color-text-primary)' }}
        >
          Popular pages
        </h2>
        <PopularPageLinks pages={[...POPULAR_PAGES]} />
      </section>
    </div>
  );
}

/* ─── Section card (server-compatible) ─── */

interface SectionCardProps {
  href: string;
  icon: string;
  title: string;
  description: string;
  pageCount: number;
}

function SectionCard({ href, icon, title, description, pageCount }: SectionCardProps) {
  return (
    <Link
      href={href}
      className="glass-card group flex flex-col gap-3"
      style={{ padding: 24, textDecoration: 'none' }}
    >
      <div className="flex items-center gap-3">
        <span
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-lg"
          style={{
            background: 'var(--color-surface-3)',
            border: '1px solid var(--color-border-subtle)',
          }}
        >
          {icon}
        </span>
        <h3
          className="text-base font-semibold"
          style={{ color: 'var(--color-text-primary)' }}
        >
          {title}
        </h3>
      </div>
      <p
        className="text-sm leading-relaxed"
        style={{ color: 'var(--color-text-secondary)' }}
      >
        {description}
      </p>
      <span
        className="mt-auto text-xs"
        style={{ color: 'var(--color-text-muted)' }}
      >
        {pageCount} {pageCount === 1 ? 'page' : 'pages'}
      </span>
    </Link>
  );
}
