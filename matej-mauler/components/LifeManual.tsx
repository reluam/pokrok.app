"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";

/* ──────────────────────────────────────────────────────────────────────────
   Manuál na život / Life Manual  (English-only)
   Redesign: čisté technické listy (jeden list na stránku) ve stylu montážního
   manuálu — mono popisky, registrační rohové značky, blueprintová mřížka,
   jeden signální akcent (vermilion). Žádné listování knihou; obsah se nikdy
   neroluje (auto-fit zmenší celý list). Dobře čitelné i na mobilu.
   ────────────────────────────────────────────────────────────────────────── */

const FD = "var(--font-display)"; // Space Grotesk
const FS = "var(--font-sans)"; // Inter
const FM = "var(--font-mono)"; // JetBrains Mono

const INK = "#1a1614";
const BODY = "#2a2622";
const NOTE = "#4a443f";
const MUTED = "#9b958f";
const FAINT = "#b3ada7";
const PAPER = "#FBFAF5";
const PLATE = "#F6F4EE";
const ACCENT = "#CC4124";
const HAIR = "rgba(26,22,20,0.08)";
const BORDER = "rgba(26,22,20,0.10)";
const DOTS = "radial-gradient(circle, rgba(26,22,20,0.05) 1px, transparent 1px)";

const useIso = typeof window !== "undefined" ? useLayoutEffect : useEffect;

/* ── SVG ────────────────────────────────────────────────────────────────── */
const K = 0.78; // ztenčení tahů ~22 %
const sw = (w: number) => +(w * K).toFixed(2);
const LP = (w: number) => ({ fill: "none", stroke: "currentColor", strokeWidth: sw(w), strokeLinecap: "round" as const, strokeLinejoin: "round" as const });
const SP = (w: number) => ({ ...LP(w), fill: "#fff" });

function Person({ x = 180, y = 168, s = 1, pose = "stand" }: { x?: number; y?: number; s?: number; pose?: "stand" | "wave" | "cheer" | "side" | "reach"; }) {
  const arms: Record<string, string> = {
    stand: "M-24 -26 Q-41 -4 -34 18 M24 -26 Q41 -4 34 18",
    wave: "M-24 -24 Q-40 -2 -33 20 M24 -30 Q44 -46 33 -66",
    cheer: "M-24 -28 Q-46 -48 -31 -68 M24 -28 Q46 -48 31 -68",
    side: "M-25 -24 Q-44 -20 -52 -6 M25 -24 Q44 -20 52 -6",
    reach: "M-24 -26 Q-41 -4 -34 18 M24 -28 Q48 -28 60 -36",
  };
  const happy = pose === "cheer" || pose === "wave";
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
      <path d="M-12 10 L-15 66 q-1 9 9 9 M12 10 L15 66 q1 9 -9 9" strokeWidth={sw(6)} />
      <path d="M-29 14 Q-35 -40 0 -47 Q35 -40 29 14 Z" fill="#fff" strokeWidth={sw(5)} />
      <path d={arms[pose]} strokeWidth={sw(6)} />
      <circle cx={0} cy={-72} r={21} fill="#fff" strokeWidth={sw(5)} />
      {/* obličej — kapka osobnosti */}
      <circle cx={-7.5} cy={-74} r={1.9} fill="currentColor" stroke="none" />
      <circle cx={7.5} cy={-74} r={1.9} fill="currentColor" stroke="none" />
      <path d={happy ? "M-8 -66 Q0 -58 8 -66" : "M-6 -64 Q0 -67.5 6 -64"} strokeWidth={sw(3)} />
      {happy && <path d="M-34 -86 l-7 -6 M34 -86 l7 -6 M-40 -72 l-9 -1 M40 -72 l9 -1" strokeWidth={sw(2.4)} opacity={0.45} />}
    </g>
  );
}
const Tick = ({ x, y, s = 1 }: { x: number; y: number; s?: number }) => (
  <path d={`M${x - 13 * s} ${y} l${9 * s} ${10 * s} l${18 * s} ${-20 * s}`} {...LP(6)} />
);

function Frame({ children }: { children: React.ReactNode }) {
  return (
    <svg viewBox="0 0 360 300" width="100%" preserveAspectRatio="xMidYMid meet" style={{ display: "block", width: "100%", height: "auto", color: INK }} aria-hidden>
      <defs>
        <marker id="lm-arw" viewBox="0 0 10 10" refX="7.5" refY="5" markerWidth="5.5" markerHeight="5.5" orient="auto-start-reverse">
          <path d="M0.5 1 L9 5 L0.5 9" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </marker>
      </defs>
      {children}
    </svg>
  );
}
const txt = (extra?: React.CSSProperties): React.CSSProperties => ({ fontFamily: FD, fontWeight: 700, ...extra });

