import type { Metadata } from 'next';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/docs/breadcrumbs';
import { PrevNextNav } from '@/components/docs/prev-next-nav';
import { getPrevNext } from '@/lib/docs-navigation';

export const metadata: Metadata = {
  title: 'Reference – ToolPilot Docs',
  description:
    'Technical reference for ToolPilot — graph schema, health scoring formula, and more.',
};

const CARDS = [
  {
    icon: '🔗',
    title: 'Graph Schema',
    description:
      'Complete reference for all node types, edge types, and their properties in the Memgraph tool graph.',
    href: '/docs/reference/graph-schema',
  },
  {
    icon: '💚',
    title: 'Health Formula',
    description:
      'Detailed breakdown of the health scoring formula, weight factors, tier thresholds, and how scores influence search.',
    href: '/docs/reference/health-formula',
  },
] as const;

export default function ReferencePage() {
  const { prev, next } = getPrevNext('/docs/reference');

  return (
    <div>
      <Breadcrumbs
        items={[
          { label: 'Docs', href: '/docs' },
          { label: 'Reference' },
        ]}
      />

      <h1
        className="mt-4 text-3xl font-bold tracking-tight"
        style={{ color: 'var(--tp-text-primary)' }}
      >
        Reference
      </h1>
      <p
        className="mt-3 text-base leading-relaxed"
        style={{ color: 'var(--tp-text-secondary)' }}
      >
        Technical reference material for the ToolPilot platform — schema
        definitions, scoring formulas, and data dictionaries.
      </p>

      {/* ─── Card Grid ─── */}
      <div
        className="mt-8 grid gap-4"
        style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}
      >
        {CARDS.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="group flex flex-col gap-3"
            style={{
              padding: 24,
              background: 'var(--tp-surface-1)',
              border: '1px solid var(--tp-border-subtle)',
              borderRadius: 'var(--radius-lg)',
              textDecoration: 'none',
              transition: 'border-color 0.2s, box-shadow 0.2s',
            }}
          >
            <div className="flex items-center gap-3">
              <span
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-lg"
                style={{
                  background: 'var(--tp-surface-3)',
                  border: '1px solid var(--tp-border-subtle)',
                }}
              >
                {card.icon}
              </span>
              <h2
                className="text-base font-semibold"
                style={{ color: 'var(--tp-text-primary)' }}
              >
                {card.title}
              </h2>
            </div>
            <p
              className="text-sm leading-relaxed"
              style={{ color: 'var(--tp-text-secondary)' }}
            >
              {card.description}
            </p>
          </Link>
        ))}
      </div>

      <PrevNextNav prev={prev} next={next} />
    </div>
  );
}
