import type { Metadata } from 'next';
import { Breadcrumbs } from '@/components/docs/breadcrumbs';
import { Callout } from '@/components/docs/callout';
import { CodeBlock } from '@/components/docs/code-block';
import { CodeTabs } from '@/components/docs/code-tabs';
import { ParamTable } from '@/components/docs/param-table';
import { PrevNextNav } from '@/components/docs/prev-next-nav';
import { getPrevNext } from '@/lib/docs-navigation';

export const metadata: Metadata = {
  title: 'search_tools — MCP Tools — ToolPilot Docs',
  description:
    'API reference for search_tools — the primary MCP tool for discovering developer tools through ToolPilot\u2019s multi-stage pipeline.',
};

const CURRENT_HREF = '/docs/mcp-tools/search-tools';

const inputParams = [
  {
    name: 'query',
    type: 'string',
    required: true,
    description: 'Natural language search query describing the tool you need.',
  },
  {
    name: 'context',
    type: 'object',
    required: false,
    description:
      'Optional pre-filters to skip clarification questions and jump directly to results.',
  },
  {
    name: 'context.language',
    type: 'string',
    required: false,
    description: 'Programming language filter (e.g. "TypeScript", "Python", "Go").',
  },
  {
    name: 'context.category',
    type: 'string',
    required: false,
    description: 'Tool category filter (e.g. "database", "testing", "monitoring").',
  },
  {
    name: 'context.license',
    type: 'string',
    required: false,
    description: 'License type filter (e.g. "MIT", "Apache-2.0", "proprietary").',
  },
  {
    name: 'context.deployment',
    type: 'string',
    required: false,
    description: 'Deployment model filter (e.g. "self-hosted", "cloud", "serverless").',
  },
];

const basicExample = `{
  "query": "vector database for embeddings"
}`;

const contextExample = `{
  "query": "ORM for PostgreSQL",
  "context": {
    "language": "TypeScript"
  }
}`;

const fullContextExample = `{
  "query": "monitoring and observability",
  "context": {
    "language": "Go",
    "category": "monitoring",
    "license": "Apache-2.0",
    "deployment": "self-hosted"
  }
}`;

const claudeBasicExample = `I need a vector database for storing embeddings.
// Claude will call search_tools with:
// { "query": "vector database for embeddings" }`;

const claudeContextExample = `I need a TypeScript ORM for PostgreSQL.
// Claude will call search_tools with:
// { "query": "ORM for PostgreSQL", "context": { "language": "TypeScript" } }`;

const cursorBasicExample = `// In Cursor chat:
// "Find me a vector database for embeddings"
// Cursor calls search_tools automatically`;

const cursorContextExample = `// In Cursor chat:
// "I need a TypeScript ORM for PostgreSQL"
// Cursor calls search_tools with language context`;

const clarificationResponse = `{
  "type": "clarification",
  "query_id": "q_abc123def456",
  "questions": [
    {
      "key": "language",
      "question": "What programming language are you using?",
      "options": ["Python", "TypeScript", "Go", "Java", "Rust"]
    },
    {
      "key": "deployment",
      "question": "What deployment model do you prefer?",
      "options": ["cloud", "self-hosted", "serverless"]
    }
  ]
}`;

const resultResponse = `{
  "type": "result",
  "recommendation": {
    "name": "Prisma",
    "description": "Next-generation TypeScript ORM for PostgreSQL, MySQL, and SQLite",
    "category": "database",
    "language": "TypeScript",
    "license": "Apache-2.0",
    "health_tier": "healthy",
    "confidence": 0.94,
    "reasons": [
      "Strong TypeScript support with generated types",
      "Native PostgreSQL support with migrations",
      "Active community with 35k+ GitHub stars"
    ]
  },
  "alternatives": [
    {
      "name": "Drizzle ORM",
      "confidence": 0.87,
      "description": "Lightweight TypeScript ORM with SQL-like syntax"
    },
    {
      "name": "TypeORM",
      "confidence": 0.72,
      "description": "Mature ORM for TypeScript and JavaScript"
    }
  ]
}`;

