import type { Metadata } from 'next';
import { Breadcrumbs } from '@/components/docs/breadcrumbs';
import { Callout } from '@/components/docs/callout';
import { CodeBlock } from '@/components/docs/code-block';
import { PrevNextNav } from '@/components/docs/prev-next-nav';
import { getPrevNext } from '@/lib/docs-navigation';

export const metadata: Metadata = {
  title: 'Cursor Quick Start',
  description:
    'Set up ToolPilot with Cursor in under 2 minutes.',
};

const MCP_CONFIG = `{
  "mcpServers": {
    "toolpilot": {
      "command": "npx",
      "args": ["-y", "@anthropic/toolpilot-mcp"]
    }
  }
}`;

const EXAMPLE_CONVERSATION = `You: "I need a TypeScript ORM that supports PostgreSQL, has good migration
      tooling, and works well with serverless."

Cursor (using ToolPilot):
  → Calls search_tools with your query
  → ToolPilot may ask: "Do you need edge-runtime support or standard Node.js?"
  → Cursor answers via search_tools_respond
  → Returns ranked results:
    1. Drizzle ORM — Health: Active  ★★★★★  (lightweight, edge-ready)
    2. Prisma      — Health: Active  ★★★★☆  (rich ecosystem, schema-first)
    3. Kysely      — Health: Active  ★★★★☆  (type-safe query builder)
    4. TypeORM     — Health: Stable  ★★★☆☆  (mature, decorator-based)`;

const OUTCOME_EXAMPLE = `You: "Drizzle ORM is working perfectly for my serverless project."

Cursor (using ToolPilot):
  → Calls report_outcome with tool="drizzle-orm", outcome="adopted"
  → The graph learns from your feedback`;

