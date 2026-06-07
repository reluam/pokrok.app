"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Fdtd, MATERIALS, LEVELS, suUi, type Level } from "@/lib/soundUniverse";
import type { Lang } from "@/lib/dictionaries";

const GW = 300, GH = 120;
type Tool = "paint" | "erase";
type SongLite = { url: string; title: string };

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
  const [meters, setMeters] = useState({ city: 0 });
  const [budgetUsed, setBudgetUsed] = useState(0);
  const [won, setWon] = useState(false);
  const wonRef = useRef(false);
  const belowSince = useRef(0);

  const level = LEVELS[levelIdx];

  const acRef = useRef<AudioContext | null>(null);
  const inGain = useRef<GainNode | null>(null);
  const lpRef = useRef<BiquadFilterNode | null>(null);
  const sceneGain = useRef<GainNode | null>(null);
  const audioElRef = useRef<HTMLAudioElement | null>(null);
  const procStop = useRef<(() => void) | null>(null);
  const targetRef = useRef({ gain: 0, cut: 8000 });

  /* ── načtení levelu ─────────────────────────────────────────────── */
  const loadLevel = (lv: Level) => {
    const f = fdtdRef.current; if (!f) return;
    f.clearMaterials(); f.clearField();
    builtRef.current.fill(0); lockedRef.current.fill(0);
    const gy0 = f.groundY;
    if (lv.prebuilt) for (const b of lv.prebuilt) {
      for (let x = b.x0; x <= b.x1; x++) for (let y = b.top; y < gy0; y++) {
        const i = y * GW + x; f.mat[i] = b.mat; lockedRef.current[i] = 1;
      }
    }
    f.rebuild();
    stage.current = { x: lv.stageX, y: gy0 - 5 };
    city.current = { x: lv.cityX, y: gy0 - 13 };
    driveAmp.current = lv.loudness * 1.1;
    setBudgetUsed(0); setWon(false); wonRef.current = false; belowSince.current = 0;
  };

  useEffect(() => {
    const f = new Fdtd(GW, GH); fdtdRef.current = f;
    loadLevel(LEVELS[0]);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { loadLevel(level); }, [levelIdx]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── simulace + render ─────────────────────────────────────────── */
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
      cssW = rect.width; cssH = rect.height; sliceH = cssH * 0.84;
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

      const p = f.p;
      const groundR = env === "city" ? 40 : 30, groundG = env === "city" ? 36 : 50, groundB = env === "city" ? 30 : 24;
      for (let y = 0; y < GH; y++) {
        const sky = y / gy0;
        const skyR = 10 + sky * 26, skyG = 14 + sky * 30, skyB = 30 + sky * 46;
        for (let x = 0; x < GW; x++) {
          const i = y * GW + x; const j = i * 4; const mt = f.mat[i];
          let r: number, g: number, b: number;
          if (y >= gy0) { const k = (y - gy0) / (GH - gy0); r = groundR - k * 16; g = groundG - k * 16; b = groundB - k * 10; }
          else if (mt) { const c = MATERIALS.find((q) => q.id === mt)!.color; r = parseInt(c.slice(1, 3), 16); g = parseInt(c.slice(3, 5), 16); b = parseInt(c.slice(5, 7), 16); }
          else { const a = Math.max(-1, Math.min(1, p[i] * 26)); r = skyR + (a > 0 ? a * 235 : -a * 20); g = skyG + Math.abs(a) * 120; b = skyB + (a < 0 ? -a * 220 : a * 40); }
          data[j] = r; data[j + 1] = g; data[j + 2] = b; data[j + 3] = 255;
        }
      }
      octx.putImageData(img, 0, 0);
      ctx.clearRect(0, 0, cssW, cssH);
      ctx.imageSmoothingEnabled = false; ctx.drawImage(off, 0, 0, cssW, sliceH);

      const groundScreenY = g2sy(gy0);
      const grd = ctx.createLinearGradient(0, sliceH, 0, cssH);
      grd.addColorStop(0, env === "city" ? "#211c17" : "#23301a"); grd.addColorStop(1, "#0a0805");
      ctx.fillStyle = grd; ctx.fillRect(0, sliceH, cssW, cssH - sliceH);
      ctx.strokeStyle = "rgba(255,255,255,0.06)"; ctx.lineWidth = 1; const vpX = cssW / 2;
      for (let g = 0; g <= 10; g++) { const x0 = (g / 10) * cssW; ctx.beginPath(); ctx.moveTo(x0, sliceH); ctx.lineTo(vpX + (x0 - vpX) * 2.4, cssH); ctx.stroke(); }

      // 3D čepičky na vrškách překážek
      ctx.fillStyle = "rgba(255,255,255,0.22)";
      for (let x = 0; x < GW; x++) { let topY = -1; for (let y = 0; y < gy0; y++) { if (f.mat[y * GW + x]) { topY = y; break; } } if (topY >= 0) ctx.fillRect(g2sx(x), g2sy(topY) - 2, cssW / GW + 1, 2); }

      // město (cílová zóna)
      const cx0 = g2sx(level.cityX - level.cityW / 2), cx1 = g2sx(level.cityX + level.cityW / 2);
      ctx.fillStyle = "rgba(120,180,255,0.10)"; ctx.fillRect(cx0, 0, cx1 - cx0, sliceH);
      ctx.strokeStyle = "rgba(140,190,255,0.5)"; ctx.lineWidth = 1.5; ctx.strokeRect(cx0, 0, cx1 - cx0, sliceH);
      // domky
      ctx.fillStyle = "rgba(180,200,235,0.85)";
      for (let h = 0; h < 4; h++) { const hw = (cx1 - cx0) / 5; const hx = cx0 + hw * (h + 0.3); const hh = 14 + (h % 2) * 8; ctx.fillRect(hx, groundScreenY - hh, hw * 0.7, hh); }
      ctx.fillStyle = "rgba(160,190,255,0.9)"; ctx.font = "700 11px var(--font-sans, system-ui)"; ctx.textAlign = "center";
      ctx.fillText(t.city, (cx0 + cx1) / 2, 16);

      // stage
      const sx = g2sx(stage.current.x), syG = groundScreenY;
      ctx.fillStyle = "#1a1614"; ctx.fillRect(sx - 16, syG - 10, 32, 10);
      ctx.fillStyle = "#ff6fae"; ctx.beginPath(); ctx.arc(sx, g2sy(stage.current.y), 9, 0, 7); ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = "#fff"; ctx.stroke();
      ctx.fillStyle = "rgba(255,150,210,0.9)"; ctx.fillText(t.stage, sx, syG + 16);

      // měření u města → audio + výhra
      let e = 0; for (let k = -3; k <= 3; k++) e += f.energyAt((level.cityX + k * 3) | 0, city.current.y | 0, 2); e /= 7;
      const dx = stage.current.x - level.cityX, dy = stage.current.y - city.current.y;
      const dist = Math.max(8, Math.hypot(dx, dy)); const baseline = 9 / dist;
      const trans = Math.max(0, Math.min(1.6, e / baseline)); const cityLevel = Math.min(1, trans);
      targetRef.current = { gain: cityLevel, cut: 300 * Math.pow(16000 / 300, Math.max(0.04, Math.min(1, trans))) };
      if (tStep % 8 === 0) setMeters({ city: cityLevel });

      if (started && !wonRef.current) {
        if (cityLevel <= level.limit) { if (!belowSince.current) belowSince.current = performance.now(); else if (performance.now() - belowSince.current > 1400) { wonRef.current = true; setWon(true); } }
        else belowSince.current = 0;
      }
      raf = requestAnimationFrame(frame);
    };
    frame();
    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
  }, [started, levelIdx]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── audio dotahování ──────────────────────────────────────────── */
  useEffect(() => {
    if (!started) return; let raf = 0;
    const tick = () => {
      const ac = acRef.current;
      if (ac && lpRef.current && sceneGain.current) {
        sceneGain.current.gain.setTargetAtTime(targetRef.current.gain, ac.currentTime, 0.08);
        lpRef.current.frequency.setTargetAtTime(targetRef.current.cut, ac.currentTime, 0.08);
      }
      raf = requestAnimationFrame(tick);
    };
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
    if (song) {
      const a = new Audio(); a.crossOrigin = "anonymous"; a.loop = true; a.src = song.url; audioElRef.current = a;
      try { const node = ac.createMediaElementSource(a); node.connect(input); await a.play(); }
      catch { startProcFallback(ac, input); }
    } else startProcFallback(ac, input);
    setStarted(true);
  };

  useEffect(() => () => { procStop.current?.(); try { audioElRef.current?.pause(); } catch {} try { acRef.current?.close(); } catch {} }, []);

  /* ── interakce: stavění s budgetem ─────────────────────────────── */
  const painting = useRef(false);
  const applyAt = (sxp: number, syp: number) => {
    const cv = canvasRef.current as (HTMLCanvasElement & { _s2g?: (a: number, b: number) => [number, number] }) | null;
    const f = fdtdRef.current; if (!cv?._s2g || !f) return;
    const [gx, gy] = cv._s2g(sxp, syp); const x = Math.round(gx); const gy0 = f.groundY;
    if (x < 1 || x >= GW - 1) return;
    const top = Math.max(1, Math.min(gy0 - 1, Math.round(gy)));
    const built = builtRef.current, locked = lockedRef.current; const bw = 2;
    let changed = false, used = budgetUsed;
    for (let k = -bw; k <= bw; k++) {
      const xx = x + k; if (xx < 1 || xx >= GW - 1) continue;
      for (let yy = top; yy < gy0; yy++) {
        const i = yy * GW + xx; if (locked[i]) continue;
        if (tool === "paint") {
          if (built[i]) { if (f.mat[i] !== material) { f.mat[i] = material; changed = true; } continue; }
          if (used >= level.budget) continue;
          f.mat[i] = material; built[i] = 1; used++; changed = true;
        } else { if (built[i]) { f.mat[i] = 0; built[i] = 0; used--; changed = true; } }
      }
    }
    if (changed) { f.rebuild(); setBudgetUsed(used); }
  };
  const onDown = (e: React.PointerEvent) => { painting.current = true; const r = e.currentTarget.getBoundingClientRect(); applyAt(e.clientX - r.left, e.clientY - r.top); };
  const onMove = (e: React.PointerEvent) => { if (!painting.current) return; const r = e.currentTarget.getBoundingClientRect(); applyAt(e.clientX - r.left, e.clientY - r.top); };
  const onUp = () => { painting.current = false; };
  const resetBuild = () => { const f = fdtdRef.current; if (!f) return; const built = builtRef.current; for (let i = 0; i < f.N; i++) if (built[i]) { f.mat[i] = 0; built[i] = 0; } f.rebuild(); setBudgetUsed(0); belowSince.current = 0; };

  const chip = (active: boolean): React.CSSProperties => ({
    padding: "7px 12px", borderRadius: "999px", border: "2px solid rgba(255,255,255,0.22)",
    background: active ? "#fff" : "rgba(255,255,255,0.04)", color: active ? "#04060f" : "rgba(255,255,255,0.85)",
    fontFamily: "var(--font-sans)", fontSize: "12px", fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap",
  });

  const over = level.limit;
  const cityPct = Math.round(meters.city * 100);

  return (
    <div style={{ position: "fixed", inset: 0, background: "#04060f", color: "#fff", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", flexShrink: 0 }}>
        <Link href={homeHref} style={{ fontFamily: "var(--font-sans)", fontSize: "12px", color: "rgba(255,255,255,0.7)", textDecoration: "none" }}>{t.back}</Link>
        <span style={{ fontFamily: "var(--font-sans)", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.22em", color: "rgba(255,255,255,0.5)" }}>{t.eyebrow}</span>
      </div>

      <div style={{ flex: 1, position: "relative", minHeight: 0 }}>
        <canvas ref={canvasRef} onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerLeave={onUp}
          style={{ width: "100%", height: "100%", display: "block", touchAction: "none", cursor: "crosshair" }} />

        {/* level + city meter */}
        {started && (
          <div style={{ position: "absolute", top: "12px", right: "14px", background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "12px", padding: "10px 12px", backdropFilter: "blur(6px)", minWidth: "180px" }}>
            <p style={{ fontFamily: "var(--font-sans)", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.12em", color: "rgba(255,255,255,0.5)", marginBottom: "2px" }}>{t.level} · {level.name[lang]}</p>
            <p style={{ fontFamily: "var(--font-sans)", fontSize: "12px", color: "rgba(255,255,255,0.85)", marginBottom: "8px" }}>{t.cityHears}: <strong style={{ color: meters.city <= over ? "#5ec46a" : "#ff6b6b" }}>{cityPct}%</strong></p>
            <div style={{ height: 10, background: "rgba(255,255,255,0.14)", borderRadius: "999px", position: "relative", overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${cityPct}%`, background: meters.city <= over ? "#5ec46a" : "#ff6b6b" }} />
              <div style={{ position: "absolute", top: -2, bottom: -2, left: `${Math.round(over * 100)}%`, width: 2, background: "#fff" }} title={t.limitLbl} />
            </div>
            <p style={{ fontFamily: "var(--font-sans)", fontSize: "10px", color: "rgba(255,255,255,0.5)", marginTop: "6px" }}>{t.budget}: {budgetUsed}/{level.budget} {budgetUsed >= level.budget ? `· ${t.overBudget}` : ""}</p>
          </div>
        )}

        {/* start overlay */}
        {!started && (
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "16px", background: "rgba(4,6,15,0.5)", textAlign: "center", padding: "24px" }}>
            <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(30px,7vw,52px)", fontWeight: 700, letterSpacing: "-0.03em" }}>{t.title}</h1>
            <p style={{ fontFamily: "var(--font-sans)", fontSize: "14px", color: "rgba(255,255,255,0.7)", maxWidth: "460px", lineHeight: 1.6 }}>{t.intro}</p>
            <button onClick={start} style={{ background: "#fff", color: "#04060f", border: "none", borderRadius: "12px", padding: "14px 30px", fontFamily: "var(--font-sans)", fontSize: "16px", fontWeight: 700, cursor: "pointer" }}>{t.start}</button>
            <p style={{ fontFamily: "var(--font-sans)", fontSize: "11px", color: "rgba(255,255,255,0.45)" }}>{t.audioNote}{songs.length === 0 ? ` ${t.noSong}` : ""}</p>
          </div>
        )}

        {/* win overlay */}
        {won && (
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "14px", background: "rgba(4,6,15,0.6)", textAlign: "center", padding: "24px" }}>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(26px,6vw,42px)", fontWeight: 700 }}>{t.won}</h2>
            <div style={{ display: "flex", gap: "10px" }}>
              {levelIdx < LEVELS.length - 1 && <button onClick={() => setLevelIdx((i) => i + 1)} style={{ background: "#fff", color: "#04060f", border: "none", borderRadius: "12px", padding: "12px 24px", fontFamily: "var(--font-sans)", fontSize: "15px", fontWeight: 700, cursor: "pointer" }}>{t.next}</button>}
              <button onClick={() => loadLevel(level)} style={{ background: "transparent", color: "#fff", border: "2px solid rgba(255,255,255,0.3)", borderRadius: "12px", padding: "12px 24px", fontFamily: "var(--font-sans)", fontSize: "15px", fontWeight: 700, cursor: "pointer" }}>{t.retry}</button>
            </div>
          </div>
        )}
      </div>

      <div style={{ flexShrink: 0, background: "rgba(0,0,0,0.4)", borderTop: "1px solid rgba(255,255,255,0.12)", padding: "12px 16px", display: "flex", flexDirection: "column", gap: "10px", maxHeight: "40vh", overflowY: "auto" }}>
        <Row label={t.level}>{LEVELS.map((lv, i) => <button key={lv.id} onClick={() => setLevelIdx(i)} style={chip(levelIdx === i)}>{lv.name[lang]}</button>)}</Row>
        <Row label={t.tools}>
          <button onClick={() => setTool("paint")} style={chip(tool === "paint")}>{t.paint}</button>
          <button onClick={() => setTool("erase")} style={chip(tool === "erase")}>{t.erase}</button>
          <button onClick={resetBuild} style={chip(false)}>{t.reset}</button>
        </Row>
        <Row label={t.material}>{MATERIALS.map((m) => (
          <button key={m.id} onClick={() => { setMaterial(m.id); setTool("paint"); }} style={{ ...chip(material === m.id), display: "inline-flex", alignItems: "center", gap: "6px" }}>
            <span style={{ width: 11, height: 11, borderRadius: 3, background: m.color, border: "1px solid rgba(0,0,0,0.3)" }} />{m.name[lang]}
          </button>
        ))}</Row>
        <p style={{ fontFamily: "var(--font-sans)", fontSize: "11px", color: "rgba(255,255,255,0.45)", lineHeight: 1.5 }}>{t.tip}</p>
      </div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
      <span style={{ fontFamily: "var(--font-sans)", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(255,255,255,0.45)", width: "92px", flexShrink: 0 }}>{label}</span>
      {children}
    </div>
  );
}
