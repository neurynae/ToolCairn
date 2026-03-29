import { Breadcrumbs } from '@/components/docs/breadcrumbs';
import { Callout } from '@/components/docs/callout';
import { CodeBlock } from '@/components/docs/code-block';
import { PrevNextNav } from '@/components/docs/prev-next-nav';
import { getPrevNext } from '@/lib/docs-navigation';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Feedback Loop – ToolPilot Docs',
  description:
    'How agent outcome reports reinforce or attenuate graph edges, creating a self-improving recommendation system.',
};

const CURRENT_HREF = '/docs/concepts/feedback-loop';

const feedbackCycle = `                    ┌──────────────────────┐
                    │   Agent uses tool    │
                    │   (via search_tools) │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │  Agent evaluates     │
                    │  tool effectiveness  │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │  report_outcome()    │
                    │  success | failure   │
                    │  partial             │
                    └──────────┬───────────┘
                               │
               ┌───────────────┼───────────────┐
               ▼               ▼               ▼
        ┌─────────────┐ ┌───────────┐ ┌──────────────┐
        │  "success"  │ │ "partial" │ │  "failure"   │
        │  +weight    │ │  neutral  │ │  −weight     │
        │  reset Δt   │ │  log only │ │  attenuate   │
        └──────┬──────┘ └─────┬─────┘ └──────┬───────┘
               │              │              │
               └──────────────┼──────────────┘
                              │
                              ▼
                   ┌─────────────────────┐
                   │  Graph edges updated │
                   │  (Memgraph)          │
                   └──────────┬──────────┘
                              │
                              ▼
                   ┌─────────────────────┐
                   │  Future searches     │
                   │  improved for ALL    │
                   │  users               │
                   └─────────────────────┘
                              │
                              ╰──────▶ (cycle repeats)`;

const successExample = `// report_outcome with "success"
// → Reinforces the relationship between the recommended tool
//   and the user's context/stack

report_outcome({
  session_id: "sess_abc123",
  outcome: "success",
  tool: "chromadb",
  context: "Used as embedded vector store in RAG pipeline"
})

// Effect on graph:
//   1. RELATED_TO edge weight += 0.05 (capped at 1.0)
//   2. last_reinforced = now() (resets decay timer)
//   3. reinforcement_count += 1
//   4. Outcome logged to analytics`;

const failureExample = `// report_outcome with "failure"
// → Attenuates the relationship, reducing confidence

report_outcome({
  session_id: "sess_def456",
  outcome: "failure",
  tool: "abandoned-db",
  context: "Incompatible with Node.js 22, no ESM support"
})

// Effect on graph:
//   1. RELATED_TO edge weight *= 0.85 (15% reduction)
//   2. failure_count += 1
//   3. If failure_count > threshold → flag for review
//   4. Outcome logged with failure reason`;

const partialExample = `// report_outcome with "partial"
// → Neutral signal — logged but minimal graph impact

report_outcome({
  session_id: "sess_ghi789",
  outcome: "partial",
  tool: "some-orm",
  context: "Works but missing TypeScript types for v5 API"
})

// Effect on graph:
//   1. No weight change
//   2. Outcome logged for analysis
//   3. May inform future health score recalculation`;

