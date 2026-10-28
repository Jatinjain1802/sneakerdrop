import mysql from 'mysql2/promise';
import fs from 'node:fs';
import path from 'node:path';

const g = globalThis;

function getPool() {
  if (!g.__mysqlPool) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error('DATABASE_URL is not set');
    const local = /@(localhost|127\.0\.0\.1)/.test(url);
    g.__mysqlPool = mysql.createPool({
      uri: url,
      ssl: local ? undefined : { minVersion: 'TLSv1.2', rejectUnauthorized: true },
      connectionLimit: 5,
      waitForConnections: true,
      timezone: 'Z',
    });
  }
  return g.__mysqlPool;
}

export function splitSql(sql) {
  return sql.split(/;\s*(?:\n|$)/).map((s) => s.replace(/^\s*--.*$/gm, '').trim()).filter(Boolean);
}

let schemaReady;
/** Idempotent: creates tables on first use so a fresh, empty database just works. */
export function ensureSchema() {
  if (!schemaReady) {
    const sql = fs.readFileSync(path.join(process.cwd(), 'db', 'schema.sql'), 'utf8');
    schemaReady = (async () => {
      for (const stmt of splitSql(sql)) await getPool().query(stmt);
    })().catch((e) => {
      schemaReady = undefined;
      throw e;
    });
  }
  return schemaReady;
}

/** Runs a parameterised query. Returns the rows (SELECT) or the result header (INSERT/UPDATE/DELETE). */
export async function query(sql, params = []) {
  await ensureSchema();
  const [result] = await getPool().execute(sql, params);
  return result;
}
