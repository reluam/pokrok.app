import { SCALES } from "./music";
import type { Lang } from "./dictionaries";

export type AOption = {
  id: string;
  label: { cs: string; en: string };
  frag: { cs: string; en: string };  // útržek do názvu hymny
  minor?: boolean;                     // přitáhne k mollové (tragičtější)
  energy?: number;                     // 0..1 ovlivní tempo/hustotu
};
export type AQuestion = { id: string; text: { cs: string; en: string }; options: AOption[] };

export const questions: AQuestion[] = [
  {
    id: "life", text: { cs: "Jak bys popsal svůj život?", en: "How would you describe your life?" },
    options: [
      { id: "neveragain", label: { cs: "Nikdy víc", en: "Never again" }, frag: { cs: "Nikdy víc", en: "Never Again" }, minor: true },
      { id: "horror", label: { cs: "Horor", en: "Horror" }, frag: { cs: "Věčného hororu", en: "Eternal Horror" }, minor: true, energy: 0.8 },
      { id: "catastrophe", label: { cs: "Katastrofa", en: "Catastrophe" }, frag: { cs: "Tiché katastrofy", en: "A Quiet Catastrophe" }, minor: true },
      { id: "meh", label: { cs: "Tak nějak… nic", en: "Kinda… nothing" }, frag: { cs: "Vlažné prázdnoty", en: "Lukewarm Emptiness" } },
    ],
  },
  {
    id: "morning", text: { cs: "Jak vypadají tvoje rána?", en: "What are your mornings like?" },
    options: [
      { id: "void", label: { cs: "Probuzení do prázdna", en: "Waking into the void" }, frag: { cs: "Ranní prázdnoty", en: "Morning Void" }, minor: true },
      { id: "survival", label: { cs: "Boj o přežití", en: "A fight for survival" }, frag: { cs: "Denního boje", en: "Daily Struggle" }, energy: 0.9 },
      { id: "fog", label: { cs: "Mlha", en: "Fog" }, frag: { cs: "Husté mlhy", en: "Thick Fog" } },
      { id: "crisis", label: { cs: "Existenční krize", en: "Existential crisis" }, frag: { cs: "Existenční krize", en: "Existential Crisis" }, minor: true },
    ],
  },
  {
    id: "monday", text: { cs: "Tvůj vztah k pondělkům?", en: "Your relationship with Mondays?" },
    options: [
      { id: "terror", label: { cs: "Čistá hrůza", en: "Pure terror" }, frag: { cs: "Pondělní hrůzy", en: "Monday Terror" }, minor: true, energy: 0.7 },
      { id: "resign", label: { cs: "Rezignace", en: "Resignation" }, frag: { cs: "Tiché rezignace", en: "Quiet Resignation" } },
      { id: "panic", label: { cs: "Panika", en: "Panic" }, frag: { cs: "Sladké paniky", en: "Sweet Panic" }, energy: 1 },
      { id: "numb", label: { cs: "Otupělost", en: "Numbness" }, frag: { cs: "Blažené otupělosti", en: "Blissful Numbness" } },
    ],
  },
  {
    id: "alarm", text: { cs: "Co cítíš, když zazvoní budík?", en: "What do you feel when the alarm rings?" },
    options: [
      { id: "betrayal", label: { cs: "Zradu", en: "Betrayal" }, frag: { cs: "Zrazeného srdce", en: "A Betrayed Heart" }, minor: true },
      { id: "rage", label: { cs: "Vztek", en: "Rage" }, frag: { cs: "Spravedlivého vzteku", en: "Righteous Rage" }, energy: 1 },
      { id: "sorrow", label: { cs: "Smutek", en: "Sorrow" }, frag: { cs: "Hlubokého smutku", en: "Deep Sorrow" }, minor: true },
      { id: "dead", label: { cs: "Nic, jsem mrtvý uvnitř", en: "Nothing, I'm dead inside" }, frag: { cs: "Mrtvého nitra", en: "A Dead Inside" }, minor: true },
    ],
  },
  {
    id: "motto", text: { cs: "Tvoje životní motto?", en: "Your life motto?" },
    options: [
      { id: "worse", label: { cs: "Mohlo to být horší (asi)", en: "Could be worse (probably)" }, frag: { cs: "Mohlo to být horší", en: "Could Be Worse" } },
      { id: "atleast", label: { cs: "Aspoň že tak", en: "At least there's that" }, frag: { cs: "Aspoň že tak", en: "At Least There's That" } },
      { id: "whatever", label: { cs: "Co se dá dělat", en: "Whatever, what can you do" }, frag: { cs: "Odevzdaného osudu", en: "Surrendered Fate" } },
      { id: "silent", label: { cs: "Trpět v tichosti", en: "Suffer in silence" }, frag: { cs: "Tichého utrpení", en: "Silent Suffering" }, minor: true },
    ],
  },
  {
    id: "future", text: { cs: "Tvoje budoucnost?", en: "Your future?" },
    options: [
      { id: "dark", label: { cs: "Temná", en: "Dark" }, frag: { cs: "Temných zítřků", en: "Dark Tomorrows" }, minor: true },
      { id: "uncertain", label: { cs: "Nejistá", en: "Uncertain" }, frag: { cs: "Věčné nejistoty", en: "Eternal Uncertainty" } },
      { id: "cancelled", label: { cs: "Zrušená", en: "Cancelled" }, frag: { cs: "Zrušené budoucnosti", en: "A Cancelled Future" }, energy: 0.6 },
      { id: "soldout", label: { cs: "Vyprodáno", en: "Sold out" }, frag: { cs: "Vyprodaných nadějí", en: "Sold-Out Hopes" } },
    ],
  },
];

