import type { Metadata } from 'next';
import { Breadcrumbs } from '@/components/docs/breadcrumbs';
import { Callout } from '@/components/docs/callout';
import { CodeBlock } from '@/components/docs/code-block';
import { CodeTabs } from '@/components/docs/code-tabs';
import { ParamTable } from '@/components/docs/param-table';
import { PrevNextNav } from '@/components/docs/prev-next-nav';
import { getPrevNext } from '@/lib/docs-navigation';

export const metadata: Metadata = {
  title: 'get_stack — MCP Tools — ToolPilot Docs',
  description:
    'API reference for get_stack — build a compatible tool stack for a given use case using ToolPilot\u2019s graph relationships.',
};

const CURRENT_HREF = '/docs/mcp-tools/get-stack';

const inputParams = [
  {
    name: 'use_case',
    type: 'string',
    required: true,
    description:
      'Description of the tech stack need (e.g. "full-stack web app with auth and payments").',
  },
  {
    name: 'constraints',
    type: 'object',
    required: false,
    description: 'Optional constraints to narrow the stack selection.',
  },
  {
    name: 'constraints.language',
    type: 'string',
    required: false,
    description: 'Primary programming language (e.g. "TypeScript", "Python").',
  },
  {
    name: 'constraints.deployment',
    type: 'string',
    required: false,
    description: 'Deployment model (e.g. "serverless", "self-hosted", "cloud").',
  },
  {
    name: 'constraints.max_tools',
    type: 'number',
    required: false,
    description: 'Maximum number of tools to include in the stack.',
    default: '10',
  },
];

const basicExample = `{
  "use_case": "real-time chat application"
}`;

const constrainedExample = `{
  "use_case": "full-stack web app with auth and payments",
  "constraints": {
    "language": "TypeScript",
    "deployment": "serverless",
    "max_tools": 6
  }
}`;

const minimalExample = `{
  "use_case": "data pipeline for ETL workflows",
  "constraints": {
    "language": "Python"
  }
}`;

const claudeExample = `I need to build a real-time chat application.
What tools should I use?
// Claude will call get_stack with:
// { "use_case": "real-time chat application" }`;

const cursorExample = `// In Cursor chat:
// "Build me a tool stack for a TypeScript serverless app
//  with auth and payments"
// Cursor calls get_stack automatically`;

const resultResponse = `{
  "use_case": "full-stack web app with auth and payments",
  "stack": [
    {
      "name": "Next.js",
      "role": "framework",
      "description": "Full-stack React framework with API routes",
      "confidence": 0.96,
      "compatibility_scores": {
        "Prisma": 0.94,
        "Stripe": 0.91,
        "NextAuth.js": 0.97
      }
    },
    {
      "name": "Prisma",
      "role": "database",
      "description": "Type-safe ORM for TypeScript",
      "confidence": 0.93,
      "compatibility_scores": {
        "Next.js": 0.94,
        "NextAuth.js": 0.92
      }
    },
    {
      "name": "NextAuth.js",
      "role": "authentication",
      "description": "Authentication library for Next.js",
      "confidence": 0.95,
      "compatibility_scores": {
        "Next.js": 0.97,
        "Prisma": 0.92
      }
    },
    {
      "name": "Stripe",
      "role": "payments",
      "description": "Payment processing platform with TypeScript SDK",
      "confidence": 0.90,
      "compatibility_scores": {
        "Next.js": 0.91
      }
    }
  ],
  "overall_compatibility": 0.93,
  "notes": [
    "All tools have strong TypeScript support",
    "Next.js + Prisma + NextAuth.js is a proven stack combination",
    "Stripe integrates well with Next.js API routes"
  ]
}`;

const errorCodes = [
  {
    name: '400',
    type: 'Bad Request',
    required: false,
    description:
      'Invalid or empty use_case string. Ensure the use_case parameter is a non-empty string.',
  },
  {
    name: '500',
    type: 'Internal Error',
    required: false,
    description:
      'Graph query error. An unexpected failure occurred while building the stack from graph relationships.',
  },
];

