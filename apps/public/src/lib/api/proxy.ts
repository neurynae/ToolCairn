/**
 * Public API proxy helper.
 *
 * The VPS API (apps/api) returns raw MCP CallToolResult format:
 *   { content: [{ type: 'text', text: JSON.stringify({ok, data, ...}) }], isError?: true }
 *
 * Both direct handlers (local dev) AND the VPS proxy path return this format,
 * so parseMcpResult() handles both cases uniformly.
 *
 * Routing:
 *   Local dev (no TOOLPILOT_API_URL) → direct DB via tools package handlers
 *   Production (Vercel, TOOLPILOT_API_URL set) → proxy to api.neurynae.com
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export const PROXY_ENABLED = !!process.env.TOOLPILOT_API_URL;
const BASE = `${process.env.TOOLPILOT_API_URL ?? ''}/v1`;

interface McpCallToolResult {
  // MCP SDK v1.27+ content items are a union (text | image | audio | resource).
  // Only text items have `text`; others (image, audio) do not. We only parse text[0].
  content: Array<{ type: string; text?: string }>;
  isError?: boolean;
  [key: string]: unknown;
}

/** Parse MCP CallToolResult into a plain { ok, data } response */
export function parseMcpResult(mcpResult: McpCallToolResult): {
  ok: boolean;
  data?: unknown;
  error?: string;
  message?: string;
} {
  try {
    const text = mcpResult.content[0]?.text ?? '{}';
    return JSON.parse(text) as { ok: boolean; data?: unknown; error?: string; message?: string };
  } catch {
    return { ok: false, error: 'parse_error', message: 'Failed to parse tool result' };
  }
}

/** Convert a MCP CallToolResult into a NextResponse */
export function mcpToNextResponse(mcpResult: McpCallToolResult): NextResponse {
  const parsed = parseMcpResult(mcpResult);
  if (mcpResult.isError || !parsed.ok) {
    return NextResponse.json(
      {
        ok: false,
        error: parsed.error ?? 'tool_error',
        message: parsed.message ?? 'Tool call failed',
      },
      { status: parsed.error === 'tool_not_found' ? 404 : 500 },
    );
  }
  return NextResponse.json({ ok: true, data: parsed.data });
}

function buildHeaders(): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  // CF Worker requires x-toolpilot-key for all non-admin routes
  // ORIGIN_SECRET is NOT sent here — CF Worker adds it internally when forwarding to VPS
  if (process.env.TOOLPILOT_API_KEY) {
    headers['x-toolpilot-key'] = process.env.TOOLPILOT_API_KEY;
  }
  return headers;
}

/** Forward a POST request to the VPS API and parse its MCP response */
export async function proxyPost(path: string, body?: unknown): Promise<NextResponse> {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: buildHeaders(),
    body: body !== undefined ? JSON.stringify(body) : undefined,
    cache: 'no-store',
  });
  const mcpResult = (await res.json()) as McpCallToolResult;
  return mcpToNextResponse(mcpResult);
}

/** Forward a GET request to the VPS API and parse its response */
export async function proxyGet(
  path: string,
  searchParams?: URLSearchParams,
): Promise<NextResponse> {
  const url = searchParams?.size ? `${BASE}${path}?${searchParams.toString()}` : `${BASE}${path}`;
  const res = await fetch(url, { headers: buildHeaders(), cache: 'no-store' });
  // GET endpoints (like admin/tools) return direct JSON, not MCP format
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}

/**
 * Wrap a POST handler.
 * Production (PROXY_ENABLED): forwards body to VPS API, parses MCP response.
 * Local dev: calls directHandler which also returns NextResponse.
 */
export function withProxyPost(
  proxyPath: string,
  directHandler: (req: NextRequest) => Promise<NextResponse>,
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    if (!PROXY_ENABLED) return directHandler(req);
    const body = await req.json().catch(() => null);
    return proxyPost(proxyPath, body);
  };
}

/**
 * Wrap a GET handler.
 */
export function withProxyGet(
  proxyPath: string,
  directHandler: (req: NextRequest) => Promise<NextResponse>,
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    if (!PROXY_ENABLED) return directHandler(req);
    return proxyGet(proxyPath, req.nextUrl.searchParams);
  };
}
