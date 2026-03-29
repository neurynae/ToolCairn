'use client';

import type { ClarificationQuestion } from '@/lib/api-client';
import { useSearch } from '@/lib/use-search';
import { useCallback, useState } from 'react';
import { ClarificationStep } from './clarification-step';
import { ExampleQueries } from './example-queries';
import { PipelineProgress } from './pipeline-progress';
import { SearchInput } from './search-input';
import { SearchResults } from './search-results';

export function SearchHero() {
  const search = useSearch();
  const [inputValue, setInputValue] = useState('');

  const handleSubmit = useCallback(() => {
    const trimmed = inputValue.trim();
    if (!trimmed) return;
    search.search(trimmed);
  }, [inputValue, search]);

  const handleExample = useCallback(
    (query: string) => {
      setInputValue(query);
      search.search(query);
    },
    [search],
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

  const isIdle = search.state === 'idle';

  return (
    <div
      className={
        isIdle
          ? 'flex min-h-dvh flex-col items-center justify-center px-4'
          : 'flex flex-col items-center px-4 pt-12'
      }
    >
      {/* Branding — idle only */}
      {isIdle && (
        <div className="animate-fade-up mb-14 text-center">
          <h1
            className="mx-auto max-w-2xl font-bold leading-[1.1]"
            style={{
              fontSize: 'clamp(2rem, 5vw, 3.25rem)',
              letterSpacing: '-0.03em',
              color: 'var(--color-text-primary)',
            }}
          >
            Find the <span className="text-gradient-accent">right tool</span> for what you&apos;re
            building
          </h1>
          <p
            className="mt-4 text-xs font-semibold uppercase"
            style={{ color: 'var(--color-text-muted)', letterSpacing: '0.08em' }}
          >
            12,000+ tools indexed · Updated daily · Graph-powered
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
        <div className="fade-up mt-10 flex flex-col items-center gap-4">
          <div
            className="rounded-xl px-6 py-4 text-center"
            style={{
              background: 'rgba(239, 68, 68, 0.08)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
            }}
          >
            <p className="text-sm font-medium" style={{ color: '#f87171' }}>
              {search.error ?? 'Something went wrong'}
            </p>
          </div>
          <button
            type="button"
            onClick={search.reset}
            className="text-sm font-medium transition-colors"
            style={{ color: 'var(--color-accent)' }}
          >
            Try again
          </button>
        </div>
      )}

      {/* Reset when results shown */}
      {search.state === 'complete' && (
        <button
          type="button"
          onClick={() => {
            search.reset();
            setInputValue('');
          }}
          className="mt-8 mb-12 text-sm font-medium transition-colors"
          style={{ color: 'var(--color-text-muted)' }}
        >
          ← New search
        </button>
      )}
    </div>
  );
}
