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
  return (
    <svg width={SW} height={SH} style={{ overflow: "visible", display: "block" }}>
      <defs>
        <radialGradient id={haloId} cx="50%" cy="50%" r="50%">
          <stop offset="0%"  stopColor={color} stopOpacity={isFocused ? 0.55 : 0.35} />
          <stop offset="60%" stopColor={color} stopOpacity={0.12} />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* shadow on the sand */}
      <ellipse cx={SW / 2} cy={SH - 8} rx={26} ry={7} fill="rgba(120,80,40,0.18)" />

      {/* stone waymarker / cairn */}
      <rect x={SW / 2 - 9} y={70} width={18} height={SH - 86} rx={7}
        fill="rgba(120,84,52,0.5)" />
      <rect x={SW / 2 - 13} y={96} width={26} height={9} rx={4} fill="rgba(120,84,52,0.4)" />

      {/* glow + beacon orb */}
      <circle cx={SW / 2} cy={52} r={isFocused ? 40 : 30} fill={`url(#${haloId})`} />
      <circle cx={SW / 2} cy={52} r={isFocused ? 13 : 10} fill={color}>
        {isFocused && <animate attributeName="opacity" values="1;0.7;1" dur="2.4s" repeatCount="indefinite" />}
      </circle>
      <circle cx={SW / 2} cy={52} r={isFocused ? 5 : 4} fill="#fff6e6" opacity={0.92} />

      {/* name */}
      {near && (
        <text x={SW / 2} y={SH + 4} textAnchor="middle"
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
    <svg width={110} height={150} style={{ overflow: "visible" }}>
      <defs>
        <radialGradient id="trav-halo" cx="50%" cy="42%" r="55%">
          <stop offset="0%"  stopColor="#fff4dc" stopOpacity="0.85" />
          <stop offset="55%" stopColor="#f3c98a" stopOpacity="0.30" />
          <stop offset="100%" stopColor="#f3c98a" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="trav-robe" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"  stopColor="#fff8ec" />
          <stop offset="100%" stopColor="#e9c79a" />
        </linearGradient>
      </defs>

      {/* aura */}
      <circle cx={55} cy={62} r={64} fill="url(#trav-halo)"
        style={{ animation: "traveller-glow 3.4s ease-in-out infinite" }} />

      {/* shadow */}
      <ellipse cx={55} cy={142} rx={22} ry={6} fill="rgba(120,80,40,0.22)" />

      {/* robed figure (bobbing) */}
      <g style={{ animation: "traveller-bob 4s ease-in-out infinite", transformOrigin: "55px 90px" }}>
        {/* robe */}
        <path d="M55 44 C 34 52, 28 96, 33 132 C 44 138, 66 138, 77 132 C 82 96, 76 52, 55 44 Z"
          fill="url(#trav-robe)" opacity={0.96} />
        {/* trailing scarf */}
        <path d="M55 58 C 84 60, 96 44, 104 30" fill="none" stroke="#e88a4a" strokeWidth={4}
          strokeLinecap="round" opacity={0.85} />
        {/* head */}
        <circle cx={55} cy={38} r={11} fill="#fff8ec" />
        {/* glowing core (otherworldly) */}
        <circle cx={55} cy={96} r={6} fill="#ffdca0" opacity={0.95}>
          <animate attributeName="opacity" values="0.6;1;0.6" dur="2.6s" repeatCount="indefinite" />
        </circle>
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
      background: "linear-gradient(to bottom, var(--bg-soft) 0%, var(--bg) 48%, #ecd2a4 100%)",
    }}>
      <StarField theme={theme} />
      <div className="scanlines" />

      {/* Sun glow near the horizon */}
      <div style={{
        position: "absolute", left: "50%", top: horizonY, transform: "translate(-50%,-50%)",
        width: 420, height: 420, borderRadius: "50%", pointerEvents: "none",
        background: "radial-gradient(circle, rgba(255,236,200,0.9) 0%, rgba(255,224,170,0.35) 35%, rgba(255,224,170,0) 70%)",
      }} />

      {/* Dunes */}
      <svg viewBox="0 0 1440 400" preserveAspectRatio="none" aria-hidden="true"
        style={{ position: "absolute", left: 0, right: 0, bottom: 0, width: "100%", height: "46%", pointerEvents: "none" }}>
        <path d="M0,200 C300,120 600,260 900,180 C1140,120 1320,200 1440,170 L1440,400 L0,400 Z" fill="#e7c693" opacity="0.7" />
        <path d="M0,280 C320,210 620,320 920,260 C1180,210 1340,280 1440,250 L1440,400 L0,400 Z" fill="#dcb478" opacity="0.85" />
        <path d="M0,340 C360,300 700,360 1040,330 C1240,312 1360,340 1440,330 L1440,400 L0,400 Z" fill="#cfa063" opacity="1" />
      </svg>

      {/* The path with stops */}
      <div style={{ position: "absolute", inset: 0 }}>
        {sortedAreas.map((area, i) => {
          const o = i - progress;
          if (o < -0.9 || o > 7) return null;
          const persp = 1 / (1 + Math.max(o, -0.4) * 0.5);
          const y = horizonY + (frontY - horizonY) * Math.min(persp, 1.25);
          const x = cx + W * 0.17 * Math.sin(o * 0.75) * Math.min(persp, 1);
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
