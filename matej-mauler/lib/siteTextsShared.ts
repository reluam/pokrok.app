// Klient-safe konstanty pro texty homepage (žádný server-only import jako next/cache).
// Sdílí je admin UI (klient) i serverová DB vrstva (siteTextsDb).

/** Texty hlavní stránky editovatelné v adminu — override nad defaulty v lib/dictionaries. */
export const TEXT_GROUPS: { group: string; keys: string[] }[] = [
  { group: "hero", keys: ["hero.name", "hero.tagline", "hero.sub"] },
  { group: "products", keys: ["products.title", "products.subtitle"] },
];
