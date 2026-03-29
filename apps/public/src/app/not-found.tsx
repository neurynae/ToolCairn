import Link from 'next/link';

export default function NotFound() {
  return (
    <div
      className="flex min-h-dvh flex-col items-center justify-center gap-6 text-center"
      style={{ color: 'var(--color-text-primary)' }}
    >
      <div className="flex flex-col items-center gap-2">
        <span
          className="text-7xl font-bold tracking-tight"
          style={{
            background: 'linear-gradient(135deg, #6366f1, #818cf8)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          404
        </span>
        <p className="text-lg font-medium">Page not found</p>
        <p className="max-w-xs text-sm" style={{ color: 'var(--color-text-muted)' }}>
          The page you're looking for doesn't exist or has been moved.
        </p>
      </div>
      <Link
        href="/"
        className="rounded-lg px-5 py-2.5 text-sm font-medium transition-all duration-150"
        style={{
          background: 'var(--color-accent)',
          color: '#fff',
        }}
      >
        Back to search
      </Link>
    </div>
  );
}
