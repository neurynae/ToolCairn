import type { ReactNode } from 'react';
import Link from 'next/link';
import { Logo } from '@/components/ui/logo';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      {/* Top bar */}
      <header className="border-b border-slate-200 bg-white px-4 py-4 sm:px-6">
        <Link href="/" className="flex w-fit items-center gap-2">
          <Logo variant="wordmark" size="sm" />
        </Link>
      </header>

      {/* Centered card */}
      <div className="flex flex-1 items-center justify-center px-4 py-12 sm:px-6">
        <div className="w-full max-w-sm">{children}</div>
      </div>

      <footer className="py-6 text-center text-xs text-slate-400">
        © {new Date().getFullYear()} NEURYNAE ·{' '}
        <Link href="/docs" className="hover:text-slate-600">
          Docs
        </Link>{' '}
        ·{' '}
        <a
          href="https://github.com/NEURYNAE/ToolCairn"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-slate-600"
        >
          GitHub
        </a>
      </footer>
    </div>
  );
}
