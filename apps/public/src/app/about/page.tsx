'use client';

import { GithubIcon } from 'lucide-react';
import { AmbientBackground } from '@/components/layout/ambient-background';
import { SiteHeader } from '@/components/layout/site-header';
import { SiteFooter } from '@/components/layout/site-footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useCommandPalette } from '@/components/providers/command-palette-provider';

const PIPELINE_STAGES = [
  {
    number: 1,
    title: 'Hybrid Search',
    subtitle: 'BM25 + Vector',
    description: 'Cast a wide net across 12,000+ tools using keyword and semantic search in parallel.',
    color: 'text-[var(--tp-accent)]',
    bgColor: 'bg-[var(--tp-accent)]/10',
  },
  {
    number: 2,
    title: 'Graph Re-ranking',
    subtitle: 'Relationship Intelligence',
    description: 'Leverage relationship data — integrations, alternatives, and ecosystem signals — to re-rank candidates.',
    color: 'text-[var(--tp-health-active)]',
    bgColor: 'bg-[var(--tp-health-active)]/10',
  },
  {
    number: 3,
    title: 'Clarification',
    subtitle: 'Ask the Right Questions',
    description: 'When the query is ambiguous, ask targeted questions to narrow down the perfect match.',
    color: 'text-[var(--tp-health-slowing)]',
    bgColor: 'bg-[var(--tp-health-slowing)]/10',
  },
  {
    number: 4,
    title: 'Final Selection',
    subtitle: 'Pick the Best',
    description: 'Select the top 1–2 tools with confidence scores, reasons, and documentation links.',
    color: 'text-pink-400',
    bgColor: 'bg-pink-400/10',
  },
] as const;

const MCP_TOOLS = [
  { name: 'search_tools', description: 'Start a new tool search with a natural-language query' },
  { name: 'search_tools_respond', description: 'Answer clarification questions to refine results' },
  { name: 'report_outcome', description: 'Report whether a recommended tool worked out' },
  { name: 'check_issue', description: 'Check if a bug has already been reported for a tool' },
  { name: 'get_stack', description: 'Get a full stack recommendation for a project description' },
  { name: 'compare_tools', description: 'Compare two tools head-to-head with health metrics' },
  { name: 'check_compatibility', description: 'Check if two tools are known to work together' },
] as const;

const MCP_CONFIG = `{
  "mcpServers": {
    "toolcairn": {
      "command": "npx",
      "args": ["@neurynae/toolcairn-mcp"]
    }
  }
}`;

export default function AboutPage() {
  const { toggle } = useCommandPalette();

  return (
    <>
      <AmbientBackground />
      <div className="flex min-h-dvh flex-col">
        <SiteHeader onOpenSearch={toggle} />
        <main className="flex-1">
          <div className="mx-auto max-w-4xl px-4 pb-20 pt-12 sm:px-6">
            {/* Hero */}
            <div className="animate-fade-up mb-14 text-center">
              <h1 className="mb-3 text-4xl font-bold tracking-tight text-foreground">
                How ToolCairn Works
              </h1>
              <p className="text-lg text-muted-foreground">
                A 4-stage search pipeline combining hybrid search, graph intelligence,
                and AI clarification to find the right tool every time.
              </p>
            </div>

            <div className="flex flex-col gap-8">
              {/* The Pipeline */}
              <Card>
                <CardHeader>
                  <CardTitle>The 4-Stage Pipeline</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-6 sm:grid-cols-2">
                    {PIPELINE_STAGES.map((stage) => (
                      <div key={stage.number} className="flex gap-4">
                        <div
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold ${stage.bgColor} ${stage.color}`}
                        >
                          {stage.number}
                        </div>
                        <div className="flex flex-col gap-1">
                          <h3 className="text-sm font-semibold text-foreground">{stage.title}</h3>
                          <p className={`text-xs font-medium ${stage.color}`}>{stage.subtitle}</p>
                          <p className="text-sm leading-relaxed text-muted-foreground">
                            {stage.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Use via MCP */}
              <Card>
                <CardHeader>
                  <CardTitle>Use via MCP</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Add ToolCairn to any MCP-compatible AI agent (Claude, Cursor, VS Code Copilot) with a single config block:
                  </p>
                </CardHeader>
                <CardContent>
                  <pre className="overflow-x-auto rounded-lg border border-border bg-muted p-4 text-sm leading-relaxed text-foreground">
                    <code>{MCP_CONFIG}</code>
                  </pre>
                </CardContent>
              </Card>

              {/* Available MCP Tools */}
              <Card>
                <CardHeader>
                  <CardTitle>Available MCP Tools</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col gap-3">
                    {MCP_TOOLS.map((tool) => (
                      <div
                        key={tool.name}
                        className="flex items-start gap-3 rounded-lg border border-border bg-muted/30 px-4 py-3"
                      >
                        <Badge className="mt-0.5 shrink-0 bg-[var(--tp-accent-subtle)] text-[var(--tp-accent)] border-[var(--tp-accent)]/20 font-mono text-xs">
                          {tool.name}
                        </Badge>
                        <span className="text-sm text-muted-foreground">{tool.description}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Open Source */}
              <Card>
                <CardHeader>
                  <CardTitle>Open Source</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    ToolCairn is fully open source. The entire platform — MCP server, search engine,
                    graph database, indexer, and web interface — is available on GitHub.
                  </p>
                </CardHeader>
                <CardContent>
                  <Button nativeButton={false} render={<a href="https://github.com/NEURYNAE/ToolCairn" target="_blank" rel="noopener noreferrer" />}>
                    <GithubIcon className="size-4" />
                    View on GitHub
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
        <SiteFooter />
      </div>
    </>
  );
}
