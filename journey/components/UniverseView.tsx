"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import type { Area, Chapter } from "@/lib/areas";
import type { Lang } from "@/lib/i18n";
import type { Theme } from "@/lib/theme";
import { useTheme } from "@/lib/useTheme";
import { StarField } from "./StarField";
import { ThemeToggle } from "./ThemeToggle";
import { LangToggle } from "./LangToggle";
import { CosmicView } from "./CosmicView";

type Props = { areas: Area[]; lang: Lang; focusSlug?: string };
type SceneProps = Props & { theme: Theme; toggleTheme: () => void };

function seededRng(seed: string) {
  let h = 0x811c9dc5;
  for (let i = 0; i < seed.length; i++) { h ^= seed.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
  let s = h;
  return () => { s ^= s << 13; s ^= s >> 17; s ^= s << 5; return (s >>> 0) / 0xffffffff; };
}
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

// Warm waymarker glow colours
const STOP_COLORS = ["#c0612e", "#d99a4e", "#c97a6a", "#c9a44e", "#a8924e", "#cf8a5c"];
function stopColor(areaId: string) {
  return STOP_COLORS[Math.floor(seededRng(areaId + "c")() * 997) % STOP_COLORS.length];
}

// ── A waymarker (stop) along the path ───────────────────────────────────────

const SW = 130, SH = 180;

function StopMarker({ area, lang, color, isFocused, near }: {
  area: Area; lang: Lang; color: string; isFocused: boolean; near: boolean;
}) {
  const haloId = `halo-${area.id}`;
  const lampId = `lamp-${area.id}`;
  const mx = SW / 2;
  return (
    <svg width={SW} height={SH} style={{ overflow: "visible", display: "block" }}>
      <defs>
        <radialGradient id={haloId} cx="50%" cy="50%" r="50%">
          <stop offset="0%"  stopColor={color} stopOpacity={isFocused ? 0.5 : 0.3} />
          <stop offset="55%" stopColor={color} stopOpacity={0.12} />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </radialGradient>
        <radialGradient id={lampId} cx="50%" cy="38%" r="62%">
          <stop offset="0%"  stopColor="#fff7e6" />
          <stop offset="45%" stopColor={color} />
          <stop offset="100%" stopColor={color} stopOpacity="0.7" />
        </radialGradient>
      </defs>

      {/* shadow */}
      <ellipse cx={mx} cy={SH - 6} rx={22} ry={6} fill="rgba(120,80,40,0.16)" />

      {/* slim wooden post */}
      <rect x={mx - 3} y={64} width={6} height={SH - 78} rx={3} fill="#b98a5a" />
      {/* little hook */}
      <path d={`M${mx} 64 q 10 0 10 10`} fill="none" stroke="#b98a5a" strokeWidth={4} strokeLinecap="round" />

      {/* glow */}
      <circle cx={mx + 10} cy={86} r={isFocused ? 46 : 34} fill={`url(#${haloId})`} />

      {/* hanging lantern */}
      <g style={{ animation: "traveller-bob 5s ease-in-out infinite", transformOrigin: `${mx + 10}px 74px` }}>
        <line x1={mx} y1={70} x2={mx + 10} y2={78} stroke="#b98a5a" strokeWidth={2} />
        <ellipse cx={mx + 10} cy={92} rx={isFocused ? 17 : 13} ry={isFocused ? 21 : 16} fill={`url(#${lampId})`} stroke="#fff2d8" strokeWidth={1} />
        <rect x={mx + 6} y={70} width={8} height={6} rx={2} fill="#b98a5a" />
        <circle cx={mx + 10} cy={90} r={isFocused ? 5 : 4} fill="#fff7e6" opacity={0.9}>
          {isFocused && <animate attributeName="opacity" values="0.7;1;0.7" dur="2.6s" repeatCount="indefinite" />}
        </circle>
      </g>

      {/* name */}
      {near && (
        <text x={mx + 10} y={SH + 6} textAnchor="middle"
          fill="var(--text-primary)" fontFamily="var(--font-serif)"
          fontSize={isFocused ? 22 : 15} fontWeight={500}
          style={{ letterSpacing: "0.01em" }}>
          {area[lang].name}
        </text>
      )}
    </svg>
  );
}

// ── The traveller — an out-of-this-world being ──────────────────────────────

function Traveller() {
  return (
    <svg width={120} height={140} style={{ overflow: "visible" }}>
      <defs>
        <radialGradient id="trav-halo" cx="50%" cy="50%" r="50%">
          <stop offset="0%"  stopColor="#fff1cf" stopOpacity="0.8" />
          <stop offset="60%" stopColor="#ffd9a0" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#ffd9a0" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="trav-body" cx="42%" cy="34%" r="72%">
          <stop offset="0%"  stopColor="#fff7ea" />
          <stop offset="55%" stopColor="#ffe0b3" />
          <stop offset="100%" stopColor="#f0b277" />
        </radialGradient>
      </defs>

      {/* soft aura */}
      <circle cx={60} cy={70} r={58} fill="url(#trav-halo)"
        style={{ animation: "traveller-glow 3.6s ease-in-out infinite" }} />

      {/* shadow */}
      <ellipse cx={60} cy={128} rx={24} ry={6} fill="rgba(120,80,40,0.20)" />

      {/* the little being (bobbing) */}
      <g style={{ animation: "traveller-bob 3.8s ease-in-out infinite", transformOrigin: "60px 80px" }}>
        {/* antenna */}
        <path d="M60 40 Q 64 26 70 22" fill="none" stroke="#e89a55" strokeWidth={3} strokeLinecap="round" />
        <circle cx={71} cy={21} r={4.5} fill="#ffdf9c">
          <animate attributeName="opacity" values="0.6;1;0.6" dur="2.4s" repeatCount="indefinite" />
        </circle>

        {/* round body */}
        <ellipse cx={60} cy={84} rx={34} ry={38} fill="url(#trav-body)" stroke="#e7b27d" strokeWidth={1.5} />

        {/* little feet */}
        <ellipse cx={48} cy={120} rx={8} ry={5} fill="#f0b277" />
        <ellipse cx={72} cy={120} rx={8} ry={5} fill="#f0b277" />

        {/* cheeks */}
        <circle cx={44} cy={92} r={6} fill="#ff9d77" opacity={0.5} />
        <circle cx={76} cy={92} r={6} fill="#ff9d77" opacity={0.5} />

        {/* big friendly eyes */}
        <ellipse cx={50} cy={80} rx={8} ry={10} fill="#3a2c1a" />
        <ellipse cx={70} cy={80} rx={8} ry={10} fill="#3a2c1a" />
        <circle cx={52.5} cy={76} r={2.6} fill="#fff" />
        <circle cx={72.5} cy={76} r={2.6} fill="#fff" />

        {/* tiny smile */}
        <path d="M53 96 Q 60 102 67 96" fill="none" stroke="#3a2c1a" strokeWidth={2} strokeLinecap="round" />
      </g>
    </svg>
  );
}

// ── Inline search ────────────────────────────────────────────────────────────

function InlineSearch({ areas, lang, onPick, onActiveChange, inputRef }: {
  areas: Area[]; lang: Lang;
  onPick: (a: Area, c: Chapter) => void;
  onActiveChange: (v: boolean) => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const results: { area: Area; chapter: Chapter }[] = [];
  if (query.trim().length >= 2) {
    const q = query.toLowerCase();
    for (const area of areas) for (const ch of area.chapters) {
      const hay = [area[lang].name, ch[lang].subtitle, ch[lang].title, ...ch.sections.map(s => s[lang])].join(" ").toLowerCase();
      if (hay.includes(q)) results.push({ area, chapter: ch });
    }
  }
  const show = open && query.trim().length >= 2;
  return (
    <div style={{ width: "min(620px, 92vw)", pointerEvents: "auto" }}>
      <div style={{
        display: "flex", alignItems: "center", gap: "10px",
        background: "rgba(255,250,238,0.82)", backdropFilter: "blur(8px)",
        border: "1px solid rgba(192,97,46,0.3)",
        borderRadius: show ? "16px 16px 0 0" : "16px", padding: "10px 18px", transition: "border-radius 150ms",
      }}>
        <span style={{ fontSize: "16px", color: "var(--text-muted)" }}>⌕</span>
        <input ref={inputRef} value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => { setOpen(true); onActiveChange(true); }}
          onBlur={() => onActiveChange(false)}
          placeholder={lang === "cs" ? "Hledat na cestě…" : "Search the journey…"}
          style={{ flex: 1, background: "none", border: "none", outline: "none", fontSize: "15px", color: "var(--text-primary)", fontFamily: "var(--font-sans)" }} />
        {query && <button onClick={() => { setQuery(""); inputRef.current?.focus(); }}
          style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: "14px" }}>✕</button>}
      </div>
      {show && (
        <div style={{
          background: "rgba(255,250,238,0.95)", backdropFilter: "blur(8px)",
          border: "1px solid rgba(192,97,46,0.3)", borderTop: "none",
          borderRadius: "0 0 16px 16px", maxHeight: "min(50vh, 420px)", overflowY: "auto",
        }}>
          {results.length === 0 ? (
            <p style={{ color: "var(--text-muted)", fontSize: 14, textAlign: "center", padding: "16px" }}>
              {lang === "cs" ? "Nic nenalezeno" : "No results"}</p>
          ) : results.map(({ area, chapter }) => (
            <button key={`${area.id}-${chapter.id}`} onMouseDown={(e) => { e.preventDefault(); onPick(area, chapter); }}
              style={{ display: "block", width: "100%", textAlign: "left", background: "none", border: "none", borderTop: "1px solid rgba(192,97,46,0.12)", padding: "11px 18px", cursor: "pointer", transition: "background 160ms" }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(192,97,46,0.08)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "none"; }}>
              <span style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-muted)", fontFamily: "var(--font-sans)" }}>{area[lang].name}</span>
              <p style={{ fontSize: 14, color: "var(--text-primary)", margin: "2px 0 0", fontFamily: "var(--font-sans)" }}>{chapter[lang].subtitle} — {chapter[lang].title}</p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main view — a journey path with stops ────────────────────────────────────

function JourneyView({ areas, lang, focusSlug, theme, toggleTheme }: SceneProps) {
  const router = useRouter();
  const sortedAreas = useMemo(() => [...areas].sort((a, b) => a.order - b.order), [areas]);
  const n = sortedAreas.length;

  const initialIdx = useMemo(() => {
    const i = sortedAreas.findIndex(a => a.slug === focusSlug);
    return i >= 0 ? i : 0;
  }, [sortedAreas, focusSlug]);

  const [searchActive, setSearchActive] = useState(false);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const touchStartY = useRef(0);
  const lastStep = useRef(0);

  const [size, setSize] = useState({ w: 1200, h: 800 });
  useEffect(() => {
    const calc = () => setSize({ w: window.innerWidth, h: window.innerHeight });
    calc(); window.addEventListener("resize", calc);
    return () => window.removeEventListener("resize", calc);
  }, []);

  // Continuous walking progress, eased toward target
  const [progress, setProgress] = useState(initialIdx);
  const targetRef = useRef(initialIdx);
  useEffect(() => {
    let raf = 0;
    const loop = () => {
      setProgress(prev => {
        const diff = targetRef.current - prev;
        return Math.abs(diff) < 0.0015 ? targetRef.current : prev + diff * 0.13;
      });
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  const walk = (dir: 1 | -1) => {
    const now = Date.now();
    if (now - lastStep.current < 110) return;
    lastStep.current = now;
    targetRef.current = clamp(targetRef.current + dir, 0, n - 1);
  };
  const walkTo = (i: number) => { targetRef.current = clamp(i, 0, n - 1); };

  useEffect(() => {
    const onWheel = (e: WheelEvent) => { if (searchActive || Math.abs(e.deltaY) < 8) return; walk(e.deltaY > 0 ? 1 : -1); };
    const onTS = (e: TouchEvent) => { touchStartY.current = e.touches[0].clientY; };
    const onTE = (e: TouchEvent) => { const d = touchStartY.current - e.changedTouches[0].clientY; if (Math.abs(d) >= 50) walk(d > 0 ? 1 : -1); };
    const onKey = (e: KeyboardEvent) => {
      if ((e.key === "/" || e.key === "f") && !searchActive) { e.preventDefault(); searchInputRef.current?.focus(); return; }
      if (searchActive) return;
      if (["ArrowDown", "ArrowRight", "PageDown"].includes(e.key)) { e.preventDefault(); walk(1); }
      else if (["ArrowUp", "ArrowLeft", "PageUp"].includes(e.key)) { e.preventDefault(); walk(-1); }
    };
    window.addEventListener("wheel", onWheel, { passive: true });
    window.addEventListener("touchstart", onTS, { passive: true });
    window.addEventListener("touchend", onTE, { passive: true });
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchstart", onTS);
      window.removeEventListener("touchend", onTE);
      window.removeEventListener("keydown", onKey);
    };
  }, [searchActive, n]);

  const { w: W, h: H } = size;
  const cx = W / 2;
  const horizonY = H * 0.32;
  const frontY = H * 0.74;
  const sMax = clamp(Math.min(W / 1100, H / 780), 0.85, 1.6);

  const focusedIdx = clamp(Math.round(progress), 0, n - 1);
  const focusedArea = sortedAreas[focusedIdx];

  return (
    <div data-theme={theme} style={{
      height: "100dvh", overflow: "hidden", position: "relative",
      background: "linear-gradient(to bottom, #ffd0a6 0%, #ffe6cc 20%, #fbe7cd 38%, var(--bg) 60%, #e7c489 100%)",
    }}>
      {/* Sun with soft rays */}
      <div style={{
        position: "absolute", left: "50%", top: horizonY - 20, transform: "translate(-50%,-50%)",
        width: 160, height: 160, borderRadius: "50%", pointerEvents: "none", zIndex: 1,
        background: "radial-gradient(circle, #fff6e0 0%, #ffe6ad 46%, rgba(255,224,150,0.55) 60%, rgba(255,224,150,0) 72%)",
        boxShadow: "0 0 120px 60px rgba(255,226,160,0.45)",
        animation: "sun-pulse 6s ease-in-out infinite",
      }} />

      {/* Drifting clouds */}
      {[
        { top: "12%", w: 180, h: 42, op: 0.7, dur: 70, delay: 0 },
        { top: "20%", w: 130, h: 32, op: 0.55, dur: 95, delay: -30 },
        { top: "8%",  w: 100, h: 26, op: 0.5, dur: 110, delay: -60 },
      ].map((c, i) => (
        <div key={i} style={{
          position: "absolute", top: c.top, left: 0, width: c.w, height: c.h,
          borderRadius: "50%", background: "rgba(255,252,245,0.9)", filter: "blur(6px)",
          opacity: c.op, pointerEvents: "none", zIndex: 1,
          animation: `cloud-drift ${c.dur}s linear ${c.delay}s infinite`,
        }} />
      ))}

      {/* Distant birds */}
      <svg viewBox="0 0 100 20" style={{ position: "absolute", top: "26%", left: "58%", width: 80, opacity: 0.4, zIndex: 1, pointerEvents: "none" }}>
        <path d="M10 10 Q 14 5 18 10 Q 22 5 26 10" fill="none" stroke="#7a5a38" strokeWidth="1.2" strokeLinecap="round" />
        <path d="M34 13 Q 37 9 40 13 Q 43 9 46 13" fill="none" stroke="#7a5a38" strokeWidth="1" strokeLinecap="round" />
      </svg>

      <StarField theme={theme} />
      <div className="scanlines" />

      {/* The path / trail leading to the horizon */}
      <svg viewBox="0 0 1440 800" preserveAspectRatio="none" aria-hidden="true"
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 2 }}>
        <defs>
          <linearGradient id="trail" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f3ddb4" stopOpacity="0" />
            <stop offset="35%" stopColor="#f0d6a6" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#eccf98" stopOpacity="0.95" />
          </linearGradient>
        </defs>
        <path d={`M720 ${horizonY / H * 800} L 900 800 L 540 800 Z`} fill="url(#trail)" />
      </svg>

      {/* Dunes */}
      <svg viewBox="0 0 1440 400" preserveAspectRatio="none" aria-hidden="true"
        style={{ position: "absolute", left: 0, right: 0, bottom: 0, width: "100%", height: "44%", pointerEvents: "none", zIndex: 3 }}>
        <path d="M0,210 C300,140 600,250 900,185 C1140,135 1320,205 1440,180 L1440,400 L0,400 Z" fill="#ecd09a" opacity="0.85" />
        <path d="M0,285 C320,225 620,320 920,265 C1180,222 1340,285 1440,258 L1440,400 L0,400 Z" fill="#e0bd80" opacity="0.92" />
        <path d="M0,345 C360,308 700,362 1040,332 C1240,314 1360,344 1440,332 L1440,400 L0,400 Z" fill="#d2ac6c" opacity="1" />
      </svg>

      {/* The stops */}
      <div style={{ position: "absolute", inset: 0, zIndex: 4 }}>
        {sortedAreas.map((area, i) => {
          const o = i - progress;
          if (o < -0.9 || o > 7) return null;
          const persp = 1 / (1 + Math.max(o, -0.4) * 0.5);
          const y = horizonY + (frontY - horizonY) * Math.min(persp, 1.25);
          const x = cx + W * 0.10 * Math.sin(o * 0.7) * Math.min(persp, 1);
          const scale = clamp(persp, 0.12, 1.2) * sMax;
          const opacity = o < -0.05 ? clamp(1 + o * 1.4, 0, 1) : clamp(0.18 + persp, 0, 1);
          const isFocused = i === focusedIdx;
          return (
            <div key={area.id} style={{
              position: "absolute", left: 0, top: 0,
              transform: `translate(${x}px, ${y}px) translate(-50%, -100%) scale(${scale})`,
              opacity, zIndex: Math.round(Math.min(persp, 1.3) * 100),
              cursor: "pointer",
            }} onClick={() => isFocused ? router.push(`/${area.slug}`) : walkTo(i)}>
              <StopMarker area={area} lang={lang} color={stopColor(area.id)} isFocused={isFocused} near={persp > 0.5} />
            </div>
          );
        })}
      </div>

      {/* The traveller — fixed at the front of the path */}
      <div style={{
        position: "absolute", left: cx, top: frontY, transform: "translate(-50%, -10%)",
        zIndex: 105, pointerEvents: "none",
      }}>
        <Traveller />
      </div>

      {/* Left sidebar — the stops */}
      <nav style={{
        position: "fixed", left: 0, top: "50%", transform: "translateY(-50%)",
        zIndex: 25, padding: "0 24px", display: "flex", flexDirection: "column", gap: "2px",
        maxHeight: "80vh", overflowY: "auto", pointerEvents: "auto",
      }}>
        <p style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.22em", color: "var(--text-muted)", marginBottom: 12, fontFamily: "var(--font-sans)" }}>
          {lang === "cs" ? "Zastávky" : "Stops"}
        </p>
        {sortedAreas.map((a, i) => {
          const active = i === focusedIdx;
          return (
            <button key={a.id} onClick={() => walkTo(i)}
              style={{ display: "flex", alignItems: "center", gap: 10, background: "none", border: "none", cursor: "pointer", padding: "6px 0", textAlign: "left" }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", flexShrink: 0,
                background: active ? "var(--accent)" : "var(--dot-future)",
                border: active ? "none" : "1px solid rgba(192,97,46,0.3)",
                boxShadow: active ? "0 0 8px var(--accent-glow)" : "none", transition: "background 250ms, box-shadow 250ms" }} />
              <span style={{ fontFamily: "var(--font-sans)", fontSize: 11, letterSpacing: "0.09em", textTransform: "uppercase",
                color: active ? "var(--accent)" : "var(--text-secondary)", opacity: active ? 1 : 0.75, transition: "color 250ms, opacity 250ms" }}>
                {a[lang].name}
              </span>
            </button>
          );
        })}
      </nav>

      <ThemeToggle theme={theme} onToggle={toggleTheme} />
      <LangToggle lang={lang} />

      {/* Search */}
      <div style={{ position: "fixed", top: 0, left: 0, right: 0, display: "flex", justifyContent: "center", padding: "22px", zIndex: 30, pointerEvents: "none" }}>
        <InlineSearch areas={sortedAreas} lang={lang} inputRef={searchInputRef}
          onActiveChange={setSearchActive} onPick={(a, c) => router.push(`/${a.slug}/${c.slug}`)} />
      </div>

      {/* Hint */}
      <div style={{ position: "fixed", bottom: "28px", left: 0, right: 0, display: "flex", justifyContent: "center", zIndex: 20, pointerEvents: "none" }}>
        <p style={{ fontFamily: "var(--font-sans)", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.2em", color: "var(--text-muted)" }}>
          {lang === "cs" ? "scroll = jít dál · klik = zastavit se" : "scroll = walk on · click = stop here"}
          {focusedArea ? `  ·  ${focusedArea[lang].name}` : ""}
        </p>
      </div>
    </div>
  );
}

// Picks the scene by theme: light "Journey" path (default) or the cosmic
// galaxy universe (kept for the 42 / Hitchhiker's theme).
export function UniverseView(props: Props) {
  const [theme, toggleTheme] = useTheme();
  return theme === "hhgttg"
    ? <CosmicView {...props} theme={theme} toggleTheme={toggleTheme} />
    : <JourneyView {...props} theme={theme} toggleTheme={toggleTheme} />;
}
