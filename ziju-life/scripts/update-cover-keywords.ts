import { readFileSync } from "fs";
import { resolve } from "path";
import { neon } from "@neondatabase/serverless";

const envPath = resolve(__dirname, "../.env.local");
const envContent = readFileSync(envPath, "utf-8");
for (const line of envContent.split("\n")) {
  const t = line.trim();
  if (!t || t.startsWith("#")) continue;
  const eq = t.indexOf("=");
  if (eq === -1) continue;
  const k = t.slice(0, eq).trim();
  let v = t.slice(eq + 1).trim();
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
  if (!process.env[k]) process.env[k] = v;
}
const sql = neon(process.env.DATABASE_URL!);

const KEYWORDS: Record<string, string> = {
  "osobnost": "MBTI",
  "neměli": "MĚL BYCH",
};

async function main() {
  const posts = await sql`SELECT id, title, tags FROM curated_posts WHERE tags @> ARRAY['blog'] AND status = 'published'`;
  for (const p of posts) {
    let keyword = "";
    for (const [match, kw] of Object.entries(KEYWORDS)) {
      if (p.title.toLowerCase().includes(match)) { keyword = kw; break; }
    }
    if (!keyword) continue;
    const existing = (p.tags as string[]) || [];
    const newTags = [...existing.filter((t: string) => !t.startsWith("cover:")), `cover:${keyword}`];
    await sql`UPDATE curated_posts SET tags = ${newTags} WHERE id = ${p.id}`;
    console.log(`✓ ${p.title} → cover:${keyword}`);
  }
  console.log("Done");
}
main().catch(console.error);
