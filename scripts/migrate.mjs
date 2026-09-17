#!/usr/bin/env node
/**
 * Deploy-time database migrator (node-postgres, `pg`).
 *
 * Runs during `npm run build` — on every Vercel deploy — applying pending files
 * in ../migrations to DATABASE_URL. Each file is applied in one transaction and
 * recorded in a `_migrations` table, so it runs once and is safe to re-run.
 *
 * The read is non-recursive, so the opt-in auth schema under migrations/auth/
 * is not applied to an app that never asked for sign-in.
 *
 * No DATABASE_URL (local / preview builds) -> skip; the PGLite fallback applies
 * the same files at startup instead (see src/lib/db.ts).
 *
 * Network failures during the Vercel build (common with IPv6-only DB hosts) do
 * NOT fail the deploy — runtime `getSql()` re-applies migrations on first use.
 */
import { readdir, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import pg from "pg";
import { pendingMigrations } from "./migration-plan.mjs";

/** Mirror of src/lib/database-url.ts — keep in sync (build script cannot import TS). */
function normalizeDatabaseUrl(raw) {
  if (!raw || !String(raw).trim()) return undefined;
  const url = String(raw).trim();
  if (process.env.SUPABASE_USE_DIRECT?.trim() === "1") return url;
  if (/pooler\.supabase\.com/i.test(url)) return url;
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return url;
  }
  const hostMatch = /^db\.([a-z0-9]+)\.supabase\.co$/i.exec(parsed.hostname);
  if (!hostMatch) return url;
  const projectRef = hostMatch[1];
  const region = (process.env.SUPABASE_REGION?.trim() || "us-east-1").replace(
    /^aws-\d+-/,
    "",
  );
  const poolerHost = `aws-0-${region}.pooler.supabase.com`;
  const user = decodeURIComponent(parsed.username || "postgres");
  parsed.hostname = poolerHost;
  parsed.port = process.env.SUPABASE_POOLER_PORT?.trim() || "5432";
  parsed.username = user.includes(".") ? user : `postgres.${projectRef}`;
  if (parsed.port === "6543" && !parsed.searchParams.has("pgbouncer")) {
    parsed.searchParams.set("pgbouncer", "true");
  } else {
    parsed.searchParams.delete("pgbouncer");
  }
  const normalized = parsed.toString();
  if (normalized !== url) {
    console.info(
      `[migrate] rewrote Supabase direct host → pooler (${poolerHost}) for IPv4`,
    );
  }
  return normalized;
}

const databaseUrl = normalizeDatabaseUrl(process.env.DATABASE_URL);
if (!databaseUrl) {
  console.log(
    "[migrate] DATABASE_URL not set — skipping (the PGLite fallback migrates itself).",
  );
  process.exit(0);
}

const migrationsDir = join(dirname(fileURLToPath(import.meta.url)), "..", "migrations");

const SOFT_FAIL_CODES = new Set([
  "ENETUNREACH",
  "EHOSTUNREACH",
  "ETIMEDOUT",
  "ECONNREFUSED",
  "ENOTFOUND",
  "EAI_AGAIN",
]);

async function main() {
  let entries;
  try {
    entries = await readdir(migrationsDir);
  } catch {
    console.log("[migrate] no migrations/ directory — nothing to do.");
    return;
  }
  // An app with no schema of its own must not pay for a database connection.
  if (pendingMigrations(entries, []).length === 0) {
    console.log("[migrate] no migrations — nothing to do.");
    return;
  }

  // Prefer IPv4 — some free Supabase / Neon endpoints advertise IPv6 that the
  // Vercel build network cannot reach (ENETUNREACH).
  const pool = new pg.Pool({
    connectionString: databaseUrl,
    max: 1,
    connectionTimeoutMillis: 15_000,
    // Prefer IPv4 (forwarded to net.connect) — Vercel build often cannot reach
    // IPv6-only Supabase/Neon hosts (ENETUNREACH).
    family: 4,
  });
  const client = await pool.connect();
  try {
    await client.query(
      "CREATE TABLE IF NOT EXISTS _migrations (name TEXT PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT now())",
    );
    const applied = (await client.query("SELECT name FROM _migrations")).rows.map(
      (r) => r.name,
    );

    let count = 0;
    for (const { name } of pendingMigrations(entries, applied)) {
      const text = await readFile(join(migrationsDir, name), "utf8");
      try {
        await client.query("BEGIN");
        // pg's simple-query protocol runs a whole multi-statement file at once.
        await client.query(text);
        await client.query("INSERT INTO _migrations (name) VALUES ($1)", [name]);
        await client.query("COMMIT");
      } catch (err) {
        console.error(`[migrate] error applying ${name}`);
        try {
          await client.query("ROLLBACK");
        } catch {
          // ROLLBACK fails when the connection died — keep the original error.
        }
        throw err;
      }
      console.log(`[migrate] applied ${name}`);
      count += 1;
    }
    console.log(count ? `[migrate] done — ${count} migration(s) applied.` : "[migrate] up to date.");
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error("[migrate] failed:", err?.message || err);
  // pg errors carry the context needed to debug a bad SQL file.
  for (const key of ["code", "detail", "hint", "position", "where"]) {
    if (err?.[key] != null) console.error(`[migrate]   ${key}: ${err[key]}`);
  }
  const code = err?.code;
  if (SOFT_FAIL_CODES.has(code)) {
    console.warn(
      "[migrate] network unreachable during build — continuing deploy; runtime will migrate on first request.",
    );
    process.exit(0);
  }
  process.exit(1);
});
