'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div
      className="flex min-h-dvh flex-col items-center justify-center gap-6 text-center px-4"
      style={{ color: 'var(--color-text-primary)' }}
    >
      <div className="flex flex-col items-center gap-2">
        <p className="text-lg font-medium">Something went wrong</p>
        <p className="max-w-xs text-sm" style={{ color: 'var(--color-text-muted)' }}>
          An unexpected error occurred. Please try again.
        </p>
      </div>
      <button
        onClick={() => reset()}
        className="rounded-lg px-5 py-2.5 text-sm font-medium transition-all duration-150"
        style={{ background: 'var(--color-accent)', color: '#fff' }}
      >
        Try again
      </button>
    </div>
  );
}
