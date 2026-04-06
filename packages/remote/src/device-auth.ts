/**
 * Device authorization flow for the MCP CLI.
 * Implements the OAuth 2.0 Device Authorization Grant (RFC 8628).
 *
 * Flow:
 *   1. POST /v1/auth/device-code  → get device_code, user_code, verification_uri
 *   2. Open browser to verification_uri
 *   3. Poll /v1/auth/token until approved, expired, or user cancels
 *   4. Store access_token in ~/.toolpilot/credentials.json
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
 * Open a URL in the default browser (cross-platform).
 */
async function openBrowser(url: string): Promise<void> {
  const platform = process.platform;
  const { execSync } = await import('node:child_process');
  try {
    if (platform === 'win32') execSync(`start "" "${url}"`, { stdio: 'ignore' });
    else if (platform === 'darwin') execSync(`open "${url}"`, { stdio: 'ignore' });
    else execSync(`xdg-open "${url}"`, { stdio: 'ignore' });
  } catch {
    // Silently fail — user will see the URL printed below
  }
}

/**
 * Start the device auth flow.
 * Returns the user info on success, or throws on failure/cancellation.
 */
export async function startDeviceAuth(
  apiUrl: string,
): Promise<{ userId: string; email: string; name: string | null }> {
  // Step 1: Request device code
  const codeRes = await fetch(`${apiUrl}/v1/auth/device-code`, { method: 'POST' });
  if (!codeRes.ok) throw new Error('Failed to start device auth. Check your connection.');

  const codeData = (await codeRes.json()) as DeviceCodeResponse;

  // Step 2: Print instructions + open browser
  console.error('\n──────────────────────────────────────────');
  console.error('  Authenticate ToolCairn MCP');
  console.error('──────────────────────────────────────────');
  console.error('\n  Open this URL in your browser:\n');
  console.error(`  ${codeData.verification_uri}\n`);
  console.error(`  Your device code: ${codeData.user_code}`);
  console.error('\n  Waiting for authorization...');
  console.error('  (Press Ctrl+C to cancel)\n');

  await openBrowser(codeData.verification_uri);

  // Step 3: Poll until approved or expired
  const result = await pollForToken(apiUrl, codeData.device_code, codeData.interval);

  // Step 4: Persist credentials
  await upgradeToAuthenticated(result.access_token, result.api_key, result.user);

  console.error(`\n  ✓ Authenticated as ${result.user.email}\n`);

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
