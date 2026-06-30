// The Price of a Life — scenario data + the pure "mirror" computation.
//
// You play a government deciding whether to fund a life-saving measure. The 20 scenarios come in
// 10 MATCHED PAIRS: the two halves of a pair cost exactly the same and save exactly the same
// number of lives — so they carry the SAME price per statistical life. The only thing that differs
// is WHO is saved (schoolchildren vs miners, locals vs foreigners, newborns vs the very old…).
// The final mirror surfaces the pairs where the player gave OPPOSITE answers to the same price —
// proof that it wasn't the math deciding, it was who the people were.
//
// IMPORTANT: every number is ILLUSTRATIVE, not a real statistic. Costs and lives are kept round so
// the price per life is a clean number and the player barely has to do arithmetic.

export type Scenario = {
  slug: string;
  /** Two scenarios share a pairId: same cost, same lives, same price — different people. */
  pairId: string;
  /** Short label for who is saved, e.g. "schoolchildren". */
  who: string;
  /** The conventionally more-relatable side of the pair (children, locals, the blameless…). */
  relatable: boolean;
  /** One concrete sentence. */
  situation: string;
  cost: number;
  lives: number;
  /** cost ÷ lives — stored so display never has to divide. */
  pricePerLife: number;
};

// Helper to keep the table tight and guarantee pricePerLife stays consistent with cost/lives.
const s = (
  slug: string,
  pairId: string,
  who: string,
  relatable: boolean,
  situation: string,
  cost: number,
  lives: number,
): Scenario => ({ slug, pairId, who, relatable, situation, cost, lives, pricePerLife: cost / lives });

export const SCENARIOS: Scenario[] = [
  // P1 — $200,000 / life
  s("guardrail-children", "guardrail", "schoolchildren", true,
    "A mountain road with no guardrail is used by a school bus. A barrier would stop a bus from going over the edge.",
    600_000, 3),
  s("guardrail-miners", "guardrail", "mine workers", false,
    "The same unguarded mountain road is used by a mine's shuttle bus. A barrier would stop it going over the edge.",
    600_000, 3),

  // P2 — $50,000 / life
  s("flu-local", "flu", "the elderly at home", true,
    "Flu vaccines for 40 frail residents of a care home in your own country.",
    2_000_000, 40),
  s("flu-foreign", "flu", "the elderly abroad", false,
    "Flu vaccines for 40 frail residents of a care home in a country far away.",
    2_000_000, 40),

  // P3 — $5,000,000 / life
  s("trial-newborns", "trial", "newborns", true,
    "An experimental treatment is the only hope for 2 newborns in intensive care.",
    10_000_000, 2),
  s("trial-elderly", "trial", "people in their 80s", false,
    "The same experimental treatment is the only hope for 2 patients in their 80s.",
    10_000_000, 2),

  // P4 — $300,000 / life
  s("gear-firefighters", "gear", "firefighters", true,
    "New protective gear would keep 10 city firefighters from dying on the job.",
    3_000_000, 10),
  s("gear-rig", "gear", "oil-rig workers", false,
    "The same gear would keep 10 offshore oil-rig workers from dying on the job.",
    3_000_000, 10),

  // P5 — $100,000 / life
  s("smoke-families", "smoke", "families at home", true,
    "Smoke detectors fitted across a district's family homes would prevent about 20 deaths.",
    2_000_000, 20),
  s("smoke-shelter", "smoke", "people in a shelter", false,
    "Smoke detectors fitted across the city's homeless shelters would prevent about 20 deaths.",
    2_000_000, 20),

  // P6 — $2,000,000 / life
  s("drug-children", "drug", "children", true,
    "A costly drug would save 3 children with a rare disease.",
    6_000_000, 3),
  s("drug-adults", "drug", "adults", false,
    "The same drug would save 3 adults with the same rare disease.",
    6_000_000, 3),

  // P7 — $400,000 / life
  s("crossing-school", "crossing", "children", true,
    "A crossing and lights outside a primary school would save about 5 children.",
    2_000_000, 5),
  s("crossing-factory", "crossing", "factory workers", false,
    "The same crossing and lights outside a factory gate would save about 5 workers.",
    2_000_000, 5),

  // P8 — $20,000 / life
  s("water-citizens", "water", "citizens", true,
    "Clean water for 100 people in a poor region of your own country.",
    2_000_000, 100),
  s("water-migrants", "water", "migrants", false,
    "Clean water for 100 people in a migrant camp at the border.",
    2_000_000, 100),

  // P9 — $800,000 / life (class, not sympathy — neither side flagged relatable)
  s("ambulance-suburb", "ambulance", "a wealthy suburb", false,
    "A second ambulance for a wealthy suburb would save about 4 lives a year.",
    3_200_000, 4),
  s("ambulance-poor", "ambulance", "a poor district", false,
    "A second ambulance for a poor district across town would save about 4 lives a year.",
    3_200_000, 4),

  // P10 — $1,000,000 / life
  s("liver-accident", "liver", "accident victims", true,
    "A liver treatment would save 4 people whose livers failed after an accident.",
    4_000_000, 4),
  s("liver-drinkers", "liver", "heavy drinkers", false,
    "The same treatment would save 4 people whose livers failed from heavy drinking.",
    4_000_000, 4),
];

