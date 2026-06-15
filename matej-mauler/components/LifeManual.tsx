"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import type { Lang } from "@/lib/dictionaries";

/* ──────────────────────────────────────────────────────────────────────────
   Manuál na život / Life Manual
   IKEA montážní manuál pro život. Černobíle, line-art SVG. Rozevřená knížka:
   na širokém displeji dva listy vedle sebe, na mobilu jeden list.
   Nikdy se neroluje — obsah se vejde na list (v krajním případě se zmenší).
   ────────────────────────────────────────────────────────────────────────── */

const display: React.CSSProperties = { fontFamily: "var(--font-display)" };
const sans = "var(--font-sans)";
const useIso = typeof window !== "undefined" ? useLayoutEffect : useEffect;

const UI = {
  cs: {
    back: "← Spaghetti.ltd",
    title: "Manuál na život",
    prev: "Předchozí list",
    next: "Další list",
    hint: "Listuj šipkami u okraje, taháním za roh listu nebo swipem",
  },
  en: {
    back: "← Spaghetti.ltd",
    title: "Life Manual",
    prev: "Previous page",
    next: "Next page",
    hint: "Flip with the edge arrows, by pulling the page corner, or swipe",
  },
} as const;

/* ── SVG primitiva ──────────────────────────────────────────────────────── */

const line = {
  stroke: "currentColor",
  strokeWidth: 5,
  fill: "none",
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};
const solid = { ...line, fill: "#fff" }; // bílá výplň + obrys → čisté překryvy

function Defs() {
  return (
    <defs>
      <marker id="lm-arw" viewBox="0 0 10 10" refX="7.5" refY="5" markerWidth="5.5" markerHeight="5.5" orient="auto-start-reverse">
        <path d="M0.5 1 L9 5 L0.5 9" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </marker>
    </defs>
  );
}
const Frame = ({ children }: { children: React.ReactNode }) => (
  <svg viewBox="0 0 360 300" className="w-full h-full" role="img" aria-hidden preserveAspectRatio="xMidYMid meet">
    <Defs />
    {children}
  </svg>
);
const Arrow = ({ d, w = 4 }: { d: string; w?: number }) => <path d={d} {...line} strokeWidth={w} markerEnd="url(#lm-arw)" />;

function NumBadge({ x, y, n, r = 15 }: { x: number; y: number; n: string | number; r?: number }) {
  return (
    <g>
      <circle cx={x} cy={y} r={r} {...solid} strokeWidth={4} />
      <text x={x} y={y + r * 0.36} fontSize={r * 1.15} textAnchor="middle" fill="currentColor" stroke="none" style={display}>{n}</text>
    </g>
  );
}
const Tick = ({ x, y, s = 1 }: { x: number; y: number; s?: number }) => (
  <path d={`M${x - 13 * s} ${y} l${9 * s} ${10 * s} l${18 * s} ${-20 * s}`} {...line} strokeWidth={6} />
);
const Ex = ({ x, y, s = 1 }: { x: number; y: number; s?: number }) => (
  <g {...line} strokeWidth={6}>
    <path d={`M${x - 11 * s} ${y - 11 * s} l${22 * s} ${22 * s}`} />
    <path d={`M${x + 11 * s} ${y - 11 * s} l${-22 * s} ${22 * s}`} />
  </g>
);

/** IKEA panáček — hladká, oblá figura. */
function Person({ x = 180, y = 168, s = 1, pose = "stand" }: { x?: number; y?: number; s?: number; pose?: "stand" | "wave" | "cheer" | "side" | "reach" }) {
  const arms: Record<string, string> = {
    stand: "M-24 -26 Q-41 -4 -34 18 M24 -26 Q41 -4 34 18",
    wave: "M-24 -24 Q-40 -2 -33 20 M24 -30 Q44 -46 33 -66",
    cheer: "M-24 -28 Q-46 -48 -31 -68 M24 -28 Q46 -48 31 -68",
    side: "M-25 -24 Q-44 -20 -52 -6 M25 -24 Q44 -20 52 -6",
    reach: "M-24 -26 Q-41 -4 -34 18 M24 -28 Q48 -28 60 -36",
  };
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      {/* nohy */}
      <path d="M-12 10 L-15 66 q-1 9 9 9 M12 10 L15 66 q1 9 -9 9" {...line} strokeWidth={6} />
      {/* tělo (zvonek) */}
      <path d="M-29 14 Q-35 -40 0 -47 Q35 -40 29 14 Z" {...solid} />
      {/* ruce */}
      <path d={arms[pose]} {...line} strokeWidth={6} />
      {/* hlava */}
      <circle cx={0} cy={-72} r={21} {...solid} />
    </g>
  );
}

