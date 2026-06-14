import type { Bilingual } from "@/lib/space";

export type { Bilingual };

/** Kategorie hesla = svět, ze kterého pochází — barví mapu a planetu, vše rendruje jednotný shell. */
export type RealmId =
  | "space" | "plain"
  | "hitchhiker" | "futurama" | "simpsons" | "reddwarf" | "southpark" | "office" | "topgear" | "rickmorty";

/** Klikatelná synapse (nudle) k jinému heslu. Cíl může být existující heslo i červený odkaz. */
export type Satellite = {
  to: string;            // slug cílového hesla
  x: number; y: number;  // historické pozice (layout dnes počítá Strands automaticky)
  object?: string;       // space: klíč do OBJECTS (vizuál tělesa)
  emoji?: string;        // vizuál pro brány bez tělesa
  size?: number;
  label?: Bilingual;     // přepis popisku (default: titul cíle / SEEDS)
};

export type NodeDef = {
  slug: string;
  realm: RealmId;
  title: Bilingual;
  guide: Bilingual;      // vtipná definice termínu
  up?: string;           // obecnější heslo (scroll nahoru / Esc, když není breadcrumb)
  next?: string;         // kanonická trasa do hloubky (scroll dolů)
  textPos?: "center" | "top"; // top = střed patří interaktivnímu prvku (citáty, pravděpodobnost)
  subject?: { object: string; size?: number }; // space: vizuál tělesa uprostřed
  plain?: { glyph?: string; accent?: string }; // ostatní: znak/emoji uprostřed
  satellites?: Satellite[];
  features?: Bilingual[]; // zajímavosti — u space je cykluje klik na těleso
  links?: { href: string; label: Bilingual }[]; // obyčejné odkazy pod textem
};
