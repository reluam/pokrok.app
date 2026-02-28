# AGENTS.md

## Cursor Cloud specific instructions

### Codebase overview

This is a monorepo with 3 Next.js web projects + a shared TS library (no monorepo tooling — each has its own `package.json` + `package-lock.json`).

| Project | Port | External deps | Notes |
|---|---|---|---|
| `pokrok-game-web` | 3000 | Neon Postgres, Clerk, Resend, Google AI | Main product; Next.js 16 with `next-intl` |
| `ziju-life` | 3003 | Neon Postgres, Google Calendar, Resend | Brand website; Next.js 16 |
| `matej-mauler` | 3005 | Resend (optional) | Portfolio site; Next.js 16, no DB or auth |
| `pokrok-shared` | — | None | Shared TypeScript types; must `npm run build` before other projects that import it |

### Running dev servers

Each project runs independently via `npm run dev` from its own directory. Default port is 3000. To run multiple apps simultaneously, set different ports via `PORT=30XX npm run dev`.

### Linting

- `pokrok-game-web`: `npm run lint` currently broken — `next lint` on Next.js 16 errors with "Invalid project directory" (pre-existing; needs ESLint flat config migration)
- `ziju-life`: `npm run lint` runs `eslint` with no file args; needs `eslint.config.mjs` present (exists, but prints help output without file patterns)
- `matej-mauler`: `npm run lint` works (`eslint .`)

### Build caveats

- `pokrok-game-web` (uses Clerk) will fail to build/run without `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY`.
- `matej-mauler`: `npm run build` has a pre-existing TS error in `ProjectsCarousel.tsx`. Dev server is unaffected.

### Environment variables (per-project secrets)

Since each project has its own database and auth setup, Cursor Cloud secrets use project-prefixed names. The update script auto-generates `.env.local` files from these env vars.

**Shared secrets:**

| Secret name | Used by | Required? |
|---|---|---|
| `RESEND_API_KEY` | all projects | Optional (contact forms 500 without it) |

**`pokrok-game-web` secrets:**

| Cursor Cloud secret | Maps to `.env.local` var | Required? |
|---|---|---|
| `POKROK_DATABASE_URL` | `DATABASE_URL` | Yes (DB queries fail without it, but dev server starts) |
| `POKROK_CLERK_PUBLISHABLE_KEY` | `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Yes (Clerk middleware blocks all routes) |
| `POKROK_CLERK_SECRET_KEY` | `CLERK_SECRET_KEY` | Yes (Clerk middleware blocks all routes) |
| `POKROK_ENCRYPTION_MASTER_KEY` | `ENCRYPTION_MASTER_KEY` | Optional (encryption features) |
| `POKROK_GEMINI_API_KEY` | `GEMINI_API_KEY` | Optional (AI assistant) |

**`ziju-life` secrets:**

| Cursor Cloud secret | Maps to `.env.local` var | Required? |
|---|---|---|
| `ZIJU_DATABASE_URL` | `DATABASE_URL` | Yes (DB queries fail without it, but dev server starts) |
| `ZIJU_ADMIN_PASSWORD` | `ADMIN_PASSWORD` | Optional (admin panel) |
| `ZIJU_GOOGLE_CLIENT_ID` | `GOOGLE_CLIENT_ID` | Optional (Google Calendar) |
| `ZIJU_GOOGLE_CLIENT_SECRET` | `GOOGLE_CLIENT_SECRET` | Optional (Google Calendar) |

**`matej-mauler`** — no project-specific secrets needed (only shared `RESEND_API_KEY`).

### Testing notes

- `pokrok-game-web` sign-up requires Clerk email verification (6-digit code). To test authenticated features, you need a real email or a test account already set up in the Clerk dashboard.
- When running multiple projects simultaneously, explicitly set `PORT` to avoid conflicts (e.g. `PORT=3003 npm run dev` for ziju-life).

### `pokrok-shared` library

Run `npm run build` (or `npm run dev` for watch mode) inside `pokrok-shared/` before working on projects that import `@pokrok/shared`. The build output goes to `pokrok-shared/dist/`.
