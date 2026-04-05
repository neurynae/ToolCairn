'use client';

import { CheckCircleIcon } from 'lucide-react';
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
    <div className="animate-fade-up mx-auto mt-10 flex w-full max-w-4xl flex-col gap-8">
      {/* Timing */}
      {timing && (
        <p className="flex items-center justify-center gap-1.5 text-center text-xs font-medium text-muted-foreground">
          <CheckCircleIcon className="size-3.5 text-[var(--tp-health-active)]" />
          Found in {timing.total_ms}ms
        </p>
      )}

      {/* Results layout */}
      {isSingle ? (
        <div>
          <p className="mb-3 text-sm font-semibold text-[var(--tp-accent)]">Your best match</p>
          <ResultCard result={primary} />
        </div>
      ) : (
        <div>
          <p className="mb-3 text-sm font-semibold text-muted-foreground">Two strong options</p>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="animate-fade-up-delay-1">
              <ResultCard result={primary} label="Recommended" />
            </div>
            {secondary && (
              <div className="animate-fade-up-delay-2">
                <ResultCard result={secondary} label="Worth Evaluating" />
              </div>
            )}
          </div>
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
