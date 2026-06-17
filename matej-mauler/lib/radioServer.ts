import { getDb } from "./db";
import { genSong, applyOption, roundDurationMs, keyName, summarizeChange, OPTIONS, type SongState, type OptionId } from "./radioComposer";

type Sql = ReturnType<typeof getDb>;

/* Rádio doopravdy běží na serveru: každé kolo (~15 s, celé takty) má v DB
   stav skladby + absolutní start; audio renderuje /api/radio/segment.
   Hlasuje se 1× za kolo, uzávěrka VOTE_CLOSE_MS před koncem (kvůli
   prefetchi dalšího segmentu) a vítěz se projeví od 1. doby dalšího kola. */

export const VOTE_CLOSE_MS = 4000;

let schemaReady = false;
async function ensureSchema(sql: Sql) {
  if (schemaReady) return;
  await sql.transaction([
    sql`CREATE TABLE IF NOT EXISTS radio_rounds (
      round_no BIGINT PRIMARY KEY,
      state JSONB NOT NULL,
      started_at TIMESTAMPTZ NOT NULL,
      duration_ms INT NOT NULL
    )`,
    sql`CREATE TABLE IF NOT EXISTS radio_round_votes (
      round_no BIGINT NOT NULL,
      option_id TEXT NOT NULL,
      ip_hash TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (round_no, ip_hash)
    )`,
    // log všech změn — na rozdíl od radio_rounds se NEUKLÍZÍ (scroll až k začátku rádia)
    sql`CREATE TABLE IF NOT EXISTS radio_log (
      round_no BIGINT PRIMARY KEY,
      aired_at TIMESTAMPTZ NOT NULL,
      opt TEXT NOT NULL,
      tempo INT, genre TEXT, key_name TEXT, voice TEXT,
      mute JSONB, votes INT NOT NULL DEFAULT 0
    )`,
  ]);
  schemaReady = true;
}

/** Zapíše jednu změnu do logu (idempotentně podle round_no). */
async function logChange(sql: Sql, roundNo: number, airedAtIso: string, prev: SongState, next: SongState, opt: OptionId | null | "start", votes: number) {
  const c = summarizeChange(prev, next, opt);
  await sql`INSERT INTO radio_log (round_no, aired_at, opt, tempo, genre, key_name, voice, mute, votes)
    VALUES (${roundNo}, ${airedAtIso}, ${c.opt}, ${c.tempo}, ${c.genre}, ${c.key}, ${c.voice}, ${c.mute ? JSON.stringify(c.mute) : null}::jsonb, ${votes})
    ON CONFLICT (round_no) DO NOTHING`;
}

async function voteCount(sql: Sql, roundNo: number): Promise<number> {
  const [r] = await sql`SELECT COUNT(*)::int AS n FROM radio_round_votes WHERE round_no = ${roundNo}` as { n: number }[];
  return r?.n ?? 0;
}

export type RoundRow = { round_no: number; state: SongState; started_at: string; duration_ms: number };

const rowEnd = (r: RoundRow) => new Date(r.started_at).getTime() + r.duration_ms;

async function lastRound(sql: Sql): Promise<RoundRow | null> {
  const [r] = await sql`SELECT round_no::int AS round_no, state, started_at, duration_ms FROM radio_rounds ORDER BY round_no DESC LIMIT 1` as RoundRow[];
  return r ?? null;
}

async function winnerOf(sql: Sql, roundNo: number): Promise<OptionId | null> {
  const [t] = await sql`SELECT option_id, COUNT(*)::int AS c FROM radio_round_votes WHERE round_no = ${roundNo} GROUP BY option_id ORDER BY c DESC, option_id ASC LIMIT 1` as { option_id: string; c: number }[];
  return (t?.option_id as OptionId) ?? null;
}

