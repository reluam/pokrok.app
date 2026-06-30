// The Price of a Life — scenario data + the pure "mirror" computation.
//
// IMPORTANT: every number below is ILLUSTRATIVE, not a real statistic. They are tuned for spread
// (~$1,500 → ~$34,000,000 per statistical life, ~4.4 orders of magnitude) so the final chart
// reveals how inconsistently we implicitly price a human life. Do not cite these as facts.
//
// pricePerLife = totalCost ÷ livesSaved over the scenario's stated horizon. Stored precomputed;
// the player is shown the inputs, not the division.

export type Scenario = {
  slug: string;
  /** Short, concrete situation — 1–2 sentences. */
  situation: string;
  /** What funding buys, e.g. "Install traffic lights". */
  measure: string;
  /** Human-readable cost line. */
  costLabel: string;
  /** Human-readable lives line. */
  livesLabel: string;
  /** Implicit price of one statistical life this decision represents. */
  pricePerLife: number;
};

export const SCENARIOS: Scenario[] = [
  {
    slug: "vaccination",
    situation:
      "A measles outbreak is spreading through a developing region. A vaccination drive could reach half a million children.",
    measure: "Fund the vaccination drive",
    costLabel: "$6 per child × 500,000 children — $3,000,000 one-time",
    livesLabel: "~2,000 child deaths averted",
    pricePerLife: 1_500,
  },
  {
    slug: "traffic-lights",
    situation:
      "A rural crossroads sees fatal collisions every year. Signalised lights would force traffic to stop.",
    measure: "Install traffic lights",
    costLabel: "$280,000 one-time · 25-year lifespan",
    livesLabel: "2 deaths/year prevented → ~50 over its life",
    pricePerLife: 5_600,
  },
  {
    slug: "icu-beds",
    situation:
      "The regional hospital turns away critical patients at capacity. Six more ICU beds (staffed) would change that.",
    measure: "Add 6 staffed ICU beds",
    costLabel: "$1,300,000 per year",
    livesLabel: "~9 extra survivals per year",
    pricePerLife: 144_000,
  },
  {
    slug: "air-filtration",
    situation:
      "A factory's emissions raise mortality in the neighbourhood downwind. Filtration would cut the pollution.",
    measure: "Install air filtration",
    costLabel: "$14,000,000 + $400,000/yr × 20 yrs — $22,000,000",
    livesLabel: "7 deaths/year prevented → ~140 over 20 yrs",
    pricePerLife: 157_000,
  },
  {
    slug: "underpass",
    situation:
      "Children cross a four-lane road to reach a school. A pedestrian underpass would take them off the road entirely.",
    measure: "Build a pedestrian underpass",
    costLabel: "$5,500,000 one-time · 40-year lifespan",
    livesLabel: "~7 children over its life",
    pricePerLife: 786_000,
  },
  {
    slug: "mine-safety",
    situation:
      "A working mine runs ageing safety gear. Replacing it would lower the accident rate for every shift underground.",
    measure: "Replace the safety equipment",
    costLabel: "$3,400,000 over a 30-year mine life",
    livesLabel: "~4 deaths prevented over that life",
    pricePerLife: 850_000,
  },
  {
    slug: "fire-station",
    situation:
      "A small town relies on the next town's fire crew — a 20-minute response. Its own station would cut that to minutes.",
    measure: "Build a local fire station",
    costLabel: "$2,800,000 + $900,000/yr × 20 yrs — $20,800,000",
    livesLabel: "1 death/year prevented → ~20 over 20 yrs",
    pricePerLife: 1_040_000,
  },
  {
    slug: "bus-seatbelts",
    situation:
      "The district's school buses have no seatbelts. Retrofitting the fleet would protect children in a crash.",
    measure: "Retrofit seatbelts across the fleet",
    costLabel: "$9,000 × 700 buses — $6,300,000 · 12-year lifespan",
    livesLabel: "~3 children over that period",
    pricePerLife: 2_100_000,
  },
  {
    slug: "speed-limit",
    situation:
      "Dropping the motorway limit would prevent crashes — at the cost of millions of commuters' time, every day.",
    measure: "Lower the speed limit",
    costLabel: "aggregate commuter time ≈ $48,000,000/year",
    livesLabel: "6 deaths/year prevented",
    pricePerLife: 8_000_000,
  },
  {
    slug: "rare-drug",
    situation:
      "Forty patients have a rare, fatal disease. A new drug keeps them alive — at an extraordinary price per patient.",
    measure: "Fund the drug",
    costLabel: "$850,000/patient/yr × 40 patients — $34,000,000/year",
    livesLabel: "~1 life saved per year",
    pricePerLife: 34_000_000,
  },
];

export type Decision = { slug: string; funded: boolean; pricePerLife: number };

export type Mirror = {
  reachedMirror: true;
  fundedCount: number;
  skippedCount: number;
  /** Highest price/life the player FUNDED (the most they'd pay). 0 if they funded nothing. */
  impliedFloor: number;
  /** Lowest price/life the player SKIPPED (the cheapest life they walked away from). Infinity if none. */
  impliedCeiling: number;
  /** # of skipped scenarios cheaper than the most expensive funded one — internal contradictions. */
  contradictions: number;
  /** Did they skip the far, cheapest life (vaccination) while funding something dearer? */
  distanceBias: boolean;
  /** maxFundedPrice / minFundedPrice. 0 if fewer than 1 funded; 1 if exactly one funded. */
  fundedSpanRatio: number;
  /** Slugs of skipped scenarios that sit below a funded one (rendered as contradictions). */
  contradictionSlugs: string[];
};

const VACCINATION_PRICE = 1_500;

/** Pure: turn the player's 10 decisions into the reveal payload. Order-independent. */
export function computeMirror(decisions: Decision[]): Mirror {
  const funded = decisions.filter((d) => d.funded);
  const skipped = decisions.filter((d) => !d.funded);

  const fundedPrices = funded.map((d) => d.pricePerLife);
  const impliedFloor = fundedPrices.length ? Math.max(...fundedPrices) : 0;
  const impliedCeiling = skipped.length ? Math.min(...skipped.map((d) => d.pricePerLife)) : Infinity;

  // A skipped life cheaper than the dearest life you funded contradicts your own threshold.
  const contradictionSlugs = skipped
    .filter((d) => d.pricePerLife < impliedFloor)
    .map((d) => d.slug);

  const vaccination = decisions.find((d) => d.pricePerLife === VACCINATION_PRICE);
  const distanceBias =
    !!vaccination && !vaccination.funded && impliedFloor > VACCINATION_PRICE;

  const minFunded = fundedPrices.length ? Math.min(...fundedPrices) : 0;
  const fundedSpanRatio = fundedPrices.length ? impliedFloor / minFunded : 0;

  return {
    reachedMirror: true,
    fundedCount: funded.length,
    skippedCount: skipped.length,
    impliedFloor,
    impliedCeiling,
    contradictions: contradictionSlugs.length,
    distanceBias,
    fundedSpanRatio,
    contradictionSlugs,
  };
}

/** Stable per-session shuffle (Fisher–Yates with an injected RNG) so the run isn't a tidy ramp. */
export function shuffledScenarios(rng: () => number = Math.random): Scenario[] {
  const a = [...SCENARIOS];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
