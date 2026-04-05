import type { Metadata } from 'next';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/docs/breadcrumbs';
import { PrevNextNav } from '@/components/docs/prev-next-nav';
import { getPrevNext } from '@/lib/docs-navigation';

export const metadata: Metadata = {
  title: 'Quick Start',
  description:
    'Choose your AI agent and get ToolPilot running in under 2 minutes.',
};

const AGENT_CARDS: AgentCardProps[] = [
  {
    icon: '🟣',
    name: 'Claude Code / Desktop',
    href: '/docs/quickstart/claude',
    time: '2 min',
    description: 'Set up ToolPilot as an MCP server in Claude Code or Claude Desktop.',
  },
  {
    icon: '🔵',
    name: 'Cursor',
    href: '/docs/quickstart/cursor',
    time: '2 min',
    description: 'Add ToolPilot to Cursor via the built-in MCP configuration.',
  },
  {
    icon: '🟢',
    name: 'Windsurf',
    href: '/docs/quickstart/windsurf',
    time: '2 min',
    description: 'Connect ToolPilot to Windsurf through its MCP settings.',
  },
  {
    icon: '⚙️',
    name: 'Custom Agent / SDK',
    href: '/docs/quickstart/custom',
    time: '5 min',
    description: 'Integrate any MCP-compatible client using the TypeScript or Python SDK.',
  },
  {
    icon: '🌐',
    name: 'Web Interface',
    href: '/docs/quickstart/web',
    time: '1 min',
    description: 'Search and explore tools directly from the ToolPilot web UI — no setup required.',
  },
];

export default function QuickStartPage() {
  const { prev, next } = getPrevNext('/docs/quickstart');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 48 }}>
      <Breadcrumbs items={[{ label: 'Docs', href: '/docs' }, { label: 'Quick Start' }]} />

      {/* ─── Header ─── */}
      <header style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <h1
          id="quick-start"
          className="text-3xl font-bold tracking-tight sm:text-4xl"
          style={{ color: 'var(--tp-text-primary)', lineHeight: 1.15 }}
        >
          Quick Start
        </h1>
        <p
          className="text-base sm:text-lg"
          style={{ color: 'var(--tp-text-secondary)', lineHeight: 1.7, maxWidth: 540 }}
        >
          Choose your agent to get started. Each guide walks you through setup and your first
          search in just a few minutes.
        </p>
      </header>

      {/* ─── Agent Card Grid ─── */}
      <section>
        <div
          className="grid gap-4"
          style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}
        >
          {AGENT_CARDS.map((card) => (
            <AgentCard key={card.href} {...card} />
          ))}
        </div>
      </section>

      <PrevNextNav prev={prev} next={next} />
    </div>
  );
}

/* ─── Agent card ─── */

interface AgentCardProps {
  icon: string;
  name: string;
  href: string;
  time: string;
  description: string;
}

function AgentCard({ icon, name, href, time, description }: AgentCardProps) {
  return (
    <Link
      href={href}
      className="glass-card group flex flex-col gap-4 transition-all duration-200"
      style={{ padding: 24, textDecoration: 'none' }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-xl"
            style={{
              background: 'var(--tp-surface-3)',
              border: '1px solid var(--tp-border-subtle)',
            }}
          >
            {icon}
          </span>
          <h2 className="text-base font-semibold" style={{ color: 'var(--tp-text-primary)' }}>
            {name}
          </h2>
        </div>
        <span
          className="rounded-md px-2 py-0.5 text-xs font-medium"
          style={{
            background: 'var(--tp-accent-subtle)',
            color: 'var(--tp-accent)',
          }}
        >
          {time}
        </span>
      </div>
      <p className="text-sm leading-relaxed" style={{ color: 'var(--tp-text-secondary)' }}>
        {description}
      </p>
      <span
        className="mt-auto text-sm font-medium transition-colors"
        style={{ color: 'var(--tp-accent)' }}
      >
        Get started →
      </span>
    </Link>
  );
}