/* ── Ilustrace ──────────────────────────────────────────────────────────── */
const ArtCover = (
  <Frame>
    <Person x={168} y={172} s={1.7} pose="wave" />
    <g transform="translate(300 64)">
      <path d="M0 -26 L24 18 L-24 18 Z" {...LP(5)} />
      <path d="M0 -10 L0 6" {...LP(6)} />
      <circle cx={0} cy={13} r={3.2} fill="currentColor" />
    </g>
  </Frame>
);
const ArtIntro = (
  <Frame>
    <Person x={180} y={150} s={0.85} pose="cheer" />
    <g transform="translate(180 168)">
      <path d="M-74 0 L-74 64 L74 64 L74 0 Z" {...SP(5)} />
      <path d="M-74 0 L-106 -20 M74 0 L106 -20 M-74 0 L-42 20 M74 0 L42 20" {...LP(4)} />
      <path d="M-74 0 L74 0" {...LP(5)} />
      <rect x={-18} y={20} width={36} height={20} rx={3} {...LP(3)} />
    </g>
    <g {...LP(3.5)}>
      <path d="M250 64 v16 M242 72 h16" />
      <path d="M92 56 v14 M85 63 h14" />
      <path d="M286 116 l7 7 M293 116 l-7 7" />
    </g>
  </Frame>
);
const ArtWarranty = (
  <Frame>
    <Person x={128} y={172} s={1.45} pose="stand" />
    <g transform="rotate(-13 268 128)">
      <circle cx={268} cy={128} r={50} {...LP(4)} />
      <circle cx={268} cy={128} r={40} {...LP(2)} />
      <text x={268} y={123} fontSize={26} textAnchor="middle" fill="currentColor" stroke="none" style={txt()}>AS</text>
      <text x={268} y={150} fontSize={26} textAnchor="middle" fill="currentColor" stroke="none" style={txt()}>IS</text>
    </g>
  </Frame>
);
const ArtFuel = (
  <Frame>
    <g transform="translate(96 150)">
      <path d="M-30 -56 L-22 56 Q-20 64 0 64 Q20 64 22 56 L30 -56 Z" {...LP(5)} />
      <path d="M-25 -6 Q-12 8 0 -6 Q12 -20 25 -6 L22 56 Q20 64 0 64 Q-20 64 -22 56 Z" fill="currentColor" fillOpacity={0.08} stroke="none" />
      <text x={0} y={-72} fontSize={20} textAnchor="middle" fill="currentColor" stroke="none" style={txt()}>2–4 L</text>
    </g>
    <path d="M210 96 v34 M200 96 v16 q0 7 10 7 q10 0 10 -7 v-16 M210 137 v123" {...LP(4.5)} />
    <g transform="translate(296 196)">
      <rect x={-44} y={-26} width={80} height={56} rx={9} {...LP(5)} />
      <rect x={36} y={-10} width={10} height={24} rx={3} {...LP(5)} />
      <path d="M2 -16 l-16 26 h16 l-8 20" {...LP(4.5)} />
    </g>
  </Frame>
);
const ArtSleep = (
  <Frame>
    <g transform="translate(180 196)">
      <path d="M-120 0 L120 0 M-120 0 L-120 -30 M120 0 L120 -52 M-120 -34 L70 -34 Q120 -34 120 16" {...LP(5)} />
      <rect x={-112} y={-58} width={64} height={26} rx={9} {...LP(4)} />
      <circle cx={-30} cy={-48} r={17} {...SP(4)} />
      {/* spící obličej */}
      <path d="M-37 -50 q3 3 6 0 M-25 -50 q3 3 6 0" {...LP(2.4)} />
      <path d="M-13 -48 Q60 -56 110 -16" {...LP(4.5)} />
    </g>
    <text x={190} y={86} fontSize={30} textAnchor="middle" fill="currentColor" stroke="none" style={txt()}>z z Z</text>
    <path d="M300 70 a26 26 0 1 0 8 36 a20 20 0 1 1 -8 -36" {...LP(4.5)} />
  </Frame>
);
const ArtCare = (
  <Frame>
    <g transform="translate(120 152)">
      <rect x={-66} y={-92} width={132} height={184} rx={11} {...LP(5)} />
      <rect x={-24} y={-104} width={48} height={24} rx={7} {...LP(4)} />
      <g {...LP(4)}>
        <path d="M-46 -48 l8 9 l16 -19" />
        <path d="M-46 2 l8 9 l16 -19" />
        <path d="M-46 52 l8 9 l16 -19" />
      </g>
      <path d="M-12 -48 h50 M-12 2 h50 M-12 52 h50" {...LP(3.5)} />
    </g>
    <Person x={272} y={178} s={1.15} pose="wave" />
  </Frame>
);
const ArtMove = (
  <Frame>
    <Person x={190} y={170} s={1.6} pose="cheer" />
    <g {...LP(3.5)} opacity={0.5}>
      <path d="M84 110 q16 0 16 16" />
      <path d="M68 146 q20 0 20 20" />
      <path d="M80 182 q16 0 16 16" />
    </g>
    <path d="M62 254 H300" {...LP(4)} />
  </Frame>
);
const ArtMind = (
  <Frame>
    <path d="M118 232 q-44 0 -44 -66 q0 -82 78 -82 q74 0 74 72 q0 30 -24 38 l3 38 z" {...LP(5)} />
    {/* spokojený obličej v hlavě */}
    <circle cx={132} cy={150} r={2.2} fill="currentColor" stroke="none" />
    <circle cx={156} cy={150} r={2.2} fill="currentColor" stroke="none" />
    <path d="M130 162 q14 9 28 0" {...LP(3)} />
    <g transform="translate(232 116)" {...LP(4.5)}>
      <circle cx={0} cy={0} r={22} />
      <path d="M-10 24 h20 M-7 31 h14" />
      <path d="M0 -36 v-11 M-31 0 h-11 M31 0 h11 M-22 -22 l-7 -7 M22 -22 l7 -7" strokeWidth={sw(3.2)} />
    </g>
  </Frame>
);
const ArtDone = (
  <Frame>
    <Person x={150} y={188} s={1.7} pose="cheer" />
    {/* razítko hotovo — vlevo nahoře, mimo hlavu */}
    <g transform="translate(74 62)">
      <circle cx={0} cy={0} r={22} {...LP(4)} />
      <Tick x={0} y={-1} s={0.85} />
    </g>
    {/* lístek se zbývajícími dny */}
    <g transform="translate(252 248)">
      <path d="M-54 -22 L40 -22 L60 0 L40 22 L-54 22 Z" {...LP(3.5)} />
      <circle cx={-42} cy={0} r={4} fill="currentColor" />
      <text x={5} y={-3} fontSize={15} textAnchor="middle" fill="currentColor" stroke="none" style={txt()}>1 / 28,156</text>
      <text x={5} y={13} fontSize={8} textAnchor="middle" fill="currentColor" stroke="none">DAYS · DAY 1 DONE</text>
    </g>
  </Frame>
);

