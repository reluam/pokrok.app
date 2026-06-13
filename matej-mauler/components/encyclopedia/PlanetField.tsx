"use client";

import { useEffect, useRef, useState } from "react";
import { searchIndex, searchNodes, getNode, type SearchEntry } from "@/lib/encyclopedia/graph";
import { REALM_COL } from "./MapView";
import type { Lang } from "@/lib/dictionaries";
import type { Theme } from "./Shell";

const sans = "var(--font-sans)";

type P = { slug: string; label: string; col: string; ux: number; uy: number; uz: number; sx: number; sy: number; sz: number; sc: number };

const UI = {
  cs: { searchPh: "Hledej heslo… (třeba „slunce“)", empty: "Nic. Zkus to jinak." },
  en: { searchPh: "Search a topic… (try “sun”)", empty: "Nothing. Try something else." },
} as const;

export function PlanetField({ lang, theme, onPick }: { lang: Lang; theme: Theme; onPick: (slug: string) => void }) {
  const u = UI[lang];
  const dark = theme === "dark";
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [q, setQ] = useState("");
  const qRef = useRef("");
  useEffect(() => { qRef.current = q; }, [q]);

  const results = q.trim() ? searchNodes(q, lang, 6) : [];

  // přechod do hesla: planeta se otočí, aby heslo bylo vepředu, pak naviguj
  const goToTerm = (slug: string) => { pickRef.current = slug; };
  const pickRef = useRef<string | null>(null);

  useEffect(() => {
    const cv = canvasRef.current; if (!cv) return;
    const ctx = cv.getContext("2d"); if (!ctx) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const ink = dark ? "#fff" : "#1a1614";

    // body na kouli (Fibonacci) — jen hotová hesla
    const entries = searchIndex().filter((e) => !e.red && e.slug !== "brana");
    const N = entries.length || 1;
    const golden = Math.PI * (3 - Math.sqrt(5));
    const pts: P[] = entries.map((e, i) => {
      const uy = 1 - (i / Math.max(1, N - 1)) * 2;
      const r = Math.sqrt(Math.max(0, 1 - uy * uy));
      const phi = i * golden;
      const realm = getNode(e.slug)?.realm ?? "plain";
      return { slug: e.slug, label: e.title[lang], col: REALM_COL[realm] ?? "#8a90a0", ux: Math.cos(phi) * r, uy, uz: Math.sin(phi) * r, sx: 0, sy: 0, sz: 0, sc: 1 };
    });

    let w = 0, h = 0, cx = 0, cy = 0, RR = 0;
    const resize = () => { w = cv.clientWidth; h = cv.clientHeight; cx = w / 2; cy = h * 0.5; RR = Math.min(w, h) * 0.4; cv.width = w * dpr; cv.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); };
    resize(); window.addEventListener("resize", resize);

    let rotY = 0.3, rotX = -0.18;
    const auto = 0.0022;
    let hovered: string | null = null;
    let raf = 0;

    const loop = () => {
      // otáčení do vybraného hesla
      const target = pickRef.current;
      if (target) {
        const p = pts.find((x) => x.slug === target);
        if (p) {
          const ty = Math.atan2(-p.ux, p.uz);
          const diff = ((ty - rotY + Math.PI) % (Math.PI * 2)) - Math.PI;
          rotY += diff * 0.12; rotX += (-0.05 - rotX) * 0.12;
          if (Math.abs(diff) < 0.04) { pickRef.current = null; onPick(target); return; }
        } else { pickRef.current = null; onPick(target); return; }
      } else {
        rotY += auto;
      }

      const cosY = Math.cos(rotY), sinY = Math.sin(rotY), cosX = Math.cos(rotX), sinX = Math.sin(rotX);
      for (const p of pts) {
        const x1 = p.ux * cosY + p.uz * sinY, z1 = -p.ux * sinY + p.uz * cosY, y1 = p.uy;
        const y2 = y1 * cosX - z1 * sinX, z2 = y1 * sinX + z1 * cosX;
        p.sx = cx + x1 * RR; p.sy = cy + y2 * RR * 0.82; p.sz = z2; p.sc = 0.62 + 0.38 * ((z2 + 1) / 2);
      }
      pts.sort((a, b) => a.sz - b.sz);

      ctx.clearRect(0, 0, w, h);
      const ql = qRef.current.trim().toLowerCase();
      const matchSet = ql ? new Set(searchNodes(ql, lang, 30).map((e) => e.slug)) : null;
      for (const p of pts) {
        const depth = (p.sz + 1) / 2; // 0 zadní … 1 přední
        const match = matchSet ? matchSet.has(p.slug) : true;
        const hot = p.slug === hovered || p.slug === target;
        const alpha = (0.18 + 0.82 * depth) * (matchSet && !match ? 0.12 : 1) * (hot ? 1 : 0.92);
        const fs = (10 + 9 * depth) * (hot ? 1.25 : 1);
        ctx.globalAlpha = Math.min(1, alpha);
        ctx.font = `${hot || match ? 700 : 500} ${fs.toFixed(1)}px ${getComputedStyle(document.body).fontFamily || "system-ui"}`;
        ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillStyle = hot ? p.col : (matchSet && match) ? p.col : ink;
        ctx.fillText(p.label, p.sx, p.sy);
      }
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(loop);
    };
    loop();

    const pick = (mx: number, my: number): P | null => {
      let best: P | null = null, bd = Infinity;
      for (const p of pts) { if (p.sz < -0.2) continue; const d = Math.hypot(p.sx - mx, p.sy - my); if (d < 42 && d < bd) { best = p; bd = d; } }
      return best;
    };
    const onMove = (e: PointerEvent) => { const p = pick(e.clientX, e.clientY); hovered = p?.slug ?? null; cv.style.cursor = p ? "pointer" : "grab"; };
    const onClick = (e: MouseEvent) => { const p = pick(e.clientX, e.clientY); if (p) goToTerm(p.slug); };
    cv.addEventListener("pointermove", onMove);
    cv.addEventListener("click", onClick);

    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); cv.removeEventListener("pointermove", onMove); cv.removeEventListener("click", onClick); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang, dark]);

  const ink = dark ? "#fff" : "#1a1614";
  const soft = dark ? "rgba(255,255,255,0.55)" : "rgba(26,22,20,0.55)";
  const rowBg = dark ? "rgba(12,14,24,0.92)" : "rgba(255,255,255,0.96)";
  const rowBorder = dark ? "1px solid rgba(255,255,255,0.14)" : "1px solid rgba(26,22,20,0.14)";

  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 5 }}>
      <canvas ref={canvasRef} style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} />

      {/* jádro planety — hledání */}
      <div style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%,-50%)", width: "min(420px, 84vw)", zIndex: 2 }}>
        <div style={{ textAlign: "center", marginBottom: 14, pointerEvents: "none" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.svg" alt="" width={44} height={44} style={{ display: "block", margin: "0 auto 8px", filter: dark ? "invert(1)" : "none", opacity: 0.95 }} />
          <p style={{ fontFamily: sans, fontSize: 9.5, textTransform: "uppercase", letterSpacing: "0.28em", color: soft }}>Encyklopedie</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 9, background: dark ? "rgba(20,22,38,0.82)" : "rgba(255,255,255,0.88)", border: dark ? "1px solid rgba(255,255,255,0.2)" : "1px solid rgba(26,22,20,0.2)", borderRadius: 999, padding: "12px 18px", backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)", boxShadow: dark ? "none" : "0 6px 24px rgba(26,22,20,0.1)" }}>
          <span aria-hidden>🔍</span>
          <input value={q} autoFocus onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && results[0]) goToTerm(results[0].slug); }}
            placeholder={u.searchPh} className="ency-search"
            style={{ flex: 1, background: "none", border: "none", outline: "none", color: ink, fontFamily: sans, fontSize: 15, minWidth: 0 }} />
        </div>
        {q.trim() && (
          <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 5 }}>
            {results.length === 0 ? <p style={{ fontFamily: sans, fontSize: 13, color: soft, textAlign: "center", padding: 6 }}>{u.empty}</p>
              : results.map((r: SearchEntry) => (
                <button key={r.slug} onClick={() => goToTerm(r.slug)} style={{ textAlign: "left", background: rowBg, border: rowBorder, borderRadius: 10, padding: "8px 12px", cursor: "pointer", fontFamily: sans, fontSize: 14, fontWeight: 700, color: ink }}>{r.title[lang]}</button>
              ))}
          </div>
        )}
      </div>
      <style>{`.ency-search::placeholder { color: inherit; opacity: 0.5; }`}</style>
    </div>
  );
}
