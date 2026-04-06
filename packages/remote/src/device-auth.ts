/**
 * Device authorization flow for the MCP CLI.
 * Implements the OAuth 2.0 Device Authorization Grant (RFC 8628).
 *
 * Flow:
 *   1. POST /v1/auth/device-code  → get device_code, user_code, verification_uri
 *   2. Open browser to verification_uri (spawn + detached, works from stdio child processes)
 *   3. Poll /v1/auth/token until approved, expired, or user cancels
 *   4. Store access_token in ~/.toolcairn/credentials.json
 */
import { upgradeToAuthenticated } from './credentials.js';

interface DeviceCodeResponse {
  device_code: string;
  user_code: string;
  verification_uri: string;
  expires_in: number;
  interval: number;
}

interface TokenResponse {
  access_token: string;
  api_key: string;
  user: { id: string; email: string | null; name: string | null };
  error?: string;
}

/**
 * Open a URL in the default browser.
 * Uses spawn + detached so it works from stdio child processes (e.g. MCP server).
 * execSync blocks and fails silently in non-interactive contexts; spawn does not.
 */
async function openBrowser(url: string): Promise<void> {
  const { spawn } = await import('node:child_process');
  try {
    const platform = process.platform;
    let cmd: string;
    let args: string[];

    if (platform === 'win32') {
      // cmd /c start is more reliable than bare `start` from a child process
      cmd = 'cmd';
      args = ['/c', 'start', '', url];
    } else if (platform === 'darwin') {
      cmd = 'open';
      args = [url];
    } else {
      cmd = 'xdg-open';
      args = [url];
    }

    const child = spawn(cmd, args, {
      detached: true, // detach from parent process group
      stdio: 'ignore', // don't inherit parent's stdio
      shell: false,
    });
    child.unref(); // let parent process exit independently
  } catch {
    // Silently fail — URL is always printed to stderr as fallback
  }
}

/**
 * Request a device code and return the code data.
 * Exported separately so callers can surface the URL before blocking on poll.
 */
export async function requestDeviceCode(apiUrl: string): Promise<DeviceCodeResponse> {
  const res = await fetch(`${apiUrl}/v1/auth/device-code`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to start device auth. Check your internet connection.');
  return (await res.json()) as DeviceCodeResponse;
}

/**
 * Start the full device auth flow — request code, open browser, poll for token.
 * Returns user info on success, throws on failure/cancellation.
 */
export async function startDeviceAuth(
  apiUrl: string,
): Promise<{ userId: string; email: string; name: string | null }> {
  const codeData = await requestDeviceCode(apiUrl);

  // Print instructions to stderr — visible in terminal and some MCP clients
  process.stderr.write('\n──────────────────────────────────────────\n');
  process.stderr.write('  ToolCairn — Sign In Required\n');
  process.stderr.write('──────────────────────────────────────────\n');
  process.stderr.write('\n  Opening browser for authentication...\n\n');
  process.stderr.write(`  URL:  ${codeData.verification_uri}\n`);
  process.stderr.write(`  Code: ${codeData.user_code}\n`);
  process.stderr.write('\n  Waiting... (browser should open automatically)\n\n');

  // Open browser — detached spawn works from MCP stdio child processes
  await openBrowser(codeData.verification_uri);

  const result = await pollForToken(apiUrl, codeData.device_code, codeData.interval);

  await upgradeToAuthenticated(result.access_token, result.api_key, result.user);

  process.stderr.write(`\n  ✓ Signed in as ${result.user.email}\n\n`);

  return {
    userId: result.user.id,
    email: result.user.email ?? '',
    name: result.user.name,
  };
}

async function pollForToken(
  apiUrl: string,
  deviceCode: string,
  intervalSec: number,
): Promise<TokenResponse> {
  const intervalMs = Math.max(intervalSec, 5) * 1000;

  while (true) {
    await sleep(intervalMs);

    const res = await fetch(`${apiUrl}/v1/auth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ device_code: deviceCode, grant_type: 'device_code' }),
    });

    const data = (await res.json()) as TokenResponse;

    if (data.error === 'authorization_pending') continue;
    if (data.error === 'expired_token') throw new Error('Device code expired. Please try again.');
    if (data.error) throw new Error(`Authorization failed: ${data.error}`);
    if (data.access_token) return data;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
