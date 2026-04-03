export interface Env {
  KV: KVNamespace;
  DB: D1Database;
  /** Secret: URL of the VPS origin API e.g. https://origin.toolcairn.neurynae.com */
  API_ORIGIN_URL: string;
  /** Secret: shared between Worker and VPS API to block direct VPS access */
  ORIGIN_SECRET: string;
  ENVIRONMENT: string;
}

export interface ApiKeyRecord {
  client_id: string;
  tier: 'free' | 'pro' | 'team';
  /** Max requests per minute */
  rate_limit: number;
  created_at: string;
}
