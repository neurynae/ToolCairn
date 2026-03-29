'use client';

interface CategoryGridProps {
  onCategorySelect: (category: string) => void;
  selectedCategory: string | null;
}

/* ─── SVG icon paths per category slug ───────────────────────────────── */
const CATEGORY_ICONS: Record<string, string> = {
  'vector-database': 'M3 5h18M3 10h18M3 15h18M3 20h18',
  'graph-database':
    'M12 4a2 2 0 100 4 2 2 0 000-4zM4 16a2 2 0 100 4 2 2 0 000-4zM20 16a2 2 0 100 4 2 2 0 000-4zM12 6v4M6 17l4-5M18 17l-4-5',
  'relational-database':
    'M12 2C6.48 2 2 4.69 2 8s4.48 6 10 6 10-2.69 10-6-4.48-6-10-6zM2 8v8c0 3.31 4.48 6 10 6s10-2.69 10-6V8M2 12c0 3.31 4.48 6 10 6s10-2.69 10-6',
  'llm-framework': 'M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z',
  'agent-framework': 'M12 2a10 10 0 100 20A10 10 0 0012 2zM12 8v4l3 3',
  'web-framework': 'M3 12h18M12 3a15 15 0 010 18M12 3a15 15 0 000 18M3 9h18M3 15h18',
  auth: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
  testing:
    'M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18',
  devops:
    'M12 3v1m0 16v1M4.22 4.22l.7.7m12.16 12.16l.7.7M1 12h1m18 0h1M4.22 19.78l.7-.7M18.36 5.64l.7-.7M15 12a3 3 0 11-6 0 3 3 0 016 0z',
  'mcp-server':
    'M5 12h14M12 5l7 7-7 7M5 3h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2z',
  queue: 'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01',
  cache: 'M13 2L3 14h9l-1 8 10-12h-9l1-8z',
  search: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z',
  embedding: 'M3 3h7v7H3V3zM14 3h7v7h-7V3zM3 14h7v7H3v-7zM14 14h7v7h-7v-7z',
  monitoring: 'M22 12h-4l-3 9L9 3l-3 9H2',
  other:
    'M20 7H4a2 2 0 00-2 2v6a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2zM12 13a2 2 0 100-4 2 2 0 000 4z',
};

const DEFAULT_ICON_PATH = 'M12 5v14M5 12h14';

const CATEGORIES = [
  { slug: 'vector-database', label: 'Vector Database' },
  { slug: 'graph-database', label: 'Graph Database' },
  { slug: 'relational-database', label: 'Relational DB' },
  { slug: 'llm-framework', label: 'LLM Framework' },
  { slug: 'agent-framework', label: 'Agent Framework' },
  { slug: 'web-framework', label: 'Web Framework' },
  { slug: 'auth', label: 'Auth' },
  { slug: 'testing', label: 'Testing' },
  { slug: 'devops', label: 'DevOps' },
  { slug: 'mcp-server', label: 'MCP Server' },
  { slug: 'queue', label: 'Queue' },
  { slug: 'cache', label: 'Cache' },
  { slug: 'search', label: 'Search' },
  { slug: 'embedding', label: 'Embedding' },
  { slug: 'monitoring', label: 'Monitoring' },
  { slug: 'other', label: 'Other' },
] as const;

function CategoryCard({
  slug,
  label,
  selected,
  onClick,
}: {
  slug: string;
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'flex flex-col items-center gap-2.5 rounded-xl px-4 py-5 text-center transition-all duration-150',
        selected
          ? 'border border-[rgba(99,102,241,0.40)] bg-[rgba(99,102,241,0.08)]'
          : 'border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.03)] hover:border-[rgba(255,255,255,0.12)] hover:-translate-y-0.5 hover:bg-[rgba(255,255,255,0.05)]',
      ].join(' ')}
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        style={{ color: selected ? 'var(--color-accent)' : 'var(--color-text-muted)' }}
      >
        <path d={CATEGORY_ICONS[slug] ?? DEFAULT_ICON_PATH} />
      </svg>
      <span
        className="text-xs font-medium"
        style={{ color: selected ? 'var(--color-accent)' : 'var(--color-text-secondary)' }}
      >
        {label}
      </span>
    </button>
  );
}

export function CategoryGrid({ onCategorySelect, selectedCategory }: CategoryGridProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
      {CATEGORIES.map((cat) => (
        <CategoryCard
          key={cat.slug}
          slug={cat.slug}
          label={cat.label}
          selected={selectedCategory === cat.slug}
          onClick={() => onCategorySelect(selectedCategory === cat.slug ? '' : cat.slug)}
        />
      ))}
    </div>
  );
}
