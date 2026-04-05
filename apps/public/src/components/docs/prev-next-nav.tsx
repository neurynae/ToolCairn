'use client';

import Link from 'next/link';

interface NavItem {
  title: string;
  href: string;
}

interface PrevNextNavProps {
  prev: NavItem | null;
  next: NavItem | null;
}

export function PrevNextNav({ prev, next }: PrevNextNavProps) {
  if (!prev && !next) return null;

  return (
    <nav
      className="mt-12 grid gap-4"
      style={{
        gridTemplateColumns: prev && next ? '1fr 1fr' : '1fr',
      }}
      aria-label="Page navigation"
    >
      {prev && <NavCard direction="prev" item={prev} />}
      {next && <NavCard direction="next" item={next} />}
    </nav>
  );
}

interface NavCardProps {
  direction: 'prev' | 'next';
  item: NavItem;
}

function NavCard({ direction, item }: NavCardProps) {
  const isPrev = direction === 'prev';

  return (
    <Link
      href={item.href}
      className="group block rounded-xl p-5 no-underline transition-all"
      style={{
        background: 'var(--tp-surface-1)',
        border: '1px solid var(--tp-border-subtle)',
        borderRadius: 'var(--radius-lg)',
        textAlign: isPrev ? 'left' : 'right',
        textDecoration: 'none',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.borderColor = 'var(--tp-border-emphasis)';
        e.currentTarget.style.boxShadow = '0 4px 24px rgba(99,102,241,0.10)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.borderColor = 'var(--tp-border-subtle)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <span
        className="mb-1 block text-xs font-medium uppercase tracking-wider"
        style={{ color: 'var(--tp-text-muted)' }}
      >
        {isPrev ? '← Previous' : 'Next →'}
      </span>
      <span className="block text-sm font-semibold" style={{ color: 'var(--tp-text-primary)' }}>
        {item.title}
      </span>
    </Link>
  );
}
