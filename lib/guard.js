import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { COOKIE, verifySession } from './auth';

/** Returns null when the caller is an authenticated admin, else a 401/403 response. */
export async function requireAdmin(request) {
  const session = await verifySession(cookies().get(COOKIE)?.value);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (request && request.method !== 'GET') {
    // CSRF defence in depth (cookie is also SameSite=Strict): same-origin only
    const origin = request.headers.get('origin');
    const host = request.headers.get('host');
    if (origin && new URL(origin).host !== host) {
      return NextResponse.json({ error: 'Bad origin' }, { status: 403 });
    }
  }
  return null;
}
