import { getDb } from "./db";
import { genSong, randomMutate, toggleNote, serverRoundSec, SERVER_TEMPO, type SongState, type DrumId, type MelodicId } from "./radio";

type Sql = ReturnType<typeof getDb>;

/* Rádio běží na serveru: kola jsou ukotvená na absolutní čas (epoch),
   takže každý posluchač hraje synchronně jen podle hodin.
   Jedno kolo = jeden průchod mřížkou = 4 bary @ 124 BPM (~7,7 s).
   Stav posouvá líně každý dotaz na /api/radio/state + cron na /api/radio/tick. */

export const ROUND_SEC = serverRoundSec(); // 4 bary
const curRound = () => Math.floor(Date.now() / 1000 / ROUND_SEC);

let schemaReady = false;
async function ensureSchema(sql: Sql) {
  if (schemaReady) return;
  await sql.transaction([
    sql`CREATE TABLE IF NOT EXISTS radio_state (
      id INT PRIMARY KEY DEFAULT 1,
      state JSONB NOT NULL,
      round_no INT NOT NULL DEFAULT 0,
      round_start TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`,
    sql`CREATE TABLE IF NOT EXISTS radio_vote (
      id SERIAL PRIMARY KEY,
      round_no INT NOT NULL,
      cell TEXT NOT NULL,
      ip_hash TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE(round_no, cell, ip_hash)
    )`,
  ]);
  schemaReady = true;
}

type StateRow = { state: SongState; round_no: number };

async function getRow(sql: Sql): Promise<StateRow> {
  const [row] = await sql`SELECT state, round_no FROM radio_state WHERE id = 1` as StateRow[];
  if (row) return row;
  const fresh = genSong(); fresh.tempo = SERVER_TEMPO;
  await sql`INSERT INTO radio_state (id, state, round_no) VALUES (1, ${JSON.stringify(fresh)}::jsonb, ${curRound()}) ON CONFLICT (id) DO NOTHING`;
  const [r2] = await sql`SELECT state, round_no FROM radio_state WHERE id = 1` as StateRow[];
  return r2;
}

function applyCell(state: SongState, cell: string) {
  const p = cell.split(":");
  if (p[0] === "d") {
    const lane = p[1] as DrumId; const step = +p[2];
    if (state.drums[lane]) { state.drums[lane].pattern[step] = !state.drums[lane].pattern[step]; state.drums[lane].muted = false; }
  } else {
    const layer = p[1] as MelodicId; const step = +p[2]; const midi = +p[3];
    if (state[layer]) { state[layer].notes = toggleNote(state[layer].notes, step, midi); state[layer].muted = false; }
  }
}

function mutate(state: SongState) {
  const m = randomMutate(state);
  Object.assign(state, m.state);
  state.tempo = SERVER_TEMPO; // tempo je kotva synchronizace — nikdy se nemění
}

/** Posune rádio do aktuálního kola: poslední kolo rozhodne hlasování, delší výpadek dožene pár mutací. */
export async function advanceIfDue(): Promise<StateRow> {
  const sql = getDb();
  await ensureSchema(sql);
  let row = await getRow(sql);
  const target = curRound();
  if (row.round_no < target) {
    const missed = target - row.round_no;
    const state: SongState = JSON.parse(JSON.stringify(row.state));
    const tally = await sql`SELECT cell, COUNT(*)::int AS c FROM radio_vote WHERE round_no = ${row.round_no} GROUP BY cell ORDER BY c DESC LIMIT 1` as { cell: string; c: number }[];
    if (tally.length > 0) applyCell(state, tally[0].cell);
    else mutate(state);
    for (let i = 1; i < Math.min(missed, 4); i++) mutate(state);
    await sql`UPDATE radio_state SET state = ${JSON.stringify(state)}::jsonb, round_no = ${target}, round_start = NOW() WHERE id = 1 AND round_no = ${row.round_no}`;
    await sql`DELETE FROM radio_vote WHERE round_no < ${target - 2}`; // úklid starých hlasů
    row = await getRow(sql);
  }
  return row;
}

export type SharedState = {
  state: SongState; roundNo: number; deadline: string; roundSec: number;
  votes: { cell: string; count: number }[];
};

export async function getSharedState(): Promise<SharedState> {
  const sql = getDb();
  const row = await advanceIfDue();
  const votes = await sql`SELECT cell, COUNT(*)::int AS count FROM radio_vote WHERE round_no = ${row.round_no} GROUP BY cell` as { cell: string; count: number }[];
  return {
    state: row.state, roundNo: row.round_no,
    deadline: new Date((curRound() + 1) * ROUND_SEC * 1000).toISOString(),
    roundSec: ROUND_SEC, votes,
  };
}

export async function voteCell(roundNo: number, cell: string, ipHash: string): Promise<{ ok: boolean }> {
  const sql = getDb();
  await ensureSchema(sql);
  try {
    await sql`INSERT INTO radio_vote (round_no, cell, ip_hash) VALUES (${roundNo}, ${cell}, ${ipHash}) ON CONFLICT (round_no, cell, ip_hash) DO NOTHING`;
    return { ok: true };
  } catch { return { ok: false }; }
}
