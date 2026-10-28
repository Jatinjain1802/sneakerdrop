import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { validEmail } from '@/lib/validate';

export const dynamic = 'force-dynamic';

// tiny in-memory throttle (per instance) to slow down form abuse
const hits = new Map();
function throttled(ip) {
  const now = Date.now();
  const list = (hits.get(ip) || []).filter((t) => now - t < 60_000);
  list.push(now);
  hits.set(ip, list);
  return list.length > 10;
}

export async function POST(request) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  if (throttled(ip)) return NextResponse.json({ error: 'Too many attempts. Try again in a minute.' }, { status: 429 });

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
  const email = validEmail(body?.email);
  const productId = Number(body?.productId);
  if (!email) return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 });
  if (!Number.isInteger(productId)) return NextResponse.json({ error: 'Pick a product.' }, { status: 400 });

  try {
    const prod = await query('SELECT id, name FROM products WHERE id = ?', [productId]);
    if (!prod.length) return NextResponse.json({ error: 'That product no longer exists.' }, { status: 404 });
    const name = prod[0].name;
    try {
      // the UNIQUE (product_id, email) key makes duplicate prevention race-free
      await query('INSERT INTO waitlist (product_id, email) VALUES (?, ?)', [productId, email]);
    } catch (e) {
      if (e?.code === 'ER_DUP_ENTRY') {
        return NextResponse.json({ error: `You're already on the ${name} waitlist.`, duplicate: true }, { status: 409 });
      }
      if (e?.code === 'ER_NO_REFERENCED_ROW_2') {
        return NextResponse.json({ error: 'That product no longer exists.' }, { status: 404 });
      }
      throw e;
    }
    return NextResponse.json({ ok: true, message: `You're on the list for ${name}.` }, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}
