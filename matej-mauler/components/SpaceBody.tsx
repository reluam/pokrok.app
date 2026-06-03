import type { CSSProperties } from "react";
import type { SpaceKind } from "@/lib/space";

const CRATERS: [number, number, number][] = [
  [30, 28, 0.18], [60, 40, 0.12], [45, 62, 0.15], [70, 68, 0.1], [24, 55, 0.09], [56, 20, 0.08],
];
const SUNSPOTS: [number, number, number][] = [[40, 55, 0.1], [62, 38, 0.08], [50, 66, 0.07]];
const PROTOSTARS: [number, number][] = [[42, 40], [58, 52], [50, 64], [36, 56], [64, 38]];
const CLUSTER_STARS: [number, number, number][] = [
  [50, 36, 1], [38, 48, 0.8], [62, 46, 0.85], [44, 62, 0.7], [58, 64, 0.75],
  [50, 52, 1.1], [33, 38, 0.55], [68, 58, 0.6], [70, 34, 0.5], [30, 60, 0.55],
];

function shade(hex: string, amt: number): string {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
  const clamp = (v: number) => Math.max(0, Math.min(255, v));
  const r = clamp((n >> 16) + amt), g = clamp(((n >> 8) & 255) + amt), b = clamp((n & 255) + amt);
  return `rgb(${r},${g},${b})`;
}

