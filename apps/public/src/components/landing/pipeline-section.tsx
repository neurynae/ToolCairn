import { ScrollReveal } from './scroll-reveal';

const STAGES = [
  {
    number: 1,
    label: 'Hybrid Search',
    sub: 'BM25 + Vector',
    description: 'Cast a wide net across 12,000+ tools using keyword and semantic search in parallel.',
    accent: 'border-indigo-300 bg-indigo-50 text-indigo-700',
    numBg: 'bg-indigo-600 text-white',
  },
  {
    number: 2,
    label: 'Graph Re-ranking',
    sub: 'Relationship Intelligence',
    description:
      'Leverage ecosystem relationships — integrations, alternatives, co-occurrence signals — to re-rank candidates.',
    accent: 'border-emerald-300 bg-emerald-50 text-emerald-700',
    numBg: 'bg-emerald-600 text-white',
  },
  {
    number: 3,
    label: 'Clarification',
    sub: 'Ask the Right Questions',
    description:
      'When a query is ambiguous, ToolCairn asks targeted follow-up questions to narrow down the perfect match.',
    accent: 'border-amber-300 bg-amber-50 text-amber-700',
    numBg: 'bg-amber-500 text-white',
  },
  {
    number: 4,
    label: 'Final Selection',
    sub: 'Pick the Best',
    description:
      'Return the top 1–2 tools with confidence scores, supporting reasons, and documentation links.',
    accent: 'border-pink-300 bg-pink-50 text-pink-700',
    numBg: 'bg-pink-600 text-white',
  },
] as const;

export function PipelineSection() {
  return (
    <section className="bg-slate-50 px-4 py-24 sm:px-6">
      <div className="mx-auto max-w-5xl">
        <ScrollReveal className="mb-16 text-center">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-indigo-600">
            How it works
          </p>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            The 4-stage search pipeline
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-slate-500">
            Not just keyword search. A multi-stage reasoning system that thinks the way a senior
            engineer would when recommending a tool.
          </p>
        </ScrollReveal>

        <div className="grid gap-6 sm:grid-cols-2">
          {STAGES.map((stage, i) => (
            <ScrollReveal
              key={stage.number}
              delay={(Math.min(i, 3) * 100) as 0 | 100 | 200 | 300}
              className={`rounded-2xl border-2 p-6 ${stage.accent}`}
            >
              <div className="flex items-start gap-4">
                <span
                  className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold ${stage.numBg}`}
                >
                  {stage.number}
                </span>
                <div>
                  <p className="font-semibold text-slate-900">{stage.label}</p>
                  <p className="mb-2 text-xs font-medium opacity-70">{stage.sub}</p>
                  <p className="text-sm leading-relaxed text-slate-600">{stage.description}</p>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
