import type { PrismaClient } from '@prisma/client';
/**
 * Auth routes — device code flow for MCP CLI authentication.
 * These routes do NOT require origin-auth (called before user has a key).
 */
import { Hono } from 'hono';
import { SignJWT } from 'jose';
import pino from 'pino';

const logger = pino({ name: '@toolpilot/api/auth' });

const USER_CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const DEVICE_CODE_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes

function randomDeviceCode(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

function randomUserCode(): string {
  const chars = USER_CODE_CHARS;
  const part = (n: number) =>
    Array.from({ length: n }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `${part(4)}-${part(4)}`;
}

async function mintAccessToken(userId: string, email: string, secret: string): Promise<string> {
  return new SignJWT({ sub: userId, email, type: 'mcp', tier: 'free' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('90d')
    .sign(new TextEncoder().encode(secret));
}

export function authRoutes(prisma: PrismaClient): Hono {
  const app = new Hono();

  // POST /v1/auth/device-code — initiate device auth
  app.post('/device-code', async (c) => {
    const appUrl = process.env.AUTH_URL ?? 'https://toolcairn.neurynae.com';

    const deviceCode = randomDeviceCode();
    const userCode = randomUserCode();
    const expiresAt = new Date(Date.now() + DEVICE_CODE_EXPIRY_MS);

    await prisma.deviceCode.create({
      data: { deviceCode, userCode, expiresAt },
    });

    logger.info({ userCode }, 'device code created');

    return c.json({
      device_code: deviceCode,
      user_code: userCode,
      verification_uri: `${appUrl}/device?code=${userCode}`,
      expires_in: 600,
      interval: 5,
    });
  });

  // POST /v1/auth/token — poll for token after device approval
  app.post('/token', async (c) => {
    const body = (await c.req.json()) as { device_code?: string; grant_type?: string };

    if (body.grant_type !== 'device_code' || !body.device_code) {
      return c.json({ error: 'invalid_request' }, 400);
    }

    const record = await prisma.deviceCode.findUnique({
      where: { deviceCode: body.device_code },
      include: { user: { select: { id: true, email: true, name: true } } },
    });

    if (!record) return c.json({ error: 'invalid_device_code' }, 400);
    if (new Date() > record.expiresAt || record.status === 'expired') {
      return c.json({ error: 'expired_token' }, 400);
    }
    if (record.status === 'pending') {
      return c.json({ error: 'authorization_pending' }, 400);
    }
    if (record.status !== 'approved' || !record.user) {
      return c.json({ error: 'access_denied' }, 400);
    }

    const authSecret = process.env.AUTH_SECRET;
    if (!authSecret) return c.json({ error: 'server_misconfigured' }, 500);

    const accessToken = await mintAccessToken(record.user.id, record.user.email ?? '', authSecret);

    // Create an ApiKey entry linked to this user
    const apiKey = await prisma.apiKey.upsert({
      where: { key: `${record.user.id}-mcp` },
      update: { lastUsed: new Date() },
      create: {
        key: `${record.user.id}-mcp`,
        userId: record.user.id,
        label: 'MCP CLI',
        tier: 'free',
        rateLimit: 60,
      },
    });

    // Clean up the device code
    await prisma.deviceCode.update({
      where: { id: record.id },
      data: { status: 'expired' },
    });

    return c.json({
      access_token: accessToken,
      token_type: 'Bearer',
      expires_in: 90 * 24 * 3600,
      api_key: apiKey.key,
      user: { id: record.user.id, name: record.user.name, email: record.user.email },
    });
  });

  // GET /v1/auth/me — return current user from JWT
  app.get('/me', async (c) => {
    const auth = c.req.header('Authorization');
    if (!auth?.startsWith('Bearer ')) return c.json({ error: 'unauthorized' }, 401);
    // Soft check — just decode without verify (Worker validates at edge)
    try {
      const payload = JSON.parse(atob(auth.slice(7).split('.')[1] ?? ''));
      return c.json({ ok: true, user: { id: payload.sub, email: payload.email } });
    } catch {
      return c.json({ error: 'invalid_token' }, 401);
    }
  });

  // Expire old device codes (cleanup — called by background job or can be cron)
  const expireOldCodes = async () => {
    await prisma.deviceCode.updateMany({
      where: { status: 'pending', expiresAt: { lt: new Date() } },
      data: { status: 'expired' },
    });
  };

  // Run cleanup on startup
  expireOldCodes().catch(() => {});

  return app;
}
