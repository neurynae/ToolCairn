import { prisma } from './prisma';

export interface DailySessionVolume {
  date: string; // ISO date string (YYYY-MM-DD)
  sessions: number;
  completions: number;
}

export interface ClarificationEffectiveness {
  question: string;
  totalAsked: number;
  answeredCount: number;
  answerRate: number;
}

export interface OutcomeDistribution {
  outcome: string;
  count: number;
}

export interface MetricsData {
  sessionStats: {
    total: number;
    completed: number;
    abandoned: number;
    completionRate: number;
  };
  clarificationEffectiveness: ClarificationEffectiveness[];
  outcomeDistribution: OutcomeDistribution[];
  topChosenTools: { tool: string; count: number }[];
  dailySessionVolume: DailySessionVolume[];
}

/**
 * Aggregate clarification questions from SearchSession.clarification_history.
 * Each history entry is [{ question, options, answer }] — we count how many
 * sessions had each question asked and how many received an answer.
 *
 * This is done in-memory after fetching all non-null histories.
 */
function aggregateClarifications(
  histories: Array<Array<{ question: string; answer?: string | null }>>,
): ClarificationEffectiveness[] {
  const map = new Map<string, { asked: number; answered: number }>();

  for (const history of histories) {
    for (const entry of history) {
      if (!entry.question) continue;
      const existing = map.get(entry.question) ?? { asked: 0, answered: 0 };
      existing.asked += 1;
      if (entry.answer != null && entry.answer !== '') existing.answered += 1;
      map.set(entry.question, existing);
    }
  }

  return [...map.entries()]
    .map(([question, { asked, answered }]) => ({
      question,
      totalAsked: asked,
      answeredCount: answered,
      answerRate: asked > 0 ? answered / asked : 0,
    }))
    .sort((a, b) => b.totalAsked - a.totalAsked)
    .slice(0, 20);
}

export async function getMetrics(days: number): Promise<MetricsData> {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const [sessions, outcomes, dailyVolume] = await Promise.all([
    // All sessions in window with clarification histories
    prisma.searchSession.findMany({
      where: { created_at: { gte: since } },
      select: { status: true, clarification_history: true },
    }),
    // Outcome distribution + top tools
    prisma.outcomeReport.groupBy({
      by: ['outcome'],
      where: { created_at: { gte: since } },
      _count: { outcome: true },
    }),
    // Daily volume — raw SQL for DATE_TRUNC
    prisma.$queryRaw<Array<{ date: Date; sessions: bigint; completions: bigint }>>`
      SELECT DATE_TRUNC('day', created_at) AS date,
             COUNT(*) AS sessions,
             COUNT(*) FILTER (WHERE status = 'completed') AS completions
      FROM "SearchSession"
      WHERE created_at >= ${since}
      GROUP BY 1
      ORDER BY 1
    `,
  ]);

  const topTools = await prisma.outcomeReport.groupBy({
    by: ['chosen_tool'],
    where: { created_at: { gte: since } },
    _count: { chosen_tool: true },
    orderBy: { _count: { chosen_tool: 'desc' } },
    take: 10,
  });

  const total = sessions.length;
  const completed = sessions.filter((s: { status: string }) => s.status === 'completed').length;
  const abandoned = sessions.filter((s: { status: string }) => s.status === 'abandoned').length;

  const clarificationHistories = sessions
    .map(
      (s: { clarification_history: unknown }) =>
        s.clarification_history as Array<{ question: string; answer?: string | null }>,
    )
    .filter((h) => h.length > 0);

  const outcomeDistribution: OutcomeDistribution[] = outcomes.map((o) => ({
    outcome: o.outcome ?? 'unknown',
    count: o._count.outcome,
  }));

  return {
    sessionStats: {
      total,
      completed,
      abandoned,
      completionRate: total > 0 ? completed / total : 0,
    },
    clarificationEffectiveness: aggregateClarifications(clarificationHistories),
    outcomeDistribution,
    topChosenTools: topTools.map((t) => ({
      tool: t.chosen_tool,
      count: t._count.chosen_tool,
    })),
    dailySessionVolume: dailyVolume.map((row) => ({
      date: row.date.toISOString().slice(0, 10),
      sessions: Number(row.sessions),
      completions: Number(row.completions),
    })),
  };
}
