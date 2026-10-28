export const STATUSES = ['available', 'sold_out', 'coming_soon'];
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function validEmail(v) {
  const e = String(v || '').trim().toLowerCase();
  return e.length <= 254 && EMAIL_RE.test(e) ? e : null;
}

export function slugify(s) {
  return String(s).toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60);
}

/** Validates admin product input. Returns { value } or { error }. */
export function parseProduct(body) {
  const name = String(body?.name ?? '').trim();
  const description = String(body?.description ?? '').trim();
  const tagline = String(body?.tagline ?? '').trim();
  const image_url = String(body?.image_url ?? '').trim();
  const status = String(body?.status ?? 'available');
  const accent = String(body?.accent ?? '#c6ff3d').trim();
  const price = Number(body?.price);
  const sort_order = Number.isFinite(Number(body?.sort_order)) ? Math.trunc(Number(body.sort_order)) : 0;

  if (name.length < 2 || name.length > 80) return { error: 'Name must be 2-80 characters' };
  if (description.length < 10 || description.length > 600) return { error: 'Description must be 10-600 characters' };
  if (tagline.length > 100) return { error: 'Tagline is too long' };
  if (!Number.isFinite(price) || price < 0 || price > 100000) return { error: 'Price must be between 0 and 100000' };
  if (!STATUSES.includes(status)) return { error: 'Invalid status' };
  if (!/^#[0-9a-fA-F]{6}$/.test(accent)) return { error: 'Accent must be a hex colour like #c6ff3d' };
  if (!(/^https:\/\/\S+$/.test(image_url) || /^\/[A-Za-z0-9._\/-]+$/.test(image_url)) || image_url.length > 500) {
    return { error: 'Image must be an https:// URL or a /path in /public' };
  }
  return {
    value: { name, description, tagline, image_url, status, accent, sort_order, price_cents: Math.round(price * 100) },
  };
}
