import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock Prisma client
vi.mock('./prisma.js', () => ({
  prisma: {
    stagedNode: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
  },
}));

// Mock Memgraph repository
vi.mock('@toolpilot/graph', () => ({
  MemgraphToolRepository: vi.fn().mockImplementation(() => ({
    createTool: vi.fn().mockResolvedValue({ ok: true, data: {} }),
  })),
}));

import { prisma } from './prisma.js';
import { approveStagedNode, listPendingReview, rejectStagedNode } from './staged-review.service.js';

const mockPrisma = prisma as unknown as {
  stagedNode: {
    findUnique: ReturnType<typeof vi.fn>;
    findMany: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    count: ReturnType<typeof vi.fn>;
  };
};

function makeNode(overrides = {}) {
  return {
    id: 'node-1',
    node_type: 'Tool',
    node_data: {
      id: 'tool-1',
      name: 'test-tool',
      display_name: 'Test Tool',
      description: '',
      category: 'ai',
      github_url: '',
      license: '',
      language: '',
      languages: [],
      deployment_models: [],
      package_managers: {},
      health: {
        stars: 0,
        stars_velocity_90d: 0,
        last_commit_date: '',
        commit_velocity_30d: 0,
        open_issues: 0,
        closed_issues_30d: 0,
        pr_response_time_hours: 0,
        contributor_count: 0,
        contributor_trend: 0,
        last_release_date: '',
        maintenance_score: 0,
      },
      docs: {},
      created_at: '',
      updated_at: '',
    },
    confidence: 0.85,
    source: 'ai_generated',
    supporting_queries: [],
    graduated: false,
    reviewed_at: null,
    reviewed_by: null,
    rejection_reason: null,
    created_at: new Date(),
    updated_at: new Date(),
    ...overrides,
  };
}

describe('listPendingReview', () => {
  it('returns paginated items with counts', async () => {
    const node = makeNode();
    mockPrisma.stagedNode.findMany.mockResolvedValue([node]);
    mockPrisma.stagedNode.count.mockResolvedValue(1);

    const result = await listPendingReview(1, 20);
    expect(result.items).toHaveLength(1);
    expect(result.total).toBe(1);
    expect(result.pendingCount).toBe(1);
    expect(result.page).toBe(1);
  });
});

describe('approveStagedNode', () => {
  beforeEach(() => vi.clearAllMocks());

  it('marks node as graduated', async () => {
    const node = makeNode();
    mockPrisma.stagedNode.findUnique.mockResolvedValue(node);
    mockPrisma.stagedNode.update.mockResolvedValue({
      ...node,
      graduated: true,
      reviewed_at: new Date(),
    });

    const result = await approveStagedNode('node-1', 'admin');
    expect(result.graduated).toBe(true);
  });

  it('throws if node already reviewed', async () => {
    const node = makeNode({ reviewed_at: new Date() });
    mockPrisma.stagedNode.findUnique.mockResolvedValue(node);

    await expect(approveStagedNode('node-1', 'admin')).rejects.toThrow('already reviewed');
  });

  it('throws if node not found', async () => {
    mockPrisma.stagedNode.findUnique.mockResolvedValue(null);

    await expect(approveStagedNode('missing', 'admin')).rejects.toThrow('not found');
  });

  it('rolls back on Memgraph failure', async () => {
    const { MemgraphToolRepository } = await import('@toolpilot/graph');
    (MemgraphToolRepository as ReturnType<typeof vi.fn>).mockImplementationOnce(() => ({
      createTool: vi.fn().mockRejectedValue(new Error('Memgraph down')),
    }));

    const node = makeNode();
    mockPrisma.stagedNode.findUnique.mockResolvedValue(node);
    mockPrisma.stagedNode.update.mockResolvedValueOnce({
      ...node,
      graduated: true,
      reviewed_at: new Date(),
    });
    mockPrisma.stagedNode.update.mockResolvedValueOnce({
      ...node,
      graduated: false,
      reviewed_at: null,
    });

    await expect(approveStagedNode('node-1', 'admin')).rejects.toThrow('Memgraph down');
    // Second update call = rollback
    expect(mockPrisma.stagedNode.update).toHaveBeenCalledTimes(2);
  });
});

describe('rejectStagedNode', () => {
  beforeEach(() => vi.clearAllMocks());

  it('sets rejection reason', async () => {
    const node = makeNode();
    mockPrisma.stagedNode.findUnique.mockResolvedValue(node);
    mockPrisma.stagedNode.update.mockResolvedValue({
      ...node,
      reviewed_at: new Date(),
      rejection_reason: 'Duplicate',
    });

    const result = await rejectStagedNode('node-1', 'admin', 'Duplicate');
    expect(result.id).toBe('node-1');
  });

  it('throws if rejection reason is empty', async () => {
    await expect(rejectStagedNode('node-1', 'admin', '')).rejects.toThrow(
      'Rejection reason is required',
    );
  });

  it('throws if node already reviewed', async () => {
    const node = makeNode({ reviewed_at: new Date() });
    mockPrisma.stagedNode.findUnique.mockResolvedValue(node);

    await expect(rejectStagedNode('node-1', 'admin', 'reason')).rejects.toThrow('already reviewed');
  });
});
