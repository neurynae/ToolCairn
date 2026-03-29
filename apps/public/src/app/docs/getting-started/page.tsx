import type { Metadata } from 'next';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/docs/breadcrumbs';
import { Callout } from '@/components/docs/callout';
import { PrevNextNav } from '@/components/docs/prev-next-nav';
import { getPrevNext } from '@/lib/docs-navigation';

export const metadata: Metadata = {
  title: 'What is ToolPilot?',
  description:
    'ToolPilot is an agent-first, graph-powered tool intelligence platform that helps AI coding agents discover the right open-source developer tools.',
};

export default function GettingStartedPage() {
  const { prev, next } = getPrevNext('/docs/getting-started');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 48 }}>
      <Breadcrumbs items={[{ label: 'Docs', href: '/docs' }, { label: 'What is ToolPilot?' }]} />

      {/* ─── Hero ─── */}
      <header style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <h1
          id="what-is-toolpilot"
          className="text-3xl font-bold tracking-tight sm:text-4xl"
          style={{ color: 'var(--color-text-primary)', lineHeight: 1.15 }}
        >
          What is ToolPilot?
        </h1>
        <p
          className="text-base sm:text-lg"
          style={{ color: 'var(--color-text-secondary)', lineHeight: 1.7, maxWidth: 640 }}
        >
          ToolPilot is an <strong style={{ color: 'var(--color-text-primary)' }}>agent-first, graph-powered
          tool intelligence platform</strong>. It provides an MCP server that AI coding agents&mdash;Claude
          Code, Cursor, Windsurf, and others&mdash;use to discover the right open-source developer tools for
          any task.
        </p>
      </header>

      {/* ─── Key Differentiator ─── */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <h2
          id="why-toolpilot"
          className="text-2xl font-semibold"
          style={{ color: 'var(--color-text-primary)' }}
        >
          Why ToolPilot?
        </h2>
        <p className="text-sm sm:text-base" style={{ color: 'var(--color-text-secondary)', lineHeight: 1.7 }}>
          Traditional tool discovery relies on keyword search and static lists. ToolPilot is different&mdash;it
          maps the <em>relationships</em> between tools (alternatives, companions, dependencies) in a living
          knowledge graph, then combines that structure with vector similarity and health scoring to surface
          recommendations an agent can trust.
        </p>

        <Callout type="important" title="Graph-powered, not keyword-based">
          ToolPilot doesn&apos;t just match words. It traverses a graph of 491+ tools, weighing
          relationships, maintenance health, and community signals to rank results. This means agents get
          contextually relevant recommendations rather than popularity-biased lists.
        </Callout>
      </section>

      {/* ─── Three Pillars ─── */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <h2
          id="three-pillars"
          className="text-2xl font-semibold"
          style={{ color: 'var(--color-text-primary)' }}
        >
          The Three Pillars
        </h2>

        <div
          className="grid gap-4"
          style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))' }}
        >
          <PillarCard
            icon="🕸️"
            title="Graph Mesh"
            description="491+ open-source tools connected by typed edges — alternatives, companions, dependencies, and more. Each node carries health scores, categories, and rich metadata."
          />
          <PillarCard
            icon="🔍"
            title="4-Stage Search Pipeline"
            description="BM25 + vector retrieval → smart filters → graph-based reranking → final selection. Every stage narrows results using a different signal for maximum precision."
          />
          <PillarCard
            icon="🤖"
            title="Agent-First Design"
            description="Built on the Model Context Protocol (MCP). Five purpose-built tools let agents search, clarify, stack-build, diagnose, and report outcomes — all programmatically."
          />
        </div>
      </section>

      {/* ─── Who It's For ─── */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <h2
          id="who-its-for"
          className="text-2xl font-semibold"
          style={{ color: 'var(--color-text-primary)' }}
        >
          Who It&apos;s For
        </h2>
        <ul style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingLeft: 20 }}>
          <AudienceItem
            title="AI Agent Developers"
            description="Give your agent reliable, up-to-date tool recommendations via the MCP protocol."
          />
          <AudienceItem
            title="DevOps Engineers"
            description="Evaluate tool health, compare alternatives, and build compatible stacks without manual research."
          />
          <AudienceItem
            title="Tech Leads"
            description="Make informed tooling decisions backed by maintenance signals, community health, and relationship data."
          />
        </ul>
      </section>

      {/* ─── How It Works ─── */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <h2
          id="how-it-works"
          className="text-2xl font-semibold"
          style={{ color: 'var(--color-text-primary)' }}
        >
          How It Works
        </h2>
        <p className="text-sm sm:text-base" style={{ color: 'var(--color-text-secondary)', lineHeight: 1.7 }}>
          At a high level, ToolPilot follows a guided discovery loop between your AI agent and the
          graph:
        </p>

        {/* Text-based flow diagram */}
        <div
          className="glass-card"
          style={{
            padding: '24px 28px',
            fontFamily: 'monospace',
            fontSize: 13,
            lineHeight: 2,
            color: 'var(--color-text-secondary)',
            overflowX: 'auto',
          }}
        >
          <pre style={{ margin: 0 }}>
{`  ┌─────────────┐     ┌──────────────────┐     ┌────────────────┐
  │  Agent asks  │────▶│  Clarification    │────▶│  Graph-ranked  │
  │  a question  │     │  questions refine │     │  results with  │
  │              │     │  the intent       │     │  health scores │
  └─────────────┘     └──────────────────┘     └───────┬────────┘
                                                        │
  ┌─────────────┐     ┌──────────────────┐              │
  │  Graph gets  │◀───│  Agent reports    │◀────────────┘
  │  smarter     │     │  outcome         │
  └─────────────┘     └──────────────────┘`}
          </pre>
        </div>

        <Callout type="tip" title="Feedback improves results">
          When agents report outcomes (which tool worked, which didn&apos;t), the graph learns. Edge
          weights adjust over time, so the next search is even more accurate.
        </Callout>
      </section>

      {/* ─── CTA ─── */}
      <section
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 16,
          padding: '40px 0',
          textAlign: 'center',
        }}
      >
        <h2
          id="get-started"
          className="text-2xl font-semibold"
          style={{ color: 'var(--color-text-primary)' }}
        >
          Ready to get started?
        </h2>
        <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          Set up ToolPilot with your AI agent in under 2 minutes.
        </p>
        <Link
          href="/docs/quickstart"
          className="inline-flex items-center gap-2 rounded-lg px-6 py-3 text-sm font-semibold transition-colors"
          style={{
            background: 'var(--color-accent)',
            color: '#fff',
            textDecoration: 'none',
          }}
        >
          Quick Start →
        </Link>
      </section>

      <PrevNextNav prev={prev} next={next} />
    </div>
  );
}

/* ─── Private components ─── */

function PillarCard({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div
      className="glass-card"
      style={{
        padding: 24,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
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
        <h3 className="text-base font-semibold" style={{ color: 'var(--color-text-primary)' }}>
          {title}
        </h3>
      </div>
      <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
        {description}
      </p>
    </div>
  );
}

function AudienceItem({ title, description }: { title: string; description: string }) {
  return (
    <li style={{ color: 'var(--color-text-secondary)', fontSize: 14, lineHeight: 1.7 }}>
      <strong style={{ color: 'var(--color-text-primary)' }}>{title}</strong> &mdash; {description}
    </li>
  );
}
