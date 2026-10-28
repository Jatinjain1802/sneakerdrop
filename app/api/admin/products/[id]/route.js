import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireAdmin } from '@/lib/guard';
import { parseProduct, STATUSES } from '@/lib/validate';
import { getProduct } from '@/lib/products';

export const dynamic = 'force-dynamic';

export async function PUT(request, { params }) {
  const denied = await requireAdmin(request);
  if (denied) return denied;
  const id = Number(params.id);
  if (!Number.isInteger(id)) return NextResponse.json({ error: 'Bad id' }, { status: 400 });
  const body = await request.json().catch(() => null);

  // quick availability toggle: { status }
  if (body && Object.keys(body).length === 1 && 'status' in body) {
    if (!STATUSES.includes(body.status)) return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    const r = await query('UPDATE products SET status = ? WHERE id = ?', [body.status, id]);
    const product = await getProduct(id);
    if (!r.affectedRows && !product) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ product });
  }

  const parsed = parseProduct(body);
  if (parsed.error) return NextResponse.json({ error: parsed.error }, { status: 400 });
  const v = parsed.value;
  await query(
    `UPDATE products SET name=?, tagline=?, description=?, price_cents=?, image_url=?, accent=?,
       status=?, sort_order=? WHERE id=?`,
    [v.name, v.tagline, v.description, v.price_cents, v.image_url, v.accent, v.status, v.sort_order, id]
  );
  const product = await getProduct(id);
  if (!product) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ product });
}

export async function DELETE(request, { params }) {
  const denied = await requireAdmin(request);
  if (denied) return denied;
  const id = Number(params.id);
  if (!Number.isInteger(id)) return NextResponse.json({ error: 'Bad id' }, { status: 400 });
  const r = await query('DELETE FROM products WHERE id = ?', [id]);
  if (!r.affectedRows) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ ok: true });
}
