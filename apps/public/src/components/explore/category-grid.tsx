'use client';

import { cn } from '@/lib/utils';

interface CategoryGridProps {
  onCategorySelect: (category: string) => void;
  selectedCategory: string | null;
}

import {
  DatabaseIcon,
  ShareIcon,
  TableIcon,
  BotIcon,
  GlobeIcon,
  LockIcon,
  FlaskConicalIcon,
  GitBranchIcon,
  ServerIcon,
  ListIcon,
  ZapIcon,
  SearchIcon,
  LayersIcon,
  ActivityIcon,
  MoreHorizontalIcon,
  BrainIcon,
} from 'lucide-react';

const CATEGORIES = [
  { slug: 'vector-database', label: 'Vector DB', Icon: DatabaseIcon },
  { slug: 'graph-database', label: 'Graph DB', Icon: ShareIcon },
  { slug: 'relational-database', label: 'Relational DB', Icon: TableIcon },
  { slug: 'llm-framework', label: 'LLM Framework', Icon: BrainIcon },
  { slug: 'agent-framework', label: 'Agent Framework', Icon: BotIcon },
  { slug: 'web-framework', label: 'Web Framework', Icon: GlobeIcon },
  { slug: 'auth', label: 'Auth', Icon: LockIcon },
  { slug: 'testing', label: 'Testing', Icon: FlaskConicalIcon },
  { slug: 'devops', label: 'DevOps', Icon: GitBranchIcon },
  { slug: 'mcp-server', label: 'MCP Server', Icon: ServerIcon },
  { slug: 'queue', label: 'Queue', Icon: ListIcon },
  { slug: 'cache', label: 'Cache', Icon: ZapIcon },
  { slug: 'search', label: 'Search', Icon: SearchIcon },
  { slug: 'embedding', label: 'Embedding', Icon: LayersIcon },
  { slug: 'monitoring', label: 'Monitoring', Icon: ActivityIcon },
  { slug: 'other', label: 'Other', Icon: MoreHorizontalIcon },
] as const;

function CategoryCard({
  slug,
  label,
  Icon,
  selected,
  onClick,
}: {
  slug: string;
  label: string;
  Icon: React.ElementType;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'group flex flex-col items-center gap-2 rounded-xl border px-3 py-4 text-center transition-all duration-150',
        selected
          ? 'border-[var(--tp-accent)]/40 bg-[var(--tp-accent-subtle)] text-[var(--tp-accent)]'
          : 'border-border bg-card text-muted-foreground hover:-translate-y-0.5 hover:border-[var(--tp-accent)]/25 hover:bg-[var(--tp-accent-subtle)] hover:text-[var(--tp-accent)]',
      )}
      aria-pressed={selected}
    >
      <Icon
        className={cn(
          'size-5 transition-colors',
          selected ? 'text-[var(--tp-accent)]' : 'text-muted-foreground group-hover:text-[var(--tp-accent)]',
        )}
        aria-hidden="true"
        strokeWidth={1.5}
      />
      <span className="text-[11px] font-medium leading-tight">{label}</span>
    </button>
  );
}

export function CategoryGrid({ onCategorySelect, selectedCategory }: CategoryGridProps) {
  return (
    <div className="grid grid-cols-4 gap-2 sm:grid-cols-8 sm:gap-3">
      {CATEGORIES.map((cat) => (
        <CategoryCard
          key={cat.slug}
          slug={cat.slug}
          label={cat.label}
          Icon={cat.Icon}
          selected={selectedCategory === cat.slug}
          onClick={() => onCategorySelect(selectedCategory === cat.slug ? '' : cat.slug)}
        />
      ))}
    </div>
  );
}
