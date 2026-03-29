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
}

export function CategoryBadge({ category, size = 'md' }: CategoryBadgeProps) {
  const label = CATEGORY_LABELS[category] ?? category;
  const fontSize = size === 'sm' ? '11px' : '12px';
  const padding = size === 'sm' ? '2px 7px' : '3px 9px';

  return (
    <span
      className="inline-flex items-center rounded-md font-medium tracking-wide"
      style={{
        fontSize,
        padding,
        background: 'var(--color-accent-subtle)',
        color: 'var(--color-accent-hover)',
        border: '1px solid rgba(99,102,241,0.20)',
        letterSpacing: '0.03em',
      }}
    >
      {label}
    </span>
  );
}
