import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export default auth((req: NextRequest & { auth: unknown }) => {
  const { pathname } = req.nextUrl;
  const isAuthenticated = !!req.auth;

  const isAuthRoute = pathname.startsWith('/login');
  const isApiAuthRoute = pathname.startsWith('/api/auth');
  const isPublicAsset =
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/pdf.worker');

  if (isPublicAsset || isApiAuthRoute) return NextResponse.next();

  if (!isAuthenticated && !isAuthRoute) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  if (isAuthenticated && isAuthRoute) {
    return NextResponse.redirect(new URL('/policies', req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|pdf.worker.min.js).*)'],
};
