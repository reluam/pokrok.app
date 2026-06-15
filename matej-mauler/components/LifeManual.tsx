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
const solid = { ...line, fill: "#fff" };
const ic = { stroke: "currentColor", strokeWidth: 2.6, fill: "none", strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

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
      <path d="M-12 10 L-15 66 q-1 9 9 9 M12 10 L15 66 q1 9 -9 9" {...line} strokeWidth={6} />
      <path d="M-29 14 Q-35 -40 0 -47 Q35 -40 29 14 Z" {...solid} />
      <path d={arms[pose]} {...line} strokeWidth={6} />
      <circle cx={0} cy={-72} r={21} {...solid} />
    </g>
  );
}

const Heart = ({ x, y, s = 1 }: { x: number; y: number; s?: number }) => (
  <path transform={`translate(${x} ${y}) scale(${s})`} d="M0 -6 C-11 -22 -32 -10 0 16 C32 -10 11 -22 0 -6 Z" {...line} strokeWidth={4.5} />
);

/* ── Drobné ikony pro kusovník ────────────────────────────────────────────── */
const IW = ({ children }: { children: React.ReactNode }) => (
  <svg viewBox="0 0 44 44" className="w-full h-full" aria-hidden>{children}</svg>
);
const IconCells = () => (
  <IW><g {...ic}>
    <circle cx={15} cy={16} r={8} /><circle cx={30} cy={14} r={6} /><circle cx={22} cy={29} r={9} /><circle cx={34} cy={30} r={5} />
    <circle cx={15} cy={16} r={2} fill="currentColor" stroke="none" /><circle cx={22} cy={29} r={2.4} fill="currentColor" stroke="none" />
  </g></IW>
);
const IconOrgans = () => (
  <IW><g {...ic}>
    <path d="M22 13 C18 7 10 10 15 17 C18 21 22 23 22 23 C22 23 26 21 29 17 C34 10 26 7 22 13 Z" />
    <path d="M11 27 q-5 5 0 10 q5 2 6 -3 q1 -6 -6 -7 Z" /><path d="M33 27 q5 5 0 10 q-5 2 -6 -3 q-1 -6 6 -7 Z" />
  </g></IW>
);
const IconBrain = () => (
  <IW><g {...ic}>
    <path d="M22 9 q11 -1 12 9 q4 3 0 8 q1 7 -7 7 q-5 4 -10 0 q-8 0 -7 -8 q-3 -5 2 -8 q0 -8 10 -8 Z" />
    <path d="M22 11 v22 M15 17 q4 2 0 6 M29 18 q-4 2 0 6" />
  </g></IW>
);
const IconBone = () => (
  <IW><g {...ic}>
    <path d="M12 18 q-5 -4 -1 -7 q4 -2 4 2 l14 0 q0 -4 4 -2 q5 3 -1 7 q5 4 -1 7 q-4 2 -4 -2 l-14 0 q0 4 -4 2 q-5 -3 1 -7 Z" />
  </g></IW>
);
const IconBlood = () => (
  <IW><g {...ic}>
    <path d="M22 8 q10 13 10 19 a10 10 0 1 1 -20 0 q0 -6 10 -19 Z" /><path d="M17 27 a5 5 0 0 0 3 7" />
  </g></IW>
);
const IconHair = () => (
  <IW><g {...ic}>
    <circle cx={22} cy={26} r={11} /><path d="M13 20 q3 -10 9 -10 q6 0 9 10 M16 16 q3 -5 6 -5 M22 11 q4 0 7 6" />
  </g></IW>
);

/* ── Obsah (spready) ──────────────────────────────────────────────────────── */

type TT = { cs: string; en: string };
type Item = { lead?: string; mark?: "check" | "cross"; icon?: React.ReactNode; text: TT };
type Spread = {
  tag: string;
  cover?: boolean;
  kind?: "standard" | "parts";
  art?: React.ReactNode;
  kicker: TT;
  title: TT;
  items?: Item[];
  note?: TT;
  sub?: TT;
};

