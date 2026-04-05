'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  SearchIcon,
  CompassIcon,
  GitCompareArrowsIcon,
  LayersIcon,
  FileTextIcon,
  InfoIcon,
  HistoryIcon,
  ArrowRightIcon,
  ZapIcon,
} from 'lucide-react';
import {
  Command,
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
  CommandShortcut,
} from '@/components/ui/command';
import { getSearchHistory, type SearchHistoryEntry } from '@/lib/search-history';

const PAGES = [
  { href: '/', label: 'Home', icon: SearchIcon, description: 'Search for tools' },
  { href: '/explore', label: 'Explore Tools', icon: CompassIcon, description: 'Browse by category' },
  { href: '/compare', label: 'Compare Tools', icon: GitCompareArrowsIcon, description: 'Side-by-side comparison' },
  { href: '/stack', label: 'Stack Builder', icon: LayersIcon, description: 'Find your stack' },
  { href: '/compatibility', label: 'Compatibility Check', icon: ZapIcon, description: 'Check if tools work together' },
  { href: '/docs', label: 'Documentation', icon: FileTextIcon, description: 'Guides and API reference' },
  { href: '/about', label: 'How it Works', icon: InfoIcon, description: 'The 4-stage search pipeline' },
] as const;

const EXAMPLE_QUERIES = [
  'logging library for Node.js',
  'TypeScript ORM with edge runtime support',
  'vector database for production',
  'testing framework for React',
  'CI/CD pipeline for monorepos',
];

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSearch?: (query: string) => void;
}

export function CommandPalette({ open, onOpenChange, onSearch }: CommandPaletteProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [history, setHistory] = useState<SearchHistoryEntry[]>([]);

  // Load search history when palette opens
  useEffect(() => {
    if (open) {
      setHistory(getSearchHistory());
    }
  }, [open]);

  // Reset query when closed
  useEffect(() => {
    if (!open) {
      setQuery('');
    }
  }, [open]);

  const handleSearch = useCallback(
    (q: string) => {
      const trimmed = q.trim();
      if (!trimmed) return;
      onOpenChange(false);
      if (onSearch) {
        onSearch(trimmed);
      } else {
        router.push(`/?q=${encodeURIComponent(trimmed)}`);
      }
    },
    [onOpenChange, onSearch, router],
  );

  const handleNavigate = useCallback(
    (href: string) => {
      onOpenChange(false);
      router.push(href);
    },
    [onOpenChange, router],
  );

  // Detect "A vs B" pattern → go to compare
  const compareMatch = query.match(/^(.+?)\s+vs\.?\s+(.+)$/i);

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Search ToolCairn"
      description="Search for tools, navigate pages, or compare tools"
      className="sm:max-w-xl"
    >
      <Command>
      <CommandInput
        placeholder="Search tools, navigate pages..."
        value={query}
        onValueChange={setQuery}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && query.trim()) {
            e.preventDefault();
            handleSearch(query);
          }
        }}
      />
      <CommandList>
        <CommandEmpty>
          {query.trim() ? (
            <button
              type="button"
              onClick={() => handleSearch(query)}
              className="flex w-full items-center justify-center gap-2 py-4 text-sm text-muted-foreground hover:text-foreground"
            >
              <SearchIcon className="size-4" />
              Search for &ldquo;{query}&rdquo;
              <ArrowRightIcon className="size-3" />
            </button>
          ) : (
            <p className="text-sm text-muted-foreground">No results found.</p>
          )}
        </CommandEmpty>

        {/* Compare shortcut */}
        {compareMatch && (
          <CommandGroup heading="Quick Action">
            <CommandItem
              onSelect={() =>
                handleNavigate(
                  `/compare?a=${encodeURIComponent(compareMatch[1].trim())}&b=${encodeURIComponent(compareMatch[2].trim())}`,
                )
              }
            >
              <GitCompareArrowsIcon className="size-4 text-[var(--tp-accent)]" />
              Compare &ldquo;{compareMatch[1].trim()}&rdquo; vs &ldquo;{compareMatch[2].trim()}&rdquo;
              <ArrowRightIcon className="ml-auto size-3 text-muted-foreground" />
            </CommandItem>
          </CommandGroup>
        )}

        {/* Search action when typing */}
        {query.trim() && !compareMatch && (
          <CommandGroup heading="Search">
            <CommandItem onSelect={() => handleSearch(query)}>
              <SearchIcon className="size-4 text-[var(--tp-accent)]" />
              Search for &ldquo;{query}&rdquo;
              <CommandShortcut>↵</CommandShortcut>
            </CommandItem>
          </CommandGroup>
        )}

        {/* Recent searches */}
        {!query && history.length > 0 && (
          <CommandGroup heading="Recent Searches">
            {history.slice(0, 5).map((entry) => (
              <CommandItem key={entry.id} onSelect={() => handleSearch(entry.query)}>
                <HistoryIcon className="size-4 text-muted-foreground" />
                {entry.query}
                {entry.resultCount !== undefined && (
                  <span className="ml-auto text-xs text-muted-foreground">
                    {entry.resultCount} result{entry.resultCount !== 1 ? 's' : ''}
                  </span>
                )}
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {/* Example queries when idle */}
        {!query && (
          <CommandGroup heading="Try Searching">
            {EXAMPLE_QUERIES.map((example) => (
              <CommandItem key={example} onSelect={() => handleSearch(example)}>
                <SearchIcon className="size-4 text-muted-foreground" />
                {example}
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        <CommandSeparator />

        {/* Navigation */}
        <CommandGroup heading="Navigate">
          {PAGES.map((page) => {
            const Icon = page.icon;
            return (
              <CommandItem key={page.href} onSelect={() => handleNavigate(page.href)}>
                <Icon className="size-4 text-muted-foreground" />
                <span>{page.label}</span>
                <span className="ml-1 text-muted-foreground">&mdash; {page.description}</span>
              </CommandItem>
            );
          })}
        </CommandGroup>
      </CommandList>
      </Command>
    </CommandDialog>
  );
}
