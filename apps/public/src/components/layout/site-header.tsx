import Link from 'next/link';

const NAV_LINKS = [
  { href: '/docs', label: 'Docs' },
  { href: '/explore', label: 'Explore' },
  { href: '/stack', label: 'Stack Builder' },
  { href: '/about', label: 'How it works' },
] as const;

export function SiteHeader() {
  return (
    <header
      className="nav-border-gradient sticky top-0 z-50 w-full"
      style={{
        backgroundColor: 'rgba(13, 13, 16, 0.85)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}
    >
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 text-base font-semibold tracking-tight"
          style={{ color: 'var(--color-text-primary)' }}
        >
          <span
            className="inline-flex h-7 w-7 items-center justify-center rounded-md text-xs font-extrabold"
            style={{
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              color: '#fff',
              boxShadow: '0 2px 8px rgba(99, 102, 241, 0.35)',
            }}
          >
            T
          </span>
          ToolPilot
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden items-center gap-1 sm:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-md px-3 py-1.5 text-sm font-medium transition-colors duration-150 hover:bg-white/5 hover:text-[var(--color-text-primary)]"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* GitHub CTA */}
        <a
          href="https://github.com/toolpilot"
          target="_blank"
          rel="noopener noreferrer"
          className="hidden items-center gap-1.5 rounded-md border border-white/10 px-3 py-1.5 text-sm font-medium transition-all duration-150 hover:border-white/20 hover:text-[var(--color-text-primary)] sm:flex"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
          </svg>
          GitHub
        </a>
      </div>
    </header>
  );
}
