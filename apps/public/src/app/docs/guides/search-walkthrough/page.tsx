import type { Metadata } from 'next';
import { Breadcrumbs } from '@/components/docs/breadcrumbs';
import { CodeBlock } from '@/components/docs/code-block';
import { Callout } from '@/components/docs/callout';
import { PrevNextNav } from '@/components/docs/prev-next-nav';
import { getPrevNext } from '@/lib/docs-navigation';

export const metadata: Metadata = {
  title: 'Complete Search Walkthrough — ToolPilot Docs',
  description:
    'Step-by-step guide through the entire ToolPilot search flow — from query to outcome reporting.',
};

export default function SearchWalkthroughPage() {
  const { prev, next } = getPrevNext('/docs/guides/search-walkthrough');

  return (
    <div style={{ maxWidth: 768, margin: '0 auto' }}>
      <Breadcrumbs
        items={[
          { label: 'Docs', href: '/docs' },
          { label: 'Guides', href: '/docs/guides' },
          { label: 'Search Walkthrough' },
        ]}
      />

      {/* ─── Header ─── */}
      <header style={{ marginTop: 24, marginBottom: 40 }}>
        <div className="flex items-center gap-3">
          <span
            className="rounded-full px-2.5 py-0.5 text-xs font-semibold"
            style={{
              color: '#22c55e',
              background: 'rgba(34,197,94,0.10)',
              border: '1px solid rgba(34,197,94,0.20)',
            }}
          >
            Beginner
          </span>
          <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
            ~10 min read
          </span>
        </div>
        <h1
          className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl"
          style={{ color: 'var(--color-text-primary)', lineHeight: 1.2 }}
        >
          Complete Search Walkthrough
        </h1>
        <p
          className="mt-3 text-base sm:text-lg"
          style={{ color: 'var(--color-text-secondary)', lineHeight: 1.6 }}
        >
          Follow a real search from start to finish. You&rsquo;ll see exactly what
          happens at every stage of ToolPilot&rsquo;s discovery pipeline.
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
            <li>How to start a search with <code>search_tools</code></li>
            <li>How to respond to clarification questions</li>
            <li>How to interpret search results and health scores</li>
            <li>How to report outcomes back to the graph</li>
          </ul>
        </div>
      </section>

      {/* ─── Step 1 ─── */}
      <section style={{ marginBottom: 40 }}>
        <h2
          id="step-1-starting-a-search"
          className="mb-2 text-xl font-bold"
          style={{ color: 'var(--color-text-primary)' }}
        >
          Step 1: Starting a search
        </h2>
        <p
          className="mb-4 text-sm leading-relaxed"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          Everything begins with a call to{' '}
          <code style={{ color: 'var(--color-accent)' }}>search_tools</code>. Describe
          what you need in natural language — ToolPilot handles the intent parsing,
          semantic matching, and graph traversal behind the scenes.
        </p>
        <CodeBlock
          language="json"
          code={`{
  "query": "I need a fast key-value store for caching in a Node.js application"
}`}
        />
        <p
          className="mt-4 text-sm leading-relaxed"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          The query gets routed through the 4-stage search pipeline: intent extraction,
          vector similarity search, graph expansion, and scoring. Depending on how
          specific your query is, you&rsquo;ll either get results immediately or receive a
          clarification request.
        </p>
      </section>

      {/* ─── Step 2 ─── */}
      <section style={{ marginBottom: 40 }}>
        <h2
          id="step-2-receiving-clarification"
          className="mb-2 text-xl font-bold"
          style={{ color: 'var(--color-text-primary)' }}
        >
          Step 2: Receiving clarification
        </h2>
        <p
          className="mb-4 text-sm leading-relaxed"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          When ToolPilot needs more context to narrow down the best match, it responds
          with a clarification request instead of results. This is part of the{' '}
          <strong>Guided Discovery</strong> system — think of it as ToolPilot asking the
          right follow-up questions before making a recommendation.
        </p>
        <CodeBlock
          language="json"
          code={`{
  "type": "clarification",
  "query_id": "abc-123",
  "questions": [
    {
      "key": "deployment",
      "question": "Do you need a self-hosted solution or a managed cloud service?",
      "options": ["self-hosted", "managed"]
    },
    {
      "key": "language",
      "question": "What's the primary language of the project?",
      "options": ["TypeScript", "JavaScript", "Python", "Go"]
    }
  ]
}`}
        />
        <div style={{ marginTop: 16 }}>
          <Callout type="tip" title="Not every search triggers clarification">
            If your query is specific enough — or you provide context filters upfront —
            ToolPilot skips clarification entirely. See the{' '}
            <a href="/docs/guides/rich-context" style={{ color: 'var(--color-accent)' }}>
              Rich Context guide
            </a>{' '}
            for details.
          </Callout>
        </div>
      </section>

      {/* ─── Step 3 ─── */}
      <section style={{ marginBottom: 40 }}>
        <h2
          id="step-3-responding-to-clarification"
          className="mb-2 text-xl font-bold"
          style={{ color: 'var(--color-text-primary)' }}
        >
          Step 3: Responding to clarification
        </h2>
        <p
          className="mb-4 text-sm leading-relaxed"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          Send the answers back using{' '}
          <code style={{ color: 'var(--color-accent)' }}>search_tools_respond</code>.
          Include the <code>query_id</code> from the clarification response so ToolPilot
          can continue the same search session.
        </p>
        <CodeBlock
          language="json"
          code={`{
  "query_id": "abc-123",
  "answers": {
    "deployment": "self-hosted",
    "language": "TypeScript"
  }
}`}
        />
        <p
          className="mt-4 text-sm leading-relaxed"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          ToolPilot re-scores the candidate tools using your answers as additional
          filters. The graph traversal narrows down, and you get a refined set of
          results.
        </p>
      </section>

      {/* ─── Step 4 ─── */}
      <section style={{ marginBottom: 40 }}>
        <h2
          id="step-4-getting-results"
          className="mb-2 text-xl font-bold"
          style={{ color: 'var(--color-text-primary)' }}
        >
          Step 4: Getting results
        </h2>
        <p
          className="mb-4 text-sm leading-relaxed"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          The response includes the top recommended tool along with alternatives. Each
          result carries a health score, category, and a summary pulled from the graph
          mesh.
        </p>
        <CodeBlock
          language="json"
          code={`{
  "type": "results",
  "recommended": {
    "name": "redis",
    "description": "In-memory data structure store, used as a database, cache, and message broker",
    "health_tier": "healthy",
    "health_score": 92,
    "category": "database",
    "tags": ["caching", "key-value", "in-memory"],
    "why": "Strong match for Node.js caching — excellent TypeScript client (ioredis), active maintenance, self-hosted"
  },
  "alternatives": [
    {
      "name": "memcached",
      "health_tier": "healthy",
      "health_score": 78,
      "why": "Simpler caching layer, but fewer data structures than Redis"
    },
    {
      "name": "keydb",
      "health_tier": "moderate",
      "health_score": 65,
      "why": "Multi-threaded Redis fork — good if you need higher throughput"
    }
  ]
}`}
        />
        <div style={{ marginTop: 16 }}>
          <Callout type="note" title="Understanding health tiers">
            Health tiers — <strong>healthy</strong>, <strong>moderate</strong>, and{' '}
            <strong>at-risk</strong> — reflect a tool&rsquo;s maintenance status,
            community activity, and release cadence. A higher score means the tool is
            well-maintained and actively developed.
          </Callout>
        </div>
      </section>

      {/* ─── Step 5 ─── */}
      <section style={{ marginBottom: 40 }}>
        <h2
          id="step-5-evaluating-the-recommendation"
          className="mb-2 text-xl font-bold"
          style={{ color: 'var(--color-text-primary)' }}
        >
          Step 5: Evaluating the recommendation
        </h2>
        <p
          className="mb-4 text-sm leading-relaxed"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          Before committing to a tool, consider these factors:
        </p>
        <ul
          className="mb-4 space-y-2 text-sm leading-relaxed"
          style={{ color: 'var(--color-text-secondary)', paddingLeft: 20 }}
        >
          <li>
            <strong style={{ color: 'var(--color-text-primary)' }}>Health tier</strong>{' '}
            — Is the tool actively maintained? Check the score breakdown.
          </li>
          <li>
            <strong style={{ color: 'var(--color-text-primary)' }}>Graph relationships</strong>{' '}
            — What other tools is it commonly paired with? Strong <code>RELATED_TO</code>{' '}
            edges suggest good ecosystem compatibility.
          </li>
          <li>
            <strong style={{ color: 'var(--color-text-primary)' }}>Documentation quality</strong>{' '}
            — Does it have clear guides, API reference, and examples?
          </li>
          <li>
            <strong style={{ color: 'var(--color-text-primary)' }}>Alternatives</strong>{' '}
            — Sometimes the second-best option is a better fit for your constraints.
          </li>
        </ul>
        <Callout type="tip" title="Use get_stack for full-stack decisions">
          If you&rsquo;re selecting multiple tools for a project, use{' '}
          <code>get_stack</code> instead of individual searches. It considers
          compatibility across the entire toolkit. See the{' '}
          <a href="/docs/guides/stack-building" style={{ color: 'var(--color-accent)' }}>
            Stack Building guide
          </a>.
        </Callout>
      </section>

      {/* ─── Step 6 ─── */}
      <section style={{ marginBottom: 40 }}>
        <h2
          id="step-6-reporting-the-outcome"
          className="mb-2 text-xl font-bold"
          style={{ color: 'var(--color-text-primary)' }}
        >
          Step 6: Reporting the outcome
        </h2>
        <p
          className="mb-4 text-sm leading-relaxed"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          After using the recommended tool, close the feedback loop by calling{' '}
          <code style={{ color: 'var(--color-accent)' }}>report_outcome</code>. This is
          how ToolPilot learns — positive outcomes strengthen graph edges, and negative
          outcomes trigger decay so future searches surface better alternatives.
        </p>
        <CodeBlock
          language="json"
          code={`{
  "tool_name": "redis",
  "outcome": "success",
  "details": "Excellent caching performance for our use case"
}`}
        />
        <div style={{ marginTop: 16 }}>
          <Callout type="important" title="Why reporting matters">
            Every outcome report updates edge weights in the tool graph. Over time, this
            makes recommendations more accurate for everyone. Tools that consistently
            deliver good results rise in rankings; tools that cause problems get flagged
            for review.
          </Callout>
        </div>
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
          The full search flow is:{' '}
          <code>search_tools</code> → (optional clarification via{' '}
          <code>search_tools_respond</code>) → evaluate results →{' '}
          <code>report_outcome</code>. Each interaction feeds back into the graph,
          making ToolPilot smarter over time. The more context you provide upfront, the
          fewer clarification rounds you&rsquo;ll need.
        </p>
      </section>

      <PrevNextNav prev={prev} next={next} />
    </div>
  );
}
