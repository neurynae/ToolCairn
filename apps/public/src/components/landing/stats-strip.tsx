'use client';

import { useEffect, useRef, useState } from 'react';
import { useScrollReveal } from '@/hooks/use-scroll-reveal';

const STATS = [
  { value: 12000, suffix: '+', label: 'Tools Indexed' },
  { value: 100, suffix: '%', label: 'Open Source' },
  { value: 14, suffix: '', label: 'MCP Tools' },
  { value: 4, suffix: '-Stage', label: 'Search Pipeline' },
] as const;

function useCountUp(target: number, active: boolean, duration = 1200) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!active) return;
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start = Math.min(start + step, target);
      setCount(Math.floor(start));
      if (start >= target) clearInterval(timer);
    }, 16);
    return () => clearInterval(timer);
  }, [active, target, duration]);

  return count;
}

function StatItem({ value, suffix, label }: { value: number; suffix: string; label: string }) {
  const [active, setActive] = useState(false);
  const ref = useScrollReveal<HTMLDivElement>({ threshold: 0.5 });
  const count = useCountUp(value, active);

  // Activate counter when revealed
  const prevRevealed = useRef(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry?.isIntersecting && !prevRevealed.current) {
          prevRevealed.current = true;
          setActive(true);
        }
      },
      { threshold: 0.5 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [ref]);

  return (
    <div ref={ref} className="scroll-reveal text-center">
      <p className="text-4xl font-extrabold text-slate-900 sm:text-5xl">
        {count.toLocaleString()}
        <span className="text-indigo-600">{suffix}</span>
      </p>
      <p className="mt-1 text-sm font-medium text-slate-500">{label}</p>
    </div>
  );
}

export function StatsStrip() {
  return (
    <section className="border-y border-slate-100 bg-slate-50 px-4 py-16 sm:px-6">
      <div className="mx-auto grid max-w-4xl grid-cols-2 gap-10 sm:grid-cols-4">
        {STATS.map((stat) => (
          <StatItem key={stat.label} {...stat} />
        ))}
      </div>
    </section>
  );
}
