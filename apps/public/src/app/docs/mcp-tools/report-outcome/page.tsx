import type { Metadata } from 'next';
import { Breadcrumbs } from '@/components/docs/breadcrumbs';
import { Callout } from '@/components/docs/callout';
import { CodeBlock } from '@/components/docs/code-block';
import { CodeTabs } from '@/components/docs/code-tabs';
import { ParamTable } from '@/components/docs/param-table';
import { PrevNextNav } from '@/components/docs/prev-next-nav';
import { getPrevNext } from '@/lib/docs-navigation';

export const metadata: Metadata = {
  title: 'report_outcome — MCP Tools — ToolPilot Docs',
  description:
    'API reference for report_outcome — report tool usage outcomes to improve ToolPilot\u2019s recommendation graph.',
};

const CURRENT_HREF = '/docs/mcp-tools/report-outcome';

const inputParams = [
  {
    name: 'tool_name',
    type: 'string',
    required: true,
    description: 'Name of the tool that was used (e.g. "Prisma", "Qdrant", "Vitest").',
  },
  {
    name: 'outcome',
    type: '"success" | "failure" | "partial"',
    required: true,
    description:
      'The result of using the tool. "success" for full satisfaction, "failure" for complete failure, "partial" for mixed results.',
  },
  {
    name: 'details',
    type: 'string',
    required: false,
    description:
      'Additional context about the outcome — what worked, what failed, or any caveats. Helps refine future recommendations.',
  },
];

const successExample = `{
  "tool_name": "Prisma",
  "outcome": "success",
  "details": "Type-safe queries worked perfectly with PostgreSQL 16. Migrations ran without issues."
}`;

const failureExample = `{
  "tool_name": "TypeORM",
  "outcome": "failure",
  "details": "TypeORM decorators conflicted with SWC compilation in Next.js 15. Switched to Drizzle ORM."
}`;

const partialExample = `{
  "tool_name": "Docker",
  "outcome": "partial",
  "details": "Container builds work but hot-reload does not function on Windows with volume mounts."
}`;

const claudeExample = `Prisma worked great for my project — type-safe queries
and migrations ran without issues on PostgreSQL 16.
// Claude will call report_outcome with:
// {
//   "tool_name": "Prisma",
//   "outcome": "success",
//   "details": "Type-safe queries worked perfectly with PostgreSQL 16..."
// }`;

const cursorExample = `// In Cursor chat:
// "TypeORM didn't work with my Next.js 15 + SWC setup.
//  I switched to Drizzle ORM instead."
// Cursor calls report_outcome automatically`;

const successResponse = `{
  "status": "recorded",
  "tool_name": "Prisma",
  "outcome": "success",
  "graph_update": {
    "edge_weight_delta": +0.03,
    "new_confidence": 0.97,
    "affected_edges": 4
  },
  "message": "Outcome recorded. Prisma's recommendation confidence has been reinforced."
}`;

const failureResponse = `{
  "status": "recorded",
  "tool_name": "TypeORM",
  "outcome": "failure",
  "graph_update": {
    "edge_weight_delta": -0.05,
    "new_confidence": 0.67,
    "affected_edges": 3
  },
  "message": "Outcome recorded. TypeORM's recommendation confidence has been attenuated for this context."
}`;

const errorCodes = [
  {
    name: '400',
    type: 'Bad Request',
    required: false,
    description:
      'Invalid parameters. Ensure tool_name is non-empty and outcome is one of "success", "failure", or "partial".',
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
      'Graph update error. The outcome could not be recorded due to an internal failure.',
  },
];