export type Answers = Record<string, string>;

/* ── Generátor hymny ───────────────────────────────────────────── */

export type AnthemNote = { step: number; midi: number; dur: number };
export type Anthem = {
  title: { cs: string; en: string };
  verdict: { cs: string; en: string };
  tempo: number; root: number; scaleName: string; minor: boolean;
  melody: AnthemNote[];
  chords: number[];     // 4 stupně, 1 na takt (2 takty × opakování)
  bars: number;
};

function hash(s: string): number { let h = 5381; for (let i = 0; i < s.length; i++) h = (h * 33) ^ s.charCodeAt(i); return h >>> 0; }
function rng(seed: number) { let s = seed >>> 0 || 1; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }

const GRAND_CS = ["Hymna", "Óda", "Fanfára", "Pochod", "Slavnostní znělka"];
const GRAND_EN = ["Anthem", "Ode", "Fanfare", "March", "Ceremonial Jingle"];
const VERDICT_CS = [
  "Hraj nahlas. Soused ať trpí s tebou.",
  "Tahle znělka tě přežije. Bohužel.",
  "Národ by povstal. Kdyby měl sílu.",
  "Doporučená hlasitost: maximální. Doporučená nálada: žádná.",
];
const VERDICT_EN = [
  "Play it loud. Let the neighbours suffer with you.",
  "This jingle will outlive you. Sadly.",
  "A nation would rise. If it had the strength.",
  "Recommended volume: max. Recommended mood: none.",
];

export function buildAnthem(answers: Answers, variation = 0): Anthem {
  const chosen = questions.map((q) => q.options.find((o) => o.id === answers[q.id])).filter(Boolean) as AOption[];
  const seed = hash(Object.values(answers).join("|") + "#" + variation);
  const r = rng(seed);

  const minorVotes = chosen.filter((c) => c.minor).length;
  const minor = minorVotes >= 3;
  const energy = chosen.reduce((a, c) => a + (c.energy ?? 0.4), 0) / Math.max(1, chosen.length);
  const tempo = Math.round(82 + energy * 30 + (r() * 8 - 4)); // ~80–116
  const root = 50 + Math.floor(r() * 5);
  const scaleName = minor ? "minorPenta" : "major";

  // název + verdikt
  const frags = [...chosen].sort(() => r() - 0.5).slice(0, 2);
  const grandI = Math.floor(r() * GRAND_CS.length);
  const title = {
    cs: `${GRAND_CS[grandI]}: ${frags.map((f) => f.frag.cs).join(" & ")}`,
    en: `${GRAND_EN[grandI]}: ${frags.map((f) => f.frag.en).join(" & ")}`,
  };
  const vi = Math.floor(r() * VERDICT_CS.length);
  const verdict = { cs: VERDICT_CS[vi], en: VERDICT_EN[vi] };

  // harmonie: vznešená progrese
  const chords = minor ? [0, 5, 3, 4] : [0, 3, 4, 0];

  // fanfárová melodie (2 takty × 8 kroků = 16, krok = osmina)
  const sc = SCALES[scaleName];
  const noteFor = (deg: number, oct: number) => root + 12 * oct + sc[((deg % sc.length) + sc.length) % sc.length];
  const melody: AnthemNote[] = [];
  const phrasePatterns = [
    [0, 2, 4, 7, 4, 2, 0, 0],
    [0, 4, 2, 4, 7, 7, 7, 7],
    [7, 4, 2, 0, 2, 4, 7, 7],
    [0, 0, 4, 4, 7, 7, 11, 7],
  ];
  const pat = phrasePatterns[Math.floor(r() * phrasePatterns.length)];
  let step = 0;
  for (let bar = 0; bar < 2; bar++) {
    for (let i = 0; i < pat.length; i++) {
      const dur = i === pat.length - 1 ? 2 : (r() > 0.7 ? 2 : 1);
      melody.push({ step, midi: noteFor(pat[i], 1), dur });
      step += dur;
    }
  }
  // závěrečný triumfální tón
  melody.push({ step, midi: noteFor(0, 2), dur: 4 });

  return { title, verdict, tempo, root, scaleName, minor, melody, chords, bars: 2 };
}

/* ── UI ────────────────────────────────────────────────────────── */
export const anthemUi = {
  cs: {
    back: "← Spaghetti.ltd", eyebrow: "Generátor osudové znělky", title: "Hymna tvého života",
    intro: "Šest otázek. Samé špatné odpovědi. Na konci tvoje osobní hymna — krátká, vznešená a beznadějná.",
    step: "Otázka", of: "z",
    yourAnthem: "Tvoje hymna", play: "Zahrát hymnu ♪", stop: "Zastavit ■", another: "Jiná verze 🎲", again: "Znovu od začátku",
    disclaimer: "Žádná z odpovědí nebyla dobrá. To je záměr.",
  },
  en: {
    back: "← Spaghetti.ltd", eyebrow: "Anthem-of-doom generator", title: "Anthem of Your Life",
    intro: "Six questions. Only bad answers. At the end, your personal anthem — short, grand and hopeless.",
    step: "Question", of: "of",
    yourAnthem: "Your anthem", play: "Play the anthem ♪", stop: "Stop ■", another: "Another version 🎲", again: "Start over",
    disclaimer: "None of the answers were good. That's the point.",
  },
} as const;

export type Lang_ = Lang;
