import type { Metadata } from 'next';
import { Breadcrumbs } from '@/components/docs/breadcrumbs';
import { Callout } from '@/components/docs/callout';
import { CodeBlock } from '@/components/docs/code-block';
import { CodeTabs } from '@/components/docs/code-tabs';
import { ParamTable } from '@/components/docs/param-table';
import { PrevNextNav } from '@/components/docs/prev-next-nav';
import { getPrevNext } from '@/lib/docs-navigation';

export const metadata: Metadata = {
  title: 'search_tools_respond — MCP Tools — ToolPilot Docs',
  description:
    'API reference for search_tools_respond — answer clarification questions to complete a ToolPilot search.',
};

const CURRENT_HREF = '/docs/mcp-tools/search-tools-respond';

const inputParams = [
  {
    name: 'query_id',
    type: 'string',
    required: true,
    description:
      'The unique query identifier returned in the clarification response from search_tools.',
  },
  {
    name: 'answers',
    type: 'Record<string, string>',
    required: true,
    description:
      'Key-value map answering the clarification questions. Keys must match the "key" field from each question.',
  },
];

const jsonExample = `{
  "query_id": "q_abc123def456",
  "answers": {
    "language": "Python",
    "deployment": "cloud"
  }
}`;

const claudeExample = `// After search_tools returns clarification questions,
// Claude automatically calls search_tools_respond:
// {
//   "query_id": "q_abc123def456",
//   "answers": {
//     "language": "Python",
//     "deployment": "cloud"
//   }
// }`;

const cursorExample = `// Cursor handles the clarification flow automatically.
// When search_tools asks for clarification, Cursor
// prompts the user and calls search_tools_respond
// with the collected answers.`;

const resultResponse = `{
  "type": "result",
  "recommendation": {
    "name": "Pinecone",
    "description": "Managed vector database for ML embeddings at scale",
    "category": "database",
    "language": "Python",
    "license": "proprietary",
    "health_tier": "healthy",
    "confidence": 0.91,
    "reasons": [
      "Cloud-native managed service — no infrastructure to manage",
      "First-class Python SDK with async support",
      "Optimized for high-dimensional embedding vectors"
    ]
  },
  "alternatives": [
    {
      "name": "Weaviate",
      "confidence": 0.85,
      "description": "Open-source vector database with built-in vectorization"
    },
    {
      "name": "Qdrant",
      "confidence": 0.82,
      "description": "High-performance vector similarity search engine"
    }
  ]
}`;

const errorCodes = [
  {
    name: '400',
    type: 'Bad Request',
    required: false,
    description:
      'Invalid query_id or malformed answers object. Ensure the query_id matches a prior clarification response.',
  },
  {
    name: '404',
    type: 'Not Found',
    required: false,
    description:
      'The query_id has expired or does not exist. Start a new search with search_tools.',
  },
  {
    name: '500',
    type: 'Internal Error',
    required: false,
    description:
      'Pipeline processing error. An unexpected failure occurred while completing the search.',
  },
];

export default function SearchToolsRespondPage() {
  const { prev, next } = getPrevNext(CURRENT_HREF);

  return (
    <div style={{ maxWidth: 768, margin: '0 auto' }}>
      <Breadcrumbs
        items={[
          { label: 'Docs', href: '/docs' },
          { label: 'MCP Tools', href: '/docs/mcp-tools' },
          { label: 'search_tools_respond' },
        ]}
      />

      {/* ─── Header ─── */}
      <h1
        className="text-3xl font-bold tracking-tight sm:text-4xl"
        style={{ color: 'var(--color-text-primary)', marginTop: 24 }}
      >
        <code style={{ fontFamily: 'var(--font-mono, monospace)' }}>search_tools_respond</code>
      </h1>
      <p
        className="mt-3 text-base leading-relaxed sm:text-lg"
        style={{ color: 'var(--color-text-secondary)' }}
      >
        Answers clarification questions returned by{' '}
        <code style={{ fontFamily: 'var(--font-mono, monospace)', color: 'var(--color-accent)' }}>
          search_tools
        </code>{' '}
        to complete a search. Runs stages 2–4 of the pipeline (contextual filters → graph
        reranking → final selection) using the provided answers as additional context.
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
            search_tools_respond
          </code>{' '}
          only after{' '}
          <code style={{ fontFamily: 'var(--font-mono, monospace)', color: 'var(--color-accent)' }}>
            search_tools
          </code>{' '}
          has returned a response with{' '}
          <code style={{ fontFamily: 'var(--font-mono, monospace)', color: 'var(--color-accent)' }}>
            {'"type": "clarification"'}
          </code>
          . This tool is never called on its own — it always follows a prior search.
        </p>

        <div style={{ marginTop: 16 }}>
          <Callout type="warning" title="Prerequisite">
            This tool must be called after{' '}
            <code style={{ fontFamily: 'var(--font-mono, monospace)' }}>search_tools</code> returns
            a clarification response. Calling it without a valid{' '}
            <code style={{ fontFamily: 'var(--font-mono, monospace)' }}>query_id</code> from a prior
            search will return a 404 error.
          </Callout>
        </div>
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
          id="answering-clarification"
          className="mb-3 text-base font-semibold"
          style={{ color: 'var(--color-text-primary)' }}
        >
          Answering clarification questions
        </h3>
        <CodeTabs
          tabs={[
            { label: 'JSON', language: 'json', code: jsonExample },
            { label: 'Claude', language: 'text', code: claudeExample },
            { label: 'Cursor', language: 'text', code: cursorExample },
          ]}
        />
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
          This tool always returns a{' '}
          <code style={{ fontFamily: 'var(--font-mono, monospace)', color: 'var(--color-accent)' }}>
            result
          </code>{' '}
          response — no further clarification is requested. The response structure is identical to
          the result format from{' '}
          <code style={{ fontFamily: 'var(--font-mono, monospace)', color: 'var(--color-accent)' }}>
            search_tools
          </code>
          .
        </p>

        <CodeBlock code={resultResponse} language="json" filename="Result response" />

        <div style={{ marginTop: 16 }}>
          <Callout type="note" title="No further clarification">
            Unlike{' '}
            <code style={{ fontFamily: 'var(--font-mono, monospace)' }}>search_tools</code>, this
            tool never returns a clarification response. It always produces final results, even if
            some answer keys are missing.
          </Callout>
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
            <a href="/docs/mcp-tools/search-tools" style={{ color: 'var(--color-accent)' }}>
              <code style={{ fontFamily: 'var(--font-mono, monospace)' }}>search_tools</code>
            </a>{' '}
            — Start a new tool search (prerequisite for this tool)
          </li>
          <li style={{ color: 'var(--color-text-secondary)' }}>
            <a href="/docs/mcp-tools/report-outcome" style={{ color: 'var(--color-accent)' }}>
              <code style={{ fontFamily: 'var(--font-mono, monospace)' }}>report_outcome</code>
            </a>{' '}
            — Report usage feedback after using a recommended tool
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
