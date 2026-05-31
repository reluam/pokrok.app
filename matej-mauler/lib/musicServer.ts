import { getDb } from "./db";
import {
  MELODY_STEPS, ROUND_SECONDS, SCALE_NAMES,
  generateNoteOptions, optionsForInstrument, optionsForDrums,
  type MusicState, type Option, type NoteEvent, type SongState, type RoundState,
} from "./music";

type Sql = ReturnType<typeof getDb>;

/* ── Schéma ─────────────────────────────────────────────────────── */

async function ensureSchema(sql: Sql) {
  await sql`CREATE TABLE IF NOT EXISTS mv_song (
    id SERIAL PRIMARY KEY,
    scale_root INT NOT NULL,
    scale_name TEXT NOT NULL,
    tempo INT NOT NULL,
    status TEXT NOT NULL DEFAULT 'melody',
    instrument TEXT,
    drums TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`;
  await sql`CREATE TABLE IF NOT EXISTS mv_event (
    id SERIAL PRIMARY KEY,
    song_id INT NOT NULL,
    position INT NOT NULL,
    type TEXT NOT NULL,
    midi INT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`;
  await sql`CREATE TABLE IF NOT EXISTS mv_round (
    id SERIAL PRIMARY KEY,
    song_id INT NOT NULL,
    phase TEXT NOT NULL,
    step_index INT NOT NULL,
    options JSONB NOT NULL,
    deadline TIMESTAMPTZ NOT NULL,
    resolved BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`;
  await sql`CREATE TABLE IF NOT EXISTS mv_vote (
    id SERIAL PRIMARY KEY,
    round_id INT NOT NULL,
    option_id TEXT NOT NULL,
    ip_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(round_id, ip_hash)
  )`;
  await sql`CREATE TABLE IF NOT EXISTS mv_finished (
    id SERIAL PRIMARY KEY,
    song_id INT NOT NULL,
    scale_root INT NOT NULL,
    scale_name TEXT NOT NULL,
    tempo INT NOT NULL,
    instrument TEXT NOT NULL,
    drums TEXT NOT NULL,
    events JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`;
}

/* ── Helpery ────────────────────────────────────────────────────── */

type SongRow = { id: number; scale_root: number; scale_name: string; tempo: number; status: string; instrument: string | null; drums: string | null };
type RoundRow = { id: number; song_id: number; phase: string; step_index: number; options: Option[]; deadline: string; resolved: boolean };
type EventRow = { position: number; type: string; midi: number | null };

async function getEvents(sql: Sql, songId: number): Promise<EventRow[]> {
  return (await sql`SELECT position, type, midi FROM mv_event WHERE song_id = ${songId} ORDER BY position ASC`) as EventRow[];
}

async function createSong(sql: Sql): Promise<SongRow> {
  const root = 55 + Math.floor(Math.random() * 8);
  const scale = SCALE_NAMES[Math.floor(Math.random() * SCALE_NAMES.length)];
  const tempo = 88 + Math.floor(Math.random() * 32);
  const [row] = await sql`
    INSERT INTO mv_song (scale_root, scale_name, tempo, status)
    VALUES (${root}, ${scale}, ${tempo}, 'melody') RETURNING *
  ` as SongRow[];
  return row;
}

async function getActiveSong(sql: Sql): Promise<SongRow> {
  const [row] = await sql`SELECT * FROM mv_song WHERE status <> 'done' ORDER BY id DESC LIMIT 1` as SongRow[];
  return row ?? (await createSong(sql));
}

async function lastNoteMidi(events: EventRow[]): Promise<number | null> {
  for (let i = events.length - 1; i >= 0; i--) {
    if (events[i].type === "note" && events[i].midi != null) return events[i].midi;
  }
  return null;
}

async function createRound(sql: Sql, song: SongRow): Promise<RoundRow> {
  const events = await getEvents(sql, song.id);
  let phase: string;
  let stepIndex = 0;
  let options: Option[];

  if (song.status === "melody") {
    stepIndex = events.length;
    if (stepIndex >= MELODY_STEPS) {
      await sql`UPDATE mv_song SET status = 'instrument' WHERE id = ${song.id}`;
      song.status = "instrument";
      phase = "instrument";
      options = optionsForInstrument();
    } else {
      phase = "note";
      const prev = await lastNoteMidi(events);
      options = generateNoteOptions(song.scale_root, song.scale_name, prev, Math.random);
    }
  } else if (song.status === "instrument") {
    phase = "instrument";
    options = optionsForInstrument();
  } else {
    phase = "drums";
    options = optionsForDrums();
  }

  const [row] = await sql`
    INSERT INTO mv_round (song_id, phase, step_index, options, deadline)
    VALUES (${song.id}, ${phase}, ${stepIndex}, ${JSON.stringify(options)}::jsonb, NOW() + (${ROUND_SECONDS} || ' seconds')::interval)
    RETURNING id, song_id, phase, step_index, options, deadline, resolved
  ` as RoundRow[];
  return row;
}

async function getOpenRound(sql: Sql, songId: number): Promise<RoundRow | null> {
  const [row] = await sql`
    SELECT id, song_id, phase, step_index, options, deadline, resolved
    FROM mv_round WHERE song_id = ${songId} AND resolved = FALSE ORDER BY id DESC LIMIT 1
  ` as RoundRow[];
  return row ?? null;
}

