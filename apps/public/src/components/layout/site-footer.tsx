'use client';

import Link from 'next/link';

const FOOTER_LINKS = [
  { href: '/docs', label: 'Documentation' },
  { href: '/explore', label: 'Explore Tools' },
  { href: '/stack', label: 'Stack Builder' },
  { href: '/about', label: 'How it Works' },
] as const;

export function SiteFooter() {
  return (
    <footer className="w-full py-10" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 px-4 sm:flex-row sm:px-6">
        {/* Brand */}
        <div className="flex flex-col items-center gap-1 sm:items-start">
          <Link
            href="/"
            className="text-sm font-semibold"
            style={{ color: 'var(--color-text-primary)' }}
          >
            ToolPilot
          </Link>
          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
            Graph-powered tool intelligence
          </p>
        </div>

        {/* Nav links */}
        <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
          {FOOTER_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-xs transition-colors duration-150"
              style={{ color: 'var(--color-text-muted)' }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.color = 'var(--color-text-secondary)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.color = 'var(--color-text-muted)';
              }}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Copy */}
        <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
          © {new Date().getFullYear()} ToolPilot
        </p>
      </div>
    </footer>
  );
}
