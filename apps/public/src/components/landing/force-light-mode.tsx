'use client';

import { useEffect } from 'react';
import { useTheme } from 'next-themes';

/**
 * Renders nothing. Forces light mode while the landing page is mounted
 * and restores the user's previous theme on navigation away.
 */
export function ForceLightMode() {
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    const previous = theme;
    setTheme('light');
    return () => {
      if (previous) setTheme(previous);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
