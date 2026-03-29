import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import type { ReactNode } from 'react';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: {
    default: "ToolPilot — Find the right tool for what you're building",
    template: '%s · ToolPilot',
  },
  description:
    'Graph-powered tool intelligence for AI agents and developers. Find, use, debug, and compare open source tools with guided multi-stage discovery.',
  keywords: ['developer tools', 'tool discovery', 'MCP server', 'open source', 'AI agents'],
  metadataBase: new URL(process.env['NEXT_PUBLIC_APP_URL'] ?? 'http://localhost:3000'),
  openGraph: {
    type: 'website',
    siteName: 'ToolPilot',
    title: "ToolPilot — Find the right tool for what you're building",
    description: 'Graph-powered tool intelligence for AI agents and developers.',
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`dark ${inter.variable}`}>
      <body>{children}</body>
    </html>
  );
}
