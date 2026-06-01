import { getDb } from "./db";
import {
  STEPS, SCALE_NAMES, currentPhase, optionsFor,
  type MusicState, type SongState, type Ev, type TrackName, type Phase, type FinishedSong,
} from "./music";

type Sql = ReturnType<typeof getDb>;

async function ensureSchema(sql: Sql) {
  await sql`CREATE TABLE IF NOT EXISTS mv2_song (
    id SERIAL PRIMARY KEY,
    scale_root INT NOT NULL, scale_name TEXT NOT NULL, tempo INT NOT NULL,
    melody_inst TEXT, bass_inst TEXT, pluck_inst TEXT,
    done BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`;
  await sql`CREATE TABLE IF NOT EXISTS mv2_event (
    id SERIAL PRIMARY KEY,
    song_id INT NOT NULL, track TEXT NOT NULL, position INT NOT NULL,
    type TEXT NOT NULL, midi INT, combo TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(song_id, track, position)
  )`;
  await sql`CREATE TABLE IF NOT EXISTS mv2_finished (
    id SERIAL PRIMARY KEY, song_id INT NOT NULL,
    scale_root INT NOT NULL, scale_name TEXT NOT NULL, tempo INT NOT NULL,
    melody_inst TEXT NOT NULL, bass_inst TEXT NOT NULL, pluck_inst TEXT NOT NULL,
    events JSONB NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`;
}

type SongRow = { id: number; scale_root: number; scale_name: string; tempo: number; melody_inst: string | null; bass_inst: string | null; pluck_inst: string | null; done: boolean };
type EvRow = { track: string; position: number; type: string; midi: number | null; combo: string | null };

async function createSong(sql: Sql): Promise<SongRow> {
  const root = 55 + Math.floor(Math.random() * 8);
  const scale = SCALE_NAMES[Math.floor(Math.random() * SCALE_NAMES.length)];
  const tempo = 92 + Math.floor(Math.random() * 28);
  const [row] = await sql`INSERT INTO mv2_song (scale_root, scale_name, tempo) VALUES (${root}, ${scale}, ${tempo}) RETURNING *` as SongRow[];
  return row;
}
async function getActiveSong(sql: Sql): Promise<SongRow> {
  const [row] = await sql`SELECT * FROM mv2_song WHERE done = FALSE ORDER BY id DESC LIMIT 1` as SongRow[];
  return row ?? (await createSong(sql));
}
async function getEvents(sql: Sql, songId: number): Promise<EvRow[]> {
  return (await sql`SELECT track, position, type, midi, combo FROM mv2_event WHERE song_id = ${songId} ORDER BY track, position`) as EvRow[];
}

function buildSongState(song: SongRow, evs: EvRow[]): SongState {
  const tracks: Record<TrackName, Ev[]> = { melody: [], bass: [], pluck: [], drums: [] };
  for (const e of evs) {
    const tr = e.track as TrackName;
    if (tracks[tr]) tracks[tr].push({ track: tr, position: e.position, type: e.type as Ev["type"], midi: e.midi, combo: e.combo });
  }
  (Object.keys(tracks) as TrackName[]).forEach((k) => tracks[k].sort((a, b) => a.position - b.position));
  return {
    id: song.id, scaleRoot: song.scale_root, scaleName: song.scale_name, tempo: song.tempo,
    melodyInst: song.melody_inst, bassInst: song.bass_inst, pluckInst: song.pluck_inst, tracks,
  };
}

async function getFinished(sql: Sql): Promise<FinishedSong[]> {
  const rows = await sql`
    SELECT id, scale_root, scale_name, tempo, melody_inst, bass_inst, pluck_inst, events, created_at
    FROM mv2_finished ORDER BY id DESC LIMIT 8
  ` as { id: number; scale_root: number; scale_name: string; tempo: number; melody_inst: string; bass_inst: string; pluck_inst: string; events: Ev[]; created_at: string }[];
  return rows.map((f) => {
    const tracks: Record<TrackName, Ev[]> = { melody: [], bass: [], pluck: [], drums: [] };
    for (const e of f.events) if (tracks[e.track]) tracks[e.track].push(e);
    return { id: f.id, scaleRoot: f.scale_root, scaleName: f.scale_name, tempo: f.tempo, melodyInst: f.melody_inst, bassInst: f.bass_inst, pluckInst: f.pluck_inst, tracks, createdAt: f.created_at };
  });
}

