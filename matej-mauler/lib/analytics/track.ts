import posthog from "posthog-js";

// Pevně pojmenovaná sada eventů — žádné volné stringy roztroušené po kódu.
// Tohle jsou behaviorální eventy (jak se lidi chovají v experimentech),
// NE výsledky/insighty — ty jdou přes recordParticipation do Neon DB.
export type AnalyticsEvent =
  | "experiment_started"
  | "experiment_step"
  | "experiment_completed"
  | "experiment_dropoff";

// Tenký, bezpečný wrapper: no-op bez souhlasu / bez klíče / na serveru.
// Analytika nesmí nikdy shodit appku → vše v try/catch.
export function track(event: AnalyticsEvent, props?: Record<string, unknown>): void {
  try {
    if (!posthog.__loaded) return; // PostHog neinicializovaný (chybí klíč nebo SSR)
    if (posthog.has_opted_out_capturing()) return; // uživatel nedal souhlas
    posthog.capture(event, props);
  } catch {
    /* analytika je best-effort — tichý fail */
  }
}
