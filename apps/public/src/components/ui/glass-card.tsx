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
  sm: '16px',
  md: '24px',
  lg: '32px',
} as const;

const variantClassMap: Record<GlassCardVariant, string> = {
  default: 'glass-card',
  elevated: 'surface-elevated',
  inset: 'surface-inset',
  featured: 'surface-featured',
};

export function GlassCard({
  children,
  className = '',
  hover = true,
  padding = 'md',
  as: Tag = 'div',
  variant = 'default',
}: GlassCardProps) {
  const baseClass = variantClassMap[variant];
  const noHoverClass =
    hover || variant !== 'default' ? '' : ' [&]:hover:transform-none [&]:hover:shadow-none';

  return (
    <Tag
      className={`${baseClass}${noHoverClass} ${className}`}
      style={{ padding: paddingMap[padding] }}
    >
      {children}
    </Tag>
  );
}