export default function CursorQuickStartPage() {
  const { prev, next } = getPrevNext('/docs/quickstart/cursor');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 48 }}>
      <Breadcrumbs
        items={[
          { label: 'Docs', href: '/docs' },
          { label: 'Quick Start', href: '/docs/quickstart' },
          { label: 'Cursor' },
        ]}
      />

      {/* ─── Header ─── */}
      <header style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <h1
          id="cursor-quick-start"
          className="text-3xl font-bold tracking-tight sm:text-4xl"
          style={{ color: 'var(--tp-text-primary)', lineHeight: 1.15 }}
        >
          Cursor Quick Start
        </h1>
        <p
          className="text-base sm:text-lg"
          style={{ color: 'var(--tp-text-secondary)', lineHeight: 1.7, maxWidth: 540 }}
        >
          Add ToolPilot to Cursor and start discovering developer tools in under 2 minutes.
        </p>
      </header>

      {/* ─── Prerequisites ─── */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <h2
          id="prerequisites"
          className="text-xl font-semibold"
          style={{ color: 'var(--tp-text-primary)' }}
        >
          Prerequisites
        </h2>
        <ul style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <li className="text-sm" style={{ color: 'var(--tp-text-secondary)', lineHeight: 1.6 }}>
            <strong style={{ color: 'var(--tp-text-primary)' }}>Cursor</strong> editor installed
          </li>
          <li className="text-sm" style={{ color: 'var(--tp-text-secondary)', lineHeight: 1.6 }}>
            Node.js 18+ (for <code style={{ color: 'var(--tp-accent)' }}>npx</code>)
          </li>
        </ul>
      </section>

      {/* ─── Step 1 ─── */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <h2
          id="step-1-add-mcp-config"
          className="text-xl font-semibold"
          style={{ color: 'var(--tp-text-primary)' }}
        >
          Step 1: Add the MCP Server Config
        </h2>
        <p className="text-sm" style={{ color: 'var(--tp-text-secondary)', lineHeight: 1.6 }}>
          Create or edit the MCP configuration file in your project&apos;s{' '}
          <code style={{ color: 'var(--tp-accent)' }}>.cursor/</code> directory:
        </p>

        <CodeBlock
          code={MCP_CONFIG}
          language="json"
          filename=".cursor/mcp.json"
          showLineNumbers
        />

        <Callout type="note" title="Where to place the config">
          You can add this at the <strong>project level</strong> (
          <code>.cursor/mcp.json</code> in your repo root) or the{' '}
          <strong>global level</strong> (<code>~/.cursor/mcp.json</code>).
          Project-level configs are recommended so team members share the same setup.
        </Callout>

        <Callout type="tip" title="Cursor Settings UI">
          You can also add MCP servers through <strong>Cursor Settings → Features → MCP Servers</strong>.
          Click <em>&ldquo;Add new MCP server&rdquo;</em>, choose <em>&ldquo;command&rdquo;</em> type,
          and enter <code>npx -y @anthropic/toolpilot-mcp</code> as the command.
        </Callout>
      </section>

      {/* ─── Step 2 ─── */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <h2
          id="step-2-first-search"
          className="text-xl font-semibold"
          style={{ color: 'var(--tp-text-primary)' }}
        >
          Step 2: Try Your First Search
        </h2>
        <p className="text-sm" style={{ color: 'var(--tp-text-secondary)', lineHeight: 1.6 }}>
          Open Cursor&apos;s AI chat (Cmd+L / Ctrl+L) and ask about developer tools.
          ToolPilot handles tool discovery through the MCP protocol:
        </p>

        <CodeBlock code={EXAMPLE_CONVERSATION} filename="Example conversation" />

        <Callout type="tip" title="Agent mode">
          Make sure you&apos;re using Cursor in <strong>Agent mode</strong> (not Ask or Edit mode)
          so it can call MCP tools automatically.
        </Callout>
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
          Each recommendation from ToolPilot includes:
        </p>
        <ul style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <ResultItem label="Health tier" detail="Active, Stable, Slowing, or At Risk" />
          <ResultItem label="Graph context" detail="Alternatives, companions, and dependencies" />
          <ResultItem label="Key metadata" detail="Stars, license, language, and last release" />
          <ResultItem label="Match rationale" detail="Why this tool fits your specific requirements" />
        </ul>
        <p className="text-sm" style={{ color: 'var(--tp-text-secondary)', lineHeight: 1.6 }}>
          Ask follow-ups like <em>&ldquo;Compare Drizzle and Prisma for my use case&rdquo;</em> or{' '}
          <em>&ldquo;What testing tools pair well with Drizzle?&rdquo;</em>.
        </p>
      </section>

      {/* ─── Step 4 ─── */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <h2
          id="step-4-report-outcomes"
          className="text-xl font-semibold"
          style={{ color: 'var(--tp-text-primary)' }}
        >
          Step 4: Report Outcomes
        </h2>
        <p className="text-sm" style={{ color: 'var(--tp-text-secondary)', lineHeight: 1.6 }}>
          After adopting a tool, tell Cursor how it went. This feeds back into ToolPilot&apos;s
          graph and improves future results:
        </p>

        <CodeBlock code={OUTCOME_EXAMPLE} filename="Feedback example" />
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
          <NextStepItem href="/docs/mcp-tools/search-tools" text="Explore all 5 MCP tools" />
          <NextStepItem href="/docs/concepts/search-pipeline" text="Learn how the search pipeline works" />
          <NextStepItem href="/docs/guides/search-walkthrough" text="Walk through a complete search flow" />
        </ul>
      </section>

      <PrevNextNav prev={prev} next={next} />
    </div>
  );
}

/* ─── Private components ─── */

function ResultItem({ label, detail }: { label: string; detail: string }) {
  return (
    <li className="text-sm" style={{ color: 'var(--tp-text-secondary)', lineHeight: 1.6 }}>
      <strong style={{ color: 'var(--tp-text-primary)' }}>{label}</strong> &mdash; {detail}
    </li>
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
