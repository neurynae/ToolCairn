import type { ReactNode } from 'react';

type CalloutType = 'tip' | 'important' | 'note' | 'warning';

interface CalloutProps {
  type: CalloutType;
  title?: string;
  children: ReactNode;
}

const calloutConfig: Record<CalloutType, { icon: string; color: string; bg: string }> = {
  tip: { icon: '💡', color: '#22c55e', bg: 'rgba(34,197,94,0.08)' },
  important: { icon: '⚠️', color: '#6366f1', bg: 'rgba(99,102,241,0.08)' },
  note: { icon: 'ℹ️', color: '#3b82f6', bg: 'rgba(59,130,246,0.08)' },
  warning: { icon: '🔴', color: '#f59e0b', bg: 'rgba(245,158,11,0.08)' },
};

export function Callout({ type, title, children }: CalloutProps) {
  const config = calloutConfig[type];

  return (
    <div
      className="flex gap-3"
      style={{
        background: config.bg,
        borderLeft: `4px solid ${config.color}`,
        borderRadius: 'var(--radius-md)',
        padding: '16px',
      }}
    >
      <span
        className="shrink-0 text-lg leading-none"
        style={{ marginTop: '2px' }}
        aria-hidden="true"
      >
        {config.icon}
      </span>
      <div className="min-w-0 flex-1">
        {title && (
          <p
            className="mb-1 text-sm font-bold"
            style={{ color: config.color, margin: 0, marginBottom: '4px' }}
          >
            {title}
          </p>
        )}
        <div
          className="text-sm leading-relaxed"
          style={{ color: 'var(--color-text-secondary)', margin: 0 }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
