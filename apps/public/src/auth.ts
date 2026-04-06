import { buildAuthConfig, buildVpsAdapter } from '@toolpilot/auth';
import NextAuth from 'next-auth';

/**
 * Auth.js v5 instance for the Vercel public app.
 *
 * Uses VpsAdapter instead of PrismaAdapter — all user/account DB operations
 * are proxied to the VPS API at TOOLPILOT_API_URL. No DATABASE_URL needed on Vercel.
 *
 * The authorize() function also proxies credential verification to the VPS API
 * (/v1/auth/users?email=...) to retrieve the user's passwordHash, then checks
 * it locally. This avoids exposing a raw /v1/auth/login endpoint.
 */

const apiUrl = process.env.TOOLPILOT_API_URL ?? 'https://api.neurynae.com';
const apiKey = process.env.TOOLPILOT_API_KEY;

const adapter = buildVpsAdapter(apiUrl, apiKey);

const config = buildAuthConfig(adapter, async (email) => {
  // Proxy user lookup to the VPS API
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (apiKey) headers['x-toolpilot-key'] = apiKey;
  const res = await fetch(`${apiUrl}/v1/auth/users?email=${encodeURIComponent(email)}`, {
    headers,
  });
  if (!res.ok) return null;
  const user = (await res.json()) as {
    id: string;
    email: string;
    passwordHash: string | null;
  } | null;
  return user;
});

// biome-ignore lint/suspicious/noExplicitAny: TS2742 — next-auth v5 deep type portability issue; 'any' is intentional here to break the inferred type reference chain
const _result = NextAuth(config) as any;

export const handlers = _result.handlers as {
  GET: (req: Request) => Promise<Response>;
  POST: (req: Request) => Promise<Response>;
};
export const auth = _result.auth as (...args: unknown[]) => Promise<unknown>;
export const signIn = _result.signIn as (...args: unknown[]) => Promise<unknown>;
export const signOut = _result.signOut as (...args: unknown[]) => Promise<unknown>;