const SPREADS: Spread[] = [
  /* 0 — obálka */
  {
    tag: "00",
    cover: true,
    art: (
      <Frame>
        <Person x={168} y={172} s={1.7} pose="wave" />
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
      cs: "Návod k použití. Jeden kus, jeden život, žádné náhradní díly.",
      en: "Instructions for use. One unit, one life, no spare parts.",
    },
  },

  /* 1 — úvod / vítej na světě */
  {
    tag: "→",
    art: (
      <Frame>
        <Person x={180} y={150} s={0.85} pose="cheer" />
        <g transform="translate(180 168)">
          <path d="M-74 0 L-74 64 L74 64 L74 0 Z" {...solid} />
          <path d="M-74 0 L-106 -20 M74 0 L106 -20 M-74 0 L-42 20 M74 0 L42 20" {...line} strokeWidth={4} />
          <path d="M-74 0 L74 0" {...line} />
          <rect x={-18} y={20} width={36} height={20} rx={3} {...line} strokeWidth={3} />
        </g>
        <g {...line} strokeWidth={3.5}>
          <path d="M250 64 v16 M242 72 h16" />
          <path d="M92 56 v14 M85 63 h14" />
          <path d="M286 116 l7 7 M293 116 l-7 7" />
        </g>
      </Frame>
    ),
    kicker: { cs: "ÚVOD", en: "INTRODUCTION" },
    title: { cs: "Vítej na světě", en: "Welcome to the world" },
    note: {
      cs: "Gratulujeme k narození a vítej ve světě. Čeká tě úžasný život, protkaný radostmi a bolestmi. Aby ses v něm neztratil, v tomto návodu najdeš základní informace pro život.",
      en: "Congratulations on being born, and welcome to the world. An amazing life awaits you, woven from joys and pains. So you don't get lost in it, this manual holds the basics for living.",
    },
    sub: {
      cs: "Disclaimer: Návod doporučujeme předat hned první den bytí. Při pozdějším čtení nezaručujeme úspěšnost.",
      en: "Disclaimer: best handed over on the first day of existence. If read later, success is not guaranteed.",
    },
  },

  /* 2 — záruka & vady */
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
    title: { cs: "Dodáno tak, jak je", en: "Delivered as-is" },
    items: [
      { text: { cs: "Vrácení ani výměna: nelze.", en: "Returns or exchanges: not possible." } },
      { text: { cs: "Náhradní díly: nejsou skladem.", en: "Spare parts: out of stock." } },
      { text: { cs: "Drobné vady jsou součást specifikace, ne chyba.", en: "Minor defects are part of the spec, not a fault." } },
    ],
    note: {
      cs: "Reklamace nepřijímáme. Veškerý servis probíhá za plného provozu.",
      en: "No claims accepted. All servicing happens during full operation.",
    },
  },

  /* 2 — obsah balení (kusovník přes obě stránky) */
  {
    tag: "i",
    kind: "parts",
    kicker: { cs: "OBSAH BALENÍ", en: "IN THE BOX" },
    title: { cs: "Co je v tobě", en: "What's inside you" },
    items: [
      { icon: <IconCells />, lead: "37 bil.", text: { cs: "buněk · jejich atomy se ukuly uvnitř hvězd", en: "cells · their atoms were forged inside stars" } },
      { icon: <IconOrgans />, lead: "5+", text: { cs: "orgánů · srdce, 2× ledviny, 2× plíce, játra, mozek…", en: "organs · heart, 2 kidneys, 2 lungs, liver, brain…" } },
      { icon: <IconBrain />, lead: "86 mld", text: { cs: "neuronů · návod k nim je v tiskárně, dorazí později", en: "neurons · the manual for them is at the printer, arriving later" } },
      { icon: <IconBone />, lead: "206×", text: { cs: "kostí · teď jich máš ~300, časem ti srostou", en: "bones · you have ~300 now, they'll fuse over time" } },
      { icon: <IconBlood />, lead: "0,3→5 l", text: { cs: "krve · teď máš pár deci, časem ~5 litrů", en: "blood · a few decilitres now, ~5 litres later" } },
      { icon: <IconHair />, lead: "0–150k", text: { cs: "vlasů · dle modelu; časem mohou ubývat", en: "hairs · by model; may thin out over time" } },
    ],
    note: {
      cs: "Všechno potřebné už máš v sobě — návod chybí schválně, sestavuješ se za pochodu. (Dodán s plným žaludkem; vrácení není možné.)",
      en: "You already hold everything you need — the manual is missing on purpose, you assemble yourself on the move. (Shipped with a full stomach; returns not possible.)",
    },
  },

  /* 3 — palivo / strava */
  {
    tag: "01",
    art: (
      <Frame>
        <g transform="translate(96 150)">
          <path d="M-30 -56 L-22 56 Q-20 64 0 64 Q20 64 22 56 L30 -56 Z" {...line} />
          <path d="M-25 -6 Q-12 8 0 -6 Q12 -20 25 -6 L22 56 Q20 64 0 64 Q-20 64 -22 56 Z" fill="currentColor" fillOpacity={0.08} stroke="none" />
          <text x={0} y={-72} fontSize={20} textAnchor="middle" fill="currentColor" stroke="none" style={display}>2–4 L</text>
        </g>
        <path d="M210 96 v34 M200 96 v16 q0 7 10 7 q10 0 10 -7 v-16 M210 137 v123" {...line} strokeWidth={4.5} />
        <g transform="translate(296 196)">
          <rect x={-44} y={-26} width={80} height={56} rx={9} {...line} />
          <rect x={36} y={-10} width={10} height={24} rx={3} {...line} />
          <path d="M2 -16 l-16 26 h16 l-8 20" {...line} strokeWidth={4.5} />
        </g>
      </Frame>
    ),
    kicker: { cs: "ÚDRŽBA · PALIVO", en: "UPKEEP · FUEL" },
    title: { cs: "Čím se dobíjet", en: "How to refuel" },
    items: [
      { lead: "2–4 l", text: { cs: "tekutin denně · voda ti promazává vše od mozku po klouby", en: "fluids a day · water keeps everything from your brain to your joints running" } },
      { lead: "vláknina", text: { cs: "zelenina a celozrnné · nakrmí bakterie ve tvých střevech — je jich víc než hvězd v Mléčné dráze", en: "veg and whole grains · feed your gut bacteria — there are more of them than stars in the Milky Way" } },
      { lead: "bílkoviny", text: { cs: "maso, ryby, luštěniny · z nich si stavíš svaly a opravuješ se", en: "meat, fish, legumes · you build muscle and repair yourself from them" } },
      { lead: "omega-3", text: { cs: "ryby a ořechy · mazivo pro tvůj mozek", en: "fish and nuts · oil for your brain" } },
      { lead: "vit. D", text: { cs: "slunce, ~15 min denně · zvedne ti náladu i imunitu", en: "sunlight, ~15 min a day · lifts your mood and immunity" } },
    ],
    note: {
      cs: "Nic ti není zakázané — jde o poměr. Tak 80 % rozumně, 20 % pro radost.",
      en: "Nothing is forbidden to you — it's about the ratio. About 80% sensible, 20% for joy.",
    },
  },

  /* 4 — hibernace / odpočinek / vyhoření */
  {
    tag: "02",
    art: (
      <Frame>
        <g transform="translate(180 196)">
          <path d="M-120 0 L120 0 M-120 0 L-120 -30 M120 0 L120 -52 M-120 -34 L70 -34 Q120 -34 120 16" {...line} />
          <rect x={-112} y={-58} width={64} height={26} rx={9} {...line} strokeWidth={4} />
          <circle cx={-30} cy={-48} r={17} {...solid} strokeWidth={4} />
          <path d="M-13 -48 Q60 -56 110 -16" {...line} strokeWidth={4.5} />
        </g>
        <text x={190} y={86} fontSize={30} textAnchor="middle" fill="currentColor" stroke="none" style={display}>z z Z</text>
        <path d="M300 70 a26 26 0 1 0 8 36 a20 20 0 1 1 -8 -36" {...line} strokeWidth={4.5} />
      </Frame>
    ),
    kicker: { cs: "PROVOZNÍ REŽIM", en: "OPERATING MODE" },
    title: { cs: "Spánek a chlazení", en: "Sleep & cooling" },
    items: [
      { lead: "16 h", text: { cs: "vzhůru → pak si na 7–9 h lehni do tmy a ticha", en: "awake → then lie down for 7–9 h in the dark and quiet" } },
      { lead: "20 min", text: { cs: "krátký šlofík tě dobije, když je toho moc", en: "a short nap recharges you when it's all too much" } },
      { lead: "PAUZA", text: { cs: "po velké zátěži se nech vychladnout — nejde jet pořád naplno", en: "after a heavy load let yourself cool down — you can't run flat-out forever" } },
    ],
    note: {
      cs: "Až ti půjde kouř z uší, je to přehřátí (vyhoření). Vypni se, odpoj od sítě (práce, telefon) a vychladni. Restart může trvat týdny.",
      en: "When smoke starts rising from your ears, it's overheating (burnout). Power down, unplug from the grid (work, phone) and cool off. A restart can take weeks.",
    },
  },

  /* — homo sapiens: tvor společenský */
  {
    tag: "△",
    art: (
      <Frame>
        <Person x={104} y={190} s={1.05} pose="side" />
        <Person x={180} y={184} s={1.2} pose="stand" />
        <Person x={256} y={190} s={1.05} pose="side" />
        <path d="M64 252 H296" {...line} strokeWidth={4} />
      </Frame>
    ),
    kicker: { cs: "EVOLUCE", en: "EVOLUTION" },
    title: { cs: "Tvor společenský", en: "A social creature" },
    items: [
      { lead: "300k", text: { cs: "let jsi laděný pro život ve skupině (rod Homo ~2,5 mil. let)", en: "years tuned for life in a group (genus Homo ~2.5M years)" } },
      { lead: "~150", text: { cs: "blízkých vztahů zvládneš naráz udržet (Dunbarovo číslo)", en: "close relationships you can keep at once (Dunbar's number)" } },
      { lead: "0", text: { cs: "drápů · přežili jsme spoluprací, ne silou", en: "claws · we survived by cooperating, not by force" } },
    ],
    note: {
      cs: "Jsi Homo sapiens sapiens — člověk společenský. Život není jen o tobě; samota ti nesvědčí a patřit někam je palivo, ne luxus.",
      en: "You're Homo sapiens sapiens — the social human. Life isn't only about you; solitude doesn't suit you, and belonging is fuel, not a luxury.",
    },
  },

  /* — kultivuj lásku (nejdřív ven, pak dovnitř) */
  {
    tag: "03",
    art: (
      <Frame>
        <Person x={104} y={188} s={1.2} pose="side" />
        <Person x={256} y={188} s={1.2} pose="side" />
        <Heart x={180} y={92} s={2.1} />
        <Arrow d="M138 94 Q180 66 222 94" />
        <Heart x={180} y={238} s={1.1} />
      </Frame>
    ),
    kicker: { cs: "VZTAHY", en: "RELATIONSHIPS" },
    title: { cs: "Kultivuj lásku", en: "Cultivate love" },
    items: [
      { mark: "check", text: { cs: "Nejdřív ven: buď laskavý k druhým, pomáhej, naslouchej", en: "Outward first: be kind to others, help, listen" } },
      { mark: "check", text: { cs: "Pak dovnitř: stejně laskavě i sám k sobě", en: "Then inward: be just as kind to yourself" } },
      { mark: "check", text: { cs: "Objímej a nech se objímat — objetí snižuje stres oběma", en: "Hug and be hugged — a hug lowers stress on both sides" } },
    ],
    note: {
      cs: "Rosteme skrz druhé. Lásku posílej ven i dovnitř — v tomhle pořadí.",
      en: "We grow through others. Send love outward and inward — in that order.",
    },
  },

  /* 6 — mentální modely */
  {
    tag: "04",
    art: (
      <Frame>
        <path d="M118 232 q-44 0 -44 -66 q0 -82 78 -82 q74 0 74 72 q0 30 -24 38 l3 38 z" {...line} />
        <g transform="translate(150 150)" {...line} strokeWidth={4.5}>
          <circle cx={0} cy={0} r={24} />
          <circle cx={0} cy={0} r={9} />
          <path d="M0 -34 v10 M0 24 v10 M-34 0 h10 M24 0 h10 M-24 -24 l7 7 M17 17 l7 7 M24 -24 l-7 7 M-17 17 l-7 7" />
        </g>
        <g transform="translate(264 116)" {...line} strokeWidth={4.5}>
          <circle cx={0} cy={0} r={24} />
          <path d="M-11 26 h22 M-8 34 h16" />
          <path d="M0 -40 v-12 M-34 0 h-12 M34 0 h12 M-24 -24 l-8 -8 M24 -24 l8 -8" strokeWidth={3.5} />
        </g>
      </Frame>
    ),
    kicker: { cs: "ÚDRŽBA MYSLI", en: "MIND UPKEEP" },
    title: { cs: "Pár věcí pro klidnější hlavu", en: "A few things for a calmer mind" },
    items: [
      { lead: "dech", text: { cs: "pomalý nádech a delší výdech zklidní nervy během chvilky", en: "a slow breath in and a longer breath out calm the nerves within moments" } },
      { lead: "meditace", text: { cs: "5–10 min denně si všímej dechu; mysl se učí nehonit každou myšlenku", en: "5–10 min a day, notice your breath; the mind learns not to chase every thought" } },
      { lead: "deník", text: { cs: "vypsat starosti na papír je dostane z hlavy ven", en: "writing worries on paper gets them out of your head" } },
      { lead: "ven", text: { cs: "procházka v přírodě resetuje náladu líp než scrollování", en: "a walk in nature resets your mood better than scrolling" } },
    ],
    note: {
      cs: "Myšlenky nejsi ty — jsou to návštěvy. Nemusíš každou pozvat dál.",
      en: "You are not your thoughts — they're visitors. You don't have to invite every one in.",
    },
  },

  /* 7 — známé chyby (biasy) */
  {
    tag: "!!",
    art: (
      <Frame>
        <g transform="translate(180 150)">
          <path d="M0 -80 L90 76 L-90 76 Z" {...line} />
          <g transform="translate(0 26)">
            <ellipse cx={0} cy={0} rx={26} ry={34} {...solid} />
            <path d="M0 -34 V34" {...line} strokeWidth={4} />
            <circle cx={0} cy={-42} r={11} {...solid} strokeWidth={4} />
            <path d="M-6 -51 q-8 -10 -17 -10 M6 -51 q8 -10 17 -10" {...line} strokeWidth={3.5} />
            <path d="M-26 -14 l-22 -8 M-26 4 l-24 0 M-26 20 l-22 11 M26 -14 l22 -8 M26 4 l24 0 M26 20 l22 11" {...line} strokeWidth={3.5} />
          </g>
        </g>
      </Frame>
    ),
    kicker: { cs: "ZNÁMÉ SOFTWAROVÉ CHYBY", en: "KNOWN SOFTWARE BUGS" },
    title: { cs: "Možné tovární chyby", en: "Possible factory bugs" },
    items: [
      { lead: "!", text: { cs: "Můžeš mít sklon vidět svět černobíle. Občas si schválně ukaž i ostatní barvy.", en: "You may tend to see the world in black and white. Now and then, show yourself the other colours on purpose." } },
      { lead: "!", text: { cs: "Budeš si víc všímat toho, co potvrzuje, co si už myslíš. Hledej i opačný názor.", en: "You'll notice more of what confirms what you already think. Go looking for the opposite view too." } },
      { lead: "!", text: { cs: "Jedna kritika ti přebije deset pochval. Připomínej si i to, co se povedlo.", en: "One criticism will outweigh ten compliments for you. Keep reminding yourself of what went well." } },
    ],
    note: {
      cs: "Tyhle chyby nejdou odinstalovat — ale když o nich víš, dají se obejít.",
      en: "These bugs can't be uninstalled — but once you know them, you can route around them.",
    },
  },

  /* 8 — hop nebo trop (pokročilý režim / odemčení) */
  {
    tag: "+",
    art: (
      <Frame>
        <g transform="translate(180 162)">
          <path d="M-24 -20 v-22 a24 24 0 0 1 44 -10" {...line} strokeWidth={7} />
          <rect x={-44} y={-20} width={88} height={76} rx={13} {...solid} />
          <circle cx={0} cy={10} r={9} {...line} strokeWidth={4} />
          <path d="M0 19 v15" {...line} strokeWidth={5} />
          <path d="M58 -36 l0 -16 M50 -44 l16 0 M70 -16 l0 -10 M65 -21 l10 0 M-58 -30 l0 -12 M-64 -36 l12 0" {...line} strokeWidth={3.5} />
        </g>
      </Frame>
    ),
    kicker: { cs: "POKROČILÝ REŽIM", en: "ADVANCED MODE" },
    title: { cs: "Hop, nebo trop", en: "Go big or go home" },
    items: [
      { lead: "+", text: { cs: "Dlouhodobé uvažování · rozhoduj se i za své budoucí já", en: "Long-term thinking · decide for your future self too" } },
      { lead: "+", text: { cs: "Empatie · dívej se na svět i očima druhých", en: "Empathy · see the world through other people's eyes too" } },
      { lead: "+", text: { cs: "Vděčnost · všímej si toho, co už funguje", en: "Gratitude · notice what already works" } },
    ],
    note: {
      cs: "POZOR: tímhle se z tebe může stát lepší člověk. Je to neautorizované odemčení (tzv. rooting) — záruka tím propadá. Pokračuj na vlastní nebezpečí.",
      en: "WARNING: this may turn you into a better person. It counts as an unauthorised unlock (so-called rooting) — it voids the warranty. Proceed at your own risk.",
    },
  },

  /* 9 — spoj se */
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
    title: { cs: "Spoj se s ostatními", en: "Connect with others" },
    note: {
      cs: "Nejdelší studie o štěstí (Harvard, 85+ let) má jediný hlavní závěr: nezáleží na penězích ani slávě, ale na kvalitě tvých vztahů. Platí to i pro samotáře — stačí pár blízkých, ne dav.",
      en: "The longest happiness study (Harvard, 85+ years) has one main finding: it's not money or fame, but the quality of your relationships. True even for loners — a few close ones is enough, not a crowd.",
    },
  },

  /* 10 — když to praskne */
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
      cs: "Občas se rozbiješ nebo pokřivíš — to k výrobku patří. Nereklamuj se, slep se časem a odpočinkem a pokračuj. Prasklinami mimochodem proudí dovnitř světlo (a vznikají z nich nejlepší historky).",
      en: "Sometimes you'll break or bend — that comes with the product. Don't return yourself; glue yourself with time and rest, and keep going. Cracks, by the way, are how the light gets in (and the best stories come out).",
    },
  },

  /* 11 — hotovo */
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
    title: { cs: "Den 1 dokončen", en: "Day 1 complete" },
    note: {
      cs: "Tohle byl den 1. Gratulujeme — Manuál na život máš úspěšně za sebou. Teď běž a začni žít. Zbývá ti zhruba 4 000 týdnů.",
      en: "That was day 1. Congratulations — you've completed the Life Manual. Now go and start living. You have roughly 4,000 weeks left.",
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
      const next = need > avail && need > 0 ? Math.max(0.6, (avail - 2) / need) : 1;
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
      <div aria-hidden className="pointer-events-none absolute inset-y-0 w-24"
        style={side === "L"
          ? { right: 0, background: "linear-gradient(to right, rgba(0,0,0,0) 50%, rgba(20,20,20,0.12))" }
          : { left: 0, background: "linear-gradient(to left, rgba(0,0,0,0) 50%, rgba(20,20,20,0.12))" }} />
      <div aria-hidden className="pointer-events-none absolute inset-y-0 w-8"
        style={side === "L"
          ? { left: 0, background: "linear-gradient(to left, rgba(0,0,0,0), rgba(20,20,20,0.05))" }
          : { right: 0, background: "linear-gradient(to right, rgba(0,0,0,0), rgba(20,20,20,0.05))" }} />
    </div>
  );
}

