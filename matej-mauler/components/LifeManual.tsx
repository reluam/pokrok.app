"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { Lang } from "@/lib/dictionaries";

/* ──────────────────────────────────────────────────────────────────────────
   Manuál na život / Life Manual
   IKEA montážní manuál pro život. Černobíle, line-art SVG, listuje se zleva
   doprava. Dva režimy textu: „beze slov" (čistá IKEA) a „s popiskem" (komiks).
   ────────────────────────────────────────────────────────────────────────── */

const display: React.CSSProperties = { fontFamily: "var(--font-display)" };
const sans = "var(--font-sans)";

type Mode = "wordless" | "captioned";

const UI = {
  cs: {
    back: "← Spaghetti.ltd",
    title: "Manuál na život",
    artNo: "ART. NO. 1-986-400 · ŽIVOT/LIFE",
    wordless: "beze slov",
    captioned: "s popiskem",
    modeLabel: "režim",
    prev: "Předchozí",
    next: "Další",
    hint: "Listuj ← → (klávesy, klik nebo swipe)",
    of: "z",
  },
  en: {
    back: "← Spaghetti.ltd",
    title: "Life Manual",
    artNo: "ART. NO. 1-986-400 · ŽIVOT/LIFE",
    wordless: "wordless",
    captioned: "captioned",
    modeLabel: "mode",
    prev: "Previous",
    next: "Next",
    hint: "Flip ← → (keys, click or swipe)",
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

/** IKEA panáček. mood: 'ok' | 'happy' | 'sad' | 'puzzled'. arms: 'down'|'up'|'wave'|'side' */
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
  mood?: "ok" | "happy" | "sad" | "puzzled";
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
      {/* tvář jen v náznaku — IKEA panáček ji většinou nemá, ale nálada pomáhá */}
      <path d={mouth} strokeWidth={4} />
      {mood === "puzzled" && <text x={20} y={-50} fontSize={26} fill="currentColor" stroke="none">?</text>}
      <path d="M0 -26 L0 24" />
      <path d={armPath} />
      <path d="M0 24 L-14 52 M0 24 L14 52" />
    </g>
  );
}

/** Číslo v kolečku — klasický IKEA krok. */
function StepCircle({ x, y, n, r = 16 }: { x: number; y: number; n: number; r?: number }) {
  return (
    <g>
      <circle cx={x} cy={y} r={r} {...stroke} strokeWidth={4} />
      <text x={x} y={y + 7} fontSize={r + 4} textAnchor="middle" fill="currentColor" stroke="none" style={display}>
        {n}
      </text>
    </g>
  );
}

function Arrow({ d }: { d: string }) {
  return <path d={d} {...stroke} markerEnd="url(#arrow)" strokeWidth={4} />;
}