/** Zajistí kola až do teď + prefetch okna. Po delší pauze se rádio znovu ukotví na „teď“. */
export async function ensureRounds(): Promise<{ current: RoundRow; next: RoundRow | null }> {
  const sql = getDb();
  await ensureSchema(sql);
  const now = Date.now();
  let last = await lastRound(sql);

  // start od nuly, nebo restart po pauze — kotva na teď.
  // Po DELŠÍ pauze (>5 min, nikdo neposlouchal) naladíme úplně novou skladbu
  // (jako rádio, co mezitím hrálo dál) — ne jen jeden drift krok.
  if (!last || rowEnd(last) < now - 2000) {
    const roundNo = (last?.round_no ?? -1) + 1;
    const prevState = last?.state ?? null;
    const gapMs = last ? now - rowEnd(last) : Infinity;
    const fresh = !prevState || gapMs > 5 * 60 * 1000;
    const state = fresh
      ? genSong(Math.floor(now / 60000) * 7 + roundNo) // čerstvá skladba, jiná při každém naladění
      : applyOption(prevState, null, roundNo * 31 + 7);
    const started = new Date(now + 1500);
    const startedIso = started.toISOString();
    await sql`INSERT INTO radio_rounds (round_no, state, started_at, duration_ms) VALUES (${roundNo}, ${JSON.stringify(state)}::jsonb, ${startedIso}, ${roundDurationMs(state)}) ON CONFLICT (round_no) DO NOTHING`;
    await logChange(sql, roundNo, startedIso, prevState ?? state, state, fresh ? "start" : null, 0);
    last = await lastRound(sql);
  }

  // řetěz: dokud konec posledního kola nepokrývá teď + prefetch okno
  let guard = 0;
  while (last && rowEnd(last) - now < VOTE_CLOSE_MS + 1500 && guard++ < 3) {
    const winner = await winnerOf(sql, last.round_no);
    const votes = await voteCount(sql, last.round_no);
    const newRound = last.round_no + 1;
    const state = applyOption(last.state, winner, newRound * 31 + 7);
    const started = new Date(rowEnd(last));
    const startedIso = started.toISOString();
    await sql`INSERT INTO radio_rounds (round_no, state, started_at, duration_ms) VALUES (${newRound}, ${JSON.stringify(state)}::jsonb, ${startedIso}, ${roundDurationMs(state)}) ON CONFLICT (round_no) DO NOTHING`;
    await logChange(sql, newRound, startedIso, last.state, state, winner, votes);
    last = await lastRound(sql);
  }

  // úklid: stará kola a hlasy
  if (last) {
    await sql`DELETE FROM radio_rounds WHERE round_no < ${last.round_no - 6}`;
    await sql`DELETE FROM radio_round_votes WHERE round_no < ${last.round_no - 6}`;
  }

  const rows = await sql`SELECT round_no::int AS round_no, state, started_at, duration_ms FROM radio_rounds ORDER BY round_no DESC LIMIT 3` as RoundRow[];
  const current = rows.find((r) => new Date(r.started_at).getTime() <= now && rowEnd(r) > now) ?? rows[rows.length - 1];
  const next = rows.find((r) => r.round_no === current.round_no + 1) ?? null;
  return { current, next };
}

export async function getRound(roundNo: number): Promise<RoundRow | null> {
  const sql = getDb();
  await ensureSchema(sql);
  const [r] = await sql`SELECT round_no::int AS round_no, state, started_at, duration_ms FROM radio_rounds WHERE round_no = ${roundNo}` as RoundRow[];
  return r ?? null;
}

export type NowPayload = {
  serverNow: number;
  current: { round: number; startedAt: number; durationMs: number; tempo: number; key: string; genre: string; mutes: Record<string, boolean> };
  next: { round: number; startedAt: number; durationMs: number } | null;
  voting: { round: number; closesAt: number; counts: Record<string, number> };
};

