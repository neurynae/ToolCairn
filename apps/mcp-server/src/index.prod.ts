/**
 * Production-only entry point for the published npm bundle.
 *
 * Intentionally does NOT import server.ts (dev mode) so that heavy
 * workspace packages (@toolpilot/graph, @toolpilot/search, @toolpilot/vector,
 * @toolpilot/db, @toolpilot/queue) and their CJS dependencies are excluded
 * from the tsup bundle.
 *
 * Auth flow:
 * - Valid token found → buildProdServer() — all 14 tools available
 * - No token / expired → buildAuthGateServer() — MCP handshake completes
 *   immediately, only toolcairn_auth tool exposed; user calls it to sign in
 *   via browser, then restarts agent for full access.
 */
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { config } from '@toolpilot/config';
import { isTokenValid, loadCredentials, startDeviceAuth } from '@toolpilot/remote';
import pino from 'pino';
import { z } from 'zod';
import { ensureProjectSetup } from './project-setup.js';
import { buildProdServer } from './server.prod.js';
import { createTransport } from './transport.js';

// Force production mode
process.env.TOOLPILOT_MODE = 'production';

const logger = pino({ name: '@toolcairn/mcp-server' });

/**
 * Minimal server exposed when the user is not yet authenticated.
 * MCP handshake completes instantly — no blocking, no timeout.
 */
function buildAuthGateServer(): McpServer {
  const server = new McpServer(
    { name: 'toolcairn', version: '0.1.0' },
    {
      instructions: `
# ToolCairn — Sign In Required

You are NOT authenticated. ToolCairn tools are unavailable until you sign in.

## Action Required

Call: \`toolcairn_auth\` with \`{ "action": "login" }\`

This opens a browser window. The user signs in at toolcairn.neurynae.com/device,
confirms the code, and the token is saved locally. After that, tell the user to
restart their agent — all 14 tools will be available on the next session.
      `.trim(),
    },
  );

  server.registerTool(
    'toolcairn_auth',
    {
      description:
        'Sign in to ToolCairn. Required before any other tools are available. Call with action="login" to start.',
      inputSchema: z.object({
        action: z
          .enum(['login', 'status'])
          .describe('"login" starts sign-in, "status" checks current state'),
      }),
    },
    async ({ action }: { action: 'login' | 'status' }) => {
      if (action === 'status') {
        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify({
                authenticated: false,
                message: 'Not signed in. Call toolcairn_auth with action="login".',
              }),
            },
          ],
        };
      }

      try {
        const user = await startDeviceAuth(config.TOOLPILOT_API_URL);
        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify({
                ok: true,
                message: `Signed in as ${user.email}. Restart your agent — all ToolCairn tools will be available.`,
                user_email: user.email,
              }),
            },
          ],
        };
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Authentication failed';
        return {
          content: [{ type: 'text' as const, text: JSON.stringify({ ok: false, error: msg }) }],
          isError: true,
        };
      }
    },
  );

  return server;
}

async function main(): Promise<void> {
  await ensureProjectSetup();

  const creds = await loadCredentials();
  const authenticated = creds !== null && isTokenValid(creds);

  let server: McpServer;
  if (authenticated) {
    logger.info({ user: creds.user_email }, 'ToolCairn MCP Server starting (authenticated)');
    server = await buildProdServer();
  } else {
    logger.info('ToolCairn MCP Server starting (auth-gate mode — sign in required)');
    server = buildAuthGateServer();
  }

  const transport = createTransport();
  await server.connect(transport);
  logger.info('ToolCairn MCP Server ready');
}

main().catch((error: unknown) => {
  pino({ name: '@toolcairn/mcp-server' }).error({ err: error }, 'Failed to start MCP server');
  process.exit(1);
});
