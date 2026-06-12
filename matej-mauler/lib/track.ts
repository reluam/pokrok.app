// Klientské počítadlo návštěv/interakcí projektů — jednou za session (sessionStorage),
// fire-and-forget, žádná identifikace uživatele (jen +1 v denním čítači).
export type TrackKind = "open" | "interact";

export function track(slug: string, kind: TrackKind): void {
  try {
    if (typeof window === "undefined") return;
    const key = `trk:${slug}:${kind}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, kind }),
      keepalive: true,
    }).catch(() => {});
  } catch {}
}
