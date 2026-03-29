import type { Metadata } from 'next';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/docs/breadcrumbs';
import { Callout } from '@/components/docs/callout';
import { PrevNextNav } from '@/components/docs/prev-next-nav';
import { getPrevNext } from '@/lib/docs-navigation';

export const metadata: Metadata = {
  title: 'MCP Tools Overview — ToolPilot Docs',
  description:
    'Overview of the 5 MCP tools ToolPilot exposes for AI agents to discover, evaluate, and report on developer tools.',
};

const CURRENT_HREF = '/docs/mcp-tools';

const tools = [
  {
    name: 'search_tools',
    href: '/docs/mcp-tools/search-tools',
    description:
      'Primary discovery tool. Accepts a natural-language query and returns tool recommendations through a multi-stage pipeline.',
    badge: 'Discovery',
  },
  {
    name: 'search_tools_respond',
    href: '/docs/mcp-tools/search-tools-respond',
    description:
      'Answers clarification questions returned by search_tools to refine and complete a search.',
    badge: 'Discovery',
  },
  {
    name: 'get_stack',
    href: '/docs/mcp-tools/get-stack',
    description:
      'Builds a compatible tool stack for a given use case using graph relationship data.',
    badge: 'Stack',
  },
  {
    name: 'check_issue',
    href: '/docs/mcp-tools/check-issue',
    description:
      'Diagnoses known issues with a specific tool and returns matched solutions with confidence scores.',
    badge: 'Diagnostics',
  },
  {
    name: 'report_outcome',
    href: '/docs/mcp-tools/report-outcome',
    description:
      'Reports the outcome of using a recommended tool so the graph can improve future recommendations.',
    badge: 'Feedback',
  },
] as const;

export default function McpToolsOverviewPage() {
  const { prev, next } = getPrevNext(CURRENT_HREF);

  return (
    <div style={{ maxWidth: 768, margin: '0 auto' }}>
      <Breadcrumbs
        items={[
          { label: 'Docs', href: '/docs' },
          { label: 'MCP Tools' },
        ]}
      />

      {/* ─── Header ─── */}
      <h1
        className="text-3xl font-bold tracking-tight sm:text-4xl"
        style={{ color: 'var(--color-text-primary)', marginTop: 24 }}
      >
        MCP Tools Reference
      </h1>
      <p
        className="mt-3 text-base leading-relaxed sm:text-lg"
        style={{ color: 'var(--color-text-secondary)' }}
      >
        ToolPilot exposes <strong>5 MCP tools</strong> that AI agents use to discover, evaluate, and
        report on developer tools. Every tool follows the{' '}
        <a
          href="https://modelcontextprotocol.io"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: 'var(--color-accent)', textDecoration: 'underline' }}
        >
          Model Context Protocol
        </a>{' '}
        specification and can be called by any MCP-compatible client.
      </p>

      {/* ─── Tool Cards ─── */}
      <section style={{ marginTop: 40 }}>
        <h2
          id="all-tools"
          className="mb-5 text-xl font-semibold"
          style={{ color: 'var(--color-text-primary)' }}
        >
          All tools
        </h2>

        <div className="flex flex-col gap-4">
          {tools.map((tool) => (
            <Link
              key={tool.name}
              href={tool.href}
              className="group flex flex-col gap-2 rounded-lg p-5 transition-colors duration-150"
              style={{
                background: 'var(--color-surface-1)',
                border: '1px solid var(--color-border-subtle)',
                textDecoration: 'none',
              }}
            >
              <div className="flex items-center gap-3">
                <code
                  className="text-base font-semibold"
                  style={{ color: 'var(--color-accent)', fontFamily: 'var(--font-mono, monospace)' }}
                >
                  {tool.name}
                </code>
                <span
                  className="rounded-full px-2 py-0.5 text-xs font-medium"
                  style={{
                    background: 'var(--color-surface-3)',
                    color: 'var(--color-text-muted)',
                  }}
                >
                  {tool.badge}
                </span>
              </div>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                {tool.description}
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* ─── Typical Flow ─── */}
      <section style={{ marginTop: 48 }}>
        <h2
          id="typical-flow"
          className="mb-4 text-xl font-semibold"
          style={{ color: 'var(--color-text-primary)' }}
        >
          Typical flow
        </h2>
        <p
          className="mb-4 text-sm leading-relaxed"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          A standard agent interaction follows a three-step pattern:
        </p>

        <ol
          className="flex flex-col gap-4 text-sm"
          style={{ listStyle: 'none', padding: 0, margin: 0 }}
        >
          {[
            {
              step: '1',
              title: 'search_tools',
              text: 'The agent sends a natural-language query. ToolPilot either returns results immediately or asks clarification questions.',
            },
            {
              step: '2',
              title: 'search_tools_respond',
              text: 'If clarification was needed, the agent answers the questions. ToolPilot completes the pipeline and returns results.',
              optional: true,
            },
            {
              step: '3',
              title: 'report_outcome',
              text: 'After the agent uses a recommended tool, it reports success, failure, or partial success. This feedback improves future recommendations.',
            },
          ].map((item) => (
            <li key={item.step} className="flex gap-4" style={{ margin: 0 }}>
              <span
                className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold"
                style={{
                  background: 'rgba(99,102,241,0.15)',
                  color: 'var(--color-accent)',
                  marginTop: 1,
                }}
              >
                {item.step}
              </span>
              <div>
                <span className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                  <code style={{ fontFamily: 'var(--font-mono, monospace)' }}>{item.title}</code>
                  {item.optional && (
                    <span
                      className="ml-2 text-xs font-normal"
                      style={{ color: 'var(--color-text-muted)' }}
                    >
                      (optional)
                    </span>
                  )}
                </span>
                <p
                  style={{ color: 'var(--color-text-secondary)', margin: '4px 0 0' }}
                >
                  {item.text}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* ─── MCP Compatibility Note ─── */}
      <section style={{ marginTop: 32 }}>
        <Callout type="note" title="MCP Protocol Compatibility">
          All tools conform to the{' '}
          <strong>Model Context Protocol v1.0+</strong> specification. They accept JSON-RPC
          requests over stdio and return structured JSON responses. Any MCP-compatible client —
          including Claude, Cursor, Windsurf, and custom SDK integrations — can call these tools
          without additional configuration.
        </Callout>
      </section>

      {/* ─── Supplementary Tools ─── */}
      <section style={{ marginTop: 48 }}>
        <h2
          id="supplementary-tools"
          className="mb-4 text-xl font-semibold"
          style={{ color: 'var(--color-text-primary)' }}
        >
          Supplementary tools
        </h2>
        <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
          <code style={{ fontFamily: 'var(--font-mono, monospace)', color: 'var(--color-accent)' }}>
            get_stack
          </code>{' '}
          and{' '}
          <code style={{ fontFamily: 'var(--font-mono, monospace)', color: 'var(--color-accent)' }}>
            check_issue
          </code>{' '}
          are standalone tools that can be called independently of the search flow. Use{' '}
          <code style={{ fontFamily: 'var(--font-mono, monospace)', color: 'var(--color-accent)' }}>
            get_stack
          </code>{' '}
          when building a new project and{' '}
          <code style={{ fontFamily: 'var(--font-mono, monospace)', color: 'var(--color-accent)' }}>
            check_issue
          </code>{' '}
          when troubleshooting an existing tool.
        </p>
      </section>

      <div style={{ marginTop: 48 }}>
        <PrevNextNav
          prev={prev ? { title: prev.title, href: prev.href } : null}
          next={next ? { title: next.title, href: next.href } : null}
        />
      </div>
    </div>
  );
}
