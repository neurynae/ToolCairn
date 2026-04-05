'use client';

import { DocsSidebar } from '@/components/docs/docs-sidebar';
import { useCallback, useState } from 'react';

interface DocsLayoutShellProps {
  children: React.ReactNode;
}

export function DocsLayoutShell({ children }: DocsLayoutShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const closeSidebar = useCallback(() => setSidebarOpen(false), []);

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        maxWidth: '1440px',
        width: '100%',
        margin: '0 auto',
      }}
    >
      {/* Left sidebar */}
      <DocsSidebar isOpen={sidebarOpen} onClose={closeSidebar} />

      {/* Main content */}
      <main
        style={{
          flex: 1,
          minWidth: 0,
          maxWidth: '768px',
          margin: '0 auto',
          padding: '32px 24px 64px',
        }}
      >
        {children}
      </main>

      {/* Right TOC area — placeholder, hidden on small screens */}
      <aside
        className="docs-toc-column"
        style={{
          display: 'none',
          width: '220px',
          flexShrink: 0,
          position: 'sticky',
          top: '56px',
          height: 'calc(100dvh - 56px)',
          overflowY: 'auto',
          padding: '32px 16px 32px 0',
        }}
      />

      {/* Mobile sidebar toggle — visible only below 1024px */}
      <button
        type="button"
        onClick={() => setSidebarOpen(true)}
        aria-label="Open documentation menu"
        className="docs-mobile-menu-btn"
        style={{
          display: 'none',
          position: 'fixed',
          bottom: '20px',
          left: '20px',
          zIndex: 90,
          width: '44px',
          height: '44px',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--tp-border-default)',
          backgroundColor: 'var(--tp-surface-2)',
          color: 'var(--tp-text-primary)',
          cursor: 'pointer',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4)',
        }}
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path
            d="M3 5H17M3 10H17M3 15H17"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      </button>

      {/* Responsive styles */}
      <style>{`
        @media (max-width: 1023px) {
          .docs-mobile-menu-btn {
            display: flex !important;
          }
        }
        @media (min-width: 1280px) {
          .docs-toc-column {
            display: block !important;
          }
        }
      `}</style>
    </div>
  );
}
