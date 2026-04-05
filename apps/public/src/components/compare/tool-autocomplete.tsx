'use client';

import { useState, useEffect, useRef } from 'react';
import { SearchIcon, Loader2Icon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ToolAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  disabled?: boolean;
  className?: string;
}

export function ToolAutocomplete({
  value,
  onChange,
  placeholder = 'Enter tool name...',
  label,
  disabled,
  className,
}: ToolAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (value.length < 2) {
      setSuggestions([]);
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/tools/names?q=${encodeURIComponent(value)}`);
        if (res.ok) {
          const data = (await res.json()) as { ok: boolean; data: string[] };
          setSuggestions(data.ok ? data.data.slice(0, 8) : []);
        }
      } catch {
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 250);
  }, [value]);

  return (
    <div className={cn('relative', className)}>
      {label && (
        <label className="mb-1.5 block text-sm font-medium text-foreground">{label}</label>
      )}
      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
          {loading ? (
            <Loader2Icon className="size-4 animate-spin text-muted-foreground" />
          ) : (
            <SearchIcon className="size-4 text-muted-foreground" />
          )}
        </div>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
          disabled={disabled}
          placeholder={placeholder}
          className={cn(
            'h-10 w-full rounded-lg border border-input bg-transparent pl-9 pr-3 text-sm text-foreground',
            'outline-none transition-colors placeholder:text-muted-foreground',
            'focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50',
            'disabled:cursor-not-allowed disabled:opacity-50',
          )}
          autoComplete="off"
          spellCheck={false}
        />
      </div>

      {/* Suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 mt-1 w-full overflow-hidden rounded-lg border border-border bg-popover shadow-md">
          {suggestions.map((name) => (
            <button
              key={name}
              type="button"
              className="flex w-full items-center px-3 py-2 text-sm text-foreground transition-colors hover:bg-muted"
              onMouseDown={() => {
                onChange(name);
                setShowSuggestions(false);
              }}
            >
              {name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
