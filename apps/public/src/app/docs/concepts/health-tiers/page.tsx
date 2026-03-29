import { Breadcrumbs } from '@/components/docs/breadcrumbs';
import { Callout } from '@/components/docs/callout';
import { CodeBlock } from '@/components/docs/code-block';
import { PrevNextNav } from '@/components/docs/prev-next-nav';
import { getPrevNext } from '@/lib/docs-navigation';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Health Tiers – ToolPilot Docs',
  description:
    'How ToolPilot scores tool maintenance health across four tiers using GitHub signals like stars, commits, and releases.',
};

const CURRENT_HREF = '/docs/concepts/health-tiers';

const scoringFormula = `maintenance_score = (
    stars_normalized       × 0.15  +
    commit_frequency       × 0.30  +
    issue_response_time    × 0.20  +
    release_cadence        × 0.20  +
    contributor_count_norm × 0.15
) × 100

Where each factor is normalized to 0–1 range:
  stars_normalized       = log10(stars + 1) / log10(max_stars + 1)
  commit_frequency       = min(commits_last_90d / 50, 1.0)
  issue_response_time    = max(1 - (avg_days_to_respond / 30), 0)
  release_cadence        = min(releases_last_year / 12, 1.0)
  contributor_count_norm = min(contributors / 100, 1.0)`;

const tiers: Array<{
  emoji: string;
  name: string;
  range: string;
  color: string;
  cssVar: string;
  description: string;
}> = [
  {
    emoji: '🟢',
    name: 'Excellent',
    range: '80–100',
    color: '#22c55e',
    cssVar: 'var(--color-health-green)',
    description:
      'Actively maintained with frequent commits, responsive issue triage, regular releases, and a healthy contributor base. Safe bet for production.',
  },
  {
    emoji: '🔵',
    name: 'Good',
    range: '60–79',
    color: '#3b82f6',
    cssVar: 'var(--color-health-blue)',
    description:
      'Well-maintained with solid activity. May have slightly slower release cycles or smaller contributor pools, but still reliable.',
  },
  {
    emoji: '🟡',
    name: 'Fair',
    range: '40–59',
    color: '#f59e0b',
    cssVar: 'var(--color-health-amber)',
    description:
      'Showing signs of reduced activity. May have long gaps between commits, slow issue response, or infrequent releases. Use with awareness.',
  },
  {
    emoji: '🔴',
    name: 'Poor',
    range: '0–39',
    color: '#ef4444',
    cssVar: 'var(--color-health-red)',
    description:
      'Minimal recent activity. May be abandoned, archived, or in maintenance-only mode. Consider alternatives unless the tool is uniquely suited.',
  },
];

