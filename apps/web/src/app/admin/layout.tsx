import type { ReactNode } from 'react';

// Minimal pass-through — sidebar layout lives in (dashboard)/layout.tsx
export default function AdminLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
