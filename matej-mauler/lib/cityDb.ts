import { getDb } from "./db";

type Sql = ReturnType<typeof getDb>;

let ready = false;

/**
 * Off-chain cache/index for Spaghetti City. The blockchain is the source of
 * truth; these tables make the UI fast (and survive RPC hiccups). Filled by the
 * onboarding routes and the event indexer.
 */
async function ensure(sql: Sql) {
  if (ready) return;
  await sql`CREATE TABLE IF NOT EXISTS city_citizens (
    address TEXT PRIMARY KEY,
    token_id BIGINT,
    handle TEXT,
    tx_hash TEXT,
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`;
  await sql`CREATE TABLE IF NOT EXISTS city_tx_log (
    tx_hash TEXT NOT NULL,
    log_index INT NOT NULL DEFAULT 0,
    address TEXT,
    kind TEXT NOT NULL,
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    block BIGINT,
    ts TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (tx_hash, log_index)
  )`;
  ready = true;
}

export type CitizenRow = {
  address: string;
  token_id: number | null;
  handle: string | null;
  tx_hash: string | null;
  joined_at: string;
};

export async function recordCitizen(c: {
  address: string;
  tokenId: number | bigint;
  handle: string;
  txHash: string;
}): Promise<void> {
  const sql = getDb();
  await ensure(sql);
  await sql`INSERT INTO city_citizens (address, token_id, handle, tx_hash)
    VALUES (${c.address.toLowerCase()}, ${Number(c.tokenId)}, ${c.handle}, ${c.txHash})
    ON CONFLICT (address) DO UPDATE SET token_id = EXCLUDED.token_id, handle = EXCLUDED.handle, tx_hash = EXCLUDED.tx_hash`;
}

export async function getCitizen(address: string): Promise<CitizenRow | null> {
  const sql = getDb();
  await ensure(sql);
  const rows = (await sql`SELECT address, token_id, handle, tx_hash, joined_at::text
    FROM city_citizens WHERE address = ${address.toLowerCase()}`) as CitizenRow[];
  return rows[0] ?? null;
}

export async function countCitizens(): Promise<number> {
  const sql = getDb();
  await ensure(sql);
  const rows = (await sql`SELECT COUNT(*)::int AS n FROM city_citizens`) as { n: number }[];
  return rows[0]?.n ?? 0;
}

/** Append a tx to the activity log (used by onboarding + the event indexer). */
export async function logTx(t: {
  txHash: string;
  logIndex?: number;
  address?: string | null;
  kind: string;
  payload?: Record<string, unknown>;
  block?: number | bigint | null;
}): Promise<void> {
  const sql = getDb();
  await ensure(sql);
  await sql`INSERT INTO city_tx_log (tx_hash, log_index, address, kind, payload, block)
    VALUES (${t.txHash}, ${t.logIndex ?? 0}, ${t.address?.toLowerCase() ?? null}, ${t.kind},
      ${JSON.stringify(t.payload ?? {})}::jsonb, ${t.block != null ? Number(t.block) : null})
    ON CONFLICT (tx_hash, log_index) DO NOTHING`;
}

export async function recentTx(limit = 30): Promise<
  { tx_hash: string; address: string | null; kind: string; payload: unknown; ts: string }[]
> {
  const sql = getDb();
  await ensure(sql);
  return (await sql`SELECT tx_hash, address, kind, payload, ts::text
    FROM city_tx_log ORDER BY ts DESC LIMIT ${limit}`) as {
    tx_hash: string;
    address: string | null;
    kind: string;
    payload: unknown;
    ts: string;
  }[];
}
