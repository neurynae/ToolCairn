import { timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { COOKIE_MAX_AGE, COOKIE_NAME, signAdminToken } from '@/lib/admin/auth';

const loginSchema = z.object({
  passphrase: z.string().min(1),
});

export async function POST(request: Request): Promise<NextResponse> {
  const body: unknown = await request.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: 'INVALID_INPUT' }, { status: 400 });
  }

  const secret = process.env.ADMIN_SECRET ?? '';
  const provided = Buffer.from(parsed.data.passphrase);
  const expected = Buffer.from(secret);

  // Constant-time comparison to prevent timing attacks
  const matches =
    provided.length === expected.length && timingSafeEqual(provided, expected);

  if (!matches) {
    return NextResponse.json({ ok: false, error: 'INVALID_PASSPHRASE' }, { status: 401 });
  }

  const token = await signAdminToken(secret);
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: COOKIE_MAX_AGE,
    secure: process.env.NODE_ENV === 'production',
  });

  return NextResponse.json({ ok: true, data: { redirectTo: '/admin/dashboard' } });
}
