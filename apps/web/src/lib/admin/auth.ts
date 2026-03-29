import { type JWTPayload, SignJWT, jwtVerify } from 'jose';

export const COOKIE_NAME = 'admin_token';
export const COOKIE_MAX_AGE = 60 * 60 * 24; // 24 hours

function getSecret(secret: string): Uint8Array {
  return new TextEncoder().encode(secret);
}

export async function signAdminToken(secret: string): Promise<string> {
  return new SignJWT({ sub: 'admin' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(getSecret(secret));
}

export async function verifyAdminToken(
  token: string,
  secret: string,
): Promise<{ ok: true; payload: JWTPayload } | { ok: false; error: string }> {
  try {
    const { payload } = await jwtVerify(token, getSecret(secret));
    return { ok: true, payload };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'invalid token' };
  }
}