function Defs() {
  return (
    <defs>
      <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
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
  <svg viewBox="0 0 300 260" className="w-full h-full" role="img" aria-hidden>
    <Defs />
    {children}
  </svg>
);

/* ── Stránky ────────────────────────────────────────────────────────────── */

type Page = {
  /** krokový štítek vlevo nahoře, např. „01" nebo „!" */
  tag: string;
  cover?: boolean;
  art: React.ReactNode;
  title: { cs: string; en: string };
  caption: { cs: string; en: string };
};

const PAGES: Page[] = [
  /* 0 — obálka */
  {
    tag: "00",
    cover: true,
    art: (
      <Frame>
        <Person cx={150} cy={150} s={2.1} mood="happy" arms="wave" />
        <rect x={196} y={70} width={64} height={34} rx={4} {...stroke} strokeWidth={3} />
        <text x={228} y={92} fontSize={17} textAnchor="middle" fill="currentColor" stroke="none" style={display}>0 Kč</text>
        <text x={228} y={118} fontSize={9} textAnchor="middle" fill="currentColor" stroke="none">vč. DPH</text>
      </Frame>
    ),
    title: { cs: "Manuál na život", en: "Life Manual" },
    caption: {
      cs: "Přečti si před použitím. (Nepřečteš. To nevadí — stejně se to naučíš za pochodu.)",
      en: "Read before use. (You won't. That's fine — you'll learn on the way anyway.)",
    },
  },

  /* 1 — obsah balení */
  {
    tag: "01",
    art: (
      <Frame>
        <Person cx={70} cy={150} s={1.25} />
        <StepCircle x={70} y={60} n={1} r={13} />
        {/* srdce */}
        <path d="M150 60 q-12 -16 -24 -2 q-12 16 24 30 q36 -14 24 -30 q-12 -14 -24 2" {...stroke} strokeWidth={4} />
        <StepCircle x={150} y={30} n={1} r={13} />
        {/* mozek (neurony) */}
        <path d="M210 60 q-6 -22 18 -18 q24 -2 18 18 q10 14 -6 22 q-12 14 -24 0 q-16 -6 -6 -22" {...stroke} strokeWidth={4} />
        <text x={228} y={92} fontSize={11} textAnchor="middle" fill="currentColor" stroke="none">86 mld.</text>
        {/* kosti */}
        <path d="M120 150 l52 0 M120 150 q-12 -10 0 -12 M120 150 q-12 10 0 12 M172 150 q12 -10 0 -12 M172 150 q12 10 0 12" {...stroke} strokeWidth={4} />
        <text x={146} y={180} fontSize={13} textAnchor="middle" fill="currentColor" stroke="none">206×</text>
        {/* chybějící manuál */}
        <rect x={206} y={130} width={48} height={60} rx={4} {...stroke} strokeWidth={3} />
        <Cross x={230} y={160} s={0.9} />
        <text x={230} y={208} fontSize={11} textAnchor="middle" fill="currentColor" stroke="none">0× návod</text>
      </Frame>
    ),
    title: { cs: "Obsah balení", en: "What's in the box" },
    caption: {
      cs: "1× tělo, 1× srdce (~100 000 úderů/den), ~86 mld. neuronů, 206 kostí. Návod chybí schválně — sestavuješ za provozu.",
      en: "1× body, 1× heart (~100,000 beats/day), ~86 billion neurons, 206 bones. The manual is missing on purpose — you assemble it while running.",
    },
  },

  /* 2 — nářadí */
  {
    tag: "02",
    art: (
      <Frame>
        {/* voda */}
        <path d="M60 60 q14 24 0 32 q-14 -8 0 -32" {...stroke} strokeWidth={4} />
        <text x={60} y={120} fontSize={11} textAnchor="middle" fill="currentColor" stroke="none">voda</text>
        {/* spánek = postel */}
        <path d="M120 80 h70 M120 80 v14 M190 72 v22 M120 94 h70" {...stroke} strokeWidth={4} />
        <text x={155} y={120} fontSize={11} textAnchor="middle" fill="currentColor" stroke="none">8 h</text>
        {/* žárovka = zvědavost */}
        <circle cx={240} cy={66} r={16} {...stroke} strokeWidth={4} />
        <path d="M232 82 h16 M234 88 h12" {...stroke} strokeWidth={4} />
        <text x={240} y={120} fontSize={11} textAnchor="middle" fill="currentColor" stroke="none">?</text>
        {/* přítel */}
        <Person cx={100} cy={210} s={0.9} mood="happy" arms="side" />
        <Person cx={160} cy={210} s={0.9} mood="happy" arms="side" />
        <text x={130} y={250} fontSize={11} textAnchor="middle" fill="currentColor" stroke="none">min. 1×</text>
        {/* boty = pohyb */}
        <path d="M210 200 h26 q8 0 8 8 h-34 z M214 200 v-10" {...stroke} strokeWidth={4} />
        <text x={228} y={250} fontSize={11} textAnchor="middle" fill="currentColor" stroke="none">pohyb</text>
      </Frame>
    ),
    title: { cs: "Potřebné nářadí", en: "Tools required" },
    caption: {
      cs: "Voda, spánek (8 h), zvědavost, aspoň 1 přítel, pohyb. NEJSOU součástí balení — musíš si je obstarat sám.",
      en: "Water, sleep (8 h), curiosity, at least 1 friend, movement. NOT included — you have to get them yourself.",
    },
  },

  /* 3 — varování */
  {
    tag: "!",
    art: (
      <Frame>
        {/* nesrovnávej se */}
        <Person cx={80} cy={120} s={1} mood="sad" />
        <text x={150} y={95} fontSize={26} textAnchor="middle" fill="currentColor" stroke="none" style={display}>vs</text>
        <Person cx={220} cy={120} s={1} mood="happy" arms="up" />
        <Cross x={150} y={120} s={1.4} />
        {/* baterka */}
        <rect x={96} y={190} width={86} height={40} rx={5} {...stroke} strokeWidth={4} />
        <rect x={182} y={202} width={8} height={16} rx={2} {...stroke} strokeWidth={4} />
        <path d="M106 198 v24 M122 198 v24" {...stroke} strokeWidth={4} />
        <text x={205} y={218} fontSize={22} fill="currentColor" stroke="none" style={display}>!</text>
      </Frame>
    ),
    title: { cs: "Varování", en: "Warning" },
    caption: {
      cs: "Nesrovnávej své zákulisí s cizím sestřihem — prohraješ vždycky. A baterka (energie) se dobíjí spánkem, ne kávou.",
      en: "Don't compare your behind-the-scenes to someone's highlight reel — you'll always lose. And the battery (energy) recharges with sleep, not coffee.",
    },
  },

  /* 4 — krok 1: ráno */
  {
    tag: "03",
    art: (
      <Frame>
        {/* slunce */}
        <circle cx={60} cy={70} r={18} {...stroke} strokeWidth={4} />
        <path d="M60 40 v-12 M60 100 v12 M30 70 h-12 M90 70 h12 M40 50 l-8 -8 M80 50 l8 -8" {...stroke} strokeWidth={3} />
        <StepCircle x={60} y={130} n={1} r={13} />
        <Arrow d="M92 130 H132" />
        {/* voda */}
        <path d="M160 116 q14 24 0 32 q-14 -8 0 -32" {...stroke} strokeWidth={4} />
        <StepCircle x={160} y={170} n={2} r={13} />
        <Arrow d="M188 132 H224" />
        {/* pohyb — panáček krok */}
        <Person cx={245} cy={130} s={1} arms="side" />
        <StepCircle x={245} y={200} n={3} r={13} />
      </Frame>
    ),
    title: { cs: "Krok 1 — Ráno", en: "Step 1 — Morning" },
    caption: {
      cs: "Ranní světlo do očí seřídí vnitřní hodiny. 10 minut venku po probuzení > hodina scrollování v posteli.",
      en: "Morning light in your eyes sets your inner clock. 10 minutes outside after waking > an hour of scrolling in bed.",
    },
  },

  /* 5 — krok 2: spoj se */
  {
    tag: "04",
    art: (
      <Frame>
        <Person cx={95} cy={150} s={1.2} mood="happy" arms="side" />
        <Person cx={205} cy={150} s={1.2} mood="happy" arms="side" />
        {/* spojka „cvak" */}
        <path d="M132 110 l16 0 l0 -8 l8 8 l-8 8 l0 -8" {...stroke} strokeWidth={4} />
        <path d="M168 110 l-16 0 l0 -8 l-8 8 l8 8 l0 -8" {...stroke} strokeWidth={4} />
        <text x={150} y={80} fontSize={18} textAnchor="middle" fill="currentColor" stroke="none" style={display}>cvak!</text>
        <StepCircle x={150} y={210} n={4} r={15} />
      </Frame>
    ),
    title: { cs: "Krok 2 — Spoj se", en: "Step 2 — Connect" },
    caption: {
      cs: "Nejdelší studie o štěstí (Harvard, 85+ let) má jediný hlavní závěr: nerozhodují peníze ani sláva, ale kvalita vztahů.",
      en: "The longest study on happiness (Harvard, 85+ years) has one main finding: it's not money or fame — it's the quality of your relationships.",
    },
  },

  /* 6 — krok 3: když to praskne */
  {
    tag: "05",
    art: (
      <Frame>
        {/* spadlý panáček */}
        <g transform="rotate(-90 90 150)">
          <Person cx={90} cy={150} s={1.05} mood="sad" />
        </g>
        <Cross x={90} y={70} s={1} />
        <Arrow d="M138 150 H188" />
        {/* stojící panáček */}
        <Person cx={225} cy={150} s={1.15} mood="happy" arms="up" />
        <Check x={225} y={70} s={1.2} />
        <StepCircle x={150} y={235} n={5} r={14} />
      </Frame>
    ),
    title: { cs: "Krok 3 — Když to praskne", en: "Step 3 — When it breaks" },
    caption: {
      cs: "Rozbité a křivé díly patří k výrobku. Nereklamuj je — slep je časem a odpočinkem a sestav dál.",
      en: "Broken and bent parts come with the product. Don't return them — glue them with time and rest, and keep assembling.",
    },
  },

  /* 7 — údržba (cyklus) */
  {
    tag: "06",
    art: (
      <Frame>
        <circle cx={150} cy={140} r={86} {...stroke} strokeWidth={3} strokeDasharray="2 10" />
        {/* spánek */}
        <path d="M118 56 h26 l-26 18 h26" {...stroke} strokeWidth={4} />
        <text x={131} y={92} fontSize={10} textAnchor="middle" fill="currentColor" stroke="none">spánek</text>
        {/* jídlo (vidlička) */}
        <path d="M238 116 v24 M232 116 v10 q0 4 6 4 q6 0 6 -4 v-10" {...stroke} strokeWidth={4} />
        <text x={238} y={160} fontSize={10} textAnchor="middle" fill="currentColor" stroke="none">jídlo</text>
        {/* pohyb */}
        <Person cx={150} cy={210} s={0.7} arms="side" />
        <text x={150} y={246} fontSize={10} textAnchor="middle" fill="currentColor" stroke="none">pohyb</text>
        {/* dech */}
        <path d="M52 120 q12 -10 24 0 q12 10 24 0" {...stroke} strokeWidth={4} />
        <text x={76} y={160} fontSize={10} textAnchor="middle" fill="currentColor" stroke="none">dech</text>
        <Arrow d="M150 60 a 80 80 0 0 1 70 70" />
      </Frame>
    ),
    title: { cs: "Údržba", en: "Maintenance" },
    caption: {
      cs: "Pravidelná údržba: 7–9 h spánku, jídlo, pohyb, dech. Tovární reset neexistuje — opotřebení se řeší jen průběžně.",
      en: "Routine maintenance: 7–9 h sleep, food, movement, breath. There's no factory reset — wear and tear is handled only as you go.",
    },
  },

  /* 8 — hotovo */
  {
    tag: "07",
    art: (
      <Frame>
        <Person cx={150} cy={150} s={2} mood="happy" arms="up" />
        <Check x={150} y={40} s={1.6} />
        {/* visačka záruka */}
        <path d="M196 196 l44 0 l16 16 l-16 16 l-44 0 z" {...stroke} strokeWidth={3} />
        <circle cx={206} cy={212} r={3} fill="currentColor" />
        <text x={232} y={217} fontSize={14} textAnchor="middle" fill="currentColor" stroke="none" style={display}>~4000</text>
        <text x={232} y={232} fontSize={9} textAnchor="middle" fill="currentColor" stroke="none">týdnů</text>
      </Frame>
    ),
    title: { cs: "Hotovo", en: "Done" },
    caption: {
      cs: "Výrobek nelze vrátit ani vyměnit. Záruka ≈ 4000 týdnů. Nenech ho ležet v krabici. Otázky? → Zavolej někomu, koho máš rád.",
      en: "The product cannot be returned or exchanged. Warranty ≈ 4,000 weeks. Don't leave it in the box. Questions? → Call someone you love.",
    },
  },
];

/* ── Komponenta ─────────────────────────────────────────────────────────── */

export function LifeManual({ lang }: { lang: Lang }) {
  const t = UI[lang];
  const [i, setI] = useState(0);
  const [mode, setMode] = useState<Mode>("captioned");
  const [dir, setDir] = useState<1 | -1>(1);
  const dragX = useRef<number | null>(null);

  const total = PAGES.length;
  const go = useCallback(
    (d: 1 | -1) => {
      setDir(d);
      setI((p) => Math.min(total - 1, Math.max(0, p + d)));
    },
    [total]
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") go(1);
      else if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go]);

  const page = PAGES[i];

  return (
    <main className="min-h-screen bg-[#FAF9F6] text-[#141414] flex flex-col" style={{ fontFamily: sans }}>
      {/* horní lišta */}
      <header className="flex items-center justify-between px-5 py-4 text-sm">
        <Link href="/" className="opacity-70 hover:opacity-100 transition-opacity">
          {t.back}
        </Link>
        <div className="flex items-center gap-2 text-xs">
          <span className="opacity-50 uppercase tracking-wide">{t.modeLabel}</span>
          <div className="flex rounded-full border border-[#141414]/30 overflow-hidden">
            {(["captioned", "wordless"] as Mode[]).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`px-3 py-1 transition-colors ${
                  mode === m ? "bg-[#141414] text-[#FAF9F6]" : "hover:bg-[#141414]/5"
                }`}
              >
                {m === "captioned" ? t.captioned : t.wordless}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* stránka */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 pb-2 select-none">
        <div
          className="relative w-full max-w-md"
          onPointerDown={(e) => (dragX.current = e.clientX)}
          onPointerUp={(e) => {
            if (dragX.current == null) return;
            const dx = e.clientX - dragX.current;
            dragX.current = null;
            if (dx < -45) go(1);
            else if (dx > 45) go(-1);
          }}
        >
          {/* klik na levou/pravou polovinu */}
          <button aria-label={t.prev} onClick={() => go(-1)} className="absolute left-0 top-0 h-full w-1/3 z-10 cursor-w-resize disabled:cursor-default" disabled={i === 0} />
          <button aria-label={t.next} onClick={() => go(1)} className="absolute right-0 top-0 h-full w-1/3 z-10 cursor-e-resize disabled:cursor-default" disabled={i === total - 1} />

          <div
            key={i}
            className="bg-white border border-[#141414]/15 rounded-sm shadow-[0_18px_40px_-24px_rgba(0,0,0,0.4)] px-7 pt-5 pb-7"
            style={{
              aspectRatio: "3 / 4",
              animation: `lm-flip-${dir === 1 ? "fwd" : "back"} 320ms ease`,
            }}
          >
            {/* hlavička stránky */}
            <div className="flex items-center justify-between text-[#141414]/70 text-xs">
              <span
                className="inline-flex items-center justify-center min-w-7 h-7 px-2 border border-[#141414]/40 rounded-full font-semibold"
                style={display}
              >
                {page.tag}
              </span>
              <span className="uppercase tracking-[0.15em] opacity-50 text-[10px]">{t.artNo}</span>
            </div>
            <div className="border-t border-[#141414]/15 mt-2" />

            {/* obálka má vždy titul */}
            {(page.cover || mode === "captioned") && (
              <h1
                className={`text-center ${page.cover ? "text-3xl mt-3" : "text-xl mt-3"} font-bold leading-tight`}
                style={display}
              >
                {page.title[lang]}
              </h1>
            )}

            {/* ilustrace */}
            <div className={`text-[#141414] ${page.cover ? "mt-2" : "mt-3"}`} style={{ height: page.cover ? "52%" : mode === "captioned" ? "48%" : "70%" }}>
              {page.art}
            </div>

            {/* popisek */}
            {(page.cover || mode === "captioned") && (
              <p className="text-center text-sm leading-snug mt-3 text-[#141414]/85">{page.caption[lang]}</p>
            )}

            {/* footer čísla */}
            <div className="absolute bottom-3 left-0 right-0 text-center text-[11px] text-[#141414]/45" style={display}>
              {String(i + 1).padStart(2, "0")} {t.of} {String(total).padStart(2, "0")}
            </div>
          </div>
        </div>

        {/* navigace */}
        <div className="flex items-center gap-3 mt-5">
          <button
            onClick={() => go(-1)}
            disabled={i === 0}
            className="px-4 py-2 text-sm border border-[#141414]/30 rounded-full disabled:opacity-30 hover:bg-[#141414]/5 transition-colors"
          >
            {t.prev}
          </button>
          {/* tečky */}
          <div className="flex items-center gap-1.5">
            {PAGES.map((_, idx) => (
              <button
                key={idx}
                aria-label={`${idx + 1}`}
                onClick={() => {
                  setDir(idx > i ? 1 : -1);
                  setI(idx);
                }}
                className={`h-2 rounded-full transition-all ${idx === i ? "w-5 bg-[#141414]" : "w-2 bg-[#141414]/25 hover:bg-[#141414]/50"}`}
              />
            ))}
          </div>
          <button
            onClick={() => go(1)}
            disabled={i === total - 1}
            className="px-4 py-2 text-sm border border-[#141414]/30 rounded-full disabled:opacity-30 hover:bg-[#141414]/5 transition-colors"
          >
            {t.next}
          </button>
        </div>
        <p className="text-[11px] text-[#141414]/40 mt-3">{t.hint}</p>
      </div>

      <style>{`
        @keyframes lm-flip-fwd {
          from { opacity: 0; transform: translateX(28px) rotateY(8deg); }
          to   { opacity: 1; transform: translateX(0) rotateY(0); }
        }
        @keyframes lm-flip-back {
          from { opacity: 0; transform: translateX(-28px) rotateY(-8deg); }
          to   { opacity: 1; transform: translateX(0) rotateY(0); }
        }
      `}</style>
    </main>
  );
}