/* ── Drobné ikony ───────────────────────────────────────────────────────── */
const Heart = ({ x, y, s = 1 }: { x: number; y: number; s?: number }) => (
  <path transform={`translate(${x} ${y}) scale(${s})`} d="M0 -6 C-11 -22 -32 -10 0 16 C32 -10 11 -22 0 -6 Z" {...line} strokeWidth={4.5} />
);
const FragileGlass = ({ x, y, s = 1 }: { x: number; y: number; s?: number }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`} {...line} strokeWidth={3.5}>
    <path d="M-9 -14 L9 -14 L6 10 L-6 10 Z" />
    <path d="M-9 16 L9 16 M-13 -14 L13 -14" />
  </g>
);

/* ── Obsah (spready) ──────────────────────────────────────────────────────── */

type TT = { cs: string; en: string };
type Item = { lead?: string; mark?: "check" | "cross"; text: TT };
type Spread = {
  tag: string;
  cover?: boolean;
  art: React.ReactNode;
  kicker: TT;
  title: TT;
  items?: Item[];
  note?: TT;
};

const SPREADS: Spread[] = [
  /* 0 — obálka */
  {
    tag: "00",
    cover: true,
    art: (
      <Frame>
        <Person x={168} y={172} s={1.7} pose="wave" />
        {/* výstražná značka */}
        <g transform="translate(300 64)">
          <path d="M0 -26 L24 18 L-24 18 Z" {...line} />
          <path d="M0 -10 L0 6" {...line} strokeWidth={6} />
          <circle cx={0} cy={13} r={3.2} fill="currentColor" />
        </g>
      </Frame>
    ),
    kicker: { cs: "ART. NO. 1-986-400 · HOMO SAPIENS", en: "ART. NO. 1-986-400 · HOMO SAPIENS" },
    title: { cs: "Manuál na život", en: "Life Manual" },
    note: {
      cs: "DŮLEŽITÉ — přečíst před použitím, ideálně před narozením. Při nedodržení hrozí ztráta záruky. (Záruku stejně nikdo nečte.)",
      en: "IMPORTANT — read before use, ideally before birth. Non-compliance may void the warranty. (Nobody reads the warranty anyway.)",
    },
  },

  /* 1 — záruka & vady */
  {
    tag: "!",
    art: (
      <Frame>
        <Person x={128} y={172} s={1.45} pose="stand" />
        <g transform="rotate(-13 268 128)">
          <circle cx={268} cy={128} r={50} {...line} strokeWidth={4} />
          <circle cx={268} cy={128} r={40} {...line} strokeWidth={2} />
          <text x={268} y={123} fontSize={26} textAnchor="middle" fill="currentColor" stroke="none" style={display}>AS</text>
          <text x={268} y={150} fontSize={26} textAnchor="middle" fill="currentColor" stroke="none" style={display}>IS</text>
        </g>
      </Frame>
    ),
    kicker: { cs: "VAROVÁNÍ", en: "WARNING" },
    title: { cs: "Dodáváno tak, jak je", en: "Delivered as-is" },
    items: [
      { text: { cs: "Křivý nos, jedna noha delší", en: "Crooked nose, one leg longer" } },
      { text: { cs: "Trapné vzpomínky vyskakující ve 3 ráno", en: "Cringe memories popping up at 3 a.m." } },
      { text: { cs: "Občas vydává podivné zvuky", en: "Occasionally makes odd noises" } },
    ],
    note: {
      cs: "Přijetím tohoto kusu souhlasíš se všemi výrobními vadami. Reklamace neuznáváme — každý exemplář je originál.",
      en: "By accepting this unit you agree to all defects. No returns — every unit is an original.",
    },
  },

  /* 2 — obsah balení */
  {
    tag: "i",
    art: (
      <Frame>
        <Person x={92} y={170} s={1.05} pose="stand" />
        <NumBadge x={92} y={70} n={1} r={13} />
        <Heart x={196} y={86} s={1.5} />
        <NumBadge x={170} y={58} n={1} r={11} />
        {/* mozek */}
        <path d="M250 86 q-6 -24 18 -22 q24 -2 22 18 q12 12 -4 24 q-12 16 -26 2 q-20 -4 -10 -22" transform="translate(8 0)" {...line} strokeWidth={4.5} />
        <text x={278} y={120} fontSize={13} textAnchor="middle" fill="currentColor" stroke="none">86 mld.</text>
        {/* kost */}
        <path transform="translate(168 214)" d="M-30 0 q-12 -9 -2 -14 q9 -5 9 5 l36 0 q0 -10 9 -5 q10 5 -2 14 q12 9 2 14 q-9 5 -9 -5 l-36 0 q0 10 -9 5 q-10 -5 2 -14 Z" {...line} strokeWidth={4.5} />
        <text x={168} y={250} fontSize={13} textAnchor="middle" fill="currentColor" stroke="none">206×</text>
        {/* chybějící návod */}
        <rect x={250} y={188} width={56} height={64} rx={6} {...line} strokeWidth={3.5} />
        <Ex x={278} y={220} s={0.9} />
        <text x={278} y={270} fontSize={12} textAnchor="middle" fill="currentColor" stroke="none">0× návod</text>
      </Frame>
    ),
    kicker: { cs: "OBSAH BALENÍ", en: "IN THE BOX" },
    title: { cs: "Co najdeš uvnitř", en: "What's inside" },
    items: [
      { lead: "1×", text: { cs: "tělo · ~37 bilionů buněk", en: "body · ~37 trillion cells" } },
      { lead: "1×", text: { cs: "srdce · ~100 000 úderů za den", en: "heart · ~100,000 beats a day" } },
      { lead: "86mld", text: { cs: "neuronů · návod k obsluze nepřiložen", en: "neurons · operating manual not included" } },
      { lead: "206×", text: { cs: "kostí · novorozenec jich má ~300", en: "bones · newborns ship with ~300" } },
      { lead: "0–150k", text: { cs: "vlasů · dle modelu, úbytek bez záruky", en: "hairs · by model, loss not covered" } },
    ],
    note: {
      cs: "Vše už je uvnitř. Návod chybí schválně — sestavuješ se za plného provozu.",
      en: "It's all inside already. The manual is missing on purpose — you assemble yourself at full speed.",
    },
  },

  /* 3 — palivo */
  {
    tag: "01",
    art: (
      <Frame>
        {/* sklenice */}
        <g transform="translate(96 150)">
          <path d="M-30 -56 L-22 56 Q-20 64 0 64 Q20 64 22 56 L30 -56 Z" {...line} />
          <path d="M-25 -6 Q-12 8 0 -6 Q12 -20 25 -6 L22 56 Q20 64 0 64 Q-20 64 -22 56 Z" fill="currentColor" fillOpacity={0.08} stroke="none" />
          <text x={0} y={-72} fontSize={20} textAnchor="middle" fill="currentColor" stroke="none" style={display}>2–4 L</text>
        </g>
        {/* vidlička */}
        <path d="M210 96 v34 M200 96 v16 q0 7 10 7 q10 0 10 -7 v-16 M210 137 v123" {...line} strokeWidth={4.5} />
        {/* baterie + blesk */}
        <g transform="translate(296 196)">
          <rect x={-44} y={-26} width={80} height={56} rx={9} {...line} />
          <rect x={36} y={-10} width={10} height={24} rx={3} {...line} />
          <path d="M2 -16 l-16 26 h16 l-8 20" {...line} strokeWidth={4.5} />
        </g>
      </Frame>
    ),
    kicker: { cs: "ÚDRŽBA · PALIVO", en: "UPKEEP · FUEL" },
    title: { cs: "Doplňování energie", en: "Refuelling" },
    items: [
      { lead: "2–4 l", text: { cs: "tekutin denně · voda / pivo / kola dle modelu", en: "fluids a day · water / beer / cola by model" } },
      { lead: "~2000", text: { cs: "kcal denně · doplňuj pravidelně", en: "kcal a day · top up regularly" } },
    ],
    note: {
      cs: "Prázdná nádrž = podrážděnost (tzv. hlad-vztek). Resetuje se doplněním — pozor, na koho ji stihneš vylít.",
      en: "Empty tank = irritability (so-called hanger). Resets on refill — mind who you snap at first.",
    },
  },

  /* 4 — hibernace */
  {
    tag: "02",
    art: (
      <Frame>
        {/* postel */}
        <g transform="translate(180 196)">
          <path d="M-120 0 L120 0 M-120 0 L-120 -30 M120 0 L120 -52 M-120 -34 L70 -34 Q120 -34 120 16" {...line} />
          <rect x={-112} y={-58} width={64} height={26} rx={9} {...line} strokeWidth={4} />
          <circle cx={-30} cy={-48} r={17} {...solid} strokeWidth={4} />
          <path d="M-13 -48 Q60 -56 110 -16" {...line} strokeWidth={4.5} />
        </g>
        {/* Zzz */}
        <text x={190} y={86} fontSize={30} textAnchor="middle" fill="currentColor" stroke="none" style={display}>z z Z</text>
        {/* měsíc */}
        <path d="M300 70 a26 26 0 1 0 8 36 a20 20 0 1 1 -8 -36" {...line} strokeWidth={4.5} />
      </Frame>
    ),
    kicker: { cs: "PROVOZNÍ REŽIM", en: "OPERATING MODE" },
    title: { cs: "Hibernace", en: "Hibernation" },
    items: [
      { lead: "16 h", text: { cs: "provozu, pak odlož ke spánku", en: "of operation, then set down to sleep" } },
      { lead: "7–9 h", text: { cs: "na matraci, ve tmě a tichu", en: "on a mattress, in the dark and quiet" } },
    ],
    note: {
      cs: "Matrace není součástí balení. Bez hibernace přestává spolehlivě fungovat paměť, nálada i imunita.",
      en: "Mattress not included. Skip it and memory, mood and immunity stop working reliably.",
    },
  },

  /* 5 — vhodné zacházení */
  {
    tag: "03",
    art: (
      <Frame>
        <Person x={104} y={186} s={1.2} pose="side" />
        <Person x={256} y={186} s={1.2} pose="side" />
        <Heart x={180} y={96} s={2} />
        <Arrow d="M138 96 Q180 70 222 96" />
        <FragileGlass x={180} y={236} s={1.5} />
      </Frame>
    ),
    kicker: { cs: "ZACHÁZENÍ", en: "HANDLING" },
    title: { cs: "Křehké. Opatrně.", en: "Fragile. Handle with care." },
    items: [
      { mark: "check", text: { cs: "Chovej se k druhým tak, jak chceš, ať se chovají k tobě", en: "Treat others the way you want to be treated" } },
      { mark: "check", text: { cs: "Skladuj v suchu, podávej s laskavostí", en: "Keep dry, hand over with kindness" } },
      { mark: "cross", text: { cs: "Neházet. Neporovnávat s ostatními kusy", en: "Do not throw. Do not compare with other units" } },
    ],
    note: {
      cs: "Platí oboustranně — i ty jsi pro někoho křehký balík.",
      en: "Works both ways — you're someone's fragile parcel too.",
    },
  },

  /* 6 — mentální modely */
  {
    tag: "04",
    art: (
      <Frame>
        {/* hlava z profilu */}
        <path d="M118 232 q-44 0 -44 -66 q0 -82 78 -82 q74 0 74 72 q0 30 -24 38 l3 38 z" {...line} />
        {/* ozubené kolo */}
        <g transform="translate(150 150)" {...line} strokeWidth={4.5}>
          <circle cx={0} cy={0} r={24} />
          <circle cx={0} cy={0} r={9} />
          <path d="M0 -34 v10 M0 24 v10 M-34 0 h10 M24 0 h10 M-24 -24 l7 7 M17 17 l7 7 M24 -24 l-7 7 M-17 17 l-7 7" />
        </g>
        {/* žárovka */}
        <g transform="translate(264 116)" {...line} strokeWidth={4.5}>
          <circle cx={0} cy={0} r={24} />
          <path d="M-11 26 h22 M-8 34 h16" />
          <path d="M0 -40 v-12 M-34 0 h-12 M34 0 h12 M-24 -24 l-8 -8 M24 -24 l8 -8" strokeWidth={3.5} />
        </g>
      </Frame>
    ),
    kicker: { cs: "SOFTWARE", en: "SOFTWARE" },
    title: { cs: "Mentální modely", en: "Mental models" },
    items: [
      { lead: "01", text: { cs: "Nesrovnávej své zákulisí s cizím sestřihem", en: "Don't compare your backstage to a highlight reel" } },
      { lead: "02", text: { cs: "Skoro nikdo nemyslí na tvé chyby tolik jako ty", en: "Almost nobody dwells on your mistakes like you do" } },
      { lead: "03", text: { cs: "Většinu dnešních starostí si za rok nevybavíš", en: "Most of today's worries you won't recall in a year" } },
      { lead: "04", text: { cs: "Rozhodnout = odříznout zbytek; i nerozhodnutí je rozhodnutí", en: "To decide is to cut away the rest; not deciding is a decision too" } },
    ],
    note: {
      cs: "Software je důležitější než hardware. Přepiš je, kdykoli začnou víc škodit než pomáhat.",
      en: "Software beats hardware. Rewrite them whenever they do more harm than good.",
    },
  },

  /* 7 — spoj se */
  {
    tag: "05",
    art: (
      <Frame>
        <Person x={108} y={184} s={1.45} pose="side" />
        <Person x={252} y={184} s={1.45} pose="side" />
        <path d="M150 140 l22 0 l0 -11 l12 11 l-12 11 l0 -11" {...line} strokeWidth={4.5} />
        <path d="M210 140 l-22 0 l0 -11 l-12 11 l12 11 l0 -11" {...line} strokeWidth={4.5} />
        <text x={180} y={96} fontSize={24} textAnchor="middle" fill="currentColor" stroke="none" style={display}>cvak!</text>
      </Frame>
    ),
    kicker: { cs: "ZAPOJENÍ", en: "CONNECTION" },
    title: { cs: "Spoj se s ostatními kusy", en: "Connect with other units" },
    note: {
      cs: "Nejdelší studie o štěstí (Harvard, 85+ let) má jediný hlavní závěr: nerozhodují peníze ani sláva, ale kvalita vztahů. Týká se i toho introvertního modelu.",
      en: "The longest happiness study (Harvard, 85+ years) has one main finding: not money or fame, but the quality of your relationships. Even the introverted model.",
    },
  },

  /* 8 — když to praskne */
  {
    tag: "06",
    art: (
      <Frame>
        <g transform="rotate(-90 100 176)">
          <Person x={100} y={176} s={1.25} pose="stand" />
        </g>
        <Ex x={100} y={70} s={1.1} />
        <Arrow d="M150 168 H214" w={5} />
        <Person x={262} y={176} s={1.4} pose="cheer" />
        <Tick x={262} y={68} s={1.3} />
      </Frame>
    ),
    kicker: { cs: "OPRAVA", en: "REPAIR" },
    title: { cs: "Když se něco zlomí", en: "When something breaks" },
    note: {
      cs: "Rozbité a křivé díly patří k výrobku. Nereklamuj je — slep je časem a odpočinkem a sestavuj dál. Praskliny mimochodem pouštějí dovnitř světlo.",
      en: "Broken and bent parts come with the product. Don't return them — glue them with time and rest, and keep going. Cracks, by the way, let the light in.",
    },
  },

  /* 9 — hotovo */
  {
    tag: "✓",
    art: (
      <Frame>
        <Person x={150} y={178} s={1.95} pose="cheer" />
        <Tick x={150} y={52} s={1.7} />
        <g transform="translate(238 210)">
          <path d="M-32 -22 L26 -22 L46 0 L26 22 L-32 22 Z" {...line} strokeWidth={3.5} />
          <circle cx={-20} cy={0} r={4} fill="currentColor" />
          <text x={12} y={-2} fontSize={18} textAnchor="middle" fill="currentColor" stroke="none" style={display}>~4000</text>
          <text x={12} y={15} fontSize={10} textAnchor="middle" fill="currentColor" stroke="none">týdnů</text>
        </g>
      </Frame>
    ),
    kicker: { cs: "DOKONČENO", en: "COMPLETE" },
    title: { cs: "Hotovo", en: "Done" },
    note: {
      cs: "Výrobek nelze vrátit ani vyměnit. Záruka ≈ 4 000 týdnů (dle modelu a štěstí). Nenech ho ležet v krabici. Dotazy? → Zavolej někomu, koho máš rád.",
      en: "No returns, no exchanges. Warranty ≈ 4,000 weeks (by model and luck). Don't leave it in the box. Questions? → Call someone you love.",
    },
  },
];

const TOTAL = SPREADS.length;

/* ── Auto-fit: zmenší obsah, aby se nikdy nerolovalo ──────────────────────── */
function FitText({ dep, children, className = "" }: { dep: string; children: React.ReactNode; className?: string }) {
  const outer = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useIso(() => {
    const measure = () => {
      const o = outer.current, i = inner.current;
      if (!o || !i) return;
      const avail = o.clientHeight;
      const need = i.scrollHeight;
      const next = need > avail && need > 0 ? Math.max(0.62, (avail - 2) / need) : 1;
      setScale((p) => (Math.abs(p - next) < 0.01 ? p : next));
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (outer.current) ro.observe(outer.current);
    if (typeof document !== "undefined" && document.fonts?.ready) document.fonts.ready.then(measure).catch(() => {});
    return () => ro.disconnect();
  }, [dep]);

  return (
    <div ref={outer} className={`flex-1 min-h-0 overflow-hidden flex flex-col justify-center ${className}`}>
      <div ref={inner} style={{ transform: `scale(${scale})`, transformOrigin: "left center", width: "100%" }}>
        {children}
      </div>
    </div>
  );
}

/* ── Listy ──────────────────────────────────────────────────────────────── */

function PageShell({ side, children }: { side: "L" | "R"; children: React.ReactNode }) {
  return (
    <div className="relative h-full w-full bg-white overflow-hidden">
      {children}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 w-24"
        style={side === "L"
          ? { right: 0, background: "linear-gradient(to right, rgba(0,0,0,0) 50%, rgba(20,20,20,0.12))" }
          : { left: 0, background: "linear-gradient(to left, rgba(0,0,0,0) 50%, rgba(20,20,20,0.12))" }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 w-8"
        style={side === "L"
          ? { left: 0, background: "linear-gradient(to left, rgba(0,0,0,0), rgba(20,20,20,0.05))" }
          : { right: 0, background: "linear-gradient(to right, rgba(0,0,0,0), rgba(20,20,20,0.05))" }}
      />
    </div>
  );
}

function FaceHeader({ left, tag, n }: { left: boolean; tag?: string; n: number }) {
  const num = `${String(n).padStart(2, "0")} / ${String(TOTAL).padStart(2, "0")}`;
  return (
    <>
      <div className="flex items-center justify-between text-[#1A1A1A]/60 shrink-0">
        {left ? (
          <>
            <span className="inline-flex items-center justify-center min-w-8 h-8 px-2 border border-[#1A1A1A]/45 rounded-full font-semibold text-sm" style={display}>{tag}</span>
            <span className="text-[10px] tracking-[0.18em]" style={display}>1-986-400</span>
          </>
        ) : (
          <>
            <span className="text-[10px] tracking-[0.18em] uppercase">Návod · Manual</span>
            <span className="text-xs tabular-nums" style={display}>{num}</span>
          </>
        )}
      </div>
      <div className="border-t border-[#1A1A1A]/12 mt-2.5 shrink-0" />
    </>
  );
}

function ItemList({ items, lang }: { items: Item[]; lang: Lang }) {
  return (
    <ul className="mt-6">
      {items.map((it, k) => (
        <li key={k} className={`flex items-baseline gap-4 py-2.5 ${k > 0 ? "border-t border-[#1A1A1A]/10" : ""}`}>
          <span className="shrink-0 w-[3.6rem] text-right font-bold text-[#1A1A1A] text-sm tabular-nums" style={display}>
            {it.mark === "check" ? "✓" : it.mark === "cross" ? "✗" : it.lead ?? "—"}
          </span>
          <span className="text-[15px] sm:text-base leading-snug text-[#1A1A1A]/90">{it.text[lang]}</span>
        </li>
      ))}
    </ul>
  );
}

function TextBody({ sp, lang, cover }: { sp: Spread; lang: Lang; cover?: boolean }) {
  return (
    <>
      <span className="block text-[11px] font-semibold uppercase tracking-[0.26em] text-[#1A1A1A]/55">{sp.kicker[lang]}</span>
      <h2 className={`font-bold tracking-tight text-[#1A1A1A] mt-3 ${cover ? "text-5xl sm:text-6xl leading-[1.0]" : "text-3xl sm:text-4xl leading-[1.06]"}`} style={display}>
        {sp.title[lang]}
      </h2>
      {sp.items && <ItemList items={sp.items} lang={lang} />}
      {sp.note && (
        <p className={`border-l-2 border-[#1A1A1A] pl-4 text-[#1A1A1A]/80 leading-relaxed ${cover ? "mt-7 text-lg sm:text-xl" : "mt-6 text-[15px] sm:text-base"}`}>
          {sp.note[lang]}
        </p>
      )}
    </>
  );
}

