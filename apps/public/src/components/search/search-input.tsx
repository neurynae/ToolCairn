'use client';

import { useCallback, useState } from 'react';

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
  const [focused, setFocused] = useState(false);

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
      className={`gradient-border relative flex w-full max-w-2xl items-center gap-3 rounded-2xl transition-shadow ${
        focused ? 'shadow-[0_0_32px_rgba(99,102,241,0.15)]' : ''
      }`}
      style={{
        background: 'var(--color-surface-1)',
        padding: '14px 20px',
      }}
    >
      {/* Search icon */}
      <svg
        width="20"
        height="20"
        viewBox="0 0 20 20"
        fill="none"
        className="shrink-0"
        style={{ color: focused ? 'var(--color-accent)' : 'var(--color-text-muted)' }}
        aria-hidden="true"
      >
        <path
          d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.45 4.39l3.58 3.58a.75.75 0 1 1-1.06 1.06l-3.58-3.58A7 7 0 0 1 2 9Z"
          fill="currentColor"
        />
      </svg>

      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        disabled={disabled}
        placeholder={placeholder}
        className="w-full bg-transparent text-base outline-none placeholder:text-[var(--color-text-muted)] disabled:opacity-50"
        style={{ color: 'var(--color-text-primary)' }}
        autoComplete="off"
        spellCheck={false}
      />

      {value.trim() && !disabled && (
        <button
          type="button"
          onClick={onSubmit}
          className="shrink-0 rounded-lg px-4 py-1.5 text-sm font-medium transition-colors"
          style={{
            background: 'var(--color-accent)',
            color: '#fff',
          }}
        >
          Search
        </button>
      )}

      {disabled && (
        <div
          className="shrink-0 h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent"
          style={{ color: 'var(--color-accent)' }}
        />
      )}
    </div>
  );
}