export default function ReportOutcomePage() {
  const { prev, next } = getPrevNext(CURRENT_HREF);

  return (
    <div style={{ maxWidth: 768, margin: '0 auto' }}>
      <Breadcrumbs
        items={[
          { label: 'Docs', href: '/docs' },
          { label: 'MCP Tools', href: '/docs/mcp-tools' },
          { label: 'report_outcome' },
        ]}
      />

      {/* ─── Header ─── */}
      <h1
        className="text-3xl font-bold tracking-tight sm:text-4xl"
        style={{ color: 'var(--tp-text-primary)', marginTop: 24 }}
      >
        <code style={{ fontFamily: 'var(--font-mono, monospace)' }}>report_outcome</code>
      </h1>
      <p
        className="mt-3 text-base leading-relaxed sm:text-lg"
        style={{ color: 'var(--tp-text-secondary)' }}
      >
        Reports the outcome of using a recommended tool. Updates graph edge weights to improve
        future recommendations — successful outcomes reinforce recommendation confidence while
        failures attenuate it.
      </p>

      <div style={{ marginTop: 20 }}>
        <Callout type="important" title="This directly improves ToolPilot">
          Every outcome report updates the graph&rsquo;s edge weights in real time. Positive outcomes
          strengthen the connections between tools, contexts, and use cases. Negative outcomes
          weaken them. Over time, this feedback loop makes ToolPilot&rsquo;s recommendations
          significantly more accurate for the entire community.
        </Callout>
      </div>

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
            report_outcome
          </code>{' '}
          after using a tool that ToolPilot recommended. This is typically the final step in the
          discovery flow:{' '}
          <code style={{ fontFamily: 'var(--font-mono, monospace)', color: 'var(--tp-accent)' }}>
            search_tools
          </code>{' '}
          →{' '}
          <code style={{ fontFamily: 'var(--font-mono, monospace)', color: 'var(--tp-accent)' }}>
            report_outcome
          </code>
          . You can also report outcomes for tools found through{' '}
          <code style={{ fontFamily: 'var(--font-mono, monospace)', color: 'var(--tp-accent)' }}>
            get_stack
          </code>{' '}
          or{' '}
          <code style={{ fontFamily: 'var(--font-mono, monospace)', color: 'var(--tp-accent)' }}>
            check_issue
          </code>
          .
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
          id="success-report"
          className="mb-3 text-base font-semibold"
          style={{ color: 'var(--tp-text-primary)' }}
        >
          Reporting success
        </h3>
        <CodeTabs
          tabs={[
            { label: 'JSON', language: 'json', code: successExample },
            { label: 'Claude', language: 'text', code: claudeExample },
            { label: 'Cursor', language: 'text', code: cursorExample },
          ]}
        />

        <div style={{ marginTop: 24 }}>
          <h3
            id="failure-report"
            className="mb-3 text-base font-semibold"
            style={{ color: 'var(--tp-text-primary)' }}
          >
            Reporting failure
          </h3>
          <CodeBlock code={failureExample} language="json" />
        </div>

        <div style={{ marginTop: 24 }}>
          <h3
            id="partial-report"
            className="mb-3 text-base font-semibold"
            style={{ color: 'var(--tp-text-primary)' }}
          >
            Reporting partial success
          </h3>
          <CodeBlock code={partialExample} language="json" />
        </div>

        <div style={{ marginTop: 16 }}>
          <Callout type="tip" title="Include details">
            The{' '}
            <code style={{ fontFamily: 'var(--font-mono, monospace)' }}>details</code> field is
            optional but highly valuable. Specific details help ToolPilot understand <em>why</em> a
            tool succeeded or failed, enabling more nuanced future recommendations.
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
          Returns a confirmation with the graph update details, including the edge weight change and
          new confidence score.
        </p>

        <h3
          id="success-response"
          className="mb-3 text-base font-semibold"
          style={{ color: 'var(--tp-text-primary)' }}
        >
          Success outcome response
        </h3>
        <CodeBlock code={successResponse} language="json" filename="Success confirmation" />

        <div style={{ marginTop: 24 }}>
          <h3
            id="failure-response"
            className="mb-3 text-base font-semibold"
            style={{ color: 'var(--tp-text-primary)' }}
          >
            Failure outcome response
          </h3>
          <CodeBlock code={failureResponse} language="json" filename="Failure confirmation" />
        </div>

        <div style={{ marginTop: 16 }}>
          <Callout type="note" title="Edge weight updates">
            <strong>Success</strong> outcomes increase edge weights by a small positive delta.{' '}
            <strong>Failure</strong> outcomes decrease them by a larger negative delta (failures
            weigh more heavily). <strong>Partial</strong> outcomes have a neutral-to-slight-negative
            effect, depending on the details provided.
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
            — Start a new tool search
          </li>
          <li style={{ color: 'var(--tp-text-secondary)' }}>
            <a href="/docs/mcp-tools/check-issue" style={{ color: 'var(--tp-accent)' }}>
              <code style={{ fontFamily: 'var(--font-mono, monospace)' }}>check_issue</code>
            </a>{' '}
            — Diagnose issues before reporting a failure
          </li>
          <li style={{ color: 'var(--tp-text-secondary)' }}>
            <a href="/docs/concepts/feedback-loop" style={{ color: 'var(--tp-accent)' }}>
              Feedback Loop
            </a>{' '}
            — Learn how outcomes affect the recommendation graph
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
