'use client';

import { CodeBlock } from '@/components/docs/code-block';
import { useState } from 'react';

interface CodeTab {
  label: string;
  language?: string;
  code: string;
}

interface CodeTabsProps {
  tabs: CodeTab[];
}

export function CodeTabs({ tabs }: CodeTabsProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  if (tabs.length === 0) return null;

  const activeTab = tabs[activeIndex] as CodeTab | undefined;

  if (!activeTab) return null;

  return (
    <div
      style={{
        border: '1px solid var(--color-border-subtle)',
        borderRadius: 'var(--radius-md)',
        overflow: 'hidden',
      }}
    >
      <div
        className="flex overflow-x-auto"
        style={{
          background: 'var(--color-surface-1)',
          borderBottom: '1px solid var(--color-border-subtle)',
        }}
        role="tablist"
      >
        {tabs.map((tab, index) => {
          const isActive = index === activeIndex;
          return (
            <button
              type="button"
              key={`${tab.label}-${index}`}
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveIndex(index)}
              className="relative shrink-0 px-4 py-2.5 text-sm font-medium transition-colors"
              style={{
                color: isActive ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                borderBottom: isActive ? '2px solid var(--color-accent)' : '2px solid transparent',
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.color = 'var(--color-text-secondary)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.color = 'var(--color-text-muted)';
                }
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      <div role="tabpanel">
        <CodeBlock code={activeTab.code} language={activeTab.language} />
      </div>
    </div>
  );
}
