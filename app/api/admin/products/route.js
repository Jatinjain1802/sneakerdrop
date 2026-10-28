import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireAdmin } from '@/lib/guard';
import { parseProduct, slugify } from '@/lib/validate';
import { listProducts, getProduct } from '@/lib/products';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  const denied = await requireAdmin(request);
  if (denied) return denied;
  const counts = await query('SELECT product_id, COUNT(*) AS n FROM waitlist GROUP BY product_id');
  const map = Object.fromEntries(counts.map((r) => [r.product_id, Number(r.n)]));
  const products = (await listProducts()).map((p) => ({ ...p, waitlist_count: map[p.id] || 0 }));
  return NextResponse.json({ products });
}

export async function POST(request) {
  const denied = await requireAdmin(request);
  if (denied) return denied;
  const parsed = parseProduct(await request.json().catch(() => null));
  if (parsed.error) return NextResponse.json({ error: parsed.error }, { status: 400 });
  const v = parsed.value;
  let slug = slugify(v.name) || 'sneaker';
  const exists = await query('SELECT 1 FROM products WHERE slug = ?', [slug]);
  if (exists.length) slug = `${slug}-${Date.now().toString(36)}`;
  const r = await query(
    `INSERT INTO products (slug, name, tagline, description, price_cents, image_url, accent, status, sort_order)
     VALUES (?,?,?,?,?,?,?,?,?)`,
    [slug, v.name, v.tagline, v.description, v.price_cents, v.image_url, v.accent, v.status, v.sort_order]
  );
  return NextResponse.json({ product: await getProduct(r.insertId) }, { status: 201 });
}
