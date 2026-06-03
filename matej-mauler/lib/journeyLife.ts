import type { Lang } from "./dictionaries";

export type Stage = {
  id: string;
  emoji: string;
  age: { cs: string; en: string };
  title: { cs: string; en: string };
  text: { cs: string; en: string };
  hue: number; // barva pozadí v daném stádiu
};

export const stages: Stage[] = [
  {
    id: "conception", emoji: "🧬", hue: 280,
    age: { cs: "0. den", en: "Day 0" },
    title: { cs: "Početí", en: "Conception" },
    text: {
      cs: "Jedna ze 300 milionů spermií dorazí první. Potká vajíčko a vznikne 23+23 chromozomů — kompletní návod na celého člověka. Pravděpodobnost právě téhle kombinace byla mizivá. A přesto jsi tu.",
      en: "One of 300 million sperm gets there first. It meets the egg and 23+23 chromosomes form — the complete recipe for an entire human. The odds of exactly this combination were tiny. Yet here you are.",
    },
  },
  {
    id: "embryo", emoji: "🫧", hue: 250,
    age: { cs: "3.–8. týden", en: "Weeks 3–8" },
    title: { cs: "Zárodek", en: "Embryo" },
    text: {
      cs: "Z hrstky buněk se zakládá srdce, které začíná tlouct kolem 22. dne — dřív, než kdokoliv tuší, že existuješ. Tvoří se základ mozku a míchy. Velikost: zrnko rýže.",
      en: "From a handful of cells a heart forms and starts beating around day 22 — before anyone even knows you exist. The brain and spinal cord begin. Size: a grain of rice.",
    },
  },
  {
    id: "fetus", emoji: "👣", hue: 210,
    age: { cs: "9. týden – narození", en: "Week 9 – birth" },
    title: { cs: "Plod", en: "Fetus" },
    text: {
      cs: "Mozek vytváří až 250 000 neuronů za minutu. Ke konci slyšíš matčin hlas a chutnáš, co jí. Učíš se dřív, než se nadechneš.",
      en: "The brain makes up to 250,000 neurons a minute. Near the end you hear your mother's voice and taste what she eats. You learn before you take a breath.",
    },
  },
  {
    id: "baby", emoji: "👶", hue: 45,
    age: { cs: "0–2 roky", en: "0–2 years" },
    title: { cs: "Miminko", en: "Baby" },
    text: {
      cs: "Mozek má dvakrát víc synapsí než dospělý — saješ svět plnou silou. První slovo, první krok. Paměť ještě nedrží, proto si tohle období nikdy nevybavíš.",
      en: "The brain has twice as many synapses as an adult's — you soak the world in at full power. First word, first step. Memory doesn't stick yet, which is why you'll never recall any of this.",
    },
  },
  {
    id: "child", emoji: "🧒", hue: 90,
    age: { cs: "3–9 let", en: "3–9 years" },
    title: { cs: "Dítě", en: "Child" },
    text: {
      cs: "Vrchol fantazie a nekonečných „proč“. Jazyk jde sám od sebe, učíš se hrou. Tady se rodí základ osobnosti — a většina toho, co budeš celý život považovat za normální.",
      en: "Peak imagination and endless \"why?\". Language comes effortlessly, you learn by playing. Here the foundation of personality forms — and most of what you'll consider \"normal\" for life.",
    },
  },
  {
    id: "teen", emoji: "🧑", hue: 160,
    age: { cs: "10–19 let", en: "10–19 years" },
    title: { cs: "Teenager", en: "Teenager" },
    text: {
      cs: "Mozek se přestavuje odzadu dopředu — prefrontální kůra (rozhodování, brzdy) dozrává jako poslední, až kolem 25. Proto ta odvaha i blbosti. Hledáš, kdo vlastně jsi.",
      en: "The brain rewires back to front — the prefrontal cortex (judgment, brakes) matures last, around 25. Hence the courage and the nonsense. You're searching for who you are.",
    },
  },
  {
    id: "adult", emoji: "🧑‍💻", hue: 200,
    age: { cs: "20–39 let", en: "20–39 years" },
    title: { cs: "Dospělý", en: "Adult" },
    text: {
      cs: "Fyzický vrchol, plná kapacita mozku. Kariéra, vztahy, možná děti. Inteligence se mění z rychlé (zpracování) na krystalickou (zkušenost a moudrost), která dál roste.",
      en: "Physical peak, full brain capacity. Career, relationships, maybe kids. Intelligence shifts from fluid (processing speed) to crystallized (experience and wisdom), which keeps growing.",
    },
  },
  {
    id: "midlife", emoji: "🧔", hue: 30,
    age: { cs: "40–59 let", en: "40–59 years" },
    title: { cs: "Střední věk", en: "Midlife" },
    text: {
      cs: "Rychlost klesá, ale úsudek a zkušenost vrcholí. Často nejproduktivnější a nejstabilnější roky — i když je to období, kdy si lidé nejčastěji kladou otázku, jestli je to všechno.",
      en: "Speed declines, but judgment and experience peak. Often the most productive, stable years — even though it's when people most often ask \"is this all there is?\".",
    },
  },
  {
    id: "elder", emoji: "🧓", hue: 15,
    age: { cs: "60+ let", en: "60+ years" },
    title: { cs: "Stáří", en: "Old age" },
    text: {
      cs: "Tělo zpomaluje, ale mnozí jsou teď nejšťastnější za celý život — méně srovnávání, víc přijetí. Předáváš dál to, co jsi nasbíral. Moudrost je poslední, co odchází.",
      en: "The body slows, yet many are now the happiest of their whole life — less comparison, more acceptance. You pass on what you've gathered. Wisdom is the last thing to go.",
    },
  },
  {
    id: "end", emoji: "🪦", hue: 0,
    age: { cs: "Konec", en: "The end" },
    title: { cs: "Hrob", en: "The grave" },
    text: {
      cs: "Průměrně ~4000 týdnů. Z miliard nepravděpodobných náhod vznikl jeden život — tvůj. Co s ním uděláš mezi začátkem a tímhle koncem, je to jediné, co je opravdu na tobě.",
      en: "On average ~4,000 weeks. Out of billions of improbable accidents, one life emerged — yours. What you do with it between the start and this end is the only thing truly up to you.",
    },
  },
];

export const journeyUi = {
  cs: {
    back: "← Spaghetti.ltd",
    title: "The Journey",
    intro: "Od první buňky až po poslední dech.",
    scrollHint: "Scrolluj →",
    of: "z",
  },
  en: {
    back: "← Spaghetti.ltd",
    title: "The Journey",
    intro: "From the first cell to the last breath.",
    scrollHint: "Scroll →",
    of: "of",
  },
} as const;

export type JLang = Lang;
