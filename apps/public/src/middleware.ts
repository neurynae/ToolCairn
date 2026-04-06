import { type NextRequest, NextResponse } from 'next/server';

const PUBLIC_PATHS = new Set(['/', '/about']);
const PUBLIC_PREFIXES = [
  '/docs/',
  '/docs',
  '/api/auth/',
  '/_next/',
  '/favicon',
  '/logo/',
  '/apple-touch-icon',
  '/og-image',
  '/manifest',
  '/robots',
  '/sitemap',
  '/llms',
  '/.well-known/',
];
const AUTH_PATHS = ['/login', '/signup'];
const PROTECTED_PREFIXES = [
  '/explore',
  '/compare',
  '/stack',
  '/tool/',
  '/suggest',
  '/compatibility',
];

/**
 * Check for a valid Auth.js session cookie without importing the full auth stack.
 * Importing `auth` from '@/auth' bundles Prisma + bcryptjs and exceeds the 1MB
 * Edge Function size limit. Cookie presence is sufficient for redirect logic —
 * the actual JWT is verified server-side in route handlers and server components.
 */
function hasSession(req: NextRequest): boolean {
  // Auth.js v5 stores the session token in one of these cookies
  return (
    req.cookies.has('next-auth.session-token') ||
    req.cookies.has('__Secure-next-auth.session-token') ||
    req.cookies.has('authjs.session-token') ||
    req.cookies.has('__Secure-authjs.session-token')
  );
}

// biome-ignore lint/style/noDefaultExport: Next.js middleware requires a default export
export default function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isLoggedIn = hasSession(req);

  if (PUBLIC_PATHS.has(pathname)) return NextResponse.next();
  if (PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) return NextResponse.next();

  if (AUTH_PATHS.some((p) => pathname.startsWith(p))) {
    if (isLoggedIn) return NextResponse.redirect(new URL('/explore', req.url));
    return NextResponse.next();
  }

  if (PROTECTED_PREFIXES.some((p) => pathname.startsWith(p)) && !isLoggedIn) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
