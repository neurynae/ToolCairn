import { config } from '@toolpilot/config';
import { MemgraphToolRepository } from '@toolpilot/graph';
import { ISSUES_COLLECTION_NAME, embedText, qdrantClient } from '@toolpilot/vector';
import { NextResponse } from 'next/server';
import pino from 'pino';
import { z } from 'zod';

const logger = pino({ name: '@toolpilot/public:api-issue' });
const repo = new MemgraphToolRepository();

const THRESHOLD_CONFIRMED = 0.8;
const THRESHOLD_POSSIBLY = 0.6;
const SEARCH_LIMIT = 5;

// ─── Types ────────────────────────────────────────────────────────────────────

interface IssuePayload {
  tool_name: string;
  issue_number: number;
  title: string;
  body: string;
  state: string;
  labels: string[];
  github_url: string;
  repo_url: string;
  created_at: string;
  updated_at: string;
}

interface ScoredHit {
  payload: IssuePayload;
  score: number;
}

// ─── Inline BM25 scorer for keyword fallback ──────────────────────────────────

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/\W+/)
    .filter((t) => t.length > 1);
}

function bm25IssueScore(query: string, title: string, body: string): number {
  const K1 = 1.5;
  const B = 0.75;
  const AVG_LEN = 50;
  const qTokens = tokenize(query);
  const titleToks = tokenize(title);
  const bodyToks = tokenize(body);
  const len = titleToks.length + bodyToks.length;
  let score = 0;
  for (const qt of qTokens) {
    const tf =
      titleToks.filter((t) => t === qt).length * 3.0 + bodyToks.filter((t) => t === qt).length;
    if (tf === 0) continue;
    score += (tf * (K1 + 1)) / (tf + K1 * (1 - B + B * (len / AVG_LEN)));
  }
  return score;
}

// ─── Response builder ─────────────────────────────────────────────────────────

function buildResponse(toolName: string, hits: ScoredHit[], isBm25: boolean) {
  const top = hits[0];
  const searchMode = isBm25 ? 'bm25_fallback' : 'vector';

  if (!top || top.score < THRESHOLD_POSSIBLY) {
    return {
      status: 'unreported',
      tool: toolName,
      message: `No matching issue found for '${toolName}'. This may be unreported.`,
      search_mode: searchMode,
      matches: [],
      top_match: null,
    };
  }

  const status = top.score >= THRESHOLD_CONFIRMED ? 'confirmed_known_issue' : 'possibly_related';
  const p = top.payload;

  return {
    status,
    tool: toolName,
    top_match: {
      issue_number: p.issue_number,
      title: p.title,
      state: p.state,
      labels: p.labels,
      github_url: p.github_url,
      similarity: Math.round(top.score * 1000) / 1000,
    },
    message:
      status === 'confirmed_known_issue'
        ? `This is a confirmed known issue in ${toolName}. See: ${p.github_url}`
        : `Possibly related to a known issue in ${toolName}. Review: ${p.github_url}`,
    search_mode: searchMode,
    matches: hits.slice(0, SEARCH_LIMIT).map((h) => ({
      issue_number: h.payload.issue_number,
      title: h.payload.title,
      state: h.payload.state,
      github_url: h.payload.github_url,
      similarity: Math.round(h.score * 1000) / 1000,
    })),
  };
}

// ─── Zod Schema ───────────────────────────────────────────────────────────────

const CheckIssueSchema = z.object({
  tool_name: z.string().min(1),
  issue_title: z.string().min(1),
  issue_url: z.string().url().optional(),
});

// ─── Handler ──────────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();
    const parsed = CheckIssueSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: 'validation_error', message: parsed.error.issues[0]?.message ?? 'Invalid input' },
        { status: 400 },
      );
    }

    const { tool_name, issue_title } = parsed.data;
    logger.info({ tool_name, issue_title }, 'check_issue called');

    // 1. Verify tool exists in Memgraph
    const toolResult = await repo.findByName(tool_name);
    if (!toolResult.ok) {
      return NextResponse.json(
        { ok: false, error: 'db_error', message: toolResult.error.message },
        { status: 500 },
      );
    }
    if (!toolResult.data) {
      return NextResponse.json(
        { ok: false, error: 'tool_not_found', message: `Tool '${tool_name}' is not in the ToolPilot index` },
        { status: 404 },
      );
    }

    // 2. Vector search path (when NOMIC_API_KEY is available)
    if (config.NOMIC_API_KEY) {
      const queryVector = await embedText(issue_title, 'search_query');
      const results = await qdrantClient().search(ISSUES_COLLECTION_NAME, {
        vector: queryVector,
        limit: SEARCH_LIMIT,
        with_payload: true,
        filter: {
          must: [{ key: 'tool_name', match: { value: tool_name } }],
        },
      });

      const hits: ScoredHit[] = (results as Array<{ payload: unknown; score: number }>).map(
        (r) => ({ payload: r.payload as IssuePayload, score: r.score }),
      );

      logger.info(
        { tool_name, hits: hits.length, topScore: hits[0]?.score },
        'check_issue vector search complete',
      );

      return NextResponse.json({ ok: true, data: buildResponse(tool_name, hits, false) });
    }

    // 3. BM25 fallback (no NOMIC_API_KEY) — scroll all issues for this tool
    logger.warn({ tool_name }, 'NOMIC_API_KEY absent — using BM25 fallback');

    const allPoints: Array<{ payload: unknown }> = [];
    let offset: string | number | null = null;

    do {
      const page = await qdrantClient().scroll(ISSUES_COLLECTION_NAME, {
        filter: {
          must: [{ key: 'tool_name', match: { value: tool_name } }],
        },
        limit: 100,
        with_payload: true,
        with_vector: false,
        ...(offset != null ? { offset } : {}),
      });
      allPoints.push(...(page.points as Array<{ payload: unknown }>));
      offset = (page.next_page_offset as string | number | null | undefined) ?? null;
    } while (offset != null);

    const scored = allPoints
      .map((p) => {
        const payload = p.payload as IssuePayload;
        return {
          payload,
          score: bm25IssueScore(issue_title, payload.title, payload.body),
        };
      })
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, SEARCH_LIMIT);

    // Normalize scores to [0, 1] (max item = 1.0)
    const maxScore = scored[0]?.score ?? 1;
    const hits: ScoredHit[] = scored.map((r) => ({
      payload: r.payload,
      score: r.score / maxScore,
    }));

    logger.info(
      { tool_name, totalScanned: allPoints.length, hits: hits.length },
      'check_issue BM25 search complete',
    );

    return NextResponse.json({ ok: true, data: buildResponse(tool_name, hits, true) });
  } catch (e) {
    logger.error({ err: e }, 'check_issue failed');
    return NextResponse.json(
      { ok: false, error: 'internal_error', message: e instanceof Error ? e.message : String(e) },
      { status: 500 },
    );
  }
}