/* ── Ikony kusovníku ──────────────────────────────────────────────────────── */
const iconBase = { fill: "none", stroke: "currentColor", strokeWidth: 2.1, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
const IW = ({ children }: { children: React.ReactNode }) => (
  <svg viewBox="0 0 44 44" width="100%" height="100%" style={{ display: "block" }} aria-hidden>{children}</svg>
);
const ICONS: Record<string, React.ReactNode> = {
  cells: <IW><g {...iconBase}><circle cx={15} cy={16} r={8} /><circle cx={30} cy={14} r={6} /><circle cx={22} cy={29} r={9} /><circle cx={34} cy={30} r={5} /><circle cx={15} cy={16} r={2} fill="currentColor" stroke="none" /><circle cx={22} cy={29} r={2.4} fill="currentColor" stroke="none" /></g></IW>,
  organs: <IW><g {...iconBase}><path d="M22 13 C18 7 10 10 15 17 C18 21 22 23 22 23 C22 23 26 21 29 17 C34 10 26 7 22 13 Z" /><path d="M11 27 q-5 5 0 10 q5 2 6 -3 q1 -6 -6 -7 Z" /><path d="M33 27 q5 5 0 10 q-5 2 -6 -3 q-1 -6 6 -7 Z" /></g></IW>,
  brain: <IW><g {...iconBase}><path d="M22 9 q11 -1 12 9 q4 3 0 8 q1 7 -7 7 q-5 4 -10 0 q-8 0 -7 -8 q-3 -5 2 -8 q0 -8 10 -8 Z" /><path d="M22 11 v22 M15 17 q4 2 0 6 M29 18 q-4 2 0 6" /></g></IW>,
  bone: <IW><g {...iconBase}><path d="M12 18 q-5 -4 -1 -7 q4 -2 4 2 l14 0 q0 -4 4 -2 q5 3 -1 7 q5 4 -1 7 q-4 2 -4 -2 l-14 0 q0 4 -4 2 q-5 -3 1 -7 Z" /></g></IW>,
  blood: <IW><g {...iconBase}><path d="M22 8 q10 13 10 19 a10 10 0 1 1 -20 0 q0 -6 10 -19 Z" /><path d="M17 27 a5 5 0 0 0 3 7" /></g></IW>,
  hair: <IW><g {...iconBase}><circle cx={22} cy={26} r={11} /><path d="M13 20 q3 -10 9 -10 q6 0 9 10 M16 16 q3 -5 6 -5 M22 11 q4 0 7 6" /></g></IW>,
};

/* ── Obsah ──────────────────────────────────────────────────────────────── */
type Item = { lead?: string; mark?: "check" | "cross"; icon?: string; wm?: string; text: string };
type Spread = {
  tag: string;
  cover?: boolean;
  done?: boolean;
  kind?: "parts";
  layout?: "tiles" | "rows";
  minTile?: number;
  art?: React.ReactNode;
  kicker: string;
  title: string;
  items?: Item[];
  note?: string;
  sub?: string;
};

const SPREADS: Spread[] = [
  { tag: "00", cover: true, art: ArtCover, kicker: "ART. NO. 1-986-400 · HOMO SAPIENS", title: "Life Manual", note: "Instructions for use." },
  { tag: "→", art: ArtIntro, kicker: "INTRODUCTION", title: "Welcome to the world",
    note: "Congratulations on being born, and welcome to the world. An amazing life awaits you, woven from joys and pains. So you don't get lost in it, this manual holds the basics for living.",
    sub: "Disclaimer: best handed over on the first day of existence. If read later, success is not guaranteed." },
  { tag: "!", art: ArtWarranty, kicker: "WARNING", title: "Delivered as-is",
    items: [
      { text: "Returns or exchanges are not possible." },
      { text: "Generally, there are no spare parts. Tread carefully." },
      { text: "Minor defects are to be expected. Major defects may be present in this particular unit." },
    ],
    note: "No claims accepted. All servicing happens during full operation." },
  { tag: "i", kind: "parts", layout: "tiles", minTile: 232, kicker: "IN THE BOX", title: "Part list",
    items: [
      { icon: "cells", lead: "37 bil.", text: "cells · their atoms were forged inside stars" },
      { icon: "organs", lead: "78", text: "organs · the main ones two pages on" },
      { icon: "brain", lead: "86 bn", text: "neurons · their manual is at the printer, arriving later" },
      { icon: "bone", lead: "206×", text: "bones · you have ~300 now, they'll fuse over time" },
      { icon: "blood", lead: "0.3→5 l", text: "blood · a few decilitres now, ~5 litres later" },
      { icon: "hair", lead: "0–150k", text: "hairs · by model; may thin out over time" },
    ],
    note: "Exact figures may differ slightly from unit to unit, and also change with the unit's age." },
  { tag: "i", kind: "parts", layout: "tiles", minTile: 232, kicker: "ORGANS", title: "Important organs",
    items: [
      { lead: "1×", text: "brain · runs the whole body and you" },
      { lead: "1×", text: "heart · pumps blood, ~100,000×/day" },
      { lead: "2×", text: "lungs · oxygenate blood, ~20,000 breaths/day" },
      { lead: "1×", text: "liver · chemical factory, 500+ jobs" },
      { lead: "2×", text: "kidneys · filter blood, ~180 l/day" },
      { lead: "1×", text: "stomach · breaks down food with acid" },
      { lead: "~7.5 m", text: "intestines · absorb nutrients" },
      { lead: "1×", text: "pancreas · insulin and digestive enzymes" },
      { lead: "1×", text: "spleen · recycles blood, boosts immunity" },
      { lead: "1×", text: "skin · the largest organ, ~2 m²" },
    ],
    note: "~78 organs in total. Selling one may have unexpected consequences for the whole unit." },
  { tag: "i", kind: "parts", layout: "tiles", minTile: 150, kicker: "CHEMICAL MAKEUP", title: "Down to the elements",
    items: [
      { lead: "65%", wm: "O", text: "Oxygen" },
      { lead: "18.5%", wm: "C", text: "Carbon" },
      { lead: "9.5%", wm: "H", text: "Hydrogen" },
      { lead: "3.2%", wm: "N", text: "Nitrogen" },
      { lead: "1.5%", wm: "Ca", text: "Calcium" },
      { lead: "1.0%", wm: "P", text: "Phosphorus" },
      { lead: "0.4%", wm: "K", text: "Potassium" },
      { lead: "0.3%", wm: "S", text: "Sulfur" },
      { lead: "0.2%", wm: "Na", text: "Sodium" },
      { lead: "0.2%", wm: "Cl", text: "Chlorine" },
      { lead: "0.1%", wm: "Mg", text: "Magnesium" },
      { lead: "<1%", wm: "+", text: "trace · Fe, Zn, I, Cu, F, Se…" },
    ],
    note: "About 96% of you is just oxygen, carbon, hydrogen and nitrogen. The rest is seasoning." },
  { tag: "★", art: ArtCare, kicker: "MAINTENANCE", title: "Proper care",
    items: [
      { lead: "rest", text: "keep regular operating hours — sleep and recover" },
      { lead: "move", text: "use the moving parts every day" },
      { lead: "fuel", text: "refuel with the right kind of energy" },
      { lead: "mind", text: "keep the brain busy, curious and connected" },
    ],
    note: "For best performance your unit needs proper care. Neglected, it still runs — just worse, and not for as long. The four essentials, one per page next." },
  { tag: "01", art: ArtSleep, kicker: "OPERATING HOURS", title: "Operating hours",
    items: [
      { lead: "16 h", text: "awake → then lie down for 7–9 h in the dark and quiet" },
      { lead: "20 min", text: "a short nap recharges you when it's all too much" },
      { lead: "PAUSE", text: "after a heavy load let yourself cool down — you can't run flat-out forever" },
    ],
    note: "When smoke starts rising from your ears, it's overheating (burnout). Power down, unplug from the grid (work, phone) and cool off. A restart can take weeks." },
  { tag: "02", art: ArtMove, kicker: "LOCOMOTION", title: "Use your moving parts",
    items: [
      { lead: "daily", text: "move a bit every day — walk, dance, take the stairs" },
      { lead: "sit less", text: "long sitting stiffens the chassis; stand up and stretch" },
      { lead: "fun", text: "the exercise you enjoy is the one you'll actually keep" },
    ],
    note: "A unit in motion stays in working order; one left at rest starts to seize. No gym required — just keep moving." },
  { tag: "03", art: ArtFuel, kicker: "FUEL", title: "Food & drink",
    items: [
      { lead: "2–4 l", text: "fluids a day · water keeps everything from your brain to your joints running" },
      { lead: "fibre", text: "veg and whole grains · feed your gut bacteria — more of them than stars in the Milky Way" },
      { lead: "protein", text: "meat, fish, legumes · building blocks for muscle and repair" },
      { lead: "fats", text: "omega-3 and omega-6 (fish, nuts) · oil for brain and cells" },
      { lead: "carbs", text: "in moderation · quick energy for now" },
      { lead: "sun", text: "~15 min of rays a day · tops up vitamin D, which lifts mood and immunity" },
    ],
    note: "Nothing is forbidden to you — it's about the ratio. About 80% sensible, 20% for joy." },
  { tag: "04", art: ArtMind, kicker: "MENTAL", title: "Keep the brain busy",
    items: [
      { lead: "connect", text: "relationships are the #1 predictor of happiness (Harvard, 85 yrs); you're a social unit" },
      { lead: "be kind", text: "kindness and cooperation — outward first, then to yourself" },
      { lead: "compare", text: "your backstage vs other people's highlight reel; nobody dwells on your mistakes like you do" },
      { lead: "it passes", text: "most of today's worries you won't even recall in a year" },
      { lead: "watch bias", text: "you lean to black-and-white and to the negative — go find the other view" },
      { lead: "level up", text: "long-term thinking, empathy, gratitude (warning: may make you a better person)" },
    ],
    note: "Software matters more than hardware. Keep it curious, connected and kind." },
  { tag: "✗", kind: "parts", kicker: "TROUBLESHOOTING", title: "Common faults",
    items: [
      { lead: "✗", text: "No appetite for work → just do the first 2 minutes; the appetite follows" },
      { lead: "✗", text: "Loneliness → reach out to someone; even a short message helps" },
      { lead: "✗", text: "Intrusive 3 a.m. thoughts → write them down and sleep; smaller by morning" },
      { lead: "✗", text: "Existential crisis → a routine update; get outside, see people, eat, overthink less" },
      { lead: "✗", text: "Anxiety → slow the breath; separate real threats from imagined — most never arrive" },
    ],
    note: "Most faults are temporary and normal. If one lingers, call professional service (a therapist) — no shame, just maintenance." },
  { tag: "✓", done: true, art: ArtDone, kicker: "DONE", title: "Day 1 complete",
    note: "Day 1 — completed successfully. From here you have roughly 28,155 days left to live. Now that you are prepared for everything, go out and do great things!" },
];

const TOTAL = SPREADS.length;
const LAST = TOTAL - 1;
const SYM = /^[!✗✓+△→×]/;

/* dlaždice kusovníku — vodoznak (ikona/symbol/číslo) vzadu; nahoře číslo + klíčové
   slovo ve stejné akcentní barvě na jednom řádku, popis pod tím */
function PartTile({ it }: { it: Item }) {
  const parts = it.text.split(" · ");
  const kw = parts.length > 1 ? parts[0] : "";
  const body = parts.length > 1 ? parts.slice(1).join(" · ") : it.text;
  const wm = it.wm ?? it.lead;
  return (
    <div style={{ position: "relative", overflow: "hidden", border: `1px solid ${BORDER}`, borderRadius: 9, background: "#fff", padding: "13px 15px", minHeight: 66, display: "flex", flexDirection: "column", justifyContent: "center", gap: 4 }}>
      <div aria-hidden style={it.icon
        ? { position: "absolute", right: -6, bottom: -10, width: 66, height: 66, color: INK, opacity: 0.1, pointerEvents: "none" }
        : { position: "absolute", right: 4, bottom: -14, color: INK, opacity: 0.08, pointerEvents: "none", fontFamily: FD, fontWeight: 700, fontSize: 56, lineHeight: 1, whiteSpace: "nowrap" }}>
        {it.icon ? ICONS[it.icon] : wm}
      </div>
      <div style={{ position: "relative", display: "flex", alignItems: "baseline", gap: 7, flexWrap: "wrap" }}>
        <span style={{ fontFamily: FD, fontWeight: 700, fontSize: 14.5, color: ACCENT }}>{it.lead}</span>
        {kw && <span style={{ fontFamily: FD, fontWeight: 600, fontSize: 14.5, color: ACCENT }}>{kw}</span>}
      </div>
      {body && <div style={{ position: "relative", fontSize: 13.5, lineHeight: 1.38, color: BODY }}>{body}</div>}
    </div>
  );
}

/* ── Komponenta ─────────────────────────────────────────────────────────── */
export function LifeManual() {
  const [i, setI] = useState(0);
  const [scale, setScale] = useState(1);
  const [serial, setSerial] = useState<number | null>(null);
  const outer = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  const dragX = useRef<number | null>(null);
  const iRef = useRef(0);

  useEffect(() => { iRef.current = i; }, [i]);

  const go = useCallback((d: number) => {
    setI((p) => Math.min(LAST, Math.max(0, p + d)));
    setScale(1);
  }, []);
  const jump = (idx: number) => { setI(idx); setScale(1); };

  // počítadlo návštěvníků = výrobní číslo (server dedupuje přes cookie)
  useEffect(() => {
    let alive = true;
    fetch("/api/visitor").then((r) => r.json()).then((d) => { if (alive && typeof d?.no === "number") setSerial(d.no); }).catch(() => {});
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "ArrowRight") go(1); else if (e.key === "ArrowLeft") go(-1); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go]);

  const fit = useCallback(() => {
    const o = outer.current, n = inner.current;
    if (!o || !n) return;
    const avail = o.clientHeight;
    const need = n.scrollHeight;
    const s = need > avail && need > 0 ? Math.max(0.5, (avail - 2) / need) : 1;
    setScale((p) => (Math.abs(p - s) < 0.01 ? p : s));
  }, []);

  useIso(() => {
    fit();
    const ro = new ResizeObserver(() => fit());
    if (outer.current) ro.observe(outer.current);
    if (inner.current) ro.observe(inner.current);
    if (typeof document !== "undefined" && document.fonts?.ready) document.fonts.ready.then(fit).catch(() => {});
    return () => ro.disconnect();
  }, [i, serial, fit]);

  const sp = SPREADS[i];
  const isParts = sp.kind === "parts";
  const isCentered = !!sp.cover || !!sp.done;
  const canPrev = i > 0, canNext = i < LAST;

  const mono = (extra?: React.CSSProperties): React.CSSProperties => ({ fontFamily: FM, textTransform: "uppercase", ...extra });

  /* štítek čísla kroku v kolečku */
  const stepBadge = (size: number) => (
    <div style={{ width: size, height: size, flex: "none", border: `2px solid ${INK}`, borderRadius: "50%", display: "grid", placeItems: "center", fontFamily: FD, fontWeight: 700, fontSize: size * 0.4, color: ACCENT, lineHeight: 1 }}>{sp.tag}</div>
  );

  const noteBlock = (max: string) => sp.note ? (
    <div style={{ marginTop: 20 }}>
      <div style={mono({ fontSize: 10, letterSpacing: ".22em", color: ACCENT, marginBottom: 7 })}>Note</div>
      <p style={{ fontSize: "clamp(14px,1.05vw,16px)", lineHeight: 1.55, color: NOTE, margin: 0, maxWidth: max }}>{sp.note}</p>
    </div>
  ) : null;

  const itemList = sp.items ? (
    <ul style={{ listStyle: "none", margin: "0 0 2px", padding: 0 }}>
      {sp.items.map((it, k) => {
        const badge = it.mark === "check" ? "✓" : it.mark === "cross" ? "✗" : (it.lead ?? "—");
        const acc = !!it.mark || SYM.test(it.lead ?? "");
        return (
          <li key={k} style={{ display: "flex", gap: 16, alignItems: "baseline", padding: "10px 0", borderBottom: `1px solid ${HAIR}` }}>
            <span style={{ flex: "none", minWidth: 50, textAlign: "right", fontFamily: FD, fontWeight: 700, fontSize: 15, color: acc ? ACCENT : INK }}>{badge}</span>
            <span style={{ fontSize: "clamp(14px,1vw,16px)", lineHeight: 1.45, color: BODY }}>{it.text}</span>
          </li>
        );
      })}
    </ul>
  ) : null;

  return (
    <main style={{ position: "relative", height: "100dvh", display: "flex", flexDirection: "column", background: PAPER, color: INK, fontFamily: FS, overflow: "hidden" }}>
      <style>{`
        .lm-arrow{transition:opacity .2s,background .2s;}
        .lm-arrow:hover:not(:disabled){opacity:.7 !important;background:rgba(26,22,20,0.05);}
        .lm-back{transition:color .2s;} .lm-back:hover{color:#1a1614 !important;}
        .lm-dot{transition:all .25s ease;}
      `}</style>

      {/* blueprintová mřížka */}
      <div aria-hidden style={{ position: "absolute", inset: 0, zIndex: 0, pointerEvents: "none", backgroundImage: DOTS, backgroundSize: "24px 24px", WebkitMaskImage: "radial-gradient(ellipse 80% 70% at 50% 45%, #000 35%, transparent 100%)", maskImage: "radial-gradient(ellipse 80% 70% at 50% 45%, #000 35%, transparent 100%)" }} />

      {/* header */}
      <header style={{ position: "relative", zIndex: 2, display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px clamp(16px,3vw,30px)", flex: "none" }}>
        <Link href="/" className="lm-back" style={{ fontSize: 13.5, color: "#6b6560", textDecoration: "none" }}>← Spaghetti.ltd</Link>
        <span style={mono({ fontSize: 10.5, letterSpacing: ".26em", color: FAINT })}>Life Manual · Spaghetti.ltd</span>
      </header>

      {/* stage */}
      <div style={{ position: "relative", zIndex: 1, flex: 1, minHeight: 0, display: "flex", alignItems: "center", justifyContent: "center", padding: "6px clamp(8px,2vw,24px)" }}
        onPointerDown={(e) => (dragX.current = e.clientX)}
        onPointerUp={(e) => { if (dragX.current == null) return; const d = e.clientX - dragX.current; dragX.current = null; if (d < -55) go(1); else if (d > 55) go(-1); }}>

        <button aria-label="prev" className="lm-arrow" onClick={() => go(-1)} disabled={!canPrev} style={sideBtn(canPrev, "left")}>‹</button>
        <button aria-label="next" className="lm-arrow" onClick={() => go(1)} disabled={!canNext} style={sideBtn(canNext, "right")}>›</button>

        {/* sheet */}
        <div style={{ position: "relative", width: "min(1060px, 95vw)", height: "100%", maxHeight: 760, background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 5, boxShadow: "0 1px 0 rgba(26,22,20,0.04), 0 40px 70px -45px rgba(26,22,20,0.45)", display: "flex", flexDirection: "column", padding: "clamp(20px,3.4vw,46px)" }}>
          {corner("tl")}{corner("tr")}{corner("bl")}{corner("br")}

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flex: "none", ...mono({ fontSize: 10.5, letterSpacing: ".16em", color: MUTED }) }}>
            <span>ART. NO. 1-986-400</span>
            <span style={{ color: "#6b6560" }}>{String(i + 1).padStart(2, "0")} / {String(TOTAL).padStart(2, "0")}</span>
          </div>
          <div style={{ height: 1, background: BORDER, marginTop: 14, flex: "none" }} />

          {/* fit area */}
          <div ref={outer} style={{ flex: 1, minHeight: 0, overflow: "hidden", display: "flex", flexDirection: "column", justifyContent: "center", paddingTop: 6 }}>
            <div ref={inner} style={{ width: "100%", transform: `scale(${scale})`, transformOrigin: "center center" }}>
              <div style={{ width: "100%" }}>

                {isCentered && (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: "clamp(14px,2.5vh,26px)" }}>
                    {sp.cover && <span style={mono({ fontSize: 11, letterSpacing: ".24em", color: MUTED })}>{sp.kicker}</span>}
                    <h1 style={{ fontFamily: FD, fontWeight: 700, fontSize: sp.cover ? "clamp(40px,6.6vw,80px)" : "clamp(34px,5.4vw,64px)", lineHeight: 0.97, letterSpacing: "-0.035em", margin: 0 }}>{sp.title}</h1>
                    <div style={{ width: "min(340px,68%)", color: INK }}>{sp.art}</div>
                    {sp.cover && serial != null && (
                      <span style={mono({ display: "inline-block", fontSize: 11, letterSpacing: ".2em", color: "#6b6560", border: "1px solid rgba(26,22,20,0.22)", borderRadius: 999, padding: "6px 16px" })}>Unit No. {String(serial).padStart(4, "0")}</span>
                    )}
                    <p style={{ maxWidth: "44ch", color: NOTE, fontSize: "clamp(15px,1.3vw,18px)", lineHeight: 1.55, margin: 0 }}>{sp.note}</p>
                  </div>
                )}

                {isParts && (
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 4 }}>
                      {stepBadge(52)}
                      <h2 style={{ fontFamily: FD, fontWeight: 700, fontSize: "clamp(26px,3.2vw,42px)", lineHeight: 1.04, letterSpacing: "-0.02em", margin: 0 }}>{sp.title}</h2>
                    </div>
                    <div style={{ width: 44, height: 3, background: ACCENT, margin: "14px 0 8px" }} />
                    {sp.layout === "tiles" ? (
                      <div style={{ display: "grid", gridTemplateColumns: `repeat(auto-fit, minmax(min(${sp.minTile ?? 220}px,100%),1fr))`, gap: 10 }}>
                        {sp.items!.map((it, k) => <PartTile key={k} it={it} />)}
                      </div>
                    ) : (
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(290px,100%),1fr))", columnGap: "clamp(24px,3vw,48px)" }}>
                        {sp.items!.map((it, k) => (
                          <div key={k} style={{ display: "flex", gap: 13, alignItems: "center", padding: "10px 0", borderBottom: `1px solid ${HAIR}` }}>
                            {it.icon && <div style={{ width: 34, height: 34, flex: "none", color: INK }}>{ICONS[it.icon]}</div>}
                            <span style={{ flex: "none", minWidth: 60, height: 30, padding: "0 11px", display: "inline-grid", placeItems: "center", border: `1.5px solid ${INK}`, borderRadius: 999, fontFamily: FD, fontWeight: 700, fontSize: 12.5, color: SYM.test(it.lead ?? "") ? ACCENT : INK, whiteSpace: "nowrap" }}>{it.lead}</span>
                            <span style={{ fontSize: "clamp(13.5px,0.95vw,15px)", lineHeight: 1.4, color: BODY }}>{it.text}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {noteBlock("80ch")}
                  </div>
                )}

                {!isCentered && !isParts && (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(310px,100%),1fr))", gap: "clamp(24px,4vw,60px)", alignItems: "center" }}>
                    <div style={{ position: "relative", background: PLATE, border: `1px solid rgba(26,22,20,0.09)`, borderRadius: 6, aspectRatio: "6/5", maxHeight: "clamp(200px,38vh,360px)", display: "grid", placeItems: "center", padding: "8%", color: INK, backgroundImage: DOTS, backgroundSize: "18px 18px" }}>
                      <div aria-hidden style={{ position: "absolute", top: 9, left: 9, width: 12, height: 12, borderLeft: "1.5px solid rgba(26,22,20,0.22)", borderTop: "1.5px solid rgba(26,22,20,0.22)" }} />
                      <div aria-hidden style={{ position: "absolute", bottom: 9, right: 9, width: 12, height: 12, borderRight: "1.5px solid rgba(26,22,20,0.22)", borderBottom: "1.5px solid rgba(26,22,20,0.22)" }} />
                      <div style={{ width: "100%", maxWidth: 340 }}>{sp.art}</div>
                      <span style={{ position: "absolute", left: 14, bottom: 11, ...mono({ fontSize: 10, letterSpacing: ".12em", color: MUTED }) }}>FIG. {String(i + 1).padStart(2, "0")}</span>
                    </div>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                        {stepBadge(54)}
                        <h2 style={{ fontFamily: FD, fontWeight: 700, fontSize: "clamp(26px,3.2vw,42px)", lineHeight: 1.04, letterSpacing: "-0.025em", margin: 0 }}>{sp.title}</h2>
                      </div>
                      <div style={{ width: 46, height: 3, background: ACCENT, margin: "16px 0" }} />
                      {itemList}
                      {noteBlock("48ch")}
                      {sp.sub && <p style={{ marginTop: 14, fontSize: 13, lineHeight: 1.5, color: MUTED, maxWidth: "48ch" }}>{sp.sub}</p>}
                    </div>
                  </div>
                )}

              </div>
            </div>
          </div>
        </div>
      </div>

      {/* footer */}
      <footer style={{ position: "relative", zIndex: 2, flex: "none", display: "flex", flexDirection: "column", alignItems: "center", gap: 10, padding: "12px 0 20px" }}>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          {SPREADS.map((_, idx) => (
            <button key={idx} aria-label={`page ${idx + 1}`} className="lm-dot" onClick={() => jump(idx)}
              style={{ height: 4, border: "none", padding: 0, cursor: "pointer", width: idx === i ? 26 : 10, borderRadius: 999, background: idx === i ? ACCENT : idx < i ? INK : "rgba(26,22,20,0.18)" }} />
          ))}
        </div>
        <p style={mono({ fontSize: 10, letterSpacing: ".1em", color: FAINT, textAlign: "center", padding: "0 16px", margin: 0 })}>Flip with the arrows, swipe, or ← → keys</p>
      </footer>
    </main>
  );
}

