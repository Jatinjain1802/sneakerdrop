import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';

export const COOKIE = 'sd_admin';
const MAX_AGE = 60 * 60 * 8; // 8 hours

function key() {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 32) throw new Error('SESSION_SECRET must be set (32+ chars)');
  return new TextEncoder().encode(s);
}

export async function createSession(email) {
  return new SignJWT({ role: 'admin', email })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(key());
}

export async function verifySession(token) {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, key());
    return payload.role === 'admin' ? payload : null;
  } catch {
    return null;
  }
}

export const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  path: '/',
  maxAge: MAX_AGE,
};

export async function checkCredentials(email, password) {
  const adminEmail = (process.env.ADMIN_EMAIL || '').toLowerCase();
  const hash = process.env.ADMIN_PASSWORD_HASH || '';
  // always run a compare so timing doesn't reveal whether the email matched
  const ok = await bcrypt.compare(String(password || ''), hash || '$2a$12$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalidi');
  return Boolean(hash) && ok && String(email || '').toLowerCase() === adminEmail;
}
