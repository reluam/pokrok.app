// Klient-safe konstanty pro texty homepage (žádný server-only import jako next/cache).
// Sdílí je admin UI (klient) i serverová DB vrstva (siteTextsDb).

/** Texty hlavní stránky editovatelné v adminu — override nad defaulty v lib/dictionaries. */
export const TEXT_GROUPS: { group: string; keys: string[] }[] = [
  { group: "hero", keys: ["hero.name", "hero.tagline", "hero.sub"] },
  { group: "products", keys: ["products.title", "products.subtitle"] },
  { group: "about", keys: ["about.p1", "about.p2", "about.p3", "about.p4", "about.contactHeading", "about.contactLead", "about.discordNote", "about.emailNote", "about.facebookNote"] },
];