export default function FeedbackLoopPage() {
  const { prev, next } = getPrevNext(CURRENT_HREF);

  return (
    <>
      <Breadcrumbs
        items={[
          { label: 'Docs', href: '/docs' },
          { label: 'Core Concepts', href: '/docs/concepts' },
          { label: 'Feedback Loop' },
        ]}
      />

      <div className="space-y-8">
        {/* ─── Header ─── */}
        <section className="mt-4">
          <h1
            className="text-3xl font-bold tracking-tight"
            style={{ color: 'var(--color-text-primary)' }}
          >
            Feedback Loop
          </h1>
          <p
            className="mt-3 max-w-2xl text-base"
            style={{ color: 'var(--color-text-secondary)', lineHeight: 1.7 }}
          >
            ToolPilot gets smarter with every interaction. When agents report whether a recommended
            tool worked, that signal flows back into the graph — reinforcing good recommendations
            and weakening bad ones.
          </p>
        </section>

        {/* ─── The Cycle ─── */}
        <section>
          <h2
            id="the-cycle"
            className="text-xl font-semibold"
            style={{ color: 'var(--color-text-primary)' }}
          >
            The Cycle
          </h2>
          <p
            className="mt-3 text-sm"
            style={{ color: 'var(--color-text-secondary)', lineHeight: 1.7 }}
          >
            The feedback loop is a continuous cycle that connects tool usage to graph improvement:
          </p>
          <div className="mt-4">
            <CodeBlock code={feedbackCycle} filename="Feedback loop cycle" />
          </div>
        </section>

        {/* ─── Outcome Types ─── */}
        <section>
          <h2
            id="outcome-types"
            className="text-xl font-semibold"
            style={{ color: 'var(--color-text-primary)' }}
          >
            Outcome Types
          </h2>
          <p
            className="mt-3 text-sm"
            style={{ color: 'var(--color-text-secondary)', lineHeight: 1.7 }}
          >
            The <code style={{ color: 'var(--color-accent)' }}>report_outcome</code> MCP tool
            accepts three outcome types, each with different effects on the graph:
          </p>
        </section>

        {/* ─── Success ─── */}
        <section>
          <h3
            id="outcome-success"
            className="text-lg font-semibold"
            style={{ color: 'var(--color-text-primary)' }}
          >
            ✅ Success
          </h3>
          <p
            className="mt-2 text-sm"
            style={{ color: 'var(--color-text-secondary)', lineHeight: 1.7 }}
          >
            The tool worked as expected. This is the strongest positive signal — it reinforces the
            graph edge between the tool and its related context, resets the decay timer, and adds a
            small weight boost.
          </p>
          <div className="mt-3">
            <CodeBlock
              code={successExample}
              language="typescript"
              filename="Success outcome"
              showLineNumbers
            />
          </div>
        </section>

        {/* ─── Failure ─── */}
        <section>
          <h3
            id="outcome-failure"
            className="text-lg font-semibold"
            style={{ color: 'var(--color-text-primary)' }}
          >
            ❌ Failure
          </h3>
          <p
            className="mt-2 text-sm"
            style={{ color: 'var(--color-text-secondary)', lineHeight: 1.7 }}
          >
            The tool didn&rsquo;t work for the intended use case. This attenuates the edge weight by
            15%, reducing the likelihood it will be recommended in similar contexts. Repeated
            failures may trigger a manual review flag.
          </p>
          <div className="mt-3">
            <CodeBlock
              code={failureExample}
              language="typescript"
              filename="Failure outcome"
              showLineNumbers
            />
          </div>
        </section>

        {/* ─── Partial ─── */}
        <section>
          <h3
            id="outcome-partial"
            className="text-lg font-semibold"
            style={{ color: 'var(--color-text-primary)' }}
          >
            🔶 Partial
          </h3>
          <p
            className="mt-2 text-sm"
            style={{ color: 'var(--color-text-secondary)', lineHeight: 1.7 }}
          >
            The tool partially worked or worked with caveats. This is a neutral signal — the outcome
            is logged for analytics but causes minimal weight change. Over time, patterns in partial
            reports can inform health score adjustments.
          </p>
          <div className="mt-3">
            <CodeBlock
              code={partialExample}
              language="typescript"
              filename="Partial outcome"
              showLineNumbers
            />
          </div>
        </section>

        {/* ─── Impact Summary ─── */}
        <section>
          <h2
            id="impact-summary"
            className="text-xl font-semibold"
            style={{ color: 'var(--color-text-primary)' }}
          >
            Impact Summary
          </h2>

          <div
            className="mt-4 overflow-x-auto rounded-lg"
            style={{
              border: '1px solid var(--color-border-subtle)',
              borderRadius: 'var(--radius-md)',
            }}
          >
            <table className="w-full text-sm" style={{ borderCollapse: 'collapse' }}>
              <thead>
                <tr
                  style={{
                    background: 'var(--color-surface-2)',
                    borderBottom: '1px solid var(--color-border-default)',
                  }}
                >
                  <th
                    className="px-4 py-3 text-left font-semibold"
                    style={{ color: 'var(--color-text-primary)' }}
                  >
                    Outcome
                  </th>
                  <th
                    className="px-4 py-3 text-left font-semibold"
                    style={{ color: 'var(--color-text-primary)' }}
                  >
                    Weight Change
                  </th>
                  <th
                    className="px-4 py-3 text-left font-semibold"
                    style={{ color: 'var(--color-text-primary)' }}
                  >
                    Decay Timer
                  </th>
                  <th
                    className="px-4 py-3 text-left font-semibold"
                    style={{ color: 'var(--color-text-primary)' }}
                  >
                    Analytics
                  </th>
                </tr>
              </thead>
              <tbody style={{ color: 'var(--color-text-secondary)' }}>
                <tr style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
                  <td className="px-4 py-3 font-medium" style={{ color: '#22c55e' }}>
                    ✅ Success
                  </td>
                  <td className="px-4 py-3">+0.05 (capped at 1.0)</td>
                  <td className="px-4 py-3">Reset to now</td>
                  <td className="px-4 py-3">Logged</td>
                </tr>
                <tr style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
                  <td className="px-4 py-3 font-medium" style={{ color: '#ef4444' }}>
                    ❌ Failure
                  </td>
                  <td className="px-4 py-3">×0.85 (15% reduction)</td>
                  <td className="px-4 py-3">Unchanged</td>
                  <td className="px-4 py-3">Logged + review flag if repeated</td>
                </tr>
                <tr style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
                  <td className="px-4 py-3 font-medium" style={{ color: '#f59e0b' }}>
                    🔶 Partial
                  </td>
                  <td className="px-4 py-3">No change</td>
                  <td className="px-4 py-3">Unchanged</td>
                  <td className="px-4 py-3">Logged</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* ─── Self-Improving System ─── */}
        <section>
          <h2
            id="self-improving-system"
            className="text-xl font-semibold"
            style={{ color: 'var(--color-text-primary)' }}
          >
            A Self-Improving System
          </h2>
          <p
            className="mt-3 text-sm"
            style={{ color: 'var(--color-text-secondary)', lineHeight: 1.7 }}
          >
            The feedback loop creates a network effect: the more agents use ToolPilot, the better it
            gets for everyone. Each outcome report is a data point that refines the graph&rsquo;s
            understanding of tool relationships. Over time, this produces a recommendation engine
            that reflects real-world usage patterns rather than static editorial opinions.
          </p>
          <p
            className="mt-3 text-sm"
            style={{ color: 'var(--color-text-secondary)', lineHeight: 1.7 }}
          >
            Combined with temporal edge decay, the feedback loop ensures that the graph stays both
            accurate (reflecting current reality) and self-correcting (reducing bad recommendations
            automatically).
          </p>

          <Callout type="important" title="Every Report Matters">
            Every outcome report directly improves recommendations for all users. Even failure
            reports are valuable — they teach the graph what doesn&rsquo;t work, preventing future
            agents from hitting the same dead ends.
          </Callout>
        </section>
      </div>

      <div className="mt-16">
        <PrevNextNav prev={prev} next={next} />
      </div>
    </>
  );
}
