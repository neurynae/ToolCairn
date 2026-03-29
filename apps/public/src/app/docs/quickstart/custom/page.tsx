import type { Metadata } from 'next';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/docs/breadcrumbs';
import { Callout } from '@/components/docs/callout';
import { CodeBlock } from '@/components/docs/code-block';
import { CodeTabs } from '@/components/docs/code-tabs';
import { PrevNextNav } from '@/components/docs/prev-next-nav';
import { getPrevNext } from '@/lib/docs-navigation';

export const metadata: Metadata = {
  title: 'Custom Agent / SDK Quick Start',
  description:
    'Integrate ToolPilot with any MCP-compatible client using the TypeScript or Python SDK.',
};

const TS_CONNECT = `import { Client } from '@modelcontextprotocol/sdk/client';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio';

// Start the ToolPilot MCP server via stdio
const transport = new StdioClientTransport({
  command: 'npx',
  args: ['-y', '@anthropic/toolpilot-mcp'],
});

const client = new Client({ name: 'my-agent', version: '1.0.0' });
await client.connect(transport);

// Search for tools
const result = await client.callTool('search_tools', {
  query: 'vector database for embeddings',
});

console.log(result);`;

const PY_CONNECT = `from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client

# Start the ToolPilot MCP server via stdio
server_params = StdioServerParameters(
    command="npx",
    args=["-y", "@anthropic/toolpilot-mcp"],
)

async with stdio_client(server_params) as (read, write):
    async with ClientSession(read, write) as session:
        await session.initialize()

        # Search for tools
        result = await session.call_tool(
            "search_tools",
            arguments={"query": "vector database for embeddings"},
        )

        print(result)`;

const MCP_TOOLS_SUMMARY = [
  { name: 'search_tools', description: 'Search the tool graph with a natural-language query. Returns ranked results with health scores.' },
  { name: 'search_tools_respond', description: 'Answer a clarification question to refine search results.' },
  { name: 'get_stack', description: 'Build a compatible tool stack for a given use case (e.g., "full-stack web app").' },
  { name: 'check_issue', description: 'Diagnose issues with a specific tool — check health, known problems, and alternatives.' },
  { name: 'report_outcome', description: 'Report whether a recommended tool worked, improving future results.' },
];

