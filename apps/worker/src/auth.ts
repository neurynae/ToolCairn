import type { ApiKeyRecord, Env } from './types.js';

const FREE_RATE_LIMIT = 60; // requests per minute for free tier keys
const AUTH_RATE_LIMIT = 300; // requests per minute for authenticated users

/**
 * Validate a request — tries JWT Bearer token first, then falls back to API key.
 * Anonymous API-key access is preserved for backward compatibility.
 */
export async function validateRequest(
  request: Request,
  env: Env,
): Promise<{ valid: boolean; record: ApiKeyRecord | null; error?: string }> {
  // Try JWT Bearer token first (authenticated users from MCP CLI or web)
  const authHeader = request.headers.get('Authorization');
  if (authHeader?.startsWith('Bearer ') && env.AUTH_SECRET) {
    const token = authHeader.slice(7);
    try {
      // Minimal JWT decode + verify using Web Crypto (available in CF Workers)
      const [headerB64, payloadB64, sigB64] = token.split('.');
      if (!headerB64 || !payloadB64 || !sigB64) throw new Error('malformed');

      // Verify HS256 signature
      const key = await crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode(env.AUTH_SECRET),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['verify'],
      );
      const data = new TextEncoder().encode(`${headerB64}.${payloadB64}`);
      const sig = Uint8Array.from(atob(sigB64.replace(/-/g, '+').replace(/_/g, '/')), (c) =>
        c.charCodeAt(0),
      );
      const valid = await crypto.subtle.verify('HMAC', key, sig, data);
      if (!valid) throw new Error('invalid signature');

      const payload = JSON.parse(atob(payloadB64.replace(/-/g, '+').replace(/_/g, '/')));
      if (payload.exp && payload.exp < Date.now() / 1000) throw new Error('expired');

      // JWT is valid — build a record using the API key from the header or sub
      const apiKey = request.headers.get('x-toolcairn-key') ?? (payload.sub as string);
      const record: ApiKeyRecord = {
        client_id: apiKey,
        tier: (payload.tier as 'free' | 'pro' | 'team') ?? 'free',
        rate_limit: AUTH_RATE_LIMIT,
        created_at: new Date().toISOString(),
        user_id: payload.sub as string,
      };
      return { valid: true, record };
    } catch {
      // Invalid/expired JWT — fall through to API key check
    }
  }

  // Fall back to anonymous API key validation
  return validateApiKey(request, env);
}

/**
 * Validates X-ToolPilot-Key header.
 * On first request with an unknown key, auto-registers it as a free-tier key.
 * Returns the key record or null if the key is invalid/missing.
 */
export async function validateApiKey(
  request: Request,
  env: Env,
): Promise<{ valid: boolean; record: ApiKeyRecord | null; error?: string }> {
  const apiKey = request.headers.get('x-toolpilot-key');

  if (!apiKey) {
    return { valid: false, record: null, error: 'missing_api_key' };
  }

  // UUID format check
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(apiKey)) {
    return { valid: false, record: null, error: 'invalid_api_key_format' };
  }

  const kvKey = `key:${apiKey}`;
  let record = await env.KV.get<ApiKeyRecord>(kvKey, 'json');

  if (!record) {
    // Auto-register as free tier (anonymous key from first run)
    record = {
      client_id: apiKey,
      tier: 'free',
      rate_limit: FREE_RATE_LIMIT,
      created_at: new Date().toISOString(),
    };
    // Store with no expiry (permanent free tier key)
    await env.KV.put(kvKey, JSON.stringify(record));
  }

  return { valid: true, record };
}

/**
 * Checks and increments rate limit counter for an API key.
 * Uses per-minute windows stored in KV.
 * Returns true if within limit, false if exceeded.
 */
export async function checkRateLimit(apiKey: string, limit: number, env: Env): Promise<boolean> {
  const minute = Math.floor(Date.now() / 60_000);
  const rlKey = `rl:${apiKey}:${minute}`;

  const current = Number.parseInt((await env.KV.get(rlKey)) ?? '0');
  if (current >= limit) return false;

  // Increment counter, expire after 2 minutes
  await env.KV.put(rlKey, String(current + 1), { expirationTtl: 120 });
  return true;
}

/**
 * Increments daily usage counter (async, non-blocking — call with ctx.waitUntil).
 */
export async function meterUsage(apiKey: string, path: string, env: Env): Promise<void> {
  const day = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const usageKey = `usage:${apiKey}:${day}`;
  const current = Number.parseInt((await env.KV.get(usageKey)) ?? '0');
  await env.KV.put(usageKey, String(current + 1), { expirationTtl: 90 * 86_400 }); // 90 days

  // Also track per-tool usage
  const toolKey = `usage:${apiKey}:${day}:${path.replace(/\//g, '_')}`;
  const toolCurrent = Number.parseInt((await env.KV.get(toolKey)) ?? '0');
  await env.KV.put(toolKey, String(toolCurrent + 1), { expirationTtl: 90 * 86_400 });
}
