#!/usr/bin/env node
/**
 * Nitro's Vercel preset traces electric-sql/pglite but omits the sibling
 * wasm/data files it loads via import.meta.url. Without them,
 * `vite preview` (and any deploy without DATABASE_URL) crashes on boot.
 */
import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const srcDir = join(root, "node_modules/@electric-sql/pglite/dist");
const destDir = join(root, ".vercel/output/functions/__server.func/_libs");
const files = ["pglite.data", "pglite.wasm", "initdb.wasm"];

if (!existsSync(destDir)) {
  console.log("[pglite-assets] no vercel server output yet — skip");
  process.exit(0);
}

mkdirSync(destDir, { recursive: true });
for (const name of files) {
  const from = join(srcDir, name);
  const to = join(destDir, name);
  if (!existsSync(from)) {
    console.warn(`[pglite-assets] missing source ${name}`);
    continue;
  }
  copyFileSync(from, to);
  console.log(`[pglite-assets] copied ${name}`);
}