async function assembleState(sql: Sql, song: SongRow): Promise<MusicState> {
  const evs = await getEvents(sql, song.id);
  const songState = buildSongState(song, evs);
  const { phase, stepIndex } = currentPhase(songState);
  const options = phase === "done" ? [] : optionsFor(songState, phase, stepIndex);
  const finished = await getFinished(sql);
  return { song: songState, phase, stepIndex, options, finished };
}

export async function getMusicState(): Promise<MusicState> {
  const sql = getDb();
  await ensureSchema(sql);
  const song = await getActiveSong(sql);
  return assembleState(sql, song);
}

async function archiveAndClose(sql: Sql, song: SongRow) {
  const evs = await getEvents(sql, song.id);
  const [fresh] = await sql`SELECT * FROM mv2_song WHERE id = ${song.id}` as SongRow[];
  await sql`
    INSERT INTO mv2_finished (song_id, scale_root, scale_name, tempo, melody_inst, bass_inst, pluck_inst, events)
    VALUES (${song.id}, ${fresh.scale_root}, ${fresh.scale_name}, ${fresh.tempo},
            ${fresh.melody_inst ?? "flute"}, ${fresh.bass_inst ?? "sub"}, ${fresh.pluck_inst ?? "guitar"},
            ${JSON.stringify(evs.map((e) => ({ track: e.track, position: e.position, type: e.type, midi: e.midi, combo: e.combo })))}::jsonb)
  `;
  await sql`UPDATE mv2_song SET done = TRUE WHERE id = ${song.id}`;
}

/** First-click: ověř krok, ulož volbu, vrať čerstvý stav. */
export async function commitChoice(songId: number, phase: Phase, stepIndex: number, optionId: string): Promise<MusicState> {
  const sql = getDb();
  await ensureSchema(sql);

  let song = await getActiveSong(sql);
  // Pokud klient hlasoval pro starší song, jen vrať aktuální stav.
  if (song.id !== songId) return assembleState(sql, song);

  const songState = buildSongState(song, await getEvents(sql, song.id));
  const cur = currentPhase(songState);
  // Někdo byl rychlejší / krok už proběhl → vrať aktuální stav.
  if (cur.phase !== phase || cur.stepIndex !== stepIndex) return assembleState(sql, song);

  const opts = optionsFor(songState, phase, stepIndex);
  const opt = opts.find((o) => o.id === optionId);
  if (!opt) return assembleState(sql, song);

  if (phase === "melody_inst") {
    await sql`UPDATE mv2_song SET melody_inst = ${opt.payload.inst} WHERE id = ${song.id} AND melody_inst IS NULL`;
  } else if (phase === "bass_inst") {
    await sql`UPDATE mv2_song SET bass_inst = ${opt.payload.inst} WHERE id = ${song.id} AND bass_inst IS NULL`;
  } else if (phase === "pluck_inst") {
    await sql`UPDATE mv2_song SET pluck_inst = ${opt.payload.inst} WHERE id = ${song.id} AND pluck_inst IS NULL`;
  } else if (phase === "drums") {
    await sql`INSERT INTO mv2_event (song_id, track, position, type, combo) VALUES (${song.id}, 'drums', ${stepIndex}, 'drum', ${opt.payload.combo}) ON CONFLICT (song_id, track, position) DO NOTHING`;
    if (stepIndex + 1 >= STEPS) await archiveAndClose(sql, song);
  } else {
    const midi = opt.payload.midi ?? null;
    const type = midi === null ? "rest" : "note";
    await sql`INSERT INTO mv2_event (song_id, track, position, type, midi) VALUES (${song.id}, ${phase}, ${stepIndex}, ${type}, ${midi}) ON CONFLICT (song_id, track, position) DO NOTHING`;
  }

  song = await getActiveSong(sql); // může být nový song po archivaci
  return assembleState(sql, song);
}
