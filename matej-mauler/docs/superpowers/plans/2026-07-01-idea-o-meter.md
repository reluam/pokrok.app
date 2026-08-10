# Idea-o-meter Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a draft experience where anyone submits their best/worst idea, a cheap AI scores it 1–10 and roasts it, the idea joins a public leaderboard, and logged-in users nudge ideas up/down with a one-time vote blended into the score.

**Architecture:** Next.js 16 App Router. Pure scoring/normalization in `lib/ideaScore.ts` (unit-tested with vitest). Persistence in `lib/ideasDb.ts` via lazy `ensure(sql)` `CREATE TABLE IF NOT EXISTS` (no migration runner). Two public API routes (`submit`, `vote`) + one admin route. The AI call uses `@anthropic-ai/sdk` with Haiku 4.5 structured outputs, folding a harmful/self-promo moderation gate into the same call. Rewards via the existing `lib/rewards/*` registry.

**Tech Stack:** TypeScript, Next.js 16, Neon Postgres (`@neondatabase/serverless` via `lib/db.ts` `getDb()`), Clerk (env-guarded), `@anthropic-ai/sdk`, vitest.

## Global Constraints

- Voice: lowercase, casual, EN-first, playful — a curious friend, not an achievement system.
- No `Co-Authored-By` trailer in commits (breaks Vercel deploy).
- Middleware lives in `proxy.ts`; English-only (`getLang()` → `"en"`).
- Anonymous-first: submit + browse never require an account. Only **voting** requires Clerk.
- Rewards sum to exactly **100 XP**; celebrate self-knowledge, never volume/streaks.
- DB access = lazy `CREATE TABLE IF NOT EXISTS` inside `lib/ideasDb.ts` via an `ensure(sql)` gate.
- Experiments are keyed by **slug** (`idea-o-meter`) everywhere.
- Blend constant `k = 8` (single tunable const in `lib/ideaScore.ts`).
- AI model: `claude-haiku-4-5-20251001` (repo's cheap model). Structured output via `output_config.format`.

---

### Task 1: Pure scoring + normalization (`lib/ideaScore.ts`)

**Files:**
- Create: `lib/ideaScore.ts`
- Test: `lib/ideaScore.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `export const BLEND_K = 8`
  - `export function normalizeIdea(text: string): string` — trim, collapse inner whitespace, lowercase.
  - `export function blendScore(aiScore: number, likes: number, dislikes: number): number` — returns `final` in `[0,10]`, rounded to 1 decimal.

- [ ] **Step 1: Write the failing test**

```ts
// lib/ideaScore.test.ts
import { describe, it, expect } from "vitest";
import { BLEND_K, normalizeIdea, blendScore } from "./ideaScore";

describe("normalizeIdea", () => {
  it("trims, lowercases, and collapses inner whitespace", () => {
    expect(normalizeIdea("  The   Printing   Press  ")).toBe("the printing press");
  });
});

describe("blendScore", () => {
  it("returns the AI score when there are no votes", () => {
    expect(blendScore(7, 0, 0)).toBe(7);
  });
  it("gives AI and crowd equal weight at V = k", () => {
    // V = BLEND_K (all likes → userScore 10). w = 0.5 → (0.5*4 + 0.5*10) = 7
    const likes = BLEND_K;
    expect(blendScore(4, likes, 0)).toBe(7);
  });
  it("moves toward the crowd as votes grow (all dislikes drags a high AI score down)", () => {
    const withFew = blendScore(9, 0, 4);
    const withMany = blendScore(9, 0, 100);
    expect(withMany).toBeLessThan(withFew);
    expect(withMany).toBeGreaterThanOrEqual(0);
  });
  it("stays within [0,10]", () => {
    expect(blendScore(10, 50, 0)).toBeLessThanOrEqual(10);
    expect(blendScore(1, 0, 50)).toBeGreaterThanOrEqual(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/ideaScore.test.ts`
Expected: FAIL — `Failed to resolve import "./ideaScore"` / functions not defined.

- [ ] **Step 3: Write minimal implementation**

```ts
// lib/ideaScore.ts
// Pure math + text normalization for the Idea-o-meter. No I/O — unit-tested.

/** How fast crowd votes take over from the AI score. Higher = votes matter more slowly. */
export const BLEND_K = 8;

/** Canonical form used for exact-match dedup: trimmed, inner whitespace collapsed, lowercased. */
export function normalizeIdea(text: string): string {
  return text.trim().replace(/\s+/g, " ").toLowerCase();
}

/**
 * Blend the frozen AI score with crowd sentiment for one idea.
 * V = likes + dislikes. userScore = 10 * likes / V. w = V / (V + k).
 * final = (1 - w) * ai + w * userScore. V = 0 → pure AI.
 */
export function blendScore(aiScore: number, likes: number, dislikes: number): number {
  const v = likes + dislikes;
  if (v <= 0) return round1(aiScore);
  const userScore = (10 * likes) / v;
  const w = v / (v + BLEND_K);
  const final = (1 - w) * aiScore + w * userScore;
  return round1(Math.max(0, Math.min(10, final)));
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run lib/ideaScore.test.ts`
Expected: PASS (4 passing).

- [ ] **Step 5: Commit**

```bash
git add lib/ideaScore.ts lib/ideaScore.test.ts
git commit -m "feat(idea-o-meter): pure score blend + idea normalization"
```

---

### Task 2: Persistence layer (`lib/ideasDb.ts`)

**Files:**
- Create: `lib/ideasDb.ts`

**Interfaces:**
- Consumes: `getDb` from `lib/db.ts`; `blendScore`, `normalizeIdea` from `lib/ideaScore.ts`.
- Produces:
  - `export type IdeaRow = { id: number; text: string; norm: string; ai_score: number; ai_roast: string; ai_verdict: string; status: "live" | "pending" | "rejected"; creator_user_id: string | null; creator_session: string | null; created_at: string }`
  - `export type LeaderboardIdea = { id: number; text: string; ai_score: number; ai_roast: string; ai_verdict: string; likes: number; dislikes: number; final: number; rank: number }`
  - `export function findLiveByNorm(norm: string): Promise<IdeaRow | null>`
  - `export function insertIdea(p: { text: string; norm: string; aiScore: number; aiRoast: string; aiVerdict: string; status: "live" | "pending"; creatorUserId: string | null; creatorSession: string | null }): Promise<IdeaRow>`
  - `export function getIdeaById(id: number): Promise<IdeaRow | null>`
  - `export function countRecentSubmissions(opts: { userId: string | null; sessionId: string | null; sinceMinutes: number }): Promise<number>`
  - `export function leaderboard(limit?: number): Promise<LeaderboardIdea[]>`
  - `export function rankOf(ideaId: number): Promise<{ rank: number; total: number; final: number; likes: number; dislikes: number } | null>`
  - `export function castVote(ideaId: number, voterUserId: string, value: 1 | -1): Promise<"new" | "exists">`
  - `export function listPending(): Promise<IdeaRow[]>`
  - `export function setStatus(id: number, status: "live" | "rejected"): Promise<void>`

- [ ] **Step 1: Write the module**

```ts
// lib/ideasDb.ts
import { getDb } from "./db";
import { blendScore, normalizeIdea } from "./ideaScore";

type Sql = ReturnType<typeof getDb>;

export type IdeaStatus = "live" | "pending" | "rejected";

export type IdeaRow = {
  id: number;
  text: string;
  norm: string;
  ai_score: number;
  ai_roast: string;
  ai_verdict: string;
  status: IdeaStatus;
  creator_user_id: string | null;
  creator_session: string | null;
  created_at: string;
};

export type LeaderboardIdea = {
  id: number;
  text: string;
  ai_score: number;
  ai_roast: string;
  ai_verdict: string;
  likes: number;
  dislikes: number;
  final: number;
  rank: number;
};

let ready = false;

async function ensure(sql: Sql) {
  if (ready) return;
  await sql`CREATE TABLE IF NOT EXISTS ideas (
    id SERIAL PRIMARY KEY,
    text TEXT NOT NULL,
    norm TEXT NOT NULL,
    ai_score SMALLINT NOT NULL,
    ai_roast TEXT NOT NULL DEFAULT '',
    ai_verdict TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'live',
    creator_user_id TEXT,
    creator_session TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`;
  // One live idea per normalized text (dedup). Partial unique index: pending/rejected don't block.
  await sql`CREATE UNIQUE INDEX IF NOT EXISTS ideas_norm_live_uniq ON ideas (norm) WHERE status = 'live'`;
  await sql`CREATE TABLE IF NOT EXISTS idea_votes (
    idea_id INT NOT NULL REFERENCES ideas(id) ON DELETE CASCADE,
    voter_user_id TEXT NOT NULL,
    value SMALLINT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (idea_id, voter_user_id)
  )`;
  ready = true;
}

/** Aggregated like/dislike counts per live idea, keyed by idea id. */
async function voteCounts(sql: Sql): Promise<Map<number, { likes: number; dislikes: number }>> {
  const rows = (await sql`
    SELECT idea_id,
           (COUNT(*) FILTER (WHERE value = 1))::int  AS likes,
           (COUNT(*) FILTER (WHERE value = -1))::int AS dislikes
    FROM idea_votes GROUP BY idea_id
  `) as { idea_id: number; likes: number; dislikes: number }[];
  const m = new Map<number, { likes: number; dislikes: number }>();
  for (const r of rows) m.set(r.idea_id, { likes: r.likes, dislikes: r.dislikes });
  return m;
}

export async function findLiveByNorm(norm: string): Promise<IdeaRow | null> {
  const sql = getDb();
  await ensure(sql);
  const rows = (await sql`SELECT * FROM ideas WHERE norm = ${norm} AND status = 'live' LIMIT 1`) as IdeaRow[];
  return rows[0] ?? null;
}

export async function insertIdea(p: {
  text: string; norm: string; aiScore: number; aiRoast: string; aiVerdict: string;
  status: "live" | "pending"; creatorUserId: string | null; creatorSession: string | null;
}): Promise<IdeaRow> {
  const sql = getDb();
  await ensure(sql);
  const rows = (await sql`
    INSERT INTO ideas (text, norm, ai_score, ai_roast, ai_verdict, status, creator_user_id, creator_session)
    VALUES (${p.text}, ${p.norm}, ${p.aiScore}, ${p.aiRoast}, ${p.aiVerdict}, ${p.status}, ${p.creatorUserId}, ${p.creatorSession})
    RETURNING *
  `) as IdeaRow[];
  return rows[0];
}

export async function getIdeaById(id: number): Promise<IdeaRow | null> {
  const sql = getDb();
  await ensure(sql);
  const rows = (await sql`SELECT * FROM ideas WHERE id = ${id}`) as IdeaRow[];
  return rows[0] ?? null;
}

export async function countRecentSubmissions(opts: {
  userId: string | null; sessionId: string | null; sinceMinutes: number;
}): Promise<number> {
  const sql = getDb();
  await ensure(sql);
  const cutoff = `${opts.sinceMinutes} minutes`;
  if (opts.userId) {
    const rows = (await sql`SELECT COUNT(*)::int AS n FROM ideas WHERE creator_user_id = ${opts.userId} AND created_at > NOW() - ${cutoff}::interval`) as { n: number }[];
    return rows[0]?.n ?? 0;
  }
  if (opts.sessionId) {
    const rows = (await sql`SELECT COUNT(*)::int AS n FROM ideas WHERE creator_session = ${opts.sessionId} AND created_at > NOW() - ${cutoff}::interval`) as { n: number }[];
    return rows[0]?.n ?? 0;
  }
  return 0;
}

export async function leaderboard(limit = 100): Promise<LeaderboardIdea[]> {
  const sql = getDb();
  await ensure(sql);
  const ideas = (await sql`SELECT * FROM ideas WHERE status = 'live' ORDER BY created_at ASC`) as IdeaRow[];
  const counts = await voteCounts(sql);
  const scored = ideas.map((i) => {
    const c = counts.get(i.id) ?? { likes: 0, dislikes: 0 };
    return { i, likes: c.likes, dislikes: c.dislikes, final: blendScore(i.ai_score, c.likes, c.dislikes) };
  });
  scored.sort((a, b) => b.final - a.final || +new Date(a.i.created_at) - +new Date(b.i.created_at));
  return scored.slice(0, limit).map((s, idx) => ({
    id: s.i.id, text: s.i.text, ai_score: s.i.ai_score, ai_roast: s.i.ai_roast, ai_verdict: s.i.ai_verdict,
    likes: s.likes, dislikes: s.dislikes, final: s.final, rank: idx + 1,
  }));
}

export async function rankOf(ideaId: number): Promise<{ rank: number; total: number; final: number; likes: number; dislikes: number } | null> {
  const board = await leaderboard(100000);
  const total = board.length;
  const row = board.find((b) => b.id === ideaId);
  if (!row) return null;
  return { rank: row.rank, total, final: row.final, likes: row.likes, dislikes: row.dislikes };
}

export async function castVote(ideaId: number, voterUserId: string, value: 1 | -1): Promise<"new" | "exists"> {
  const sql = getDb();
  await ensure(sql);
  const rows = (await sql`
    INSERT INTO idea_votes (idea_id, voter_user_id, value)
    VALUES (${ideaId}, ${voterUserId}, ${value})
    ON CONFLICT (idea_id, voter_user_id) DO NOTHING
    RETURNING idea_id
  `) as { idea_id: number }[];
  return rows.length > 0 ? "new" : "exists";
}

export async function listPending(): Promise<IdeaRow[]> {
  const sql = getDb();
  await ensure(sql);
  return (await sql`SELECT * FROM ideas WHERE status = 'pending' ORDER BY created_at ASC`) as IdeaRow[];
}

export async function setStatus(id: number, status: "live" | "rejected"): Promise<void> {
  const sql = getDb();
  await ensure(sql);
  await sql`UPDATE ideas SET status = ${status} WHERE id = ${id}`;
}

// re-export for convenience so routes import one module
export { normalizeIdea } from "./ideaScore";
```

- [ ] **Step 2: Verify it typechecks / builds**

Run: `npx tsc --noEmit`
Expected: no errors in `lib/ideasDb.ts`. (If the repo has no `tsc` script, run `npx next build` and confirm no type error originates from this file.)

- [ ] **Step 3: Commit**

```bash
git add lib/ideasDb.ts
git commit -m "feat(idea-o-meter): ideas + votes tables with lazy ensure, leaderboard blend"
```

---

### Task 3: Submit route with AI scoring + moderation gate (`app/api/idea-o-meter/submit/route.ts`)

**Files:**
- Create: `app/api/idea-o-meter/submit/route.ts`

**Interfaces:**
- Consumes: `resolveParticipationActor`, `syncAuthedUser` from `lib/account/session`; `ensureAnonSession`, `recordParticipation` from `lib/accountsDb`; `evaluateRewards` from `lib/rewards/evaluate`; `findLiveByNorm`, `insertIdea`, `countRecentSubmissions`, `rankOf`, `normalizeIdea` from `lib/ideasDb`.
- Produces: `POST` → JSON. Success: `{ ok: true, idea: { id, text, aiScore, roast, verdict, rank, total }, awarded }`. Duplicate: same shape with `deduped: true`. Blocked: `{ ok: false, blocked: true, reason }`. Sent to review: `{ ok: true, review: true }`.

- [ ] **Step 1: Write the route**

```ts
// app/api/idea-o-meter/submit/route.ts
import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { ensureAnonSession, recordParticipation } from "@/lib/accountsDb";
import { resolveParticipationActor } from "@/lib/account/session";
import { evaluateRewards } from "@/lib/rewards/evaluate";
import { findLiveByNorm, insertIdea, countRecentSubmissions, rankOf, normalizeIdea } from "@/lib/ideasDb";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

const SLUG = "idea-o-meter";
const MAX_LEN = 140;
const RATE_MAX = 8; // submissions per hour per actor
const MODEL = "claude-haiku-4-5-20251001";

type Verdict = { ok: boolean; reason: "harmful" | "selfpromo" | "spam" | null; score: number; roast: string; verdict: string };

const SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    ok: { type: "boolean" },
    reason: { type: ["string", "null"], enum: ["harmful", "selfpromo", "spam", null] },
    score: { type: "integer" },
    roast: { type: "string" },
    verdict: { type: "string" },
  },
  required: ["ok", "reason", "score", "roast", "verdict"],
} as const;

const SYSTEM = `you are the idea-o-meter (a.k.a. the idiot-o-meter). a user submits one idea, invention, concept, or meme.
first, moderate: if the submission is harmful/hateful/dangerous, set ok=false reason="harmful". if it is self-promotion, an ad, or spam (plugging a product, brand, handle, or link), set ok=false reason="selfpromo" (or "spam"). otherwise ok=true reason=null.
when ok=true, judge the idea across hidden criteria (originality, feasibility, usefulness, ambition, absurdity) and fold them into a single overall score 1-10 (10 = best). write a short sarcastic roast (max 2 sentences, lowercase, witty not cruel) and a 1-3 word verdict tag.
when ok=false, still return score=1, roast="", verdict="".
voice: lowercase, playful — a roast, not abuse.`;

async function evaluateIdea(text: string): Promise<Verdict> {
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const res = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 300,
    system: SYSTEM,
    output_config: { format: { type: "json_schema", schema: SCHEMA } },
    messages: [{ role: "user", content: text }],
  } as Parameters<typeof anthropic.messages.create>[0]);
  const block = (res.content as { type: string; text?: string }[]).find((b) => b.type === "text");
  const parsed = JSON.parse(block?.text ?? "{}") as Verdict;
  // clamp score defensively
  parsed.score = Math.max(1, Math.min(10, Math.round(parsed.score || 1)));
  return parsed;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const raw = typeof body?.text === "string" ? body.text : "";
    const review = body?.review === true;
    const text = raw.trim();
    if (!text) return NextResponse.json({ error: "empty" }, { status: 400 });
    if (text.length > MAX_LEN) return NextResponse.json({ error: "too long" }, { status: 400 });

    const norm = normalizeIdea(text);
    const { userId, sessionId } = await resolveParticipationActor();

    // dedup: an existing live idea wins, no second AI call.
    const existing = await findLiveByNorm(norm);
    if (existing) {
      const r = await rankOf(existing.id);
      return NextResponse.json({
        ok: true, deduped: true,
        idea: { id: existing.id, text: existing.text, aiScore: existing.ai_score, roast: existing.ai_roast, verdict: existing.ai_verdict, rank: r?.rank ?? null, total: r?.total ?? null },
        awarded: [],
      });
    }

    // light rate limit (cost guard)
    const recent = await countRecentSubmissions({ userId, sessionId, sinceMinutes: 60 });
    if (recent >= RATE_MAX) return NextResponse.json({ error: "rate", message: "slow down — try again in a bit." }, { status: 429 });

    const verdict = await evaluateIdea(text);

    // moderation gate
    if (!verdict.ok) {
      if (review) {
        await insertIdea({ text, norm, aiScore: 1, aiRoast: "", aiVerdict: "", status: "pending", creatorUserId: userId, creatorSession: sessionId });
        return NextResponse.json({ ok: true, review: true });
      }
      return NextResponse.json({ ok: false, blocked: true, reason: verdict.reason ?? "harmful" });
    }

    if (!userId && sessionId) await ensureAnonSession(sessionId);
    const idea = await insertIdea({
      text, norm, aiScore: verdict.score, aiRoast: verdict.roast, aiVerdict: verdict.verdict,
      status: "live", creatorUserId: userId, creatorSession: sessionId,
    });

    const payload = { kind: "submit", aiScore: verdict.score };
    const insight = { verdict: verdict.verdict, score: verdict.score };
    await recordParticipation({ experimentSlug: SLUG, userId, sessionId, payload, insight });
    const awarded = userId ? await evaluateRewards({ userId, experimentSlug: SLUG, participation: { experimentSlug: SLUG, payload, insight } }) : [];

    const r = await rankOf(idea.id);
    return NextResponse.json({
      ok: true,
      idea: { id: idea.id, text: idea.text, aiScore: idea.ai_score, roast: idea.ai_roast, verdict: idea.ai_verdict, rank: r?.rank ?? null, total: r?.total ?? null },
      awarded,
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
```

> Note on `output_config`: it's cast through `as Parameters<...>[0]` because the installed SDK's typed params may not yet expose `output_config`. If `npx tsc --noEmit` shows the field is already typed, drop the cast. If a runtime 400 rejects `output_config`, fall back to a plain call + `JSON.parse` of the first text block (the block-find + parse code already handles that response shape).

- [ ] **Step 2: Verify it builds**

Run: `npx tsc --noEmit`
Expected: no type errors from this file.

- [ ] **Step 3: Commit**

```bash
git add app/api/idea-o-meter/submit/route.ts
git commit -m "feat(idea-o-meter): submit route — AI score + roast + moderation gate + dedup"
```

---

### Task 4: Vote route (`app/api/idea-o-meter/vote/route.ts`)

**Files:**
- Create: `app/api/idea-o-meter/vote/route.ts`

**Interfaces:**
- Consumes: `syncAuthedUser` from `lib/account/session`; `recordParticipation` from `lib/accountsDb`; `evaluateRewards` from `lib/rewards/evaluate`; `castVote`, `getIdeaById`, `rankOf` from `lib/ideasDb`.
- Produces: `POST { ideaId: number, value: 1 | -1 }` → `{ ok, alreadyVoted, rank, total, final, likes, dislikes, awarded }`. Anonymous → `401 { error: "auth" }`.

- [ ] **Step 1: Write the route**

```ts
// app/api/idea-o-meter/vote/route.ts
import { NextRequest, NextResponse } from "next/server";
import { syncAuthedUser } from "@/lib/account/session";
import { recordParticipation } from "@/lib/accountsDb";
import { evaluateRewards } from "@/lib/rewards/evaluate";
import { castVote, getIdeaById, rankOf } from "@/lib/ideasDb";

export const dynamic = "force-dynamic";
const SLUG = "idea-o-meter";

export async function POST(req: NextRequest) {
  try {
    const synced = await syncAuthedUser();
    if (!synced) return NextResponse.json({ error: "auth" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const ideaId = Number(body?.ideaId);
    const value = body?.value === -1 ? -1 : body?.value === 1 ? 1 : null;
    if (!Number.isInteger(ideaId) || value === null) return NextResponse.json({ error: "bad request" }, { status: 400 });

    const idea = await getIdeaById(ideaId);
    if (!idea || idea.status !== "live") return NextResponse.json({ error: "not found" }, { status: 404 });

    const result = await castVote(ideaId, synced.userId, value);

    let awarded: unknown[] = [];
    if (result === "new") {
      const payload = { kind: "vote" };
      await recordParticipation({ experimentSlug: SLUG, userId: synced.userId, sessionId: null, payload });
      awarded = await evaluateRewards({ userId: synced.userId, experimentSlug: SLUG, participation: { experimentSlug: SLUG, payload } });
    }

    const r = await rankOf(ideaId);
    return NextResponse.json({
      ok: true, alreadyVoted: result === "exists",
      rank: r?.rank ?? null, total: r?.total ?? null, final: r?.final ?? null, likes: r?.likes ?? 0, dislikes: r?.dislikes ?? 0,
      awarded,
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
```

- [ ] **Step 2: Verify it builds**

Run: `npx tsc --noEmit`
Expected: no type errors from this file.

- [ ] **Step 3: Commit**

```bash
git add app/api/idea-o-meter/vote/route.ts
git commit -m "feat(idea-o-meter): one-time like/dislike vote route"
```

---

### Task 5: Admin review route (`app/api/admin/idea-o-meter/route.ts`)

**Files:**
- Create: `app/api/admin/idea-o-meter/route.ts`

**Interfaces:**
- Consumes: `isAdminReq` from `lib/adminAuth`; `listPending`, `setStatus` from `lib/ideasDb`.
- Produces: `GET` → `{ pending: IdeaRow[] }`. `POST { id, action: "approve" | "reject" }` → `{ ok: true }`.

- [ ] **Step 1: Write the route**

```ts
// app/api/admin/idea-o-meter/route.ts
import { NextRequest, NextResponse } from "next/server";
import { isAdminReq } from "@/lib/adminAuth";
import { listPending, setStatus } from "@/lib/ideasDb";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (!isAdminReq(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  return NextResponse.json({ pending: await listPending() });
}

export async function POST(req: NextRequest) {
  if (!isAdminReq(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const id = Number(body?.id);
  const action = body?.action;
  if (!Number.isInteger(id) || (action !== "approve" && action !== "reject")) {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }
  await setStatus(id, action === "approve" ? "live" : "rejected");
  return NextResponse.json({ ok: true });
}
```

> Verify `isAdminReq` is exported from `lib/adminAuth` (it is used in `app/api/brain/classify/route.ts`). If its signature differs, match that call site exactly.

- [ ] **Step 2: Verify it builds**

Run: `npx tsc --noEmit`
Expected: no type errors from this file.

- [ ] **Step 3: Commit**

```bash
git add app/api/admin/idea-o-meter/route.ts
git commit -m "feat(idea-o-meter): admin route to approve/reject flagged ideas"
```

---

### Task 6: Rewards (`lib/rewards/idea-o-meter.ts` + register)

**Files:**
- Create: `lib/rewards/idea-o-meter.ts`
- Modify: `lib/rewards/index.ts`
- Test: `lib/rewards/idea-o-meter.test.ts`

**Interfaces:**
- Consumes: `BadgeDef`, `RewardContext` from `lib/rewards/types`.
- Produces: `export const ideaOMeterBadges: BadgeDef[]` (3 badges summing 100 XP).

- [ ] **Step 1: Write the failing test**

```ts
// lib/rewards/idea-o-meter.test.ts
import { describe, it, expect } from "vitest";
import { ideaOMeterBadges } from "./idea-o-meter";
import type { RewardContext } from "./types";

const ctx = (payload: Record<string, unknown>): RewardContext => ({
  participation: { experimentSlug: "idea-o-meter", payload },
  stats: { distinctExperiments: 1, thisExperimentCount: 1 },
});
const badge = (slug: string) => ideaOMeterBadges.find((b) => b.slug === slug)!;

describe("idea-o-meter badges", () => {
  it("sum to exactly 100 XP", () => {
    expect(ideaOMeterBadges.reduce((s, b) => s + b.xp, 0)).toBe(100);
  });
  it("dared the meter fires on a submit, not a vote", () => {
    expect(badge("dared_the_meter").evaluate(ctx({ kind: "submit", aiScore: 5 }))).toBe(true);
    expect(badge("dared_the_meter").evaluate(ctx({ kind: "vote" }))).toBe(false);
  });
  it("learned to judge fires on a vote", () => {
    expect(badge("learned_to_judge").evaluate(ctx({ kind: "vote" }))).toBe(true);
    expect(badge("learned_to_judge").evaluate(ctx({ kind: "submit", aiScore: 5 }))).toBe(false);
  });
  it("honest mirror fires on an extreme submit score", () => {
    expect(badge("honest_mirror").evaluate(ctx({ kind: "submit", aiScore: 2 }))).toBe(true);
    expect(badge("honest_mirror").evaluate(ctx({ kind: "submit", aiScore: 9 }))).toBe(true);
    expect(badge("honest_mirror").evaluate(ctx({ kind: "submit", aiScore: 6 }))).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/rewards/idea-o-meter.test.ts`
Expected: FAIL — cannot resolve `./idea-o-meter`.

- [ ] **Step 3: Write the badges**

```ts
// lib/rewards/idea-o-meter.ts
import type { BadgeDef } from "./types";

const SLUG = "idea-o-meter";
const kind = (ctx: { participation: { payload?: Record<string, unknown> | null } }) =>
  (ctx.participation.payload?.kind as string | undefined) ?? null;
const aiScore = (ctx: { participation: { payload?: Record<string, unknown> | null } }) => {
  const s = ctx.participation.payload?.aiScore;
  return typeof s === "number" ? s : NaN;
};

// Idea-o-meter — submit an idea, an AI roasts+scores it, the crowd votes it up/down.
export const ideaOMeterBadges: BadgeDef[] = [
  {
    slug: "dared_the_meter",
    experimentSlug: SLUG,
    name: "You dared the meter",
    description: "You handed an idea to a machine built to judge it. most people never do.",
    criteriaKey: "first_submission",
    xp: 40,
    evaluate: (ctx) => kind(ctx) === "submit",
  },
  {
    slug: "learned_to_judge",
    experimentSlug: SLUG,
    name: "You learned to judge",
    description: "Turns out it's easier to rate an idea than to have one.",
    criteriaKey: "first_vote",
    xp: 30,
    evaluate: (ctx) => kind(ctx) === "vote",
  },
  {
    slug: "honest_mirror",
    experimentSlug: SLUG,
    name: "The honest mirror",
    description: "You found out exactly what your idea was worth — and didn't flinch.",
    criteriaKey: "extreme_score",
    xp: 30,
    evaluate: (ctx) => kind(ctx) === "submit" && (aiScore(ctx) <= 3 || aiScore(ctx) >= 8),
  },
];
```

- [ ] **Step 4: Register in the index**

Modify `lib/rewards/index.ts` — add the import and spread:

```ts
import { ideaOMeterBadges } from "./idea-o-meter";
```

and inside the `ALL_BADGES` array add:

```ts
  ...ideaOMeterBadges,
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx vitest run lib/rewards/idea-o-meter.test.ts`
Expected: PASS (4 passing).

- [ ] **Step 6: Commit**

```bash
git add lib/rewards/idea-o-meter.ts lib/rewards/idea-o-meter.test.ts lib/rewards/index.ts
git commit -m "feat(idea-o-meter): 3 insight badges (100 XP) + register"
```

---

### Task 7: UI (`components/IdeaOMeter.tsx` + `app/idea-o-meter/page.tsx`)

**Files:**
- Create: `components/IdeaOMeter.tsx`
- Create: `app/idea-o-meter/page.tsx`

**Interfaces:**
- Consumes: submit/vote routes (§3, §4); `guardExperiment` from `lib/experimentsDb`; `getLang` from `lib/getLang`.
- Produces: the rendered experience.

- [ ] **Step 1: Write the client component**

```tsx
// components/IdeaOMeter.tsx
"use client";
import { useEffect, useState } from "react";

type SubmittedIdea = { id: number; text: string; aiScore: number; roast: string; verdict: string; rank: number | null; total: number | null };
type BoardIdea = { id: number; text: string; ai_score: number; ai_roast: string; ai_verdict: string; likes: number; dislikes: number; final: number; rank: number };

const STORE = "idea-o-meter:mine";

export function IdeaOMeter({ lang }: { lang: string }) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [mine, setMine] = useState<SubmittedIdea[]>([]);
  const [blocked, setBlocked] = useState<{ reason: string; text: string } | null>(null);
  const [view, setView] = useState<"submit" | "board">("submit");
  const [board, setBoard] = useState<BoardIdea[] | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    try { const s = localStorage.getItem(STORE); if (s) setMine(JSON.parse(s)); } catch {}
  }, []);
  const persist = (list: SubmittedIdea[]) => { setMine(list); try { localStorage.setItem(STORE, JSON.stringify(list)); } catch {} };

  async function submit(review = false) {
    const value = text.trim();
    if (!value || busy) return;
    setBusy(true); setNotice(null);
    try {
      const res = await fetch("/api/idea-o-meter/submit", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ text: value, review }) });
      const data = await res.json();
      if (res.status === 429) { setNotice(data.message ?? "slow down a moment."); return; }
      if (data.blocked) { setBlocked({ reason: data.reason, text: value }); return; }
      if (data.review) { setNotice("sent for a human to look at. thanks."); setBlocked(null); setText(""); return; }
      if (data.ok && data.idea) {
        persist([data.idea, ...mine.filter((m) => m.id !== data.idea.id)]);
        setText(""); setBlocked(null);
        if (data.deduped) setNotice("someone already had that one — here's where it stands.");
      }
    } finally { setBusy(false); }
  }

  async function loadBoard() {
    const res = await fetch("/api/idea-o-meter/leaderboard").catch(() => null);
    // leaderboard is served by a GET on the submit segment? No — use a dedicated fetch:
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-10 lowercase">
      <header className="mb-6">
        <h1 className="text-3xl font-bold">idea-o-meter</h1>
        <p className="text-sm opacity-70">a.k.a. the idiot-o-meter. drop an idea; a machine judges it. ideas you post are public (no name attached); voting needs an account so each idea gets one honest yes/no from you.</p>
      </header>

      <div className="mb-4 flex gap-2 text-sm">
        <button onClick={() => setView("submit")} className={view === "submit" ? "font-bold underline" : "opacity-60"}>submit</button>
        <button onClick={() => { setView("board"); void refreshBoard(setBoard); }} className={view === "board" ? "font-bold underline" : "opacity-60"}>leaderboard</button>
      </div>

      <div className="grid gap-6 md:grid-cols-[1fr_320px]">
        <section>
          {view === "submit" ? (
            <div>
              <textarea value={text} maxLength={140} onChange={(e) => setText(e.target.value)} placeholder="drop your best — or worst — idea." className="w-full rounded-xl border p-3" rows={3} />
              <div className="mt-2 flex items-center gap-3">
                <button onClick={() => submit(false)} disabled={busy} className="rounded-xl bg-black px-4 py-2 text-white disabled:opacity-50">{busy ? "judging…" : "judge it"}</button>
                <span className="text-xs opacity-50">{text.length}/140</span>
              </div>
              {notice && <p className="mt-3 text-sm opacity-80">{notice}</p>}
              {blocked && (
                <div className="mt-4 rounded-xl border border-red-300 bg-red-50 p-3 text-sm">
                  <p>the meter refused this one ({blocked.reason === "harmful" ? "looks harmful" : "looks like self-promo / spam"}).</p>
                  <div className="mt-2 flex gap-3">
                    <button onClick={() => { setBlocked(null); setText(""); }} className="underline">write a new idea</button>
                    <button onClick={() => submit(true)} className="underline">send for manual review</button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Board board={board} />
          )}
        </section>

        {mine.length > 0 && (
          <aside className="rounded-2xl border p-4">
            <h2 className="mb-2 text-sm font-bold uppercase tracking-wide opacity-60">your ideas</h2>
            <ul className="space-y-3">
              {mine.map((m) => (
                <li key={m.id} className="border-b pb-2 last:border-0">
                  <p className="text-sm">{m.text}</p>
                  <p className="text-2xl font-bold">{m.aiScore}/10 <span className="text-xs font-normal opacity-60">{m.verdict}</span></p>
                  <p className="text-xs italic opacity-70">{m.roast}</p>
                  {m.rank && <p className="text-xs opacity-50">#{m.rank}{m.total ? ` of ${m.total}` : ""}</p>}
                </li>
              ))}
            </ul>
          </aside>
        )}
      </div>
    </main>
  );
}

async function refreshBoard(setBoard: (b: BoardIdea[]) => void) {
  const res = await fetch("/api/idea-o-meter/leaderboard").catch(() => null);
  if (!res || !res.ok) { setBoard([]); return; }
  const data = await res.json();
  setBoard(data.ideas ?? []);
}

function Board({ board }: { board: BoardIdea[] | null }) {
  const [voting, setVoting] = useState<number | null>(null);
  const [local, setLocal] = useState<BoardIdea[] | null>(board);
  useEffect(() => setLocal(board), [board]);
  if (!local) return <p className="text-sm opacity-60">loading…</p>;
  if (local.length === 0) return <p className="text-sm opacity-60">no ideas yet. be the first.</p>;

  async function vote(id: number, value: 1 | -1) {
    setVoting(id);
    try {
      const res = await fetch("/api/idea-o-meter/vote", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ideaId: id, value }) });
      if (res.status === 401) { window.location.href = "/me"; return; }
      const data = await res.json();
      if (data.ok && local) setLocal(local.map((b) => (b.id === id ? { ...b, likes: data.likes, dislikes: data.dislikes, final: data.final } : b)));
    } finally { setVoting(null); }
  }

  return (
    <ol className="space-y-3">
      {local.map((b) => (
        <li key={b.id} className="flex items-center gap-3 rounded-xl border p-3">
          <span className="w-8 text-center text-lg font-bold opacity-50">#{b.rank}</span>
          <div className="flex-1">
            <p className="text-sm">{b.text}</p>
            <p className="text-xs italic opacity-60">{b.ai_roast}</p>
          </div>
          <span className="text-xl font-bold">{b.final}</span>
          <div className="flex flex-col gap-1 text-xs">
            <button disabled={voting === b.id} onClick={() => vote(b.id, 1)} className="rounded border px-2">👍 {b.likes}</button>
            <button disabled={voting === b.id} onClick={() => vote(b.id, -1)} className="rounded border px-2">👎 {b.dislikes}</button>
          </div>
        </li>
      ))}
    </ol>
  );
}
```

> This component fetches `GET /api/idea-o-meter/leaderboard`. Add that GET handler to the submit segment as a sibling: create `app/api/idea-o-meter/leaderboard/route.ts` with `export async function GET() { return NextResponse.json({ ideas: await leaderboard(100) }); }` (import `leaderboard` from `@/lib/ideasDb`, `export const dynamic = "force-dynamic"`). Include this file in this task's commit.

- [ ] **Step 2: Write the leaderboard GET route**

```ts
// app/api/idea-o-meter/leaderboard/route.ts
import { NextResponse } from "next/server";
import { leaderboard } from "@/lib/ideasDb";
export const dynamic = "force-dynamic";
export async function GET() {
  return NextResponse.json({ ideas: await leaderboard(100) });
}
```

- [ ] **Step 3: Write the page**

```tsx
// app/idea-o-meter/page.tsx
import { IdeaOMeter } from "@/components/IdeaOMeter";
import { getLang } from "@/lib/getLang";
import { guardExperiment } from "@/lib/experimentsDb";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Idea-o-meter — Spaghetti.ltd",
  description: "Drop your best — or worst — idea. A cheap AI scores it 1–10 and roasts it, then the crowd votes it up or down.",
  alternates: { canonical: "/idea-o-meter" },
};

export default async function IdeaOMeterPage() {
  await guardExperiment("idea-o-meter");
  const lang = await getLang();
  return <IdeaOMeter lang={lang} />;
}
```

- [ ] **Step 4: Verify it builds**

Run: `npx next build`
Expected: build succeeds; `/idea-o-meter` compiles. (Clean up the unused `loadBoard` stub from Step 1 if the linter flags it — it is superseded by `refreshBoard`.)

- [ ] **Step 5: Commit**

```bash
git add components/IdeaOMeter.tsx app/idea-o-meter/page.tsx app/api/idea-o-meter/leaderboard/route.ts
git commit -m "feat(idea-o-meter): submit UI, leaderboard with one-time voting, page"
```

---

### Task 8: Register the draft experiment (`lib/experimentsDb.ts`)

**Files:**
- Modify: `lib/experimentsDb.ts` (inside `ensure()`, alongside the other draft `INSERT ... ON CONFLICT` seeds, e.g. after the `spaghetti-city` block)

**Interfaces:**
- Consumes / Produces: adds a `draft` row so `/idea-o-meter` is reachable on preview/local and hidden on production. Follows the exact pattern of the `decision-maker` / `about` seeds.

- [ ] **Step 1: Add the seed insert**

Add this inside `ensure()` (after the `spaghetti-city` seed block):

```ts
  // Idea-o-meter — submit an idea, an AI roasts+scores it, the crowd votes; draft (2026-07-01)
  await sql`INSERT INTO experiments (slug, title_cs, title_en, desc_cs, desc_en, color, href, external, sort_order, published, stage)
    VALUES ('idea-o-meter', 'Idea-o-meter', 'Idea-o-meter',
      'Napiš svůj nejlepší — nebo nejhorší — nápad. Levná AI mu dá známku 1–10 a sarkasticky ho zhodnotí, pak s ním hýbe žebříčkem hlasování ostatních.',
      'Drop your best — or worst — idea. A cheap AI scores it 1–10 and roasts it; the crowd then votes it up or down.',
      '#EDE9FE', '/idea-o-meter', FALSE, (SELECT COALESCE(MAX(sort_order), -1) + 1 FROM experiments), FALSE, 'draft')
    ON CONFLICT (slug) DO UPDATE SET stage = 'draft', published = FALSE, href = '/idea-o-meter'`;
```

- [ ] **Step 2: Verify it builds**

Run: `npx next build`
Expected: build succeeds.

- [ ] **Step 3: Manual smoke check (requires DB env)**

If a Neon `DATABASE_URL` is available locally, run `npm run dev`, open `/idea-o-meter`, submit an idea, and confirm: a score+roast comes back, the right column appears, the leaderboard lists it, and voting while logged out redirects/prompts. (Skip if no DB env — the build check in Step 2 is the gate.)

- [ ] **Step 4: Commit**

```bash
git add lib/experimentsDb.ts
git commit -m "feat(idea-o-meter): seed draft experiment row"
```

---

## Self-Review

**Spec coverage:**
- §1 concept, pun, anon-vs-login → Tasks 3, 4, 7. ✓
- §2 flow (submit, dedup, block+review, right column, leaderboard, vote) → Tasks 3, 4, 7. ✓
- §3 blend `w = V/(V+k)`, k=8, computed on read → Task 1 + `leaderboard()`/`rankOf()` in Task 2. ✓
- §4 AI call (Haiku, structured output, criteria, roast, guards, rate limit) → Task 3. ✓
- §5 data model (ideas, idea_votes PK, status, admin review) → Tasks 2, 5. ✓
- §6 UI + privacy note → Task 7. ✓
- §7 rewards (3 badges = 100 XP, payload signals) → Tasks 3, 4, 6. ✓
- §8 conscious choices (leaderboard-of-ideas, YAGNI) → respected (no fuzzy dedup, no edit/delete). ✓
- §10 integration checklist → Tasks 1–8 map 1:1. ✓

**Placeholder scan:** No TBD/TODO. The one stub (`loadBoard`) is explicitly flagged for removal in Task 7 Step 4; `refreshBoard` is the real implementation.

**Type consistency:** `insertIdea` param names (`aiScore`/`aiRoast`/`aiVerdict`) consistent across Tasks 2–3. Badge payload `kind`/`aiScore` consistent between Task 3 (writes) and Task 6 (reads). `blendScore(aiScore, likes, dislikes)` signature identical in Tasks 1 and 2. Vote `value` typed `1 | -1` in Tasks 2 and 4.
