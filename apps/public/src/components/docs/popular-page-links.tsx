'use client';

import Link from 'next/link';

interface PopularPageLinksProps {
  pages: ReadonlyArray<{ title: string; href: string }>;
}

export function PopularPageLinks({ pages }: PopularPageLinksProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {pages.map((page) => (
        <Link
          key={page.href}
          href={page.href}
          className="rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-150"
          style={{
            background: 'var(--color-surface-2)',
            color: 'var(--color-text-secondary)',
            border: '1px solid var(--color-border-subtle)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--color-accent)';
            e.currentTarget.style.color = 'var(--color-text-primary)';
            e.currentTarget.style.background = 'var(--color-surface-3)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--color-border-subtle)';
            e.currentTarget.style.color = 'var(--color-text-secondary)';
            e.currentTarget.style.background = 'var(--color-surface-2)';
          }}
        >
          {page.title}
        </Link>
      ))}
    </div>
  );
}