async function tally(sql: Sql, roundId: number): Promise<Record<string, number>> {
  const rows = await sql`SELECT option_id, COUNT(*)::int AS c FROM mv_vote WHERE round_id = ${roundId} GROUP BY option_id` as { option_id: string; c: number }[];
  const counts: Record<string, number> = {};
  for (const r of rows) counts[r.option_id] = r.c;
  return counts;
}

async function resolveRound(sql: Sql, round: RoundRow, song: SongRow) {
  const counts = await tally(sql, round.id);
  let winner: Option;
  const entries = Object.entries(counts);
  if (entries.length === 0) {
    winner = round.options[Math.floor(Math.random() * round.options.length)];
  } else {
    const max = Math.max(...entries.map(([, c]) => c));
    const top = entries.filter(([, c]) => c === max).map(([id]) => id);
    const winId = top[Math.floor(Math.random() * top.length)];
    winner = round.options.find((o) => o.id === winId) ?? round.options[0];
  }

  if (round.phase === "note") {
    const midi = winner.payload.midi ?? null;
    const type = midi === null ? "rest" : "note";
    await sql`INSERT INTO mv_event (song_id, position, type, midi) VALUES (${song.id}, ${round.step_index}, ${type}, ${midi})`;
    if (round.step_index + 1 >= MELODY_STEPS) {
      await sql`UPDATE mv_song SET status = 'instrument' WHERE id = ${song.id}`;
    }
  } else if (round.phase === "instrument") {
    await sql`UPDATE mv_song SET instrument = ${winner.payload.wave ?? "sine"}, status = 'drums' WHERE id = ${song.id}`;
  } else if (round.phase === "drums") {
    const pattern = winner.payload.pattern ?? "none";
    const events = await getEvents(sql, song.id);
    const [fresh] = await sql`SELECT * FROM mv_song WHERE id = ${song.id}` as SongRow[];
    await sql`
      INSERT INTO mv_finished (song_id, scale_root, scale_name, tempo, instrument, drums, events)
      VALUES (${song.id}, ${fresh.scale_root}, ${fresh.scale_name}, ${fresh.tempo}, ${fresh.instrument ?? "sine"}, ${pattern}, ${JSON.stringify(events.map((e) => ({ type: e.type, midi: e.midi })))}::jsonb)
    `;
    await sql`UPDATE mv_song SET drums = ${pattern}, status = 'done' WHERE id = ${song.id}`;
  }

  await sql`UPDATE mv_round SET resolved = TRUE WHERE id = ${round.id} AND resolved = FALSE`;
}

/* ── Veřejné API ────────────────────────────────────────────────── */

function toSongState(song: SongRow, events: EventRow[]): SongState {
  return {
    id: song.id, scaleRoot: song.scale_root, scaleName: song.scale_name,
    tempo: song.tempo, status: song.status as SongState["status"],
    instrument: (song.instrument as OscillatorType) ?? null, drums: song.drums,
    events: events.map((e) => ({ type: e.type as "note" | "rest", midi: e.midi })),
  };
}

export async function getMusicState(): Promise<MusicState> {
  const sql = getDb();
  await ensureSchema(sql);

  let song = await getActiveSong(sql);
  let round = (await getOpenRound(sql, song.id)) ?? (await createRound(sql, song));

  let guard = 0;
  while (round && new Date(round.deadline).getTime() <= Date.now() && guard++ < 6) {
    await resolveRound(sql, round, song);
    song = await getActiveSong(sql);
    round = (await getOpenRound(sql, song.id)) ?? (await createRound(sql, song));
  }

  const events = await getEvents(sql, song.id);
  const counts = await tally(sql, round.id);

  const finishedRows = await sql`
    SELECT id, scale_root, scale_name, tempo, instrument, drums, events, created_at
    FROM mv_finished ORDER BY id DESC LIMIT 6
  ` as { id: number; scale_root: number; scale_name: string; tempo: number; instrument: string; drums: string; events: NoteEvent[]; created_at: string }[];

  const roundState: RoundState = {
    id: round.id, phase: round.phase as RoundState["phase"], stepIndex: round.step_index,
    options: round.options, deadline: round.deadline, counts,
  };

  return {
    song: toSongState(song, events),
    round: roundState,
    finished: finishedRows.map((f) => ({
      id: f.id, scaleRoot: f.scale_root, scaleName: f.scale_name, tempo: f.tempo,
      instrument: f.instrument as OscillatorType, drums: f.drums, events: f.events, createdAt: f.created_at,
    })),
    serverNow: new Date().toISOString(),
  };
}

export async function castMusicVote(roundId: number, optionId: string, ipHash: string): Promise<{ ok: boolean; error?: string }> {
  const sql = getDb();
  await ensureSchema(sql);

  const [round] = await sql`SELECT id, deadline, resolved FROM mv_round WHERE id = ${roundId}` as { id: number; deadline: string; resolved: boolean }[];
  if (!round || round.resolved || new Date(round.deadline).getTime() <= Date.now()) {
    return { ok: false, error: "Kolo už skončilo." };
  }
  try {
    await sql`INSERT INTO mv_vote (round_id, option_id, ip_hash) VALUES (${roundId}, ${optionId}, ${ipHash})`;
    return { ok: true };
  } catch (e: unknown) {
    const msg = String(e);
    if (msg.includes("unique") || msg.includes("duplicate")) return { ok: false, error: "Už jsi v tomto kole hlasoval/a." };
    return { ok: false, error: msg };
  }
}
