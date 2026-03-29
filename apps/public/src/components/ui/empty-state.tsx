import type { ReactNode } from 'react';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
      {icon && (
        <div
          className="flex h-12 w-12 items-center justify-center rounded-xl"
          style={{
            background: 'var(--color-surface-2)',
            border: '1px solid rgba(255,255,255,0.08)',
            color: 'var(--color-text-muted)',
          }}
        >
          {icon}
        </div>
      )}
      <div className="flex flex-col gap-1.5">
        <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
          {title}
        </p>
        {description && (
          <p className="max-w-xs text-sm" style={{ color: 'var(--color-text-muted)' }}>
            {description}
          </p>
        )}
      </div>
      {action}
    </div>
  );
}
