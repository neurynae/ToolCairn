/**
 * Manages anonymous API key stored in ~/.toolcairn/credentials.json.
 * Generated on first run — no login required.
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join } from 'node:path';

const CREDENTIALS_DIR = join(homedir(), '.toolpilot');
const CREDENTIALS_FILE = join(CREDENTIALS_DIR, 'credentials.json');

export interface Credentials {
  client_id: string;
  created_at: string;
  api_url?: string;
  // Auth fields (present when user has authenticated via toolcairn_auth login)
  access_token?: string;
  user_id?: string;
  user_email?: string;
  user_name?: string;
  authenticated_at?: string;
}

export async function loadOrCreateCredentials(
  registerFn?: (clientId: string) => Promise<void>,
): Promise<Credentials> {
  try {
    const raw = await readFile(CREDENTIALS_FILE, 'utf-8');
    return JSON.parse(raw) as Credentials;
  } catch {
    // First run — generate anonymous key
    const creds: Credentials = {
      client_id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
    };
    await saveCredentials(creds);

    // Register with the API (fire-and-forget; non-blocking)
    if (registerFn) {
      registerFn(creds.client_id).catch(() => {});
    }

    return creds;
  }
}

export async function saveCredentials(creds: Credentials): Promise<void> {
  await mkdir(CREDENTIALS_DIR, { recursive: true });
  await writeFile(CREDENTIALS_FILE, JSON.stringify(creds, null, 2), 'utf-8');
}

export async function getApiKey(): Promise<string> {
  const creds = await loadOrCreateCredentials();
  return creds.client_id;
}

/**
 * Merge authentication data into the existing credentials file.
 * Called after a successful device auth flow.
 */
export async function upgradeToAuthenticated(
  accessToken: string,
  apiKey: string,
  user: { id: string; email?: string | null; name?: string | null },
): Promise<void> {
  const existing = await loadOrCreateCredentials();
  await saveCredentials({
    ...existing,
    client_id: apiKey,
    access_token: accessToken,
    user_id: user.id,
    user_email: user.email ?? undefined,
    user_name: user.name ?? undefined,
    authenticated_at: new Date().toISOString(),
  });
}

/**
 * Remove authentication data and revert to anonymous.
 */
export async function clearAuthentication(): Promise<void> {
  const existing = await loadOrCreateCredentials();
  const anon: Credentials = {
    client_id: existing.client_id,
    created_at: existing.created_at,
    api_url: existing.api_url,
  };
  await saveCredentials(anon);
}
