'use client';

const EXAMPLES = [
  'vector database self-hosted',
  'LLM framework Python',
  'auth library Node.js',
  'testing framework React',
  'message queue production',
  'MCP server tools',
] as const;

interface ExampleQueriesProps {
  onSelect: (query: string) => void;
}

export function ExampleQueries({ onSelect }: ExampleQueriesProps) {
  return (
    <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
      {EXAMPLES.map((query) => (
        <button
          key={query}
          type="button"
          onClick={() => onSelect(query)}
          className="rounded-full px-4 py-1.5 text-sm font-medium transition-all hover:scale-[1.04]"
          style={{
            background: 'var(--tp-accent-subtle)',
            color: 'var(--tp-accent-hover)',
            border: '1px solid rgba(99, 102, 241, 0.18)',
          }}
        >
          {query}
        </button>
      ))}
    </div>
  );
}
