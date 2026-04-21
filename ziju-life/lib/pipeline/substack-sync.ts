import Parser from "rss-parser";
import { sql } from "../database";

const SUBSTACK_FEED_URL = "https://zijulife.substack.com/feed";

type SubstackItem = {
  title?: string;
  link?: string;
  pubDate?: string;
  contentSnippet?: string;
  content?: string;
  enclosure?: { url?: string; type?: string };
  "content:encoded"?: string;
  isoDate?: string;
};

const parser = new Parser<Record<string, unknown>, SubstackItem>({
  timeout: 10000,
  customFields: {
    item: [
      ["content:encoded", "content:encoded"],
      ["enclosure", "enclosure"],
    ],
  },
  headers: {
    "User-Agent": "ZijuLife-SubstackSync/1.0",
  },
});

function extractSlugFromUrl(url: string): string {
  try {
    const u = new URL(url);
    const parts = u.pathname.split("/").filter(Boolean);
    const last = parts[parts.length - 1] || "";
    return last.toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 120);
  } catch {
    return "";
  }
}

function extractCoverImage(item: SubstackItem): string | null {
  if (item.enclosure?.url && item.enclosure.type?.startsWith("image/")) {
    return item.enclosure.url;
  }
  const html = item["content:encoded"] || item.content || "";
  if (typeof html !== "string") return null;
  const match = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  return match ? match[1] : null;
}

function extractSubtitle(item: SubstackItem): string | null {
  const snippet = (item.contentSnippet || "").trim();
  if (!snippet) return null;
  const firstLine = snippet.split("\n")[0].trim();
  return firstLine.slice(0, 300) || null;
}

export interface SubstackSyncResult {
  fetched: number;
  inserted: number;
  updated: number;
  skipped: number;
  errors: string[];
}

export async function syncSubstack(): Promise<SubstackSyncResult> {
  const result: SubstackSyncResult = {
    fetched: 0,
    inserted: 0,
    updated: 0,
    skipped: 0,
    errors: [],
  };

  let feed;
  try {
    feed = await parser.parseURL(SUBSTACK_FEED_URL);
  } catch (err) {
    result.errors.push(
      err instanceof Error ? err.message : "Failed to parse Substack feed"
    );
    return result;
  }

  result.fetched = feed.items?.length ?? 0;

  for (const item of feed.items || []) {
    try {
      const link = item.link;
      if (!link) {
        result.skipped++;
        continue;
      }
      const rawSlug = extractSlugFromUrl(link);
      if (!rawSlug) {
        result.skipped++;
        continue;
      }
      const slug = `substack-${rawSlug}`;
      const title = (item.title || "").trim();
      if (!title) {
        result.skipped++;
        continue;
      }
      const subtitle = extractSubtitle(item);
      const coverImage = extractCoverImage(item);
      const publishedAt = item.isoDate
        ? new Date(item.isoDate)
        : item.pubDate
        ? new Date(item.pubDate)
        : new Date();

      const existing = (await sql`
        SELECT id FROM curated_posts WHERE slug = ${slug} LIMIT 1
      `) as { id: string }[];

      if (existing.length === 0) {
        const id = `cp_ss_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        await sql`
          INSERT INTO curated_posts (
            id, slug, type, title, subtitle, body_markdown,
            cover_image_url, source_url, tags, status, published_at
          ) VALUES (
            ${id}, ${slug}, 'tip', ${title}, ${subtitle}, '',
            ${coverImage}, ${link},
            ARRAY['substack', 'článek']::TEXT[],
            'published', ${publishedAt.toISOString()}
          )
        `;
        result.inserted++;
      } else {
        await sql`
          UPDATE curated_posts SET
            title = ${title},
            subtitle = ${subtitle},
            cover_image_url = COALESCE(${coverImage}, cover_image_url),
            source_url = ${link},
            published_at = ${publishedAt.toISOString()},
            updated_at = NOW()
          WHERE id = ${existing[0].id}
        `;
        result.updated++;
      }
    } catch (err) {
      result.errors.push(
        err instanceof Error ? err.message : "Unknown sync error"
      );
    }
  }

  return result;
}
