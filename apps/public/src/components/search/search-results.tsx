'use client';

import type { SearchTiming } from '@/lib/api-client';
import type { FormattedResult } from '@/lib/format-results';
import { FollowUpPills } from './follow-up-pills';
import { OutcomeFeedback } from './outcome-feedback';
import { ResultCard } from './result-card';

interface SearchResultsProps {
  results: FormattedResult[];
  isTwoOption: boolean;
  timing: SearchTiming | null;
  queryId: string | null;
}

export function SearchResults({ results, isTwoOption, timing, queryId }: SearchResultsProps) {
  if (results.length === 0) return null;

  const isSingle = results.length === 1 || !isTwoOption;
  const primary = results[0] as FormattedResult;
  const secondary = isTwoOption && results.length > 1 ? (results[1] as FormattedResult) : null;

  return (
    <div className="fade-up mx-auto mt-10 flex w-full max-w-4xl flex-col gap-8">
      {/* Timing */}
      {timing && (
        <p className="text-center text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>
          Found in {timing.total_ms}ms
        </p>
      )}

      {/* Results layout */}
      {isSingle ? (
        <div>
          <p className="mb-3 text-sm font-medium" style={{ color: 'var(--color-accent)' }}>
            Your best match
          </p>
          <ResultCard result={primary} />
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          <div className="fade-up">
            <ResultCard result={primary} label="Recommended" />
          </div>
          {secondary && (
            <div className="fade-up" style={{ animationDelay: '80ms' }}>
              <ResultCard result={secondary} label="Worth Evaluating" />
            </div>
          )}
        </div>
      )}

      {/* Feedback & follow-up */}
      <div className="flex flex-col gap-6">
        {queryId && <OutcomeFeedback queryId={queryId} chosenTool={primary.tool} />}
        <FollowUpPills toolName={primary.tool} category={primary.category} />
      </div>
    </div>
  );
}
