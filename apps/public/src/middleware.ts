import { auth } from '@/auth';
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

// biome-ignore lint/style/noDefaultExport: Next.js middleware requires a default export
export default async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Always allow public paths and static assets
  if (PUBLIC_PATHS.has(pathname)) return NextResponse.next();
  if (PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) return NextResponse.next();

  // Only check session for routes that need it
  const needsAuthCheck =
    AUTH_PATHS.some((p) => pathname.startsWith(p)) ||
    PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));

  if (!needsAuthCheck) return NextResponse.next();

  const session = await auth();
  const isLoggedIn = !!session;

  // Redirect logged-in users away from auth pages
  if (AUTH_PATHS.some((p) => pathname.startsWith(p))) {
    if (isLoggedIn) return NextResponse.redirect(new URL('/explore', req.url));
    return NextResponse.next();
  }

  // Protect platform routes
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
