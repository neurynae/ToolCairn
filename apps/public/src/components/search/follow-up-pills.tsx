'use client';

interface FollowUpPillsProps {
  toolName: string;
  category: string;
}

export function FollowUpPills({ toolName, category }: FollowUpPillsProps) {
  const suggestions = [
    {
      label: 'Compare alternatives',
      href: `/search?q=${encodeURIComponent(`${category} alternatives`)}`,
    },
    { label: 'Check known issues', href: `/tool/${toolName}/issues` },
    { label: 'View full profile', href: `/tool/${toolName}` },
    {
      label: 'Find integrations',
      href: `/search?q=${encodeURIComponent(`integrations with ${toolName}`)}`,
    },
  ];

  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      {suggestions.map((s) => (
        <a
          key={s.label}
          href={s.href}
          className="rounded-full px-4 py-1.5 text-xs font-medium transition-all hover:scale-[1.03]"
          style={{
            background: 'var(--color-surface-2)',
            color: 'var(--color-text-secondary)',
            border: '1px solid var(--color-border-subtle)',
          }}
        >
          {s.label}
        </a>
      ))}
    </div>
  );
}
