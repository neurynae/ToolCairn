import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('./prisma.js', () => ({
  prisma: {
    searchSession: {
      findMany: vi.fn(),
    },
    outcomeReport: {
      groupBy: vi.fn(),
    },
    $queryRaw: vi.fn(),
  },
}));

import { getMetrics } from './metrics.service.js';
import { prisma } from './prisma.js';

const mockPrisma = prisma as unknown as {
  searchSession: { findMany: ReturnType<typeof vi.fn> };
  outcomeReport: { groupBy: ReturnType<typeof vi.fn> };
  $queryRaw: ReturnType<typeof vi.fn>;
};

describe('getMetrics', () => {
  beforeEach(() => vi.clearAllMocks());

  it('computes completion rate correctly', async () => {
    mockPrisma.searchSession.findMany.mockResolvedValue([
      { status: 'completed', clarification_history: [] },
      { status: 'completed', clarification_history: [] },
      { status: 'abandoned', clarification_history: [] },
      { status: 'active', clarification_history: [] },
    ]);
    mockPrisma.outcomeReport.groupBy
      .mockResolvedValueOnce([]) // outcome distribution
      .mockResolvedValueOnce([]); // top tools
    mockPrisma.$queryRaw.mockResolvedValue([]);

    const result = await getMetrics(30);
    expect(result.sessionStats.total).toBe(4);
    expect(result.sessionStats.completed).toBe(2);
    expect(result.sessionStats.abandoned).toBe(1);
    expect(result.sessionStats.completionRate).toBe(0.5);
  });

  it('aggregates clarification questions across sessions', async () => {
    mockPrisma.searchSession.findMany.mockResolvedValue([
      {
        status: 'completed',
        clarification_history: [
          { question: 'What is your use case?', answer: 'search' },
          { question: 'Scale?', answer: null },
        ],
      },
      {
        status: 'completed',
        clarification_history: [{ question: 'What is your use case?', answer: 'storage' }],
      },
    ]);
    mockPrisma.outcomeReport.groupBy.mockResolvedValueOnce([]).mockResolvedValueOnce([]);
    mockPrisma.$queryRaw.mockResolvedValue([]);

    const result = await getMetrics(30);
    const useCaseQ = result.clarificationEffectiveness.find(
      (e) => e.question === 'What is your use case?',
    );
    expect(useCaseQ).toBeDefined();
    expect(useCaseQ?.totalAsked).toBe(2);
    expect(useCaseQ?.answeredCount).toBe(2);
    expect(useCaseQ?.answerRate).toBe(1);

    const scaleQ = result.clarificationEffectiveness.find((e) => e.question === 'Scale?');
    expect(scaleQ?.answeredCount).toBe(0);
    expect(scaleQ?.answerRate).toBe(0);
  });

  it('handles null outcome gracefully', async () => {
    mockPrisma.searchSession.findMany.mockResolvedValue([]);
    mockPrisma.outcomeReport.groupBy
      .mockResolvedValueOnce([{ outcome: null, _count: { outcome: 3 } }])
      .mockResolvedValueOnce([]);
    mockPrisma.$queryRaw.mockResolvedValue([]);

    const result = await getMetrics(30);
    expect(result.outcomeDistribution[0]?.outcome).toBe('unknown');
  });

  it('converts BigInt daily volume rows to number', async () => {
    mockPrisma.searchSession.findMany.mockResolvedValue([]);
    mockPrisma.outcomeReport.groupBy.mockResolvedValueOnce([]).mockResolvedValueOnce([]);
    mockPrisma.$queryRaw.mockResolvedValue([
      { date: new Date('2024-01-01'), sessions: BigInt(5), completions: BigInt(3) },
    ]);

    const result = await getMetrics(30);
    expect(result.dailySessionVolume[0]?.sessions).toBe(5);
    expect(result.dailySessionVolume[0]?.completions).toBe(3);
  });
});
