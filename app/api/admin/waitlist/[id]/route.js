import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireAdmin } from '@/lib/guard';

export const dynamic = 'force-dynamic';

export async function DELETE(request, { params }) {
  const denied = await requireAdmin(request);
  if (denied) return denied;
  const id = Number(params.id);
  if (!Number.isInteger(id)) return NextResponse.json({ error: 'Bad id' }, { status: 400 });
  await query('DELETE FROM waitlist WHERE id = ?', [id]);
  return NextResponse.json({ ok: true });
}
