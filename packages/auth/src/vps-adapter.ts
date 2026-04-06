import type { Adapter, AdapterAccount, AdapterSession, AdapterUser } from 'next-auth/adapters';

/**
 * Auth.js adapter that proxies all user/account operations to the VPS API.
 * Used by the Vercel public app — no direct database access needed from Vercel.
 *
 * The VPS API exposes user CRUD at /v1/auth/users/* and account linking
 * at /v1/auth/users/:id/accounts. All requests go through the CF Worker
 * at TOOLPILOT_API_URL (no JWT required for /v1/auth/* routes).
 */
export function buildVpsAdapter(apiUrl: string, apiKey?: string): Adapter {
  const base = apiUrl.replace(/\/$/, '');

  async function call<T>(path: string, options: RequestInit = {}): Promise<T | null> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };
    if (apiKey) headers['x-toolpilot-key'] = apiKey;

    const res = await fetch(`${base}${path}`, { ...options, headers });
    if (res.status === 404 || res.status === 204) return null;
    if (!res.ok) return null;
    const data = (await res.json()) as T | null;
    return data;
  }

  return {
    // ── User ────────────────────────────────────────────────────────────────

    async createUser(user) {
      const created = await call<AdapterUser>('/v1/auth/users', {
        method: 'POST',
        body: JSON.stringify(user),
      });
      return created as AdapterUser;
    },

    async getUser(id) {
      return call<AdapterUser>(`/v1/auth/users/${id}`);
    },

    async getUserByEmail(email) {
      return call<AdapterUser>(`/v1/auth/users?email=${encodeURIComponent(email)}`);
    },

    async getUserByAccount({ provider, providerAccountId }) {
      return call<AdapterUser>(
        `/v1/auth/users/by-account?provider=${encodeURIComponent(provider)}&providerAccountId=${encodeURIComponent(providerAccountId)}`,
      );
    },

    async updateUser(user) {
      const updated = await call<AdapterUser>(`/v1/auth/users/${user.id}`, {
        method: 'PATCH',
        body: JSON.stringify(user),
      });
      return updated as AdapterUser;
    },

    // ── Account ──────────────────────────────────────────────────────────────

    async linkAccount(account) {
      await call<AdapterAccount>(`/v1/auth/users/${account.userId}/accounts`, {
        method: 'POST',
        body: JSON.stringify(account),
      });
      return account;
    },

    // ── Sessions — not needed with JWT strategy ───────────────────────────────

    async createSession(session) {
      return session as AdapterSession;
    },

    async getSessionAndUser(_sessionToken) {
      return null;
    },

    async updateSession(session) {
      return session as AdapterSession;
    },

    async deleteSession(_sessionToken) {
      return;
    },
  };
}
