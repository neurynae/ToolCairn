import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@toolpilot/db';

interface AuthSession {
  user?: { id?: string; email?: string | null };
}

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

    const deviceCode = await prisma.deviceCode.findUnique({ where: { userCode } });
    if (!deviceCode) {
      return NextResponse.json({ error: 'Invalid or expired code' }, { status: 404 });
    }
    if (deviceCode.status !== 'pending') {
      return NextResponse.json({ error: 'Code already used or expired' }, { status: 409 });
    }
    if (new Date() > deviceCode.expiresAt) {
      await prisma.deviceCode.update({ where: { id: deviceCode.id }, data: { status: 'expired' } });
      return NextResponse.json({ error: 'Code has expired' }, { status: 410 });
    }

    await prisma.deviceCode.update({
      where: { id: deviceCode.id },
      data: { status: 'approved', userId: session.user.id },
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
