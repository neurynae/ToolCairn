import { NextResponse } from 'next/server';
import { signupSchema } from '@toolpilot/auth';
import pino from 'pino';

const logger = pino({ name: '@toolpilot/public:auth-signup' });

const API_URL = process.env['TOOLPILOT_API_URL'] ?? 'https://api.neurynae.com';
const API_KEY = process.env['TOOLPILOT_API_KEY'];

/**
 * Proxy signup to the VPS API — no DATABASE_URL needed on Vercel.
 * The VPS creates the user in the production DB and returns the user object.
 */
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as unknown;
    const parsed = signupSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? 'Invalid input' },
        { status: 400 },
      );
    }

    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (API_KEY) headers['x-toolpilot-key'] = API_KEY;

    const res = await fetch(`${API_URL}/v1/auth/signup`, {
      method: 'POST',
      headers,
      body: JSON.stringify(parsed.data),
    });

    const data = (await res.json()) as { error?: string };
    if (!res.ok) {
      logger.warn({ status: res.status, error: data.error }, 'Signup failed at VPS');
      return NextResponse.json({ error: data.error ?? 'Signup failed' }, { status: res.status });
    }

    logger.info({ email: parsed.data.email }, 'User signed up');
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (err) {
    logger.error({ err }, 'Signup route error');
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