const errorCodes = [
  {
    name: '400',
    type: 'Bad Request',
    required: false,
    description:
      'Invalid or empty query string. Ensure the query parameter is a non-empty string.',
  },
  {
    name: '500',
    type: 'Internal Error',
    required: false,
    description:
      'Pipeline processing error. An unexpected failure occurred in the search pipeline. Retry or contact support.',
  },
];

export default function SearchToolsPage() {
  const { prev, next } = getPrevNext(CURRENT_HREF);

  return (
    <div style={{ maxWidth: 768, margin: '0 auto' }}>
      <Breadcrumbs
        items={[
          { label: 'Docs', href: '/docs' },
          { label: 'MCP Tools', href: '/docs/mcp-tools' },
          { label: 'search_tools' },
        ]}
      />

      {/* ─── Header ─── */}
      <h1
        className="text-3xl font-bold tracking-tight sm:text-4xl"
        style={{ color: 'var(--color-text-primary)', marginTop: 24 }}
      >
        <code style={{ fontFamily: 'var(--font-mono, monospace)' }}>search_tools</code>
      </h1>
      <p
        className="mt-3 text-base leading-relaxed sm:text-lg"
        style={{ color: 'var(--color-text-secondary)' }}
      >
        The primary discovery tool. Accepts a natural-language query and returns tool
        recommendations through ToolPilot&rsquo;s multi-stage pipeline: BM25 + vector search →
        contextual filters → graph reranking → final selection.
      </p>

      {/* ─── When to Use ─── */}
      <section style={{ marginTop: 40 }}>
        <h2
          id="when-to-use"
          className="mb-3 text-xl font-semibold"
          style={{ color: 'var(--color-text-primary)' }}
        >
          When to use
        </h2>
        <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
          Call{' '}
          <code style={{ fontFamily: 'var(--font-mono, monospace)', color: 'var(--color-accent)' }}>
            search_tools
          </code>{' '}
          whenever an agent needs to find the right developer tool for a task. The pipeline may
          return results immediately or ask clarification questions first — depending on how specific
          the query is and whether context filters are provided.
        </p>
      </section>

      {/* ─── Input Schema ─── */}
      <section style={{ marginTop: 40 }}>
        <h2
          id="input-schema"
          className="mb-4 text-xl font-semibold"
          style={{ color: 'var(--color-text-primary)' }}
        >
          Input schema
        </h2>
        <ParamTable params={inputParams} />
      </section>

      {/* ─── Examples ─── */}
      <section style={{ marginTop: 40 }}>
        <h2
          id="examples"
          className="mb-4 text-xl font-semibold"
          style={{ color: 'var(--color-text-primary)' }}
        >
          Examples
        </h2>

        <h3
          id="basic-search"
          className="mb-3 text-base font-semibold"
          style={{ color: 'var(--color-text-primary)' }}
        >
          Basic search
        </h3>
        <CodeTabs
          tabs={[
            { label: 'JSON', language: 'json', code: basicExample },
            { label: 'Claude', language: 'text', code: claudeBasicExample },
            { label: 'Cursor', language: 'text', code: cursorBasicExample },
          ]}
        />

        <div style={{ marginTop: 24 }}>
          <h3
            id="search-with-context"
            className="mb-3 text-base font-semibold"
            style={{ color: 'var(--color-text-primary)' }}
          >
            Search with context
          </h3>
          <CodeTabs
            tabs={[
              { label: 'JSON', language: 'json', code: contextExample },
              { label: 'Claude', language: 'text', code: claudeContextExample },
              { label: 'Cursor', language: 'text', code: cursorContextExample },
            ]}
          />
        </div>

        <div style={{ marginTop: 24 }}>
          <h3
            id="full-context-filters"
            className="mb-3 text-base font-semibold"
            style={{ color: 'var(--color-text-primary)' }}
          >
            Full context filters
          </h3>
          <CodeBlock code={fullContextExample} language="json" />
        </div>

        <div style={{ marginTop: 16 }}>
          <Callout type="tip" title="Skip clarification">
            Providing a{' '}
            <code style={{ fontFamily: 'var(--font-mono, monospace)' }}>context</code> object lets
            the pipeline skip the clarification stage and return results directly. The more context
            you provide, the faster and more accurate the results.
          </Callout>
        </div>
      </section>

      {/* ─── Response Format ─── */}
      <section style={{ marginTop: 40 }}>
        <h2
          id="response-format"
          className="mb-4 text-xl font-semibold"
          style={{ color: 'var(--color-text-primary)' }}
        >
          Response format
        </h2>

        <p className="mb-4 text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
          The response{' '}
          <code style={{ fontFamily: 'var(--font-mono, monospace)', color: 'var(--color-accent)' }}>
            type
          </code>{' '}
          field determines the shape of the payload. There are two possible response types:
        </p>

        <h3
          id="clarification-response"
          className="mb-3 text-base font-semibold"
          style={{ color: 'var(--color-text-primary)' }}
        >
          Clarification needed
        </h3>
        <p className="mb-3 text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
          Returned when the query is ambiguous and the pipeline needs more information. Pass the{' '}
          <code style={{ fontFamily: 'var(--font-mono, monospace)', color: 'var(--color-accent)' }}>
            query_id
          </code>{' '}
          and your answers to{' '}
          <code style={{ fontFamily: 'var(--font-mono, monospace)', color: 'var(--color-accent)' }}>
            search_tools_respond
          </code>{' '}
          to complete the search.
        </p>
        <CodeBlock code={clarificationResponse} language="json" filename="Clarification response" />

        <div style={{ marginTop: 24 }}>
          <h3
            id="result-response"
            className="mb-3 text-base font-semibold"
            style={{ color: 'var(--color-text-primary)' }}
          >
            Results ready
          </h3>
          <p
            className="mb-3 text-sm leading-relaxed"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            Returned when the pipeline has enough information to produce results. Includes a primary
            recommendation and ranked alternatives.
          </p>
          <CodeBlock code={resultResponse} language="json" filename="Result response" />
        </div>
      </section>

      {/* ─── Error Codes ─── */}
      <section style={{ marginTop: 40 }}>
        <h2
          id="error-codes"
          className="mb-4 text-xl font-semibold"
          style={{ color: 'var(--color-text-primary)' }}
        >
          Error codes
        </h2>
        <ParamTable params={errorCodes} />
      </section>

      {/* ─── Related Tools ─── */}
      <section style={{ marginTop: 40 }}>
        <h2
          id="related-tools"
          className="mb-3 text-xl font-semibold"
          style={{ color: 'var(--color-text-primary)' }}
        >
          Related tools
        </h2>
        <ul className="flex flex-col gap-2 text-sm" style={{ margin: 0, paddingLeft: 20 }}>
          <li style={{ color: 'var(--color-text-secondary)' }}>
            <a href="/docs/mcp-tools/search-tools-respond" style={{ color: 'var(--color-accent)' }}>
              <code style={{ fontFamily: 'var(--font-mono, monospace)' }}>search_tools_respond</code>
            </a>{' '}
            — Answer clarification questions to complete a search
          </li>
          <li style={{ color: 'var(--color-text-secondary)' }}>
            <a href="/docs/mcp-tools/get-stack" style={{ color: 'var(--color-accent)' }}>
              <code style={{ fontFamily: 'var(--font-mono, monospace)' }}>get_stack</code>
            </a>{' '}
            — Build a compatible tool stack for a use case
          </li>
          <li style={{ color: 'var(--color-text-secondary)' }}>
            <a href="/docs/mcp-tools/report-outcome" style={{ color: 'var(--color-accent)' }}>
              <code style={{ fontFamily: 'var(--font-mono, monospace)' }}>report_outcome</code>
            </a>{' '}
            — Report usage feedback to improve future results
          </li>
        </ul>
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
