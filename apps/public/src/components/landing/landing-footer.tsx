import Link from 'next/link';
import { GithubIcon } from 'lucide-react';
import { Logo } from '@/components/ui/logo';

const LINKS = [
  { href: '/explore', label: 'Explore' },
  { href: '/docs', label: 'Docs' },
  { href: '/about', label: 'How it Works' },
  { href: '/privacy', label: 'Privacy' },
  { href: '/terms', label: 'Terms' },
] as const;

export function LandingFooter() {
  return (
    <footer className="border-t border-slate-100 bg-white px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
          {/* Brand */}
          <Link href="/" className="flex items-center gap-2.5">
            <Logo variant="wordmark" size="xs" />
          </Link>

          {/* Nav links */}
          <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2">
            {LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-xs text-slate-500 transition-colors hover:text-slate-900"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* GitHub */}
          <a
            href="https://github.com/NEURYNAE/ToolCairn"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-slate-500 transition-colors hover:text-slate-900"
          >
            <GithubIcon className="size-3.5" />
            NEURYNAE/ToolCairn
          </a>
        </div>
        <p className="mt-6 text-center text-xs text-slate-400">
          © {new Date().getFullYear()} NEURYNAE. Open source under MIT license.
        </p>
      </div>
    </footer>
  );
}