/* Vykreslené vesmírné objekty (žádné emoji). detail = po přiblížení. */
export function SpaceBody({ kind, px, detail = false, tint = "#b08a6a" }: { kind: SpaceKind; px: number; detail?: boolean; tint?: string }) {
  const s = px;
  const circle: CSSProperties = { width: s, height: s, borderRadius: "50%", position: "relative" };
  const stage: CSSProperties = { position: "relative", width: s, height: s, display: "grid", placeItems: "center" };

  switch (kind) {
    case "star":
      return (
        <div style={stage}>
          <div style={{ position: "absolute", width: s * 1.7, height: s * 1.7, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,180,80,0.35), transparent 62%)", animation: "spacePulse 4s ease-in-out infinite" }} />
          <div style={{ ...circle, background: "radial-gradient(circle at 50% 42%, #fff7da, #ffd96b 38%, #ff9f33 72%, #ff7a1a 100%)", boxShadow: `0 0 ${s * 0.45}px ${s * 0.2}px rgba(255,170,60,0.65)`, overflow: "hidden" }}>
            {detail && SUNSPOTS.map(([x, y, r], i) => (
              <span key={i} style={{ position: "absolute", left: `${x}%`, top: `${y}%`, width: s * r, height: s * r, borderRadius: "50%", background: "rgba(150,60,10,0.5)", transform: "translate(-50%,-50%)" }} />
            ))}
          </div>
        </div>
      );

    case "planet":
      return (
        <div style={stage}>
          <div style={{ ...circle, background: "radial-gradient(circle at 35% 30%, #cfe8ff, #5aa0e0 42%, #2f6fb0 74%, #0d3f73 100%)", boxShadow: `0 0 ${s * 0.3}px ${s * 0.12}px rgba(90,160,224,0.55), inset -${s * 0.12}px -${s * 0.12}px ${s * 0.18}px rgba(0,0,20,0.5)`, overflow: "hidden" }}>
            <span style={{ position: "absolute", left: "20%", top: "30%", width: "36%", height: "26%", borderRadius: "50%", background: "rgba(70,150,80,0.85)", filter: "blur(1px)" }} />
            <span style={{ position: "absolute", left: "54%", top: "55%", width: "30%", height: "30%", borderRadius: "50%", background: "rgba(80,140,70,0.8)", filter: "blur(1px)" }} />
            <span style={{ position: "absolute", left: "60%", top: "16%", width: "18%", height: "18%", borderRadius: "50%", background: "rgba(90,150,80,0.7)", filter: "blur(1px)" }} />
          </div>
          {detail && (
            <>
              <div style={{ position: "absolute", width: s * 1.16, height: s * 1.16, borderRadius: "50%", boxShadow: `0 0 ${s * 0.2}px ${s * 0.05}px rgba(140,200,255,0.6)`, border: "1px solid rgba(160,210,255,0.4)" }} />
              <div style={{ position: "absolute", width: s * 2.1, height: s * 2.1, borderRadius: "50%", border: "1px dashed rgba(255,255,255,0.18)", animation: "spaceOrbit 9s linear infinite" }}>
                <span style={{ position: "absolute", top: `-${s * 0.09}px`, left: "50%", transform: "translateX(-50%)", width: s * 0.18, height: s * 0.18, borderRadius: "50%", background: "radial-gradient(circle at 40% 35%, #eee, #999)" }} />
              </div>
            </>
          )}
        </div>
      );

    case "moon":
      return (
        <div style={{ ...circle, background: "radial-gradient(circle at 38% 32%, #e6e6ea, #b6b6bd 55%, #7e7e88 100%)", boxShadow: `0 0 ${s * 0.2}px ${s * 0.06}px rgba(200,200,210,0.4), inset -${s * 0.1}px -${s * 0.1}px ${s * 0.16}px rgba(0,0,0,0.4)`, overflow: "hidden" }}>
          {CRATERS.map(([x, y, r], i) => (
            <span key={i} style={{ position: "absolute", left: `${x}%`, top: `${y}%`, width: s * r, height: s * r, borderRadius: "50%", background: "rgba(90,90,100,0.45)", boxShadow: "inset 1px 1px 1px rgba(0,0,0,0.3)", transform: "translate(-50%,-50%)" }} />
          ))}
        </div>
      );

    case "blackhole":
      return (
        <div style={stage}>
          <div style={{ position: "absolute", width: s * 1.9, height: s * 0.72, borderRadius: "50%", background: "conic-gradient(from 0deg, #ffd27f, #ff7a1a, #ff3a3a, #ffd27f)", filter: "blur(3px)", transform: "rotate(-18deg)", animation: "spaceSpin 6s linear infinite", maskImage: "radial-gradient(circle, transparent 32%, #000 36%, #000 70%, transparent 74%)", WebkitMaskImage: "radial-gradient(circle, transparent 32%, #000 36%, #000 70%, transparent 74%)" }} />
          <div style={{ ...circle, width: s * 0.64, height: s * 0.64, background: "#02030a", boxShadow: "0 0 18px 4px rgba(0,0,0,0.9), 0 0 32px 8px rgba(255,150,60,0.3)" }} />
          {detail && (
            <>
              <span style={{ position: "absolute", width: "2px", height: s * 0.85, top: `-${s * 0.42}px`, background: "linear-gradient(rgba(150,200,255,0.7), transparent)" }} />
              <span style={{ position: "absolute", width: "2px", height: s * 0.85, bottom: `-${s * 0.42}px`, background: "linear-gradient(transparent, rgba(150,200,255,0.7))" }} />
            </>
          )}
        </div>
      );

    case "nebula":
      return (
        <div style={{ position: "relative", width: s, height: s, filter: "blur(6px)" }}>
          <span style={{ position: "absolute", left: "20%", top: "28%", width: "60%", height: "55%", borderRadius: "50%", background: "radial-gradient(circle, rgba(232,121,185,0.8), transparent 70%)" }} />
          <span style={{ position: "absolute", left: "35%", top: "15%", width: "50%", height: "55%", borderRadius: "50%", background: "radial-gradient(circle, rgba(150,120,255,0.7), transparent 70%)" }} />
          <span style={{ position: "absolute", left: "15%", top: "40%", width: "55%", height: "50%", borderRadius: "50%", background: "radial-gradient(circle, rgba(90,200,220,0.55), transparent 70%)" }} />
          {detail && PROTOSTARS.map(([x, y], i) => (
            <span key={i} style={{ position: "absolute", left: `${x}%`, top: `${y}%`, width: 4, height: 4, borderRadius: "50%", background: "#fff", boxShadow: "0 0 8px 2px rgba(255,255,255,0.85)", animation: `spaceTwinkle 2s ease-in-out ${i * 0.3}s infinite` }} />
          ))}
        </div>
      );

    case "dwarf":
      return (
        <div style={stage}>
          <div style={{ position: "absolute", width: s * 1.5, height: s * 1.5, borderRadius: "50%", background: "radial-gradient(circle, rgba(224,86,63,0.4), transparent 64%)", animation: "spacePulse 5s ease-in-out infinite" }} />
          <div style={{ ...circle, background: "radial-gradient(circle at 45% 40%, #ffd0a0, #e0563f 55%, #a01f12 100%)", boxShadow: `0 0 ${s * 0.35}px ${s * 0.12}px rgba(224,86,63,0.6)` }} />
          {detail && (
            <div style={{ position: "absolute", width: s * 2.2, height: s * 2.2, borderRadius: "50%", border: "1px dashed rgba(255,255,255,0.15)", animation: "spaceOrbit 7s linear infinite" }}>
              <span style={{ position: "absolute", top: `-${s * 0.07}px`, left: "50%", transform: "translateX(-50%)", width: s * 0.14, height: s * 0.14, borderRadius: "50%", background: "radial-gradient(circle at 40% 35%, #cde, #89a)" }} />
            </div>
          )}
        </div>
      );

    case "galaxy":
      return (
        <div style={{ ...stage, animation: "spaceSpin 48s linear infinite" }}>
          <svg viewBox="0 0 100 100" width={s} height={s} style={{ overflow: "visible", filter: "blur(0.4px)" }}>
            <defs>
              <radialGradient id="galHaze" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#fff7e6" stopOpacity="0.95" />
                <stop offset="16%" stopColor="#ffe6b8" stopOpacity="0.7" />
                <stop offset="44%" stopColor="#b9a0ff" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#6a5ac8" stopOpacity="0" />
              </radialGradient>
              <radialGradient id="galCore" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="55%" stopColor="#fff1c8" stopOpacity="0.95" />
                <stop offset="100%" stopColor="#ffcf7a" stopOpacity="0" />
              </radialGradient>
            </defs>
            {/* naklopený a zploštělý disk */}
            <g transform="rotate(-26 50 50)">
              <g transform="translate(50 50) scale(1 0.46) translate(-50 -50)">
                <circle cx="50" cy="50" r="46" fill="url(#galHaze)" />
                <g fill="none" strokeLinecap="round">
                  <path d="M61 50 C 61 37, 47 29, 35 35 C 24 41, 22 56, 33 65 C 41 71, 53 71, 61 64" stroke="rgba(214,208,255,0.55)" strokeWidth="2.6" />
                  <path d="M61 50 C 61 37, 47 29, 35 35 C 24 41, 22 56, 33 65 C 41 71, 53 71, 61 64" stroke="rgba(214,208,255,0.55)" strokeWidth="2.6" transform="rotate(180 50 50)" />
                  <path d="M58 50 C 58 41, 49 36, 41 39 C 33 43, 32 53, 39 60" stroke="rgba(190,210,255,0.4)" strokeWidth="1.8" transform="rotate(90 50 50)" />
                  <path d="M58 50 C 58 41, 49 36, 41 39 C 33 43, 32 53, 39 60" stroke="rgba(190,210,255,0.4)" strokeWidth="1.8" transform="rotate(270 50 50)" />
                </g>
                <circle cx="50" cy="50" r="13" fill="url(#galCore)" />
              </g>
            </g>
          </svg>
        </div>
      );

    case "comet":
      return (
        <div style={stage}>
          <div style={{ position: "absolute", right: `-${s * 1.4}px`, width: s * 3, height: s * 0.5, background: "linear-gradient(90deg, transparent, rgba(159,233,255,0.7))", filter: "blur(3px)", borderRadius: "50%", transform: "rotate(8deg)" }} />
          {detail && <div style={{ position: "absolute", right: `-${s * 1.3}px`, top: `${s * 0.22}px`, width: s * 2.6, height: s * 0.32, background: "linear-gradient(90deg, transparent, rgba(255,210,150,0.6))", filter: "blur(3px)", borderRadius: "50%", transform: "rotate(16deg)" }} />}
          <div style={{ ...circle, background: "radial-gradient(circle at 40% 35%, #ffffff, #9fe9ff 60%, #4aa6c0 100%)", boxShadow: `0 0 ${s * 0.5}px ${s * 0.2}px rgba(159,233,255,0.7)` }} />
        </div>
      );

    case "probe":
      return (
        <svg viewBox="0 0 100 100" width={s * 1.4} height={s * 1.4} style={{ overflow: "visible" }}>
          <g stroke="#cfd6e6" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="40" cy="34" r="20" fill="rgba(207,214,230,0.12)" />
            <line x1="40" y1="34" x2="40" y2="18" />
            <rect x="33" y="52" width="14" height="16" rx="2" fill="rgba(207,214,230,0.1)" />
            <line x1="47" y1="60" x2="80" y2="60" />
            <line x1="33" y1="60" x2="15" y2="76" />
          </g>
          {detail && <circle cx="40" cy="60" r="6" fill="#ffcf5a" stroke="#a8801f" strokeWidth="1.5" />}
        </svg>
      );

    case "superearth":
      return (
        <div style={stage}>
          <div style={{ ...circle, background: "radial-gradient(circle at 35% 30%, #e6fff0, #6fd0a0 40%, #2f9f7a 72%, #134d52 100%)", boxShadow: `0 0 ${s * 0.34}px ${s * 0.13}px rgba(110,210,170,0.6), inset -${s * 0.12}px -${s * 0.12}px ${s * 0.18}px rgba(0,20,20,0.5)`, overflow: "hidden" }}>
            <span style={{ position: "absolute", left: "18%", top: "26%", width: "40%", height: "30%", borderRadius: "50%", background: "rgba(60,140,90,0.85)", filter: "blur(1px)" }} />
            <span style={{ position: "absolute", left: "52%", top: "54%", width: "34%", height: "34%", borderRadius: "50%", background: "rgba(70,150,100,0.8)", filter: "blur(1px)" }} />
            <span style={{ position: "absolute", left: "58%", top: "20%", width: "20%", height: "16%", borderRadius: "50%", background: "rgba(230,240,255,0.5)", filter: "blur(2px)" }} />
          </div>
          {detail && <div style={{ position: "absolute", width: s * 1.18, height: s * 1.18, borderRadius: "50%", border: "1px solid rgba(150,255,200,0.4)", boxShadow: `0 0 ${s * 0.18}px ${s * 0.05}px rgba(120,255,190,0.5)` }} />}
        </div>
      );

    case "rocky":
      return (
        <div style={{ ...circle, background: `radial-gradient(circle at 38% 32%, ${shade(tint, 55)}, ${tint} 52%, ${shade(tint, -70)} 100%)`, boxShadow: `0 0 ${s * 0.16}px ${s * 0.05}px ${tint}66, inset -${s * 0.1}px -${s * 0.1}px ${s * 0.16}px rgba(0,0,0,0.45)`, overflow: "hidden" }}>
          {CRATERS.slice(0, 4).map(([x, y, r], i) => (
            <span key={i} style={{ position: "absolute", left: `${x}%`, top: `${y}%`, width: s * r * 0.7, height: s * r * 0.7, borderRadius: "50%", background: "rgba(0,0,0,0.18)", transform: "translate(-50%,-50%)" }} />
          ))}
        </div>
      );

    case "gasgiant":
      return (
        <div style={{ ...circle, background: "linear-gradient(180deg, #e8c7a0 0%, #cf9f6c 16%, #b97a44 30%, #e3c096 44%, #a86a38 58%, #d8ab78 74%, #bf8a55 88%, #9c6638 100%)", boxShadow: `0 0 ${s * 0.2}px ${s * 0.06}px rgba(220,170,110,0.5), inset -${s * 0.12}px -${s * 0.12}px ${s * 0.2}px rgba(40,20,0,0.5)`, overflow: "hidden" }}>
          <span style={{ position: "absolute", left: "62%", top: "58%", width: "22%", height: "13%", borderRadius: "50%", background: "rgba(190,70,45,0.8)", filter: "blur(0.5px)" }} />
        </div>
      );

    case "ringed":
      return (
        <div style={stage}>
          <div style={{ position: "absolute", width: s * 1.95, height: s * 0.62, borderRadius: "50%", border: `${Math.max(2, s * 0.06)}px solid rgba(225,205,160,0.55)`, transform: "rotate(-20deg)", boxShadow: "0 0 6px rgba(225,205,160,0.3)" }} />
          <div style={{ ...circle, background: "linear-gradient(180deg, #f3e3bd 0%, #e3c78e 28%, #cea869 52%, #e8d4a4 72%, #c9a25e 100%)", boxShadow: `inset -${s * 0.1}px -${s * 0.1}px ${s * 0.18}px rgba(60,40,0,0.45)`, overflow: "hidden" }} />
          <div style={{ position: "absolute", width: s * 1.95, height: s * 0.62, borderRadius: "50%", border: `${Math.max(2, s * 0.06)}px solid rgba(225,205,160,0.55)`, borderBottomColor: "transparent", borderLeftColor: "transparent", transform: "rotate(-20deg)", clipPath: "inset(50% 0 0 0)" }} />
        </div>
      );

    case "cluster":
      return (
        <div style={{ position: "relative", width: s, height: s }}>
          {CLUSTER_STARS.map(([x, y, r], i) => (
            <span key={i} style={{ position: "absolute", left: `${x}%`, top: `${y}%`, width: s * 0.07 * r, height: s * 0.07 * r, borderRadius: "50%", background: "#dbe6ff", boxShadow: `0 0 ${s * 0.08}px ${s * 0.03}px rgba(170,200,255,0.8)`, transform: "translate(-50%,-50%)", animation: `spaceTwinkle ${2 + (i % 3) * 0.5}s ease-in-out ${i * 0.2}s infinite` }} />
          ))}
        </div>
      );
  }
}