export type Decision = { slug: string; funded: boolean };

/** One matched pair, resolved against the player's two answers. */
export type PairResult = {
  pairId: string;
  price: number;
  /** "both" funded, "none" funded, or "split" (one funded, one not). */
  status: "both" | "none" | "split";
  fundedWho: string | null; // set when split
  skippedWho: string | null; // set when split
  /** On a split, did the player fund the more-relatable side and skip the less-relatable one? */
  comfort: boolean;
  a: Scenario;
  b: Scenario;
};

export type Mirror = {
  reachedMirror: true;
  fundedCount: number;
  skippedCount: number;
  /** Pairs where the same price got opposite answers. */
  flips: number;
  /** Split pairs where the funded side was the more-relatable one. */
  comfortFlips: number;
  pairs: PairResult[]; // all 10, sorted ascending by price (for the chart)
};

/** Pure: turn the player's 20 decisions into the reveal payload. Order-independent. */
export function computeMirror(decisions: Decision[]): Mirror {
  const funded = new Map(decisions.map((d) => [d.slug, d.funded]));
  const fundedCount = decisions.filter((d) => d.funded).length;

  const byPair = new Map<string, Scenario[]>();
  for (const sc of SCENARIOS) {
    const list = byPair.get(sc.pairId) ?? [];
    list.push(sc);
    byPair.set(sc.pairId, list);
  }

  const pairs: PairResult[] = [];
  for (const [pairId, [a, b]] of byPair) {
    const af = !!funded.get(a.slug);
    const bf = !!funded.get(b.slug);
    const status: PairResult["status"] = af && bf ? "both" : !af && !bf ? "none" : "split";

    let fundedWho: string | null = null;
    let skippedWho: string | null = null;
    let comfort = false;
    if (status === "split") {
      const fundedScn = af ? a : b;
      const skippedScn = af ? b : a;
      fundedWho = fundedScn.who;
      skippedWho = skippedScn.who;
      comfort = fundedScn.relatable && !skippedScn.relatable;
    }
    pairs.push({ pairId, price: a.pricePerLife, status, fundedWho, skippedWho, comfort, a, b });
  }

  pairs.sort((x, y) => x.price - y.price);
  const flips = pairs.filter((p) => p.status === "split").length;
  const comfortFlips = pairs.filter((p) => p.comfort).length;

  return {
    reachedMirror: true,
    fundedCount,
    skippedCount: decisions.length - fundedCount,
    flips,
    comfortFlips,
    pairs,
  };
}

/** Stable per-session shuffle (Fisher–Yates with an injected RNG) so pairs aren't adjacent. */
export function shuffledScenarios(rng: () => number = Math.random): Scenario[] {
  const a = [...SCENARIOS];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