function FaceHeader({ left, tag, n }: { left: boolean; tag?: string; n: number }) {
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
            <span className="text-xs tabular-nums" style={display}>{String(n).padStart(2, "0")} / {String(TOTAL).padStart(2, "0")}</span>
          </>
        )}
      </div>
      <div className="border-t border-[#1A1A1A]/12 mt-2.5 shrink-0" />
    </>
  );
}

function Title({ sp, lang, cover }: { sp: Spread; lang: Lang; cover?: boolean }) {
  return (
    <>
      <span className="block text-[11px] font-semibold uppercase tracking-[0.26em] text-[#1A1A1A]/55">{sp.kicker[lang]}</span>
      <h2 className={`font-bold tracking-tight text-[#1A1A1A] mt-3 ${cover ? "text-5xl sm:text-6xl leading-[1.0]" : "text-3xl sm:text-4xl leading-[1.06]"}`} style={display}>
        {sp.title[lang]}
      </h2>
    </>
  );
}

function Note({ sp, lang, cover }: { sp: Spread; lang: Lang; cover?: boolean }) {
  if (!sp.note) return null;
  return (
    <p className={`border-l-2 border-[#1A1A1A] pl-4 text-[#1A1A1A]/80 leading-relaxed ${cover ? "mt-7 text-lg sm:text-xl" : "mt-6 text-[15px] sm:text-base"}`}>
      {sp.note[lang]}
    </p>
  );
}

