import type { FormattedResult } from './format-results';

/* ─── Shared Types ───────────────────────────────────────────────────── */

export interface ClarificationQuestion {
  dimension: string;
  question: string;
  options: string[];
}

export interface SearchTiming {
  stage1_ms: number;
  stage2_ms: number;
  stage3_ms: number;
  stage4_ms: number;
  total_ms: number;
}

/* ─── Search ─────────────────────────────────────────────────────────── */

export type SearchResponse =
  | {
      ok: true;
      data: {
        query_id: string;
        status: 'clarification_needed';
        stage: number;
        candidate_count: number;
        questions: ClarificationQuestion[];
      };
    }
  | {
      ok: true;
      data: {
        query_id: string;
        status: 'complete';
        results: FormattedResult[];
        is_two_option: boolean;
        timing: SearchTiming;
      };
    }
  | { ok: false; error: string; message: string };

export async function startSearch(query: string): Promise<SearchResponse> {
  const res = await fetch('/api/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  });
  return res.json() as Promise<SearchResponse>;
}

export async function respondToClarification(
  queryId: string,
  answers: Array<{ dimension: string; value: string }>,
): Promise<SearchResponse> {
  const res = await fetch('/api/search/respond', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query_id: queryId, answers }),
  });
  return res.json() as Promise<SearchResponse>;
}

/* ─── Outcome ────────────────────────────────────────────────────────── */

export interface OutcomeRequest {
  query_id: string;
  chosen_tool: string;
  outcome: 'success' | 'failure' | 'replaced' | 'pending';
  reason?: string;
  feedback?: string;
}

export async function reportOutcome(req: OutcomeRequest): Promise<{ ok: boolean }> {
  const res = await fetch('/api/outcome', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  });
  return res.json() as Promise<{ ok: boolean }>;
}

/* ─── Issue Check ────────────────────────────────────────────────────── */

export interface IssueMatch {
  issue_number: number;
  title: string;
  state: 'open' | 'closed';
  labels: string[];
  github_url: string;
  similarity: number;
}

export type IssueCheckResponse =
  | {
      ok: true;
      data: {
        status: 'unreported' | 'possibly_related' | 'confirmed_known_issue';
        tool: string;
        message: string;
        top_match: IssueMatch | null;
        matches: IssueMatch[];
        search_mode: 'vector' | 'bm25_fallback';
      };
    }
  | { ok: false; error: string; message: string };

export async function checkIssue(
  toolName: string,
  issueTitle: string,
  issueUrl?: string,
): Promise<IssueCheckResponse> {
  const res = await fetch('/api/issue', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tool_name: toolName, issue_title: issueTitle, issue_url: issueUrl }),
  });
  return res.json() as Promise<IssueCheckResponse>;
}

/* ─── Stack ──────────────────────────────────────────────────────────── */

export interface StackTool {
  name: string;
  display_name: string;
  description: string;
  category: string;
  github_url: string;
  maintenance_score: number;
}

export type StackResponse =
  | { ok: true; data: { use_case: string; tools: StackTool[] } }
  | { ok: false; error: string; message: string };

export async function getStack(
  useCase: string,
  constraints?: { deployment_model?: string; language?: string; license?: string },
  limit?: number,
): Promise<StackResponse> {
  const res = await fetch('/api/stack', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ use_case: useCase, constraints, limit }),
  });
  return res.json() as Promise<StackResponse>;
}
