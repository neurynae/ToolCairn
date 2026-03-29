// ToolPilot MCP Server — Primary Product
// Exposes: search_tools, search_tools_respond, check_issue,
//          check_compatibility, report_outcome, get_stack
import pino from 'pino';
import { buildServer } from './server.js';
import { createTransport } from './transport.js';

const logger = pino({ name: '@toolpilot/mcp-server' });

async function main(): Promise<void> {
  const server = buildServer();
  const transport = createTransport();
  await server.connect(transport);
  logger.info('ToolPilot MCP Server started');
}

main().catch((error: unknown) => {
  pino({ name: '@toolpilot/mcp-server' }).error({ err: error }, 'Failed to start MCP server');
  process.exit(1);
});
