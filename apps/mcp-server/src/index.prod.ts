/**
 * Production-only entry point for the published npm bundle.
 *
 * Auth flow (automatic, survives restarts):
 * - Valid token → buildProdServer() — all 14 tools immediately
 * - No token, pending-auth.json exists (previous process was killed mid-poll):
 *   → Resume polling for the same device code (browser already open)
 *   → Show URL + code in instructions in case browser needs re-opening
 * - No token, no pending auth:
 *   → Request new device code, persist to pending-auth.json
 *   → Open browser, show URL + code in instructions
 *   → Poll in background; credentials saved when user confirms
 *   → On next restart: finds credentials → all 14 tools
 */
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { config } from '@toolpilot/config';
import {
  isTokenValid,
  loadCredentials,
  loadPendingAuth,
  requestDeviceCode,
  startDeviceAuth,
} from '@toolpilot/remote';
import pino from 'pino';
import { z } from 'zod';
import { ensureProjectSetup } from './project-setup.js';
import { buildProdServer } from './server.prod.js';
import { createTransport } from './transport.js';

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
    // Get verification URL — either from pending auth (restart case) or fresh request
    let verificationUri = 'https://toolcairn.neurynae.com/signup';
    let userCode = '';

    try {
      // Check if there's a pending auth from a previous process that was killed
      const pending = await loadPendingAuth();
      if (pending) {
        verificationUri = pending.verification_uri;
        userCode = pending.user_code;
        logger.info({ userCode }, 'Resuming pending sign-in from previous session');
      } else {
        // Fresh auth — request new device code
        const codeData = await requestDeviceCode(config.TOOLPILOT_API_URL);
        verificationUri = codeData.verification_uri;
        userCode = codeData.user_code;
        logger.info({ userCode }, 'New sign-in started');
      }

      // Start full auth flow in background (opens browser + polls until confirmed)
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

    // Embed the URL in server instructions so Claude Code shows it in the MCP panel
    const instructions = userCode
      ? `# ToolCairn — Sign In Required\n\nA browser window should have opened automatically.\n\n**Sign-in URL:** ${verificationUri}\n**Code to confirm:** \`${userCode}\`\n\nOpen the URL, sign in, and confirm the code. Then **restart your agent** — all 14 tools will be available.`
      : '# ToolCairn — Sign In Required\n\nVisit https://toolcairn.neurynae.com to create an account, then restart your agent.';

    server = new McpServer({ name: 'toolcairn', version: '0.1.0' }, { instructions });

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
                : 'Visit toolcairn.neurynae.com to sign up, then restart your agent.',
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