function Sub({ sp, lang }: { sp: Spread; lang: Lang }) {
  if (!sp.sub) return null;
  return <p className="mt-4 text-[13px] sm:text-sm text-[#1A1A1A]/55 leading-relaxed">{sp.sub[lang]}</p>;
}

function ItemList({ items, lang }: { items: Item[]; lang: Lang }) {
  return (
    <ul className="mt-6">
      {items.map((it, k) => (
        <li key={k} className={`flex items-baseline gap-4 py-2.5 ${k > 0 ? "border-t border-[#1A1A1A]/10" : ""}`}>
          <span className="shrink-0 w-[3.4rem] text-right font-bold text-[#1A1A1A] text-sm tabular-nums" style={display}>
            {it.mark === "check" ? "✓" : it.mark === "cross" ? "✗" : it.lead ?? "—"}
          </span>
          <span className="text-[15px] sm:text-base leading-snug text-[#1A1A1A]/90">{it.text[lang]}</span>
        </li>
      ))}
    </ul>
  );
}

function PartRows({ items, lang }: { items: Item[]; lang: Lang }) {
  return (
    <ul className="mt-5">
      {items.map((it, k) => (
        <li key={k} className={`flex items-center gap-3 sm:gap-4 py-2.5 ${k > 0 ? "border-t border-[#1A1A1A]/10" : ""}`}>
          <span className="w-9 h-9 sm:w-11 sm:h-11 shrink-0 text-[#1A1A1A]">{it.icon}</span>
          <span className="w-[3.8rem] shrink-0 font-bold text-[#1A1A1A] text-[13px] tabular-nums" style={display}>{it.lead}</span>
          <span className="text-[14px] sm:text-[15px] leading-snug text-[#1A1A1A]/90">{it.text[lang]}</span>
        </li>
      ))}
    </ul>
  );
}

