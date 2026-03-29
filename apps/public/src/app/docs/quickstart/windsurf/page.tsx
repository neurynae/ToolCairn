import type { Metadata } from 'next';
import { Breadcrumbs } from '@/components/docs/breadcrumbs';
import { Callout } from '@/components/docs/callout';
import { CodeBlock } from '@/components/docs/code-block';
import { PrevNextNav } from '@/components/docs/prev-next-nav';
import { getPrevNext } from '@/lib/docs-navigation';

export const metadata: Metadata = {
  title: 'Windsurf Quick Start',
  description:
    'Set up ToolPilot with Windsurf in under 2 minutes.',
};

const MCP_CONFIG = `{
  "mcpServers": {
    "toolpilot": {
      "command": "npx",
      "args": ["-y", "@anthropic/toolpilot-mcp"]
    }
  }
}`;

const EXAMPLE_CONVERSATION = `You: "I need a CI/CD tool that's easy to self-host, supports Docker-based
      pipelines, and has good GitHub integration."

Windsurf (using ToolPilot):
  → Calls search_tools with your query
  → ToolPilot may ask: "Are you looking for a full platform or a lightweight runner?"
  → Windsurf answers via search_tools_respond
  → Returns ranked results:
    1. Gitea Actions — Health: Active  ★★★★★  (GitHub-compatible, lightweight)
    2. Woodpecker CI — Health: Active  ★★★★☆  (Docker-native, simple YAML)
    3. Drone CI      — Health: Stable  ★★★★☆  (container-based, plugins)
    4. Concourse CI  — Health: Stable  ★★★☆☆  (resource-based, declarative)`;

const OUTCOME_EXAMPLE = `You: "Woodpecker CI was exactly what I needed — easy to set up and runs great."

Windsurf (using ToolPilot):
  → Calls report_outcome with tool="woodpecker-ci", outcome="adopted"
  → The graph learns from your feedback`;

export default function WindsurfQuickStartPage() {
  const { prev, next } = getPrevNext('/docs/quickstart/windsurf');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 48 }}>
      <Breadcrumbs
        items={[
          { label: 'Docs', href: '/docs' },
          { label: 'Quick Start', href: '/docs/quickstart' },
          { label: 'Windsurf' },
        ]}
      />

      {/* ─── Header ─── */}
      <header style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <h1
          id="windsurf-quick-start"
          className="text-3xl font-bold tracking-tight sm:text-4xl"
          style={{ color: 'var(--color-text-primary)', lineHeight: 1.15 }}
        >
          Windsurf Quick Start
        </h1>
        <p
          className="text-base sm:text-lg"
          style={{ color: 'var(--color-text-secondary)', lineHeight: 1.7, maxWidth: 540 }}
        >
          Connect ToolPilot to Windsurf and start discovering developer tools in under 2 minutes.
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
            <strong style={{ color: 'var(--color-text-primary)' }}>Windsurf</strong> editor installed
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
          Add the ToolPilot MCP server to your Windsurf configuration file:
        </p>

        <CodeBlock
          code={MCP_CONFIG}
          language="json"
          filename="~/.codeium/windsurf/mcp_config.json"
          showLineNumbers
        />

        <Callout type="note" title="Config location">
          Windsurf stores its MCP configuration at{' '}
          <code>~/.codeium/windsurf/mcp_config.json</code>. If the file doesn&apos;t exist yet,
          create it. You can also access it through{' '}
          <strong>Windsurf Settings → Cascade → MCP Servers</strong>.
        </Callout>

        <Callout type="tip" title="Restart Cascade">
          After editing the config, restart the Cascade panel (or reload Windsurf) to pick
          up the new MCP server.
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
          Open Windsurf&apos;s Cascade panel and ask about developer tools. ToolPilot
          handles discovery via MCP:
        </p>

        <CodeBlock code={EXAMPLE_CONVERSATION} filename="Example conversation" />

        <Callout type="tip" title="Be specific">
          Include details like language, deployment model, and constraints. The more context you
          provide, the fewer clarification rounds ToolPilot needs.
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
          Each recommendation from ToolPilot includes:
        </p>
        <ul style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <ResultItem label="Health tier" detail="Active, Stable, Slowing, or At Risk" />
          <ResultItem label="Graph context" detail="Alternatives, companions, and dependencies" />
          <ResultItem label="Key metadata" detail="Stars, license, language, and last release" />
          <ResultItem label="Match rationale" detail="Why this tool fits your specific requirements" />
        </ul>
        <p className="text-sm" style={{ color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
          Ask follow-ups like <em>&ldquo;Compare Woodpecker and Drone CI&rdquo;</em> or{' '}
          <em>&ldquo;What monitoring tools pair well with this CI setup?&rdquo;</em>.
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
          After trying a tool, let Windsurf know how it went. This feeds back into
          ToolPilot&apos;s graph:
        </p>

        <CodeBlock code={OUTCOME_EXAMPLE} filename="Feedback example" />
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
