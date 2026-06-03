import type { CSSProperties } from "react";
import type { SpaceKind } from "@/lib/space";

const CRATERS: [number, number, number][] = [
  [30, 28, 0.18], [60, 40, 0.12], [45, 62, 0.15], [70, 68, 0.1], [24, 55, 0.09], [56, 20, 0.08],
];
const SUNSPOTS: [number, number, number][] = [[40, 55, 0.1], [62, 38, 0.08], [50, 66, 0.07]];
const PROTOSTARS: [number, number][] = [[42, 40], [58, 52], [50, 64], [36, 56], [64, 38]];

/* Vykreslené vesmírné objekty (žádné emoji). detail = po přiblížení. */
export function SpaceBody({ kind, px, detail = false }: { kind: SpaceKind; px: number; detail?: boolean }) {
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
        <div style={{ ...stage, animation: "spaceSpin 26s linear infinite" }}>
          <svg viewBox="0 0 100 100" width={s} height={s} style={{ filter: "blur(0.6px)" }}>
            <defs>
              <radialGradient id="galCore" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="35%" stopColor="#ffe8b0" />
                <stop offset="100%" stopColor="transparent" />
              </radialGradient>
            </defs>
            <ellipse cx="50" cy="50" rx="46" ry="20" fill="rgba(185,160,255,0.12)" transform="rotate(25 50 50)" />
            {[0, 120, 240].map((a) => (
              <path key={a} d="M50 50 C 64 44, 82 50, 88 66" fill="none" stroke="rgba(200,190,255,0.6)" strokeWidth="3.2" strokeLinecap="round" transform={`rotate(${a} 50 50)`} />
            ))}
            <circle cx="50" cy="50" r="26" fill="url(#galCore)" />
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
  }
}
