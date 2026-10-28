import { NextResponse } from 'next/server';
import { COOKIE, verifySession } from './lib/auth';

// Edge gate: every /admin page and /api/admin route needs a valid signed session,
// except the login page and login endpoint. API routes re-check via requireAdmin().
export async function middleware(request) {
  const { pathname } = request.nextUrl;
  if (pathname === '/admin/login' || pathname === '/api/admin/login') return NextResponse.next();
  const session = await verifySession(request.cookies.get(COOKIE)?.value);
  if (session) return NextResponse.next();
  if (pathname.startsWith('/api/')) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const url = request.nextUrl.clone();
  url.pathname = '/admin/login';
  url.search = '';
  return NextResponse.redirect(url);
}

export const config = { matcher: ['/admin/:path*', '/api/admin/:path*'] };
