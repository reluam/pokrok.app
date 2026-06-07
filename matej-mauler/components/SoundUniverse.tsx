"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Fdtd, MATERIALS, LEVELS, M_PER_CELL, suUi, type Level } from "@/lib/soundUniverse";
import type { Lang } from "@/lib/dictionaries";

const GW = 300, GH = 120;
const INK = "#1a1614", BG = "#FAFAF7";
type Tool = "paint" | "erase";
type SongLite = { url: string; title: string };

const costOf = (id: number) => MATERIALS.find((m) => m.id === id)?.cost ?? 0;
const display: React.CSSProperties = { fontFamily: "var(--font-display)" };

export function SoundUniverse({ lang, songs }: { lang: Lang; songs: SongLite[] }) {
  const t = suUi[lang];
  const homeHref = lang === "cs" ? "/cs" : "/";
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const fdtdRef = useRef<Fdtd | null>(null);
  const builtRef = useRef<Uint8Array>(new Uint8Array(GW * GH));
  const lockedRef = useRef<Uint8Array>(new Uint8Array(GW * GH));
  const stage = useRef({ x: 46, y: 100 });
  const city = useRef({ x: 256, y: 100 });
  const driveAmp = useRef(1.1);

  const [levelIdx, setLevelIdx] = useState(0);
  const [started, setStarted] = useState(false);
  const [material, setMaterial] = useState(2);
  const [tool, setTool] = useState<Tool>("paint");
  const [meters, setMeters] = useState({ city: 0, warming: false });
  const [budgetUsed, setBudgetUsed] = useState(0);
  const [won, setWon] = useState(false);
  const wonRef = useRef(false);
  const belowSince = useRef(0);
  const simStep = useRef(0);
  const warmup = useRef(600);

  const level = LEVELS[levelIdx];

  const acRef = useRef<AudioContext | null>(null);
  const inGain = useRef<GainNode | null>(null);
  const lpRef = useRef<BiquadFilterNode | null>(null);
  const sceneGain = useRef<GainNode | null>(null);
  const audioElRef = useRef<HTMLAudioElement | null>(null);
  const procStop = useRef<(() => void) | null>(null);
  const targetRef = useRef({ gain: 0, cut: 8000 });

  const loadLevel = (lv: Level) => {
    const f = fdtdRef.current; if (!f) return;
    f.clearMaterials(); f.clearField();
    builtRef.current.fill(0); lockedRef.current.fill(0);
    const gy0 = f.groundY;
    if (lv.prebuilt) for (const b of lv.prebuilt) for (let x = b.x0; x <= b.x1; x++) for (let y = b.top; y < gy0; y++) { const i = y * GW + x; f.mat[i] = b.mat; lockedRef.current[i] = 1; }
    f.rebuild();
    stage.current = { x: lv.stageX, y: gy0 - (lv.stageH ?? 5) };
    city.current = { x: lv.cityX, y: gy0 - 13 };
    driveAmp.current = lv.loudness * 1.1;
    const d = Math.hypot(stage.current.x - city.current.x, stage.current.y - city.current.y);
    warmup.current = Math.round(2 * d + 300); simStep.current = 0;
    setBudgetUsed(0); setWon(false); wonRef.current = false; belowSince.current = 0;
  };

  useEffect(() => { const f = new Fdtd(GW, GH); fdtdRef.current = f; loadLevel(LEVELS[0]); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { loadLevel(level); }, [levelIdx]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── simulace + render (světlá brand scéna) ────────────────────── */
  useEffect(() => {
    const cv = canvasRef.current; if (!cv) return;
    const ctx = cv.getContext("2d"); if (!ctx) return;
    const off = document.createElement("canvas"); off.width = GW; off.height = GH;
    const octx = off.getContext("2d")!; const img = octx.createImageData(GW, GH); const data = img.data;

    let cssW = 0, cssH = 0, sliceH = 0;
    const layout = () => {
      const rect = cv.getBoundingClientRect();
      cv.width = Math.round(rect.width * devicePixelRatio); cv.height = Math.round(rect.height * devicePixelRatio);
      ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
      cssW = rect.width; cssH = rect.height; sliceH = cssH * 0.86;
    };
    layout();
    const ro = new ResizeObserver(layout); ro.observe(cv);
    const g2sx = (gx: number) => (gx / GW) * cssW;
    const g2sy = (gy: number) => (gy / GH) * sliceH;
    (cv as HTMLCanvasElement & { _s2g?: (sx: number, sy: number) => [number, number] })._s2g = (sx, sy) => [(sx / cssW) * GW, (sy / sliceH) * GH];

    let raf = 0, tStep = 0;
    const frame = () => {
      const f = fdtdRef.current!; const gy0 = f.groundY; const env = level.env;
      const si = f.idx(stage.current.x | 0, stage.current.y | 0);
      for (let s = 0; s < 2; s++) { tStep++; const drive = started ? Math.sin(tStep * 0.23) * driveAmp.current : 0; f.step(si, drive); }
      if (started) simStep.current += 2;
      const warming = started && simStep.current <= warmup.current;

      const p = f.p;
      const gTop = env === "city" ? [150, 148, 142] : [120, 170, 80];
      const gBot = env === "city" ? [86, 84, 80] : [70, 110, 50];
      for (let y = 0; y < GH; y++) {
        const sf = y / gy0;
        const bR = 196 + sf * 34, bG = 210 + sf * 26, bB = 242 + sf * 8; // pastelová obloha
        for (let x = 0; x < GW; x++) {
          const i = y * GW + x; const j = i * 4; const mt = f.mat[i];
          let r: number, g: number, b: number;
          if (y >= gy0) { const k = (y - gy0) / (GH - gy0); r = gTop[0] + (gBot[0] - gTop[0]) * k; g = gTop[1] + (gBot[1] - gTop[1]) * k; b = gTop[2] + (gBot[2] - gTop[2]) * k; }
          else if (mt) { const c = MATERIALS.find((q) => q.id === mt)!.color; r = parseInt(c.slice(1, 3), 16); g = parseInt(c.slice(3, 5), 16); b = parseInt(c.slice(5, 7), 16); }
          else { const a = Math.max(-1, Math.min(1, p[i] * 24)); r = bR + a * 120; g = bG - Math.abs(a) * 34; b = bB - a * 120; }
          data[j] = r; data[j + 1] = g; data[j + 2] = b; data[j + 3] = 255;
        }
      }
      octx.putImageData(img, 0, 0);
      ctx.clearRect(0, 0, cssW, cssH); ctx.imageSmoothingEnabled = false; ctx.drawImage(off, 0, 0, cssW, sliceH);

      const groundScreenY = g2sy(gy0);
      // perspektivní podlaha
      const grd = ctx.createLinearGradient(0, sliceH, 0, cssH);
      grd.addColorStop(0, env === "city" ? "#6b6a64" : `rgb(${gBot[0]},${gBot[1]},${gBot[2]})`); grd.addColorStop(1, "#3a3528");
      ctx.fillStyle = grd; ctx.fillRect(0, sliceH, cssW, cssH - sliceH);
      ctx.strokeStyle = "rgba(26,22,20,0.12)"; ctx.lineWidth = 1; const vpX = cssW / 2;
      for (let g = 0; g <= 10; g++) { const x0 = (g / 10) * cssW; ctx.beginPath(); ctx.moveTo(x0, sliceH); ctx.lineTo(vpX + (x0 - vpX) * 2.4, cssH); ctx.stroke(); }
      // inková linka země
      ctx.strokeStyle = INK; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(0, groundScreenY); ctx.lineTo(cssW, groundScreenY); ctx.stroke();

      // inkové čepičky na vrškách překážek
      ctx.fillStyle = "rgba(26,22,20,0.55)";
      for (let x = 0; x < GW; x++) { let topY = -1; for (let y = 0; y < gy0; y++) { if (f.mat[y * GW + x]) { topY = y; break; } } if (topY >= 0) ctx.fillRect(g2sx(x), g2sy(topY) - 2, cssW / GW + 1, 2.5); }

      // město
      const cx0 = g2sx(level.cityX - level.cityW / 2), cx1 = g2sx(level.cityX + level.cityW / 2);
      ctx.fillStyle = "rgba(26,22,20,0.05)"; ctx.fillRect(cx0, 0, cx1 - cx0, sliceH);
      ctx.fillStyle = "#fff"; ctx.strokeStyle = INK; ctx.lineWidth = 2;
      for (let h = 0; h < 4; h++) { const hw = (cx1 - cx0) / 5; const hx = cx0 + hw * (h + 0.3); const hh = 16 + (h % 2) * 9; ctx.fillRect(hx, groundScreenY - hh, hw * 0.7, hh); ctx.strokeRect(hx, groundScreenY - hh, hw * 0.7, hh); }
      ctx.fillStyle = INK; ctx.font = "700 12px system-ui"; ctx.textAlign = "center"; ctx.fillText(t.city, (cx0 + cx1) / 2, 18);

      // stage
      const sx = g2sx(stage.current.x), syG = groundScreenY;
      ctx.fillStyle = INK; ctx.fillRect(sx - 16, syG - 8, 32, 8);
      const syE = g2sy(stage.current.y);
      ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(sx, syE); ctx.lineTo(sx, syG); ctx.stroke();
      ctx.beginPath(); ctx.arc(sx, syE, 10, 0, 7); ctx.fillStyle = "#ff6fae"; ctx.fill(); ctx.lineWidth = 2.5; ctx.strokeStyle = INK; ctx.stroke();
      ctx.fillStyle = INK; ctx.fillText(t.stage, sx, syG + 16);

      // kóta vzdálenosti
      const sxC = g2sx(level.cityX); const dM = Math.round(Math.abs(stage.current.x - level.cityX) * M_PER_CELL);
      const ly = Math.min(cssH - 6, syG + 30);
      ctx.strokeStyle = "rgba(26,22,20,0.5)"; ctx.setLineDash([4, 4]); ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(sx, ly); ctx.lineTo(sxC, ly); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = INK; ctx.font = "700 11px system-ui"; ctx.fillText(`${dM} m`, (sx + sxC) / 2, ly - 4);

      // měření u města → audio + výhra
      let e = 0; for (let k = -3; k <= 3; k++) e += f.energyAt((level.cityX + k * 3) | 0, city.current.y | 0, 2); e /= 7;
      const dx = stage.current.x - level.cityX, dy = stage.current.y - city.current.y;
      const dist = Math.max(8, Math.hypot(dx, dy)); const baseline = 9 / dist;
      const trans = Math.max(0, Math.min(1.6, e / baseline)); const cityLevel = Math.min(1, trans);
      targetRef.current = { gain: cityLevel, cut: 300 * Math.pow(16000 / 300, Math.max(0.04, Math.min(1, trans))) };
      if (tStep % 8 === 0) setMeters({ city: cityLevel, warming });
      if (started && !wonRef.current && !warming) {
        if (cityLevel <= level.limit) { if (!belowSince.current) belowSince.current = performance.now(); else if (performance.now() - belowSince.current > 1400) { wonRef.current = true; setWon(true); } }
        else belowSince.current = 0;
      } else belowSince.current = 0;
      raf = requestAnimationFrame(frame);
    };
    frame();
    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
  }, [started, levelIdx]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!started) return; let raf = 0;
    const tick = () => { const ac = acRef.current; if (ac && lpRef.current && sceneGain.current) { sceneGain.current.gain.setTargetAtTime(targetRef.current.gain, ac.currentTime, 0.08); lpRef.current.frequency.setTargetAtTime(targetRef.current.cut, ac.currentTime, 0.08); } raf = requestAnimationFrame(tick); };
    tick(); return () => cancelAnimationFrame(raf);
  }, [started]);

  const startProcFallback = (ac: AudioContext, into: AudioNode) => {
    const notes = [0, 4, 7, 12, 7, 4]; const root = 220; let step = 0;
    const timer = setInterval(() => {
      const o = ac.createOscillator(); o.type = "sawtooth"; o.frequency.value = root * Math.pow(2, notes[step % notes.length] / 12);
      const g = ac.createGain(); g.gain.value = 0.0001; const fl = ac.createBiquadFilter(); fl.type = "lowpass"; fl.frequency.value = 2200;
      o.connect(fl).connect(g).connect(into); const tn = ac.currentTime;
      g.gain.setValueAtTime(0.0001, tn); g.gain.exponentialRampToValueAtTime(0.5, tn + 0.02); g.gain.exponentialRampToValueAtTime(0.0008, tn + 0.32);
      o.start(tn); o.stop(tn + 0.36); step++;
    }, 300);
    procStop.current = () => clearInterval(timer);
  };

  const start = async () => {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ac = new AC(); acRef.current = ac;
    const input = ac.createGain(); input.gain.value = 0.6; inGain.current = input;
    const lp = ac.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 8000; lpRef.current = lp;
    const sg = ac.createGain(); sg.gain.value = 0; sceneGain.current = sg;
    const comp = ac.createDynamicsCompressor();
    input.connect(lp).connect(sg).connect(comp).connect(ac.destination);
    const song = songs[0];
    if (song) { const a = new Audio(); a.crossOrigin = "anonymous"; a.loop = true; a.src = song.url; audioElRef.current = a; try { ac.createMediaElementSource(a).connect(input); await a.play(); } catch { startProcFallback(ac, input); } }
    else startProcFallback(ac, input);
    simStep.current = 0; belowSince.current = 0; setStarted(true);
  };

  useEffect(() => () => { procStop.current?.(); try { audioElRef.current?.pause(); } catch {} try { acRef.current?.close(); } catch {} }, []);

  /* ── stavění s rozpočtem dle ceny materiálu ────────────────────── */
  const painting = useRef(false);
  const applyAt = (sxp: number, syp: number) => {
    const cv = canvasRef.current as (HTMLCanvasElement & { _s2g?: (a: number, b: number) => [number, number] }) | null;
    const f = fdtdRef.current; if (!cv?._s2g || !f) return;
    const [gx, gy] = cv._s2g(sxp, syp); const x = Math.round(gx); const gy0 = f.groundY;
    if (x < 1 || x >= GW - 1) return;
    const top = Math.max(1, Math.min(gy0 - 1, Math.round(gy)));
    const built = builtRef.current, locked = lockedRef.current; const bw = 2; const mc = costOf(material);
    let changed = false, used = budgetUsed;
    for (let k = -bw; k <= bw; k++) {
      const xx = x + k; if (xx < 1 || xx >= GW - 1) continue;
      for (let yy = top; yy < gy0; yy++) {
        const i = yy * GW + xx; if (locked[i]) continue;
        if (tool === "paint") {
          const cur = f.mat[i];
          if (cur === material) continue;
          if (built[i]) { const refund = costOf(cur); if (used - refund + mc <= level.budget) { f.mat[i] = material; used += mc - refund; changed = true; } }
          else if (used + mc <= level.budget) { f.mat[i] = material; built[i] = 1; used += mc; changed = true; }
        } else if (built[i]) { used -= costOf(f.mat[i]); f.mat[i] = 0; built[i] = 0; changed = true; }
      }
    }
    if (changed) { f.rebuild(); setBudgetUsed(used); }
  };
  const onDown = (e: React.PointerEvent) => { painting.current = true; const r = e.currentTarget.getBoundingClientRect(); applyAt(e.clientX - r.left, e.clientY - r.top); };
  const onMove = (e: React.PointerEvent) => { if (!painting.current) return; const r = e.currentTarget.getBoundingClientRect(); applyAt(e.clientX - r.left, e.clientY - r.top); };
  const onUp = () => { painting.current = false; };
  const resetBuild = () => { const f = fdtdRef.current; if (!f) return; const built = builtRef.current; for (let i = 0; i < f.N; i++) if (built[i]) { f.mat[i] = 0; built[i] = 0; } f.rebuild(); setBudgetUsed(0); belowSince.current = 0; };

  // ── styly (brand: cartoon) ──
  const chip = (active: boolean): React.CSSProperties => ({
    padding: "7px 13px", borderRadius: "999px", border: `2px solid ${INK}`,
    background: active ? INK : "#fff", color: active ? "#fff" : INK,
    boxShadow: active ? "none" : `2px 2px 0 ${INK}`, transform: active ? "translate(2px,2px)" : "none",
    fontFamily: "var(--font-sans)", fontSize: "12px", fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap",
  });
  const primaryBtn: React.CSSProperties = { background: INK, color: "#fff", border: `2.5px solid ${INK}`, borderRadius: "12px", boxShadow: `4px 4px 0 ${INK}`, padding: "13px 28px", fontFamily: "var(--font-sans)", fontSize: "15px", fontWeight: 700, cursor: "pointer" };
  const ghostBtn: React.CSSProperties = { background: "#fff", color: INK, border: `2.5px solid ${INK}`, borderRadius: "12px", boxShadow: `4px 4px 0 ${INK}`, padding: "13px 24px", fontFamily: "var(--font-sans)", fontSize: "15px", fontWeight: 700, cursor: "pointer" };
  const card: React.CSSProperties = { background: "#fff", border: `2.5px solid ${INK}`, borderRadius: "16px", boxShadow: `5px 5px 0 ${INK}` };

  const over = level.limit; const cityPct = Math.round(meters.city * 100);
  const overlayBg = "rgba(250,250,247,0.82)";

  return (
    <div style={{ position: "fixed", inset: 0, background: BG, color: INK, display: "flex", flexDirection: "column", overflow: "hidden", padding: "10px 12px 12px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "4px 4px 10px", flexShrink: 0 }}>
        <Link href={homeHref} style={{ fontFamily: "var(--font-sans)", fontSize: "12px", color: "var(--text-muted)", textDecoration: "none" }}>{t.back}</Link>
        <span style={{ ...display, fontSize: "16px", fontWeight: 700, letterSpacing: "-0.01em" }}>{t.title}</span>
        <span style={{ width: 70 }} />
      </div>

      <div style={{ flex: 1, position: "relative", minHeight: 0, ...card, overflow: "hidden", padding: 0 }}>
        <canvas ref={canvasRef} onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerLeave={onUp}
          style={{ width: "100%", height: "100%", display: "block", touchAction: "none", cursor: "crosshair" }} />

        {started && (
          <div style={{ position: "absolute", top: "12px", right: "12px", ...card, padding: "10px 12px", minWidth: "184px" }}>
            <p style={{ fontFamily: "var(--font-sans)", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-muted)", marginBottom: "2px" }}>{t.level} · {level.name[lang]}</p>
            <p style={{ fontFamily: "var(--font-sans)", fontSize: "11px", color: "var(--text-secondary)", marginBottom: "8px" }}>{t.distance}: {Math.round(Math.abs(level.stageX - level.cityX) * M_PER_CELL)} m</p>
            <p style={{ fontFamily: "var(--font-sans)", fontSize: "12px", marginBottom: "6px" }}>{t.cityHears}: <strong style={{ color: meters.warming ? "var(--text-muted)" : meters.city <= over ? "#16A34A" : "#dc2626" }}>{meters.warming ? t.propagating : `${cityPct}%`}</strong></p>
            <div style={{ height: 10, background: "rgba(26,22,20,0.1)", border: `1.5px solid ${INK}`, borderRadius: "999px", position: "relative", overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${cityPct}%`, background: meters.city <= over ? "#16A34A" : "#dc2626" }} />
              <div style={{ position: "absolute", top: -2, bottom: -2, left: `${Math.round(over * 100)}%`, width: 2.5, background: INK }} />
            </div>
            <p style={{ fontFamily: "var(--font-sans)", fontSize: "10px", color: "var(--text-muted)", marginTop: "6px" }}>{t.budget}: {budgetUsed}/{level.budget}{budgetUsed >= level.budget ? ` · ${t.overBudget}` : ""}</p>
          </div>
        )}

        {!started && (
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: overlayBg, padding: "24px" }}>
            <div style={{ ...card, padding: "28px 30px", maxWidth: "480px", textAlign: "center" }}>
              <h1 style={{ ...display, fontSize: "clamp(28px,6vw,44px)", fontWeight: 700, letterSpacing: "-0.03em", marginBottom: "10px" }}>{t.title}</h1>
              <p style={{ fontFamily: "var(--font-sans)", fontSize: "14px", color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: "20px" }}>{t.intro}</p>
              <button onClick={start} style={primaryBtn}>{t.start}</button>
              <p style={{ fontFamily: "var(--font-sans)", fontSize: "11px", color: "var(--text-muted)", marginTop: "14px" }}>{t.audioNote}{songs.length === 0 ? ` ${t.noSong}` : ""}</p>
            </div>
          </div>
        )}

        {won && (
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: overlayBg, padding: "24px" }}>
            <div style={{ ...card, padding: "28px 30px", textAlign: "center" }}>
              <h2 style={{ ...display, fontSize: "clamp(24px,5vw,38px)", fontWeight: 700, marginBottom: "18px" }}>{t.won}</h2>
              <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
                {levelIdx < LEVELS.length - 1 && <button onClick={() => setLevelIdx((i) => i + 1)} style={primaryBtn}>{t.next}</button>}
                <button onClick={() => loadLevel(level)} style={ghostBtn}>{t.retry}</button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div style={{ flexShrink: 0, ...card, marginTop: "10px", padding: "12px 14px", display: "flex", flexDirection: "column", gap: "9px", maxHeight: "38vh", overflowY: "auto" }}>
        <Row label={t.level}>{LEVELS.map((lv, i) => <button key={lv.id} onClick={() => setLevelIdx(i)} style={chip(levelIdx === i)}>{lv.name[lang]}</button>)}</Row>
        <Row label={t.tools}>
          <button onClick={() => setTool("paint")} style={chip(tool === "paint")}>{t.paint}</button>
          <button onClick={() => setTool("erase")} style={chip(tool === "erase")}>{t.erase}</button>
          <button onClick={resetBuild} style={chip(false)}>{t.reset}</button>
        </Row>
        <Row label={t.material}>{MATERIALS.map((m) => (
          <button key={m.id} onClick={() => { setMaterial(m.id); setTool("paint"); }} style={{ ...chip(material === m.id), display: "inline-flex", alignItems: "center", gap: "6px" }}>
            <span style={{ width: 11, height: 11, borderRadius: 3, background: m.color, border: `1px solid ${INK}` }} />{m.name[lang]} <span style={{ opacity: 0.6 }}>·{m.cost}</span>
          </button>
        ))}</Row>
        <p style={{ fontFamily: "var(--font-sans)", fontSize: "11px", color: "var(--text-muted)", lineHeight: 1.5 }}>{t.tip}</p>
      </div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
      <span style={{ fontFamily: "var(--font-sans)", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-muted)", width: "84px", flexShrink: 0 }}>{label}</span>
      {children}
    </div>
  );
}
