import { query } from './db';

const COLS = 'id, slug, name, tagline, description, price_cents, image_url, accent, status, sort_order, created_at';

export async function listProducts() {
  return query(`SELECT ${COLS} FROM products ORDER BY sort_order, id`);
}

export async function getProduct(id) {
  const rows = await query(`SELECT ${COLS} FROM products WHERE id = ?`, [id]);
  return rows[0] || null;
}

export function formatPrice(cents) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(cents / 100);
}
