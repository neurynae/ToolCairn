'use client';

import type { ClarificationQuestion } from '@/lib/api-client';

interface ClarificationStepProps {
  question: ClarificationQuestion;
  questionIndex: number;
  totalQuestions: number;
  onAnswer: (dimension: string, value: string) => void;
  onSkip: () => void;
}

export function ClarificationStep({
  question,
  questionIndex,
  totalQuestions,
  onAnswer,
  onSkip,
}: ClarificationStepProps) {
  const compact = question.options.length > 8;

  return (
    <div className="animate-fade-up mx-auto mt-10 flex w-full max-w-2xl flex-col items-center gap-6">
      {/* Progress indicator */}
      <div className="flex items-center gap-2">
        {Array.from({ length: totalQuestions }, (_, i) => (
          <span
            key={`step-${i.toString()}`}
            className="inline-block h-1.5 rounded-full transition-all duration-300"
            style={{
              width: i === questionIndex ? '24px' : '8px',
              background: i <= questionIndex ? 'var(--tp-accent)' : 'var(--tp-surface-3)',
              boxShadow: i === questionIndex ? '0 0 8px rgba(99,102,241,0.5)' : 'none',
            }}
          />
        ))}
      </div>

      {/* Question */}
      <div className="text-center">
        <p
          className="text-[11px] font-semibold uppercase"
          style={{ color: 'rgba(99, 102, 241, 0.8)', letterSpacing: '0.12em' }}
        >
          Question {questionIndex + 1} of {totalQuestions}
        </p>
        <h2
          className="mt-3 font-bold"
          style={{
            fontSize: '1.5rem',
            letterSpacing: '-0.02em',
            lineHeight: 1.2,
            color: 'var(--tp-text-primary)',
          }}
        >
          {question.question}
        </h2>
      </div>

      {/* Option tiles */}
      {compact ? (
        <CompactOptions question={question} onAnswer={onAnswer} />
      ) : (
        <TileOptions question={question} onAnswer={onAnswer} />
      )}

      {/* Skip */}
      <button
        type="button"
        onClick={onSkip}
        className="text-sm transition-colors hover:text-[var(--tp-text-secondary)] hover:underline"
        style={{ color: 'var(--tp-text-muted)' }}
      >
        Skip this question
      </button>
    </div>
  );
}

/* ─── Tile Grid (≤ 8 options) ────────────────────────────────────────── */

function TileOptions({
  question,
  onAnswer,
}: {
  question: ClarificationQuestion;
  onAnswer: (dimension: string, value: string) => void;
}) {
  const cols =
    question.options.length <= 3 ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-2 sm:grid-cols-4';

  return (
    <div className={`grid w-full gap-3 ${cols}`}>
      {question.options.map((option, i) => (
        <button
          key={option}
          type="button"
          onClick={() => onAnswer(question.dimension, option)}
          className="tile-option group relative w-full p-4 text-left"
          style={{ animationDelay: `${i * 50}ms` }}
        >
          <span className="text-sm font-semibold" style={{ color: 'var(--tp-text-primary)' }}>
            {option}
          </span>
          <span
            className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 transition-opacity duration-150 group-hover:opacity-100"
            style={{ color: 'var(--tp-accent)' }}
            aria-hidden="true"
          >
            →
          </span>
        </button>
      ))}
    </div>
  );
}

/* ─── Compact List (> 8 options) ─────────────────────────────────────── */

function CompactOptions({
  question,
  onAnswer,
}: {
  question: ClarificationQuestion;
  onAnswer: (dimension: string, value: string) => void;
}) {
  return (
    <div className="flex w-full flex-wrap justify-center gap-2">
      {question.options.map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => onAnswer(question.dimension, option)}
          className="rounded-lg px-3 py-1.5 text-sm font-medium transition-all duration-150 hover:border-[rgba(99,102,241,0.35)] hover:bg-[rgba(99,102,241,0.07)] hover:scale-[1.03]"
          style={{
            background: 'var(--tp-surface-2)',
            color: 'var(--tp-text-primary)',
            border: '1px solid var(--tp-border-subtle)',
          }}
        >
          {option}
        </button>
      ))}
    </div>
  );
}