export async function getNow(): Promise<NowPayload> {
  const sql = getDb();
  const { current, next } = await ensureRounds();
  const votes = await sql`SELECT option_id, COUNT(*)::int AS count FROM radio_round_votes WHERE round_no = ${current.round_no} GROUP BY option_id` as { option_id: string; count: number }[];
  const counts: Record<string, number> = {};
  for (const o of OPTIONS) counts[o.id] = 0;
  for (const v of votes) counts[v.option_id] = v.count;
  return {
    serverNow: Date.now(),
    current: {
      round: current.round_no, startedAt: new Date(current.started_at).getTime(), durationMs: current.duration_ms,
      tempo: current.state.tempo, key: keyName(current.state), genre: current.state.genre,
      mutes: { ...(current.state.mutes ?? {}) } as Record<string, boolean>,
    },
    next: next ? { round: next.round_no, startedAt: new Date(next.started_at).getTime(), durationMs: next.duration_ms } : null,
    voting: { round: current.round_no, closesAt: rowEnd(current) - VOTE_CLOSE_MS, counts },
  };
}

export type LogEntry = {
  round: number; airedAt: number; opt: string; tempo: number; genre: string; key: string;
  voice: string; mute: { layer: string; on: boolean } | null; votes: number;
};
type LogRow = { round_no: number; aired_at: string; opt: string; tempo: number; genre: string; key_name: string; voice: string; mute: { layer: string; on: boolean } | null; votes: number };
const toEntry = (r: LogRow): LogEntry => ({
  round: r.round_no, airedAt: new Date(r.aired_at).getTime(), opt: r.opt, tempo: r.tempo,
  genre: r.genre, key: r.key_name, voice: r.voice, mute: r.mute, votes: r.votes,
});

/** Log změn rádia, nejnovější první. `before`/`after` = stránkování podle round_no. */
export async function getLog(opts: { before?: number; after?: number; limit?: number }): Promise<{ entries: LogEntry[]; hasMore: boolean }> {
  const sql = getDb();
  await ensureSchema(sql);
  const limit = Math.min(60, Math.max(1, opts.limit ?? 30));
  let rows: LogRow[];
  if (opts.after !== undefined) {
    rows = await sql`SELECT round_no::int AS round_no, aired_at, opt, tempo, genre, key_name, voice, mute, votes FROM radio_log WHERE round_no > ${opts.after} ORDER BY round_no DESC LIMIT ${limit + 1}` as LogRow[];
  } else if (opts.before !== undefined) {
    rows = await sql`SELECT round_no::int AS round_no, aired_at, opt, tempo, genre, key_name, voice, mute, votes FROM radio_log WHERE round_no < ${opts.before} ORDER BY round_no DESC LIMIT ${limit + 1}` as LogRow[];
  } else {
    rows = await sql`SELECT round_no::int AS round_no, aired_at, opt, tempo, genre, key_name, voice, mute, votes FROM radio_log ORDER BY round_no DESC LIMIT ${limit + 1}` as LogRow[];
  }
  const hasMore = rows.length > limit;
  if (hasMore) rows.pop();
  return { entries: rows.map(toEntry), hasMore };
}

const VALID = new Set(OPTIONS.map((o) => o.id as string));

export async function voteOption(roundNo: number, option: string, ipHash: string): Promise<{ ok: boolean }> {
  if (!VALID.has(option)) return { ok: false };
  const sql = getDb();
  await ensureSchema(sql);
  const round = await getRound(roundNo);
  if (!round || rowEnd(round) - VOTE_CLOSE_MS <= Date.now()) return { ok: false }; // po uzávěrce
  try {
    // jeden hlas za kolo na člověka (PK round_no+ip_hash)
    await sql`INSERT INTO radio_round_votes (round_no, option_id, ip_hash) VALUES (${roundNo}, ${option}, ${ipHash}) ON CONFLICT (round_no, ip_hash) DO NOTHING`;
    return { ok: true };
  } catch { return { ok: false }; }
}
