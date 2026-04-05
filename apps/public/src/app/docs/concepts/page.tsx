import { Breadcrumbs } from '@/components/docs/breadcrumbs';
import { PrevNextNav } from '@/components/docs/prev-next-nav';
import { getPrevNext } from '@/lib/docs-navigation';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Core Concepts – ToolPilot Docs',
  description:
    'Understand the graph mesh, search pipeline, health scoring, and feedback systems that power ToolPilot.',
};

const CURRENT_HREF = '/docs/concepts';

const concepts = [
  {
    title: 'Tool Graph Mesh',
    href: '/docs/concepts/graph-mesh',
    icon: '🕸️',
    description:
      'A Memgraph-powered property graph of 491+ developer tools and their relationships — nodes, edges, and the ecosystem they form.',
  },
  {
    title: 'Search Pipeline',
    href: '/docs/concepts/search-pipeline',
    icon: '🔍',
    description:
      'The 4-stage discovery engine: hybrid retrieval, context filtering, graph reranking, and intelligent selection.',
  },
  {
    title: 'Health Tiers',
    href: '/docs/concepts/health-tiers',
    icon: '💚',
    description:
      'How ToolPilot scores tool maintenance health across four tiers — from Excellent to Poor — using GitHub signals.',
  },
  {
    title: 'Guided Discovery',
    href: '/docs/concepts/guided-discovery',
    icon: '🧭',
    description:
      'The clarification engine that asks the right questions to narrow ambiguous queries before committing to results.',
  },
  {
    title: 'Edge Decay',
    href: '/docs/concepts/edge-decay',
    icon: '⏳',
    description:
      'Temporal weight decay ensures relationships stay current — stale edges fade while active ones stay strong.',
  },
  {
    title: 'Feedback Loop',
    href: '/docs/concepts/feedback-loop',
    icon: '🔄',
    description:
      'How outcome reports from agents reinforce or attenuate graph edges, creating a self-improving recommendation system.',
  },
] as const;

export default function ConceptsOverviewPage() {
  const { prev, next } = getPrevNext(CURRENT_HREF);

  return (
    <>
      <Breadcrumbs items={[{ label: 'Docs', href: '/docs' }, { label: 'Core Concepts' }]} />

      <div className="space-y-8">
        {/* ─── Header ─── */}
        <section className="mt-4">
          <h1
            className="text-3xl font-bold tracking-tight"
            style={{ color: 'var(--tp-text-primary)' }}
          >
            Core Concepts
          </h1>
          <p
            className="mt-3 max-w-2xl text-base"
            style={{ color: 'var(--tp-text-secondary)', lineHeight: 1.7 }}
          >
            ToolPilot is more than a search engine — it&rsquo;s a graph-powered intelligence layer
            for developer tools. These pages explain the data model, algorithms, and feedback
            systems that make it work.
          </p>
        </section>

        {/* ─── Concept Cards Grid ─── */}
        <section>
          <div
            className="grid gap-4"
            style={{
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            }}
          >
            {concepts.map((concept) => (
              <Link
                key={concept.href}
                href={concept.href}
                className="glass-card group flex flex-col gap-3"
                style={{ padding: 24, textDecoration: 'none' }}
              >
                <div className="flex items-center gap-3">
                  <span
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-lg"
                    style={{
                      background: 'var(--tp-surface-3)',
                      border: '1px solid var(--tp-border-subtle)',
                    }}
                  >
                    {concept.icon}
                  </span>
                  <h2
                    className="text-base font-semibold"
                    style={{ color: 'var(--tp-text-primary)' }}
                  >
                    {concept.title}
                  </h2>
                </div>
                <p
                  className="text-sm leading-relaxed"
                  style={{ color: 'var(--tp-text-secondary)' }}
                >
                  {concept.description}
                </p>
                <span
                  className="mt-auto inline-flex items-center gap-1 text-xs font-medium transition-transform duration-200 group-hover:translate-x-1"
                  style={{ color: 'var(--tp-accent)' }}
                >
                  Learn more →
                </span>
              </Link>
            ))}
          </div>
        </section>
      </div>

      <div className="mt-16">
        <PrevNextNav prev={prev} next={next} />
      </div>
    </>
  );
}
