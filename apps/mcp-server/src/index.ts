// ToolCairn MCP Server — Primary Product
// Supports two modes:
//   dev        → direct Docker DB connections (for contributors, default)
//   production → thin HTTP client to api.toolpilot.dev (for published npm package)
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { config } from '@toolpilot/config';
import { isTokenValid, loadCredentials, startDeviceAuth } from '@toolpilot/remote';
import pino from 'pino';
import { ensureProjectSetup } from './project-setup.js';
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

const logger = pino({ name: '@toolcairn/mcp-server' });

/**
 * Ensure the user is authenticated before the server starts.
 *
 * - If a valid token exists → proceed immediately (silent).
 * - If no token or token expired → automatically trigger the device auth flow.
 *   The user sees a URL + code to open in their browser. The process blocks
 *   until they authenticate, then continues.
 * - If auth fails → log the error and exit. The agent will show the error and
 *   the user can re-run after fixing the issue.
 */
async function ensureAuthenticated(): Promise<void> {
  const creds = await loadCredentials();

  if (creds && isTokenValid(creds)) {
    // Already authenticated — nothing to do
    return;
  }

  const reason = !creds ? 'first install' : 'token expired or missing';
  logger.info({ reason }, 'Authentication required — starting sign-in flow');

  // This blocks until the user completes the browser auth flow
  await startDeviceAuth(config.TOOLPILOT_API_URL);
}

async function main(): Promise<void> {
  const mode = config.TOOLPILOT_MODE;
  logger.info({ mode }, 'Starting ToolCairn MCP Server');

  // Auto-create .toolcairn/ in the project root before the agent starts any chat
  await ensureProjectSetup();

  // Production mode requires authentication before tools are available.
  // On first install or after logout, this automatically opens the browser
  // for the user to sign in — no manual toolcairn_auth call needed.
  if (mode === 'production') {
    await ensureAuthenticated();
  }

  const server = mode === 'production' ? await buildProdServer() : buildServer();
  const transport = createTransport();
  await server.connect(transport);
  logger.info('ToolCairn MCP Server started');
}

main().catch((error: unknown) => {
  pino({ name: '@toolcairn/mcp-server' }).error({ err: error }, 'Failed to start MCP server');
  process.exit(1);
});
