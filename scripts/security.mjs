// Security behaviour checks against a running instance.
// Usage: BASE=... ADMIN_EMAIL=... ADMIN_PASSWORD=... [THROTTLE=1] node scripts/security.mjs
// THROTTLE=1 also exercises login throttling; it locks out your IP for 15 minutes, so run it last.
import { SignJWT } from 'jose';

const BASE = process.env.BASE || 'http://localhost:3000';
let fails = 0;
const ok = (c, m) => { console.log(`${c ? 'PASS' : 'FAIL'}  ${m}`); if (!c) fails++; };
const call = async (path, { cookie, origin, ...opts } = {}) => {
  const r = await fetch(BASE + path, { redirect: 'manual', ...opts, headers: { 'Content-Type': 'application/json', ...(cookie ? { cookie } : {}), ...(origin ? { origin } : {}) } });
  const text = await r.text();
  let json; try { json = JSON.parse(text); } catch {}
  return { status: r.status, json, text, headers: r.headers };
};
const body = (o) => JSON.stringify(o);

// ---- 1. authorization on EVERY admin write/read route (anonymous) ----
const anon = [
  ['GET', '/api/admin/products'], ['POST', '/api/admin/products'], ['PUT', '/api/admin/products/1'],
  ['DELETE', '/api/admin/products/1'], ['GET', '/api/admin/waitlist'], ['DELETE', '/api/admin/waitlist/1'],
];
for (const [m, p] of anon) {
  const r = await call(p, { method: m, body: m === 'GET' || m === 'DELETE' ? undefined : body({ status: 'sold_out' }) });
  ok(r.status === 401, `anonymous ${m} ${p} -> 401 (got ${r.status})`);
}

// ---- 2. forged / tampered sessions ----
const forged = await new SignJWT({ role: 'admin', email: 'x@x.com' }).setProtectedHeader({ alg: 'HS256' }).setExpirationTime('1h').sign(new TextEncoder().encode('a-totally-different-secret-of-32-chars!!'));
let r = await call('/api/admin/products', { cookie: `sd_admin=${forged}` });
ok(r.status === 401, 'JWT signed with a different secret is rejected');
const none = Buffer.from('{"alg":"none","typ":"JWT"}').toString('base64url') + '.' + Buffer.from('{"role":"admin","email":"x"}').toString('base64url') + '.';
r = await call('/api/admin/products', { cookie: `sd_admin=${none}` });
ok(r.status === 401, 'alg=none JWT is rejected');
r = await call('/api/admin/products', { cookie: 'sd_admin=garbage' });
ok(r.status === 401, 'garbage session cookie is rejected');

// ---- 3. login ----
r = await call('/api/admin/login', { method: 'POST', body: body({ email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD }) });
ok(r.status === 200, 'valid login works');
const cookie = (r.headers.get('set-cookie') || '').split(';')[0];
const setCookie = r.headers.get('set-cookie') || '';
ok(/HttpOnly/i.test(setCookie) && /SameSite=strict/i.test(setCookie), 'session cookie: HttpOnly + SameSite=Strict');
if (BASE.startsWith('https')) ok(/Secure/i.test(setCookie), 'session cookie: Secure over HTTPS');
ok(!JSON.stringify(r.json).includes(process.env.ADMIN_PASSWORD), 'login response does not echo the password');
r = await call('/api/admin/login', { method: 'POST', body: body({ email: "' OR '1'='1", password: "' OR '1'='1" }) });
ok(r.status === 401, 'SQL-injection style login rejected');
r = await call('/api/admin/login', { method: 'POST', body: body({ email: { $ne: null }, password: { $ne: null } }) });
ok(r.status === 401, 'object-typed credentials rejected');

// ---- 4. CSRF / origin protection on authenticated writes ----
const probe = { name: 'CSRF probe', description: 'Should never be created.', price: 1, image_url: '/sneakers/dune-low.jpg' };
r = await call('/api/admin/products', { method: 'POST', cookie, origin: 'https://evil.example', body: body(probe) });
ok(r.status === 403, `cross-origin POST with a valid session is blocked (got ${r.status})`);
r = await call('/api/admin/products', { method: 'POST', cookie, origin: new URL(BASE).origin, body: body(probe) });
ok(r.status === 201, 'same-origin POST is allowed');
if (r.json?.product) await call(`/api/admin/products/${r.json.product.id}`, { method: 'DELETE', cookie, origin: new URL(BASE).origin });
const list = (await call('/api/admin/products', { cookie })).json.products;
ok(!list.some((p) => p.name === 'CSRF probe'), 'blocked cross-origin request created nothing');

