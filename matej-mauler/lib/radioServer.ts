import { getDb } from "./db";
import { genSong, randomMutate, toggleNote, type SongState, type DrumId, type MelodicId } from "./radio";

type Sql = ReturnType<typeof getDb>;

export const SHARED_ROUND_SEC = 12;

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

type StateRow = { state: SongState; round_no: number; round_start: string };

async function getRow(sql: Sql): Promise<StateRow> {
  const [row] = await sql`SELECT state, round_no, round_start FROM radio_state WHERE id = 1` as StateRow[];
  if (row) return row;
  const fresh = genSong();
  await sql`INSERT INTO radio_state (id, state, round_no, round_start) VALUES (1, ${JSON.stringify(fresh)}::jsonb, 0, NOW()) ON CONFLICT (id) DO NOTHING`;
  const [r2] = await sql`SELECT state, round_no, round_start FROM radio_state WHERE id = 1` as StateRow[];
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

export type SharedState = {
  state: SongState; roundNo: number; deadline: string; roundSec: number;
  votes: { cell: string; count: number }[];
};

export async function getSharedState(): Promise<SharedState> {
  const sql = getDb();
  await ensureSchema(sql);
  let row = await getRow(sql);

  let guard = 0;
  while (new Date(row.round_start).getTime() + SHARED_ROUND_SEC * 1000 <= Date.now() && guard++ < 4) {
    const tally = await sql`SELECT cell, COUNT(*)::int AS c FROM radio_vote WHERE round_no = ${row.round_no} GROUP BY cell ORDER BY c DESC LIMIT 1` as { cell: string; c: number }[];
    const state: SongState = JSON.parse(JSON.stringify(row.state));
    if (tally.length > 0) applyCell(state, tally[0].cell);
    else { const m = randomMutate(state); Object.assign(state, m.state); }
    await sql`UPDATE radio_state SET state = ${JSON.stringify(state)}::jsonb, round_no = ${row.round_no + 1}, round_start = NOW() WHERE id = 1`;
    row = await getRow(sql);
  }

  const votes = await sql`SELECT cell, COUNT(*)::int AS count FROM radio_vote WHERE round_no = ${row.round_no} GROUP BY cell` as { cell: string; count: number }[];
  return {
    state: row.state, roundNo: row.round_no,
    deadline: new Date(new Date(row.round_start).getTime() + SHARED_ROUND_SEC * 1000).toISOString(),
    roundSec: SHARED_ROUND_SEC, votes,
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
