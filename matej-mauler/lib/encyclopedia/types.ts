import type { Bilingual } from "@/lib/space";

export type { Bilingual };

export type RealmId = "space"; // později: "sound" | "music" | …

/** Klikatelná synapse umístěná kolem subjektu. Cíl může být existující heslo i červený odkaz. */
export type Satellite = {
  to: string;            // slug cílového hesla
  x: number; y: number;  // pozice v % viewportu — vždy mimo centrální textovou zónu!
  object?: string;       // space: klíč do OBJECTS (vizuál tělesa); bez něj = zářící bod
  size?: number;         // px vizuálu
  label?: Bilingual;     // přepis popisku (default: titul cíle / SEEDS)
};

export type NodeDef = {
  slug: string;
  realm: RealmId;
  title: Bilingual;
  guide: Bilingual;      // průvodcovský text uprostřed přes subjekt
  up?: string;           // obecnější heslo (scroll nahoru / Esc, když není breadcrumb)
  next?: string;         // kanonická trasa do hloubky (scroll dolů)
  subject?: { object: string; size?: number }; // centrální vizuál; bez něj jen pozadí realmu
  satellites?: Satellite[];
  features?: Bilingual[]; // neklikatelné zajímavosti (řádek pod textem)
};
