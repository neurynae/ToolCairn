import type { Metadata } from 'next';
import { AmbientBackground } from '@/components/layout/ambient-background';
import { SiteHeader } from '@/components/layout/site-header';
import { SiteFooter } from '@/components/layout/site-footer';
import { GlassCard } from '@/components/ui/glass-card';

export const metadata: Metadata = {
  title: 'How ToolPilot Works',
  description:
    'Learn how ToolPilot uses a 4-stage search pipeline combining hybrid search, graph intelligence, and AI to find the best developer tools.',
};

const PIPELINE_STAGES = [
  {
    number: 1,
    title: 'Hybrid Search',
    subtitle: 'BM25 + Vector',
    description: 'Cast a wide net across 12,000+ tools using keyword and semantic search in parallel.',
    color: '#818cf8',
  },
  {
    number: 2,
    title: 'Graph Re-ranking',
    subtitle: 'Relationship Intelligence',
    description: 'Leverage relationship data — integrations, alternatives, and ecosystem signals — to re-rank candidates.',
    color: '#34d399',
  },
  {
    number: 3,
    title: 'Clarification',
    subtitle: 'Ask the Right Questions',
    description: 'When the query is ambiguous, ask targeted questions to narrow down the perfect match.',
    color: '#fbbf24',
  },
  {
    number: 4,
    title: 'Final Selection',
    subtitle: 'Pick the Best',
    description: 'Select the top 1–2 tools with confidence scores, reasons, and documentation links.',
    color: '#f472b6',
  },
] as const;

const MCP_TOOLS = [
  { name: 'search_tools', description: 'Start a new tool search with a natural-language query' },
  { name: 'search_tools_respond', description: 'Answer clarification questions to refine results' },
  { name: 'report_outcome', description: 'Report whether a recommended tool worked out' },
  { name: 'check_issue', description: 'Check if a bug has already been reported for a tool' },
  { name: 'get_stack', description: 'Get a full stack recommendation for a project description' },
  { name: 'get_tool_recommendations', description: 'Get tool suggestions based on constraints' },
] as const;

const MCP_CONFIG = `{
  "mcpServers": {
    "toolpilot": {
      "command": "npx",
      "args": ["@toolpilot/mcp-server"]
    }
  }
}`;

export default function AboutPage() {
  return (
    <>
      <AmbientBackground />
      <div className="flex min-h-dvh flex-col">
        <SiteHeader />
        <main className="flex-1">
          <div className="mx-auto max-w-4xl px-6 pb-20 pt-12">
            {/* Hero */}
            <div className="mb-14 text-center fade-up">
              <h1
                className="mb-3 text-4xl font-bold tracking-tight"
                style={{ color: 'var(--color-text-primary)' }}
              >
                How ToolPilot Works
              </h1>
              <p className="text-lg" style={{ color: 'var(--color-text-secondary)' }}>
                A 4-stage search pipeline that combines hybrid search, graph intelligence, and AI
                clarification to find the right tool every time.
              </p>
            </div>

            <div className="flex flex-col gap-10">
              {/* The Pipeline */}
              <GlassCard padding="lg" as="section" className="fade-up">
                <h2
                  className="mb-6 text-2xl font-bold"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  The Pipeline
                </h2>
                <div className="grid gap-6 sm:grid-cols-2">
                  {PIPELINE_STAGES.map((stage) => (
                    <div key={stage.number} className="flex gap-4">
                      <div
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                        style={{ background: stage.color }}
                      >
                        {stage.number}
                      </div>
                      <div className="flex flex-col gap-1">
                        <h3
                          className="text-sm font-semibold"
                          style={{ color: 'var(--color-text-primary)' }}
                        >
                          {stage.title}
                        </h3>
                        <p
                          className="text-xs font-medium"
                          style={{ color: stage.color }}
                        >
                          {stage.subtitle}
                        </p>
                        <p
                          className="text-sm leading-relaxed"
                          style={{ color: 'var(--color-text-secondary)' }}
                        >
                          {stage.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </GlassCard>

              {/* Use via MCP */}
              <GlassCard padding="lg" as="section" className="fade-up">
                <h2
                  className="mb-2 text-2xl font-bold"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  Use via MCP
                </h2>
                <p
                  className="mb-5 text-sm leading-relaxed"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  Add ToolPilot to any MCP-compatible AI agent (Claude, Cursor, VS Code Copilot)
                  with a single config block:
                </p>
                <pre
                  className="overflow-x-auto rounded-lg p-4 text-sm leading-relaxed"
                  style={{
                    background: 'var(--color-surface-0)',
                    color: 'var(--color-text-primary)',
                    border: '1px solid var(--color-border-subtle)',
                  }}
                >
                  <code>{MCP_CONFIG}</code>
                </pre>
              </GlassCard>

              {/* Available Tools */}
              <GlassCard padding="lg" as="section" className="fade-up">
                <h2
                  className="mb-5 text-2xl font-bold"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  Available MCP Tools
                </h2>
                <div className="flex flex-col gap-3">
                  {MCP_TOOLS.map((tool) => (
                    <div
                      key={tool.name}
                      className="flex items-start gap-3 rounded-lg px-4 py-3"
                      style={{ background: 'var(--color-surface-0)' }}
                    >
                      <code
                        className="shrink-0 rounded px-2 py-0.5 text-xs font-semibold"
                        style={{
                          background: 'var(--color-accent-subtle)',
                          color: 'var(--color-accent)',
                        }}
                      >
                        {tool.name}
                      </code>
                      <span
                        className="text-sm"
                        style={{ color: 'var(--color-text-secondary)' }}
                      >
                        {tool.description}
                      </span>
                    </div>
                  ))}
                </div>
              </GlassCard>

              {/* Open Source */}
              <GlassCard padding="lg" as="section" className="fade-up">
                <h2
                  className="mb-2 text-2xl font-bold"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  Open Source
                </h2>
                <p
                  className="mb-4 text-sm leading-relaxed"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  ToolPilot is fully open source. The entire platform — MCP server, search engine,
                  graph database, indexer, and web interface — is available on GitHub.
                </p>
                <a
                  href="https://github.com/nicholasgriffintn/toolpilot"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
                  style={{ background: 'var(--color-accent)' }}
                >
                  <GithubIcon />
                  View on GitHub
                </a>
              </GlassCard>
            </div>
          </div>
        </main>
        <SiteFooter />
      </div>
    </>
  );
}

function GithubIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
    </svg>
  );
}
