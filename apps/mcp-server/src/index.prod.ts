/**
 * Production-only entry point for the published npm bundle.
 *
 * Intentionally does NOT import server.ts (dev mode) so that heavy
 * workspace packages (@toolpilot/graph, @toolpilot/search, @toolpilot/vector,
 * @toolpilot/db, @toolpilot/queue) and their CJS dependencies (neo4j-driver,
 * ioredis, @prisma/client, etc.) are excluded from the tsup bundle.
 *
 * This file is the tsup entry point. The regular src/index.ts remains the
 * entry for local dev (tsc build) where both modes are needed.
 */
import pino from 'pino';
import { ensureProjectSetup } from './project-setup.js';
import { buildProdServer } from './server.prod.js';
import { createTransport } from './transport.js';

// Force production mode regardless of environment variable
process.env.TOOLPILOT_MODE = 'production';

const logger = pino({ name: '@toolpilot/mcp-server' });

async function main(): Promise<void> {
  logger.info('Starting ToolPilot MCP Server (production mode)');

  // Auto-create .toolpilot/ in the project root before the agent starts any chat
  await ensureProjectSetup();

  const server = await buildProdServer();
  const transport = createTransport();
  await server.connect(transport);
  logger.info('ToolPilot MCP Server started');
}

main().catch((error: unknown) => {
  pino({ name: '@toolpilot/mcp-server' }).error({ err: error }, 'Failed to start MCP server');
  process.exit(1);
});
