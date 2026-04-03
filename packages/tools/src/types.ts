import type { PrismaClient } from '@toolpilot/db';
import type { MemgraphToolRepository, MemgraphUseCaseRepository } from '@toolpilot/graph';
import type { ClarificationEngine, SearchPipeline, SearchSessionManager } from '@toolpilot/search';

/**
 * Shared dependency container for all ToolPilot tool handlers.
 *
 * In dev mode: created by apps/mcp-server connecting to local Docker DBs.
 * In production: created by apps/api connecting to VPS Docker network DBs.
 * The thin npm client (production MCP) does NOT use ToolDeps — it calls the HTTP API instead.
 */
export interface ToolDeps {
  graphRepo: MemgraphToolRepository;
  usecaseRepo: MemgraphUseCaseRepository;
  prisma: PrismaClient;
  enqueueIndexJob: (
    idOrUrl: string,
    priority: number,
  ) => Promise<{ ok: boolean; error?: unknown; data?: unknown }>;
  enqueueSearchEvent: (
    query: string,
    sessionId: string,
  ) => Promise<{ ok: boolean; error?: unknown; data?: unknown }>;
  pipeline: SearchPipeline;
  sessionManager: SearchSessionManager;
  clarificationEngine: ClarificationEngine;
}
