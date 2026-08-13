import type { Bi } from "@/lib/about";

/**
 * Sdílený tvar obou vrstev sekce „Jak to vidím": trojúhelníku přesvědčení
 * (tenhle soubor) i kruhu pravidel (lib/site/thoughts.ts).
 * Všechno v první osobě — nejsou to rady čtenáři, ale co si Matěj myslí o sobě.
 */
export type Conviction = {
  id: string;
  claim: Bi;
  support: Bi;
};

/** ▲ Jak to podle mě je. Nesmí se překrývat s RULES. */
export const BELIEFS: Conviction[] = [
  {
    id: "zodpovednost",
    claim: {
      cs: "Za svůj život jsem zodpovědný jenom já.",
      en: "I alone am responsible for my life.",
    },
    support: {
      cs: "Mám podporu. Ta rozhodnutí se stejně každé ráno objeví s mým jménem.",
      en: "I have support. The decisions still show up every morning with my name on them.",
    },
  },
  {
    id: "cernobile",
    claim: {
      cs: "Skoro nic není jenom černobílé.",
      en: "Almost nothing is only black and white.",
    },
    support: {
      cs: "Buď práce, nebo svoboda. Buď rodina, nebo kariéra. Roky jsem v tom byl zaseklý a ani jedna ta dvojice nebyla skutečná.",
      en: "Work or freedom. Family or career. I spent years stuck inside those, and neither pair was real.",
    },
  },
  {
    id: "mozek",
    claim: {
      cs: "Můj mozek je hloupější, než si myslím.",
      en: "My brain is dumber than I think.",
    },
    support: {
      cs: "Většinu času jedu na autopilota. Stavím kolem toho, místo abych se s ním hádal.",
      en: "Most of the time I run on autopilot. I build around that instead of arguing with it.",
    },
  },
];
