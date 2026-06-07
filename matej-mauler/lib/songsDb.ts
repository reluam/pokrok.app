import { getDb } from "./db";

type Sql = ReturnType<typeof getDb>;

export type SongRow = {
  slug: string;
  title: string;
  note_cs: string; note_en: string;
  audio_url: string; cover_url: string | null;
  released_at: string | null;
  published: boolean; deleted: boolean;
  sort_order: number; created_at?: string;
  likes?: number;
};

export type PublicSong = {
  slug: string; title: string; note: string;
  audioUrl: string; coverUrl: string | null; date: string; likes: number;
};

export type SongMessage = { id: number; author: string; content: string; created_at: string };

let ready = false;

async function ensure(sql: Sql) {
  if (ready) return;
  await sql`CREATE TABLE IF NOT EXISTS songs (
    slug TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    note_cs TEXT NOT NULL DEFAULT '',
    note_en TEXT NOT NULL DEFAULT '',
    audio_url TEXT NOT NULL,
    cover_url TEXT,
    released_at DATE,
    published BOOLEAN NOT NULL DEFAULT FALSE,
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`;
  await sql`ALTER TABLE songs ADD COLUMN IF NOT EXISTS likes INT NOT NULL DEFAULT 0`;
  await sql`CREATE TABLE IF NOT EXISTS song_comments (
    id SERIAL PRIMARY KEY,
    song_slug TEXT NOT NULL,
    author TEXT NOT NULL DEFAULT '',
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`;
  ready = true;
}

const todayISO = () => new Date().toISOString().slice(0, 10);

/* ── Veřejné čtení ─────────────────────────────────────────────── */
export async function getPublicSongs(lang: "cs" | "en", limit?: number): Promise<PublicSong[]> {
  try {
    const sql = getDb();
    await ensure(sql);
    const rows = await sql`
      SELECT *, COALESCE(released_at, created_at::date)::text AS eff_date
      FROM songs WHERE published = TRUE AND deleted = FALSE
      ORDER BY COALESCE(released_at, created_at::date) DESC, created_at DESC
    ` as (SongRow & { eff_date: string })[];
    const mapped = rows.map((r) => ({
      slug: r.slug, title: r.title,
      note: lang === "cs" ? r.note_cs : r.note_en,
      audioUrl: r.audio_url, coverUrl: r.cover_url, date: r.eff_date,
      likes: r.likes ?? 0,
    }));
    return limit ? mapped.slice(0, limit) : mapped;
  } catch {
    return [];
  }
}

/* ── Lajky (veřejné) ───────────────────────────────────────────── */
export async function likeSong(slug: string, delta: number): Promise<number> {
  const sql = getDb();
  await ensure(sql);
  const d = delta >= 0 ? 1 : -1;
  const [row] = await sql`
    UPDATE songs SET likes = GREATEST(0, likes + ${d})
    WHERE slug = ${slug} AND published = TRUE AND deleted = FALSE
    RETURNING likes
  ` as { likes: number }[];
  return row?.likes ?? 0;
}

/* ── Soukromé zprávy autorovi (NEzobrazují se veřejně) ──────────── */
export async function addMessage(slug: string, author: string, content: string): Promise<boolean> {
  const sql = getDb();
  await ensure(sql);
  const [song] = await sql`SELECT 1 FROM songs WHERE slug = ${slug} AND published = TRUE AND deleted = FALSE` as { "?column?": number }[];
  if (!song) return false;
  const a = author.trim().slice(0, 40);
  const c = content.trim().slice(0, 2000);
  if (!c) return false;
  await sql`INSERT INTO song_comments (song_slug, author, content) VALUES (${slug}, ${a}, ${c})`;
  return true;
}

// admin: všechny zprávy napříč songy
export async function getAllMessages(): Promise<(SongMessage & { song_slug: string; song_title: string })[]> {
  const sql = getDb();
  await ensure(sql);
  return await sql`
    SELECT m.id, m.author, m.content, m.created_at::text AS created_at,
           m.song_slug, COALESCE(s.title, m.song_slug) AS song_title
    FROM song_comments m
    LEFT JOIN songs s ON s.slug = m.song_slug
    ORDER BY m.created_at DESC LIMIT 500
  ` as (SongMessage & { song_slug: string; song_title: string })[];
}

