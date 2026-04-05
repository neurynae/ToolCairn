import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

type GlassCardVariant = 'default' | 'elevated' | 'inset' | 'featured';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  padding?: 'sm' | 'md' | 'lg';
  as?: 'div' | 'article' | 'section';
  variant?: GlassCardVariant;
}

const paddingMap = {
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
} as const;

const variantClassMap: Record<GlassCardVariant, string> = {
  default: 'glass-card',
  elevated: 'surface-elevated',
  inset: 'surface-inset',
  featured: 'surface-featured',
};

export function GlassCard({
  children,
  className,
  hover = true,
  padding = 'md',
  as: Tag = 'div',
  variant = 'default',
}: GlassCardProps) {
  return (
    <Tag
      className={cn(
        variantClassMap[variant],
        paddingMap[padding],
        !hover && variant === 'default' && 'hover:transform-none hover:shadow-none',
        className,
      )}
    >
      {children}
    </Tag>
  );
}
