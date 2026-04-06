import Link from 'next/link';
import Image from 'next/image';
import { ArrowRightIcon, ZapIcon } from 'lucide-react';

export function HeroSection() {
  return (
    <section className="landing-hero-gradient relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 pt-20 pb-24 sm:px-6">
      {/* Subtle grid overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage: `linear-gradient(oklch(0.3 0.15 264) 1px, transparent 1px),
            linear-gradient(90deg, oklch(0.3 0.15 264) 1px, transparent 1px)`,
          backgroundSize: '48px 48px',
        }}
      />

      <div className="relative z-10 mx-auto max-w-4xl text-center">
        {/* Badge */}
        <div className="mb-8 inline-flex animate-fade-up items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-4 py-1.5 text-xs font-semibold text-indigo-700">
          <ZapIcon className="size-3" />
          Graph-powered tool intelligence
        </div>

        {/* Logo / cairn icon */}
        <div className="mx-auto mb-8 animate-fade-up flex items-center justify-center" style={{ animationDelay: '60ms' }}>
          <Image
            src="/logo/icon-192.png"
            alt="ToolCairn"
            width={96}
            height={96}
            className="drop-shadow-xl"
            priority
          />
        </div>

        {/* Heading */}
        <h1
          className="mb-6 animate-fade-up text-5xl font-extrabold tracking-tight text-slate-900 sm:text-6xl lg:text-7xl"
          style={{ animationDelay: '120ms' }}
        >
          Find the right tool
          <span className="block bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
            every single time
          </span>
        </h1>

        {/* Subheading */}
        <p
          className="mx-auto mb-10 animate-fade-up max-w-2xl text-lg text-slate-500 sm:text-xl"
          style={{ animationDelay: '180ms' }}
        >
          ToolCairn searches 12,000+ open source tools using a knowledge graph, semantic search, and
          AI clarification — so your AI agent always recommends the{' '}
          <em className="font-medium not-italic text-slate-700">right</em> tool.
        </p>

        {/* CTAs */}
        <div
          className="animate-fade-up flex flex-col items-center gap-4 sm:flex-row sm:justify-center"
          style={{ animationDelay: '240ms' }}
        >
          <Link
            href="/signup"
            className="group inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-7 py-3.5 text-base font-semibold text-white shadow-lg shadow-indigo-200 transition-all hover:bg-indigo-700 hover:shadow-indigo-300"
          >
            Get Started Free
            <ArrowRightIcon className="size-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
          <Link
            href="/explore"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-7 py-3.5 text-base font-semibold text-slate-700 shadow-sm transition-all hover:border-slate-300 hover:bg-slate-50"
          >
            Explore Tools
          </Link>
        </div>

        {/* Social proof micro-line */}
        <p
          className="animate-fade-up mt-8 text-xs text-slate-400"
          style={{ animationDelay: '300ms' }}
        >
          Free to use · No credit card · Open source
        </p>
      </div>

      {/* Decorative blur orbs */}
      <div className="pointer-events-none absolute -top-20 left-1/4 h-72 w-72 rounded-full bg-indigo-200/40 blur-3xl" />
      <div className="pointer-events-none absolute bottom-10 right-1/4 h-56 w-56 rounded-full bg-violet-200/30 blur-3xl" />
    </section>
  );
}
