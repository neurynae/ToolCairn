import type { Metadata } from 'next';
import { Breadcrumbs } from '@/components/docs/breadcrumbs';
import { PrevNextNav } from '@/components/docs/prev-next-nav';
import { CodeBlock } from '@/components/docs/code-block';
import { Callout } from '@/components/docs/callout';
import { getPrevNext } from '@/lib/docs-navigation';

export const metadata: Metadata = {
  title: 'Health Formula – ToolPilot Docs',
  description:
    'Detailed breakdown of the ToolPilot health scoring formula — weights, factors, tiers, and search impact.',
};

const FORMULA = `health_score = w1 × commit_frequency
             + w2 × issue_response
             + w3 × release_cadence
             + w4 × community_size
             + w5 × documentation_quality`;

interface Factor {
  name: string;
  weight: number;
  description: string;
  scoring: string[];
}

const FACTORS: Factor[] = [
  {
    name: 'Commit Frequency',
    weight: 0.25,
    description:
      'How actively the project is maintained, measured by commit activity over the last 90 days.',
    scoring: [
      '90–100: Daily commits (or near-daily)',
      '70–89: Multiple commits per week',
      '40–69: Weekly to bi-weekly commits',
      '10–39: Monthly commits or less',
      '0–9: No commits in 90+ days',
    ],
  },
  {
    name: 'Issue Response',
    weight: 0.2,
    description:
      'How quickly maintainers respond to new issues, measured by median first-response time.',
    scoring: [
      '90–100: Median response < 24 hours',
      '70–89: Median response < 3 days',
      '40–69: Median response < 7 days',
      '10–39: Median response < 30 days',
      '0–9: No response or issues disabled',
    ],
  },
  {
    name: 'Release Cadence',
    weight: 0.2,
    description:
      'How regularly new versions are published, based on the frequency and recency of releases.',
    scoring: [
      '90–100: Regular releases (at least monthly)',
      '70–89: Releases every 1–3 months',
      '40–69: Releases every 3–6 months',
      '10–39: Releases every 6–12 months',
      '0–9: No release in 12+ months',
    ],
  },
  {
    name: 'Community Size',
    weight: 0.2,
    description:
      'Overall community engagement — stars, forks, contributors, and download counts.',
    scoring: [
      '90–100: 10k+ stars, 100+ contributors',
      '70–89: 1k–10k stars, 20+ contributors',
      '40–69: 100–1k stars, 5+ contributors',
      '10–39: 10–100 stars, 2+ contributors',
      '0–9: Fewer than 10 stars',
    ],
  },
  {
    name: 'Documentation Quality',
    weight: 0.15,
    description:
      'Presence and quality of documentation — README completeness, dedicated docs site, and API reference.',
    scoring: [
      '90–100: Comprehensive docs site + API reference + examples',
      '70–89: Docs site or thorough README with examples',
      '40–69: README with installation and basic usage',
      '10–39: Minimal README (description only)',
      '0–9: No README or empty repository',
    ],
  },
];

interface Tier {
  label: string;
  range: string;
  color: string;
  bgColor: string;
  description: string;
}

const TIERS: Tier[] = [
  {
    label: 'Excellent',
    range: '80–100',
    color: 'var(--color-health-green)',
    bgColor: 'rgba(34,197,94,0.10)',
    description:
      'Actively maintained, responsive community, regular releases, and excellent documentation.',
  },
  {
    label: 'Good',
    range: '60–79',
    color: 'var(--color-health-blue)',
    bgColor: 'rgba(59,130,246,0.10)',
    description:
      'Well-maintained with reasonable activity. Minor gaps in release cadence or documentation.',
  },
  {
    label: 'Fair',
    range: '40–59',
    color: 'var(--color-health-amber)',
    bgColor: 'rgba(245,158,11,0.10)',
    description:
      'Moderately active. May have slower issue response or infrequent releases.',
  },
  {
    label: 'Poor',
    range: '0–39',
    color: 'var(--color-health-red)',
    bgColor: 'rgba(239,68,68,0.10)',
    description:
      'Low activity, slow or no responses, stale releases. May be abandoned or unmaintained.',
  },
];

