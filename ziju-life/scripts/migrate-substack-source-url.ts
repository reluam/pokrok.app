/**
 * Migration: add source_url column to curated_posts for Substack sync.
 * Run with: npx tsx scripts/migrate-substack-source-url.ts
 */

import { readFileSync } from "fs";
import { join } from "path";

try {
  const envPath = join(process.cwd(), ".env.local");
  const envContent = readFileSync(envPath, "utf8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const value = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, "");
    if (!process.env[key]) process.env[key] = value;
  }
} catch {
  // rely on process.env
}

import { neon } from "@neondatabase/serverless";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("Missing DATABASE_URL env variable");
  process.exit(1);
}

const sql = neon(connectionString);

async function main() {
  console.log("Adding source_url column to curated_posts...");
  await sql`ALTER TABLE curated_posts ADD COLUMN IF NOT EXISTS source_url TEXT`;
  console.log("✅ Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
