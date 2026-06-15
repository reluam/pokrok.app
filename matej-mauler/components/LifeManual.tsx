"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { Lang } from "@/lib/dictionaries";

/* ──────────────────────────────────────────────────────────────────────────
   Manuál na život / Life Manual
   IKEA montážní manuál pro život. Černobíle, line-art SVG. Rozevřená knížka:
   na širokém displeji dva listy vedle sebe, na mobilu jeden list (scroll dolů).
   Listuje se šipkami u okrajů, taháním za dolní roh nebo swipem.
   ────────────────────────────────────────────────────────────────────────── */

const display: React.CSSProperties = { fontFamily: "var(--font-display)" };
const sans = "var(--font-sans)";

const UI = {
  cs: {
    back: "← Spaghetti.ltd",
    title: "Manuál na život",
    artNo: "ART. NO. 1-986-400 · HOMO SAPIENS",
    prev: "Předchozí list",
    next: "Další list",
    hint: "Listuj šipkami u okraje, taháním za dolní roh nebo swipem",
    of: "z",
  },
  en: {
    back: "← Spaghetti.ltd",
    title: "Life Manual",
    artNo: "ART. NO. 1-986-400 · HOMO SAPIENS",
    prev: "Previous page",
    next: "Next page",
    hint: "Flip with the edge arrows, by pulling the bottom corner, or swipe",
    of: "of",
  },
} as const;

/* ── SVG primitiva ──────────────────────────────────────────────────────── */

