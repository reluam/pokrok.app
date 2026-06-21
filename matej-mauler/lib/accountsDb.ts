import { getDb } from "./db";
import { ALL_BADGES } from "./rewards";
import type { UserStats } from "./rewards/types";

type Sql = ReturnType<typeof getDb>;

export type UserRow = {
  id: string;
  clerk_user_id: string;
  email: string | null;
  display_name: string | null;
  total_xp: number;
  created_at: string;
};

export type ParticipationRow = {
  id: string;
  experiment_slug: string;
  user_id: string | null;
  session_id: string | null;
  payload: unknown;
  insight: unknown;
  created_at: string;
};

export type ProfileBadge = {
  slug: string;
  name: string;
  description: string;
  experimentSlug: string | null;
  awardedAt: string;
  awardContext: unknown;
};

let ready = false;
async function ensure(sql: Sql) {
  if (ready) return;
  await sql`CREATE EXTENSION IF NOT EXISTS pgcrypto`;

  await sql`CREATE TABLE IF NOT EXISTS users (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clerk_user_id TEXT UNIQUE NOT NULL,
    email         TEXT,
    display_name  TEXT,
    total_xp      INTEGER NOT NULL DEFAULT 0,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
  )`;

  await sql`CREATE TABLE IF NOT EXISTS anonymous_sessions (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    merged_into_user_id UUID REFERENCES users(id) ON DELETE SET NULL
  )`;

  await sql`CREATE TABLE IF NOT EXISTS participations (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    experiment_slug TEXT NOT NULL,
    user_id         UUID REFERENCES users(id) ON DELETE CASCADE,
    session_id      UUID REFERENCES anonymous_sessions(id) ON DELETE SET NULL,
    payload         JSONB,
    insight         JSONB,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT participation_owner CHECK (user_id IS NOT NULL OR session_id IS NOT NULL)
  )`;
  await sql`CREATE INDEX IF NOT EXISTS participations_user_idx ON participations(user_id)`;
  await sql`CREATE INDEX IF NOT EXISTS participations_session_idx ON participations(session_id)`;
  await sql`CREATE INDEX IF NOT EXISTS participations_exp_idx ON participations(experiment_slug)`;

  await sql`CREATE TABLE IF NOT EXISTS badges (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug            TEXT UNIQUE NOT NULL,
    experiment_slug TEXT,
    name            TEXT NOT NULL,
    description     TEXT NOT NULL,
    criteria_key    TEXT NOT NULL,
    xp_value        INTEGER NOT NULL DEFAULT 0
  )`;

  await sql`CREATE TABLE IF NOT EXISTS user_badges (
    user_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    badge_id       UUID NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
    experiment_slug TEXT,
    awarded_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    award_context  JSONB,
    PRIMARY KEY (user_id, badge_id)
  )`;

  await sql`CREATE TABLE IF NOT EXISTS xp_events (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    experiment_slug TEXT,
    amount          INTEGER NOT NULL,
    reason          TEXT NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
  )`;
  await sql`CREATE INDEX IF NOT EXISTS xp_events_user_idx ON xp_events(user_id)`;

  // Seed badge catalog from code (single source of truth).
  for (const b of ALL_BADGES) {
    await sql`INSERT INTO badges (slug, experiment_slug, name, description, criteria_key, xp_value)
      VALUES (${b.slug}, ${b.experimentSlug}, ${b.name}, ${b.description}, ${b.criteriaKey}, ${b.xp})
      ON CONFLICT (slug) DO UPDATE SET
        experiment_slug = EXCLUDED.experiment_slug, name = EXCLUDED.name,
        description = EXCLUDED.description, criteria_key = EXCLUDED.criteria_key,
        xp_value = EXCLUDED.xp_value`;
  }

  ready = true;
}

/** Lazy profile sync: create the app-side user row on first authenticated request. */
export async function getOrCreateUser(clerkUserId: string, email?: string | null, displayName?: string | null): Promise<UserRow> {
  const sql = getDb();
  await ensure(sql);
  const rows = (await sql`
    INSERT INTO users (clerk_user_id, email, display_name)
    VALUES (${clerkUserId}, ${email ?? null}, ${displayName ?? null})
    ON CONFLICT (clerk_user_id) DO UPDATE SET
      email = COALESCE(EXCLUDED.email, users.email),
      display_name = COALESCE(EXCLUDED.display_name, users.display_name)
    RETURNING *
  `) as UserRow[];
  return rows[0];
}

export async function getUserByClerkId(clerkUserId: string): Promise<UserRow | null> {
  const sql = getDb();
  await ensure(sql);
  const rows = (await sql`SELECT * FROM users WHERE clerk_user_id = ${clerkUserId}`) as UserRow[];
  return rows[0] ?? null;
}

export async function ensureAnonSession(sessionId: string): Promise<void> {
  const sql = getDb();
  await ensure(sql);
  await sql`INSERT INTO anonymous_sessions (id) VALUES (${sessionId}) ON CONFLICT (id) DO NOTHING`;
}

