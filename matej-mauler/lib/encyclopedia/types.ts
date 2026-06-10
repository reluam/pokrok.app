import type { Bilingual } from "@/lib/space";

export type { Bilingual };

export type RealmId = "space" | "sound"; // později: "music" | …

/** Klikatelná synapse umístěná kolem subjektu. Cíl může být existující heslo i červený odkaz. */
export type Satellite = {
  to: string;            // slug cílového hesla
  x: number; y: number;  // pozice v % viewportu — vždy mimo centrální textovou zónu!
  object?: string;       // space: klíč do OBJECTS (vizuál tělesa); bez něj = zářící bod
  size?: number;         // px vizuálu
  label?: Bilingual;     // přepis popisku (default: titul cíle / SEEDS)
};

/** Konfigurace zvukové scény (SoundRealm) — dříve Sec v SoundBlasterBook. */
export type SoundSceneDef = {
  freqMul: number; gainMul: number; filter: number; rows: number;
  medium: "air" | "water" | "solid" | "space";
  mode?: "flow" | "disk" | "reflect" | "compare";
  interactive?: "freq" | "amp" | "medium" | "wave";
  tracer?: boolean;
};

export type NodeDef = {
  slug: string;
  realm: RealmId;
  title: Bilingual;
  guide: Bilingual;      // průvodcovský text přes subjekt
  up?: string;           // obecnější heslo (scroll nahoru / Esc, když není breadcrumb)
  next?: string;         // kanonická trasa do hloubky (scroll dolů)
  theme?: "dark" | "light"; // barva chrome+textu; default dark (vesmír), sound je světlý
  textPos?: "center" | "top"; // kde leží text — top u scén, kde střed patří hřišti (zvuková vlna)
  subject?: { object: string; size?: number }; // centrální vizuál (space)
  sound?: SoundSceneDef; // konfigurace zvukové scény (sound)
  satellites?: Satellite[];
  features?: Bilingual[]; // neklikatelné zajímavosti (řádek pod textem)
};
