'use client';

import { docsNavigation } from '@/lib/docs-navigation';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

interface DocsSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DocsSidebar({ isOpen, onClose }: DocsSidebarProps) {
  const pathname = usePathname();

  const isSectionActive = useCallback(
    (sectionPages: { href: string }[]) => sectionPages.some((page) => pathname === page.href),
    [pathname],
  );

  const [expanded, setExpanded] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    for (const section of docsNavigation) {
      initial[section.title] = isSectionActive(section.pages);
    }
    return initial;
  });

  // Keep active section expanded on navigation
  useEffect(() => {
    setExpanded((prev) => {
      const next = { ...prev };
      for (const section of docsNavigation) {
        if (isSectionActive(section.pages)) {
          next[section.title] = true;
        }
      }
      return next;
    });
  }, [isSectionActive]);

  // Close mobile drawer on navigation
  // biome-ignore lint/correctness/useExhaustiveDependencies: pathname triggers close on route change
  useEffect(() => {
    onClose();
  }, [pathname, onClose]);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [isOpen]);

  const toggleSection = (title: string) => {
    setExpanded((prev) => ({ ...prev, [title]: !prev[title] }));
  };

  const sidebarContent = (
    <nav
      aria-label="Documentation navigation"
      style={{ display: 'flex', flexDirection: 'column', height: '100%' }}
    >
      {/* Logo / title */}
      <div style={{ padding: '20px 20px 16px' }}>
        <Link
          href="/docs"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            textDecoration: 'none',
            color: 'var(--tp-text-primary)',
          }}
        >
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '26px',
              height: '26px',
              borderRadius: 'var(--radius-sm)',
              background: 'linear-gradient(135deg, #6366f1, #818cf8)',
              color: '#fff',
              fontSize: '12px',
              fontWeight: 700,
            }}
          >
            T
          </span>
          <span style={{ fontSize: '15px', fontWeight: 600, letterSpacing: '-0.01em' }}>
            ToolPilot Docs
          </span>
        </Link>
      </div>

      {/* Section list */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '0 12px 24px',
        }}
      >
        {docsNavigation.map((section) => {
          const isExpanded = expanded[section.title] ?? false;
          const hasActive = isSectionActive(section.pages);

          return (
            <div key={section.title} style={{ marginBottom: '4px' }}>
              {/* Section header */}
              <button
                type="button"
                onClick={() => toggleSection(section.title)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  width: '100%',
                  padding: '8px 8px',
                  border: 'none',
                  background: 'none',
                  cursor: 'pointer',
                  borderRadius: 'var(--radius-sm)',
                  color: hasActive ? 'var(--tp-text-primary)' : 'var(--tp-text-secondary)',
                  fontSize: '13px',
                  fontWeight: 600,
                  letterSpacing: '0.01em',
                  textAlign: 'left',
                  transition: 'color var(--duration-fast) ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = 'var(--tp-text-primary)';
                  e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.03)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = hasActive
                    ? 'var(--tp-text-primary)'
                    : 'var(--tp-text-secondary)';
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <span style={{ fontSize: '14px', lineHeight: 1 }}>{section.icon}</span>
                <span style={{ flex: 1 }}>{section.title}</span>
                <svg
                  aria-hidden="true"
                  width="12"
                  height="12"
                  viewBox="0 0 12 12"
                  fill="none"
                  style={{
                    transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                    transition: 'transform var(--duration-fast) ease',
                    opacity: 0.4,
                  }}
                >
                  <path
                    d="M4.5 2.5L8 6L4.5 9.5"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>

              {/* Pages */}
              <div
                style={{
                  overflow: 'hidden',
                  maxHeight: isExpanded ? `${section.pages.length * 40}px` : '0px',
                  opacity: isExpanded ? 1 : 0,
                  transition:
                    'max-height var(--duration-base) ease, opacity var(--duration-fast) ease',
                }}
              >
                {section.pages.map((page) => {
                  const isActive = pathname === page.href;
                  return (
                    <Link
                      key={page.href}
                      href={page.href}
                      style={{
                        display: 'block',
                        padding: '6px 8px 6px 34px',
                        fontSize: '13px',
                        lineHeight: '1.5',
                        borderRadius: 'var(--radius-sm)',
                        textDecoration: 'none',
                        color: isActive ? 'var(--tp-accent-hover)' : 'var(--tp-text-muted)',
                        backgroundColor: isActive ? 'var(--tp-accent-subtle)' : 'transparent',
                        fontWeight: isActive ? 500 : 400,
                        transition:
                          'color var(--duration-fast) ease, background-color var(--duration-fast) ease',
                      }}
                      onMouseEnter={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.color = 'var(--tp-text-primary)';
                          e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.03)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.color = 'var(--tp-text-muted)';
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }
                      }}
                    >
                      {page.title}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </nav>
  );

  return (
    <>
      {/* Desktop sidebar — rendered inline */}
      <aside
        className="docs-sidebar-desktop"
        style={{
          display: 'none',
          width: '280px',
          flexShrink: 0,
          position: 'sticky',
          top: '56px',
          height: 'calc(100dvh - 56px)',
          overflowY: 'auto',
          borderRight: '1px solid var(--tp-border-subtle)',
          backgroundColor: 'var(--tp-surface-1)',
        }}
      >
        {sidebarContent}
      </aside>

      {/* Mobile overlay */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            display: 'flex',
          }}
        >
          {/* Backdrop */}
          <div
            role="button"
            tabIndex={0}
            onClick={onClose}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') onClose();
            }}
            style={{
              position: 'absolute',
              inset: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.6)',
              backdropFilter: 'blur(4px)',
            }}
          />

          {/* Drawer */}
          <div
            style={{
              position: 'relative',
              width: '300px',
              maxWidth: '85vw',
              height: '100%',
              backgroundColor: 'var(--tp-surface-1)',
              borderRight: '1px solid var(--tp-border-default)',
              overflowY: 'auto',
              animation: 'slideInLeft var(--duration-base) ease forwards',
            }}
          >
            {/* Close button */}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close navigation"
              style={{
                position: 'absolute',
                top: '16px',
                right: '12px',
                width: '28px',
                height: '28px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: 'none',
                background: 'none',
                color: 'var(--tp-text-muted)',
                cursor: 'pointer',
                borderRadius: 'var(--radius-sm)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = 'var(--tp-text-primary)';
                e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.06)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'var(--tp-text-muted)';
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <svg aria-hidden="true" width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path
                  d="M4 4L12 12M12 4L4 12"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </button>

            {sidebarContent}
          </div>
        </div>
      )}

      {/* Keyframes + responsive media query */}
      <style>{`
        @keyframes slideInLeft {
          from { transform: translateX(-100%); }
          to { transform: translateX(0); }
        }
        @media (min-width: 1024px) {
          .docs-sidebar-desktop {
            display: block !important;
          }
        }
      `}</style>
    </>
  );
}
