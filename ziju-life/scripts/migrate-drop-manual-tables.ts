/**
 * Migration: drop orphan tables/columns from deleted Manuál + Audit života + AI coach features.
 *
 * Run with:
 *   npx tsx scripts/migrate-drop-manual-tables.ts           (dry-run, prints what it would do)
 *   npx tsx scripts/migrate-drop-manual-tables.ts --apply   (actually executes DROPs)
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
const apply = process.argv.includes("--apply");

// Tables to drop (all data in them is orphaned — no code reads or writes them)
const TABLES_TO_DROP = [
  "laborator_access",       // Stripe subscription cache for Manuál
  "laborator_grants",       // Admin-granted free Manuál access
  "weekly_checkins",        // Manuál týdenní check-in
  "user_focus_areas",       // Manuál focus area history
  "user_lab_context",       // Manuál sync kompas/hodnoty/rituály
  "daily_todos",            // Manuál daily todos
  "ritual_completions",     // Manuál ritual tracking
  "ai_interactions",        // FloatingAIHelper AI coach logs
  "ai_credit_packs",        // AI credit pack purchases
  "purchases",              // Audit života purchases (product UI deleted)
];

// Columns to drop from admin_settings
const COLUMNS_TO_DROP: Array<{ table: string; column: string }> = [
  { table: "admin_settings", column: "audit_zivota_price_id" },
  { table: "admin_settings", column: "audit_zivota_discount_price_id" },
];

async function run() {
  console.log(apply ? "🔥 APPLYING migration" : "🔍 DRY-RUN (use --apply to execute)");
  console.log("");

  for (const table of TABLES_TO_DROP) {
    const stmt = `DROP TABLE IF EXISTS ${table} CASCADE`;
    console.log(`→ ${stmt}`);
    if (apply) {
      try {
        await sql.query(stmt);
        console.log(`  ✓ dropped`);
      } catch (err) {
        console.error(`  ✗ error:`, err);
      }
    }
  }

  console.log("");

  for (const { table, column } of COLUMNS_TO_DROP) {
    const stmt = `ALTER TABLE ${table} DROP COLUMN IF EXISTS ${column}`;
    console.log(`→ ${stmt}`);
    if (apply) {
      try {
        await sql.query(stmt);
        console.log(`  ✓ dropped`);
      } catch (err) {
        console.error(`  ✗ error:`, err);
      }
    }
  }

  console.log("");
  console.log(apply ? "✅ Done." : "ℹ️  Dry-run finished. Run with --apply to execute.");
}

run().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
