// Creates the schema and seeds demo sneakers if the table is empty.
// Usage: DATABASE_URL=mysql://... node scripts/setup.mjs
import mysql from 'mysql2/promise';
import fs from 'node:fs';
import { SEED } from './seed-data.mjs';

const url = process.env.DATABASE_URL;
if (!url) { console.log('DATABASE_URL not set, skipping db setup'); process.exit(0); }
const local = /@(localhost|127\.0\.0\.1)/.test(url);
const conn = await mysql.createConnection({ uri: url, ssl: local ? undefined : { minVersion: 'TLSv1.2', rejectUnauthorized: true } });
const sql = fs.readFileSync(new URL('../db/schema.sql', import.meta.url), 'utf8');
for (const stmt of sql.split(/;\s*(?:\n|$)/).map((s) => s.replace(/^\s*--.*$/gm, '').trim()).filter(Boolean)) await conn.query(stmt);
const [rows] = await conn.query('SELECT COUNT(*) AS n FROM products');
if (Number(rows[0].n) === 0) {
  for (const p of SEED) {
    await conn.execute(
      `INSERT IGNORE INTO products (slug,name,tagline,description,price_cents,image_url,accent,status,sort_order)
       VALUES (?,?,?,?,?,?,?,?,?)`,
      [p.slug, p.name, p.tagline, p.description, p.price_cents, p.image_url, p.accent, p.status, p.sort_order]
    );
  }
  console.log(`Seeded ${SEED.length} sneakers`);
} else console.log('Products already present, no seed');
await conn.end();
