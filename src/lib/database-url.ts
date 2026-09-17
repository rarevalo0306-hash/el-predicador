/**
 * Normalize DATABASE_URL for Vercel / IPv4-only runtimes.
 *
 * Supabase "direct" hosts (`db.<ref>.supabase.co`) are IPv6-only. Node on
 * Vercel often fails with `getaddrinfo ENOTFOUND` (no A record). Rewrite to
 * the Shared Pooler (Supavisor) which is IPv4.
 *
 * Override region with `SUPABASE_REGION` (e.g. `us-east-1`). Default `us-east-1`.
 * Skip rewrite with `SUPABASE_USE_DIRECT=1` or if the URL already points at
 * `pooler.supabase.com`.
 */
export function normalizeDatabaseUrl(raw: string | undefined): string | undefined {
  if (!raw?.trim()) return undefined;
  const url = raw.trim();

  if (process.env.SUPABASE_USE_DIRECT?.trim() === "1") return url;
  if (/pooler\.supabase\.com/i.test(url)) return url;

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return url;
  }

  const hostMatch = /^db\.([a-z0-9]+)\.supabase\.co$/i.exec(parsed.hostname);
  if (!hostMatch) return url;

  const projectRef = hostMatch[1]!;
  const region = (process.env.SUPABASE_REGION?.trim() || "us-east-1").replace(
    /^aws-\d+-/,
    "",
  );
  const poolerHost = `aws-0-${region}.pooler.supabase.com`;

  const user = decodeURIComponent(parsed.username || "postgres");
  const nextUser = user.includes(".") ? user : `postgres.${projectRef}`;

  parsed.hostname = poolerHost;
  parsed.port = "6543";
  parsed.username = nextUser;

  if (!parsed.searchParams.has("pgbouncer")) {
    parsed.searchParams.set("pgbouncer", "true");
  }

  const normalized = parsed.toString();
  if (typeof console !== "undefined" && normalized !== url) {
    console.info(
      `[db] rewrote Supabase direct host → pooler (${poolerHost}) for IPv4`,
    );
  }
  return normalized;
}