function sideBtn(enabled: boolean, side: "left" | "right"): React.CSSProperties {
  return {
    position: "absolute", top: "50%", transform: "translateY(-50%)",
    width: 44, height: 44, borderRadius: "50%",
    display: "flex", alignItems: "center", justifyContent: "center",
    border: "none", background: "transparent", boxShadow: "none",
    cursor: enabled ? "pointer" : "default", color: INK, fontSize: 26, lineHeight: 1,
    paddingBottom: 3, opacity: enabled ? 0.28 : 0.07, zIndex: 6,
    [side]: "clamp(2px,1.2vw,14px)",
  } as React.CSSProperties;
}

function corner(pos: "tl" | "tr" | "bl" | "br"): React.ReactNode {
  const c = "rgba(26,22,20,0.30)";
  const s: React.CSSProperties = { position: "absolute", width: 16, height: 16 };
  if (pos[0] === "t") { s.top = 13; } else { s.bottom = 13; }
  if (pos[1] === "l") { s.left = 13; s.borderLeft = `1.5px solid ${c}`; } else { s.right = 13; s.borderRight = `1.5px solid ${c}`; }
  if (pos[0] === "t") s.borderTop = `1.5px solid ${c}`; else s.borderBottom = `1.5px solid ${c}`;
  return <div aria-hidden style={s} />;
}
