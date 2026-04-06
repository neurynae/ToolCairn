import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import pino from 'pino';

const logger = pino({ name: '@toolpilot/public:device-approve' });

const API_URL = process.env.TOOLPILOT_API_URL ?? 'https://api.neurynae.com';
const API_KEY = process.env.TOOLPILOT_API_KEY;

interface AuthSession {
  user?: { id?: string; email?: string | null };
}

/**
 * Proxies device code approval to the VPS API.
 * No DATABASE_URL needed on Vercel — same pattern as search/compare/stack.
 */
export async function POST(request: Request) {
  const session = (await auth()) as AuthSession | null;
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = (await request.json()) as { userCode?: string };
    const userCode = body.userCode?.trim().toUpperCase();
    if (!userCode) {
      return NextResponse.json({ error: 'User code is required' }, { status: 400 });
    }

    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (API_KEY) headers['x-toolpilot-key'] = API_KEY;

    const res = await fetch(`${API_URL}/v1/auth/device/approve`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ userCode, userId: session.user.id }),
    });

    const data = (await res.json()) as { error?: string; ok?: boolean };
    if (!res.ok) {
      logger.warn({ status: res.status, error: data.error }, 'Device approval failed at VPS');
      return NextResponse.json({ error: data.error ?? 'Approval failed' }, { status: res.status });
    }

    logger.info({ userCode }, 'Device approved');
    return NextResponse.json({ ok: true });
  } catch (err) {
    logger.error({ err }, 'Device approve route error');
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
