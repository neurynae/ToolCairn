import type { Metadata } from 'next';
import { Breadcrumbs } from '@/components/docs/breadcrumbs';
import { CodeBlock } from '@/components/docs/code-block';
import { Callout } from '@/components/docs/callout';
import { PrevNextNav } from '@/components/docs/prev-next-nav';
import { getPrevNext } from '@/lib/docs-navigation';

export const metadata: Metadata = {
  title: 'Issue Diagnosis Guide — ToolPilot Docs',
  description:
    'Use check_issue to debug tool problems, interpret confidence scores, and discover alternatives.',
};

export default function IssueDiagnosisPage() {
  const { prev, next } = getPrevNext('/docs/guides/issue-diagnosis');

  return (
    <div style={{ maxWidth: 768, margin: '0 auto' }}>
      <Breadcrumbs
        items={[
          { label: 'Docs', href: '/docs' },
          { label: 'Guides', href: '/docs/guides' },
          { label: 'Issue Diagnosis' },
        ]}
      />

      {/* ─── Header ─── */}
      <header style={{ marginTop: 24, marginBottom: 40 }}>
        <div className="flex items-center gap-3">
          <span
            className="rounded-full px-2.5 py-0.5 text-xs font-semibold"
            style={{
              color: '#6366f1',
              background: 'rgba(99,102,241,0.10)',
              border: '1px solid rgba(99,102,241,0.20)',
            }}
          >
            Intermediate
          </span>
          <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
            ~8 min read
          </span>
        </div>
        <h1
          className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl"
          style={{ color: 'var(--color-text-primary)', lineHeight: 1.2 }}
        >
          Issue Diagnosis Guide
        </h1>
        <p
          className="mt-3 text-base sm:text-lg"
          style={{ color: 'var(--color-text-secondary)', lineHeight: 1.6 }}
        >
          Already using a tool and running into trouble? ToolPilot&rsquo;s{' '}
          <code style={{ color: 'var(--color-accent)' }}>check_issue</code> can
          diagnose the problem and point you toward a fix — or a better alternative.
        </p>
      </header>

      {/* ─── What You'll Learn ─── */}
      <section style={{ marginBottom: 40 }}>
        <div
          className="rounded-xl p-5"
          style={{
            background: 'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(129,140,248,0.04))',
            border: '1px solid rgba(99,102,241,0.18)',
            borderRadius: 'var(--radius-lg)',
          }}
        >
          <h2
            id="what-youll-learn"
            className="mb-3 text-sm font-bold uppercase tracking-wider"
            style={{ color: 'var(--color-accent)' }}
          >
            What you&rsquo;ll learn
          </h2>
          <ul
            className="space-y-1.5 text-sm"
            style={{ color: 'var(--color-text-secondary)', margin: 0, paddingLeft: 20 }}
          >
            <li>When to use <code>check_issue</code> vs. a regular search</li>
            <li>How to describe issues for the best diagnostic results</li>
            <li>How to interpret confidence scores and matched issues</li>
            <li>When to fix the problem vs. switch to an alternative tool</li>
          </ul>
        </div>
      </section>

      {/* ─── When to use ─── */}
      <section style={{ marginBottom: 40 }}>
        <h2
          id="when-to-use-check-issue"
          className="mb-2 text-xl font-bold"
          style={{ color: 'var(--color-text-primary)' }}
        >
          When to use check_issue
        </h2>
        <p
          className="mb-4 text-sm leading-relaxed"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          Use <code>check_issue</code> when you&rsquo;re <em>already committed</em> to a
          tool and hitting a specific problem. This isn&rsquo;t for tool discovery — it&rsquo;s
          for troubleshooting. Typical scenarios:
        </p>
        <ul
          className="mb-4 space-y-2 text-sm leading-relaxed"
          style={{ color: 'var(--color-text-secondary)', paddingLeft: 20 }}
        >
          <li>Unexpected errors or degraded performance in production</li>
          <li>Configuration problems you can&rsquo;t resolve from docs alone</li>
          <li>Compatibility issues when combining tools</li>
          <li>Hitting known limitations you weren&rsquo;t aware of</li>
        </ul>
      </section>

      {/* ─── Step 1 ─── */}
      <section style={{ marginBottom: 40 }}>
        <h2
          id="step-1-describe-the-issue"
          className="mb-2 text-xl font-bold"
          style={{ color: 'var(--color-text-primary)' }}
        >
          Step 1: Describe the issue
        </h2>
        <p
          className="mb-4 text-sm leading-relaxed"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          Call <code style={{ color: 'var(--color-accent)' }}>check_issue</code> with the
          tool name and a clear description of what&rsquo;s going wrong. The more detail
          you provide, the better the diagnosis.
        </p>
        <CodeBlock
          language="json"
          code={`{
  "tool_name": "prisma",
  "issue_description": "Getting timeout errors on complex joins with PostgreSQL"
}`}
        />
        <div style={{ marginTop: 16 }}>
          <Callout type="tip" title="Be specific in your issue description">
            Include error messages, versions, and context. &ldquo;Prisma is slow&rdquo;
            gives ToolPilot little to work with.{' '}
            &ldquo;Prisma 5.x throws timeout errors on queries with 3+ nested includes
            against PostgreSQL 16&rdquo; gives it everything it needs.
          </Callout>
        </div>
      </section>

      {/* ─── Step 2 ─── */}
      <section style={{ marginBottom: 40 }}>
        <h2
          id="step-2-interpret-the-response"
          className="mb-2 text-xl font-bold"
          style={{ color: 'var(--color-text-primary)' }}
        >
          Step 2: Interpret the response
        </h2>
        <p
          className="mb-4 text-sm leading-relaxed"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          ToolPilot matches your issue description against known problems in the graph
          and returns diagnostic results with confidence scores. Here&rsquo;s what a
          typical response looks like:
        </p>
        <CodeBlock
          language="json"
          code={`{
  "tool": "prisma",
  "matched_issues": [
    {
      "title": "Connection pool exhaustion on complex queries",
      "confidence": 0.89,
      "description": "Deeply nested includes generate multiple sequential queries that hold connections open, exhausting the default pool size of 5.",
      "solutions": [
        "Increase connection pool size: set \`connection_limit\` in the datasource URL to 20+",
        "Use \`relationLoadStrategy: 'join'\` (Prisma 5.8+) to reduce query count",
        "Break deeply nested includes into separate queries with explicit selects"
      ]
    },
    {
      "title": "Missing database indexes on join columns",
      "confidence": 0.62,
      "description": "Complex joins without proper indexes cause full table scans, leading to timeouts under load.",
      "solutions": [
        "Add composite indexes via @@index in your Prisma schema",
        "Run \`EXPLAIN ANALYZE\` to identify missing indexes"
      ]
    }
  ],
  "alternatives": [
    {
      "name": "drizzle",
      "reason": "Generates optimized SQL with explicit joins — avoids the N+1 pattern that causes Prisma timeouts",
      "health_tier": "healthy"
    }
  ]
}`}
        />
        <h3
          id="reading-confidence-scores"
          className="mt-6 mb-2 text-base font-semibold"
          style={{ color: 'var(--color-text-primary)' }}
        >
          Reading confidence scores
        </h3>
        <ul
          className="space-y-2 text-sm leading-relaxed"
          style={{ color: 'var(--color-text-secondary)', paddingLeft: 20 }}
        >
          <li>
            <strong style={{ color: 'var(--color-text-primary)' }}>0.80 – 1.0</strong>{' '}
            — High confidence. The issue is well-documented and the solutions are proven.
            Start here.
          </li>
          <li>
            <strong style={{ color: 'var(--color-text-primary)' }}>0.50 – 0.79</strong>{' '}
            — Moderate confidence. The issue is a likely match but may not be exact.
            Worth investigating.
          </li>
          <li>
            <strong style={{ color: 'var(--color-text-primary)' }}>Below 0.50</strong>{' '}
            — Low confidence. This is a loose match — useful as a starting point but
            verify against your specific setup.
          </li>
        </ul>
      </section>

      {/* ─── Step 3 ─── */}
      <section style={{ marginBottom: 40 }}>
        <h2
          id="step-3-try-the-solutions"
          className="mb-2 text-xl font-bold"
          style={{ color: 'var(--color-text-primary)' }}
        >
          Step 3: Try the suggested solutions
        </h2>
        <p
          className="mb-4 text-sm leading-relaxed"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          Work through the solutions in order of the confidence score. In our Prisma
          example, the highest-confidence fix is to increase the connection pool size:
        </p>
        <CodeBlock
          language="prisma"
          filename="schema.prisma"
          code={`datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  // Increase pool size from default 5 to handle complex queries
  relationMode = "prisma"
}

// Also consider adding: ?connection_limit=20&pool_timeout=30
// to your DATABASE_URL environment variable`}
        />
        <p
          className="mt-4 text-sm leading-relaxed"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          If the first solution resolves the issue, great — remember to{' '}
          <code>report_outcome</code> so ToolPilot knows this fix worked. If it
          doesn&rsquo;t, move to the next suggested solution.
        </p>
      </section>

      {/* ─── Step 4 ─── */}
      <section style={{ marginBottom: 40 }}>
        <h2
          id="step-4-consider-alternatives"
          className="mb-2 text-xl font-bold"
          style={{ color: 'var(--color-text-primary)' }}
        >
          Step 4: Consider alternatives when needed
        </h2>
        <p
          className="mb-4 text-sm leading-relaxed"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          Sometimes the issue isn&rsquo;t a bug — it&rsquo;s a fundamental limitation. If
          your Prisma queries are inherently complex and you&rsquo;re spending more time
          working around the ORM than writing SQL, the alternatives section becomes
          especially relevant.
        </p>
        <p
          className="mb-4 text-sm leading-relaxed"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          In our example, ToolPilot suggests <strong>Drizzle</strong> as an alternative
          because it generates explicit joins rather than sequential queries — addressing
          the root cause rather than patching the symptom.
        </p>
        <Callout type="note" title="Switching isn't always the answer">
          Alternatives are suggestions, not mandates. Consider migration cost, team
          familiarity, and the severity of the issue. A configuration fix is almost always
          cheaper than a tool swap.
        </Callout>
      </section>

      {/* ─── Example Walkthrough ─── */}
      <section style={{ marginBottom: 40 }}>
        <h2
          id="full-example"
          className="mb-2 text-xl font-bold"
          style={{ color: 'var(--color-text-primary)' }}
        >
          Full example: Prisma timeout diagnosis
        </h2>
        <p
          className="mb-4 text-sm leading-relaxed"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          Let&rsquo;s put it all together. You&rsquo;re building an analytics dashboard
          and your Prisma queries with nested includes are timing out under load.
        </p>
        <ol
          className="space-y-4 text-sm leading-relaxed"
          style={{ color: 'var(--color-text-secondary)', paddingLeft: 20 }}
        >
          <li>
            <strong style={{ color: 'var(--color-text-primary)' }}>Diagnose</strong> —
            Call <code>check_issue</code> with the tool name and error details.
          </li>
          <li>
            <strong style={{ color: 'var(--color-text-primary)' }}>Read results</strong>{' '}
            — The top match (89% confidence) identifies connection pool exhaustion.
          </li>
          <li>
            <strong style={{ color: 'var(--color-text-primary)' }}>Apply fix</strong> —
            Bump <code>connection_limit</code> to 20 and add{' '}
            <code>relationLoadStrategy: &apos;join&apos;</code>.
          </li>
          <li>
            <strong style={{ color: 'var(--color-text-primary)' }}>Verify</strong> —
            Timeouts stop. Query performance is acceptable.
          </li>
          <li>
            <strong style={{ color: 'var(--color-text-primary)' }}>Report</strong> — Call{' '}
            <code>report_outcome</code> with <code>&quot;outcome&quot;: &quot;success&quot;</code>{' '}
            so the graph records this solution as effective.
          </li>
        </ol>
        <p
          className="mt-4 text-sm leading-relaxed"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          If the fix hadn&rsquo;t worked, you&rsquo;d report{' '}
          <code>&quot;outcome&quot;: &quot;failure&quot;</code> and evaluate the Drizzle alternative —
          especially if the root cause is Prisma&rsquo;s query generation pattern rather
          than a configuration gap.
        </p>
      </section>

      {/* ─── Recap ─── */}
      <section style={{ marginBottom: 8 }}>
        <h2
          id="recap"
          className="mb-3 text-xl font-bold"
          style={{ color: 'var(--color-text-primary)' }}
        >
          Recap
        </h2>
        <p
          className="text-sm leading-relaxed"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          The diagnosis flow is: <code>check_issue</code> → read matched issues and
          confidence scores → apply solutions in order → consider alternatives if the
          problem is fundamental → <code>report_outcome</code>. Detailed issue
          descriptions dramatically improve diagnostic accuracy.
        </p>
      </section>

      <PrevNextNav prev={prev} next={next} />
    </div>
  );
}
