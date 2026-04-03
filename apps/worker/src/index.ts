/**
 * ToolCairn API Gateway — Cloudflare Worker
 *
 * Sits in front of the VPS API at origin.toolcairn.neurynae.com.
 * Handles: auth, rate limiting, POST caching, usage metering.
 *
 * Flow per request:
 *   1. Validate API key (auto-register new keys as free tier)
 *   2. Rate limit check (per-minute, per-key)
 *   3. Cache check (for cacheable endpoints)
 *   4. Forward to VPS origin (with X-Origin-Secret header)
 *   5. Cache response (async, non-blocking)
 *   6. Meter usage (async, non-blocking)
 */
import { checkRateLimit, meterUsage, validateApiKey } from './auth.js';
import { getCached, isCacheable, putCached } from './cache.js';
import type { Env } from './types.js';

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    // ── Health check — no auth required ────────────────────────────────────
    if (path === '/v1/health' && request.method === 'GET') {
      return Response.json({
        ok: true,
        service: 'toolcairn-gateway',
        ts: new Date().toISOString(),
      });
    }

    // ── Registration — no auth required (creates the key) ──────────────────
    if (path === '/v1/register' && request.method === 'POST') {
      return forwardToOrigin(request, env, path);
    }

    // ── API Key validation ──────────────────────────────────────────────────
    const { valid, record, error } = await validateApiKey(request, env);
    if (!valid || !record) {
      return Response.json(
        {
          ok: false,
          error: error ?? 'unauthorized',
          message: 'Valid API key required. Add X-ToolPilot-Key header.',
        },
        { status: 401 },
      );
    }

    // ── Rate limiting ───────────────────────────────────────────────────────
    const withinLimit = await checkRateLimit(record.client_id, record.rate_limit, env);
    if (!withinLimit) {
      return Response.json(
        {
          ok: false,
          error: 'rate_limited',
          message: `Rate limit exceeded (${record.rate_limit} requests/min on ${record.tier} tier). Slow down or upgrade.`,
          tier: record.tier,
        },
        {
          status: 429,
          headers: {
            'Retry-After': '60',
            'X-RateLimit-Limit': String(record.rate_limit),
            'X-RateLimit-Tier': record.tier,
          },
        },
      );
    }

    // ── Meter usage (async — never block the response) ─────────────────────
    ctx.waitUntil(meterUsage(record.client_id, path, env));

    // ── Cache check (POST responses for cacheable endpoints) ────────────────
    if (request.method === 'POST' && isCacheable(path)) {
      let body: unknown;
      try {
        body = await request.clone().json();
      } catch {
        body = {};
      }

      const cached = await getCached(path, body);
      if (cached) {
        // Clone response and mark as cache hit
        const hit = new Response(cached.body, cached);
        hit.headers.set('X-Cache', 'HIT');
        hit.headers.set('X-Cache-Path', path);
        return hit;
      }

      // Cache miss — forward to origin, cache the response
      const originResponse = await forwardToOrigin(request, env, path);
      if (originResponse.ok) {
        ctx.waitUntil(putCached(path, body, originResponse.clone()));
      }
      const miss = new Response(originResponse.body, originResponse);
      miss.headers.set('X-Cache', 'MISS');
      return miss;
    }

    // ── Non-cacheable: forward directly ────────────────────────────────────
    return forwardToOrigin(request, env, path);
  },
};

/**
 * Forward request to the VPS origin with the origin secret header.
 * The VPS API validates this header and rejects requests without it.
 */
async function forwardToOrigin(request: Request, env: Env, path: string): Promise<Response> {
  const originUrl = env.API_ORIGIN_URL.replace(/\/$/, '') + path;

  const headers = new Headers(request.headers);
  headers.set('X-Origin-Secret', env.ORIGIN_SECRET);
  // Pass the real client IP to the origin for logging
  headers.set('X-Real-IP', request.headers.get('CF-Connecting-IP') ?? 'unknown');
  // Remove the API key header — origin doesn't need it
  headers.delete('X-ToolPilot-Key');

  try {
    const response = await fetch(originUrl, {
      method: request.method,
      headers,
      body: request.method !== 'GET' && request.method !== 'HEAD' ? request.body : null,
    });

    // Add CORS headers so browser-based MCP clients can call this
    const result = new Response(response.body, response);
    result.headers.set('Access-Control-Allow-Origin', '*');
    result.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    result.headers.set('Access-Control-Allow-Headers', 'Content-Type, X-ToolPilot-Key');
    return result;
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return Response.json(
      { ok: false, error: 'origin_unreachable', message: `VPS origin unreachable: ${msg}` },
      { status: 503 },
    );
  }
}
