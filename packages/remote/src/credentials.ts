/**
 * Manages anonymous API key stored in ~/.toolcairn/credentials.json.
 * Generated on first run — no login required.
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join } from 'node:path';

const CREDENTIALS_DIR = join(homedir(), '.toolpilot');
const CREDENTIALS_FILE = join(CREDENTIALS_DIR, 'credentials.json');

interface Credentials {
  client_id: string;
  created_at: string;
  api_url?: string;
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
