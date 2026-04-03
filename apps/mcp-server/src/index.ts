// ToolPilot MCP Server — Primary Product
// Supports two modes:
//   dev        → direct Docker DB connections (for contributors, default)
//   production → thin HTTP client to api.toolpilot.dev (for published npm package)
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { config } from '@toolpilot/config';
import pino from 'pino';
import { buildServer } from './server.js';
import { buildProdServer } from './server.prod.js';
import { createTransport } from './transport.js';

// Load .env from project root if NOMIC_API_KEY is missing (Claude Code MCP env inheritance)
if (!process.env.NOMIC_API_KEY) {
  try {
    const dir = fileURLToPath(new URL('.', import.meta.url));
    const envPath = resolve(dir, '../../../../.env');
    const lines = readFileSync(envPath, 'utf-8').split('\n');
    for (const line of lines) {
      const match = line.match(/^([A-Z_]+)=(.+)$/);
      const key = match?.[1];
      const val = match?.[2];
      if (key && val && !process.env[key]) {
        process.env[key] = val.trim();
      }
    }
  } catch {
    /* .env not found — continue without */
  }
}

const logger = pino({ name: '@toolpilot/mcp-server' });

async function main(): Promise<void> {
  const mode = config.TOOLPILOT_MODE;
  logger.info({ mode }, 'Starting ToolPilot MCP Server');

  const server = mode === 'production' ? await buildProdServer() : buildServer();
  const transport = createTransport();
  await server.connect(transport);
  logger.info('ToolPilot MCP Server started');
}

main().catch((error: unknown) => {
  pino({ name: '@toolpilot/mcp-server' }).error({ err: error }, 'Failed to start MCP server');
  process.exit(1);
});
