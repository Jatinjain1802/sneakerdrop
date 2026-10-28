import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireAdmin } from '@/lib/guard';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  const denied = await requireAdmin(request);
  if (denied) return denied;
  const rows = await query(
    `SELECT w.id, w.email, w.created_at, w.product_id, p.name AS product_name
       FROM waitlist w JOIN products p ON p.id = w.product_id
      ORDER BY w.created_at DESC LIMIT 1000`
  );
  return NextResponse.json({ entries: rows });
}
