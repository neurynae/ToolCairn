import type { Metadata } from 'next';
import { Breadcrumbs } from '@/components/docs/breadcrumbs';
import { PrevNextNav } from '@/components/docs/prev-next-nav';
import { CodeBlock } from '@/components/docs/code-block';
import { Callout } from '@/components/docs/callout';
import { getPrevNext } from '@/lib/docs-navigation';

export const metadata: Metadata = {
  title: 'Contributing – ToolPilot Docs',
  description:
    'Development setup, project structure, coding standards, and commit conventions for ToolPilot contributors.',
};

const SETUP_COMMANDS = `git clone https://github.com/toolpilot/toolpilot
cd toolpilot
pnpm install
pnpm db:up       # Start Memgraph, Qdrant, PostgreSQL, Redis
pnpm db:seed     # Seed initial tool data
pnpm dev         # Start all dev servers`;

const DIRECTORY_TREE = `toolpilot/
├── apps/
│   ├── mcp-server/        # MCP protocol server (primary product)
│   ├── web/               # Next.js admin dashboard
│   ├── public/            # Next.js public site & docs
│   └── indexer/           # GitHub indexer + workers
├── packages/
│   ├── core/              # Shared types, Zod schemas
│   ├── graph/             # Memgraph client + Cypher queries
│   ├── vector/            # Qdrant + Nomic embeddings
│   ├── search/            # 4-stage search pipeline
│   ├── db/                # PostgreSQL (Prisma)
│   ├── queue/             # Redis Streams (ioredis)
│   └── config/            # Validated env config (Zod)
├── docker-compose.yml     # Infrastructure services
├── turbo.json             # Turborepo pipeline config
├── pnpm-workspace.yaml    # Workspace definitions
└── biome.json             # Linter / formatter config`;

const RESULT_PATTERN = `// ✅ Domain functions return Result types
type Result<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

function findTool(name: string): Result<Tool> {
  const tool = toolRepository.findByName(name);
  if (!tool) {
    return { ok: false, error: \`Tool "\${name}" not found\` };
  }
  return { ok: true, data: tool };
}`;

const REPOSITORY_PATTERN = `// ✅ Repository interface for testable DB access
interface ToolRepository {
  findByName(name: string): Promise<Tool | null>;
  findRelated(toolId: string, limit: number): Promise<Tool[]>;
  upsert(tool: Tool): Promise<void>;
}

// Production: backed by Memgraph
// Tests: backed by in-memory Map`;

const COMMIT_EXAMPLES = `# Format: type(scope): description
feat(search): add language filter to Stage 2
fix(graph): handle null edge weights in reranking
refactor(mcp): extract validation into shared schema
test(vector): add embedding dimension tests
docs(architecture): add data flow diagrams
chore(infra): upgrade Qdrant to 1.12
ci(indexer): add schedule trigger for nightly runs`;

interface Standard {
  rule: string;
  detail: string;
}

const CODING_STANDARDS: Standard[] = [
  {
    rule: 'TypeScript strict mode',
    detail:
      'Strict compiler options enabled. No any type except in generated code (e.g. Prisma).',
  },
  {
    rule: 'Named exports only',
    detail:
      'Every module uses named exports. Default exports are not allowed (except Next.js pages).',
  },
  {
    rule: 'Zod validation',
    detail:
      'All external input (API requests, env vars, MCP parameters) is validated with Zod schemas.',
  },
  {
    rule: 'Result pattern',
    detail:
      'Domain logic returns { ok: true, data } | { ok: false, error } instead of throwing exceptions.',
  },
  {
    rule: 'Repository interfaces',
    detail:
      'All database access goes through repository interfaces, enabling in-memory fakes for testing.',
  },
  {
    rule: 'Structured logging',
    detail:
      'pino with JSON output. No console.log in production code.',
  },
  {
    rule: 'Async error handling',
    detail:
      'All async functions use try/catch. No unhandled promise rejections.',
  },
];

interface FileConvention {
  suffix: string;
  purpose: string;
}

const FILE_CONVENTIONS: FileConvention[] = [
  { suffix: '.ts', purpose: 'Logic, utilities, and pure functions' },
  { suffix: '.tsx', purpose: 'React components' },
  { suffix: '.test.ts', purpose: 'Tests (colocated with source)' },
  { suffix: '.schema.ts', purpose: 'Zod validation schemas' },
  { suffix: '.repository.ts', purpose: 'Database access layer' },
  { suffix: '.service.ts', purpose: 'Business logic orchestration' },
  { suffix: '.handler.ts', purpose: 'Request handlers (MCP tools, API routes)' },
];

