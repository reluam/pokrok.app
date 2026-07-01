# Idea-o-meter (a.k.a. the Idiot-o-meter) — design

**Slug:** `idea-o-meter` · **Route:** `/idea-o-meter` · **Stage:** `draft`
(seeded via `experimentsDb.ts` `ensure()`, `published=FALSE`, `stage='draft'` — visible on
preview/local, hidden on production; same pattern as `decision-maker` / `about`, i.e. a direct
`INSERT ... ON CONFLICT`, so **no** `experiments.ts` `STATIC` or `dictionaries.ts` entry is
required.)

Date: 2026-07-01

## 1. What it is

You submit your **best — or worst — idea** (a phone, the printing press, special relativity, or
a gloriously dumb one like the Fiat Multipla). A cheap AI ("nežravá") scores it **1–10** and
writes a **short, sarcastic roast**. The idea joins a **public leaderboard** of all submitted
ideas. Logged-in users nudge ideas up or down with a **one-time like/dislike**, which is blended
with the AI score. The name is a pun on *Idiot-o-meter*, and the voice leans into that.

It is fully usable **anonymously** (submit + browse); **voting requires a Clerk account**
(so each idea gets one honest yes/no per person).

## 2. User flow

1. **Landing** (`/idea-o-meter`): a single input — *"drop your best — or worst — idea."*
   (max ~140 chars) + submit. A one-line note underneath: the pun + the privacy line.
2. **Submit** (anonymous OK) → `POST /api/idea-o-meter/submit`:
   - validate + normalize; **dedup**: if an idea with the same normalized text already exists,
     return the existing one instead of paying for another AI call (no duplicate row).
   - call the AI (§4). The AI returns `{ ok, reason, score, roast, verdict }`.
   - **Moderation gate:** if `ok === false` (harmful, or self-promo/spam), the idea is **not**
     scored into the board. Respond with `{ blocked: true, reason }`. The UI then offers two
     actions: **write a new idea**, or **send for manual review** → `POST .../submit` again with
     `review: true`, which stores the idea as `status='pending'` (hidden from the board, queued
     for an admin). Nothing else is stored on a plain block.
   - otherwise insert as `status='live'`, `recordParticipation(...)` (badges + anon→account
     merge), and return the idea with its current rank.
