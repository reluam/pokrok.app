/**
 * Migration script: Copy active inspirations from `inspirations` table
 * into `curated_posts` table as feed items.
 *
 * Run: npx tsx scripts/migrate-inspirations-to-feed.ts
 *
 * - Skips type 'princip' and 'tool' (principles are kept separately, tools are removed)
 * - Maps inspiration type to a tag (e.g. "kniha", "video", "článek")
 * - Sets type='tip' in curated_posts
 * - Status='published', preserves original created_at as published_at
 */

import { readFileSync } from "fs";
import { resolve } from "path";
import { neon } from "@neondatabase/serverless";

// Load .env.local manually
const envPath = resolve(__dirname, "../.env.local");
const envContent = readFileSync(envPath, "utf-8");
for (const line of envContent.split("\n")) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const eqIdx = trimmed.indexOf("=");
  if (eqIdx === -1) continue;
  const key = trimmed.slice(0, eqIdx).trim();
  let val = trimmed.slice(eqIdx + 1).trim();
  // Remove surrounding quotes
  if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
    val = val.slice(1, -1);
  }
  if (!process.env[key]) process.env[key] = val;
}

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("Missing DATABASE_URL env var");
  process.exit(1);
}

const sql = neon(DATABASE_URL);

const TYPE_TAG_MAP: Record<string, string> = {
  blog: "blog",
  video: "video",
  book: "kniha",
  article: "článek",
  other: "ostatní",
  music: "hudba",
  reel: "reel",
};

const TYPE_EMOJI: Record<string, string> = {
  blog: "📝",
  video: "🎬",
  book: "📚",
  article: "📰",
  other: "💡",
  music: "🎵",
  reel: "📱",
};

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .substring(0, 80);
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
}

async function ensureCuratedPostsTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS curated_posts (
      id VARCHAR(255) PRIMARY KEY,
      slug VARCHAR(255) NOT NULL UNIQUE,
      type VARCHAR(20) NOT NULL CHECK (type IN ('tip', 'digest')),
      title TEXT NOT NULL,
      subtitle TEXT,
      body_markdown TEXT NOT NULL DEFAULT '',
      body_html TEXT,
      video_script TEXT,
      cover_image_url TEXT,
      pipeline_brief_ids INTEGER[] DEFAULT ARRAY[]::INTEGER[],
      curator_note TEXT,
      categories TEXT[] DEFAULT ARRAY[]::TEXT[],
      tags TEXT[] DEFAULT ARRAY[]::TEXT[],
      status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
      is_premium BOOLEAN DEFAULT false,
      published_at TIMESTAMPTZ,
      week_number INTEGER,
      week_year INTEGER,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_curated_posts_slug ON curated_posts(slug)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_curated_posts_status ON curated_posts(status)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_curated_posts_published ON curated_posts(published_at DESC)`;
  console.log("curated_posts table ensured.");
}

async function main() {
  await ensureCuratedPostsTable();
  console.log("Loading inspirations from DB...");

  const inspirations = await sql`
    SELECT id, type, title, description, url, author, content, thumbnail, image_url,
           is_active, created_at, updated_at, category_id
    FROM inspirations
    WHERE is_active = true
      AND type NOT IN ('princip', 'tool')
    ORDER BY created_at DESC
  `;

  console.log(`Found ${inspirations.length} active inspirations to migrate.`);

  if (inspirations.length === 0) {
    console.log("Nothing to migrate.");
    return;
  }

  // Check which inspirations are already migrated (by checking title match)
  const existingSlugs = await sql`
    SELECT slug FROM curated_posts WHERE tags @> ARRAY['migrated-inspiration']
  `;
  const existingSlugSet = new Set(existingSlugs.map((r: any) => r.slug));

  let migrated = 0;
  let skipped = 0;

  for (const item of inspirations) {
    const typeTag = TYPE_TAG_MAP[item.type] || "ostatní";
    const emoji = TYPE_EMOJI[item.type] || "💡";
    const id = generateId();
    const baseSlug = slugify(item.title || "untitled");
    const slug = `${baseSlug}-${id.substring(0, 5)}`;

    // Skip if already migrated
    if (existingSlugSet.has(slug)) {
      skipped++;
      continue;
    }

    // Build body markdown
    const parts: string[] = [];

    if (item.author) {
      parts.push(`**Autor:** ${item.author}`);
    }

    if (item.description) {
      parts.push(item.description);
    }

    if (item.content) {
      parts.push(item.content);
    }

    if (item.url) {
      const linkLabel = item.type === "book" ? "Kniha" :
                        item.type === "video" ? "Video" :
                        item.type === "music" ? "Poslechnout" :
                        "Odkaz";
      parts.push(`[${emoji} ${linkLabel}](${item.url})`);
    }

    const bodyMarkdown = parts.join("\n\n");

    // Determine categories based on inspiration type
    const categories: string[] = [];
    // We don't have direct category mapping, but the description might hint at it

    const tags = [typeTag, "migrated-inspiration"];
    if (item.author) tags.push(item.author.toLowerCase().replace(/\s+/g, "-"));

    const coverImageUrl = item.image_url || item.thumbnail || null;

    try {
      await sql`
        INSERT INTO curated_posts (
          id, slug, type, title, subtitle, body_markdown,
          cover_image_url, categories, tags,
          status, is_premium, published_at, created_at, updated_at
        ) VALUES (
          ${id}, ${slug}, 'tip', ${item.title}, ${item.author || null}, ${bodyMarkdown},
          ${coverImageUrl}, ${categories}, ${tags},
          'published', false, ${item.created_at}, ${item.created_at}, ${item.updated_at || item.created_at}
        )
      `;
      migrated++;
      console.log(`  ✓ [${typeTag}] ${item.title}`);
    } catch (err: any) {
      console.error(`  ✗ Failed: ${item.title} — ${err.message}`);
    }
  }

  console.log(`\nDone! Migrated: ${migrated}, Skipped: ${skipped}`);
}

main().catch(console.error);
