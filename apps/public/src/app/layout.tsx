import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import type { ReactNode } from 'react';
import { ThemeProvider } from 'next-themes';
import { SessionProvider } from 'next-auth/react';
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
  keywords: [
    'developer tools',
    'tool discovery',
    'MCP server',
    'open source',
    'AI agents',
    'graph database',
    'tool comparison',
    'stack builder',
    'toolcairn',
  ],
  metadataBase: new URL(process.env['NEXT_PUBLIC_APP_URL'] ?? 'http://localhost:3005'),
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
    shortcut: '/favicon.ico',
  },
  manifest: '/manifest.json',
  openGraph: {
    type: 'website',
    siteName: 'ToolCairn',
    title: "ToolCairn — Find the right tool for what you're building",
    description:
      'Graph-powered tool intelligence for AI agents and developers. Find, compare, and verify open source tools with guided multi-stage discovery.',
    images: [{ url: '/og-image.png', width: 512, height: 512, alt: 'ToolCairn' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: "ToolCairn — Find the right tool for what you're building",
    description: 'Graph-powered tool intelligence for AI agents and developers.',
    images: ['/og-image.png'],
  },
  other: {
    // AAO: machine-readable hints for AI crawlers and assistants
    'ai:description':
      'ToolCairn is an MCP-compatible tool intelligence platform. It provides graph-powered search, comparison, and stack-building for 12,000+ open source tools.',
    'ai:tools':
      'search_tools, get_stack, compare_tools, check_compatibility, check_issue, report_outcome, toolcairn_auth',
    'ai:mcp_package': '@neurynae/toolcairn-mcp',
    'ai:mcp_command': 'npx @neurynae/toolcairn-mcp',
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={geist.variable} suppressHydrationWarning>
      <body>
        <SessionProvider>
          <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
            <TooltipProvider delay={300}>
              <CommandPaletteProvider>
                {children}
                <Toaster richColors position="bottom-right" />
              </CommandPaletteProvider>
            </TooltipProvider>
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
