import type { Metadata } from 'next';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/docs/breadcrumbs';
import { PrevNextNav } from '@/components/docs/prev-next-nav';
import { getPrevNext } from '@/lib/docs-navigation';

export const metadata: Metadata = {
  title: 'Architecture – ToolPilot Docs',
  description:
    'Explore the ToolPilot system architecture, data flow, and contributing guide.',
};

const CARDS = [
  {
    icon: '🗺️',
    title: 'System Overview',
    description:
      'High-level component diagram showing how apps, packages, and infrastructure fit together.',
    href: '/docs/architecture/overview',
  },
  {
    icon: '🔀',
    title: 'Data Flow',
    description:
      'Read path (query processing), write path (data ingestion), and feedback loop explained step-by-step.',
    href: '/docs/architecture/data-flow',
  },
  {
    icon: '🤝',
    title: 'Contributing',
    description:
      'Dev environment setup, project structure, coding standards, and commit conventions.',
    href: '/docs/architecture/contributing',
  },
] as const;

export default function ArchitecturePage() {
  const { prev, next } = getPrevNext('/docs/architecture');

  return (
    <div>
      <Breadcrumbs
        items={[
          { label: 'Docs', href: '/docs' },
          { label: 'Architecture' },
        ]}
      />

      <h1
        className="mt-4 text-3xl font-bold tracking-tight"
        style={{ color: 'var(--color-text-primary)' }}
      >
        Architecture
      </h1>
      <p
        className="mt-3 text-base leading-relaxed"
        style={{ color: 'var(--color-text-secondary)' }}
      >
        Understand how ToolPilot is built — from the monorepo layout and
        infrastructure services to the data pipelines that power tool
        intelligence.
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
              background: 'var(--color-surface-1)',
              border: '1px solid var(--color-border-subtle)',
              borderRadius: 'var(--radius-lg)',
              textDecoration: 'none',
              transition: 'border-color 0.2s, box-shadow 0.2s',
            }}
          >
            <div className="flex items-center gap-3">
              <span
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-lg"
                style={{
                  background: 'var(--color-surface-3)',
                  border: '1px solid var(--color-border-subtle)',
                }}
              >
                {card.icon}
              </span>
              <h2
                className="text-base font-semibold"
                style={{ color: 'var(--color-text-primary)' }}
              >
                {card.title}
              </h2>
            </div>
            <p
              className="text-sm leading-relaxed"
              style={{ color: 'var(--color-text-secondary)' }}
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
