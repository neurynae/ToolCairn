import Link from 'next/link';
import { GithubIcon, ArrowRightIcon } from 'lucide-react';
import { ScrollReveal } from './scroll-reveal';

export function CtaSection() {
  return (
    <section className="bg-white px-4 py-24 sm:px-6">
      <div className="mx-auto max-w-3xl">
        <ScrollReveal className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 to-violet-700 px-8 py-16 text-center shadow-2xl shadow-indigo-200 sm:px-16">
          {/* Decorative orbs */}
          <div className="pointer-events-none absolute -top-10 -right-10 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-violet-300/20 blur-2xl" />

          <div className="relative z-10">
            <h2 className="mb-4 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              Ready to find your perfect stack?
            </h2>
            <p className="mx-auto mb-10 max-w-lg text-base text-indigo-100">
              Join developers and AI teams who use ToolCairn to make smarter tool decisions — faster.
              Free, open source, and ready in 30 seconds.
            </p>
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Link
                href="/signup"
                className="group inline-flex items-center gap-2 rounded-xl bg-white px-7 py-3.5 text-base font-semibold text-indigo-700 shadow transition-all hover:shadow-lg"
              >
                Create Free Account
                <ArrowRightIcon className="size-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <a
                href="https://github.com/NEURYNAE/ToolCairn"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-7 py-3.5 text-base font-semibold text-white transition-all hover:bg-white/20"
              >
                <GithubIcon className="size-4" />
                View on GitHub
              </a>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
