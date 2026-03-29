import { SiteHeader } from '@/components/layout/site-header';
import { DocsLayoutShell } from '@/components/docs/docs-layout-shell';

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
      <SiteHeader />
      <DocsLayoutShell>{children}</DocsLayoutShell>
    </div>
  );
}