/** Levý list — ilustrace. */
function LeftFace({ sp }: { sp: Spread }) {
  return (
    <div className="flex h-full flex-col px-7 sm:px-12 py-7 sm:py-9">
      <FaceHeader left tag={sp.tag} n={0} />
      <div className="flex-1 min-h-0 flex items-center justify-center text-[#1A1A1A] py-3">
        <div className={`w-full ${sp.cover ? "max-w-[480px]" : "max-w-[420px]"}`}>{sp.art}</div>
      </div>
    </div>
  );
}

/** Pravý list — text. */
function RightFace({ sp, lang, n }: { sp: Spread; lang: Lang; n: number }) {
  return (
    <div className="flex h-full flex-col px-7 sm:px-14 py-7 sm:py-9 overflow-hidden">
      <FaceHeader left={false} n={n} />
      <FitText dep={`${n}-${lang}`} className="mt-1">
        <TextBody sp={sp} lang={lang} cover={sp.cover} />
      </FitText>
    </div>
  );
}

/** Mobil — celé téma na jeden list (ilustrace + text), bez rolování. */
function MobileFace({ sp, lang, n }: { sp: Spread; lang: Lang; n: number }) {
  return (
    <div className="flex h-full flex-col px-6 py-6 overflow-hidden">
      <FaceHeader left={false} n={n} />
      <FitText dep={`m-${n}-${lang}`}>
        <div className="text-[#1A1A1A] mx-auto w-full max-w-[300px] mb-5">{sp.art}</div>
        <TextBody sp={sp} lang={lang} cover={sp.cover} />
      </FitText>
    </div>
  );
}

