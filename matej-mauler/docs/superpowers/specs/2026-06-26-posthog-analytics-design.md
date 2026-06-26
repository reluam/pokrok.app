# PostHog analytics — design

**Date:** 2026-06-26
**Status:** implemented

## Goal

Pochopit, jak lidi interagují s webem a experimenty — které experimenty táhnou,
kde lidi odpadávají, co je nebaví, kde se nechovají dle očekávání. Ne page-view
statistika, ale behaviorální / funnel data + session replay.

## Decisions

- **Tool:** PostHog (funnely, session replay, heatmapy, autocapture).
- **Hosting:** PostHog Cloud EU (Frankfurt) — GDPR-friendly, data nele­ží v USA.
- **Privacy:** plný režim (cookies + session replay), ale **opt-in přes consent banner**.
  Před souhlasem PostHog běží v `memory` + opted-out (nic neukládá, žádné cookies).
- **Scope (1. kolo):** autocapture + pageviews + session replay globálně, typovaný
  `track()` helper, instrumentace driftbloom jako vzor pro ostatní experimenty.

## Architecture

| Soubor | Účel |
|---|---|
| `lib/analytics/posthog.ts` | Konfig (key/host) + `posthogEnabled` flag. Env-guarded jako Clerk. |
| `lib/analytics/track.ts` | Typovaný `track(event, props)` — no-op bez souhlasu/klíče/SSR. |
| `components/analytics/PostHogProvider.tsx` | Init, consent context, manuální pageviews (Suspense), montáž banneru + identify. |
| `components/analytics/ConsentBanner.tsx` | Opt-in/out banner ve spaghetti hlasu. |
| `components/analytics/ClerkIdentify.tsx` | `posthog.identify(clerkUserId)` jen u přihlášených (gate `clerkEnabled`). |

Provider se montuje v `app/layout.tsx` uvnitř `inner` (tedy pod ClerkProviderem,
když je Clerk zapnutý → identify má přístup k `useUser`).

## Data flow & vztah k recordParticipation

Dvě oddělené vrstvy, které se nepletou:

- **recordParticipation** (beze změny) = *výsledek/insight* člověka, trvalý v Neon DB,
  vázaný na Spaghetti účet, badge z něj čtou.
- **PostHog** (nové) = *chování* — kudy klikal, kde zaváhal, co navštěvuje. Efemérní
  produktová analytika. Žádné PII v event props (jen slug experimentu + krok/éra).

Vazba je volná: `posthog.identify(clerkUserId)` po souhlasu u přihlášených;
anonymní zůstávají anonymní (`person_profiles: "identified_only"`).

## Events (driftbloom vzor)

- `experiment_started` — start hry (mount / restart).
- `experiment_step` — `advance()` éra → drop-off funnel (kolik ér lidi dohrají).
- `experiment_completed` — výsledek (won, playerBiomes, era).
- `experiment_dropoff` — vyhrazeno pro budoucí explicitní opuštění.

## Env (Vercel, žádné lokální .env)

```
NEXT_PUBLIC_POSTHOG_KEY  = phc_…
NEXT_PUBLIC_POSTHOG_HOST = https://eu.i.posthog.com
```

Bez klíče celá vrstva spí (provider/banner/track no-op) → web builduje i běží beze změny.

## Out of scope (YAGNI)

- Žádný Google Analytics, žádné druhé řešení paralelně (Vercel Analytics zůstává).
- Žádná plná instrumentace všech experimentů teď — jen driftbloom.
- Žádný vlastní admin dashboard — data se čtou v PostHog UI.

## Tests

`lib/analytics/track.test.ts` — consent gating (no-op bez souhlasu / bez klíče / SSR,
nikdy nehodí výjimku).
