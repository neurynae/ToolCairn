import type { Metadata } from 'next';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/docs/breadcrumbs';
import { PrevNextNav } from '@/components/docs/prev-next-nav';
import { getPrevNext } from '@/lib/docs-navigation';

export const metadata: Metadata = {
  title: 'Guides — ToolPilot Docs',
  description:
    'Step-by-step guides for searching tools, diagnosing issues, building stacks, and providing rich context.',
};

const GUIDES = [
  {
    title: 'Complete Search Walkthrough',
    href: '/docs/guides/search-walkthrough',
    description:
      'Follow a search from query to outcome — learn every step of the discovery flow.',
    difficulty: 'Beginner',
    time: '10 min',
    icon: '🔍',
  },
  {
    title: 'Issue Diagnosis',
    href: '/docs/guides/issue-diagnosis',
    description:
      'Use check_issue to debug tool problems, interpret confidence scores, and find alternatives.',
    difficulty: 'Intermediate',
    time: '8 min',
    icon: '🩺',
  },
  {
    title: 'Stack Building',
    href: '/docs/guides/stack-building',
    description:
      'Build compatible tool sets with get_stack — powered by graph relationships.',
    difficulty: 'Intermediate',
    time: '8 min',
    icon: '🧱',
  },
  {
    title: 'Rich Context',
    href: '/docs/guides/rich-context',
    description:
      'Skip clarification rounds by providing context filters upfront for faster results.',
    difficulty: 'Advanced',
    time: '5 min',
    icon: '⚡',
  },
] as const;

const DIFFICULTY_COLORS: Record<string, string> = {
  Beginner: '#22c55e',
  Intermediate: '#6366f1',
  Advanced: '#f59e0b',
};

export default function GuidesPage() {
  const { prev, next } = getPrevNext('/docs/guides');

  return (
    <div style={{ maxWidth: 768, margin: '0 auto' }}>
      <Breadcrumbs
        items={[
          { label: 'Docs', href: '/docs' },
          { label: 'Guides' },
        ]}
      />

      {/* ─── Header ─── */}
      <header style={{ marginTop: 24, marginBottom: 48 }}>
        <h1
          className="text-3xl font-bold tracking-tight sm:text-4xl"
          style={{ color: 'var(--color-text-primary)', lineHeight: 1.2 }}
        >
          Guides
        </h1>
        <p
          className="mt-3 text-base sm:text-lg"
          style={{ color: 'var(--color-text-secondary)', lineHeight: 1.6 }}
        >
          Hands-on tutorials that walk you through real workflows — from your first
          search to building production-ready tool stacks.
        </p>
      </header>

      {/* ─── Guide Cards Grid ─── */}
      <div
        className="grid gap-5"
        style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}
      >
        {GUIDES.map((guide) => (
          <Link
            key={guide.href}
            href={guide.href}
            className="group flex flex-col gap-3 rounded-xl p-6 no-underline transition-all"
            style={{
              background: 'var(--color-surface-1)',
              border: '1px solid var(--color-border-subtle)',
              borderRadius: 'var(--radius-lg)',
              textDecoration: 'none',
            }}
          >
            <div className="flex items-center justify-between">
              <span
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-xl"
                style={{
                  background: 'var(--color-surface-3)',
                  border: '1px solid var(--color-border-subtle)',
                }}
              >
                {guide.icon}
              </span>
              <div className="flex items-center gap-2">
                <span
                  className="rounded-full px-2.5 py-0.5 text-xs font-semibold"
                  style={{
                    color: DIFFICULTY_COLORS[guide.difficulty],
                    background: `${DIFFICULTY_COLORS[guide.difficulty]}15`,
                    border: `1px solid ${DIFFICULTY_COLORS[guide.difficulty]}30`,
                  }}
                >
                  {guide.difficulty}
                </span>
                <span
                  className="text-xs font-medium"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  {guide.time}
                </span>
              </div>
            </div>

            <h2
              className="text-base font-semibold"
              style={{ color: 'var(--color-text-primary)' }}
            >
              {guide.title}
            </h2>

            <p
              className="text-sm leading-relaxed"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              {guide.description}
            </p>

            <span
              className="mt-auto text-sm font-medium transition-colors"
              style={{ color: 'var(--color-accent)' }}
            >
              Read guide →
            </span>
          </Link>
        ))}
      </div>

      <PrevNextNav prev={prev} next={next} />
    </div>
  );
}