export default function CustomQuickStartPage() {
  const { prev, next } = getPrevNext('/docs/quickstart/custom');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 48 }}>
      <Breadcrumbs
        items={[
          { label: 'Docs', href: '/docs' },
          { label: 'Quick Start', href: '/docs/quickstart' },
          { label: 'Custom Agent / SDK' },
        ]}
      />

      {/* ─── Header ─── */}
      <header style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <h1
          id="custom-agent-quick-start"
          className="text-3xl font-bold tracking-tight sm:text-4xl"
          style={{ color: 'var(--color-text-primary)', lineHeight: 1.15 }}
        >
          Custom Agent / SDK Quick Start
        </h1>
        <p
          className="text-base sm:text-lg"
          style={{ color: 'var(--color-text-secondary)', lineHeight: 1.7, maxWidth: 580 }}
        >
          Building your own MCP client? Connect to ToolPilot programmatically using the official
          TypeScript or Python SDK.
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
            Node.js 18+ (for the ToolPilot MCP server and TypeScript SDK)
          </li>
          <li className="text-sm" style={{ color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
            <strong style={{ color: 'var(--color-text-primary)' }}>TypeScript:</strong>{' '}
            <code style={{ color: 'var(--color-accent)' }}>npm install @modelcontextprotocol/sdk</code>
          </li>
          <li className="text-sm" style={{ color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
            <strong style={{ color: 'var(--color-text-primary)' }}>Python:</strong>{' '}
            <code style={{ color: 'var(--color-accent)' }}>pip install mcp</code>
          </li>
        </ul>
      </section>

      {/* ─── Step 1 ─── */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <h2
          id="step-1-connect"
          className="text-xl font-semibold"
          style={{ color: 'var(--color-text-primary)' }}
        >
          Step 1: Connect to ToolPilot
        </h2>
        <p className="text-sm" style={{ color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
          Use the MCP SDK to spin up the ToolPilot server and connect via stdio transport:
        </p>

        <CodeTabs
          tabs={[
            { label: 'TypeScript', language: 'typescript', code: TS_CONNECT },
            { label: 'Python', language: 'python', code: PY_CONNECT },
          ]}
        />

        <Callout type="tip" title="Transport options">
          The example above uses <strong>stdio transport</strong> (recommended for local development).
          ToolPilot also supports SSE transport for remote connections.
        </Callout>
      </section>

      {/* ─── Step 2 ─── */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <h2
          id="step-2-search"
          className="text-xl font-semibold"
          style={{ color: 'var(--color-text-primary)' }}
        >
          Step 2: Search for Tools
        </h2>
        <p className="text-sm" style={{ color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
          Call <code style={{ color: 'var(--color-accent)' }}>search_tools</code> with a natural-language
          query. ToolPilot may return clarification questions — answer them with{' '}
          <code style={{ color: 'var(--color-accent)' }}>search_tools_respond</code> to refine results.
        </p>

        <CodeBlock
          code={`// Handle clarification if needed
const searchResult = await client.callTool('search_tools', {
  query: 'lightweight container orchestration for small teams',
});

// If result contains a clarification question:
const refined = await client.callTool('search_tools_respond', {
  session_id: searchResult.session_id,
  answer: 'We need something simpler than Kubernetes, max 10 nodes',
});`}
          language="typescript"
          filename="clarification-flow.ts"
          showLineNumbers
        />
      </section>

      {/* ─── Step 3: Available Tools ─── */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <h2
          id="step-3-available-tools"
          className="text-xl font-semibold"
          style={{ color: 'var(--color-text-primary)' }}
        >
          Step 3: Explore Available MCP Tools
        </h2>
        <p className="text-sm" style={{ color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
          ToolPilot exposes 5 MCP tools for different stages of tool discovery:
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {MCP_TOOLS_SUMMARY.map((tool) => (
            <div
              key={tool.name}
              className="glass-card"
              style={{
                padding: '14px 18px',
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
              }}
            >
              <code
                className="text-sm font-semibold"
                style={{ color: 'var(--color-accent)' }}
              >
                {tool.name}
              </code>
              <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                {tool.description}
              </span>
            </div>
          ))}
        </div>

        <p className="text-sm" style={{ color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
          See the{' '}
          <Link
            href="/docs/mcp-tools"
            style={{ color: 'var(--color-accent)', textDecoration: 'none' }}
          >
            MCP Tools Reference
          </Link>{' '}
          for complete parameter documentation and response schemas.
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
          Close the feedback loop by reporting which tools worked:
        </p>

        <CodeTabs
          tabs={[
            {
              label: 'TypeScript',
              language: 'typescript',
              code: `await client.callTool('report_outcome', {
  tool: 'k3s',
  outcome: 'adopted',
  context: 'Perfect for our small cluster, easy setup',
});`,
            },
            {
              label: 'Python',
              language: 'python',
              code: `await session.call_tool(
    "report_outcome",
    arguments={
        "tool": "k3s",
        "outcome": "adopted",
        "context": "Perfect for our small cluster, easy setup",
    },
)`,
            },
          ]}
        />

        <Callout type="important" title="Outcomes improve the graph">
          Every outcome report adjusts edge weights in the tool graph. This is what makes
          ToolPilot&apos;s recommendations improve over time — please integrate outcome reporting
          into your agent&apos;s workflow.
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
          <NextStepItem href="/docs/mcp-tools" text="Full MCP Tools Reference" />
          <NextStepItem href="/docs/concepts/search-pipeline" text="Understand the 4-stage search pipeline" />
          <NextStepItem href="/docs/guides/rich-context" text="Skip clarification with rich context" />
          <NextStepItem href="/docs/architecture/overview" text="System architecture overview" />
        </ul>
      </section>

      <PrevNextNav prev={prev} next={next} />
    </div>
  );
}

/* ─── Private component ─── */

function NextStepItem({ href, text }: { href: string; text: string }) {
  return (
    <li className="text-sm" style={{ lineHeight: 1.6 }}>
      <a href={href} style={{ color: 'var(--color-accent)', textDecoration: 'none' }}>
        {text} →
      </a>
    </li>
  );
}
