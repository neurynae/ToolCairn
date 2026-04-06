'use client';

import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { useTheme } from 'next-themes';

/**
 * Landing page layout — forces light mode.
 * Restores the user's previous theme preference on navigation away.
 */
export default function LandingLayout({ children }: { children: ReactNode }) {
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    const previous = theme;
    setTheme('light');
    return () => {
      if (previous) setTheme(previous);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <>{children}</>;
}
