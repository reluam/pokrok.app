/**
 * Migration script: create exercises table.
 * Run with: npx tsx scripts/migrate-exercises.ts
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
  // .env.local not found — rely on process.env
}

import { neon } from "@neondatabase/serverless";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("Missing DATABASE_URL env variable");
  process.exit(1);
}

const sql = neon(connectionString);

async function main() {
  console.log("Creating exercises table...");
  await sql`
    CREATE TABLE IF NOT EXISTS exercises (
      id VARCHAR(255) PRIMARY KEY,
      slug VARCHAR(255) NOT NULL UNIQUE,
      title TEXT NOT NULL,
      emoji VARCHAR(16),
      body_markdown TEXT NOT NULL DEFAULT '',
      order_index INTEGER NOT NULL DEFAULT 0,
      resource_url TEXT,
      related_post_slug VARCHAR(255),
      is_active BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_exercises_order ON exercises(order_index, created_at DESC)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_exercises_slug ON exercises(slug)`;
  console.log("✅ exercises table ready.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