/** Levý list. */
function LeftFace({ sp, lang }: { sp: Spread; lang: Lang }) {
  if (sp.kind === "parts") {
    const half = Math.ceil((sp.items ?? []).length / 2);
    return (
      <div className="flex h-full flex-col px-7 sm:px-12 py-7 sm:py-9 overflow-hidden">
        <FaceHeader left tag={sp.tag} n={0} />
        <FitText dep={`pl-${sp.tag}-${lang}`} className="mt-1">
          <Title sp={sp} lang={lang} />
          <PartRows items={(sp.items ?? []).slice(0, half)} lang={lang} />
        </FitText>
      </div>
    );
  }
  return (
    <div className="flex h-full flex-col px-7 sm:px-12 py-7 sm:py-9">
      <FaceHeader left tag={sp.tag} n={0} />
      <div className="flex-1 min-h-0 flex items-center justify-center text-[#1A1A1A] py-3">
        <div className={`w-full ${sp.cover ? "max-w-[480px]" : "max-w-[420px]"}`}>{sp.art}</div>
      </div>
    </div>
  );
}

/** Pravý list. */
function RightFace({ sp, lang, n }: { sp: Spread; lang: Lang; n: number }) {
  return (
    <div className="flex h-full flex-col px-7 sm:px-14 py-7 sm:py-9 overflow-hidden">
      <FaceHeader left={false} n={n} />
      <FitText dep={`r-${n}-${lang}`} className="mt-1">
        {sp.kind === "parts" ? (
          <>
            <PartRows items={(sp.items ?? []).slice(Math.ceil((sp.items ?? []).length / 2))} lang={lang} />
            <Note sp={sp} lang={lang} />
          </>
        ) : (
          <>
            <Title sp={sp} lang={lang} cover={sp.cover} />
            {sp.items && <ItemList items={sp.items} lang={lang} />}
            <Note sp={sp} lang={lang} cover={sp.cover} />
            <Sub sp={sp} lang={lang} />
          </>
        )}
      </FitText>
    </div>
  );
}

