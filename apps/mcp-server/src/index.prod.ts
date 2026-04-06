/**
 * Production-only entry point for the published npm bundle.
 *
 * Auth flow (fully automatic — no tool call needed):
 * - Valid token found → buildProdServer() — all 14 tools immediately
 * - No token / expired:
 *   1. Fetch device code from API
 *   2. Embed verification URL in server instructions (Claude Code shows this)
 *   3. Open browser automatically via detached spawn
 *   4. MCP transport connects immediately — no timeout
 *   5. User confirms in browser, then restarts agent for full access
 */
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { config } from '@toolpilot/config';
import {
  isTokenValid,
  loadCredentials,
  requestDeviceCode,
  startDeviceAuth,
} from '@toolpilot/remote';
import pino from 'pino';
import { z } from 'zod';
import { ensureProjectSetup } from './project-setup.js';
import { buildProdServer } from './server.prod.js';
import { createTransport } from './transport.js';

// Force production mode
process.env.TOOLPILOT_MODE = 'production';

const logger = pino({ name: '@toolcairn/mcp-server' });

async function main(): Promise<void> {
  await ensureProjectSetup();

  const creds = await loadCredentials();
  const authenticated = creds !== null && isTokenValid(creds);

  let server: McpServer;

  if (authenticated) {
    logger.info({ user: creds.user_email }, 'Authenticated — starting full server');
    server = await buildProdServer();
  } else {
    // Not authenticated — fetch a device code first so we can show the URL
    // in the server instructions (visible in Claude Code's MCP panel).
    let verificationUri = 'https://toolcairn.neurynae.com/signup';
    let userCode = '';

    try {
      const codeData = await requestDeviceCode(config.TOOLPILOT_API_URL);
      verificationUri = codeData.verification_uri;
      userCode = codeData.user_code;

      // Start full auth flow in background (opens browser + polls for token)
      startDeviceAuth(config.TOOLPILOT_API_URL)
        .then(() => {
          logger.info('Sign-in complete. Restart your agent to access all ToolCairn tools.');
        })
        .catch((err: unknown) => {
          logger.error({ err }, 'Sign-in failed — restart your agent and try again');
        });
    } catch (err) {
      logger.error({ err }, 'Could not reach ToolCairn API — check your connection');
    }

    // Build a minimal server whose instructions contain the sign-in URL.
    // Claude Code displays instructions in the MCP panel — this ensures
    // the user sees where to go even if the browser doesn't open automatically.
    server = new McpServer(
      { name: 'toolcairn', version: '0.1.0' },
      {
        instructions: userCode
          ? `# ToolCairn — Sign In Required\n\nA browser window should have opened automatically.\n\n**Sign-in URL:** ${verificationUri}\n**Code to confirm:** \`${userCode}\`\n\nOpen the URL, sign in, and confirm the code shown on the page. Then restart your agent — all 14 tools will be available.`
          : `# ToolCairn — Sign In Required\n\nVisit ${verificationUri} to create an account, then restart your agent.`,
      },
    );

    // Single status tool
    server.registerTool(
      'toolcairn_auth',
      {
        description: 'Check ToolCairn sign-in status.',
        inputSchema: z.object({ action: z.enum(['status']) }),
      },
      async () => ({
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify({
              authenticated: false,
              sign_in_url: verificationUri,
              code: userCode || null,
              message: userCode
                ? `Open ${verificationUri}, confirm code "${userCode}", then restart your agent.`
                : 'Visit toolcairn.neurynae.com to create an account, then restart your agent.',
            }),
          },
        ],
      }),
    );
  }

  const transport = createTransport();
  await server.connect(transport);
  logger.info(authenticated ? 'ToolCairn MCP ready' : 'ToolCairn MCP ready (sign-in required)');
}

main().catch((error: unknown) => {
  pino({ name: '@toolcairn/mcp-server' }).error({ err: error }, 'Failed to start MCP server');
  process.exit(1);
});
