import { NextResponse } from 'next/server';
import { listProducts } from '@/lib/products';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    return NextResponse.json({ products: await listProducts() });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });
  }
}
