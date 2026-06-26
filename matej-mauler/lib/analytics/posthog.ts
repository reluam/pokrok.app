// PostHog config — env-guarded like Clerk: aktivuje se jen když je klíč v prostředí,
// takže web builduje i běží i bez něj (žádný 500, žádné lokální .env potřeba).
// Klíč phc_… je veřejný (běží v prohlížeči) — to je u PostHogu normální.
export const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY ?? "";
export const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://eu.i.posthog.com";

// Bez klíče PostHog spí — provider, banner i track() jsou no-op.
export const posthogEnabled = POSTHOG_KEY.length > 0;