3. **Right column** appears only **after the first submission**: the session's submitted
   idea(s) — text, big score, the roast, current rank (#N of M). The player can submit another
   idea or open the leaderboard.
4. **Leaderboard**: all `live` ideas ranked by final score (§3). Each row: rank, idea, final
   score, likes/dislikes (AI score shown small). Logged-in → like/dislike buttons (one-time,
   permanent). Anonymous → the buttons trigger `promptRegistration({ trigger: 'on_explore' })`
   (gates *depth* — voting — never the core submit).
5. **Vote** → `POST /api/idea-o-meter/vote { ideaId, value }` (requires Clerk user). One row per
   `(idea, user)`, enforced by PK. Recompute affects the idea's final score on next read.

## 3. Scoring & voting (approved blend)

`final = (1 − w)·AI + w·userScore`, where
- `V = likes + dislikes` (votes on **this** idea)
- `userScore = 10 · likes / V` (0..10)
- `w = V / (V + k)`, with `k ≈ 8` (a tunable constant in code)

`V = 0` → `w = 0` → `final = AI` (pure AI). More votes → the crowd matters more, **for that idea
only** (no cross-idea coupling). `AI` is frozen at submit time; `final` is computed on read from
live vote counts. Pure math + text normalization live in **`lib/ideaScore.ts`** with unit tests
(the repo's `*Logic.test.ts` convention). Test cases: `V=0 → AI`; monotonic in like-ratio; bounds
stay within `[0,10]`; `w` at `V=k` is `0.5`.

## 4. The AI call

`app/api/idea-o-meter/submit/route.ts` reuses the existing `@anthropic-ai/sdk` pattern from
`app/api/brain/classify/route.ts`.

- **Model:** `claude-haiku-4-5-20251001` (the repo's cheap model — matches the "nežravá AI" ask).
- **Structured output:** `output_config: { format: { type: "json_schema", schema } }` (Haiku 4.5
  supports structured outputs) → guarantees a valid object; no regex parsing. Schema:
  `{ ok: boolean, reason: "harmful"|"selfpromo"|"spam"|null, score: integer 1..10,
     roast: string, verdict: string }`.
- Small `max_tokens` (~300). The prompt asks the model to (a) reject harmful or self-promotional
  / spam submissions (`ok:false` + `reason`), and otherwise (b) judge the idea across hidden
  criteria (originality, feasibility, usefulness, ambition, absurdity) into a single 1–10 score
  with a **sarcastic, witty-not-cruel** roast (≤2 sentences) and a short `verdict` tag. Voice:
  lowercase, playful — a roast, not abuse.
- **Guards:** length cap (server-side), reject empty; a light per-session rate limit (max N
  submissions/hour via a DB count keyed on session/user) to bound cost. On AI/API failure, return
  a graceful error (the core site never hard-fails).

## 5. Data model — `lib/ideasDb.ts` (lazy `ensure()`)

- **`ideas`**: `id` serial PK, `text`, `norm` (unique — lowercased/trimmed, drives dedup),
  `ai_score` smallint (1..10), `ai_roast`, `ai_verdict`, `status` text
  (`'live' | 'pending' | 'rejected'`, default `'live'`), `creator_user_id` (nullable),
  `creator_session` (nullable), `created_at`.
- **`idea_votes`**: `idea_id`, `voter_user_id`, `value` smallint (+1 like / −1 dislike),
  `created_at`, **PRIMARY KEY(`idea_id`, `voter_user_id`)** → one permanent vote per person.
- Leaderboard read: aggregate likes/dislikes per idea, compute `final` (via `lib/ideaScore.ts`),
  order by `final` desc, tie-break `created_at`. Rank of a single idea for the right column.
- **Admin review:** `app/api/admin/idea-o-meter/route.ts`, guarded by the existing `isAdminReq`,
  lists `status='pending'` ideas and approves (`→ live`, triggers an AI score if it never got one)
  or rejects (`→ rejected`). Minimal — a small admin surface, consistent with existing admin API.

## 6. UI

- `app/idea-o-meter/page.tsx` → `guardExperiment('idea-o-meter')` + `getLang()` +
  `<IdeaOMeter lang={lang} />` (client component in `components/IdeaOMeter.tsx`).
- Layout: submit column (left / center) + results column (right, appears after first submit) +
  a leaderboard view. Session's own ideas persisted via the `sp_anon` session + DB
  (`creator_session` / `creator_user_id`), so they survive a reload and merge on registration.
- **Privacy note** (in UI): *"ideas you post are public on the board — no name attached. voting
  needs an account so each idea gets one honest yes/no from you."*

## 7. Rewards — 100 XP (`lib/rewards/idea-o-meter.ts`, registered in `rewards/index.ts`)

Insight-framed (self-knowledge, not volume). Evaluated for signed-in users; anonymous
submissions earn them on later registration via the standard merge.

- **you dared the meter** — first idea submitted — **40 XP** —
  *"you handed an idea to a machine built to judge it. most people never do."*
- **you learned to judge** — first vote cast on someone else's idea — **30 XP** —
  *"turns out it's easier to rate an idea than to have one."*
- **the honest mirror** — you left an idea up that the AI scored ≤3 (or ≥8) — **30 XP** —
  *"you found out exactly what your idea was worth — and didn't flinch."*

The submit and vote routes pass the needed signal in the participation `payload`
(`{ kind: 'submit', aiScore }` / `{ kind: 'vote' }`); `evaluate.ts` awards idempotently.

## 8. Notes / conscious choices

- **The "no public leaderboard" studio rule:** this ranks **ideas, not people** — no user
  identities are shown and nothing pits players against each other — so it reads as consistent
  with the reflection ethos, and the user explicitly wants the žebříček. Recorded here as a
  deliberate exception.
- **YAGNI:** no fuzzy/near-duplicate detection (exact normalized match only); no edit/delete of
  submitted ideas by users; no per-criterion score breakdown surfaced in v1 (the AI folds them
  into one number + roast).

## 9. Testing

- Unit: `lib/ideaScore.ts` (blend formula + normalization/dedup) via `ideaScore.test.ts`.
- Not unit-tested (integration/manual): the AI call and DB writes.

## 10. Integration checklist

1. `lib/ideaScore.ts` (+ test), `lib/ideasDb.ts`.
2. `app/api/idea-o-meter/submit/route.ts`, `.../vote/route.ts`, `app/api/admin/idea-o-meter/route.ts`.
3. `components/IdeaOMeter.tsx`, `app/idea-o-meter/page.tsx`.
4. `lib/rewards/idea-o-meter.ts` + register in `lib/rewards/index.ts`.
5. Draft seed row in `lib/experimentsDb.ts` `ensure()` (`stage='draft'`, `published=FALSE`,
   `href='/idea-o-meter'`, a fresh pastel `color`).
