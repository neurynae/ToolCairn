import { SearchIcon, BarChart2Icon, LayersIcon } from 'lucide-react';
import { ScrollReveal } from './scroll-reveal';

const PROPS = [
  {
    icon: SearchIcon,
    color: 'bg-indigo-100 text-indigo-700',
    title: 'Find',
    description:
      'Multi-stage search combining BM25 keyword matching, vector embeddings, and graph re-ranking to surface the best tool — not just the most popular one.',
  },
  {
    icon: BarChart2Icon,
    color: 'bg-violet-100 text-violet-700',
    title: 'Compare',
    description:
      'Side-by-side health metrics, commit activity, dependency signals, and compatibility checks let you make informed decisions in seconds.',
  },
  {
    icon: LayersIcon,
    color: 'bg-sky-100 text-sky-700',
    title: 'Build',
    description:
      'Describe your project once. Get a curated, opinionated stack recommendation tailored to your constraints, language, and scale.',
  },
] as const;

export function ValueProps() {
  return (
    <section className="bg-white px-4 py-24 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <ScrollReveal className="mb-14 text-center">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-indigo-600">
            What you get
          </p>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Intelligence at every step
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-slate-500">
            From the first search to the final decision, ToolCairn brings graph-powered reasoning to
            every part of your tool selection process.
          </p>
        </ScrollReveal>

        <div className="scroll-stagger grid gap-8 sm:grid-cols-3">
          {PROPS.map(({ icon: Icon, color, title, description }, i) => (
            <ScrollReveal
              key={title}
              delay={(i * 100) as 0 | 100 | 200}
              className="rounded-2xl border border-slate-100 bg-slate-50/60 p-8 text-center shadow-sm"
            >
              <div className={`mx-auto mb-5 inline-flex rounded-xl p-3 ${color}`}>
                <Icon className="size-6" />
              </div>
              <h3 className="mb-2 text-xl font-bold text-slate-900">{title}</h3>
              <p className="text-sm leading-relaxed text-slate-500">{description}</p>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
