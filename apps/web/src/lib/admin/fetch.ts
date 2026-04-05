/**
 * Wrapper around fetch that redirects to /admin/login on 401.
 * Use this for all client-side admin API calls so expired JWTs
 * are handled gracefully instead of leaving a stale broken page.
 */
export async function adminFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const res = await fetch(input, init);
  if (res.status === 401 && typeof window !== 'undefined') {
    window.location.href = '/admin/login';
    // Return a never-resolving promise so callers don't process the 401 body
    return new Promise(() => {});
  }
  return res;
}
