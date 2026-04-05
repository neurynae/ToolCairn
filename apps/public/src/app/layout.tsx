import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import type { ReactNode } from 'react';
import { ThemeProvider } from 'next-themes';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { CommandPaletteProvider } from '@/components/providers/command-palette-provider';
import './globals.css';

const geist = Geist({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-geist',
});

export const metadata: Metadata = {
  title: {
    default: "ToolCairn — Find the right tool for what you're building",
    template: '%s · ToolCairn',
  },
  description:
    'Graph-powered tool intelligence for AI agents and developers. Find, compare, and verify open source tools with guided multi-stage discovery.',
  keywords: ['developer tools', 'tool discovery', 'MCP server', 'open source', 'AI agents'],
  metadataBase: new URL(process.env['NEXT_PUBLIC_APP_URL'] ?? 'http://localhost:3005'),
  openGraph: {
    type: 'website',
    siteName: 'ToolCairn',
    title: "ToolCairn — Find the right tool for what you're building",
    description: 'Graph-powered tool intelligence for AI agents and developers.',
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={geist.variable} suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          <TooltipProvider delay={300}>
            <CommandPaletteProvider>
              {children}
              <Toaster richColors position="bottom-right" />
            </CommandPaletteProvider>
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
