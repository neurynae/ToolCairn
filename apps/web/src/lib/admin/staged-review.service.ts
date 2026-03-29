import type { ToolNode } from '@toolpilot/core';
import { MemgraphToolRepository } from '@toolpilot/graph';
import { prisma } from './prisma';

export interface ReviewItem {
  id: string;
  nodeType: string;
  nodeData: Record<string, unknown>;
  confidence: number;
  source: string;
  supportingQueries: string[];
  graduated: boolean;
  createdAt: Date;
}

export interface ReviewListResult {
  items: ReviewItem[];
  total: number;
  page: number;
  pendingCount: number;
}

export interface ApproveResult {
  id: string;
  graduated: boolean;
  reviewedAt: Date;
}

export interface RejectResult {
  id: string;
  reviewed_at: Date;
}

function toReviewItem(node: {
  id: string;
  node_type: string;
  node_data: unknown;
  confidence: number;
  source: string;
  supporting_queries: string[];
  graduated: boolean;
  created_at: Date;
}): ReviewItem {
  return {
    id: node.id,
    nodeType: node.node_type,
    nodeData: (node.node_data as Record<string, unknown>) ?? {},
    confidence: node.confidence,
    source: node.source,
    supportingQueries: node.supporting_queries,
    graduated: node.graduated,
    createdAt: node.created_at,
  };
}

export async function listPendingReview(page: number, pageSize: number): Promise<ReviewListResult> {
  const skip = (page - 1) * pageSize;

  const [items, total, pendingCount] = await Promise.all([
    prisma.stagedNode.findMany({
      where: { graduated: false, reviewed_at: null },
      orderBy: { confidence: 'desc' },
      skip,
      take: pageSize,
    }),
    prisma.stagedNode.count({ where: { graduated: false, reviewed_at: null } }),
    prisma.stagedNode.count({ where: { graduated: false, reviewed_at: null } }),
  ]);

  return {
    items: items.map(toReviewItem),
    total,
    page,
    pendingCount,
  };
}

/**
 * Approve a staged node:
 * 1. Mark as graduated in Postgres.
 * 2. If node_type = 'Tool', write to Memgraph via MemgraphToolRepository.
 * 3. On Memgraph failure, roll back the graduated flag and re-throw.
 */
export async function approveStagedNode(id: string, reviewedBy: string): Promise<ApproveResult> {
  const node = await prisma.stagedNode.findUnique({ where: { id } });
  if (!node) throw new Error(`StagedNode ${id} not found`);
  if (node.reviewed_at !== null) throw new Error(`StagedNode ${id} already reviewed`);

  // Optimistically mark graduated
  const updated = await prisma.stagedNode.update({
    where: { id },
    data: {
      graduated: true,
      graduated_at: new Date(),
      reviewed_by: reviewedBy,
      reviewed_at: new Date(),
    },
  });

  // Graduate Tool nodes to Memgraph
  if (node.node_type === 'Tool') {
    const repo = new MemgraphToolRepository();
    try {
      const toolData = node.node_data as unknown as ToolNode;
      await repo.createTool(toolData);
    } catch (err) {
      // Roll back graduated flag
      await prisma.stagedNode.update({
        where: { id },
        data: { graduated: false, graduated_at: null, reviewed_by: null, reviewed_at: null },
      });
      throw err;
    }
  }

  // reviewed_at is always set in the update above — non-null is guaranteed
  // biome-ignore lint/style/noNonNullAssertion: set explicitly in the Prisma update above
  return { id: updated.id, graduated: updated.graduated, reviewedAt: updated.reviewed_at! };
}

/**
 * Reject a staged node — requires a rejection reason.
 */
export async function rejectStagedNode(
  id: string,
  reviewedBy: string,
  rejectionReason: string,
): Promise<RejectResult> {
  if (!rejectionReason.trim()) {
    throw new Error('Rejection reason is required');
  }

  const node = await prisma.stagedNode.findUnique({ where: { id } });
  if (!node) throw new Error(`StagedNode ${id} not found`);
  if (node.reviewed_at !== null) throw new Error(`StagedNode ${id} already reviewed`);

  const updated = await prisma.stagedNode.update({
    where: { id },
    data: {
      graduated: false,
      reviewed_by: reviewedBy,
      reviewed_at: new Date(),
      rejection_reason: rejectionReason.trim(),
    },
  });

  // biome-ignore lint/style/noNonNullAssertion: set explicitly in the Prisma update above
  return { id: updated.id, reviewed_at: updated.reviewed_at! };
}
