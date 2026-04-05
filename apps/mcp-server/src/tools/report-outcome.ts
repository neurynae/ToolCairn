import type { EdgeType } from '@toolpilot/core';
import { PrismaClient } from '@toolpilot/db';
import {
  MemgraphToolRepository,
  buildDecrementEdgeWeightQuery,
  buildIncrementEdgeWeightQuery,
  getMemgraphSession,
} from '@toolpilot/graph';
import { enqueueIndexJob } from '@toolpilot/queue';
import pino from 'pino';
import { errResult, okResult } from '../utils.js';

const logger = pino({ name: '@toolcairn/mcp-server:report-outcome' });
const prisma = new PrismaClient();
const repo = new MemgraphToolRepository();

// How much to shift edge weights per outcome report
const WEIGHT_DELTA_SUCCESS = 0.05;
const WEIGHT_DELTA_FAILURE = 0.05;

async function adjustSolvesEdge(
  toolName: string,
  delta: number,
  direction: 'up' | 'down',
): Promise<void> {
  // Find the tool in Memgraph to get its ID
  const toolResult = await repo.findByName(toolName);
  if (!toolResult.ok || !toolResult.data) return;

  const edgeType: EdgeType = 'SOLVES';
  const session = getMemgraphSession();
  try {
    const { text, parameters } =
      direction === 'up'
        ? buildIncrementEdgeWeightQuery(edgeType, delta)
        : buildDecrementEdgeWeightQuery(edgeType, delta);

    // Run with both tool name variants (it solves some use case)
    await session.run(text, {
      ...parameters,
      name_a: toolName,
      name_b: toolName, // SOLVES edges go tool→usecase; we adjust any outgoing SOLVES
    });
  } catch (e) {
    logger.warn({ err: e, tool: toolName }, 'Failed to adjust SOLVES edge weight');
  } finally {
    await session.close();
  }
}

async function stageReplacesEdge(oldTool: string, newTool: string, queryId: string): Promise<void> {
  try {
    await prisma.stagedEdge.create({
      data: {
        edge_type: 'REPLACES',
        source_node_id: newTool,
        target_node_id: oldTool,
        edge_data: {
          evidence: `User replaced ${oldTool} with ${newTool} in session ${queryId}`,
          confidence: 0.6,
        },
        confidence: 0.6,
        source: 'usage_data',
        supporting_queries: [queryId],
      },
    });
    logger.info({ old: oldTool, new: newTool }, 'REPLACES edge staged');
  } catch (e) {
    logger.warn({ err: e }, 'Failed to stage REPLACES edge');
  }
}

export async function handleReportOutcome(args: {
  query_id: string;
  chosen_tool: string;
  reason?: string;
  outcome: 'success' | 'failure' | 'replaced' | 'pending';
  feedback?: string;
  replaced_by?: string; // name of the tool that replaced chosen_tool (for 'replaced' outcome)
}) {
  try {
    await prisma.outcomeReport.create({
      data: {
        query_id: args.query_id,
        chosen_tool: args.chosen_tool,
        reason: args.reason,
        outcome: args.outcome,
        feedback: args.feedback,
      },
    });

    const graphActions: string[] = [];

    if (args.outcome === 'success') {
      // Strengthen SOLVES edges asynchronously — never block the response
      adjustSolvesEdge(args.chosen_tool, WEIGHT_DELTA_SUCCESS, 'up').catch((e: unknown) => {
        logger.warn({ err: e }, 'Background edge weight update failed');
      });
      graphActions.push(`SOLVES weight +${WEIGHT_DELTA_SUCCESS} for ${args.chosen_tool}`);
    }

    if (args.outcome === 'failure') {
      // Weaken edges + trigger re-index to refresh health signals
      adjustSolvesEdge(args.chosen_tool, WEIGHT_DELTA_FAILURE, 'down').catch((e: unknown) => {
        logger.warn({ err: e }, 'Background edge weight update failed');
      });
      const result = await enqueueIndexJob(args.chosen_tool, 1);
      if (!result.ok) {
        logger.warn({ tool: args.chosen_tool, err: result.error }, 'Failed to enqueue re-index');
      }
      graphActions.push(
        `SOLVES weight -${WEIGHT_DELTA_FAILURE} for ${args.chosen_tool}`,
        're-index queued',
      );
    }

    if (args.outcome === 'replaced' && args.replaced_by) {
      // Stage a REPLACES edge between the new tool and the old one
      stageReplacesEdge(args.chosen_tool, args.replaced_by, args.query_id).catch((e: unknown) => {
        logger.warn({ err: e }, 'Background REPLACES staging failed');
      });
      graphActions.push(`REPLACES edge staged: ${args.replaced_by} → ${args.chosen_tool}`);
    }

    logger.info(
      { query_id: args.query_id, outcome: args.outcome, graphActions },
      'Outcome recorded',
    );
    return okResult({
      recorded: true,
      outcome: args.outcome,
      graph_actions: graphActions,
    });
  } catch (e) {
    logger.error({ err: e, query_id: args.query_id }, 'Failed to record outcome');
    return errResult('storage_error', e instanceof Error ? e.message : String(e));
  }
}