export async function recordParticipation(p: {
  experimentSlug: string;
  userId?: string | null;
  sessionId?: string | null;
  payload?: unknown;
  insight?: unknown;
}): Promise<ParticipationRow> {
  const sql = getDb();
  await ensure(sql);
  const payload = p.payload != null ? JSON.stringify(p.payload) : null;
  const insight = p.insight != null ? JSON.stringify(p.insight) : null;
  const rows = (await sql`
    INSERT INTO participations (experiment_slug, user_id, session_id, payload, insight)
    VALUES (${p.experimentSlug}, ${p.userId ?? null}, ${p.sessionId ?? null}, ${payload}::jsonb, ${insight}::jsonb)
    RETURNING *
  `) as ParticipationRow[];
  return rows[0];
}

export async function getUserStats(userId: string, experimentSlug: string): Promise<UserStats> {
  const sql = getDb();
  await ensure(sql);
  const rows = (await sql`
    SELECT COUNT(DISTINCT experiment_slug)::int AS distinct_exp,
           (COUNT(*) FILTER (WHERE experiment_slug = ${experimentSlug}))::int AS this_count
    FROM participations WHERE user_id = ${userId}
  `) as { distinct_exp: number; this_count: number }[];
  return {
    distinctExperiments: Number(rows[0]?.distinct_exp ?? 0),
    thisExperimentCount: Number(rows[0]?.this_count ?? 0),
  };
}

export async function getBadgeBySlug(slug: string): Promise<{ id: string; slug: string } | null> {
  const sql = getDb();
  await ensure(sql);
  const rows = (await sql`SELECT id, slug FROM badges WHERE slug = ${slug}`) as { id: string; slug: string }[];
  return rows[0] ?? null;
}

/** Idempotent award (PK blocks doubles). Returns true only if newly awarded. */
export async function awardBadge(userId: string, badgeId: string, experimentSlug: string | null, awardContext: unknown): Promise<boolean> {
  const sql = getDb();
  await ensure(sql);
  const ctx = awardContext != null ? JSON.stringify(awardContext) : null;
  const rows = (await sql`
    INSERT INTO user_badges (user_id, badge_id, experiment_slug, award_context)
    VALUES (${userId}, ${badgeId}, ${experimentSlug}, ${ctx}::jsonb)
    ON CONFLICT (user_id, badge_id) DO NOTHING
    RETURNING user_id
  `) as { user_id: string }[];
  return rows.length > 0;
}

export async function addXp(userId: string, experimentSlug: string | null, amount: number, reason: string): Promise<void> {
  const sql = getDb();
  await ensure(sql);
  await sql`INSERT INTO xp_events (user_id, experiment_slug, amount, reason) VALUES (${userId}, ${experimentSlug}, ${amount}, ${reason})`;
  await sql`UPDATE users SET total_xp = total_xp + ${amount} WHERE id = ${userId}`;
}

/** Reassign an anonymous session's data to a user. Idempotent: a session already merged is a
 *  no-op. Returns the number of participations newly reassigned (caller recomputes if > 0). */
export async function mergeSessionIntoUser(sessionId: string, userId: string): Promise<number> {
  const sql = getDb();
  await ensure(sql);
  const existing = (await sql`SELECT merged_into_user_id FROM anonymous_sessions WHERE id = ${sessionId}`) as { merged_into_user_id: string | null }[];
  if (existing[0]?.merged_into_user_id) return 0; // already merged
  const moved = (await sql`
    UPDATE participations SET user_id = ${userId}, session_id = NULL
    WHERE session_id = ${sessionId} AND user_id IS NULL
    RETURNING id
  `) as { id: string }[];
  await sql`UPDATE anonymous_sessions SET merged_into_user_id = ${userId} WHERE id = ${sessionId}`;
  return moved.length;
}

/** All of a user's participations (for reward recompute after a merge). */
export async function getUserParticipations(userId: string): Promise<ParticipationRow[]> {
  const sql = getDb();
  await ensure(sql);
  return (await sql`SELECT * FROM participations WHERE user_id = ${userId} ORDER BY created_at ASC`) as ParticipationRow[];
}

export async function getProfile(clerkUserId: string): Promise<{ user: UserRow; badges: ProfileBadge[]; experiments: string[] } | null> {
  const sql = getDb();
  await ensure(sql);
  const users = (await sql`SELECT * FROM users WHERE clerk_user_id = ${clerkUserId}`) as UserRow[];
  if (!users.length) return null;
  const user = users[0];
  const badges = (await sql`
    SELECT b.slug, b.name, b.description, b.experiment_slug, ub.awarded_at, ub.award_context
    FROM user_badges ub JOIN badges b ON b.id = ub.badge_id
    WHERE ub.user_id = ${user.id}
    ORDER BY ub.awarded_at DESC
  `) as { slug: string; name: string; description: string; experiment_slug: string | null; awarded_at: string; award_context: unknown }[];
  const exps = (await sql`SELECT DISTINCT experiment_slug FROM participations WHERE user_id = ${user.id}`) as { experiment_slug: string }[];
  return {
    user,
    badges: badges.map((b) => ({
      slug: b.slug,
      name: b.name,
      description: b.description,
      experimentSlug: b.experiment_slug,
      awardedAt: b.awarded_at,
      awardContext: b.award_context,
    })),
    experiments: exps.map((e) => e.experiment_slug),
  };
}
