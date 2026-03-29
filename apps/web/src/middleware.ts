import { COOKIE_NAME, verifyAdminToken } from '@/lib/admin/auth';
import { type NextRequest, NextResponse } from 'next/server';

export const config = {
  matcher: '/admin/:path*',
};

export async function middleware(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;

  // Login page is always accessible
  if (pathname === '/admin/login') {
    return NextResponse.next();
  }

  const token = request.cookies.get(COOKIE_NAME)?.value;
  const secret = process.env.ADMIN_SECRET ?? '';

  if (!token) {
    return NextResponse.redirect(new URL('/admin/login', request.url));
  }

  const result = await verifyAdminToken(token, secret);
  if (!result.ok) {
    const loginUrl = new URL('/admin/login', request.url);
    loginUrl.searchParams.set('expired', '1');
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}
