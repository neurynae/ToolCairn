import { cn } from '@/lib/utils';

const CATEGORY_LABELS: Record<string, string> = {
  'vector-database': 'Vector DB',
  'graph-database': 'Graph DB',
  'relational-database': 'Relational DB',
  'llm-framework': 'LLM Framework',
  'agent-framework': 'Agent Framework',
  'web-framework': 'Web Framework',
  'mcp-server': 'MCP Server',
  auth: 'Auth',
  testing: 'Testing',
  devops: 'DevOps',
  queue: 'Queue',
  cache: 'Cache',
  search: 'Search',
  embedding: 'Embedding',
  monitoring: 'Monitoring',
  other: 'Other',
};

interface CategoryBadgeProps {
  category: string;
  size?: 'sm' | 'md';
  className?: string;
}

export function CategoryBadge({ category, size = 'md', className }: CategoryBadgeProps) {
  const label = CATEGORY_LABELS[category] ?? category;

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md border font-medium tracking-wide',
        'border-[var(--tp-accent)]/20 bg-[var(--tp-accent-subtle)] text-[var(--tp-accent-hover)]',
        size === 'sm' ? 'px-1.5 py-0.5 text-[11px]' : 'px-2 py-0.5 text-xs',
        className,
      )}
      style={{ letterSpacing: '0.03em' }}
    >
      {label}
    </span>
  );
}
