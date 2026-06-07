"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Fdtd, MATERIALS, MEDIA, EMITTERS, mediumById, emitterById, suUi, type EmitterId } from "@/lib/soundUniverse";
import type { Lang } from "@/lib/dictionaries";

const GW = 300, GH = 120;
type Tool = "paint" | "erase" | "move" | "ear";

// výchozí výška emitoru nad zemí (menší y = výš)
function heightFor(id: EmitterId, groundY: number): number {
  if (id === "helicopter") return 12;
  if (id === "birds") return Math.round(groundY - 45);
  return groundY - 5; // dálnice, repro = u země
}

export function SoundUniverse({ lang }: { lang: Lang }) {
  const t = suUi[lang];
  const homeHref = lang === "cs" ? "/cs" : "/";
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const fdtdRef = useRef<Fdtd | null>(null);
  const emitterPos = useRef({ x: 46, y: 100 });
  const earPos = useRef({ x: 250, y: 100 });

  const [started, setStarted] = useState(false);
  const [emitter, setEmitter] = useState<EmitterId>("speaker");
  const [medium, setMedium] = useState("air");
  const [material, setMaterial] = useState(2);
  const [tool, setTool] = useState<Tool>("paint");
  const [meters, setMeters] = useState({ loud: 0, trans: 0 });

  const acRef = useRef<AudioContext | null>(null);
  const inGain = useRef<GainNode | null>(null);
  const lpRef = useRef<BiquadFilterNode | null>(null);
  const sceneGain = useRef<GainNode | null>(null);
  const stopSrc = useRef<(() => void) | null>(null);
  const targetRef = useRef({ gain: 0, cut: 8000 });

  // init
  useEffect(() => {
    const f = new Fdtd(GW, GH);
    const m = mediumById(medium);
    f.setMedium(m.courant, m.damp);
    fdtdRef.current = f;
    emitterPos.current = { x: 46, y: heightFor("speaker", f.groundY) };
    earPos.current = { x: 250, y: f.groundY - 13 };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { const m = mediumById(medium); fdtdRef.current?.setMedium(m.courant, m.damp); }, [medium]);
  useEffect(() => { const f = fdtdRef.current; if (f) emitterPos.current = { ...emitterPos.current, y: heightFor(emitter, f.groundY) }; }, [emitter]);

  /* ── render + simulace ─────────────────────────────────────────── */
  useEffect(() => {
    const cv = canvasRef.current; if (!cv) return;
    const ctx = cv.getContext("2d"); if (!ctx) return;
    const off = document.createElement("canvas"); off.width = GW; off.height = GH;
    const octx = off.getContext("2d")!;
    const img = octx.createImageData(GW, GH);
    const data = img.data;

    let cssW = 0, cssH = 0, sliceH = 0;
    const layout = () => {
      const rect = cv.getBoundingClientRect();
      cv.width = Math.round(rect.width * devicePixelRatio); cv.height = Math.round(rect.height * devicePixelRatio);
      ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
      cssW = rect.width; cssH = rect.height; sliceH = cssH * 0.82;
    };
    layout();
    const ro = new ResizeObserver(layout); ro.observe(cv);
    const g2sx = (gx: number) => (gx / GW) * cssW;
    const g2sy = (gy: number) => (gy / GH) * sliceH;
    (cv as HTMLCanvasElement & { _s2g?: (sx: number, sy: number) => [number, number] })._s2g = (sx, sy) => [(sx / cssW) * GW, (sy / sliceH) * GH];

    let raf = 0, tStep = 0;
    const frame = () => {
      const f = fdtdRef.current!; const gy0 = f.groundY;
      const em = emitterById(emitter);
      const si = f.idx(emitterPos.current.x | 0, emitterPos.current.y | 0);
      for (let s = 0; s < 2; s++) { tStep++; const drive = started ? Math.sin(tStep * 0.18 * em.driveHz) * 1.1 : 0; f.step(si, drive); }

      // vybarvení: obloha (gradient) + vlny, zem, materiály
      const p = f.p;
      for (let y = 0; y < GH; y++) {
        const sky = y / gy0;
        // gradient oblohy shora dolů
        const skyR = 10 + sky * 26, skyG = 14 + sky * 30, skyB = 30 + sky * 46;
        for (let x = 0; x < GW; x++) {
          const i = y * GW + x; const j = i * 4; const mt = f.mat[i];
          let r: number, g: number, b: number;
          if (y >= gy0) { // zem
            const k = (y - gy0) / (GH - gy0);
            r = 46 - k * 18; g = 34 - k * 14; b = 22 - k * 8;
          } else if (mt) {
            const c = MATERIALS.find((q) => q.id === mt)!.color;
            r = parseInt(c.slice(1, 3), 16); g = parseInt(c.slice(3, 5), 16); b = parseInt(c.slice(5, 7), 16);
          } else {
            const a = Math.max(-1, Math.min(1, p[i] * 26));
            r = skyR + (a > 0 ? a * 235 : -a * 20);
            g = skyG + Math.abs(a) * 120;
            b = skyB + (a < 0 ? -a * 220 : a * 40);
          }
          data[j] = r; data[j + 1] = g; data[j + 2] = b; data[j + 3] = 255;
        }
      }
      octx.putImageData(img, 0, 0);

      ctx.clearRect(0, 0, cssW, cssH);
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(off, 0, 0, cssW, sliceH);

      // perspektivní podlaha pod řezem (dojem hloubky)
      const groundScreenY = g2sy(gy0);
      const floorTop = sliceH;
      const grd = ctx.createLinearGradient(0, floorTop, 0, cssH);
      grd.addColorStop(0, "#2a2014"); grd.addColorStop(1, "#0a0805");
      ctx.fillStyle = grd; ctx.fillRect(0, floorTop, cssW, cssH - floorTop);
      ctx.strokeStyle = "rgba(255,255,255,0.06)"; ctx.lineWidth = 1;
      const vpX = cssW / 2;
      for (let g = 0; g <= 10; g++) { const x0 = (g / 10) * cssW; ctx.beginPath(); ctx.moveTo(x0, floorTop); ctx.lineTo(vpX + (x0 - vpX) * 2.4, cssH); ctx.stroke(); }

      // 3D čepičky na vršky překážek
      ctx.fillStyle = "rgba(255,255,255,0.22)";
      for (let x = 0; x < GW; x++) {
        let topY = -1;
        for (let y = 0; y < gy0; y++) { if (f.mat[y * GW + x]) { topY = y; break; } }
        if (topY >= 0) {
          const sx = g2sx(x), sy = g2sy(topY), w = cssW / GW + 1;
          ctx.fillRect(sx, sy - 2, w, 2);
        }
      }

      // pól + ikona zdroje
      const drawNode = (gx: number, gy: number, color: string, ear: boolean) => {
        const sx = g2sx(gx), sy = g2sy(gy);
        ctx.strokeStyle = "rgba(255,255,255,0.3)"; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx, groundScreenY); ctx.stroke();
        ctx.beginPath(); ctx.arc(sx, sy, 10, 0, 7); ctx.fillStyle = color; ctx.fill();
        ctx.lineWidth = 2; ctx.strokeStyle = ear ? "#1a1614" : "#fff"; ctx.stroke();
        if (ear) { ctx.fillStyle = "#1a1614"; ctx.font = "11px system-ui"; ctx.textAlign = "center"; ctx.fillText("👂", sx, sy + 4); }
      };
      drawNode(emitterPos.current.x, emitterPos.current.y, em.color, false);
      drawNode(earPos.current.x, earPos.current.y, "#fff", true);

      // měření přenosu k uchu → audio
      const eEar = f.energyAt(earPos.current.x | 0, earPos.current.y | 0, 2);
      const dx = emitterPos.current.x - earPos.current.x, dy = emitterPos.current.y - earPos.current.y;
      const dist = Math.max(8, Math.hypot(dx, dy));
      const baseline = 9 / dist;
      const trans = Math.max(0, Math.min(1.4, eEar / baseline));
      const loud = Math.min(1, trans);
      const cut = 300 * Math.pow(16000 / 300, Math.max(0.04, Math.min(1, trans)));
      targetRef.current = { gain: loud, cut };
      if (tStep % 8 === 0) setMeters({ loud, trans });

      raf = requestAnimationFrame(frame);
    };
    frame();
    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
  }, [emitter, started]);

  /* ── audio dotahování ──────────────────────────────────────────── */
  useEffect(() => {
    if (!started) return; let raf = 0;
    const tick = () => {
      const ac = acRef.current;
      if (ac && lpRef.current && sceneGain.current) {
        const { gain, cut } = targetRef.current;
        sceneGain.current.gain.setTargetAtTime(gain, ac.currentTime, 0.08);
        lpRef.current.frequency.setTargetAtTime(cut, ac.currentTime, 0.08);
      }
      raf = requestAnimationFrame(tick);
    };
    tick(); return () => cancelAnimationFrame(raf);
  }, [started]);

  /* ── procedurální zdroje ───────────────────────────────────────── */
  const buildSource = (ac: AudioContext, into: AudioNode, id: EmitterId): (() => void) => {
    const stops: (() => void)[] = [];
    const noiseBuf = () => { const b = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate); const d = b.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; return b; };
    if (id === "highway") {
      const src = ac.createBufferSource(); src.buffer = noiseBuf(); src.loop = true;
      const lp = ac.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 700;
      const g = ac.createGain(); g.gain.value = 0.9;
      src.connect(lp).connect(g).connect(into); src.start();
      stops.push(() => { try { src.stop(); } catch {} });
    } else if (id === "speaker") {
      const notes = [0, 4, 7, 12, 7, 4]; const root = 220; let step = 0;
      const timer = setInterval(() => {
        const o = ac.createOscillator(); o.type = "sawtooth"; o.frequency.value = root * Math.pow(2, notes[step % notes.length] / 12);
        const g = ac.createGain(); g.gain.value = 0.0001;
        const f = ac.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = 2200;
        o.connect(f).connect(g).connect(into); const tn = ac.currentTime;
        g.gain.setValueAtTime(0.0001, tn); g.gain.exponentialRampToValueAtTime(0.5, tn + 0.02); g.gain.exponentialRampToValueAtTime(0.0008, tn + 0.32);
        o.start(tn); o.stop(tn + 0.36); step++;
      }, 300);
      stops.push(() => clearInterval(timer));
    } else if (id === "birds") {
      const timer = setInterval(() => {
        if (Math.random() > 0.7) return;
        const o = ac.createOscillator(); o.type = "sine"; const g = ac.createGain(); g.gain.value = 0.0001;
        const base = 2400 + Math.random() * 2200; const tn = ac.currentTime;
        o.frequency.setValueAtTime(base, tn); o.frequency.linearRampToValueAtTime(base + 900, tn + 0.08); o.frequency.linearRampToValueAtTime(base - 300, tn + 0.16);
        g.gain.setValueAtTime(0.0001, tn); g.gain.exponentialRampToValueAtTime(0.4, tn + 0.02); g.gain.exponentialRampToValueAtTime(0.0008, tn + 0.2);
        o.connect(g).connect(into); o.start(tn); o.stop(tn + 0.24);
      }, 380);
      stops.push(() => clearInterval(timer));
    } else {
      const o = ac.createOscillator(); o.type = "sawtooth"; o.frequency.value = 70;
      const src = ac.createBufferSource(); src.buffer = noiseBuf(); src.loop = true;
      const nlp = ac.createBiquadFilter(); nlp.type = "lowpass"; nlp.frequency.value = 500;
      const chop = ac.createGain(); chop.gain.value = 0.5;
      const lfo = ac.createOscillator(); lfo.type = "square"; lfo.frequency.value = 13;
      const lfoG = ac.createGain(); lfoG.gain.value = 0.5; lfo.connect(lfoG).connect(chop.gain);
      const mix = ac.createGain(); mix.gain.value = 0.8;
      o.connect(mix); src.connect(nlp).connect(chop).connect(mix); mix.connect(into);
      o.start(); src.start(); lfo.start();
      stops.push(() => { try { o.stop(); src.stop(); lfo.stop(); } catch {} });
    }
    return () => stops.forEach((s) => s());
  };

  const start = async () => {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ac = new AC(); acRef.current = ac;
    const input = ac.createGain(); input.gain.value = 0.5; inGain.current = input;
    const lp = ac.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 8000; lpRef.current = lp;
    const sg = ac.createGain(); sg.gain.value = 0; sceneGain.current = sg;
    const comp = ac.createDynamicsCompressor();
    input.connect(lp).connect(sg).connect(comp).connect(ac.destination);
    stopSrc.current = buildSource(ac, input, emitter);
    setStarted(true);
  };

  useEffect(() => {
    if (!started || !acRef.current || !inGain.current) return;
    stopSrc.current?.(); stopSrc.current = buildSource(acRef.current, inGain.current, emitter);
  }, [emitter]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => () => { stopSrc.current?.(); try { acRef.current?.close(); } catch {} }, []);

  /* ── interakce ─────────────────────────────────────────────────── */
  const painting = useRef(false);
  const applyAt = (sx: number, sy: number) => {
    const cv = canvasRef.current as (HTMLCanvasElement & { _s2g?: (a: number, b: number) => [number, number] }) | null;
    const f = fdtdRef.current; if (!cv?._s2g || !f) return;
    const [gx, gy] = cv._s2g(sx, sy);
    const x = Math.round(gx), y = Math.round(gy); const gy0 = f.groundY;
    if (x < 1 || x >= GW - 1) return;
    if (tool === "move") { emitterPos.current = { x: Math.max(2, Math.min(GW - 3, x)), y: Math.max(2, Math.min(gy0 - 2, y)) }; f.clearField(); }
    else if (tool === "ear") { earPos.current = { x: Math.max(2, Math.min(GW - 3, x)), y: Math.max(2, Math.min(gy0 - 2, y)) }; }
    else if (tool === "paint" || tool === "erase") {
      const top = Math.max(1, Math.min(gy0 - 1, y));
      const id = tool === "paint" ? material : 0;
      const bw = 2;
      for (let k = -bw; k <= bw; k++) {
        const xx = x + k; if (xx < 1 || xx >= GW - 1) continue;
        for (let yy = top; yy < gy0; yy++) f.mat[yy * GW + xx] = id;
      }
      f.rebuild();
    }
  };
  const onDown = (e: React.PointerEvent) => { painting.current = true; const r = e.currentTarget.getBoundingClientRect(); applyAt(e.clientX - r.left, e.clientY - r.top); };
  const onMove = (e: React.PointerEvent) => { if (!painting.current) return; const r = e.currentTarget.getBoundingClientRect(); applyAt(e.clientX - r.left, e.clientY - r.top); };
  const onUp = () => { painting.current = false; };
  const reset = () => { fdtdRef.current?.clearMaterials(); fdtdRef.current?.clearField(); };

  const chip = (active: boolean): React.CSSProperties => ({
    padding: "7px 12px", borderRadius: "999px", border: "2px solid rgba(255,255,255,0.22)",
    background: active ? "#fff" : "rgba(255,255,255,0.04)", color: active ? "#04060f" : "rgba(255,255,255,0.85)",
    fontFamily: "var(--font-sans)", fontSize: "12px", fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap",
  });

  return (
    <div style={{ position: "fixed", inset: 0, background: "#04060f", color: "#fff", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", flexShrink: 0 }}>
        <Link href={homeHref} style={{ fontFamily: "var(--font-sans)", fontSize: "12px", color: "rgba(255,255,255,0.7)", textDecoration: "none" }}>{t.back}</Link>
        <span style={{ fontFamily: "var(--font-sans)", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.22em", color: "rgba(255,255,255,0.5)" }}>{t.eyebrow}</span>
      </div>

      <div style={{ flex: 1, position: "relative", minHeight: 0 }}>
        <canvas ref={canvasRef} onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerLeave={onUp}
          style={{ width: "100%", height: "100%", display: "block", touchAction: "none", cursor: tool === "paint" || tool === "erase" ? "crosshair" : "grab" }} />

        {!started && (
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "16px", background: "rgba(4,6,15,0.5)", textAlign: "center", padding: "24px" }}>
            <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(30px,7vw,52px)", fontWeight: 700, letterSpacing: "-0.03em" }}>{t.title}</h1>
            <p style={{ fontFamily: "var(--font-sans)", fontSize: "14px", color: "rgba(255,255,255,0.7)", maxWidth: "460px", lineHeight: 1.6 }}>{t.intro}</p>
            <button onClick={start} style={{ background: "#fff", color: "#04060f", border: "none", borderRadius: "12px", padding: "14px 30px", fontFamily: "var(--font-sans)", fontSize: "16px", fontWeight: 700, cursor: "pointer" }}>{t.start}</button>
            <p style={{ fontFamily: "var(--font-sans)", fontSize: "11px", color: "rgba(255,255,255,0.45)" }}>{t.audioNote}</p>
          </div>
        )}

        {started && (
          <div style={{ position: "absolute", top: "12px", right: "14px", background: "rgba(0,0,0,0.45)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "12px", padding: "10px 12px", backdropFilter: "blur(6px)", minWidth: "150px" }}>
            <p style={{ fontFamily: "var(--font-sans)", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.12em", color: "rgba(255,255,255,0.5)", marginBottom: "6px" }}>{t.youHear}</p>
            <Bar label={t.loudness} v={meters.loud} />
            <Bar label={t.muffle} v={1 - Math.min(1, meters.trans)} />
          </div>
        )}
      </div>

      <div style={{ flexShrink: 0, background: "rgba(0,0,0,0.4)", borderTop: "1px solid rgba(255,255,255,0.12)", padding: "12px 16px", display: "flex", flexDirection: "column", gap: "10px", maxHeight: "44vh", overflowY: "auto" }}>
        <Row label={t.emitter}>{EMITTERS.map((e) => <button key={e.id} onClick={() => setEmitter(e.id)} style={chip(emitter === e.id)}>{e.name[lang]}</button>)}</Row>
        <Row label={t.tools}>
          <button onClick={() => setTool("paint")} style={chip(tool === "paint")}>{t.paint}</button>
          <button onClick={() => setTool("erase")} style={chip(tool === "erase")}>{t.erase}</button>
          <button onClick={() => setTool("move")} style={chip(tool === "move")}>{t.move}</button>
          <button onClick={() => setTool("ear")} style={chip(tool === "ear")}>{t.ear}</button>
          <button onClick={reset} style={chip(false)}>{t.reset}</button>
        </Row>
        <Row label={t.material}>{MATERIALS.map((m) => (
          <button key={m.id} onClick={() => { setMaterial(m.id); setTool("paint"); }} style={{ ...chip(material === m.id), display: "inline-flex", alignItems: "center", gap: "6px" }}>
            <span style={{ width: 11, height: 11, borderRadius: 3, background: m.color, border: "1px solid rgba(0,0,0,0.3)" }} />{m.name[lang]}
          </button>
        ))}</Row>
        <Row label={t.medium}>{MEDIA.map((m) => <button key={m.id} onClick={() => setMedium(m.id)} style={chip(medium === m.id)}>{m.name[lang]}</button>)}</Row>
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

function Bar({ label, v }: { label: string; v: number }) {
  return (
    <div style={{ marginBottom: "5px" }}>
      <p style={{ fontFamily: "var(--font-sans)", fontSize: "10px", color: "rgba(255,255,255,0.6)", marginBottom: "2px" }}>{label}</p>
      <div style={{ height: 6, background: "rgba(255,255,255,0.15)", borderRadius: "999px", overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${Math.round(Math.max(0, Math.min(1, v)) * 100)}%`, background: "#5ec46a" }} />
      </div>
    </div>
  );
}
