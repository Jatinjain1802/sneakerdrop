// End-to-end API check against a running instance.
// Usage: BASE=http://localhost:3000 ADMIN_EMAIL=... ADMIN_PASSWORD=... node scripts/e2e.mjs
const BASE = process.env.BASE || 'http://localhost:3000';
let cookie = '';
let fails = 0;
const ok = (c, m) => { console.log(`${c ? 'PASS' : 'FAIL'}  ${m}`); if (!c) fails++; };
const call = async (path, opts = {}) => {
  const r = await fetch(BASE + path, { redirect: 'manual', ...opts, headers: { 'Content-Type': 'application/json', ...(cookie ? { cookie } : {}), ...(opts.headers || {}) } });
  const text = await r.text();
  let json; try { json = JSON.parse(text); } catch {}
  return { status: r.status, json, text, headers: r.headers };
};

// public
let r = await call('/api/products');
ok(r.status === 200 && r.json.products.length >= 3, `public catalogue returns >=3 products (${r.json?.products?.length})`);
const first = r.json.products[0];

// admin is protected
r = await call('/api/admin/products'); ok(r.status === 401, 'admin API rejects anonymous (401)');
r = await call('/api/admin/products', { method: 'POST', body: '{}' }); ok(r.status === 401, 'admin create rejects anonymous');
r = await call('/api/admin/waitlist'); ok(r.status === 401, 'admin waitlist rejects anonymous');
r = await call('/admin'); ok(r.status === 307 || r.status === 302, 'admin page redirects anonymous');
r = await call('/api/admin/login', { method: 'POST', body: JSON.stringify({ email: process.env.ADMIN_EMAIL, password: 'wrong-password' }) });
ok(r.status === 401, 'login rejects wrong password');

// login
r = await call('/api/admin/login', { method: 'POST', body: JSON.stringify({ email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD }) });
ok(r.status === 200, 'login succeeds');
const sc = r.headers.get('set-cookie') || '';
ok(/HttpOnly/i.test(sc) && /SameSite=strict/i.test(sc), 'session cookie is HttpOnly + SameSite=Strict');
cookie = sc.split(';')[0];
r = await call('/admin'); ok(r.status === 200, 'admin page loads when authenticated');

// CRUD
const name = 'E2E Test Sneaker ' + Date.now();
r = await call('/api/admin/products', { method: 'POST', body: JSON.stringify({ name, description: 'Temporary product created by the e2e test.', price: 123.45, image_url: '/sneakers/dune-low.jpg', status: 'available', tagline: 'tmp', accent: '#112233', sort_order: 99 }) });
ok(r.status === 201 && r.json.product.price_cents === 12345, 'admin can create product');
const id = r.json.product.id;
r = await call('/api/products'); ok(r.json.products.some((p) => p.id === id), 'new product appears on public API');
r = await call('/api/admin/products', { method: 'POST', body: JSON.stringify({ name: 'x', description: 'short', price: -1, image_url: 'javascript:alert(1)' }) });
ok(r.status === 400, 'invalid product rejected (400)');
r = await call(`/api/admin/products/${id}`, { method: 'PUT', body: JSON.stringify({ name: name + ' v2', description: 'Edited description for the e2e product.', price: 99, image_url: '/sneakers/dune-low.jpg', status: 'available', accent: '#112233', tagline: 'tmp', sort_order: 99 }) });
ok(r.status === 200 && r.json.product.name.endsWith('v2') && r.json.product.price_cents === 9900, 'admin can edit product');
r = await call(`/api/admin/products/${id}`, { method: 'PUT', body: JSON.stringify({ status: 'sold_out' }) });
ok(r.status === 200 && r.json.product.status === 'sold_out', 'admin can change availability');
r = await call('/api/products'); ok(r.json.products.find((p) => p.id === id)?.status === 'sold_out', 'availability change reflected on public API');
const html = (await call('/')).text; ok(html.includes(name + ' v2'), 'edit reflected on public homepage (server-rendered from DB)');

// waitlist
const em = `e2e+${Date.now()}@example.com`;
r = await call('/api/waitlist', { method: 'POST', body: JSON.stringify({ email: 'not-an-email', productId: id }) }); ok(r.status === 400, 'invalid email rejected');
r = await call('/api/waitlist', { method: 'POST', body: JSON.stringify({ email: em, productId: id }) }); ok(r.status === 201, 'waitlist signup stored');
r = await call('/api/waitlist', { method: 'POST', body: JSON.stringify({ email: em.toUpperCase(), productId: id }) }); ok(r.status === 409, 'duplicate (same product, any case) blocked (409)');
r = await call('/api/waitlist', { method: 'POST', body: JSON.stringify({ email: em, productId: first.id }) }); ok(r.status === 201, 'same email can join a different product');
r = await call('/api/waitlist', { method: 'POST', body: JSON.stringify({ email: em, productId: 999999 }) }); ok(r.status === 404, 'unknown product rejected');
r = await call('/api/admin/waitlist'); const mine = r.json.entries.filter((e) => e.email === em.toLowerCase());
ok(mine.length === 2, 'admin sees both submissions');

// cleanup
for (const e of mine) await call(`/api/admin/waitlist/${e.id}`, { method: 'DELETE' });
r = await call(`/api/admin/products/${id}`, { method: 'DELETE' }); ok(r.status === 200, 'admin can delete product');
r = await call('/api/products'); ok(!r.json.products.some((p) => p.id === id), 'deleted product gone from public API');
r = await call('/api/admin/logout', { method: 'POST' });
console.log(fails ? `\n${fails} FAILED` : '\nAll checks passed');
process.exit(fails ? 1 : 0);
