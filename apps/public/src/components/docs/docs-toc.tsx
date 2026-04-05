'use client';

import { useCallback, useEffect, useState } from 'react';

interface TocHeading {
  id: string;
  text: string;
  level: 2 | 3;
}

interface DocsTocProps {
  headings: TocHeading[];
}

export function DocsToc({ headings }: DocsTocProps) {
  const [activeId, setActiveId] = useState<string>('');

  useEffect(() => {
    if (headings.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

        const first = visible[0];
        if (first) {
          setActiveId(first.target.id);
        }
      },
      { rootMargin: '-80px 0px -60% 0px', threshold: 0.1 },
    );

    const elements = headings
      .map((h) => document.getElementById(h.id))
      .filter(Boolean) as HTMLElement[];

    for (const el of elements) {
      observer.observe(el);
    }

    return () => observer.disconnect();
  }, [headings]);

  const handleClick = useCallback((id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  if (headings.length === 0) return null;

  return (
    <nav
      className="sticky top-24"
      style={{ maxHeight: 'calc(100vh - 120px)', overflowY: 'auto' }}
      aria-label="Table of contents"
    >
      <p
        className="mb-3 text-xs font-semibold uppercase tracking-wider"
        style={{ color: 'var(--tp-text-muted)', margin: 0, marginBottom: '12px' }}
      >
        On this page
      </p>

      <ul className="flex flex-col gap-0.5" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
        {headings.map((heading) => {
          const isActive = activeId === heading.id;

          return (
            <li key={heading.id} style={{ margin: 0 }}>
              <button
                type="button"
                onClick={() => handleClick(heading.id)}
                className="block w-full text-left text-sm transition-colors"
                style={{
                  paddingLeft: heading.level === 3 ? '16px' : '0',
                  paddingTop: '4px',
                  paddingBottom: '4px',
                  fontSize: '14px',
                  lineHeight: '1.5',
                  color: isActive ? 'var(--tp-accent)' : 'var(--tp-text-muted)',
                  fontWeight: isActive ? 500 : 400,
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  borderLeft: isActive ? '2px solid var(--tp-accent)' : '2px solid transparent',
                  paddingInlineStart: heading.level === 3 ? '16px' : '8px',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.color = 'var(--tp-text-secondary)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.color = 'var(--tp-text-muted)';
                  }
                }}
              >
                {heading.text}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
