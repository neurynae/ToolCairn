import type { Metadata } from 'next';
import { Breadcrumbs } from '@/components/docs/breadcrumbs';
import { PrevNextNav } from '@/components/docs/prev-next-nav';
import { CodeBlock } from '@/components/docs/code-block';
import { Callout } from '@/components/docs/callout';
import { getPrevNext } from '@/lib/docs-navigation';

export const metadata: Metadata = {
  title: 'System Overview – ToolPilot Docs',
  description:
    'High-level architecture diagram and component breakdown for the ToolPilot platform.',
};

const ARCHITECTURE_DIAGRAM = `┌─────────────┐     ┌──────────────────┐     ┌──────────┐
│  AI Agent    │────▶│   MCP Server     │────▶│ Memgraph │
│ (Claude,     │     │  (@toolpilot/    │     │  (Graph)  │
│  Cursor...)  │     │   mcp-server)    │     └──────────┘
└─────────────┘     └──────────────────┘            │
                            │                       │
                            ▼                       ▼
                     ┌──────────────┐     ┌──────────────┐
                     │   Qdrant     │     │  PostgreSQL  │
                     │  (Vectors)   │     │ (Sessions)   │
                     └──────────────┘     └──────────────┘
                            ▲
                            │
                     ┌──────────────┐     ┌──────────┐
                     │   Indexer    │────▶│  Redis    │
                     │  (GitHub)    │     │  (Queue)  │
                     └──────────────┘     └──────────┘`;

interface ComponentInfo {
  name: string;
  path: string;
  description: string;
}

const APPS: ComponentInfo[] = [
  {
    name: 'MCP Server',
    path: 'apps/mcp-server',
    description:
      'The primary product — a Model Context Protocol server that AI agents connect to for tool discovery. Exposes five MCP tools and orchestrates the search package.',
  },
  {
    name: 'Web (Admin)',
    path: 'apps/web',
    description:
      'Next.js admin dashboard for monitoring graph health, managing tool data, and viewing analytics.',
  },
  {
    name: 'Public Site',
    path: 'apps/public',
    description:
      'Next.js public-facing site with documentation, search playground, and marketing pages.',
  },
  {
    name: 'Indexer',
    path: 'apps/indexer',
    description:
      'GitHub indexer that scans repositories on a schedule, extracts tool metadata, and queues update jobs for workers.',
  },
];

const PACKAGES: ComponentInfo[] = [
  {
    name: 'core',
    path: 'packages/core',
    description:
      'Shared TypeScript types, Zod schemas, and domain constants used across all apps and packages.',
  },
  {
    name: 'graph',
    path: 'packages/graph',
    description:
      'Memgraph client and Cypher query builders. Provides repository interfaces for graph reads and writes over the Bolt protocol.',
  },
  {
    name: 'vector',
    path: 'packages/vector',
    description:
      'Qdrant client, Nomic Embed Code 768-dimensional embeddings, and similarity search helpers.',
  },
  {
    name: 'search',
    path: 'packages/search',
    description:
      'The 4-stage search pipeline — BM25 + vector retrieval, payload filtering, graph reranking, and selection logic.',
  },
  {
    name: 'db',
    path: 'packages/db',
    description:
      'PostgreSQL access via Prisma. Handles session storage, analytics events, and user preferences.',
  },
  {
    name: 'queue',
    path: 'packages/queue',
    description:
      'Redis Streams wrapper (ioredis). Provides reliable job queuing for the indexer worker pipeline.',
  },
  {
    name: 'config',
    path: 'packages/config',
    description:
      'Validated configuration module — Zod schema over process.env. Single source of truth for all environment variables.',
  },
];

interface TechChoice {
  name: string;
  reason: string;
}

const TECH_CHOICES: TechChoice[] = [
  {
    name: 'Memgraph',
    reason:
      'Native graph processing engine. Tool relationships (RELATED_TO, DEPENDS_ON, ALTERNATIVE_TO) are first-class graph edges, making traversal and reranking queries orders of magnitude faster than join-heavy SQL.',
  },
  {
    name: 'Qdrant',
    reason:
      'High-performance vector similarity search with rich payload filtering. Supports hybrid BM25 + dense vector queries in a single request, which maps directly to Stage 1 of the search pipeline.',
  },
  {
    name: 'PostgreSQL',
    reason:
      'ACID-compliant relational storage for session data, analytics events, and user preferences — workloads that benefit from strong consistency and mature tooling (Prisma).',
  },
  {
    name: 'Redis Streams',
    reason:
      'Reliable, append-only job queue with consumer groups. Ensures indexer workers process every update exactly once, even across restarts, without the operational weight of a dedicated message broker.',
  },
];

