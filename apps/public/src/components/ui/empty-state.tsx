import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-4 py-16 text-center', className)}>
      {icon && (
        <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-muted text-muted-foreground">
          {icon}
        </div>
      )}
      <div className="flex flex-col gap-1.5">
        <p className="text-sm font-medium text-foreground">{title}</p>
        {description && (
          <p className="max-w-xs text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}
