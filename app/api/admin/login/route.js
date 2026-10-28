import { NextResponse } from 'next/server';
import { COOKIE, checkCredentials, createSession, cookieOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const fails = new Map();

export async function POST(request) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const now = Date.now();
  const recent = (fails.get(ip) || []).filter((t) => now - t < 15 * 60_000);
  if (recent.length >= 8) return NextResponse.json({ error: 'Too many attempts. Try again later.' }, { status: 429 });

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
  const ok = await checkCredentials(body?.email, body?.password);
  if (!ok) {
    recent.push(now);
    fails.set(ip, recent);
    return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
  }
  fails.delete(ip);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE, await createSession(String(body.email).toLowerCase()), cookieOptions);
  return res;
}
