/**
 * Seed script: import tools from data/toolbox-seed.ts into toolbox_tools table.
 * Run with: npx tsx scripts/seed-toolbox.ts
 */

// Load .env.local manually before anything else
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
import { SEED_TOOLS } from "../data/toolbox-seed";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("Missing DATABASE_URL env variable");
  process.exit(1);
}

const sql = neon(connectionString);

async function seed() {
  console.log(`Seeding ${SEED_TOOLS.length} tools...`);

  // Ensure table exists (with new columns)
  await sql`
    CREATE TABLE IF NOT EXISTS toolbox_tools (
      id VARCHAR(255) PRIMARY KEY,
      slug VARCHAR(255) NOT NULL UNIQUE,
      title TEXT NOT NULL,
      short_description TEXT NOT NULL,
      description_markdown TEXT NOT NULL DEFAULT '',
      application_markdown TEXT NOT NULL DEFAULT '',
      sources JSONB NOT NULL DEFAULT '[]'::jsonb,
      tags TEXT[] DEFAULT ARRAY[]::TEXT[],
      category VARCHAR(100),
      difficulty SMALLINT CHECK (difficulty BETWEEN 1 AND 3),
      duration_estimate VARCHAR(50),
      icon VARCHAR(10),
      order_index INTEGER NOT NULL DEFAULT 0,
      is_active BOOLEAN NOT NULL DEFAULT true,
      is_featured BOOLEAN NOT NULL DEFAULT false,
      related_tool_ids TEXT[] DEFAULT ARRAY[]::TEXT[],
      tool_type VARCHAR(20) NOT NULL DEFAULT 'knowledge',
      component_id VARCHAR(100),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
  `;

  let inserted = 0;
  let skipped = 0;

  for (let i = 0; i < SEED_TOOLS.length; i++) {
    const tool = SEED_TOOLS[i];
    const id = `tool_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    const orderIndex = i + 1;

    try {
      // Check if slug already exists
      const existing = await sql`
        SELECT id FROM toolbox_tools WHERE slug = ${tool.slug} LIMIT 1
      `;

      if (existing.length > 0) {
        console.log(`  [SKIP] ${tool.slug} (already exists)`);
        skipped++;
        continue;
      }

      await sql`
        INSERT INTO toolbox_tools (
          id, slug, title, short_description,
          description_markdown, application_markdown,
          sources, tags, category, difficulty,
          duration_estimate, icon, order_index,
          is_active, is_featured, related_tool_ids,
          tool_type, component_id,
          created_at, updated_at
        ) VALUES (
          ${id},
          ${tool.slug},
          ${tool.title},
          ${tool.shortDescription},
          ${tool.descriptionMarkdown},
          ${tool.applicationMarkdown},
          ${JSON.stringify(tool.sources ?? [])},
          ${tool.tags ?? []},
          ${tool.category ?? null},
          ${tool.difficulty ?? null},
          ${tool.durationEstimate ?? null},
          ${tool.icon ?? null},
          ${orderIndex},
          ${tool.isActive ?? true},
          ${tool.isFeatured ?? false},
          ${tool.relatedToolIds ?? []},
          ${tool.toolType ?? "knowledge"},
          ${tool.componentId ?? null},
          NOW(),
          NOW()
        )
      `;

      inserted++;
      console.log(`  [OK] ${tool.slug} (#${orderIndex})`);
    } catch (err) {
      console.error(`  [ERR] ${tool.slug}:`, err);
    }
  }

  console.log(`\nDone! Inserted: ${inserted}, Skipped: ${skipped}, Total in seed: ${SEED_TOOLS.length}`);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