function FlipShade({ side }: { side: "L" | "R" }) {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0"
      style={{ background: side === "R" ? "linear-gradient(to left, rgba(20,20,20,0.16), rgba(0,0,0,0) 45%)" : "linear-gradient(to right, rgba(20,20,20,0.16), rgba(0,0,0,0) 45%)" }}
    />
  );
}

/* ── Komponenta ─────────────────────────────────────────────────────────── */

const FLIP_MS = 720;

export function LifeManual({ lang }: { lang: Lang }) {
  const t = UI[lang];
  const [s, setS] = useState(0);
  const [flip, setFlip] = useState<1 | -1 | null>(null);
  const [twoUp, setTwoUp] = useState(false);
  const [mobDir, setMobDir] = useState<1 | -1>(1);
  const dragX = useRef<number | null>(null);
  const sRef = useRef(0);
  const twoUpRef = useRef(false);

  useEffect(() => { sRef.current = s; }, [s]);
  useEffect(() => { twoUpRef.current = twoUp; }, [twoUp]);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 880px)");
    const apply = () => setTwoUp(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  const go = useCallback((d: 1 | -1) => {
    setFlip((cur) => {
      if (cur !== null) return cur;
      const at = sRef.current;
      const next = at + d;
      if (next < 0 || next >= TOTAL) return null;
      if (!twoUpRef.current) { setMobDir(d); setS(next); return null; }
      return d;
    });
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") go(1);
      else if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go]);

  const jump = (target: number) => {
    if (flip !== null || target === s) return;
    setMobDir(target > s ? 1 : -1);
    setS(target);
  };

  const canPrev = s > 0;
  const canNext = s < TOTAL - 1;

  const leftSp = flip === -1 ? SPREADS[s - 1] : SPREADS[s];
  const rightSp = flip === 1 ? SPREADS[s + 1] : SPREADS[s];
  const rightN = (flip === 1 ? s + 1 : s) + 1;

  return (
    <main className="h-[100dvh] flex flex-col bg-[#FAF9F6] text-[#1A1A1A] overflow-hidden" style={{ fontFamily: sans }}>
      <header className="flex items-center justify-between px-5 py-3 shrink-0">
        <Link href="/" className="text-sm opacity-70 hover:opacity-100 transition-opacity">{t.back}</Link>
        <span className="text-xs uppercase tracking-[0.2em] opacity-50" style={display}>{t.title}</span>
      </header>

      <div className="relative flex-1 min-h-0">
        <button aria-label={t.prev} onClick={() => go(-1)} disabled={!canPrev}
          className="absolute left-0 top-0 z-30 h-full w-12 sm:w-16 flex items-center justify-center text-4xl text-[#1A1A1A]/45 hover:text-[#1A1A1A] hover:bg-[#1A1A1A]/[0.03] disabled:opacity-15 disabled:hover:bg-transparent transition-colors">‹</button>
        <button aria-label={t.next} onClick={() => go(1)} disabled={!canNext}
          className="absolute right-0 top-0 z-30 h-full w-12 sm:w-16 flex items-center justify-center text-4xl text-[#1A1A1A]/45 hover:text-[#1A1A1A] hover:bg-[#1A1A1A]/[0.03] disabled:opacity-15 disabled:hover:bg-transparent transition-colors">›</button>

        <div
          className="h-full px-12 sm:px-20 py-4 sm:py-6"
          onPointerDown={(e) => (dragX.current = e.clientX)}
          onPointerUp={(e) => {
            if (dragX.current == null) return;
            const dx = e.clientX - dragX.current;
            dragX.current = null;
            if (dx < -55) go(1);
            else if (dx > 55) go(-1);
          }}
        >
          {twoUp ? (
            <div className="relative w-full h-full flex shadow-[0_30px_70px_-32px_rgba(0,0,0,0.5)]" style={{ perspective: "2600px" }}>
              <div className="relative w-1/2 h-full"><PageShell side="L"><LeftFace sp={leftSp} /></PageShell></div>
              <div className="relative w-1/2 h-full"><PageShell side="R"><RightFace sp={rightSp} lang={lang} n={rightN} /></PageShell></div>
              <div className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-[#1A1A1A]/25 z-10 pointer-events-none" />

              {flip !== null && (
                <div
                  className="absolute top-0 h-full"
                  style={{
                    width: "50%",
                    left: flip === 1 ? "50%" : 0,
                    transformOrigin: flip === 1 ? "left center" : "right center",
                    transformStyle: "preserve-3d",
                    zIndex: 20,
                    boxShadow: "0 0 40px -10px rgba(0,0,0,0.35)",
                    animation: `${flip === 1 ? "lm-fwd" : "lm-back"} ${FLIP_MS}ms ease-in-out forwards`,
                  }}
                  onAnimationEnd={() => { setS((p) => p + (flip ?? 0)); setFlip(null); }}
                >
                  <div className="absolute inset-0" style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" }}>
                    {flip === 1
                      ? <PageShell side="R"><RightFace sp={SPREADS[s]} lang={lang} n={s + 1} /></PageShell>
                      : <PageShell side="L"><LeftFace sp={SPREADS[s]} /></PageShell>}
                    <FlipShade side={flip === 1 ? "R" : "L"} />
                  </div>
                  <div className="absolute inset-0" style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden", transform: "rotateY(180deg)" }}>
                    {flip === 1
                      ? <PageShell side="L"><LeftFace sp={SPREADS[s + 1]} /></PageShell>
                      : <PageShell side="R"><RightFace sp={SPREADS[s - 1]} lang={lang} n={s} /></PageShell>}
                    <FlipShade side={flip === 1 ? "L" : "R"} />
                  </div>
                </div>
              )}

              {canNext && flip === null && (
                <button aria-label={t.next} onClick={() => go(1)} className="group absolute bottom-0 right-0 z-20 h-12 w-12">
                  <svg viewBox="0 0 48 48" className="h-full w-full">
                    <path d="M48 48 L48 8 L8 48 Z" fill="#F0EEE8" stroke="#1A1A1A" strokeOpacity="0.18" strokeWidth="1" />
                    <path d="M48 8 L8 48" stroke="#1A1A1A" strokeOpacity="0.3" strokeWidth="1" className="group-hover:stroke-[#1A1A1A]" />
                  </svg>
                </button>
              )}
            </div>
          ) : (
            <div className="w-full h-full shadow-[0_24px_60px_-30px_rgba(0,0,0,0.45)]" style={{ perspective: "1600px" }}>
              <div key={s} className="w-full h-full" style={{ transformStyle: "preserve-3d", animation: `${mobDir === 1 ? "lm-mob-fwd" : "lm-mob-back"} 480ms ease` }}>
                <PageShell side="R"><MobileFace sp={SPREADS[s]} lang={lang} n={s + 1} /></PageShell>
              </div>
            </div>
          )}
        </div>
      </div>

      <footer className="shrink-0 flex flex-col items-center gap-2 py-3">
        <div className="flex items-center gap-1.5">
          {SPREADS.map((_, idx) => (
            <button key={idx} aria-label={`${idx + 1}`} onClick={() => jump(idx)}
              className={`h-2 rounded-full transition-all ${idx === s ? "w-5 bg-[#1A1A1A]" : "w-2 bg-[#1A1A1A]/25 hover:bg-[#1A1A1A]/50"}`} />
          ))}
        </div>
        <p className="text-[11px] text-[#1A1A1A]/40 px-4 text-center">{t.hint}</p>
      </footer>

      <style>{`
        @keyframes lm-fwd { from { transform: rotateY(0deg); } to { transform: rotateY(-180deg); } }
        @keyframes lm-back { from { transform: rotateY(0deg); } to { transform: rotateY(180deg); } }
        @keyframes lm-mob-fwd { from { opacity: 0.25; transform: rotateY(-32deg); transform-origin: left center; } to { opacity: 1; transform: rotateY(0deg); } }
        @keyframes lm-mob-back { from { opacity: 0.25; transform: rotateY(32deg); transform-origin: right center; } to { opacity: 1; transform: rotateY(0deg); } }
      `}</style>
    </main>
  );
}