const stroke = {
  stroke: "currentColor",
  strokeWidth: 5,
  fill: "none",
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

/** IKEA panáček. */
function Person({
  cx = 0,
  cy = 0,
  s = 1,
  mood = "ok",
  arms = "down",
}: {
  cx?: number;
  cy?: number;
  s?: number;
  mood?: "ok" | "happy" | "sad";
  arms?: "down" | "up" | "wave" | "side";
}) {
  const armPath =
    arms === "up"
      ? "M0 -8 L-20 -28 M0 -8 L20 -28"
      : arms === "wave"
      ? "M0 -8 L-18 8 M0 -8 L20 -30"
      : arms === "side"
      ? "M0 -8 L-22 -4 M0 -8 L22 -4"
      : "M0 -8 L-16 14 M0 -8 L16 14";
  const mouth =
    mood === "happy"
      ? "M-6 -34 Q0 -27 6 -34"
      : mood === "sad"
      ? "M-6 -31 Q0 -37 6 -31"
      : "M-6 -33 L6 -33";
  return (
    <g transform={`translate(${cx} ${cy}) scale(${s})`} {...stroke}>
      <circle cx={0} cy={-44} r={16} />
      <path d={mouth} strokeWidth={4} />
      <path d="M0 -26 L0 24" />
      <path d={armPath} />
      <path d="M0 24 L-14 52 M0 24 L14 52" />
    </g>
  );
}

function StepCircle({ x, y, n, r = 14 }: { x: number; y: number; n: string | number; r?: number }) {
  return (
    <g>
      <circle cx={x} cy={y} r={r} {...stroke} strokeWidth={4} />
      <text x={x} y={y + 6} fontSize={r + 2} textAnchor="middle" fill="currentColor" stroke="none" style={display}>
        {n}
      </text>
    </g>
  );
}

const Arrow = ({ d }: { d: string }) => <path d={d} {...stroke} markerEnd="url(#lm-arrow)" strokeWidth={4} />;

function Defs() {
  return (
    <defs>
      <marker id="lm-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
        <path d="M0 0 L10 5 L0 10 z" fill="currentColor" />
      </marker>
    </defs>
  );
}

const Check = ({ x, y, s = 1 }: { x: number; y: number; s?: number }) => (
  <path d={`M${x - 12 * s} ${y} l${8 * s} ${9 * s} l${16 * s} ${-18 * s}`} {...stroke} />
);
const Cross = ({ x, y, s = 1 }: { x: number; y: number; s?: number }) => (
  <g {...stroke}>
    <path d={`M${x - 11 * s} ${y - 11 * s} l${22 * s} ${22 * s}`} />
    <path d={`M${x + 11 * s} ${y - 11 * s} l${-22 * s} ${22 * s}`} />
  </g>
);

const Frame = ({ children }: { children: React.ReactNode }) => (
  <svg viewBox="0 0 300 240" className="w-full h-full" role="img" aria-hidden preserveAspectRatio="xMidYMid meet">
    <Defs />
    {children}
  </svg>
);

/* ── Obsah ──────────────────────────────────────────────────────────────── */

type TT = { cs: string; en: string };
type Page = {
  tag: string;
  cover?: boolean;
  art: React.ReactNode;
  title: TT;
  body?: TT[];
  caption: TT;
};

const PAGES: Page[] = [
  /* 0 — obálka / DŮLEŽITÉ */
  {
    tag: "0",
    cover: true,
    art: (
      <Frame>
        {/* výstražný trojúhelník */}
        <path d="M150 36 L210 132 L90 132 Z" {...stroke} />
        <path d="M150 70 L150 108" {...stroke} strokeWidth={6} />
        <circle cx={150} cy={122} r={3.5} fill="currentColor" />
        <Person cx={150} cy={210} s={1.5} mood="happy" arms="wave" />
      </Frame>
    ),
    title: { cs: "Manuál na život", en: "Life Manual" },
    caption: {
      cs: "DŮLEŽITÉ: Tento návod je nutné přečíst před použitím — ideálně ještě před narozením. V případě nedodržení hrozí ztráta záruky. (Záruku stejně nikdo nečetl.)",
      en: "IMPORTANT: Read this manual before use — ideally before birth. Failure to comply may void the warranty. (Nobody read the warranty anyway.)",
    },
  },

  /* 1 — záruka a výrobní vady */
  {
    tag: "!",
    art: (
      <Frame>
        <Person cx={108} cy={150} s={1.5} mood="ok" arms="side" />
        {/* lehká asymetrie: jedna noha delší */}
        <path d="M108 162 L94 220" {...stroke} strokeWidth={5} />
        {/* razítko JAK JE / AS IS */}
        <g transform="rotate(-12 210 110)">
          <circle cx={210} cy={110} r={42} {...stroke} strokeWidth={4} />
          <circle cx={210} cy={110} r={33} {...stroke} strokeWidth={2} />
          <text x={210} y={106} fontSize={20} textAnchor="middle" fill="currentColor" stroke="none" style={display}>JAK</text>
          <text x={210} y={128} fontSize={20} textAnchor="middle" fill="currentColor" stroke="none" style={display}>JE</text>
        </g>
      </Frame>
    ),
    title: { cs: "Záruka a výrobní vady", en: "Warranty & defects" },
    body: [
      { cs: "křivý nos · jedna noha delší", en: "crooked nose · one leg longer" },
      { cs: "trapné vzpomínky vyskakující ve 3 ráno", en: "cringe memories popping up at 3 a.m." },
      { cs: "občas podivné zvuky", en: "occasional strange noises" },
    ],
    caption: {
      cs: "Člověk je dodáván tak, jak je. Přijetím tohoto kusu souhlasíte se všemi výrobními vadami, asymetriemi a vrtochy. Reklamace se nepřijímají — každý exemplář je originál, žádné dva nejsou stejné.",
      en: "The human is delivered as-is. By accepting this unit you agree to all manufacturing defects, asymmetries and quirks. No returns — every unit is an original, no two alike.",
    },
  },

  /* 2 — obsah balení */
  {
    tag: "i",
    art: (
      <Frame>
        {/* tělo */}
        <Person cx={64} cy={150} s={1.25} />
        {/* vlasy — náznak */}
        <path d="M52 96 q12 -10 24 0 M56 92 q8 -8 16 0" {...stroke} strokeWidth={3} />
        <StepCircle x={64} y={64} n={1} r={12} />
        {/* srdce */}
        <path d="M150 58 q-12 -16 -24 -2 q-12 16 24 30 q36 -14 24 -30 q-12 -14 -24 2" {...stroke} strokeWidth={4} />
        <StepCircle x={126} y={34} n={1} r={11} />
        {/* mozek */}
        <path d="M214 60 q-6 -22 18 -18 q24 -2 18 18 q10 14 -6 22 q-12 14 -24 0 q-16 -6 -6 -22" {...stroke} strokeWidth={4} />
        <text x={232} y={92} fontSize={11} textAnchor="middle" fill="currentColor" stroke="none">86 mld.</text>
        {/* kosti */}
        <path d="M120 150 l44 0 M120 150 q-11 -9 0 -11 M120 150 q-11 9 0 11 M164 150 q11 -9 0 -11 M164 150 q11 9 0 11" {...stroke} strokeWidth={4} />
        <text x={142} y={182} fontSize={12} textAnchor="middle" fill="currentColor" stroke="none">206×</text>
        {/* chybějící návod */}
        <rect x={206} y={132} width={48} height={58} rx={4} {...stroke} strokeWidth={3} />
        <Cross x={230} y={161} s={0.85} />
        <text x={230} y={208} fontSize={11} textAnchor="middle" fill="currentColor" stroke="none">0× návod</text>
      </Frame>
    ),
    title: { cs: "Obsah balení", en: "What's in the box" },
    body: [
      { cs: "1× tělo — sestaveno z ~37 bilionů buněk", en: "1× body — assembled from ~37 trillion cells" },
      { cs: "1× srdce — ~100 000 úderů denně, bez tlačítka pauza", en: "1× heart — ~100,000 beats a day, no pause button" },
      { cs: "~86 miliard neuronů — návod k obsluze nepřiložen", en: "~86 billion neurons — operating manual not included" },
      { cs: "206 kostí — model NOVOROZENEC jich má ~300, postupně srostou", en: "206 bones — the NEWBORN model ships with ~300, they fuse over time" },
      { cs: "vlasy: 0 – ~150 000 ks (dle modelu; počet se může snižovat, na úbytek se záruka nevztahuje)", en: "hair: 0 – ~150,000 strands (by model; count may drop, loss not covered by warranty)" },
    ],
    caption: {
      cs: "Vše už je uvnitř. Návod chybí schválně — sestavuješ se za plného provozu.",
      en: "It's all inside already. The manual is missing on purpose — you assemble yourself at full speed.",
    },
  },

  /* 3 — palivo: jídlo a pití */
  {
    tag: "1",
    art: (
      <Frame>
        {/* sklenice */}
        <path d="M70 70 L78 200 L122 200 L130 70 Z" {...stroke} />
        <path d="M76 120 q24 16 48 0 L122 200 L78 200 Z" {...stroke} strokeWidth={2} fill="currentColor" fillOpacity={0.08} />
        <text x={100} y={56} fontSize={15} textAnchor="middle" fill="currentColor" stroke="none" style={display}>2–4 L</text>
        {/* vidlička */}
        <path d="M186 70 v24 M178 70 v12 q0 5 8 5 q8 0 8 -5 v-12 M186 99 v101" {...stroke} />
        {/* baterie s bleskem = energie */}
        <rect x={216} y={150} width={64} height={42} rx={6} {...stroke} strokeWidth={4} />
        <rect x={280} y={162} width={8} height={18} rx={2} {...stroke} strokeWidth={4} />
        <path d="M252 156 l-12 18 h12 l-6 16" {...stroke} strokeWidth={4} />
      </Frame>
    ),
    title: { cs: "Palivo: jídlo a pití", en: "Fuel: food & drink" },
    body: [
      { cs: "Tekutiny: 2–4 litry denně — voda / pivo / Coca-Cola, dle modelu a regionu", en: "Fluids: 2–4 litres a day — water / beer / Coca-Cola, by model and region" },
      { cs: "Energie: ~2 000 kcal denně, doplňujte pravidelně", en: "Energy: ~2,000 kcal a day, refill regularly" },
    ],
    caption: {
      cs: "Když necháš nádrž dlouho prázdnou, dostaví se podrážděnost (tzv. „hlad-vztek“). Obvykle se resetuje doplněním paliva — pozor, na koho ji předtím stihneš vylít.",
      en: "Leave the tank empty too long and irritability sets in (a.k.a. 'hanger'). A refill usually resets it — mind who you snap at first.",
    },
  },

  /* 4 — hibernace */
  {
    tag: "2",
    art: (
      <Frame>
        {/* postel */}
        <path d="M58 200 h184 M58 200 v-22 M242 200 v-40 M58 168 h150 q34 0 34 28" {...stroke} />
        {/* polštář + ležící hlava */}
        <rect x={64} y={150} width={42} height={20} rx={6} {...stroke} strokeWidth={4} />
        <circle cx={120} cy={156} r={13} {...stroke} strokeWidth={4} />
        <path d="M133 156 q44 -6 80 12" {...stroke} strokeWidth={4} />
        {/* Zzz */}
        <text x={150} y={84} fontSize={26} textAnchor="middle" fill="currentColor" stroke="none" style={display}>z z Z</text>
        {/* měsíc */}
        <path d="M246 70 a 22 22 0 1 0 6 30 a 17 17 0 1 1 -6 -30" {...stroke} strokeWidth={4} />
        {/* hodiny 7–9 h */}
        <text x={120} y={224} fontSize={13} textAnchor="middle" fill="currentColor" stroke="none">7–9 h</text>
      </Frame>
    ),
    title: { cs: "Hibernační režim", en: "Hibernation mode" },
    caption: {
      cs: "Každých ~16 hodin provozu člověka odložte na 7–9 hodin na matraci v tmavé a tiché místnosti. (Matrace není součástí balení.) Bez pravidelné hibernace přestává spolehlivě fungovat paměť, nálada i imunita — a obnova trvá déle, než kolik jste „ušetřili“.",
      en: "After ~16 hours of operation, set the human down for 7–9 hours on a mattress in a dark, quiet room. (Mattress not included.) Skip hibernation and memory, mood and immunity stop working reliably — and recovery takes longer than the time you 'saved'.",
    },
  },

  /* 5 — ilustrace vhodného zacházení */
  {
    tag: "3",
    art: (
      <Frame>
        <Person cx={86} cy={150} s={1.25} mood="happy" arms="side" />
        <Person cx={214} cy={150} s={1.25} mood="happy" arms="side" />
        {/* srdce mezi nimi */}
        <path d="M150 96 q-10 -13 -20 -2 q-10 13 20 25 q30 -12 20 -25 q-10 -11 -20 2" {...stroke} strokeWidth={4} />
        {/* křehké / fragile — sklenička dole */}
        <path d="M132 196 l8 0 l-2 16 l-4 0 z M128 196 h16" {...stroke} strokeWidth={3} />
        <text x={150} y={56} fontSize={13} textAnchor="middle" fill="currentColor" stroke="none">KŘEHKÉ</text>
      </Frame>
    ),
    title: { cs: "Ilustrace vhodného zacházení", en: "Proper handling" },
    body: [
      { cs: "✓ Chovej se k člověku tak, jak bys chtěl, aby se choval k tobě.", en: "✓ Treat the human the way you'd want to be treated." },
      { cs: "✓ Křehké. Skladuj v suchu, podávej s laskavostí.", en: "✓ Fragile. Keep dry, handle with kindness." },
      { cs: "✗ Neházet. Neporovnávat s ostatními kusy.", en: "✗ Do not throw. Do not compare with other units." },
    ],
    caption: {
      cs: "Pravidlo platí oboustranně — i ty jsi pro někoho ten křehký balík, se kterým doufá, že se bude hezky zacházet.",
      en: "The rule works both ways — to someone, you're the fragile parcel they hope gets handled gently.",
    },
  },

  /* 6 — důležité mentální modely */
  {
    tag: "4",
    art: (
      <Frame>
        {/* hlava z profilu */}
        <path d="M96 188 q-34 0 -34 -52 q0 -64 60 -64 q58 0 58 56 q0 24 -18 30 l2 30 z" {...stroke} />
        {/* ozubené kolo uvnitř */}
        <circle cx={120} cy={120} r={20} {...stroke} strokeWidth={4} />
        <circle cx={120} cy={120} r={7} {...stroke} strokeWidth={3} />
        <path d="M120 92 v8 M120 140 v8 M92 120 h8 M140 120 h8 M101 101 l6 6 M133 133 l6 6 M139 101 l-6 6 M107 133 l-6 6" {...stroke} strokeWidth={3} />
        {/* žárovka = nápad */}
        <circle cx={214} cy={104} r={20} {...stroke} strokeWidth={4} />
        <path d="M204 124 h20 M206 132 h16" {...stroke} strokeWidth={4} />
        <path d="M214 70 v-12 M186 104 h-12 M242 104 h12 M193 83 l-8 -8 M235 83 l8 -8" {...stroke} strokeWidth={3} />
      </Frame>
    ),
    title: { cs: "Důležité mentální modely", en: "Important mental models" },
    body: [
      { cs: "Nesrovnávej své zákulisí s cizím sestřihem.", en: "Don't compare your backstage to someone's highlight reel." },
      { cs: "Skoro nikdo nemyslí na tvé chyby tolik jako ty (efekt reflektoru).", en: "Almost nobody thinks about your mistakes as much as you do (the spotlight effect)." },
      { cs: "Většinu dnešních starostí si za rok ani nevybavíš.", en: "Most of today's worries you won't even remember in a year." },
      { cs: "Rozhodnout znamená odříznout zbytek (lat. decidere). Nerozhodnout je taky rozhodnutí.", en: "To decide is to cut away the rest (Lat. decidere). Not deciding is also a decision." },
    ],
    caption: {
      cs: "Software je důležitější než hardware. Tyhle modely klidně přepiš, kdykoli začnou víc škodit než pomáhat.",
      en: "Software matters more than hardware. Feel free to rewrite these models whenever they start doing more harm than good.",
    },
  },

  /* 7 — spoj se */
  {
    tag: "5",
    art: (
      <Frame>
        <Person cx={92} cy={150} s={1.3} mood="happy" arms="side" />
        <Person cx={208} cy={150} s={1.3} mood="happy" arms="side" />
        <path d="M128 112 l18 0 l0 -9 l9 9 l-9 9 l0 -9" {...stroke} strokeWidth={4} />
        <path d="M172 112 l-18 0 l0 -9 l-9 9 l9 9 l0 -9" {...stroke} strokeWidth={4} />
        <text x={150} y={80} fontSize={18} textAnchor="middle" fill="currentColor" stroke="none" style={display}>cvak!</text>
        <StepCircle x={150} y={210} n={5} r={15} />
      </Frame>
    ),
    title: { cs: "Spoj se s ostatními kusy", en: "Connect with other units" },
    caption: {
      cs: "Nejdelší studie o štěstí (Harvard, 85+ let) má jediný hlavní závěr: nerozhodují peníze ani sláva, ale kvalita vztahů. Člověk je párový — funguje líp ve spojení. Týká se to i toho introvertního modelu.",
      en: "The longest study on happiness (Harvard, 85+ years) has one main finding: not money, not fame — the quality of your relationships. The human is a social unit, it runs better connected. Yes, even the introverted model.",
    },
  },

  /* 8 — když se něco zlomí */
  {
    tag: "6",
    art: (
      <Frame>
        <g transform="rotate(-90 88 152)">
          <Person cx={88} cy={152} s={1.1} mood="sad" />
        </g>
        <Cross x={88} y={66} s={1} />
        <Arrow d="M140 150 H190" />
        <Person cx={228} cy={150} s={1.25} mood="happy" arms="up" />
        <Check x={228} y={66} s={1.2} />
      </Frame>
    ),
    title: { cs: "Když se něco zlomí", en: "When something breaks" },
    caption: {
      cs: "Rozbité a křivé díly patří k výrobku. Nereklamuj je — slep je časem a odpočinkem a sestavuj dál. Praskliny mimochodem pouštějí dovnitř světlo.",
      en: "Broken and bent parts come with the product. Don't return them — glue them with time and rest, and keep assembling. Cracks, by the way, are how the light gets in.",
    },
  },

  /* 9 — hotovo */
  {
    tag: "✓",
    art: (
      <Frame>
        <Person cx={134} cy={150} s={1.85} mood="happy" arms="up" />
        <Check x={134} y={48} s={1.5} />
        <path d="M210 168 l52 0 l18 18 l-18 18 l-52 0 z" {...stroke} strokeWidth={3} />
        <circle cx={222} cy={186} r={3.5} fill="currentColor" />
        <text x={250} y={190} fontSize={15} textAnchor="middle" fill="currentColor" stroke="none" style={display}>~4000</text>
        <text x={250} y={206} fontSize={9} textAnchor="middle" fill="currentColor" stroke="none">týdnů</text>
      </Frame>
    ),
    title: { cs: "Hotovo", en: "Done" },
    caption: {
      cs: "Výrobek nelze vrátit ani vyměnit. Záruka ≈ 4 000 týdnů (liší se dle modelu a štěstí). Nenech ho ležet v krabici. Dotazy ohledně použití? → Zavolej někomu, koho máš rád.",
      en: "The product cannot be returned or exchanged. Warranty ≈ 4,000 weeks (varies by model and luck). Don't leave it in the box. Questions about use? → Call someone you love.",
    },
  },
];

const TOTAL = PAGES.length;

/* ── List ───────────────────────────────────────────────────────────────── */

function Sheet({ page, lang, n }: { page?: Page; lang: Lang; n: number }) {
  const t = UI[lang];
  if (!page) {
    // zadní strana / prázdný list (jen když je lichý počet stránek)
    return (
      <div className="flex-1 min-w-0 bg-[#F3F1EC] border border-[#141414]/10 flex items-center justify-center">
        <span className="text-[#141414]/20 text-xs uppercase tracking-[0.3em]" style={display}>Spaghetti</span>
      </div>
    );
  }
  return (
    <div className="flex-1 min-w-0 bg-white border border-[#141414]/12 flex flex-col overflow-y-auto px-6 sm:px-8 py-5">
      {/* hlavička listu */}
      <div className="flex items-center justify-between text-[#141414]/70 text-xs shrink-0">
        <span className="inline-flex items-center justify-center min-w-7 h-7 px-2 border border-[#141414]/40 rounded-full font-semibold" style={display}>
          {page.tag}
        </span>
        <span className="uppercase tracking-[0.15em] opacity-45 text-[10px]">{t.artNo}</span>
      </div>
      <div className="border-t border-[#141414]/12 mt-2 shrink-0" />

      <h2 className={`text-center font-bold leading-tight mt-4 shrink-0 ${page.cover ? "text-3xl sm:text-4xl" : "text-xl sm:text-2xl"}`} style={display}>
        {page.title[lang]}
      </h2>

      {/* ilustrace */}
      <div className={`text-[#141414] mx-auto w-full ${page.cover ? "max-w-[320px]" : "max-w-[280px]"} grow flex items-center justify-center min-h-[150px] py-3`}>
        {page.art}
      </div>

      {/* odrážky */}
      {page.body && (
        <ul className="space-y-1.5 text-sm leading-snug text-[#141414]/85 shrink-0 mb-3">
          {page.body.map((b, k) => (
            <li key={k} className="flex gap-2">
              <span className="mt-[5px] h-1.5 w-1.5 bg-[#141414] shrink-0" aria-hidden />
              <span>{b[lang]}</span>
            </li>
          ))}
        </ul>
      )}

      {/* popisek */}
      <p className="text-center text-sm leading-snug text-[#141414]/90 shrink-0">{page.caption[lang]}</p>

      <div className="text-center text-[11px] text-[#141414]/40 mt-3 shrink-0" style={display}>
        {String(n).padStart(2, "0")} {t.of} {String(TOTAL).padStart(2, "0")}
      </div>
    </div>
  );
}

/* ── Komponenta ─────────────────────────────────────────────────────────── */

export function LifeManual({ lang }: { lang: Lang }) {
  const t = UI[lang];
  const [i, setI] = useState(0); // index levého listu
  const [twoUp, setTwoUp] = useState(false);
  const dragX = useRef<number | null>(null);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 880px)");
    const apply = () => {
      setTwoUp(mq.matches);
      if (mq.matches) setI((p) => p - (p % 2)); // zarovnej na sudý list
    };
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  const step = twoUp ? 2 : 1;
  const canPrev = i > 0;
  const canNext = i + step < TOTAL;

  const go = useCallback(
    (d: 1 | -1) => {
      setI((p) => {
        const next = Math.min(TOTAL - 1, Math.max(0, p + d * step));
        return twoUp ? next - (next % 2) : next;
      });
    },
    [step, twoUp]
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") go(1);
      else if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go]);

  const jump = (target: number) => setI(twoUp ? target - (target % 2) : target);

  return (
    <main className="h-[100dvh] flex flex-col bg-[#FAF9F6] text-[#141414] overflow-hidden" style={{ fontFamily: sans }}>
      <header className="flex items-center justify-between px-5 py-3 shrink-0">
        <Link href="/" className="text-sm opacity-70 hover:opacity-100 transition-opacity">{t.back}</Link>
        <span className="text-xs uppercase tracking-[0.2em] opacity-50" style={display}>{t.title}</span>
      </header>

      {/* listovací plocha */}
      <div className="relative flex-1 min-h-0">
        {/* šipky úplně u okrajů */}
        <button
          aria-label={t.prev}
          onClick={() => go(-1)}
          disabled={!canPrev}
          className="absolute left-0 top-0 z-20 h-full w-12 sm:w-16 flex items-center justify-center text-3xl text-[#141414]/55 hover:text-[#141414] hover:bg-[#141414]/[0.03] disabled:opacity-20 disabled:hover:bg-transparent transition-colors"
        >
          ‹
        </button>
        <button
          aria-label={t.next}
          onClick={() => go(1)}
          disabled={!canNext}
          className="absolute right-0 top-0 z-20 h-full w-12 sm:w-16 flex items-center justify-center text-3xl text-[#141414]/55 hover:text-[#141414] hover:bg-[#141414]/[0.03] disabled:opacity-20 disabled:hover:bg-transparent transition-colors"
        >
          ›
        </button>

        {/* knížka */}
        <div
          className="h-full px-12 sm:px-20 py-4 flex justify-center"
          onPointerDown={(e) => (dragX.current = e.clientX)}
          onPointerUp={(e) => {
            if (dragX.current == null) return;
            const dx = e.clientX - dragX.current;
            dragX.current = null;
            if (dx < -50) go(1);
            else if (dx > 50) go(-1);
          }}
        >
          <div
            key={i}
            className="relative w-full max-w-5xl h-full flex shadow-[0_24px_60px_-30px_rgba(0,0,0,0.45)]"
            style={{ animation: "lm-flip 300ms ease" }}
          >
            <Sheet page={PAGES[i]} lang={lang} n={i + 1} />
            {twoUp && <Sheet page={PAGES[i + 1]} lang={lang} n={i + 2} />}
            {/* hřbet knihy */}
            {twoUp && <div className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-[#141414]/15 pointer-events-none" />}

            {/* ohnutý roh — táhni za dolní konec listu */}
            {canNext && (
              <button
                aria-label={t.next}
                onClick={() => go(1)}
                className="group absolute bottom-0 right-0 z-30 h-10 w-10"
              >
                <svg viewBox="0 0 40 40" className="h-full w-full">
                  <path d="M40 40 L40 8 L8 40 Z" fill="#F0EEE8" stroke="#141414" strokeOpacity="0.18" strokeWidth="1" />
                  <path d="M40 8 L8 40" stroke="#141414" strokeOpacity="0.25" strokeWidth="1" className="group-hover:stroke-[#141414]" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* spodní navigace */}
      <footer className="shrink-0 flex flex-col items-center gap-2 py-3">
        <div className="flex items-center gap-1.5">
          {PAGES.map((_, idx) => {
            const active = twoUp ? idx === i || idx === i + 1 : idx === i;
            return (
              <button
                key={idx}
                aria-label={`${idx + 1}`}
                onClick={() => jump(idx)}
                className={`h-2 rounded-full transition-all ${active ? "w-5 bg-[#141414]" : "w-2 bg-[#141414]/25 hover:bg-[#141414]/50"}`}
              />
            );
          })}
        </div>
        <p className="text-[11px] text-[#141414]/40 px-4 text-center">{t.hint}</p>
      </footer>

      <style>{`
        @keyframes lm-flip {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </main>
  );
}
