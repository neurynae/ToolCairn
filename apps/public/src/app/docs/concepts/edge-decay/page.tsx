import { Breadcrumbs } from '@/components/docs/breadcrumbs';
import { Callout } from '@/components/docs/callout';
import { CodeBlock } from '@/components/docs/code-block';
import { PrevNextNav } from '@/components/docs/prev-next-nav';
import { getPrevNext } from '@/lib/docs-navigation';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Edge Decay – ToolPilot Docs',
  description:
    "How temporal edge decay keeps ToolPilot's graph relationships current — the exponential decay formula, reinforcement triggers, and tuning.",
};

const CURRENT_HREF = '/docs/concepts/edge-decay';

const decayCurve = `  Weight
  1.0 ┤ ●
      │  ╲
  0.8 ┤   ╲
      │    ╲
  0.6 ┤     ╲
      │      ╲                  ← half-life (~2.7 years)
  0.5 ┤ · · · ·╲· · · · · · · · · · · · · · · ·
      │         ╲
  0.4 ┤          ╲
      │           ╲
  0.2 ┤             ╲____
      │                   ╲________
  0.0 ┤                            ╲_______________
      └──┬────┬────┬────┬────┬────┬────┬────┬────┬─ Days
         0   365  730  1095 1460 1825 2190 2555 2920
              1yr  2yr  3yr  4yr  5yr  6yr  7yr  8yr`;

const formulaExample = `// Temporal edge decay formula
effective_weight = base_weight × e^(-λ × days_since_reinforcement)

// With default parameters:
//   λ (lambda) = 0.001  (decay constant)
//   half-life  ≈ 693 days (~2.7 years)

// Examples:
//   After 30 days:   0.82 × e^(-0.001 × 30)   = 0.82 × 0.970 = 0.796
//   After 365 days:  0.82 × e^(-0.001 × 365)  = 0.82 × 0.694 = 0.569
//   After 730 days:  0.82 × e^(-0.001 × 730)  = 0.82 × 0.482 = 0.395
//   After 1095 days: 0.82 × e^(-0.001 × 1095) = 0.82 × 0.335 = 0.275`;

const reinforcementCode = `// When report_outcome("success") is called:
MATCH (a:Tool)-[r:RELATED_TO]->(b:Tool)
WHERE a.name = $tool_a AND b.name = $tool_b
SET r.last_reinforced = datetime(),
    r.weight = min(r.weight + 0.05, 1.0),
    r.reinforcement_count = r.reinforcement_count + 1`;