/** Mobil — celé téma na jeden list, bez rolování. */
function MobileFace({ sp, lang, n, serial }: { sp: Spread; lang: Lang; n: number; serial: number | null }) {
  return (
    <div className="flex h-full flex-col px-6 py-6 overflow-hidden">
      <FaceHeader left={false} n={n} />
      <FitText dep={`m-${n}-${lang}`}>
        {sp.kind === "parts" ? (
          <>
            <Title sp={sp} lang={lang} />
            <PartRows items={sp.items ?? []} lang={lang} />
            <Note sp={sp} lang={lang} />
          </>
        ) : (
          <>
            {sp.art && <div className="text-[#1A1A1A] mx-auto w-full max-w-[280px] mb-5">{sp.art}</div>}
            <Title sp={sp} lang={lang} cover={sp.cover} />
            {sp.cover && <div className="mt-4"><SerialPill serial={serial} lang={lang} /></div>}
            {sp.items && <ItemList items={sp.items} lang={lang} />}
            <Note sp={sp} lang={lang} cover={sp.cover} />
            <Sub sp={sp} lang={lang} />
          </>
        )}
      </FitText>
    </div>
  );
}

function FlipShade({ side }: { side: "L" | "R" }) {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0"
      style={{ background: side === "R" ? "linear-gradient(to left, rgba(20,20,20,0.16), rgba(0,0,0,0) 45%)" : "linear-gradient(to right, rgba(20,20,20,0.16), rgba(0,0,0,0) 45%)" }} />
  );
}

