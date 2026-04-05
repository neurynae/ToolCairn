'use client';

import { useCallback, useRef } from 'react';
import { SearchIcon, Loader2Icon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface SearchInputProps {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
  placeholder?: string;
}

export function SearchInput({
  value,
  onChange,
  onSubmit,
  disabled = false,
  placeholder = "Describe what you're building...",
}: SearchInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' && value.trim() && !disabled) {
        e.preventDefault();
        onSubmit();
      }
    },
    [value, disabled, onSubmit],
  );

  return (
    <div
      className={cn(
        'gradient-border relative flex w-full max-w-2xl cursor-text items-center gap-3 rounded-2xl',
        // Light mode: white card with border. Dark mode: elevated surface with visible border
        'border border-[var(--tp-border-default)] bg-card px-5 py-3.5',
        // Hover: slightly stronger border
        'transition-all duration-200 hover:border-[var(--tp-border-emphasis)]',
        // Focus: accent glow ring
        'focus-within:border-[var(--tp-accent)]/50 focus-within:shadow-[0_0_0_3px_var(--tp-accent-glow),0_0_32px_var(--tp-accent-glow)]',
        disabled && 'opacity-70',
      )}
      onClick={() => inputRef.current?.focus()}
    >
      {/* Search icon */}
      {disabled ? (
        <Loader2Icon
          className="size-5 shrink-0 animate-spin text-[var(--tp-accent)]"
          aria-hidden="true"
        />
      ) : (
        <SearchIcon
          className="size-5 shrink-0 text-muted-foreground"
          aria-hidden="true"
        />
      )}

      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        placeholder={placeholder}
        className="w-full bg-transparent text-base text-foreground outline-none placeholder:text-muted-foreground disabled:opacity-50"
        autoComplete="off"
        spellCheck={false}
        aria-label="Search for developer tools"
      />

      {value.trim() && !disabled && (
        <Button type="button" size="sm" onClick={onSubmit} className="shrink-0">
          Search
        </Button>
      )}
    </div>
  );
}
