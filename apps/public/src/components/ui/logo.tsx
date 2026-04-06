import Image from 'next/image';
import { cn } from '@/lib/utils';

type LogoVariant = 'icon' | 'wordmark';
type LogoSize = 'xs' | 'sm' | 'md' | 'lg';

const ICON_SIZES: Record<LogoSize, number> = {
  xs: 18,
  sm: 26,
  md: 36,
  lg: 56,
};

const TEXT_CLASSES: Record<LogoSize, string> = {
  xs: 'text-xs font-bold tracking-tight',
  sm: 'text-sm font-bold tracking-tight',
  md: 'text-base font-bold tracking-tight',
  lg: 'text-2xl font-extrabold tracking-tight',
};

interface LogoProps {
  variant?: LogoVariant;
  size?: LogoSize;
  className?: string;
  priority?: boolean;
}

/**
 * Logo component.
 *
 * variant="icon"     → cairn stones image only
 * variant="wordmark" → cairn stones image + "ToolCairn" text (always readable on any background)
 *
 * The wordmark renders text in HTML (not PNG) so "Tool" is always visible regardless
 * of background color — the PNG wordmark has white "Tool" that disappears on light backgrounds.
 */
export function Logo({ variant = 'icon', size = 'sm', className, priority = false }: LogoProps) {
  const px = ICON_SIZES[size];

  if (variant === 'wordmark') {
    return (
      <span className={cn('inline-flex items-center gap-1.5', className)}>
        <Image
          src="/logo/icon-64.png"
          alt=""
          aria-hidden="true"
          width={px}
          height={px}
          className="shrink-0 object-contain"
          priority={priority}
        />
        <span className={TEXT_CLASSES[size]}>
          <span className="text-foreground">Tool</span>
          <span className="text-indigo-600">Cairn</span>
        </span>
      </span>
    );
  }

  return (
    <Image
      src="/logo/icon-64.png"
      alt="ToolCairn"
      width={px}
      height={px}
      className={cn('shrink-0 rounded-md object-contain', className)}
      priority={priority}
    />
  );
}