export default function HealthFormulaPage() {
  const { prev, next } = getPrevNext('/docs/reference/health-formula');

  return (
    <div>
      <Breadcrumbs
        items={[
          { label: 'Docs', href: '/docs' },
          { label: 'Reference', href: '/docs/reference' },
          { label: 'Health Formula' },
        ]}
      />

      <h1
        className="mt-4 text-3xl font-bold tracking-tight"
        style={{ color: 'var(--tp-text-primary)' }}
      >
        Health Scoring Formula
      </h1>
      <p
        className="mt-3 text-base leading-relaxed"
        style={{ color: 'var(--tp-text-secondary)' }}
      >
        Every tool in the graph has a <code>health_score</code> (0–100)
        computed from five weighted factors. This page explains each factor,
        how scores are calculated, and how they influence search results.
      </p>

      {/* ─── Formula ─── */}
      <h2
        id="formula"
        className="mt-10 text-xl font-semibold"
        style={{ color: 'var(--tp-text-primary)' }}
      >
        Overall Formula
      </h2>
      <div className="mt-4">
        <CodeBlock code={FORMULA} language="text" />
      </div>

      {/* ─── Weight Summary ─── */}
      <h2
        id="weight-breakdown"
        className="mt-10 text-xl font-semibold"
        style={{ color: 'var(--tp-text-primary)' }}
      >
        Weight Breakdown
      </h2>
      <div
        className="mt-4"
        style={{
          border: '1px solid var(--tp-border-subtle)',
          borderRadius: 'var(--radius-md)',
          overflow: 'hidden',
        }}
      >
        <table className="w-full text-sm" style={{ borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--tp-surface-2)' }}>
              {['Factor', 'Variable', 'Weight'].map((h) => (
                <th
                  key={h}
                  className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                  style={{
                    color: 'var(--tp-text-muted)',
                    borderBottom: '1px solid var(--tp-border-subtle)',
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {FACTORS.map((f, i) => (
              <tr
                key={f.name}
                style={{
                  background:
                    i % 2 === 0
                      ? 'var(--tp-surface-1)'
                      : 'var(--tp-surface-0)',
                  borderBottom:
                    i < FACTORS.length - 1
                      ? '1px solid var(--tp-border-subtle)'
                      : undefined,
                }}
              >
                <td
                  className="px-4 py-3 font-medium"
                  style={{ color: 'var(--tp-text-primary)' }}
                >
                  {f.name}
                </td>
                <td className="px-4 py-3">
                  <code
                    className="font-mono text-sm"
                    style={{ color: 'var(--tp-accent)' }}
                  >
                    w{i + 1}
                  </code>
                </td>
                <td
                  className="px-4 py-3 font-mono"
                  style={{ color: 'var(--tp-text-secondary)' }}
                >
                  {f.weight.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ─── Factor Details ─── */}
      <h2
        id="factor-details"
        className="mt-10 text-xl font-semibold"
        style={{ color: 'var(--tp-text-primary)' }}
      >
        Factor Details
      </h2>
      <p
        className="mt-2 mb-4 text-sm"
        style={{ color: 'var(--tp-text-secondary)' }}
      >
        Each factor produces a sub-score from 0 to 100 before weighting:
      </p>

      <div className="flex flex-col gap-6">
        {FACTORS.map((factor) => (
          <div
            key={factor.name}
            style={{
              padding: 20,
              background: 'var(--tp-surface-1)',
              border: '1px solid var(--tp-border-subtle)',
              borderRadius: 'var(--radius-md)',
            }}
          >
            <div className="flex items-center justify-between">
              <h3
                id={factor.name.toLowerCase().replace(/\s+/g, '-')}
                className="text-base font-semibold"
                style={{ color: 'var(--tp-text-primary)', margin: 0 }}
              >
                {factor.name}
              </h3>
              <span
                className="rounded-full px-2.5 py-0.5 text-xs font-semibold"
                style={{
                  background: 'rgba(99,102,241,0.12)',
                  color: 'var(--tp-accent)',
                }}
              >
                {(factor.weight * 100).toFixed(0)}%
              </span>
            </div>
            <p
              className="mt-2 text-sm leading-relaxed"
              style={{ color: 'var(--tp-text-secondary)', margin: 0 }}
            >
              {factor.description}
            </p>
            <ul
              className="mt-3 flex flex-col gap-1 text-sm"
              style={{
                color: 'var(--tp-text-secondary)',
                paddingLeft: 20,
                margin: 0,
              }}
            >
              {factor.scoring.map((s) => (
                <li key={s}>
                  <code
                    className="text-xs"
                    style={{ color: 'var(--tp-text-muted)' }}
                  >
                    {s.split(':')[0]}:
                  </code>{' '}
                  {s.split(':').slice(1).join(':').trim()}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* ─── Tier Thresholds ─── */}
      <h2
        id="tier-thresholds"
        className="mt-10 text-xl font-semibold"
        style={{ color: 'var(--tp-text-primary)' }}
      >
        Tier Thresholds
      </h2>
      <p
        className="mt-2 mb-4 text-sm"
        style={{ color: 'var(--tp-text-secondary)' }}
      >
        Health scores map to four human-readable tiers:
      </p>
      <div className="flex flex-col gap-3">
        {TIERS.map((tier) => (
          <div
            key={tier.label}
            className="flex items-start gap-4"
            style={{
              padding: '14px 16px',
              background: tier.bgColor,
              borderRadius: 'var(--radius-md)',
              borderLeft: `4px solid ${tier.color}`,
            }}
          >
            <div>
              <div className="flex items-center gap-2">
                <span
                  className="text-sm font-bold"
                  style={{ color: tier.color }}
                >
                  {tier.label}
                </span>
                <span
                  className="font-mono text-xs"
                  style={{ color: 'var(--tp-text-muted)' }}
                >
                  {tier.range}
                </span>
              </div>
              <p
                className="mt-1 text-sm leading-relaxed"
                style={{ color: 'var(--tp-text-secondary)', margin: 0 }}
              >
                {tier.description}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* ─── Search Impact ─── */}
      <h2
        id="search-impact"
        className="mt-10 text-xl font-semibold"
        style={{ color: 'var(--tp-text-primary)' }}
      >
        How Health Affects Search
      </h2>
      <p
        className="mt-2 text-sm leading-relaxed"
        style={{ color: 'var(--tp-text-secondary)' }}
      >
        Health scores influence search results in two ways:
      </p>
      <ul
        className="mt-3 flex flex-col gap-2 text-sm"
        style={{ color: 'var(--tp-text-secondary)', paddingLeft: 20 }}
      >
        <li>
          <strong style={{ color: 'var(--tp-text-primary)' }}>
            Stage 3 boost:
          </strong>{' '}
          During graph reranking, tools with higher health scores receive a
          slight boost to their final ranking score. This means healthier tools
          surface higher when relevance is otherwise equal.
        </li>
        <li>
          <strong style={{ color: 'var(--tp-text-primary)' }}>
            Result display:
          </strong>{' '}
          Health tier and score are included in every tool result returned to
          agents, helping them make informed decisions about tool quality.
        </li>
      </ul>

      <div className="mt-6">
        <Callout type="important" title="Recalculation schedule">
          Health scores are recalculated weekly by the indexer. Each run
          fetches fresh data from GitHub and recomputes all five factors for
          every tool in the graph.
        </Callout>
      </div>

      <PrevNextNav prev={prev} next={next} />
    </div>
  );
}
