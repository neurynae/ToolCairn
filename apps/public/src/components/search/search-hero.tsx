'use client';

import type { ClarificationQuestion } from '@/lib/api-client';
import { useSearch } from '@/lib/use-search';
import { useCallback, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { addSearchHistory } from '@/lib/search-history';
import { ClarificationStep } from './clarification-step';
import { ExampleQueries } from './example-queries';
import { PipelineProgress } from './pipeline-progress';
import { SearchInput } from './search-input';
import { SearchResults } from './search-results';

export function SearchHero() {
  const search = useSearch();
  const [inputValue, setInputValue] = useState('');
  const searchParams = useSearchParams();
  const router = useRouter();

  // Auto-trigger search from URL param
  useEffect(() => {
    const q = searchParams.get('q');
    if (q && search.state === 'idle') {
      setInputValue(q);
      search.search(q);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = useCallback(() => {
    const trimmed = inputValue.trim();
    if (!trimmed) return;
    // Update URL for shareability
    router.replace(`/?q=${encodeURIComponent(trimmed)}`, { scroll: false });
    search.search(trimmed);
    addSearchHistory(trimmed);
  }, [inputValue, search, router]);

  const handleExample = useCallback(
    (query: string) => {
      setInputValue(query);
      router.replace(`/?q=${encodeURIComponent(query)}`, { scroll: false });
      search.search(query);
      addSearchHistory(query);
    },
    [search, router],
  );

  const handleAnswer = useCallback(
    (dimension: string, value: string) => {
      search.answer(dimension, value);
    },
    [search],
  );

  const handleSkip = useCallback(() => {
    const currentQ = search.questions[search.currentQuestionIndex];
    if (currentQ) {
      search.answer(currentQ.dimension, 'any');
    }
  }, [search]);

  const handleReset = useCallback(() => {
    search.reset();
    setInputValue('');
    router.replace('/', { scroll: false });
  }, [search, router]);

  const isIdle = search.state === 'idle';

  return (
    <div
      className={
        isIdle
          ? 'flex min-h-[calc(100dvh-56px)] flex-col items-center justify-center px-4'
          : 'flex flex-col items-center px-4 pt-12'
      }
    >
      {/* Hero branding — idle only */}
      {isIdle && (
        <div className="animate-fade-up mb-14 text-center">
          <div className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-[var(--tp-accent)]/20 bg-[var(--tp-accent-subtle)] px-3 py-1 text-xs font-medium text-[var(--tp-accent)]">
            <span className="size-1.5 rounded-full bg-[var(--tp-health-active)] animate-pulse" />
            12,000+ tools indexed · Updated daily
          </div>
          <h1
            className="mx-auto max-w-2xl font-bold leading-[1.1] text-foreground"
            style={{
              fontSize: 'clamp(2rem, 5vw, 3.25rem)',
              letterSpacing: '-0.03em',
            }}
          >
            Find the <span className="text-gradient-accent">right tool</span>{' '}
            for what you&apos;re building
          </h1>
          <p className="mt-4 text-sm text-muted-foreground">
            Graph-powered tool intelligence — search, compare, and verify dev tools in seconds.
          </p>
        </div>
      )}

      {/* Search input — always visible */}
      <SearchInput
        value={inputValue}
        onChange={setInputValue}
        onSubmit={handleSubmit}
        disabled={search.state === 'searching'}
        placeholder="Describe what you're building..."
      />

      {/* Idle: example queries */}
      {isIdle && <ExampleQueries onSelect={handleExample} />}

      {/* Searching */}
      {search.state === 'searching' && (
        <PipelineProgress candidateCount={search.candidateCount} stage="searching" />
      )}

      {/* Clarifying */}
      {search.state === 'clarifying' && search.currentQuestionIndex < search.questions.length && (
        <ClarificationStep
          question={search.questions[search.currentQuestionIndex] as ClarificationQuestion}
          questionIndex={search.currentQuestionIndex}
          totalQuestions={search.questions.length}
          onAnswer={handleAnswer}
          onSkip={handleSkip}
        />
      )}

      {/* Complete */}
      {search.state === 'complete' && (
        <SearchResults
          results={search.results}
          isTwoOption={search.isTwoOption}
          timing={search.timing}
          queryId={search.queryId}
        />
      )}

      {/* Error */}
      {search.state === 'error' && (
        <div className="animate-fade-up mt-10 flex flex-col items-center gap-4">
          <div className="rounded-xl border border-destructive/20 bg-destructive/8 px-6 py-4 text-center">
            <p className="text-sm font-medium text-destructive">
              {search.error ?? 'Something went wrong. Please try again.'}
            </p>
          </div>
          <button
            type="button"
            onClick={handleReset}
            className="text-sm font-medium text-[var(--tp-accent)] transition-colors hover:text-[var(--tp-accent-hover)]"
          >
            Try again
          </button>
        </div>
      )}

      {/* Reset */}
      {search.state === 'complete' && (
        <button
          type="button"
          onClick={handleReset}
          className="mb-12 mt-8 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          ← New search
        </button>
      )}
    </div>
  );
}