export default function ArchitectureOverviewPage() {
  const { prev, next } = getPrevNext('/docs/architecture/overview');

  return (
    <div>
      <Breadcrumbs
        items={[
          { label: 'Docs', href: '/docs' },
          { label: 'Architecture', href: '/docs/architecture' },
          { label: 'System Overview' },
        ]}
      />

      <h1
        className="mt-4 text-3xl font-bold tracking-tight"
        style={{ color: 'var(--tp-text-primary)' }}
      >
        System Overview
      </h1>
      <p
        className="mt-3 text-base leading-relaxed"
        style={{ color: 'var(--tp-text-secondary)' }}
      >
        ToolPilot is a monorepo built with pnpm workspaces and Turborepo. Four
        apps sit on top of seven shared packages, backed by four infrastructure
        services.
      </p>

      {/* ─── Architecture Diagram ─── */}
      <h2
        id="architecture-diagram"
        className="mt-10 text-xl font-semibold"
        style={{ color: 'var(--tp-text-primary)' }}
      >
        Architecture Diagram
      </h2>
      <p
        className="mt-2 mb-4 text-sm"
        style={{ color: 'var(--tp-text-secondary)' }}
      >
        High-level view of all components and their connections:
      </p>
      <CodeBlock code={ARCHITECTURE_DIAGRAM} language="text" />

      {/* ─── Applications ─── */}
      <h2
        id="applications"
        className="mt-10 text-xl font-semibold"
        style={{ color: 'var(--tp-text-primary)' }}
      >
        Applications
      </h2>
      <p
        className="mt-2 mb-4 text-sm"
        style={{ color: 'var(--tp-text-secondary)' }}
      >
        Four deployable apps live in the <code style={{ color: 'var(--tp-accent)' }}>apps/</code> directory:
      </p>
      <div className="flex flex-col gap-3">
        {APPS.map((app) => (
          <ComponentCard key={app.path} component={app} />
        ))}
      </div>

      {/* ─── Packages ─── */}
      <h2
        id="packages"
        className="mt-10 text-xl font-semibold"
        style={{ color: 'var(--tp-text-primary)' }}
      >
        Shared Packages
      </h2>
      <p
        className="mt-2 mb-4 text-sm"
        style={{ color: 'var(--tp-text-secondary)' }}
      >
        Seven packages in <code style={{ color: 'var(--tp-accent)' }}>packages/</code> provide
        reusable domain logic:
      </p>
      <div className="flex flex-col gap-3">
        {PACKAGES.map((pkg) => (
          <ComponentCard key={pkg.path} component={pkg} />
        ))}
      </div>

      {/* ─── Technology Choices ─── */}
      <h2
        id="technology-choices"
        className="mt-10 text-xl font-semibold"
        style={{ color: 'var(--tp-text-primary)' }}
      >
        Technology Choices
      </h2>
      <p
        className="mt-2 mb-4 text-sm"
        style={{ color: 'var(--tp-text-secondary)' }}
      >
        Each infrastructure service was chosen to match a specific workload
        pattern:
      </p>
      <div className="flex flex-col gap-3">
        {TECH_CHOICES.map((tech) => (
          <div
            key={tech.name}
            style={{
              padding: 16,
              background: 'var(--tp-surface-1)',
              border: '1px solid var(--tp-border-subtle)',
              borderRadius: 'var(--radius-md)',
            }}
          >
            <h3
              className="text-sm font-semibold"
              style={{ color: 'var(--tp-text-primary)', margin: 0 }}
            >
              {tech.name}
            </h3>
            <p
              className="mt-1 text-sm leading-relaxed"
              style={{ color: 'var(--tp-text-secondary)', margin: 0 }}
            >
              {tech.reason}
            </p>
          </div>
        ))}
      </div>

      {/* ─── Infrastructure ─── */}
      <h2
        id="infrastructure"
        className="mt-10 text-xl font-semibold"
        style={{ color: 'var(--tp-text-primary)' }}
      >
        Infrastructure
      </h2>
      <div className="mt-4">
        <Callout type="note" title="Docker Compose">
          All four infrastructure services — Memgraph, Qdrant, PostgreSQL, and
          Redis — are defined in a single{' '}
          <code>docker-compose.yml</code> at the repository root. Run{' '}
          <code>pnpm db:up</code> to start everything locally.
        </Callout>
      </div>

      <PrevNextNav prev={prev} next={next} />
    </div>
  );
}

/* ─── Reusable component card ─── */

function ComponentCard({ component }: { component: ComponentInfo }) {
  return (
    <div
      style={{
        padding: 16,
        background: 'var(--tp-surface-1)',
        border: '1px solid var(--tp-border-subtle)',
        borderRadius: 'var(--radius-md)',
      }}
    >
      <div className="flex items-center gap-2">
        <h3
          className="text-sm font-semibold"
          style={{ color: 'var(--tp-text-primary)', margin: 0 }}
        >
          {component.name}
        </h3>
        <code
          className="text-xs"
          style={{ color: 'var(--tp-text-muted)' }}
        >
          {component.path}
        </code>
      </div>
      <p
        className="mt-1 text-sm leading-relaxed"
        style={{ color: 'var(--tp-text-secondary)', margin: 0 }}
      >
        {component.description}
      </p>
    </div>
  );
}