export default function ContributingPage() {
  const { prev, next } = getPrevNext('/docs/architecture/contributing');

  return (
    <div>
      <Breadcrumbs
        items={[
          { label: 'Docs', href: '/docs' },
          { label: 'Architecture', href: '/docs/architecture' },
          { label: 'Contributing' },
        ]}
      />

      <h1
        className="mt-4 text-3xl font-bold tracking-tight"
        style={{ color: 'var(--tp-text-primary)' }}
      >
        Contributing
      </h1>
      <p
        className="mt-3 text-base leading-relaxed"
        style={{ color: 'var(--tp-text-secondary)' }}
      >
        Everything you need to set up a local development environment and
        contribute to ToolPilot.
      </p>

      {/* ─── Prerequisites ─── */}
      <h2
        id="prerequisites"
        className="mt-10 text-xl font-semibold"
        style={{ color: 'var(--tp-text-primary)' }}
      >
        Prerequisites
      </h2>
      <ul
        className="mt-3 flex flex-col gap-2 text-sm"
        style={{ color: 'var(--tp-text-secondary)', paddingLeft: 20 }}
      >
        <li>
          <strong style={{ color: 'var(--tp-text-primary)' }}>Node.js 22 LTS</strong> — required
          runtime
        </li>
        <li>
          <strong style={{ color: 'var(--tp-text-primary)' }}>pnpm 9+</strong> — workspace-aware
          package manager
        </li>
        <li>
          <strong style={{ color: 'var(--tp-text-primary)' }}>Docker</strong> — runs Memgraph,
          Qdrant, PostgreSQL, and Redis via Compose
        </li>
      </ul>

      {/* ─── Dev Setup ─── */}
      <h2
        id="dev-setup"
        className="mt-10 text-xl font-semibold"
        style={{ color: 'var(--tp-text-primary)' }}
      >
        Development Setup
      </h2>
      <p
        className="mt-2 mb-4 text-sm"
        style={{ color: 'var(--tp-text-secondary)' }}
      >
        Clone and start the full stack in under a minute:
      </p>
      <CodeBlock code={SETUP_COMMANDS} language="bash" />

      <div className="mt-4">
        <Callout type="tip" title="First-time setup">
          <code>pnpm db:up</code> pulls Docker images on the first run, which
          may take a few minutes depending on your connection. Subsequent starts
          are near-instant.
        </Callout>
      </div>

      {/* ─── Project Structure ─── */}
      <h2
        id="project-structure"
        className="mt-10 text-xl font-semibold"
        style={{ color: 'var(--tp-text-primary)' }}
      >
        Project Structure
      </h2>
      <p
        className="mt-2 mb-4 text-sm"
        style={{ color: 'var(--tp-text-secondary)' }}
      >
        Monorepo layout managed by pnpm workspaces and Turborepo:
      </p>
      <CodeBlock code={DIRECTORY_TREE} language="text" />

      {/* ─── Coding Standards ─── */}
      <h2
        id="coding-standards"
        className="mt-10 text-xl font-semibold"
        style={{ color: 'var(--tp-text-primary)' }}
      >
        Coding Standards
      </h2>
      <div className="mt-4 flex flex-col gap-3">
        {CODING_STANDARDS.map((standard) => (
          <div
            key={standard.rule}
            style={{
              padding: '12px 16px',
              background: 'var(--tp-surface-1)',
              border: '1px solid var(--tp-border-subtle)',
              borderRadius: 'var(--radius-md)',
            }}
          >
            <p
              className="text-sm font-semibold"
              style={{ color: 'var(--tp-text-primary)', margin: 0 }}
            >
              {standard.rule}
            </p>
            <p
              className="mt-1 text-sm"
              style={{ color: 'var(--tp-text-secondary)', margin: 0 }}
            >
              {standard.detail}
            </p>
          </div>
        ))}
      </div>

      {/* ─── Result Pattern ─── */}
      <h3
        id="result-pattern"
        className="mt-8 text-lg font-semibold"
        style={{ color: 'var(--tp-text-primary)' }}
      >
        Result Pattern
      </h3>
      <p
        className="mt-2 mb-4 text-sm"
        style={{ color: 'var(--tp-text-secondary)' }}
      >
        Domain functions return typed results instead of throwing:
      </p>
      <CodeBlock code={RESULT_PATTERN} language="typescript" showLineNumbers />

      {/* ─── Repository Pattern ─── */}
      <h3
        id="repository-pattern"
        className="mt-8 text-lg font-semibold"
        style={{ color: 'var(--tp-text-primary)' }}
      >
        Repository Pattern
      </h3>
      <p
        className="mt-2 mb-4 text-sm"
        style={{ color: 'var(--tp-text-secondary)' }}
      >
        All database access is abstracted behind interfaces:
      </p>
      <CodeBlock
        code={REPOSITORY_PATTERN}
        language="typescript"
        showLineNumbers
      />

      {/* ─── File Naming ─── */}
      <h2
        id="file-naming"
        className="mt-10 text-xl font-semibold"
        style={{ color: 'var(--tp-text-primary)' }}
      >
        File Naming
      </h2>
      <p
        className="mt-2 mb-4 text-sm"
        style={{ color: 'var(--tp-text-secondary)' }}
      >
        All files and directories use <strong>kebab-case</strong>. Recognised
        suffixes:
      </p>
      <div
        style={{
          border: '1px solid var(--tp-border-subtle)',
          borderRadius: 'var(--radius-md)',
          overflow: 'hidden',
        }}
      >
        <table className="w-full text-sm" style={{ borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--tp-surface-2)' }}>
              <th
                className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                style={{
                  color: 'var(--tp-text-muted)',
                  borderBottom: '1px solid var(--tp-border-subtle)',
                }}
              >
                Suffix
              </th>
              <th
                className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                style={{
                  color: 'var(--tp-text-muted)',
                  borderBottom: '1px solid var(--tp-border-subtle)',
                }}
              >
                Purpose
              </th>
            </tr>
          </thead>
          <tbody>
            {FILE_CONVENTIONS.map((fc, i) => (
              <tr
                key={fc.suffix}
                style={{
                  background:
                    i % 2 === 0
                      ? 'var(--tp-surface-1)'
                      : 'var(--tp-surface-0)',
                  borderBottom:
                    i < FILE_CONVENTIONS.length - 1
                      ? '1px solid var(--tp-border-subtle)'
                      : undefined,
                }}
              >
                <td className="px-4 py-3">
                  <code
                    className="font-mono text-sm"
                    style={{ color: 'var(--tp-accent)' }}
                  >
                    {fc.suffix}
                  </code>
                </td>
                <td
                  className="px-4 py-3"
                  style={{ color: 'var(--tp-text-secondary)' }}
                >
                  {fc.purpose}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ─── Testing ─── */}
      <h2
        id="testing"
        className="mt-10 text-xl font-semibold"
        style={{ color: 'var(--tp-text-primary)' }}
      >
        Testing
      </h2>
      <ul
        className="mt-3 flex flex-col gap-2 text-sm"
        style={{ color: 'var(--tp-text-secondary)', paddingLeft: 20 }}
      >
        <li>
          <strong style={{ color: 'var(--tp-text-primary)' }}>Vitest</strong>{' '}
          — unit and integration tests (<code>pnpm test</code> or{' '}
          <code>pnpm test:unit</code>)
        </li>
        <li>
          <strong style={{ color: 'var(--tp-text-primary)' }}>Playwright</strong>{' '}
          — end-to-end browser tests (<code>pnpm test:e2e</code>)
        </li>
        <li>
          Tests are colocated with source files using the{' '}
          <code>.test.ts</code> suffix
        </li>
      </ul>

      {/* ─── Commit Conventions ─── */}
      <h2
        id="commit-conventions"
        className="mt-10 text-xl font-semibold"
        style={{ color: 'var(--tp-text-primary)' }}
      >
        Commit Conventions
      </h2>
      <p
        className="mt-2 mb-4 text-sm"
        style={{ color: 'var(--tp-text-secondary)' }}
      >
        ToolPilot follows{' '}
        <strong style={{ color: 'var(--tp-text-primary)' }}>
          Conventional Commits
        </strong>
        . Format: <code>type(scope): description</code>
      </p>
      <CodeBlock code={COMMIT_EXAMPLES} language="bash" />

      <div className="mt-4">
        <Callout type="important" title="Scopes">
          Valid scopes: <code>graph</code>, <code>search</code>,{' '}
          <code>mcp</code>, <code>indexer</code>, <code>web</code>,{' '}
          <code>admin</code>, <code>infra</code>, <code>core</code>.
        </Callout>
      </div>

      <PrevNextNav prev={prev} next={next} />
    </div>
  );
}
