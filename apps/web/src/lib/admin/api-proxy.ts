/**
 * Admin API proxy helper.
 *
 * When TOOLPILOT_API_URL is set, all admin API routes proxy to the
 * Hono API server (apps/api) instead of connecting to DBs directly.
 *
 * Local dev (default): TOOLPILOT_API_URL is empty → direct DB connections
 * Proxy mode:          TOOLPILOT_API_URL=http://localhost:3002
 * Production (Vercel): TOOLPILOT_API_URL=https://api.neurynae.com
 */

import { cookies } from 'next/headers';
import { type NextRequest, NextResponse } from 'next/server';

export const PROXY_ENABLED = !!process.env.TOOLPILOT_API_URL;

const ADMIN_BASE = `${process.env.TOOLPILOT_API_URL}/v1/admin`;

async function getAdminToken(): Promise<string> {
  try {
    const cookieStore = await cookies();
    return cookieStore.get('admin_token')?.value ?? '';
  } catch {
    return '';
  }
}

export async function proxyGet(path: string, searchParams?: URLSearchParams): Promise<Response> {
  const token = await getAdminToken();
  const url = searchParams?.size
    ? `${ADMIN_BASE}${path}?${searchParams.toString()}`
    : `${ADMIN_BASE}${path}`;
  return fetch(url, {
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    cache: 'no-store',
  });
}

export async function proxyPost(path: string, body?: unknown): Promise<Response> {
  const token = await getAdminToken();
  return fetch(`${ADMIN_BASE}${path}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: body !== undefined ? JSON.stringify(body) : undefined,
    cache: 'no-store',
  });
}

export async function proxyPatch(path: string, body: unknown): Promise<Response> {
  const token = await getAdminToken();
  return fetch(`${ADMIN_BASE}${path}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    cache: 'no-store',
  });
}

/**
 * Wraps a GET handler: proxies to apps/api when TOOLPILOT_API_URL is set,
 * otherwise falls through to the directHandler (direct DB).
 */
export function withProxyGet(
  proxyPath: string,
  directHandler: (req: NextRequest) => Promise<NextResponse>,
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    if (!PROXY_ENABLED) return directHandler(req);
    const res = await proxyGet(proxyPath, req.nextUrl.searchParams);
    const body = await res.text();
    return new NextResponse(body, {
      status: res.status,
      headers: { 'Content-Type': 'application/json' },
    });
  };
}

/**
 * Wraps a PATCH handler: proxies to apps/api when TOOLPILOT_API_URL is set.
 */
export function withProxyPatch(
  makeProxyPath: (req: NextRequest) => string,
  directHandler: (
    req: NextRequest,
    ctx: { params: Promise<Record<string, string>> },
  ) => Promise<NextResponse>,
) {
  return async (
    req: NextRequest,
    ctx: { params: Promise<Record<string, string>> },
  ): Promise<NextResponse> => {
    if (!PROXY_ENABLED) return directHandler(req, ctx);
    const body = await req.json().catch(() => null);
    const res = await proxyPatch(makeProxyPath(req), body);
    const text = await res.text();
    return new NextResponse(text, {
      status: res.status,
      headers: { 'Content-Type': 'application/json' },
    });
  };
}

/**
 * Wraps a POST handler: proxies to apps/api when TOOLPILOT_API_URL is set.
 */
export function withProxyPost(
  proxyPath: string,
  directHandler: (req: NextRequest) => Promise<NextResponse>,
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    if (!PROXY_ENABLED) return directHandler(req);
    const body = await req.json().catch(() => null);
    const res = await proxyPost(proxyPath, body);
    const text = await res.text();
    return new NextResponse(text, {
      status: res.status,
      headers: { 'Content-Type': 'application/json' },
    });
  };
}

/** Typed helper for server components — throws on API error */
export async function apiGet<T>(path: string, params?: Record<string, string>): Promise<T> {
  const sp = params ? new URLSearchParams(params) : undefined;
  const res = await proxyGet(path, sp);
  const json = (await res.json()) as { ok: boolean; data?: T; error?: string };
  if (!json.ok) throw new Error(json.error ?? 'API error');
  return json.data as T;
}
