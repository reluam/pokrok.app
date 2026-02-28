# AGENTS.md

## Cursor Cloud specific instructions

### Codebase overview

This is a monorepo with 6 independent Next.js web projects (no monorepo tooling — each has its own `package.json` + `package-lock.json`) and 2 SwiftUI native apps (iOS/macOS, not buildable on Linux).

| Project | Port | External deps | Notes |
|---|---|---|---|
| `matej-mauler` | 3000 | Resend (optional) | Simplest app; no DB or auth. Good for quick dev verification. |
| `smysluplne-ziti` | 3001 | Neon Postgres, Resend | Next.js 14; uses `pg` client directly |
| `pokrok-game-web` | 3000 | Neon Postgres, Clerk, Resend, Google AI | Main product; Next.js 16 with `next-intl` |
| `cccp` | 3000 | Neon Postgres, Clerk, Google Calendar, Resend | Coach CRM; Next.js 16 |
| `ziju-life` | 3000 | Neon Postgres, Google Calendar, Resend | Brand website; Next.js 16 |
| `pokrok-shared` | — | None | Shared TypeScript types; must `npm run build` before other projects that import it |

### Running dev servers

Each project runs independently via `npm run dev` from its own directory. Default port is 3000 except `smysluplne-ziti` (port 3001). To run multiple apps simultaneously, set different ports via `PORT=30XX npm run dev`.

### Linting

- `matej-mauler`: `npm run lint` (uses `eslint .`)
- `smysluplne-ziti`: `npm run lint` (uses `next lint`; works on Next.js 14)
- `pokrok-game-web`, `cccp`: `npm run lint` currently broken — `next lint` on Next.js 16 errors with "Invalid project directory" (pre-existing; needs ESLint flat config migration)
- `ziju-life`: `npm run lint` runs `eslint` with no file args; needs `eslint.config.mjs` present (exists, but prints help output without file patterns)

### Build caveats

- `matej-mauler`: `npm run build` has a pre-existing TS error in `ProjectsCarousel.tsx` (type comparison mismatch). Dev server is unaffected.
- `smysluplne-ziti`: `npm run build` fails if `RESEND_API_KEY` is missing — the Resend client is instantiated at module scope. Dev server starts fine without it.
- Projects needing Clerk (`pokrok-game-web`, `cccp`) will fail to build/run without `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY`.

### Environment variables (per-project secrets)

Since each project has its own database and auth setup, Cursor Cloud secrets use project-prefixed names. The update script auto-generates `.env.local` files from these env vars.

**Shared secrets:**

| Secret name | Used by | Required? |
|---|---|---|
| `RESEND_API_KEY` | all projects | Optional (contact forms 500 without it; `smysluplne-ziti` build fails without it) |

**`pokrok-game-web` secrets:**

| Cursor Cloud secret | Maps to `.env.local` var | Required? |
|---|---|---|
| `POKROK_DATABASE_URL` | `DATABASE_URL` | Yes (DB queries fail without it, but dev server starts) |
| `POKROK_CLERK_PUBLISHABLE_KEY` | `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Yes (Clerk middleware blocks all routes) |
| `POKROK_CLERK_SECRET_KEY` | `CLERK_SECRET_KEY` | Yes (Clerk middleware blocks all routes) |
| `POKROK_ENCRYPTION_MASTER_KEY` | `ENCRYPTION_MASTER_KEY` | Optional (encryption features) |
| `POKROK_GEMINI_API_KEY` | `GEMINI_API_KEY` | Optional (AI assistant) |

**`cccp` secrets:**

| Cursor Cloud secret | Maps to `.env.local` var | Required? |
|---|---|---|
| `CCCP_DATABASE_URL` | `DATABASE_URL` | Yes (DB queries fail without it, but dev server starts) |
| `CCCP_CLERK_PUBLISHABLE_KEY` | `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Yes (Clerk auth) |
| `CCCP_CLERK_SECRET_KEY` | `CLERK_SECRET_KEY` | Yes (Clerk auth) |
| `CCCP_GOOGLE_CLIENT_ID` | `GOOGLE_CLIENT_ID` | Optional (Google Calendar) |
| `CCCP_GOOGLE_CLIENT_SECRET` | `GOOGLE_CLIENT_SECRET` | Optional (Google Calendar) |

**`ziju-life` secrets:**

| Cursor Cloud secret | Maps to `.env.local` var | Required? |
|---|---|---|
| `ZIJU_DATABASE_URL` | `DATABASE_URL` | Yes (DB queries fail without it, but dev server starts) |
| `ZIJU_ADMIN_PASSWORD` | `ADMIN_PASSWORD` | Optional (admin panel) |
| `ZIJU_GOOGLE_CLIENT_ID` | `GOOGLE_CLIENT_ID` | Optional (Google Calendar) |
| `ZIJU_GOOGLE_CLIENT_SECRET` | `GOOGLE_CLIENT_SECRET` | Optional (Google Calendar) |

**`smysluplne-ziti` secrets:**

| Cursor Cloud secret | Maps to `.env.local` var | Required? |
|---|---|---|
| `SMYSLUPLNE_DATABASE_URL` | `DATABASE_URL` | Yes (throws error without it) |
| `SMYSLUPLNE_ADMIN_PASSWORD` | `ADMIN_PASSWORD` | Optional (admin panel) |

**`matej-mauler`** — no project-specific secrets needed (only shared `RESEND_API_KEY`).

Refer also to `.env.example` / `.env.local.example` files in each project directory for the full list of available variables.

### `pokrok-shared` library

Run `npm run build` (or `npm run dev` for watch mode) inside `pokrok-shared/` before working on projects that import `@pokrok/shared`. The build output goes to `pokrok-shared/dist/`.
