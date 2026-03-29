import type { EdgeSource, EdgeType, ToolNode } from '@toolpilot/core';
import { MemgraphToolRepository } from '@toolpilot/graph';
import pino from 'pino';
import { IndexerError } from '../errors.js';

const logger = pino({ name: '@toolpilot/indexer:memgraph-writer' });

let _repository: MemgraphToolRepository | undefined;

function getRepository(): MemgraphToolRepository {
  if (!_repository) {
    _repository = new MemgraphToolRepository();
  }
  return _repository;
}

/**
 * Write or update a ToolNode in Memgraph.
 * Uses createTool which will upsert via the repository.
 */
export async function writeToolToMemgraph(tool: ToolNode): Promise<void> {
  const repo = getRepository();
  try {
    const result = await repo.createTool(tool);
    if (!result.ok) {
      throw new IndexerError(
        `Failed to write tool to Memgraph: ${result.error.message} (code: ${result.error.code})`,
      );
    }
    logger.info({ toolId: tool.id, toolName: tool.name }, 'Tool written to Memgraph');
  } catch (e) {
    if (e instanceof IndexerError) throw e;
    throw new IndexerError(
      `Unexpected error writing tool to Memgraph: ${e instanceof Error ? e.message : String(e)}`,
      e,
    );
  }
}

/**
 * Write a directed edge between two tools in Memgraph.
 * Looks up the target tool by name to get its ID, then upserts the edge.
 */
export async function writeEdgeToMemgraph(
  sourceId: string,
  targetName: string,
  edgeType: string,
  weight: number,
  confidence: number,
  source: string,
  decayRate: number,
): Promise<void> {
  const repo = getRepository();

  try {
    // Look up the target tool by name
    const findResult = await repo.findByName(targetName);
    if (!findResult.ok) {
      logger.warn(
        { targetName, error: findResult.error.message },
        'Could not look up target tool by name, skipping edge',
      );
      return;
    }

    if (!findResult.data) {
      logger.debug({ targetName }, 'Target tool not found in Memgraph, skipping edge');
      return;
    }

    const targetId = findResult.data.id;
    const now = new Date().toISOString();

    // Validate edge type
    const validEdgeTypes: EdgeType[] = [
      'SOLVES',
      'REQUIRES',
      'INTEGRATES_WITH',
      'REPLACES',
      'CONFLICTS_WITH',
      'POPULAR_WITH',
      'BREAKS_FROM',
      'HAS_VERSION',
      'COMPATIBLE_WITH',
    ];

    const resolvedEdgeType: EdgeType = validEdgeTypes.includes(edgeType as EdgeType)
      ? (edgeType as EdgeType)
      : 'INTEGRATES_WITH';

    // Validate edge source
    const validEdgeSources: EdgeSource[] = [
      'usage_data',
      'ai_generated',
      'github_signal',
      'manual',
      'co_occurrence',
      'changelog',
      'declared_dependency',
    ];

    const resolvedSource: EdgeSource = validEdgeSources.includes(source as EdgeSource)
      ? (source as EdgeSource)
      : 'github_signal';

    const upsertResult = await repo.upsertEdge({
      type: resolvedEdgeType,
      source_id: sourceId,
      target_id: targetId,
      properties: {
        weight,
        confidence,
        last_verified: now,
        source: resolvedSource,
        decay_rate: decayRate,
      },
    });

    if (!upsertResult.ok) {
      throw new IndexerError(
        `Failed to upsert edge: ${upsertResult.error.message} (code: ${upsertResult.error.code})`,
      );
    }

    logger.info(
      { sourceId, targetId, targetName, edgeType: resolvedEdgeType },
      'Edge written to Memgraph',
    );
  } catch (e) {
    if (e instanceof IndexerError) throw e;
    throw new IndexerError(
      `Unexpected error writing edge to Memgraph: ${e instanceof Error ? e.message : String(e)}`,
      e,
    );
  }
}
