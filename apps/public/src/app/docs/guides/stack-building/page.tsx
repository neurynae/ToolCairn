import type { Metadata } from 'next';
import { Breadcrumbs } from '@/components/docs/breadcrumbs';
import { CodeBlock } from '@/components/docs/code-block';
import { Callout } from '@/components/docs/callout';
import { PrevNextNav } from '@/components/docs/prev-next-nav';
import { getPrevNext } from '@/lib/docs-navigation';

export const metadata: Metadata = {
  title: 'Stack Building Guide — ToolPilot Docs',
  description:
    'Use get_stack to build compatible tool sets powered by graph relationships and health scoring.',
};

export default function StackBuildingPage() {
  const { prev, next } = getPrevNext('/docs/guides/stack-building');

  return (
    <div style={{ maxWidth: 768, margin: '0 auto' }}>
      <Breadcrumbs
        items={[
          { label: 'Docs', href: '/docs' },
          { label: 'Guides', href: '/docs/guides' },
          { label: 'Stack Building' },
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
          Stack Building Guide
        </h1>
        <p
          className="mt-3 text-base sm:text-lg"
          style={{ color: 'var(--color-text-secondary)', lineHeight: 1.6 }}
        >
          Starting a new project? Instead of searching for tools one at a time, let
          ToolPilot build a compatible stack in a single call using{' '}
          <code style={{ color: 'var(--color-accent)' }}>get_stack</code>.
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
            <li>When to use <code>get_stack</code> vs. individual <code>search_tools</code> calls</li>
            <li>How to describe your use case and constraints effectively</li>
            <li>How graph compatibility drives stack recommendations</li>
            <li>How to evaluate and customize the suggested stack</li>
          </ul>
        </div>
      </section>

      {/* ─── When to use ─── */}
      <section style={{ marginBottom: 40 }}>
        <h2
          id="when-to-use-get-stack"
          className="mb-2 text-xl font-bold"
          style={{ color: 'var(--color-text-primary)' }}
        >
          When to use get_stack
        </h2>
        <p
          className="mb-4 text-sm leading-relaxed"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          Reach for <code>get_stack</code> when you need multiple tools that work well{' '}
          <em>together</em> — not just individually. Typical scenarios:
        </p>
        <ul
          className="mb-4 space-y-2 text-sm leading-relaxed"
          style={{ color: 'var(--color-text-secondary)', paddingLeft: 20 }}
        >
          <li>Starting a new project from scratch and need a full toolkit</li>
          <li>Migrating from one platform to another and need compatible replacements</li>
          <li>Adding a new capability (e.g., real-time features) that requires several tools</li>
          <li>Evaluating technology stacks for a technical proposal</li>
        </ul>
        <Callout type="note">
          Stack recommendations consider graph relationships — tools that are frequently
          used together and have strong <code>RELATED_TO</code> edges score higher.
          This means you get combinations that are battle-tested in real projects, not
          just individually popular tools.
        </Callout>
      </section>

      {/* ─── Step 1 ─── */}
      <section style={{ marginBottom: 40 }}>
        <h2
          id="step-1-describe-your-use-case"
          className="mb-2 text-xl font-bold"
          style={{ color: 'var(--color-text-primary)' }}
        >
          Step 1: Describe your use case
        </h2>
        <p
          className="mb-4 text-sm leading-relaxed"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          Provide a use case description and any constraints that matter for your
          project. The more specific you are, the tighter the recommendations.
        </p>
        <CodeBlock
          language="json"
          code={`{
  "use_case": "real-time analytics dashboard",
  "constraints": {
    "language": "TypeScript",
    "deployment": "cloud"
  }
}`}
        />
        <p
          className="mt-4 text-sm leading-relaxed"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          ToolPilot parses the use case into required capability categories — data
          ingestion, processing, storage, visualization — and finds tools that cover each
          category while maintaining strong graph edges between them.
        </p>
      </section>

      {/* ─── Step 2 ─── */}
      <section style={{ marginBottom: 40 }}>
        <h2
          id="step-2-understand-the-results"
          className="mb-2 text-xl font-bold"
          style={{ color: 'var(--color-text-primary)' }}
        >
          Step 2: Understand the results
        </h2>
        <p
          className="mb-4 text-sm leading-relaxed"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          The response includes a primary stack with each tool categorized by role, plus
          a compatibility score that reflects how well the tools work together.
        </p>
        <CodeBlock
          language="json"
          code={`{
  "stack": {
    "compatibility_score": 0.91,
    "tools": [
      {
        "name": "kafka",
        "role": "ingestion",
        "health_tier": "healthy",
        "health_score": 94,
        "why": "Industry-standard event streaming — excellent TypeScript client (kafkajs)"
      },
      {
        "name": "apache-flink",
        "role": "processing",
        "health_tier": "healthy",
        "health_score": 88,
        "why": "Real-time stream processing with low latency windowing"
      },
      {
        "name": "clickhouse",
        "role": "storage",
        "health_tier": "healthy",
        "health_score": 90,
        "why": "Column-oriented OLAP database optimized for analytics queries"
      },
      {
        "name": "grafana",
        "role": "visualization",
        "health_tier": "healthy",
        "health_score": 95,
        "why": "Native ClickHouse datasource, real-time dashboard support"
      }
    ]
  },
  "alternative_stacks": [
    {
      "compatibility_score": 0.84,
      "tools": [
        { "name": "redpanda", "role": "ingestion" },
        { "name": "materialize", "role": "processing" },
        { "name": "timescaledb", "role": "storage" },
        { "name": "metabase", "role": "visualization" }
      ]
    }
  ]
}`}
        />
        <h3
          id="understanding-compatibility-score"
          className="mt-6 mb-2 text-base font-semibold"
          style={{ color: 'var(--color-text-primary)' }}
        >
          Understanding the compatibility score
        </h3>
        <p
          className="text-sm leading-relaxed"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          The compatibility score (0–1) is calculated from the <code>RELATED_TO</code>{' '}
          edge weights between every pair of tools in the stack. A score of 0.91 means
          these tools are frequently used together with strong positive outcomes reported
          across the community. Lower scores might still be great — they just have fewer
          data points.
        </p>
      </section>

      {/* ─── Step 3 ─── */}
      <section style={{ marginBottom: 40 }}>
        <h2
          id="step-3-evaluate-the-stack"
          className="mb-2 text-xl font-bold"
          style={{ color: 'var(--color-text-primary)' }}
        >
          Step 3: Evaluate the stack
        </h2>
        <p
          className="mb-4 text-sm leading-relaxed"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          Don&rsquo;t accept a stack blindly. For each tool in the recommendation, check:
        </p>
        <ul
          className="mb-4 space-y-2 text-sm leading-relaxed"
          style={{ color: 'var(--color-text-secondary)', paddingLeft: 20 }}
        >
          <li>
            <strong style={{ color: 'var(--color-text-primary)' }}>Health score</strong>{' '}
            — Are all tools in the <em>healthy</em> tier? A single at-risk tool can
            bottleneck your entire stack.
          </li>
          <li>
            <strong style={{ color: 'var(--color-text-primary)' }}>TypeScript support</strong>{' '}
            — Since we constrained to TypeScript, verify each tool has quality TS
            clients and type definitions.
          </li>
          <li>
            <strong style={{ color: 'var(--color-text-primary)' }}>Cloud deployment</strong>{' '}
            — Confirm managed cloud options exist for each tool if that&rsquo;s your
            constraint.
          </li>
          <li>
            <strong style={{ color: 'var(--color-text-primary)' }}>Team familiarity</strong>{' '}
            — Graph data can&rsquo;t account for your team&rsquo;s existing expertise.
            A slightly lower-scoring stack your team already knows may ship faster.
          </li>
        </ul>
        <Callout type="tip" title="Mix and match">
          You&rsquo;re not locked into a single stack. It&rsquo;s perfectly fine to pick
          Kafka from the primary stack and Metabase from the alternative if that better
          fits your team. The compatibility score is a guide, not a constraint.
        </Callout>
      </section>

      {/* ─── Example Walkthrough ─── */}
      <section style={{ marginBottom: 40 }}>
        <h2
          id="example-data-pipeline-stack"
          className="mb-2 text-xl font-bold"
          style={{ color: 'var(--color-text-primary)' }}
        >
          Example: Building a data pipeline stack
        </h2>
        <p
          className="mb-4 text-sm leading-relaxed"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          Let&rsquo;s walk through a scenario. You&rsquo;re building a real-time
          analytics dashboard that ingests event data from multiple sources, processes
          it for aggregation, stores it for fast queries, and renders live charts.
        </p>
        <ol
          className="space-y-4 text-sm leading-relaxed"
          style={{ color: 'var(--color-text-secondary)', paddingLeft: 20 }}
        >
          <li>
            <strong style={{ color: 'var(--color-text-primary)' }}>Call get_stack</strong>{' '}
            — Describe the use case and constraints (TypeScript, cloud deployment).
          </li>
          <li>
            <strong style={{ color: 'var(--color-text-primary)' }}>Review the primary stack</strong>{' '}
            — Kafka → Flink → ClickHouse → Grafana. Compatibility score: 0.91.
            All tools are healthy.
          </li>
          <li>
            <strong style={{ color: 'var(--color-text-primary)' }}>Check the alternative</strong>{' '}
            — Redpanda → Materialize → TimescaleDB → Metabase. Good option if you want
            PostgreSQL compatibility over ClickHouse&rsquo;s columnar speed.
          </li>
          <li>
            <strong style={{ color: 'var(--color-text-primary)' }}>Decide</strong> — Your
            team already uses PostgreSQL extensively. You pick the primary stack&rsquo;s
            ingestion (Kafka) and processing (Flink), but swap storage to TimescaleDB
            and visualization to Grafana.
          </li>
          <li>
            <strong style={{ color: 'var(--color-text-primary)' }}>Report</strong> — As you
            build, use <code>report_outcome</code> for each tool to strengthen the graph
            edges between your chosen combination.
          </li>
        </ol>
      </section>

      {/* ─── Tips ─── */}
      <section style={{ marginBottom: 8 }}>
        <h2
          id="tips-for-better-stacks"
          className="mb-3 text-xl font-bold"
          style={{ color: 'var(--color-text-primary)' }}
        >
          Tips for better stack recommendations
        </h2>
        <ul
          className="space-y-2 text-sm leading-relaxed"
          style={{ color: 'var(--color-text-secondary)', paddingLeft: 20 }}
        >
          <li>
            <strong style={{ color: 'var(--color-text-primary)' }}>Be specific about the use case</strong>{' '}
            — &ldquo;web app&rdquo; is too broad; &ldquo;real-time collaborative
            document editor&rdquo; gives ToolPilot real signal to work with.
          </li>
          <li>
            <strong style={{ color: 'var(--color-text-primary)' }}>Include deployment constraints</strong>{' '}
            — Self-hosted and cloud stacks look very different. This single filter
            removes half the candidates.
          </li>
          <li>
            <strong style={{ color: 'var(--color-text-primary)' }}>Mention scale expectations</strong>{' '}
            — A stack for 100 users/day and one for 1M events/second have almost
            zero overlap.
          </li>
          <li>
            <strong style={{ color: 'var(--color-text-primary)' }}>Report outcomes</strong>{' '}
            — Stack quality improves as more teams report which combinations worked.
            Your feedback directly strengthens the graph.
          </li>
        </ul>
      </section>

      <PrevNextNav prev={prev} next={next} />
    </div>
  );
}
