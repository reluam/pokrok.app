import { getDb } from "./db";
import {
  TRACKS, SCALE_NAMES, randomInst, emptyPartData,
  type Assignment, type SongDetail, type SongPart, type PartData, type TrackName, type FinishedItem,
} from "./music";

type Sql = ReturnType<typeof getDb>;

// Schéma stačí ověřit jednou za „teplý" běh funkce → šetří round-tripy.
let schemaReady = false;

async function ensureSchema(sql: Sql) {
  if (schemaReady) return;
  await sql.transaction([
    sql`CREATE TABLE IF NOT EXISTS mv4_song (
      id SERIAL PRIMARY KEY,
      scale_root INT NOT NULL, scale_name TEXT NOT NULL, tempo INT NOT NULL,
      status TEXT NOT NULL DEFAULT 'building',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`,
    sql`CREATE TABLE IF NOT EXISTS mv4_part (
      id SERIAL PRIMARY KEY,
      song_id INT NOT NULL,
      track TEXT NOT NULL,
      inst TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'open',
      session_token TEXT,
      email TEXT,
      events JSONB,
      claimed_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE(song_id, track)
    )`,
  ]);
  schemaReady = true;
}

type SongRow = { id: number; scale_root: number; scale_name: string; tempo: number; status: string };
type PartRow = { id: number; song_id: number; track: string; inst: string; status: string; events: PartData | null };

async function createSong(sql: Sql): Promise<SongRow> {
  const root = 55 + Math.floor(Math.random() * 8);
  const scale = SCALE_NAMES[Math.floor(Math.random() * SCALE_NAMES.length)];
  const tempo = 92 + Math.floor(Math.random() * 28);
  const [song] = await sql`INSERT INTO mv4_song (scale_root, scale_name, tempo) VALUES (${root}, ${scale}, ${tempo}) RETURNING *` as SongRow[];
  // Všechny 4 sloty jedním round-tripem.
  await sql.transaction(
    TRACKS.map((tr) => sql`INSERT INTO mv4_part (song_id, track, inst) VALUES (${song.id}, ${tr}, ${randomInst(tr)}) ON CONFLICT (song_id, track) DO NOTHING`)
  );
  return song;
}

/** Přiřadí uživateli náhodný volný slot — přednostně do nejrozdělanější skladby. */
export async function assignPart(token: string): Promise<Assignment> {
  const sql = getDb();
  await ensureSchema(sql);

  // Uvolni „zaseklé" claimy starší 15 minut
  await sql`UPDATE mv4_part SET status = 'open', session_token = NULL, claimed_at = NULL
            WHERE status = 'claimed' AND claimed_at < NOW() - INTERVAL '15 minutes'`;

  for (let attempt = 0; attempt < 3; attempt++) {
    // Vyber skladbu (building) s otevřeným slotem, přednostně tu nejblíž dokončení
    const [songRow] = await sql`
      SELECT s.id FROM mv4_song s
      WHERE s.status = 'building'
        AND EXISTS (SELECT 1 FROM mv4_part p WHERE p.song_id = s.id AND p.status = 'open')
      ORDER BY (SELECT COUNT(*) FROM mv4_part d WHERE d.song_id = s.id AND d.status = 'done') DESC, RANDOM()
      LIMIT 1
    ` as { id: number }[];

    let songId: number;
    if (songRow) songId = songRow.id;
    else songId = (await createSong(sql)).id;

    // Náhodný otevřený slot a pokus o claim
    const [openPart] = await sql`
      SELECT id FROM mv4_part WHERE song_id = ${songId} AND status = 'open' ORDER BY RANDOM() LIMIT 1
    ` as { id: number }[];
    if (!openPart) continue;

    const [claimed] = await sql`
      UPDATE mv4_part SET status = 'claimed', session_token = ${token}, claimed_at = NOW()
      WHERE id = ${openPart.id} AND status = 'open'
      RETURNING id, song_id, track, inst
    ` as { id: number; song_id: number; track: string; inst: string }[];
    if (!claimed) continue; // někdo byl rychlejší, zkus znovu

    const [song] = await sql`SELECT scale_root, scale_name, tempo FROM mv4_song WHERE id = ${songId}` as { scale_root: number; scale_name: string; tempo: number }[];
    return {
      songId, partId: claimed.id, track: claimed.track as TrackName, inst: claimed.inst,
      scaleRoot: song.scale_root, scaleName: song.scale_name, tempo: song.tempo,
    };
  }

  // Fallback: nová skladba + claim libovolného slotu
  const song = await createSong(sql);
  const [p] = await sql`UPDATE mv4_part SET status='claimed', session_token=${token}, claimed_at=NOW() WHERE song_id=${song.id} AND track='melody' RETURNING id, track, inst` as { id: number; track: string; inst: string }[];
  return { songId: song.id, partId: p.id, track: p.track as TrackName, inst: p.inst, scaleRoot: song.scale_root, scaleName: song.scale_name, tempo: song.tempo };
}

export async function submitPart(partId: number, token: string, data: PartData, email: string | null): Promise<{ ok: boolean; songId?: number; complete?: boolean; error?: string }> {
  const sql = getDb();
  await ensureSchema(sql);

  const cleanEmail = email && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim()) ? email.trim() : null;

  const [row] = await sql`
    UPDATE mv4_part SET status = 'done', events = ${JSON.stringify(data)}::jsonb, email = ${cleanEmail}
    WHERE id = ${partId} AND session_token = ${token} AND status = 'claimed'
    RETURNING song_id
  ` as { song_id: number }[];
  if (!row) return { ok: false, error: "Část už nelze odeslat (vypršela nebo byla odeslána)." };

  const [{ c }] = await sql`SELECT COUNT(*)::int AS c FROM mv4_part WHERE song_id = ${row.song_id} AND status = 'done'` as { c: number }[];
  const complete = c >= TRACKS.length;
  if (complete) await sql`UPDATE mv4_song SET status = 'done' WHERE id = ${row.song_id}`;

  return { ok: true, songId: row.song_id, complete };
}

export async function getSong(id: number): Promise<SongDetail | null> {
  const sql = getDb();
  await ensureSchema(sql);
  const [song] = await sql`SELECT * FROM mv4_song WHERE id = ${id}` as SongRow[];
  if (!song) return null;
  const partRows = await sql`SELECT id, song_id, track, inst, status, events FROM mv4_part WHERE song_id = ${id}` as PartRow[];
  const parts: SongPart[] = partRows.map((p) => ({ track: p.track as TrackName, inst: p.inst, data: p.events ?? emptyPartData(), done: p.status === "done" }));
  const complete = song.status === "done" || parts.filter((p) => p.done).length >= TRACKS.length;
  return { id: song.id, scaleRoot: song.scale_root, scaleName: song.scale_name, tempo: song.tempo, complete, parts };
}

export async function getFinishedSongs(): Promise<FinishedItem[]> {
  const sql = getDb();
  await ensureSchema(sql);
  const rows = await sql`SELECT id, scale_name, tempo, created_at FROM mv4_song WHERE status = 'done' ORDER BY id DESC LIMIT 10` as { id: number; scale_name: string; tempo: number; created_at: string }[];
  return rows.map((r) => ({ id: r.id, scaleName: r.scale_name, tempo: r.tempo, createdAt: r.created_at }));
}
