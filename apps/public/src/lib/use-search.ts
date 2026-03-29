'use client';

import { useCallback, useReducer } from 'react';

import type { ClarificationQuestion, SearchTiming } from '@/lib/api-client';
import { respondToClarification, startSearch } from '@/lib/api-client';
import type { FormattedResult } from '@/lib/format-results';

/* ─── State ──────────────────────────────────────────────────────────── */

type SearchStatus = 'idle' | 'searching' | 'clarifying' | 'complete' | 'error';

interface SearchState {
  state: SearchStatus;
  query: string;
  queryId: string | null;
  candidateCount: number;
  questions: ClarificationQuestion[];
  currentQuestionIndex: number;
  answers: Array<{ dimension: string; value: string }>;
  results: FormattedResult[];
  isTwoOption: boolean;
  timing: SearchTiming | null;
  error: string | null;
}

const initialState: SearchState = {
  state: 'idle',
  query: '',
  queryId: null,
  candidateCount: 0,
  questions: [],
  currentQuestionIndex: 0,
  answers: [],
  results: [],
  isTwoOption: false,
  timing: null,
  error: null,
};

/* ─── Actions ────────────────────────────────────────────────────────── */

type Action =
  | { type: 'SEARCH_START'; query: string }
  | {
      type: 'SEARCH_CLARIFY';
      queryId: string;
      candidateCount: number;
      questions: ClarificationQuestion[];
    }
  | {
      type: 'SEARCH_COMPLETE';
      results: FormattedResult[];
      isTwoOption: boolean;
      timing: SearchTiming;
      queryId: string;
    }
  | { type: 'SEARCH_ERROR'; error: string }
  | { type: 'ANSWER'; dimension: string; value: string }
  | { type: 'RESOLVING' }
  | { type: 'RESET' };

function reducer(state: SearchState, action: Action): SearchState {
  switch (action.type) {
    case 'SEARCH_START':
      return { ...initialState, state: 'searching', query: action.query };

    case 'SEARCH_CLARIFY':
      return {
        ...state,
        state: 'clarifying',
        queryId: action.queryId,
        candidateCount: action.candidateCount,
        questions: action.questions,
        currentQuestionIndex: 0,
        answers: [],
      };

    case 'SEARCH_COMPLETE':
      return {
        ...state,
        state: 'complete',
        queryId: action.queryId,
        results: action.results,
        isTwoOption: action.isTwoOption,
        timing: action.timing,
      };

    case 'SEARCH_ERROR':
      return { ...state, state: 'error', error: action.error };

    case 'ANSWER':
      return {
        ...state,
        answers: [...state.answers, { dimension: action.dimension, value: action.value }],
        currentQuestionIndex: state.currentQuestionIndex + 1,
      };

    case 'RESOLVING':
      return { ...state, state: 'searching' };

    case 'RESET':
      return initialState;

    default:
      return state;
  }
}

/* ─── Hook ───────────────────────────────────────────────────────────── */

export function useSearch() {
  const [state, dispatch] = useReducer(reducer, initialState);

  const search = useCallback(async (query: string) => {
    dispatch({ type: 'SEARCH_START', query });

    try {
      const res = await startSearch(query);

      if (!res.ok) {
        dispatch({ type: 'SEARCH_ERROR', error: res.error });
        return;
      }

      if (res.data.status === 'clarification_needed') {
        dispatch({
          type: 'SEARCH_CLARIFY',
          queryId: res.data.query_id,
          candidateCount: res.data.candidate_count,
          questions: res.data.questions,
        });
      } else {
        dispatch({
          type: 'SEARCH_COMPLETE',
          queryId: res.data.query_id,
          results: res.data.results,
          isTwoOption: res.data.is_two_option,
          timing: res.data.timing,
        });
      }
    } catch (err) {
      dispatch({
        type: 'SEARCH_ERROR',
        error: err instanceof Error ? err.message : 'An unexpected error occurred',
      });
    }
  }, []);

  const answer = useCallback(
    async (dimension: string, value: string) => {
      const newAnswers = [...state.answers, { dimension, value }];
      dispatch({ type: 'ANSWER', dimension, value });

      const isLastQuestion = state.currentQuestionIndex >= state.questions.length - 1;
      if (!isLastQuestion || !state.queryId) return;

      // All questions answered — resolve with accumulated answers
      dispatch({ type: 'RESOLVING' });

      try {
        const res = await respondToClarification(state.queryId, newAnswers);

        if (!res.ok) {
          dispatch({ type: 'SEARCH_ERROR', error: res.error });
          return;
        }

        if (res.data.status === 'complete') {
          dispatch({
            type: 'SEARCH_COMPLETE',
            queryId: res.data.query_id,
            results: res.data.results,
            isTwoOption: res.data.is_two_option,
            timing: res.data.timing,
          });
        }
      } catch (err) {
        dispatch({
          type: 'SEARCH_ERROR',
          error: err instanceof Error ? err.message : 'Failed to process answers',
        });
      }
    },
    [state.answers, state.currentQuestionIndex, state.questions.length, state.queryId],
  );

  const reset = useCallback(() => {
    dispatch({ type: 'RESET' });
  }, []);

  return {
    state: state.state,
    query: state.query,
    queryId: state.queryId,
    candidateCount: state.candidateCount,
    questions: state.questions,
    currentQuestionIndex: state.currentQuestionIndex,
    results: state.results,
    isTwoOption: state.isTwoOption,
    timing: state.timing,
    error: state.error,
    search,
    answer,
    reset,
  };
}
