# Spaghetti.ltd — project conventions

Studio publishing one interactive web experiment per month. Stack: Next.js 16 (App Router),
Vercel, Neon (Postgres), Clerk (auth), Stripe. DB access = lazy `CREATE TABLE IF NOT EXISTS`
inside `lib/*Db.ts` via an `ensure(sql)` gate (no migration runner). Experiments are keyed by
**slug** everywhere (`experiments.slug` is the catalog).

## Spaghetti accounts, XP & badges — standing rules for every experiment

Auth = **Clerk** (magic-link primary, social secondary). Never replace it or roll custom auth.
Profile / progress / badges live at the **Spaghetti level** (`users` table, keyed by
`clerk_user_id`) and carry across every monthly experiment. Tables are experiment-agnostic —
a new experiment needs NO schema change.

1. **Anonymous-first, account-optional.** Every experiment is fully usable without an account.
   Registration is never a gate to the core experience.
2. **Offered, never forced.** Prompt only at a moment of earned value, framed as
   "keep / continue this" — never "sign up". Use `promptRegistration({ trigger, context })`
   (triggers: `on_result` | `on_explore` | `on_return` | `manual`; default `on_result`, shown
   AFTER the personal insight has landed). `on_explore` gates *depth*, never the core.
3. **Reward insight, not volume.** XP & badges celebrate self-knowledge & discovery — never
   completion, counts or streaks. If a badge could exist on a generic habit app, it does not
   belong here. Badge copy names what the user learned *about themselves*; the sentence is the
   shareable payload, not the icon.
4. **The account is the "we".** A new experiment adds to the *same* profile.
5. **Graceful anon→account merge.** Anonymous data (the `sp_anon` session) MUST link to the new
   account on registration. Never make a user lose what they just did.

**No public leaderboard** — it pulls toward competition over reflection. A private
"how you compare" stat is fine.

**100 XP per experiment.** Every experiment's badges sum to exactly **100 XP** — the full pool a
player can draw from one experience (fully engaging with it = 100). Split that 100 across the
badges as fits the experience: give completion a meaningful floor and let self-discovery /
deeper insight fill it to 100. XP still celebrates self-knowledge, never volume or streaks.

### How a new experiment plugs in

1. Save a row via `recordParticipation({ experimentSlug, userId | sessionId, payload, insight })`.
   Put the computed personal "mirror" result in `insight` (badges read from it).
2. Add `lib/rewards/<slug>.ts` exporting `BadgeDef[]` (catalog + `evaluate(ctx) => boolean`),
   register it in `lib/rewards/index.ts`. Badges are seeded into the `badges` table on `ensure()`.
3. Call `evaluateRewards({ userId, experimentSlug, participation })` after saving. It awards any
   newly-earned badges + XP idempotently (PK `user_badges(user_id, badge_id)`).

Voice: lowercase, casual, EN-first, a little playful — a curious friend, not an achievement
system. Add a one-line privacy note wherever data feeds a shared network.

## Other conventions

- **No `Co-Authored-By` trailer in commits** — it breaks the Vercel deploy.
- Clerk is **env-guarded**: it only activates when `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` /
  `CLERK_SECRET_KEY` are set, so the site builds & runs without keys.
- Middleware lives in `proxy.ts` (Next 16 renamed `middleware.ts` → `proxy.ts`).
- English-only for now (`getLang()` → `"en"`).
