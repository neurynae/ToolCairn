import type { Metadata } from 'next';
import { Breadcrumbs } from '@/components/docs/breadcrumbs';
import { Callout } from '@/components/docs/callout';
import { CodeBlock } from '@/components/docs/code-block';
import { PrevNextNav } from '@/components/docs/prev-next-nav';
import { getPrevNext } from '@/lib/docs-navigation';

export const metadata: Metadata = {
  title: 'Claude Code / Desktop Quick Start',
  description:
    'Set up ToolPilot with Claude Code or Claude Desktop in under 2 minutes.',
};

const MCP_CONFIG = `{
  "mcpServers": {
    "toolpilot": {
      "command": "npx",
      "args": ["-y", "@anthropic/toolpilot-mcp"],
      "env": {}
    }
  }
}`;

const EXAMPLE_CONVERSATION = `You: "I need a fast, production-ready vector database for storing embeddings.
      Must support filtering and be self-hostable."

Claude (using ToolPilot):
  → Calls search_tools with your query
  → ToolPilot asks a clarification question: "What scale are you targeting?"
  → Claude answers via search_tools_respond
  → Returns ranked results:
    1. Qdrant     — Health: Active  ★★★★★  (self-host, filtering, Rust-based)
    2. Milvus     — Health: Active  ★★★★☆  (distributed, GPU-accelerated)
    3. Weaviate   — Health: Active  ★★★★☆  (GraphQL API, modules)
    4. Chroma     — Health: Active  ★★★☆☆  (simple, Python-native)`;

const OUTCOME_EXAMPLE = `You: "I went with Qdrant and it's working great for my use case."

Claude (using ToolPilot):
  → Calls report_outcome with tool="qdrant", outcome="adopted"
  → The graph learns from your feedback`;

export default function ClaudeQuickStartPage() {
  const { prev, next } = getPrevNext('/docs/quickstart/claude');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 48 }}>
      <Breadcrumbs
        items={[
          { label: 'Docs', href: '/docs' },
          { label: 'Quick Start', href: '/docs/quickstart' },
          { label: 'Claude Code / Desktop' },
        ]}
      />

      {/* ─── Header ─── */}
      <header style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <h1
          id="claude-quick-start"
          className="text-3xl font-bold tracking-tight sm:text-4xl"
          style={{ color: 'var(--color-text-primary)', lineHeight: 1.15 }}
        >
          Claude Code / Desktop Quick Start
        </h1>
        <p
          className="text-base sm:text-lg"
          style={{ color: 'var(--color-text-secondary)', lineHeight: 1.7, maxWidth: 540 }}
        >
          Get ToolPilot running with Claude in under 2 minutes. Your agent will be able to
          search 491+ developer tools, compare alternatives, and build stacks.
        </p>
      </header>

      {/* ─── Prerequisites ─── */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <h2
          id="prerequisites"
          className="text-xl font-semibold"
          style={{ color: 'var(--color-text-primary)' }}
        >
          Prerequisites
        </h2>
        <ul style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <li className="text-sm" style={{ color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
            <strong style={{ color: 'var(--color-text-primary)' }}>Claude Code</strong> (CLI) or{' '}
            <strong style={{ color: 'var(--color-text-primary)' }}>Claude Desktop</strong> installed
          </li>
          <li className="text-sm" style={{ color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
            Node.js 18+ (for <code style={{ color: 'var(--color-accent)' }}>npx</code>)
          </li>
        </ul>
      </section>

      {/* ─── Step 1 ─── */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <h2
          id="step-1-add-mcp-config"
          className="text-xl font-semibold"
          style={{ color: 'var(--color-text-primary)' }}
        >
          Step 1: Add the MCP Server Config
        </h2>
        <p className="text-sm" style={{ color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
          Add the ToolPilot MCP server to your Claude configuration file:
        </p>

        <CodeBlock
          code={MCP_CONFIG}
          language="json"
          filename="claude_desktop_config.json"
          showLineNumbers
        />

        <Callout type="note" title="Claude Code vs Claude Desktop">
          <strong>Claude Desktop:</strong> Edit the config at{' '}
          <code>~/Library/Application Support/Claude/claude_desktop_config.json</code> (macOS) or{' '}
          <code>%APPDATA%\Claude\claude_desktop_config.json</code> (Windows).
          <br />
          <br />
          <strong>Claude Code:</strong> Run{' '}
          <code>claude mcp add toolpilot npx -y @anthropic/toolpilot-mcp</code>{' '}
          from your terminal — it handles the config for you.
        </Callout>
      </section>

      {/* ─── Step 2 ─── */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <h2
          id="step-2-first-search"
          className="text-xl font-semibold"
          style={{ color: 'var(--color-text-primary)' }}
        >
          Step 2: Try Your First Search
        </h2>
        <p className="text-sm" style={{ color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
          Restart Claude, then ask a natural-language question about developer tools.
          ToolPilot handles the rest via the MCP protocol:
        </p>

        <CodeBlock code={EXAMPLE_CONVERSATION} filename="Example conversation" />

        <Callout type="tip" title="Be specific">
          The more context you give (language, scale, constraints), the fewer clarification rounds
          ToolPilot needs and the better the results.
        </Callout>
      </section>

      {/* ─── Step 3 ─── */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <h2
          id="step-3-explore-results"
          className="text-xl font-semibold"
          style={{ color: 'var(--color-text-primary)' }}
        >
          Step 3: Explore Results
        </h2>
        <p className="text-sm" style={{ color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
          Each tool recommendation includes:
        </p>
        <ul style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <ResultItem label="Health tier" detail="Active, Stable, Slowing, or At Risk — based on commit activity, issues, and releases" />
          <ResultItem label="Graph context" detail="Related tools, alternatives, and companion libraries" />
          <ResultItem label="Key metadata" detail="Stars, license, language, last release date, and category tags" />
          <ResultItem label="Match rationale" detail="Why the tool was selected for your specific query" />
        </ul>
        <p className="text-sm" style={{ color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
          Ask Claude follow-up questions like <em>&ldquo;Compare Qdrant and Milvus&rdquo;</em> or{' '}
          <em>&ldquo;Build me a full RAG stack&rdquo;</em> to dig deeper.
        </p>
      </section>

      {/* ─── Step 4 ─── */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <h2
          id="step-4-report-outcomes"
          className="text-xl font-semibold"
          style={{ color: 'var(--color-text-primary)' }}
        >
          Step 4: Report Outcomes
        </h2>
        <p className="text-sm" style={{ color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
          After you&apos;ve tried a tool, let Claude know how it went. This feeds back into the
          graph and improves future recommendations:
        </p>

        <CodeBlock code={OUTCOME_EXAMPLE} filename="Feedback example" />

        <Callout type="tip" title="Why report outcomes?">
          Feedback adjusts edge weights in the tool graph. Over time, ToolPilot learns which tools
          work well together and which ones don&apos;t — making every search smarter.
        </Callout>
      </section>

      {/* ─── Next Steps ─── */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <h2
          id="next-steps"
          className="text-xl font-semibold"
          style={{ color: 'var(--color-text-primary)' }}
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
    <li className="text-sm" style={{ color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
      <strong style={{ color: 'var(--color-text-primary)' }}>{label}</strong> &mdash; {detail}
    </li>
  );
}

function NextStepItem({ href, text }: { href: string; text: string }) {
  return (
    <li className="text-sm" style={{ lineHeight: 1.6 }}>
      <a href={href} style={{ color: 'var(--color-accent)', textDecoration: 'none' }}>
        {text} →
      </a>
    </li>
  );
}