export default function GetStackPage() {
  const { prev, next } = getPrevNext(CURRENT_HREF);

  return (
    <div style={{ maxWidth: 768, margin: '0 auto' }}>
      <Breadcrumbs
        items={[
          { label: 'Docs', href: '/docs' },
          { label: 'MCP Tools', href: '/docs/mcp-tools' },
          { label: 'get_stack' },
        ]}
      />

      {/* ─── Header ─── */}
      <h1
        className="text-3xl font-bold tracking-tight sm:text-4xl"
        style={{ color: 'var(--tp-text-primary)', marginTop: 24 }}
      >
        <code style={{ fontFamily: 'var(--font-mono, monospace)' }}>get_stack</code>
      </h1>
      <p
        className="mt-3 text-base leading-relaxed sm:text-lg"
        style={{ color: 'var(--tp-text-secondary)' }}
      >
        Builds a compatible tool stack for a given use case. Selects tools from the graph based on
        relationship strength and compatibility scores, ensuring every tool in the stack works well
        together.
      </p>

      {/* ─── When to Use ─── */}
      <section style={{ marginTop: 40 }}>
        <h2
          id="when-to-use"
          className="mb-3 text-xl font-semibold"
          style={{ color: 'var(--tp-text-primary)' }}
        >
          When to use
        </h2>
        <p className="text-sm leading-relaxed" style={{ color: 'var(--tp-text-secondary)' }}>
          Call{' '}
          <code style={{ fontFamily: 'var(--font-mono, monospace)', color: 'var(--tp-accent)' }}>
            get_stack
          </code>{' '}
          when you need a complete set of tools for a project rather than a single recommendation.
          Unlike{' '}
          <code style={{ fontFamily: 'var(--font-mono, monospace)', color: 'var(--tp-accent)' }}>
            search_tools
          </code>
          , this tool focuses on inter-tool compatibility and returns multiple tools that are known
          to work well together.
        </p>
      </section>

      {/* ─── Input Schema ─── */}
      <section style={{ marginTop: 40 }}>
        <h2
          id="input-schema"
          className="mb-4 text-xl font-semibold"
          style={{ color: 'var(--tp-text-primary)' }}
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
          style={{ color: 'var(--tp-text-primary)' }}
        >
          Examples
        </h2>

        <h3
          id="basic-stack"
          className="mb-3 text-base font-semibold"
          style={{ color: 'var(--tp-text-primary)' }}
        >
          Basic stack request
        </h3>
        <CodeTabs
          tabs={[
            { label: 'JSON', language: 'json', code: basicExample },
            { label: 'Claude', language: 'text', code: claudeExample },
            { label: 'Cursor', language: 'text', code: cursorExample },
          ]}
        />

        <div style={{ marginTop: 24 }}>
          <h3
            id="constrained-stack"
            className="mb-3 text-base font-semibold"
            style={{ color: 'var(--tp-text-primary)' }}
          >
            Stack with constraints
          </h3>
          <CodeBlock code={constrainedExample} language="json" />
        </div>

        <div style={{ marginTop: 24 }}>
          <h3
            id="language-only-constraint"
            className="mb-3 text-base font-semibold"
            style={{ color: 'var(--tp-text-primary)' }}
          >
            Language-only constraint
          </h3>
          <CodeBlock code={minimalExample} language="json" />
        </div>

        <div style={{ marginTop: 16 }}>
          <Callout type="tip" title="Compatibility scores">
            Each tool in the stack includes{' '}
            <code style={{ fontFamily: 'var(--font-mono, monospace)' }}>compatibility_scores</code>{' '}
            showing how well it pairs with other tools in the stack. These scores are derived from
            graph edge weights and community usage patterns.
          </Callout>
        </div>
      </section>

      {/* ─── Response Format ─── */}
      <section style={{ marginTop: 40 }}>
        <h2
          id="response-format"
          className="mb-4 text-xl font-semibold"
          style={{ color: 'var(--tp-text-primary)' }}
        >
          Response format
        </h2>

        <p className="mb-4 text-sm leading-relaxed" style={{ color: 'var(--tp-text-secondary)' }}>
          Returns an array of compatible tools with their roles, confidence scores, and pairwise
          compatibility scores. An{' '}
          <code style={{ fontFamily: 'var(--font-mono, monospace)', color: 'var(--tp-accent)' }}>
            overall_compatibility
          </code>{' '}
          score indicates how well the entire stack works together.
        </p>

        <CodeBlock code={resultResponse} language="json" filename="Stack response" />
      </section>

      {/* ─── Error Codes ─── */}
      <section style={{ marginTop: 40 }}>
        <h2
          id="error-codes"
          className="mb-4 text-xl font-semibold"
          style={{ color: 'var(--tp-text-primary)' }}
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
          style={{ color: 'var(--tp-text-primary)' }}
        >
          Related tools
        </h2>
        <ul className="flex flex-col gap-2 text-sm" style={{ margin: 0, paddingLeft: 20 }}>
          <li style={{ color: 'var(--tp-text-secondary)' }}>
            <a href="/docs/mcp-tools/search-tools" style={{ color: 'var(--tp-accent)' }}>
              <code style={{ fontFamily: 'var(--font-mono, monospace)' }}>search_tools</code>
            </a>{' '}
            — Find a single tool for a specific need
          </li>
          <li style={{ color: 'var(--tp-text-secondary)' }}>
            <a href="/docs/mcp-tools/check-issue" style={{ color: 'var(--tp-accent)' }}>
              <code style={{ fontFamily: 'var(--font-mono, monospace)' }}>check_issue</code>
            </a>{' '}
            — Diagnose issues with any tool in your stack
          </li>
          <li style={{ color: 'var(--tp-text-secondary)' }}>
            <a href="/docs/mcp-tools/report-outcome" style={{ color: 'var(--tp-accent)' }}>
              <code style={{ fontFamily: 'var(--font-mono, monospace)' }}>report_outcome</code>
            </a>{' '}
            — Report usage feedback for stack tools
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
