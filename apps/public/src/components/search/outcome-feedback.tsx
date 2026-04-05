'use client';

import { reportOutcome } from '@/lib/api-client';
import { useCallback, useEffect, useState } from 'react';

interface OutcomeFeedbackProps {
  queryId: string | null;
  chosenTool: string;
}

type FeedbackState = 'hidden' | 'visible' | 'negative-form' | 'submitted';

export function OutcomeFeedback({ queryId, chosenTool }: OutcomeFeedbackProps) {
  const [feedbackState, setFeedbackState] = useState<FeedbackState>('hidden');
  const [feedbackText, setFeedbackText] = useState('');

  // Appear after 3 seconds
  useEffect(() => {
    const timer = setTimeout(() => setFeedbackState('visible'), 3000);
    return () => clearTimeout(timer);
  }, []);

  const handlePositive = useCallback(async () => {
    if (!queryId) return;
    setFeedbackState('submitted');
    await reportOutcome({
      query_id: queryId,
      chosen_tool: chosenTool,
      outcome: 'success',
    });
  }, [queryId, chosenTool]);

  const handleNegative = useCallback(() => {
    setFeedbackState('negative-form');
  }, []);

  const handleSubmitNegative = useCallback(async () => {
    if (!queryId) return;
    setFeedbackState('submitted');
    await reportOutcome({
      query_id: queryId,
      chosen_tool: chosenTool,
      outcome: 'failure',
      feedback: feedbackText || undefined,
    });
  }, [queryId, chosenTool, feedbackText]);

  if (feedbackState === 'hidden') return null;

  if (feedbackState === 'submitted') {
    return (
      <div className="fade-up text-center">
        <p className="text-sm font-medium" style={{ color: 'var(--tp-accent)' }}>
          Thanks for your feedback!
        </p>
      </div>
    );
  }

  return (
    <div className="fade-up flex flex-col items-center gap-3">
      <p className="text-sm" style={{ color: 'var(--tp-text-muted)' }}>
        Was this helpful?
      </p>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handlePositive}
          className="rounded-lg px-4 py-2 text-sm font-medium transition-all hover:scale-105"
          style={{
            background: 'rgba(16, 185, 129, 0.12)',
            color: '#34d399',
            border: '1px solid rgba(16, 185, 129, 0.2)',
          }}
          aria-label="Thumbs up"
        >
          👍 Yes
        </button>
        <button
          type="button"
          onClick={handleNegative}
          className="rounded-lg px-4 py-2 text-sm font-medium transition-all hover:scale-105"
          style={{
            background: 'rgba(239, 68, 68, 0.12)',
            color: '#f87171',
            border: '1px solid rgba(239, 68, 68, 0.2)',
          }}
          aria-label="Thumbs down"
        >
          👎 No
        </button>
      </div>

      {feedbackState === 'negative-form' && (
        <div className="fade-up flex w-full max-w-md flex-col gap-3">
          <textarea
            value={feedbackText}
            onChange={(e) => setFeedbackText(e.target.value)}
            placeholder="What went wrong? How can we improve?"
            rows={3}
            className="w-full resize-none rounded-lg px-3 py-2 text-sm outline-none placeholder:text-[var(--tp-text-muted)]"
            style={{
              background: 'var(--tp-surface-2)',
              color: 'var(--tp-text-primary)',
              border: '1px solid var(--tp-border-subtle)',
            }}
          />
          <button
            type="button"
            onClick={handleSubmitNegative}
            className="self-end rounded-lg px-4 py-1.5 text-sm font-medium transition-colors"
            style={{
              background: 'var(--tp-accent)',
              color: '#fff',
            }}
          >
            Send Feedback
          </button>
        </div>
      )}
    </div>
  );
}
