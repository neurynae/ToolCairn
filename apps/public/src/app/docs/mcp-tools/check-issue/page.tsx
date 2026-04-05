import type { Metadata } from 'next';
import { Breadcrumbs } from '@/components/docs/breadcrumbs';
import { Callout } from '@/components/docs/callout';
import { CodeBlock } from '@/components/docs/code-block';
import { CodeTabs } from '@/components/docs/code-tabs';
import { ParamTable } from '@/components/docs/param-table';
import { PrevNextNav } from '@/components/docs/prev-next-nav';
import { getPrevNext } from '@/lib/docs-navigation';

export const metadata: Metadata = {
  title: 'check_issue — MCP Tools — ToolPilot Docs',
  description:
    'API reference for check_issue — diagnose known issues with a developer tool using ToolPilot\u2019s graph data.',
};

const CURRENT_HREF = '/docs/mcp-tools/check-issue';

const inputParams = [
  {
    name: 'tool_name',
    type: 'string',
    required: true,
    description:
      'Name of the tool to diagnose (e.g. "Prisma", "Next.js", "Docker").',
  },
  {
    name: 'issue_description',
    type: 'string',
    required: true,
    description:
      'Description of the problem you are experiencing. Be as specific as possible for better matches.',
  },
];

const basicExample = `{
  "tool_name": "Prisma",
  "issue_description": "Migrations fail with P3009 error on PostgreSQL 16"
}`;

const detailedExample = `{
  "tool_name": "Next.js",
  "issue_description": "Dynamic routes return 404 in production build but work in dev mode"
}`;

const runtimeExample = `{
  "tool_name": "Docker",
  "issue_description": "Container exits immediately with code 137 when running Node.js app"
}`;

const claudeExample = `My Prisma migrations are failing with a P3009 error
on PostgreSQL 16. Can you help diagnose this?
// Claude will call check_issue with:
// {
//   "tool_name": "Prisma",
//   "issue_description": "Migrations fail with P3009 error on PostgreSQL 16"
// }`;

const cursorExample = `// In Cursor chat:
// "My Next.js dynamic routes return 404 in production
//  but work fine in dev mode"
// Cursor calls check_issue automatically`;

const resultResponse = `{
  "tool_name": "Prisma",
  "matched_issues": [
    {
      "title": "P3009: Migration failed — shadow database error",
      "confidence": 0.92,
      "description": "The P3009 error occurs when Prisma cannot create or access the shadow database used for migration diffing.",
      "solutions": [
        "Grant CREATE DATABASE permissions to the Prisma database user",
        "Set the shadowDatabaseUrl in your Prisma schema to a dedicated shadow database",
        "Use \\"prisma migrate diff\\" + \\"prisma db execute\\" as a workaround for environments where shadow databases are not supported"
      ],
      "affected_versions": ["4.x", "5.x"],
      "related_tools": ["PostgreSQL", "Supabase", "PlanetScale"]
    },
    {
      "title": "PostgreSQL 16 compatibility issues with Prisma migrations",
      "confidence": 0.78,
      "description": "PostgreSQL 16 changed default permissions for the public schema, which can affect Prisma migrations.",
      "solutions": [
        "Run: GRANT ALL ON SCHEMA public TO your_db_user",
        "Upgrade to Prisma 5.7+ which includes PostgreSQL 16 fixes"
      ],
      "affected_versions": ["5.0–5.6"],
      "related_tools": ["PostgreSQL"]
    }
  ],
  "total_matches": 2
}`;

const errorCodes = [
  {
    name: '400',
    type: 'Bad Request',
    required: false,
    description:
      'Invalid or empty tool_name or issue_description. Both parameters must be non-empty strings.',
  },
  {
    name: '404',
    type: 'Not Found',
    required: false,
    description:
      'The specified tool was not found in the graph. Check the tool name spelling.',
  },
  {
    name: '500',
    type: 'Internal Error',
    required: false,
    description:
      'Graph query error. An unexpected failure occurred while searching for known issues.',
  },
];

export default function CheckIssuePage() {
  const { prev, next } = getPrevNext(CURRENT_HREF);

  return (
    <div style={{ maxWidth: 768, margin: '0 auto' }}>
      <Breadcrumbs
        items={[
          { label: 'Docs', href: '/docs' },
          { label: 'MCP Tools', href: '/docs/mcp-tools' },
          { label: 'check_issue' },
        ]}
      />

      {/* ─── Header ─── */}
      <h1
        className="text-3xl font-bold tracking-tight sm:text-4xl"
        style={{ color: 'var(--tp-text-primary)', marginTop: 24 }}
      >
        <code style={{ fontFamily: 'var(--font-mono, monospace)' }}>check_issue</code>
      </h1>
      <p
        className="mt-3 text-base leading-relaxed sm:text-lg"
        style={{ color: 'var(--tp-text-secondary)' }}
      >
        Diagnoses known issues with a specific developer tool. Searches the graph for matched
        issues and returns solutions with confidence scores and related tools.
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
            check_issue
          </code>{' '}
          when you encounter a problem with a specific tool and want to see if it is a known issue
          with documented solutions. This tool is independent of the search flow and can be called at
          any time.
        </p>

        <div style={{ marginTop: 16 }}>
          <Callout type="tip" title="Be specific">
            Include error codes, version numbers, and specific symptoms in your{' '}
            <code style={{ fontFamily: 'var(--font-mono, monospace)' }}>issue_description</code> for
            higher-confidence matches. Vague descriptions like {'"not working"'} will return lower
            confidence results.
          </Callout>
        </div>
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
          id="database-error"
          className="mb-3 text-base font-semibold"
          style={{ color: 'var(--tp-text-primary)' }}
        >
          Database error diagnosis
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
            id="build-issue"
            className="mb-3 text-base font-semibold"
            style={{ color: 'var(--tp-text-primary)' }}
          >
            Build/deployment issue
          </h3>
          <CodeBlock code={detailedExample} language="json" />
        </div>

        <div style={{ marginTop: 24 }}>
          <h3
            id="runtime-issue"
            className="mb-3 text-base font-semibold"
            style={{ color: 'var(--tp-text-primary)' }}
          >
            Runtime issue
          </h3>
          <CodeBlock code={runtimeExample} language="json" />
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
          Returns an array of matched issues, each with a confidence score, description, solutions,
          affected versions, and related tools. Issues are ranked by confidence (highest first).
        </p>

        <CodeBlock code={resultResponse} language="json" filename="Issue diagnosis response" />

        <div style={{ marginTop: 16 }}>
          <Callout type="note" title="Confidence scores">
            Scores above <strong>0.85</strong> indicate a strong match. Scores between{' '}
            <strong>0.60–0.85</strong> are partial matches that may still be relevant. Scores below{' '}
            <strong>0.60</strong> are typically only returned when no better matches exist.
          </Callout>
        </div>
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
            — Find alternative tools if the issue is unresolvable
          </li>
          <li style={{ color: 'var(--tp-text-secondary)' }}>
            <a href="/docs/mcp-tools/get-stack" style={{ color: 'var(--tp-accent)' }}>
              <code style={{ fontFamily: 'var(--font-mono, monospace)' }}>get_stack</code>
            </a>{' '}
            — Build a new stack if you need to replace a problematic tool
          </li>
          <li style={{ color: 'var(--tp-text-secondary)' }}>
            <a href="/docs/mcp-tools/report-outcome" style={{ color: 'var(--tp-accent)' }}>
              <code style={{ fontFamily: 'var(--font-mono, monospace)' }}>report_outcome</code>
            </a>{' '}
            — Report the issue outcome to improve the knowledge base
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
