'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import * as Dialog from '@radix-ui/react-dialog';
import { buildSearchIndex, type SearchEntry } from '@/lib/docs-navigation';

/* ─── helpers ─── */

function groupBy<T>(items: T[], key: (item: T) => string): Record<string, T[]> {
  const groups: Record<string, T[]> = {};
  for (const item of items) {
    const k = key(item);
    (groups[k] ??= []).push(item);
  }
  return groups;
}

function highlightMatch(text: string, query: string): React.ReactNode {
  if (!query) return text;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escaped})`, 'gi');
  const parts = text.split(regex);
  return parts.map((part, i) =>
    regex.test(part) ? (
      <mark
        key={i}
        style={{
          background: 'var(--color-accent-subtle)',
          color: 'var(--color-accent-hover)',
          borderRadius: '2px',
          padding: '0 1px',
        }}
      >
        {part}
      </mark>
    ) : (
      part
    ),
  );
}

/* ─── magnifying glass icon ─── */

function SearchIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx={11} cy={11} r={8} />
      <line x1={21} y1={21} x2={16.65} y2={16.65} />
    </svg>
  );
}

/* ─── trigger button ─── */

interface DocsSearchTriggerProps {
  onClick: () => void;
}

export function DocsSearchTrigger({ onClick }: DocsSearchTriggerProps) {
  const [isMac, setIsMac] = useState(false);

  useEffect(() => {
    setIsMac(navigator.platform?.toUpperCase().includes('MAC') ?? false);
  }, []);

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-2 rounded-md px-3 py-1.5 text-sm transition-colors duration-150"
      style={{
        color: 'var(--color-text-muted)',
        background: 'var(--color-surface-2)',
        border: '1px solid var(--color-border-subtle)',
        minWidth: 200,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'var(--color-border-default)';
        e.currentTarget.style.color = 'var(--color-text-secondary)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--color-border-subtle)';
        e.currentTarget.style.color = 'var(--color-text-muted)';
      }}
    >
      <SearchIcon size={14} />
      <span className="flex-1 text-left">Search docs...</span>
      <kbd
        className="hidden items-center gap-0.5 rounded px-1.5 py-0.5 font-mono text-xs sm:flex"
        style={{
          background: 'var(--color-surface-3)',
          color: 'var(--color-text-muted)',
          border: '1px solid var(--color-border-subtle)',
        }}
      >
        {isMac ? '⌘' : 'Ctrl'}K
      </kbd>
    </button>
  );
}

/* ─── main dialog ─── */

export function DocsSearch() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const searchIndex = useMemo(() => buildSearchIndex(), []);

  const filtered = useMemo(() => {
    if (!query.trim()) return searchIndex;
    const q = query.toLowerCase();
    return searchIndex.filter(
      (entry) =>
        entry.title.toLowerCase().includes(q) ||
        entry.section.toLowerCase().includes(q) ||
        entry.description.toLowerCase().includes(q),
    );
  }, [query, searchIndex]);

  const grouped = useMemo(() => groupBy(filtered, (e) => e.section), [filtered]);
  const flatResults = useMemo(() => Object.values(grouped).flat(), [grouped]);

  // Reset active index when results change
  useEffect(() => {
    setActiveIndex(0);
  }, [filtered]);

  // Scroll active item into view
  useEffect(() => {
    const activeEl = listRef.current?.querySelector('[data-active="true"]');
    activeEl?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  const navigate = useCallback(
    (href: string) => {
      setOpen(false);
      setQuery('');
      router.push(href);
    },
    [router],
  );

  // ⌘K / Ctrl+K global shortcut
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  function handleKeyDown(e: React.KeyboardEvent) {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveIndex((prev) => (prev + 1) % flatResults.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveIndex((prev) => (prev - 1 + flatResults.length) % flatResults.length);
        break;
      case 'Enter':
        e.preventDefault();
        if (flatResults[activeIndex]) {
          navigate(flatResults[activeIndex].href);
        }
        break;
    }
  }

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (!nextOpen) setQuery('');
  }

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <DocsSearchTrigger onClick={() => setOpen(true)} />

      <Dialog.Portal>
        <Dialog.Overlay
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)',
            zIndex: 100,
            animation: 'fade-in 150ms ease-out',
          }}
        />
        <Dialog.Content
          aria-label="Search documentation"
          onKeyDown={handleKeyDown}
          onOpenAutoFocus={(e) => {
            e.preventDefault();
            inputRef.current?.focus();
          }}
          style={{
            position: 'fixed',
            top: '15%',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '100%',
            maxWidth: 512,
            maxHeight: 'min(70vh, 520px)',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: 'var(--color-surface-1)',
            border: '1px solid var(--color-border-default)',
            borderRadius: 'var(--radius-lg)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
            zIndex: 101,
            overflow: 'hidden',
            animation: 'dialog-in 150ms ease-out',
          }}
        >
          {/* Search input */}
          <div
            className="flex items-center gap-3 px-4"
            style={{
              borderBottom: '1px solid var(--color-border-subtle)',
              height: 52,
              flexShrink: 0,
            }}
          >
            <SearchIcon size={18} />
            <Dialog.Title className="sr-only">Search documentation</Dialog.Title>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search docs..."
              className="flex-1 bg-transparent text-sm outline-none"
              style={{
                color: 'var(--color-text-primary)',
                caretColor: 'var(--color-accent)',
              }}
            />
            <kbd
              className="hidden items-center rounded px-1.5 py-0.5 font-mono text-xs sm:flex"
              style={{
                background: 'var(--color-surface-3)',
                color: 'var(--color-text-muted)',
                border: '1px solid var(--color-border-subtle)',
              }}
            >
              Esc
            </kbd>
          </div>

          {/* Results list */}
          <div
            ref={listRef}
            className="flex-1 overflow-y-auto"
            style={{ padding: '8px' }}
          >
            {flatResults.length === 0 ? (
              <div
                className="flex flex-col items-center justify-center py-12 text-sm"
                style={{ color: 'var(--color-text-muted)' }}
              >
                <SearchIcon size={32} />
                <p className="mt-3">No results found</p>
                <p className="mt-1 text-xs">Try a different search term</p>
              </div>
            ) : (
              Object.entries(grouped).map(([section, entries]) => (
                <div key={section} className="mb-2">
                  <div
                    className="px-2 py-1.5 text-xs font-semibold uppercase tracking-wider"
                    style={{ color: 'var(--color-text-muted)' }}
                  >
                    {section}
                  </div>
                  {entries.map((entry) => {
                    const globalIndex = flatResults.indexOf(entry);
                    const isActive = globalIndex === activeIndex;
                    return (
                      <button
                        key={entry.href}
                        type="button"
                        data-active={isActive}
                        onClick={() => navigate(entry.href)}
                        onMouseEnter={() => setActiveIndex(globalIndex)}
                        className="flex w-full items-start gap-3 rounded-md px-3 py-2.5 text-left transition-colors duration-100"
                        style={{
                          background: isActive
                            ? 'var(--color-surface-3)'
                            : 'transparent',
                          cursor: 'pointer',
                        }}
                      >
                        <div className="min-w-0 flex-1">
                          <div
                            className="flex items-center gap-2 text-sm font-medium"
                            style={{
                              color: isActive
                                ? 'var(--color-text-primary)'
                                : 'var(--color-text-secondary)',
                            }}
                          >
                            <span>{highlightMatch(entry.title, query)}</span>
                            <span
                              className="shrink-0 rounded px-1.5 py-0.5 text-xs"
                              style={{
                                background: 'var(--color-accent-subtle)',
                                color: 'var(--color-accent)',
                              }}
                            >
                              {entry.section}
                            </span>
                          </div>
                          {entry.description && (
                            <p
                              className="mt-0.5 text-xs leading-relaxed"
                              style={{ color: 'var(--color-text-muted)' }}
                            >
                              {highlightMatch(entry.description, query)}
                            </p>
                          )}
                        </div>
                        {isActive && (
                          <span
                            className="mt-0.5 shrink-0 text-xs"
                            style={{ color: 'var(--color-text-muted)' }}
                          >
                            ↵
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              ))
            )}
          </div>

          {/* Footer hints */}
          <div
            className="flex items-center gap-4 px-4 text-xs"
            style={{
              borderTop: '1px solid var(--color-border-subtle)',
              height: 40,
              flexShrink: 0,
              color: 'var(--color-text-muted)',
            }}
          >
            <span className="flex items-center gap-1">
              <kbd
                className="inline-flex items-center rounded px-1 py-0.5 font-mono text-xs"
                style={{
                  background: 'var(--color-surface-3)',
                  border: '1px solid var(--color-border-subtle)',
                }}
              >
                ↑↓
              </kbd>
              navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd
                className="inline-flex items-center rounded px-1 py-0.5 font-mono text-xs"
                style={{
                  background: 'var(--color-surface-3)',
                  border: '1px solid var(--color-border-subtle)',
                }}
              >
                ↵
              </kbd>
              open
            </span>
            <span className="flex items-center gap-1">
              <kbd
                className="inline-flex items-center rounded px-1 py-0.5 font-mono text-xs"
                style={{
                  background: 'var(--color-surface-3)',
                  border: '1px solid var(--color-border-subtle)',
                }}
              >
                esc
              </kbd>
              close
            </span>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
