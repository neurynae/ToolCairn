import type { Metadata } from 'next';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/docs/breadcrumbs';
import { Callout } from '@/components/docs/callout';
import { PrevNextNav } from '@/components/docs/prev-next-nav';
import { getPrevNext } from '@/lib/docs-navigation';

export const metadata: Metadata = {
  title: 'Web Interface Guide',
  description:
    'Search and explore developer tools using the ToolPilot web interface — no setup required.',
};

export default function WebQuickStartPage() {
  const { prev, next } = getPrevNext('/docs/quickstart/web');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 48 }}>
      <Breadcrumbs
        items={[
          { label: 'Docs', href: '/docs' },
          { label: 'Quick Start', href: '/docs/quickstart' },
          { label: 'Web Interface' },
        ]}
      />

      {/* ─── Header ─── */}
      <header style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <h1
          id="web-interface"
          className="text-3xl font-bold tracking-tight sm:text-4xl"
          style={{ color: 'var(--tp-text-primary)', lineHeight: 1.15 }}
        >
          Web Interface Guide
        </h1>
        <p
          className="text-base sm:text-lg"
          style={{ color: 'var(--tp-text-secondary)', lineHeight: 1.7, maxWidth: 540 }}
        >
          ToolPilot also has a web-based search interface. No installation required &mdash; just
          open your browser and start discovering tools.
        </p>
      </header>

      {/* ─── Step 1 ─── */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <h2
          id="step-1-search"
          className="text-xl font-semibold"
          style={{ color: 'var(--tp-text-primary)' }}
        >
          Step 1: Start a Search
        </h2>
        <p className="text-sm" style={{ color: 'var(--tp-text-secondary)', lineHeight: 1.6 }}>
          Navigate to the{' '}
          <Link href="/" style={{ color: 'var(--tp-accent)', textDecoration: 'none' }}>
            ToolPilot homepage
          </Link>{' '}
          and type a natural-language query into the search bar. For example:
        </p>
        <ul style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <QueryExample text="lightweight HTTP framework for Go" />
          <QueryExample text="best testing library for React components" />
          <QueryExample text="container orchestration alternatives to Kubernetes" />
        </ul>

        <Callout type="tip" title="Be descriptive">
          Include your language, deployment constraints, and what matters most to you.
          The search pipeline uses this context to rank results more accurately.
        </Callout>
      </section>

      {/* ─── Step 2 ─── */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <h2
          id="step-2-guided-discovery"
          className="text-xl font-semibold"
          style={{ color: 'var(--tp-text-primary)' }}
        >
          Step 2: Guided Discovery
        </h2>
        <p className="text-sm" style={{ color: 'var(--tp-text-secondary)', lineHeight: 1.6 }}>
          If your query is broad, ToolPilot may ask clarification questions to narrow down results.
          This is the same guided discovery flow that MCP agents use:
        </p>

        {/* Flow diagram */}
        <div
          className="glass-card"
          style={{
            padding: '20px 24px',
            fontFamily: 'monospace',
            fontSize: 13,
            lineHeight: 2,
            color: 'var(--tp-text-secondary)',
            overflowX: 'auto',
          }}
        >
          <pre style={{ margin: 0 }}>
{`  Search query
       │
       ▼
  ┌─────────────────┐    answer    ┌───────────────┐
  │  Clarification   │───────────▶│  Refined       │
  │  questions       │             │  results       │
  └─────────────────┘             └───────────────┘`}
          </pre>
        </div>

        <p className="text-sm" style={{ color: 'var(--tp-text-secondary)', lineHeight: 1.6 }}>
          Answer the clarification questions to get more targeted results. You can also skip
          them to see broader recommendations.
        </p>
      </section>

      {/* ─── Step 3 ─── */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <h2
          id="step-3-explore-results"
          className="text-xl font-semibold"
          style={{ color: 'var(--tp-text-primary)' }}
        >
          Step 3: Explore Results
        </h2>
        <p className="text-sm" style={{ color: 'var(--tp-text-secondary)', lineHeight: 1.6 }}>
          Search results show each tool with rich context:
        </p>
        <ul style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <ResultItem label="Health badge" detail="Color-coded Active / Stable / Slowing / At Risk indicator" />
          <ResultItem label="Match score" detail="How well the tool matches your specific query" />
          <ResultItem label="Key stats" detail="GitHub stars, license, primary language, last release" />
          <ResultItem label="Relationships" detail="Alternatives, companions, and related tools in the graph" />
        </ul>
        <p className="text-sm" style={{ color: 'var(--tp-text-secondary)', lineHeight: 1.6 }}>
          Click any tool to see its full profile, including health history, related tools, and
          community signals.
        </p>
      </section>

      {/* ─── Step 4 ─── */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <h2
          id="step-4-browse-and-explore"
          className="text-xl font-semibold"
          style={{ color: 'var(--tp-text-primary)' }}
        >
          Step 4: Browse &amp; Explore
        </h2>
        <p className="text-sm" style={{ color: 'var(--tp-text-secondary)', lineHeight: 1.6 }}>
          Beyond search, the web interface offers additional ways to discover tools:
        </p>

        <div
          className="grid gap-4"
          style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}
        >
          <FeatureCard
            icon="🗺️"
            title="Explore"
            description="Browse the full tool graph by category, language, or health tier."
            href="/explore"
          />
          <FeatureCard
            icon="📦"
            title="Stack Builder"
            description="Build compatible tool stacks for common architectures and use cases."
            href="/stack"
          />
        </div>
      </section>

      {/* ─── When to Use Web vs MCP ─── */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <h2
          id="web-vs-mcp"
          className="text-xl font-semibold"
          style={{ color: 'var(--tp-text-primary)' }}
        >
          Web Interface vs MCP
        </h2>

        <Callout type="note" title="Choose the right interface">
          The <strong>web interface</strong> is great for browsing, exploring categories, and
          manual research. The <strong>MCP server</strong> is designed for AI agents that need
          programmatic access to tool intelligence. Both use the same search pipeline and graph
          data.
        </Callout>
      </section>

      {/* ─── Next Steps ─── */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <h2
          id="next-steps"
          className="text-xl font-semibold"
          style={{ color: 'var(--tp-text-primary)' }}
        >
          Next Steps
        </h2>
        <ul style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <NextStepItem href="/docs/quickstart/claude" text="Set up with an AI agent instead" />
          <NextStepItem href="/docs/concepts/search-pipeline" text="Learn how the search pipeline works" />
          <NextStepItem href="/docs/concepts/health-tiers" text="Understand health tier scoring" />
        </ul>
      </section>

      <PrevNextNav prev={prev} next={next} />
    </div>
  );
}

/* ─── Private components ─── */

function QueryExample({ text }: { text: string }) {
  return (
    <li className="text-sm" style={{ color: 'var(--tp-text-secondary)', lineHeight: 1.6 }}>
      <em>&ldquo;{text}&rdquo;</em>
    </li>
  );
}

function ResultItem({ label, detail }: { label: string; detail: string }) {
  return (
    <li className="text-sm" style={{ color: 'var(--tp-text-secondary)', lineHeight: 1.6 }}>
      <strong style={{ color: 'var(--tp-text-primary)' }}>{label}</strong> &mdash; {detail}
    </li>
  );
}

function FeatureCard({
  icon,
  title,
  description,
  href,
}: {
  icon: string;
  title: string;
  description: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="glass-card group flex flex-col gap-3 transition-all duration-200"
      style={{ padding: 20, textDecoration: 'none' }}
    >
      <div className="flex items-center gap-3">
        <span
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-lg"
          style={{
            background: 'var(--tp-surface-3)',
            border: '1px solid var(--tp-border-subtle)',
          }}
        >
          {icon}
        </span>
        <h3 className="text-base font-semibold" style={{ color: 'var(--tp-text-primary)' }}>
          {title}
        </h3>
      </div>
      <p className="text-sm leading-relaxed" style={{ color: 'var(--tp-text-secondary)' }}>
        {description}
      </p>
    </Link>
  );
}

function NextStepItem({ href, text }: { href: string; text: string }) {
  return (
    <li className="text-sm" style={{ lineHeight: 1.6 }}>
      <a href={href} style={{ color: 'var(--tp-accent)', textDecoration: 'none' }}>
        {text} →
      </a>
    </li>
  );
}
