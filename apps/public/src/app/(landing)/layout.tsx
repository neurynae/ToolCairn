import type { ReactNode } from 'react';
import { ForceLightMode } from '@/components/landing/force-light-mode';

/**
 * Server component layout for the landing page.
 * ForceLightMode is a null-rendering client component that sets the theme.
 * Keeping the layout itself as a server component ensures Next.js generates
 * page_client-reference-manifest.js correctly.
 */
export default function LandingLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <ForceLightMode />
      {children}
    </>
  );
}
