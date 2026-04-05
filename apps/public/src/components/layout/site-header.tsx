'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { GithubIcon, SearchIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from './theme-toggle';
import { MobileNav } from './mobile-nav';
import { cn } from '@/lib/utils';

const NAV_LINKS = [
  { href: '/explore', label: 'Explore' },
  { href: '/compare', label: 'Compare' },
  { href: '/stack', label: 'Stack Builder' },
  { href: '/docs', label: 'Docs' },
] as const;

interface SiteHeaderProps {
  onOpenSearch?: () => void;
}

export function SiteHeader({ onOpenSearch }: SiteHeaderProps) {
  const pathname = usePathname();

  return (
    <header className="nav-border-gradient sticky top-0 z-50 w-full bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
        {/* Logo */}
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2 text-sm font-semibold tracking-tight text-foreground"
        >
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-[var(--tp-accent)] to-[var(--tp-accent-secondary)] text-xs font-extrabold text-white shadow-sm">
            T
          </span>
          ToolCairn
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden items-center gap-1 sm:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                pathname === link.href || pathname.startsWith(`${link.href}/`)
                  ? 'bg-muted text-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Right side actions */}
        <div className="flex items-center gap-1.5">
          {/* Cmd+K search trigger */}
          {onOpenSearch && (
            <Button
              variant="outline"
              size="sm"
              className="hidden items-center gap-2 text-muted-foreground sm:flex"
              onClick={onOpenSearch}
              aria-label="Open search"
            >
              <SearchIcon className="size-3.5" />
              <span className="hidden text-xs md:inline">Search...</span>
              <kbd className="hidden rounded border border-border bg-muted px-1.5 text-xs md:inline">
                ⌘K
              </kbd>
            </Button>
          )}

          {/* Theme toggle */}
          <div className="hidden sm:block">
            <ThemeToggle />
          </div>

          {/* GitHub */}
          <Button
            variant="outline"
            size="sm"
            className="hidden items-center gap-1.5 sm:flex"
            nativeButton={false} render={<a href="https://github.com/NEURYNAE/ToolCairn" target="_blank" rel="noopener noreferrer" />}
          >
            <GithubIcon className="size-3.5" />
            GitHub
          </Button>

          {/* Mobile nav */}
          <MobileNav onOpenSearch={onOpenSearch} />
        </div>
      </div>
    </header>
  );
}