/** Výrobní číslo = pořadí návštěvníka. */
function SerialPill({ serial, lang }: { serial: number | null; lang: Lang }) {
  if (serial == null) return null;
  return (
    <span className="inline-block text-[11px] uppercase tracking-[0.22em] text-[#1A1A1A]/75 border border-[#1A1A1A]/35 rounded-full px-3.5 py-1.5" style={display}>
      {lang === "cs" ? "Kus č." : "Unit No."} {String(serial).padStart(4, "0")}
    </span>
  );
}

/** Obálka jako jeden list (zavřená kniha). */
function CoverPage({ sp, lang, serial }: { sp: Spread; lang: Lang; serial: number | null }) {
  return (
    <div className="flex h-full flex-col items-center justify-between px-8 sm:px-12 py-10 sm:py-14 text-center">
      <span className="text-[11px] font-semibold uppercase tracking-[0.26em] text-[#1A1A1A]/55">{sp.kicker[lang]}</span>
      <div className="flex-1 min-h-0 flex flex-col items-center justify-center gap-5">
        <h1 className="text-5xl sm:text-6xl font-bold tracking-tight leading-[1.0] text-[#1A1A1A]" style={display}>{sp.title[lang]}</h1>
        <div className="w-40 sm:w-52 text-[#1A1A1A]">{sp.art}</div>
        <SerialPill serial={serial} lang={lang} />
      </div>
      <p className="text-sm text-[#1A1A1A]/65 max-w-xs leading-relaxed">{sp.note?.[lang]}</p>
    </div>
  );
}

/* ── Komponenta ─────────────────────────────────────────────────────────── */

const FLIP_MS = 720;