export default function EdgeDecayPage() {
  const { prev, next } = getPrevNext(CURRENT_HREF);

  return (
    <>
      <Breadcrumbs
        items={[
          { label: 'Docs', href: '/docs' },
          { label: 'Core Concepts', href: '/docs/concepts' },
          { label: 'Edge Decay' },
        ]}
      />

      <div className="space-y-8">
        {/* ─── Header ─── */}
        <section className="mt-4">
          <h1
            className="text-3xl font-bold tracking-tight"
            style={{ color: 'var(--color-text-primary)' }}
          >
            Temporal Edge Decay
          </h1>
          <p
            className="mt-3 max-w-2xl text-base"
            style={{ color: 'var(--color-text-secondary)', lineHeight: 1.7 }}
          >
            The tool ecosystem changes constantly. Edge decay ensures that ToolPilot&rsquo;s graph
            relationships stay current by gradually reducing the weight of edges that haven&rsquo;t
            been reinforced by new evidence.
          </p>
        </section>

        {/* ─── The Problem ─── */}
        <section>
          <h2
            id="the-problem"
            className="text-xl font-semibold"
            style={{ color: 'var(--color-text-primary)' }}
          >
            The Problem
          </h2>
          <p
            className="mt-3 text-sm"
            style={{ color: 'var(--color-text-secondary)', lineHeight: 1.7 }}
          >
            Tool relationships change over time. A library that was the go-to choice three years ago
            may now be abandoned, superseded, or incompatible with modern ecosystems. Static edge
            weights would preserve stale relationships indefinitely, leading to outdated
            recommendations. ToolPilot needs a mechanism to let old relationships fade while keeping
            active ones strong.
          </p>
        </section>

        {/* ─── The Formula ─── */}
        <section>
          <h2
            id="the-formula"
            className="text-xl font-semibold"
            style={{ color: 'var(--color-text-primary)' }}
          >
            The Formula
          </h2>
          <p
            className="mt-3 text-sm"
            style={{ color: 'var(--color-text-secondary)', lineHeight: 1.7 }}
          >
            Edge weights decay exponentially over time using a standard radioactive-decay-style
            formula:
          </p>

          <div
            className="mt-4 rounded-lg p-5"
            style={{
              background: 'var(--color-surface-2)',
              border: '1px solid var(--color-border-default)',
              borderRadius: 'var(--radius-lg)',
              textAlign: 'center',
            }}
          >
            <p
              className="font-mono text-lg font-semibold"
              style={{ color: 'var(--color-text-primary)' }}
            >
              effective_weight = base_weight × e<sup>−λ × Δt</sup>
            </p>
            <div
              className="mt-3 inline-block text-left text-sm"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              <p>
                <strong>λ</strong> (lambda) = 0.001 — the decay constant
              </p>
              <p>
                <strong>Δt</strong> = days since last reinforcement
              </p>
              <p>
                <strong>Half-life</strong> ≈ 693 days (~2.7 years)
              </p>
            </div>
          </div>

          <div className="mt-4">
            <CodeBlock
              code={formulaExample}
              language="typescript"
              filename="Decay calculation examples"
              showLineNumbers
            />
          </div>
        </section>

        {/* ─── Decay Curve ─── */}
        <section>
          <h2
            id="decay-curve"
            className="text-xl font-semibold"
            style={{ color: 'var(--color-text-primary)' }}
          >
            Decay Curve
          </h2>
          <p
            className="mt-3 text-sm"
            style={{ color: 'var(--color-text-secondary)', lineHeight: 1.7 }}
          >
            The following visualization shows how an edge with base weight 1.0 decays over time
            without any reinforcement events:
          </p>
          <div className="mt-4">
            <CodeBlock code={decayCurve} filename="Edge weight decay over time" />
          </div>
          <p
            className="mt-3 text-sm"
            style={{ color: 'var(--color-text-secondary)', lineHeight: 1.7 }}
          >
            The curve is intentionally gentle. A ~2.7-year half-life means relationships don&rsquo;t
            vanish overnight — they slowly lose influence unless reinforced. This balances freshness
            against stability.
          </p>
        </section>

        {/* ─── Reinforcement Triggers ─── */}
        <section>
          <h2
            id="reinforcement-triggers"
            className="text-xl font-semibold"
            style={{ color: 'var(--color-text-primary)' }}
          >
            What Triggers Reinforcement
          </h2>
          <p
            className="mt-3 text-sm"
            style={{ color: 'var(--color-text-secondary)', lineHeight: 1.7 }}
          >
            An edge&rsquo;s decay timer resets (and its weight receives a small boost) when new
            evidence confirms the relationship is still valid:
          </p>
          <ul
            className="mt-3 list-inside list-disc space-y-2 text-sm"
            style={{ color: 'var(--color-text-secondary)', lineHeight: 1.7 }}
          >
            <li>
              <strong>
                <code style={{ color: 'var(--color-accent)' }}>report_outcome</code> with success
              </strong>{' '}
              — An agent confirms a tool worked well in a given context. This resets{' '}
              <code style={{ color: 'var(--color-accent)' }}>last_reinforced</code> and adds a +0.05
              weight boost (capped at 1.0).
            </li>
            <li>
              <strong>GitHub indexer co-occurrence</strong> — The indexer detects tools appearing
              together in new repositories (package.json, go.mod, requirements.txt, etc.),
              refreshing the edge timestamp.
            </li>
            <li>
              <strong>Manual curation</strong> — Admin updates via the web interface can reinforce
              or adjust edges when automated signals miss context.
            </li>
          </ul>
          <div className="mt-4">
            <CodeBlock
              code={reinforcementCode}
              language="cypher"
              filename="Reinforcement Cypher query"
              showLineNumbers
            />
          </div>
        </section>

        {/* ─── Why This Matters ─── */}
        <section>
          <h2
            id="why-this-matters"
            className="text-xl font-semibold"
            style={{ color: 'var(--color-text-primary)' }}
          >
            Why This Matters
          </h2>
          <p
            className="mt-3 text-sm"
            style={{ color: 'var(--color-text-secondary)', lineHeight: 1.7 }}
          >
            Temporal decay creates a self-correcting system:
          </p>
          <ul
            className="mt-3 list-inside list-disc space-y-2 text-sm"
            style={{ color: 'var(--color-text-secondary)', lineHeight: 1.7 }}
          >
            <li>
              <strong>Abandoned tools fade naturally</strong> — No one needs to manually flag them.
              Without new co-occurrence data or success reports, their edges weaken.
            </li>
            <li>
              <strong>Rising tools gain prominence</strong> — New tools that get used successfully
              accumulate strong, fresh edges that outcompete decayed ones.
            </li>
            <li>
              <strong>No manual curation required</strong> — The graph evolves organically based on
              real-world usage patterns, not editorial decisions.
            </li>
          </ul>

          <Callout type="important" title="Living Graph">
            Edge decay, combined with the feedback loop, means ToolPilot&rsquo;s graph is a living
            system. Recommendations improve and stay current without manual intervention — the more
            agents use it, the fresher the data.
          </Callout>
        </section>
      </div>

      <div className="mt-16">
        <PrevNextNav prev={prev} next={next} />
      </div>
    </>
  );
}