// ---- 5. SQL injection (parameterised queries) and stored XSS ----
const evil = "x'); DROP TABLE waitlist; -- ";
r = await call('/api/admin/products', { method: 'POST', cookie, body: body({ name: evil + '<img src=x onerror=alert(1)>', description: "Robert'); DROP TABLE products;-- description text", price: 5, image_url: '/sneakers/dune-low.jpg' }) });
ok(r.status === 201, 'product with SQL/HTML metacharacters is stored as plain data');
const pid = r.json.product.id;
r = await call('/api/products');
ok(r.status === 200 && r.json.products.some((p) => p.id === pid), 'tables intact after injection attempt (products still readable)');
const html = (await call('/')).text;
ok(!html.includes('<img src=x onerror'), 'stored HTML is escaped on the public page (no raw <img onerror>)');
r = await call('/api/waitlist', { method: 'POST', body: body({ email: "a'; DROP TABLE waitlist;--@x.com", productId: pid }) });
ok(r.status === 400, 'injection-style email rejected by validation');
r = await call('/api/waitlist', { method: 'POST', body: body({ email: 'ok@example.com', productId: `${pid} OR 1=1` }) });
ok(r.status === 400, 'non-integer productId rejected');
r = await call('/api/admin/products', { cookie }); ok(r.status === 200, 'waitlist/products tables still queryable');
for (const bad of [{ image_url: 'javascript:alert(1)' }, { image_url: 'http://insecure.example/x.png' }, { accent: 'red;background:url(x)' }, { status: 'bogus' }, { price: 'abc' }]) {
  const rr = await call('/api/admin/products', { method: 'POST', cookie, body: body({ name: 'Bad input', description: 'Valid description text.', price: 5, image_url: '/sneakers/dune-low.jpg', ...bad }) });
  ok(rr.status === 400, `server rejects invalid ${Object.keys(bad)[0]}=${JSON.stringify(Object.values(bad)[0])}`);
}
await call(`/api/admin/products/${pid}`, { method: 'DELETE', cookie });

// ---- 6. data exposure ----
const em = `leak.check+${Date.now()}@example.com`;
const prods = (await call('/api/products')).json.products;
await call('/api/waitlist', { method: 'POST', body: body({ email: em, productId: prods[0].id }) });
const pub = (await call('/api/products')).text + (await call('/')).text;
ok(!pub.includes(em), 'waitlist emails never appear on public pages/API');
ok(!/DATABASE_URL|mysql:\/\/|ADMIN_PASSWORD_HASH|SESSION_SECRET/.test(pub), 'no connection strings or secrets in public output');
const entries = (await call('/api/admin/waitlist', { cookie })).json.entries;
for (const e of entries.filter((x) => x.email === em)) await call(`/api/admin/waitlist/${e.id}`, { method: 'DELETE', cookie });

// ---- 7. headers ----
r = await call('/');
ok(r.headers.get('x-frame-options') === 'DENY', 'X-Frame-Options: DENY');
ok(r.headers.get('x-content-type-options') === 'nosniff', 'X-Content-Type-Options: nosniff');
ok(!r.headers.get('x-powered-by'), 'X-Powered-By removed');

// ---- 8. login throttling (optional, run last) ----
if (process.env.THROTTLE) {
  let last;
  for (let i = 0; i < 10; i++) last = await call('/api/admin/login', { method: 'POST', body: body({ email: process.env.ADMIN_EMAIL, password: 'wrong-' + i }) });
  ok(last.status === 429, `repeated failed logins are throttled (429, got ${last.status})`);
  const good = await call('/api/admin/login', { method: 'POST', body: body({ email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD }) });
  ok(good.status === 429, 'even the right password is refused while throttled');
}
console.log(fails ? `\n${fails} FAILED` : '\nAll security checks passed');
process.exit(fails ? 1 : 0);