export function LifeManual({ lang }: { lang: Lang }) {
  const t = UI[lang];
  const [s, setS] = useState(0);
  const [flip, setFlip] = useState<1 | -1 | null>(null);
  const [coverAnim, setCoverAnim] = useState<"open" | "close" | null>(null);
  const [twoUp, setTwoUp] = useState(false);
  const [mobDir, setMobDir] = useState<1 | -1>(1);
  const [serial, setSerial] = useState<number | null>(null);
  const dragX = useRef<number | null>(null);
  const sRef = useRef(0);
  const twoUpRef = useRef(false);
  const flipRef = useRef<1 | -1 | null>(null);
  const coverRef = useRef<"open" | "close" | null>(null);

  useEffect(() => { sRef.current = s; }, [s]);
  useEffect(() => { twoUpRef.current = twoUp; }, [twoUp]);
  useEffect(() => { flipRef.current = flip; }, [flip]);
  useEffect(() => { coverRef.current = coverAnim; }, [coverAnim]);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 880px)");
    const apply = () => setTwoUp(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  // Výrobní číslo = pořadí návštěvníka. Server dedupuje přes cookie (prohlížeč si pamatuje).
  useEffect(() => {
    let alive = true;
    fetch("/api/visitor")
      .then((r) => r.json())
      .then((d) => { if (alive && typeof d?.no === "number") setSerial(d.no); })
      .catch(() => {});
    return () => { alive = false; };
  }, []);

  const go = useCallback((d: 1 | -1) => {
    if (coverRef.current !== null) return;
    if (!twoUpRef.current) {
      setMobDir(d);
      setS((p) => Math.min(TOTAL - 1, Math.max(0, p + d)));
      return;
    }
    const at = sRef.current;
    if (at === 0 && d === 1) { setCoverAnim("open"); return; } // rozbalení obálky
    if (at === 1 && d === -1) { setCoverAnim("close"); return; } // zavření zpět na obálku
    if (flipRef.current !== null) return;
    const next = at + d;
    if (next < 1 || next >= TOTAL) return;
    setFlip(d);
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
    if (coverAnim !== null || flip !== null || target === s) return;
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
            s === 0 && coverAnim === null ? (
              // ── zavřená kniha (jen obálka) ──
              <div className="h-full flex items-center justify-center" style={{ perspective: "2200px" }}>
                <div className="relative h-full w-full max-w-[30rem] bg-white shadow-[0_30px_70px_-28px_rgba(0,0,0,0.55)]">
                  <CoverPage sp={SPREADS[0]} lang={lang} serial={serial} />
                  <div aria-hidden className="absolute inset-y-0 left-0 w-1.5 bg-[#1A1A1A]/12" />
                  <div aria-hidden className="absolute top-1.5 bottom-1.5 -right-1.5 w-1.5 bg-white border border-[#1A1A1A]/10" />
                  <div aria-hidden className="absolute top-3 bottom-3 -right-3 w-1.5 bg-white border border-[#1A1A1A]/10" />
                  <button aria-label={t.next} onClick={() => go(1)} className="group absolute bottom-0 right-0 z-20 h-12 w-12">
                    <svg viewBox="0 0 48 48" className="h-full w-full">
                      <path d="M48 48 L48 8 L8 48 Z" fill="#F0EEE8" stroke="#1A1A1A" strokeOpacity="0.18" strokeWidth="1" />
                      <path d="M48 8 L8 48" stroke="#1A1A1A" strokeOpacity="0.3" strokeWidth="1" className="group-hover:stroke-[#1A1A1A]" />
                    </svg>
                  </button>
                </div>
              </div>
            ) : (
            <div className="relative w-full h-full flex shadow-[0_30px_70px_-32px_rgba(0,0,0,0.5)]" style={{ perspective: "2600px" }}>
              <div className="relative w-1/2 h-full" style={coverAnim === "open" ? { animation: "lm-open-bg 680ms ease forwards" } : undefined}>
                <PageShell side="L"><LeftFace sp={coverAnim ? SPREADS[1] : leftSp} lang={lang} /></PageShell>
              </div>
              <div className="relative w-1/2 h-full" style={coverAnim === "open" ? { animation: "lm-open-bg 680ms ease forwards" } : undefined}>
                <PageShell side="R"><RightFace sp={coverAnim ? SPREADS[1] : rightSp} lang={lang} n={coverAnim ? 2 : rightN} /></PageShell>
              </div>
              <div className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-[#1A1A1A]/25 z-10 pointer-events-none" />

              {flip !== null && coverAnim === null && (
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
                      : <PageShell side="L"><LeftFace sp={SPREADS[s]} lang={lang} /></PageShell>}
                    <FlipShade side={flip === 1 ? "R" : "L"} />
                  </div>
                  <div className="absolute inset-0" style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden", transform: "rotateY(180deg)" }}>
                    {flip === 1
                      ? <PageShell side="L"><LeftFace sp={SPREADS[s + 1]} lang={lang} /></PageShell>
                      : <PageShell side="R"><RightFace sp={SPREADS[s - 1]} lang={lang} n={s} /></PageShell>}
                    <FlipShade side={flip === 1 ? "L" : "R"} />
                  </div>
                </div>
              )}

              {coverAnim !== null && (
                <div className="absolute inset-0 z-40 flex items-center justify-center" style={{ perspective: "2200px" }}>
                  <div
                    className="relative h-full w-full max-w-[30rem] bg-white shadow-[0_30px_70px_-28px_rgba(0,0,0,0.55)]"
                    style={{
                      transformOrigin: "left center",
                      transformStyle: "preserve-3d",
                      backfaceVisibility: "hidden",
                      animation: `${coverAnim === "open" ? "lm-open" : "lm-close"} 680ms ease forwards`,
                    }}
                    onAnimationEnd={() => { setS(coverAnim === "open" ? 1 : 0); setCoverAnim(null); }}
                  >
                    <CoverPage sp={SPREADS[0]} lang={lang} serial={serial} />
                    <FlipShade side="R" />
                  </div>
                </div>
              )}

              {canNext && flip === null && coverAnim === null && (
                <button aria-label={t.next} onClick={() => go(1)} className="group absolute bottom-0 right-0 z-20 h-12 w-12">
                  <svg viewBox="0 0 48 48" className="h-full w-full">
                    <path d="M48 48 L48 8 L8 48 Z" fill="#F0EEE8" stroke="#1A1A1A" strokeOpacity="0.18" strokeWidth="1" />
                    <path d="M48 8 L8 48" stroke="#1A1A1A" strokeOpacity="0.3" strokeWidth="1" className="group-hover:stroke-[#1A1A1A]" />
                  </svg>
                </button>
              )}
            </div>
            )
          ) : (
            <div className="w-full h-full shadow-[0_24px_60px_-30px_rgba(0,0,0,0.45)]" style={{ perspective: "1600px" }}>
              <div key={s} className="w-full h-full" style={{ transformStyle: "preserve-3d", animation: `${mobDir === 1 ? "lm-mob-fwd" : "lm-mob-back"} 480ms ease` }}>
                <PageShell side="R"><MobileFace sp={SPREADS[s]} lang={lang} n={s + 1} serial={serial} /></PageShell>
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
        @keyframes lm-open { from { transform: rotateY(0deg); opacity: 1; } to { transform: rotateY(-108deg); opacity: 0; } }
        @keyframes lm-close { from { transform: rotateY(-108deg); opacity: 0; } to { transform: rotateY(0deg); opacity: 1; } }
        @keyframes lm-open-bg { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
    </main>
  );
}
