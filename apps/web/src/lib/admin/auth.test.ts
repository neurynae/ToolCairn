import { describe, expect, it } from 'vitest';
import { signAdminToken, verifyAdminToken } from './auth.js';

const SECRET = 'test-secret-32-chars-minimum-ok!';
const WRONG_SECRET = 'wrong-secret-32-chars-minimum-ok';

describe('signAdminToken', () => {
  it('returns a non-empty JWT string', async () => {
    const token = await signAdminToken(SECRET);
    expect(typeof token).toBe('string');
    expect(token.split('.')).toHaveLength(3); // header.payload.signature
  });
});

describe('verifyAdminToken', () => {
  it('returns ok:true for a valid token', async () => {
    const token = await signAdminToken(SECRET);
    const result = await verifyAdminToken(token, SECRET);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.payload.sub).toBe('admin');
    }
  });

  it('returns ok:false for a token signed with a different secret', async () => {
    const token = await signAdminToken(WRONG_SECRET);
    const result = await verifyAdminToken(token, SECRET);
    expect(result.ok).toBe(false);
  });

  it('returns ok:false for a malformed token string', async () => {
    const result = await verifyAdminToken('not.a.jwt', SECRET);
    expect(result.ok).toBe(false);
  });

  it('returns ok:false for an empty token string', async () => {
    const result = await verifyAdminToken('', SECRET);
    expect(result.ok).toBe(false);
  });
});