export async function deleteMessage(id: number): Promise<void> {
  const sql = getDb();
  await ensure(sql);
  await sql`DELETE FROM song_comments WHERE id = ${id}`;
}

/* ── Admin operace ─────────────────────────────────────────────── */
export async function getAllSongs(): Promise<SongRow[]> {
  const sql = getDb();
  await ensure(sql);
  // released_at/created_at přetypovat na text — Neon je jinak vrací jako Date (nelze renderovat).
  return await sql`
    SELECT slug, title, note_cs, note_en, audio_url, cover_url,
           released_at::text AS released_at, published, deleted, sort_order,
           created_at::text AS created_at
    FROM songs WHERE deleted = FALSE
    ORDER BY COALESCE(released_at, created_at::date) DESC, created_at DESC
  ` as SongRow[];
}

export async function createSong(r: { slug: string; title: string; note_cs: string; note_en: string; audio_url: string; cover_url: string | null; released_at: string | null }): Promise<void> {
  const sql = getDb();
  await ensure(sql);
  const [{ max }] = await sql`SELECT COALESCE(MAX(sort_order), -1) AS max FROM songs` as { max: number }[];
  await sql`INSERT INTO songs (slug, title, note_cs, note_en, audio_url, cover_url, released_at, sort_order, published)
    VALUES (${r.slug}, ${r.title}, ${r.note_cs}, ${r.note_en}, ${r.audio_url}, ${r.cover_url}, ${r.released_at || todayISO()}, ${max + 1}, FALSE)
    ON CONFLICT (slug) DO NOTHING`;
}

export async function patchSong(slug: string, f: Partial<SongRow>): Promise<void> {
  const sql = getDb();
  await ensure(sql);
  const [cur] = await sql`SELECT * FROM songs WHERE slug = ${slug}` as SongRow[];
  if (!cur) return;
  const n = { ...cur, ...f };
  await sql`UPDATE songs SET title=${n.title}, note_cs=${n.note_cs}, note_en=${n.note_en}, audio_url=${n.audio_url}, cover_url=${n.cover_url}, released_at=${n.released_at || null}, published=${n.published} WHERE slug=${slug}`;
}

export async function deleteSong(slug: string): Promise<void> {
  const sql = getDb();
  await ensure(sql);
  await sql`UPDATE songs SET deleted = TRUE, published = FALSE WHERE slug = ${slug}`;
}

export const songsUi = {
  cs: {
    back: "← Spaghetti.ltd",
    title: "Songs",
    subtitle: "Občas něco složím. Tady to zůstává.",
    intro: "Žádný velký plán, žádné album. Jen songy, co vznikly cestou.",
    all: "Všechny songy →",
    empty: "Zatím ticho. Brzy tu něco zahraje.",
    play: "Přehrát", pause: "Pauza",
    prev: "Novější", next: "Starší", volume: "Hlasitost",
    feedbackTitle: "Poslat vzkaz autorovi",
    feedbackHint: "Uvidím to jen já. Veřejně se to nezobrazí.",
    messagePh: "Tvůj vzkaz…", send: "Odeslat",
    sent: "Díky, dorazilo to ke mně. 🍝",
    of: "z",
  },
  en: {
    back: "← Spaghetti.ltd",
    title: "Songs",
    subtitle: "Sometimes I make a song. It ends up here.",
    intro: "No grand plan, no album. Just songs that happened along the way.",
    all: "All songs →",
    empty: "Silence for now. Something will play here soon.",
    play: "Play", pause: "Pause",
    prev: "Newer", next: "Older", volume: "Volume",
    feedbackTitle: "Send a message to the author",
    feedbackHint: "Only I will see this. It won't be shown publicly.",
    messagePh: "Your message…", send: "Send",
    sent: "Thanks, it reached me. 🍝",
    of: "of",
  },
} as const;