export default function HealthTiersPage() {
  const { prev, next } = getPrevNext(CURRENT_HREF);

  return (
    <>
      <Breadcrumbs
        items={[
          { label: 'Docs', href: '/docs' },
          { label: 'Core Concepts', href: '/docs/concepts' },
          { label: 'Health Tiers' },
        ]}
      />

      <div className="space-y-8">
        {/* ─── Header ─── */}
        <section className="mt-4">
          <h1
            className="text-3xl font-bold tracking-tight"
            style={{ color: 'var(--color-text-primary)' }}
          >
            Health Tiers
          </h1>
          <p
            className="mt-3 max-w-2xl text-base"
            style={{ color: 'var(--color-text-secondary)', lineHeight: 1.7 }}
          >
            Not all tools are equally maintained. ToolPilot computes a maintenance score for every
            tool in the graph, then maps it to one of four health tiers that agents can use to make
            informed recommendations.
          </p>
        </section>

        {/* ─── The Four Tiers ─── */}
        <section>
          <h2
            id="the-four-tiers"
            className="text-xl font-semibold"
            style={{ color: 'var(--color-text-primary)' }}
          >
            The Four Tiers
          </h2>
          <div className="mt-4 space-y-3">
            {tiers.map((tier) => (
              <div
                key={tier.name}
                className="rounded-lg p-4"
                style={{
                  background: 'var(--color-surface-1)',
                  borderLeft: `4px solid ${tier.color}`,
                  borderRadius: 'var(--radius-md)',
                }}
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg">{tier.emoji}</span>
                  <h3
                    id={`tier-${tier.name.toLowerCase()}`}
                    className="text-base font-semibold"
                    style={{ color: 'var(--color-text-primary)' }}
                  >
                    {tier.name}
                  </h3>
                  <span
                    className="ml-auto rounded-full px-3 py-0.5 text-xs font-medium"
                    style={{
                      background: `${tier.color}18`,
                      color: tier.color,
                      border: `1px solid ${tier.color}40`,
                    }}
                  >
                    {tier.range}
                  </span>
                </div>
                <p
                  className="mt-2 text-sm"
                  style={{ color: 'var(--color-text-secondary)', lineHeight: 1.7 }}
                >
                  {tier.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ─── Scoring Formula ─── */}
        <section>
          <h2
            id="scoring-formula"
            className="text-xl font-semibold"
            style={{ color: 'var(--color-text-primary)' }}
          >
            Scoring Formula
          </h2>
          <p
            className="mt-3 text-sm"
            style={{ color: 'var(--color-text-secondary)', lineHeight: 1.7 }}
          >
            The maintenance score is a weighted composite of five GitHub-derived signals. Each
            signal is normalized to a 0–1 range before weighting:
          </p>
          <div className="mt-4">
            <CodeBlock code={scoringFormula} filename="Maintenance score formula" />
          </div>
        </section>

        {/* ─── Health Signals ─── */}
        <section>
          <h2
            id="health-signals"
            className="text-xl font-semibold"
            style={{ color: 'var(--color-text-primary)' }}
          >
            Health Signals
          </h2>
          <p
            className="mt-3 text-sm"
            style={{ color: 'var(--color-text-secondary)', lineHeight: 1.7 }}
          >
            Each signal captures a different dimension of project health:
          </p>

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
                    Signal
                  </th>
                  <th
                    className="px-4 py-3 text-left font-semibold"
                    style={{ color: 'var(--color-text-primary)' }}
                  >
                    Weight
                  </th>
                  <th
                    className="px-4 py-3 text-left font-semibold"
                    style={{ color: 'var(--color-text-primary)' }}
                  >
                    What It Measures
                  </th>
                  <th
                    className="px-4 py-3 text-left font-semibold"
                    style={{ color: 'var(--color-text-primary)' }}
                  >
                    Graph Property
                  </th>
                </tr>
              </thead>
              <tbody style={{ color: 'var(--color-text-secondary)' }}>
                {[
                  {
                    signal: 'Commit Frequency',
                    weight: '30%',
                    measures: 'Commits in the last 90 days — proxy for active development',
                    prop: 'last_commit_date',
                  },
                  {
                    signal: 'Issue Response Time',
                    weight: '20%',
                    measures: 'Average days to first response on new issues',
                    prop: 'open_issues_ratio',
                  },
                  {
                    signal: 'Release Cadence',
                    weight: '20%',
                    measures:
                      'Number of releases in the past year — regular shipping signals stability',
                    prop: 'release_frequency',
                  },
                  {
                    signal: 'Stars',
                    weight: '15%',
                    measures:
                      'Community interest and trust (log-scaled to prevent outlier dominance)',
                    prop: 'stars',
                  },
                  {
                    signal: 'Contributors',
                    weight: '15%',
                    measures: 'Active contributor count — bus factor and community health',
                    prop: 'contributor_count',
                  },
                ].map((row) => (
                  <tr
                    key={row.signal}
                    style={{ borderBottom: '1px solid var(--color-border-subtle)' }}
                  >
                    <td
                      className="px-4 py-3 font-medium"
                      style={{ color: 'var(--color-text-primary)' }}
                    >
                      {row.signal}
                    </td>
                    <td className="px-4 py-3">{row.weight}</td>
                    <td className="px-4 py-3">{row.measures}</td>
                    <td className="px-4 py-3">
                      <code style={{ color: 'var(--color-accent)' }}>{row.prop}</code>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* ─── Health in Search ─── */}
        <section>
          <h2
            id="health-in-search"
            className="text-xl font-semibold"
            style={{ color: 'var(--color-text-primary)' }}
          >
            How Health Affects Search
          </h2>
          <p
            className="mt-3 text-sm"
            style={{ color: 'var(--color-text-secondary)', lineHeight: 1.7 }}
          >
            Health tiers influence the search pipeline in two ways:
          </p>
          <ul
            className="mt-3 list-inside list-disc space-y-2 text-sm"
            style={{ color: 'var(--color-text-secondary)', lineHeight: 1.7 }}
          >
            <li>
              <strong>Stage 3 graph reranking</strong> — Tools with higher health scores receive a
              slight boost to their graph score, reflecting the signal that well-maintained tools
              are more likely to be good recommendations.
            </li>
            <li>
              <strong>Stage 4 selection</strong> — When two tools are within the 20% score
              threshold, health tier differences (stable vs. emerging) can trigger a two-option
              recommendation instead of a single pick.
            </li>
          </ul>

          <Callout type="note" title="Health ≠ Quality">
            Health tiers help agents recommend actively maintained tools over abandoned ones. They
            don&rsquo;t measure code quality, security, or feature completeness — those require
            deeper analysis beyond automated scoring.
          </Callout>
        </section>

        {/* ─── Refresh Cadence ─── */}
        <section>
          <h2
            id="refresh-cadence"
            className="text-xl font-semibold"
            style={{ color: 'var(--color-text-primary)' }}
          >
            Refresh Cadence
          </h2>
          <p
            className="mt-3 text-sm"
            style={{ color: 'var(--color-text-secondary)', lineHeight: 1.7 }}
          >
            Health scores are recalculated by the GitHub indexer on a rolling basis. Each tool is
            refreshed at least once every 7 days, with high-traffic tools refreshed more frequently.
            The <code style={{ color: 'var(--color-accent)' }}>updated_at</code> property on each
            Tool node indicates when its health data was last recalculated.
          </p>
        </section>
      </div>

      <div className="mt-16">
        <PrevNextNav prev={prev} next={next} />
      </div>
    </>
  );
}
