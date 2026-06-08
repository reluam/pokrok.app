"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Fdtd, MATERIALS, LEVELS, M_PER_CELL, DRIVE_AMP, OPEN_REF, suUi, type Level } from "@/lib/soundUniverse";
import { buildSource } from "@/lib/suAudio";
import { drawSource } from "@/lib/suSprites";
import type { Lang } from "@/lib/dictionaries";

const GW = 300, GH = 120, INK = "#1a1614", BG = "#FAFAF7";
const TS = 5, TW = 60, TH = 24, GROUND_TILE = 22, GROUND_Y = 110; // dlaždice 5 buněk
const SUBSTEPS = 4;       // víc kroků/snímek = rychlejší šíření i ustálení
const COURANT = 0.62;     // rychlost vln (stabilní < 0.707)
const distMeters = (lv: Level) => Math.round(Math.abs(lv.stageX - lv.cityX) * M_PER_CELL);
const openFieldDb = (lv: Level) => lv.sourceDb - 20 * Math.log10(Math.max(1, distMeters(lv) / 10));
const dbAt = (sourceDb: number, distM: number, lvl: number) => sourceDb - 20 * Math.log10(Math.max(1, distM / 10)) + 20 * Math.log10(Math.max(0.004, Math.min(1, lvl)) / OPEN_REF);
type Tool = "paint" | "erase";
type SongLite = { url: string; title: string };

const costOf = (id: number) => MATERIALS.find((m) => m.id === id)?.cost ?? 0;
const display: React.CSSProperties = { fontFamily: "var(--font-display)" };

const MAT_KIND: Record<number, string> = { 1: "brick", 2: "concrete", 3: "glass", 4: "soil", 5: "sand", 6: "hedge" };
function tileColors(kind: string): [string, string, string] {
  switch (kind) {
    case "brick": return ["#b5562f", "#8f3f1f", "#cf6e46"];
    case "concrete": return ["#9a9ca1", "#74767b", "#b6b8bd"];
    case "glass": return ["#bfe9f2", "#8fcdd9", "#ffffff"];
    case "soil": case "dirt": case "grass": return ["#7a5230", "#5c3d22", "#8e6238"];
    case "sand": return ["#e3c779", "#c9a857", "#efd896"];
    case "hedge": return ["#43914f", "#2c6936", "#5cb267"];
    case "stone": return ["#6f6a63", "#524e48", "#857f76"];
    default: return ["#999", "#666", "#bbb"];
  }
}
const hsh = (a: number, b: number) => { let h = (a * 92837 + b * 689287) >>> 0; h ^= h >>> 13; return h >>> 0; };
function drawTile(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, kind: string, seed: number) {
  const [base, dark, light] = tileColors(kind);
  if (kind === "glass") ctx.globalAlpha = 0.68;
  ctx.fillStyle = base; ctx.fillRect(x, y, w + 0.6, h + 0.6);
  ctx.fillStyle = light; ctx.fillRect(x, y, w, 1.3); ctx.fillRect(x, y, 1.3, h);
  ctx.fillStyle = dark; ctx.fillRect(x, y + h - 1.3, w, 1.3); ctx.fillRect(x + w - 1.3, y, 1.3, h);
  if (kind === "brick") {
    ctx.strokeStyle = dark; ctx.lineWidth = 1; const my = y + h / 2;
    ctx.beginPath(); ctx.moveTo(x, my); ctx.lineTo(x + w, my);
    const o = (seed & 1) ? w / 2 : 0; ctx.moveTo(x + o, y); ctx.lineTo(x + o, my); ctx.moveTo(x + w / 2, my); ctx.lineTo(x + w / 2, y + h); ctx.stroke();
  } else if (kind === "glass") {
    ctx.strokeStyle = "rgba(255,255,255,0.75)"; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(x + w * 0.22, y + h * 0.8); ctx.lineTo(x + w * 0.8, y + h * 0.22); ctx.stroke();
  } else {
    ctx.fillStyle = dark; const r = hsh(seed, 3); const iw = Math.max(1, (w - 4) | 0), ih = Math.max(1, (h - 4) | 0);
    for (let m = 0; m < 3; m++) ctx.fillRect(x + 2 + ((r >> (m * 6)) % iw), y + 2 + ((r >> (m * 6 + 3)) % ih), 1.6, 1.6);
  }
  if (kind === "grass") { ctx.fillStyle = "#62c46a"; const gh = Math.max(2, h * 0.36); ctx.fillRect(x, y, w, gh); ctx.fillStyle = "#3f8a4a"; ctx.fillRect(x, y + gh - 1, w, 1.4); }
  ctx.globalAlpha = 1;
}

export function SoundUniverse({ lang, songs }: { lang: Lang; songs: SongLite[] }) {
  const t = suUi[lang];
  const homeHref = lang === "cs" ? "/cs" : "/";
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const fdtdRef = useRef<Fdtd | null>(null);
  const tileMat = useRef<Uint8Array>(new Uint8Array(TW * TH));
  const tileLocked = useRef<Uint8Array>(new Uint8Array(TW * TH));
  const stage = useRef({ x: 46, y: 100 });
  const city = useRef({ x: 256, y: 100 });
  const driveAmp = useRef(1.1);

  const [levelIdx, setLevelIdx] = useState(0);
  const [started, setStarted] = useState(false);
  const [material, setMaterial] = useState(2);
  const [tool, setTool] = useState<Tool>("paint");
  const [meters, setMeters] = useState({ cityDb: 0, audienceDb: 999, warming: false });
  const [budgetUsed, setBudgetUsed] = useState(0);
  const [won, setWon] = useState(false);
  const [muted, setMuted] = useState(false);
  const masterRef = useRef<GainNode | null>(null);
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

  const syncTiles = (f: Fdtd) => {
    f.mat.fill(0); const tm = tileMat.current;
    for (let ty = 0; ty < GROUND_TILE; ty++) for (let tx = 0; tx < TW; tx++) {
      const m = tm[ty * TW + tx]; if (!m) continue;
      for (let yy = ty * TS; yy < ty * TS + TS; yy++) for (let xx = tx * TS; xx < tx * TS + TS; xx++) f.mat[yy * GW + xx] = m;
    }
    f.rebuild();
  };

  const loadLevel = (lv: Level) => {
    const f = fdtdRef.current; if (!f) return;
    tileMat.current.fill(0); tileLocked.current.fill(0);
    if (lv.prebuilt) for (const b of lv.prebuilt) {
      const tx0 = Math.floor(b.x0 / TS), tx1 = Math.floor(b.x1 / TS), tty = Math.floor(b.top / TS);
      for (let tx = tx0; tx <= tx1; tx++) for (let ty = tty; ty < GROUND_TILE; ty++) { const ti = ty * TW + tx; tileMat.current[ti] = b.mat; tileLocked.current[ti] = 1; }
    }
    // vnitřní prostor (klub/zkušebna): betonová místnost kolem zdroje s mezerou (dveřmi) k cíli
    if (lv.enclosure) {
      const stx = Math.floor(lv.stageX / TS), left = stx - 4, right = stx + 4, roomTop = GROUND_TILE - 9;
      const set = (tx: number, ty: number) => { if (tx < 0 || tx >= TW || ty < 0 || ty >= GROUND_TILE) return; const ti = ty * TW + tx; tileMat.current[ti] = 2; tileLocked.current[ti] = 1; };
      for (let ty = roomTop; ty < GROUND_TILE; ty++) { set(left, ty); set(right, ty); }
      for (let tx = left; tx <= right; tx++) set(tx, roomTop);
      for (const ty of [GROUND_TILE - 1, GROUND_TILE - 2]) { const ti = ty * TW + right; tileMat.current[ti] = 0; tileLocked.current[ti] = 0; } // dveře
    }
    f.clearField(); syncTiles(f);
    stage.current = { x: lv.stageX, y: GROUND_Y - (lv.stageH ?? 5) };
    city.current = { x: lv.cityX, y: GROUND_Y - 13 };
    driveAmp.current = DRIVE_AMP;
    const d = Math.hypot(stage.current.x - city.current.x, stage.current.y - city.current.y);
    warmup.current = Math.round(d / COURANT + 180); simStep.current = 0;
    setBudgetUsed(0); setWon(false); wonRef.current = false; belowSince.current = 0;
  };

  useEffect(() => { const f = new Fdtd(GW, GH); f.groundY = GROUND_Y; f.setMedium(COURANT, 0.0009); fdtdRef.current = f; loadLevel(LEVELS[0]); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { loadLevel(level); }, [levelIdx]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { const ids = level.materials ?? MATERIALS.map((m) => m.id); if (!ids.includes(material)) setMaterial(ids[0]); }, [levelIdx]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── simulace + tile render ────────────────────────────────────── */
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
      const f = fdtdRef.current!; const env = level.env;
      const si = f.idx(stage.current.x | 0, stage.current.y | 0);
      for (let s = 0; s < SUBSTEPS; s++) { tStep++; const drive = started ? Math.sin(tStep * 0.16 * level.driveHz) * driveAmp.current : 0; f.step(si, drive); }
      if (started) simStep.current += SUBSTEPS;
      const warming = started && simStep.current <= warmup.current;

      // měření u cíle → dB + audio + výhra
      let eSum = 0; for (let k = -3; k <= 3; k++) eSum += f.energyAt((level.cityX + k * 3) | 0, city.current.y | 0, 2); eSum /= 7;
      const dxm = stage.current.x - level.cityX, dym = stage.current.y - city.current.y;
      const distC = Math.max(8, Math.hypot(dxm, dym)); const trans = Math.max(0, Math.min(1.6, eSum / (9 / distC)));
      const cityLevel = Math.min(1, trans);
      const cityDb = dbAt(level.sourceDb, distMeters(level), cityLevel);
      let audienceDb = 999;
      if (level.audienceX != null) {
        let ea = 0; for (let k = -2; k <= 2; k++) ea += f.energyAt((level.audienceX + k * 2) | 0, city.current.y | 0, 2); ea /= 5;
        const ad = Math.max(8, Math.abs(stage.current.x - level.audienceX)); const at = Math.max(0, Math.min(1.6, ea / (9 / ad)));
        audienceDb = dbAt(level.sourceDb, Math.abs(stage.current.x - level.audienceX) * M_PER_CELL, at);
      }
      const audOk = level.audienceX == null || audienceDb >= (level.audienceMinDb ?? 0);
      targetRef.current = { gain: cityLevel, cut: 300 * Math.pow(16000 / 300, Math.max(0.04, Math.min(1, trans))) };
      if (tStep % 8 === 0) setMeters({ cityDb, audienceDb, warming });
      if (started && !wonRef.current && !warming) {
        if (cityDb <= level.limitDb && audOk) { if (!belowSince.current) belowSince.current = performance.now(); else if (performance.now() - belowSince.current > 1400) { wonRef.current = true; setWon(true); } }
        else belowSince.current = 0;
      } else belowSince.current = 0;

      // obloha + vlny (jen pásmo nad zemí)
      const p = f.p;
      for (let y = 0; y < GROUND_Y; y++) {
        const sf = y / GROUND_Y; const bR = 196 + sf * 36, bG = 212 + sf * 26, bB = 244 + sf * 6;
        for (let x = 0; x < GW; x++) {
          const i = y * GW + x; const j = i * 4; const a = Math.max(-1, Math.min(1, p[i] * 24));
          data[j] = bR + a * 120; data[j + 1] = bG - Math.abs(a) * 34; data[j + 2] = bB - a * 120; data[j + 3] = 255;
        }
      }
      octx.putImageData(img, 0, 0);
      ctx.clearRect(0, 0, cssW, cssH); ctx.imageSmoothingEnabled = false;
      const skyH = (GROUND_Y / GH) * sliceH;
      ctx.drawImage(off, 0, 0, GW, GROUND_Y, 0, 0, cssW, skyH);

      const tw = cssW / TW, th = sliceH / TH;
      // materiály (dlaždice)
      const tm = tileMat.current;
      for (let ty = 0; ty < GROUND_TILE; ty++) for (let tx = 0; tx < TW; tx++) {
        const m = tm[ty * TW + tx]; if (!m) continue;
        drawTile(ctx, tx * tw, ty * th, tw, th, MAT_KIND[m] ?? "concrete", hsh(tx, ty));
      }
      // zem (tráva + hlína)
      for (let ty = GROUND_TILE; ty < TH; ty++) for (let tx = 0; tx < TW; tx++) {
        const kind = ty === GROUND_TILE ? (env === "city" ? "stone" : "grass") : "dirt";
        drawTile(ctx, tx * tw, ty * th, tw, th, kind, hsh(tx, ty + 99));
      }
      // perspektivní podlaha pod řezem
      const grd = ctx.createLinearGradient(0, sliceH, 0, cssH);
      grd.addColorStop(0, "#5c3d22"); grd.addColorStop(1, "#3a2716");
      ctx.fillStyle = grd; ctx.fillRect(0, sliceH, cssW, cssH - sliceH);
      ctx.strokeStyle = "rgba(0,0,0,0.18)"; ctx.lineWidth = 1; const vpX = cssW / 2;
      for (let g = 0; g <= 10; g++) { const x0 = (g / 10) * cssW; ctx.beginPath(); ctx.moveTo(x0, sliceH); ctx.lineTo(vpX + (x0 - vpX) * 2.4, cssH); ctx.stroke(); }

      const groundScreenY = g2sy(GROUND_Y);
      // město
      const cx0 = g2sx(level.cityX - level.cityW / 2), cx1 = g2sx(level.cityX + level.cityW / 2);
      ctx.fillStyle = "#fff"; ctx.strokeStyle = INK; ctx.lineWidth = 2;
      for (let h = 0; h < 4; h++) { const hw = (cx1 - cx0) / 5; const hx = cx0 + hw * (h + 0.3); const hh = 16 + (h % 2) * 9; ctx.fillRect(hx, groundScreenY - hh, hw * 0.7, hh); ctx.strokeRect(hx, groundScreenY - hh, hw * 0.7, hh); }
      ctx.fillStyle = INK; ctx.font = "700 12px system-ui"; ctx.textAlign = "center"; ctx.fillText(level.target[lang], (cx0 + cx1) / 2, 18);
      ctx.fillStyle = cityDb <= level.limitDb ? "#16A34A" : "#dc2626"; ctx.font = "800 14px system-ui"; ctx.fillText(warming ? "…" : `${Math.round(cityDb)} dB`, (cx0 + cx1) / 2, 35);
      ctx.fillStyle = "rgba(26,22,20,0.55)"; ctx.font = "600 10px system-ui"; ctx.fillText(`${t.limitWord} ${level.limitDb}`, (cx0 + cx1) / 2, 48);

      // zóna návštěvníků (festival/stadion) — musí slyšet
      if (level.audienceX != null) {
        const aw = level.audienceW ?? 30; const ax0 = g2sx(level.audienceX - aw / 2), ax1 = g2sx(level.audienceX + aw / 2);
        ctx.fillStyle = "rgba(94,196,106,0.14)"; ctx.fillRect(ax0, 0, ax1 - ax0, sliceH);
        ctx.strokeStyle = "#16A34A"; ctx.lineWidth = 1.5; ctx.strokeRect(ax0, 0, ax1 - ax0, sliceH);
        ctx.fillStyle = INK; for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.arc(ax0 + ((i + 0.5) / 6) * (ax1 - ax0), groundScreenY - 4, 3, 0, 7); ctx.fill(); }
        const aOk2 = audienceDb >= (level.audienceMinDb ?? 0);
        ctx.textAlign = "center"; ctx.fillStyle = INK; ctx.font = "700 11px system-ui"; ctx.fillText(t.audienceLbl, (ax0 + ax1) / 2, 18);
        ctx.fillStyle = aOk2 ? "#16A34A" : "#dc2626"; ctx.font = "800 13px system-ui"; ctx.fillText(warming ? "…" : `${Math.round(audienceDb)} dB`, (ax0 + ax1) / 2, 33);
        ctx.fillStyle = "rgba(26,22,20,0.55)"; ctx.font = "600 10px system-ui"; ctx.fillText(`${t.minWord} ${level.audienceMinDb}`, (ax0 + ax1) / 2, 45);
      }

      // zdroj hluku — sprite podle levelu
      const sx = g2sx(stage.current.x); const syE = g2sy(stage.current.y);
      const u = (cssW / TW) * 0.85;
      drawSource(ctx, level.kind, sx, groundScreenY, syE, u);
      ctx.textAlign = "center"; ctx.fillStyle = INK; ctx.font = "700 11px system-ui"; ctx.fillText(level.source[lang], sx, groundScreenY + 16);
      ctx.fillStyle = "rgba(26,22,20,0.78)"; ctx.font = "800 12px system-ui"; ctx.fillText(`${level.sourceDb} dB`, sx, Math.min(syE, groundScreenY) - 18);

      // kóta
      const sxC = g2sx(level.cityX); const dM = Math.round(Math.abs(stage.current.x - level.cityX) * M_PER_CELL);
      const ly = Math.min(cssH - 6, groundScreenY + 30);
      ctx.strokeStyle = "rgba(255,255,255,0.7)"; ctx.setLineDash([4, 4]); ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(sx, ly); ctx.lineTo(sxC, ly); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = "#fff"; ctx.font = "700 11px system-ui"; ctx.fillText(`${dM} m`, (sx + sxC) / 2, ly - 4);

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

  // zdroj zvuku podle levelu (festival = nahraný song, jinak procedurální)
  const buildLevelSource = async (lv: Level) => {
    const ac = acRef.current, input = inGain.current; if (!ac || !input) return;
    procStop.current?.(); procStop.current = null;
    try { audioElRef.current?.pause(); } catch {}
    if (lv.kind === "stage" && songs[0]) {
      const a = new Audio(); a.crossOrigin = "anonymous"; a.loop = true; a.src = songs[0].url; audioElRef.current = a;
      try { const node = ac.createMediaElementSource(a); node.connect(input); await a.play(); procStop.current = () => { try { a.pause(); } catch {} try { node.disconnect(); } catch {} }; }
      catch { procStop.current = buildSource(ac, input, "stage"); }
    } else procStop.current = buildSource(ac, input, lv.kind);
  };

  const start = async () => {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ac = new AC(); acRef.current = ac;
    const input = ac.createGain(); input.gain.value = 0.6; inGain.current = input;
    const lp = ac.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 8000; lpRef.current = lp;
    const sg = ac.createGain(); sg.gain.value = 0; sceneGain.current = sg;
    const comp = ac.createDynamicsCompressor();
    const master = ac.createGain(); master.gain.value = muted ? 0 : 1; masterRef.current = master;
    input.connect(lp).connect(sg).connect(comp).connect(master).connect(ac.destination);
    await buildLevelSource(level);
    simStep.current = 0; belowSince.current = 0; setStarted(true);
  };
  // přepnutí levelu = jiný zvuk
  useEffect(() => { if (acRef.current && inGain.current) buildLevelSource(LEVELS[levelIdx]); }, [levelIdx]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => () => { procStop.current?.(); try { audioElRef.current?.pause(); } catch {} try { acRef.current?.close(); } catch {} }, []);

  const toggleMute = () => setMuted((m) => { const nm = !m; const ac = acRef.current; if (masterRef.current && ac) masterRef.current.gain.setTargetAtTime(nm ? 0 : 1, ac.currentTime, 0.02); return nm; });

  /* ── stavění po dlaždicích s rozpočtem ─────────────────────────── */
  const painting = useRef(false);
  const applyAt = (sxp: number, syp: number) => {
    const cv = canvasRef.current as (HTMLCanvasElement & { _s2g?: (a: number, b: number) => [number, number] }) | null;
    const f = fdtdRef.current; if (!cv?._s2g || !f) return;
    const [gx, gy] = cv._s2g(sxp, syp); const tx = Math.floor(gx / TS), ty = Math.floor(gy / TS);
    if (tx < 0 || tx >= TW || ty < 0 || ty >= GROUND_TILE) return;
    const ti = ty * TW + tx; if (tileLocked.current[ti]) return;
    const tm = tileMat.current; let used = budgetUsed, changed = false; const mc = costOf(material);
    if (tool === "paint") {
      const cur = tm[ti];
      if (cur === material) return;
      if (cur > 0) { const refund = costOf(cur); if (used - refund + mc <= level.budget) { tm[ti] = material; used += mc - refund; changed = true; } }
      else if (used + mc <= level.budget) { tm[ti] = material; used += mc; changed = true; }
    } else if (tm[ti] > 0) { used -= costOf(tm[ti]); tm[ti] = 0; changed = true; }
    if (changed) { syncTiles(f); setBudgetUsed(used); }
  };
  const onDown = (e: React.PointerEvent) => { painting.current = true; const r = e.currentTarget.getBoundingClientRect(); applyAt(e.clientX - r.left, e.clientY - r.top); };
  const onMove = (e: React.PointerEvent) => { if (!painting.current) return; const r = e.currentTarget.getBoundingClientRect(); applyAt(e.clientX - r.left, e.clientY - r.top); };
  const onUp = () => { painting.current = false; };
  const resetBuild = () => { const f = fdtdRef.current; if (!f) return; const tm = tileMat.current, lk = tileLocked.current; for (let i = 0; i < tm.length; i++) if (!lk[i]) tm[i] = 0; syncTiles(f); setBudgetUsed(0); belowSince.current = 0; };

  const chip = (active: boolean): React.CSSProperties => ({
    padding: "7px 13px", borderRadius: "999px", border: `2px solid ${INK}`,
    background: active ? INK : "#fff", color: active ? "#fff" : INK,
    boxShadow: active ? "none" : `2px 2px 0 ${INK}`, transform: active ? "translate(2px,2px)" : "none",
    fontFamily: "var(--font-sans)", fontSize: "12px", fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap",
  });
  const primaryBtn: React.CSSProperties = { background: INK, color: "#fff", border: `2.5px solid ${INK}`, borderRadius: "12px", boxShadow: `4px 4px 0 ${INK}`, padding: "13px 28px", fontFamily: "var(--font-sans)", fontSize: "15px", fontWeight: 700, cursor: "pointer" };
  const ghostBtn: React.CSSProperties = { background: "#fff", color: INK, border: `2.5px solid ${INK}`, borderRadius: "12px", boxShadow: `4px 4px 0 ${INK}`, padding: "13px 24px", fontFamily: "var(--font-sans)", fontSize: "15px", fontWeight: 700, cursor: "pointer" };
  const card: React.CSSProperties = { background: "#fff", border: `2.5px solid ${INK}`, borderRadius: "16px", boxShadow: `5px 5px 0 ${INK}` };

  const loDb = 30, sDb = level.sourceDb;
  const cl = (v: number) => Math.max(0, Math.min(1, v));
  const cityPct = cl((meters.cityDb - loDb) / (sDb - loDb)) * 100;
  const limPct = cl((level.limitDb - loDb) / (sDb - loDb)) * 100;
  const okDb = meters.cityDb <= level.limitDb;
  const reduction = openFieldDb(level) - meters.cityDb;
  const mats = (level.materials ?? MATERIALS.map((m) => m.id)).map((id) => MATERIALS.find((m) => m.id === id)!).filter(Boolean);
  const audOkUI = level.audienceX == null || meters.audienceDb >= (level.audienceMinDb ?? 0);
  const overlayBg = "rgba(250,250,247,0.82)";

  return (
    <div style={{ position: "fixed", inset: 0, background: BG, color: INK, display: "flex", flexDirection: "column", overflow: "hidden", padding: "10px 12px 12px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "4px 4px 10px", flexShrink: 0 }}>
        <Link href={homeHref} style={{ fontFamily: "var(--font-sans)", fontSize: "12px", color: "var(--text-muted)", textDecoration: "none" }}>{t.back}</Link>
        <span style={{ ...display, fontSize: "16px", fontWeight: 700, letterSpacing: "-0.01em" }}>{t.title}</span>
        <span style={{ width: 70 }} />
      </div>

      <div style={{ flex: 1, display: "flex", gap: "10px", minHeight: 0 }}>
        {/* scéna */}
        <div style={{ flex: 1, position: "relative", minHeight: 0, ...card, overflow: "hidden", padding: 0 }}>
          <canvas ref={canvasRef} onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerLeave={onUp}
            style={{ width: "100%", height: "100%", display: "block", touchAction: "none", cursor: "crosshair" }} />

          <div style={{ position: "absolute", top: 12, left: 12, display: "flex", gap: 8, alignItems: "stretch" }}>
            <button onClick={toggleMute} aria-label={muted ? t.unmute : t.mute} title={muted ? t.unmute : t.mute}
              style={{ width: 40, borderRadius: 12, border: `2.5px solid ${INK}`, background: "#fff", boxShadow: `3px 3px 0 ${INK}`, cursor: "pointer", fontSize: 16, lineHeight: 1 }}>{muted ? "🔇" : "🔊"}</button>
            <div style={{ display: "flex", alignItems: "center", gap: 4, background: "#fff", border: `2.5px solid ${INK}`, boxShadow: `3px 3px 0 ${INK}`, borderRadius: 12, padding: "4px 6px" }}>
              <button onClick={() => setLevelIdx((i) => Math.max(0, i - 1))} disabled={levelIdx === 0} style={{ width: 24, height: 24, borderRadius: 7, border: "none", background: levelIdx === 0 ? "rgba(0,0,0,0.06)" : INK, color: levelIdx === 0 ? "var(--text-muted)" : "#fff", cursor: levelIdx === 0 ? "default" : "pointer", fontSize: 14 }}>‹</button>
              <div style={{ minWidth: 124, textAlign: "center" }}>
                <div style={{ ...display, fontWeight: 700, fontSize: 13, lineHeight: 1.1, color: INK }}>{level.name[lang]}</div>
                <div style={{ fontFamily: "var(--font-sans)", fontSize: 9, color: "var(--text-muted)" }}>{levelIdx + 1} / {LEVELS.length} · {level.source[lang]}</div>
              </div>
              <button onClick={() => setLevelIdx((i) => Math.min(LEVELS.length - 1, i + 1))} disabled={levelIdx === LEVELS.length - 1} style={{ width: 24, height: 24, borderRadius: 7, border: "none", background: levelIdx === LEVELS.length - 1 ? "rgba(0,0,0,0.06)" : INK, color: levelIdx === LEVELS.length - 1 ? "var(--text-muted)" : "#fff", cursor: levelIdx === LEVELS.length - 1 ? "default" : "pointer", fontSize: 14 }}>›</button>
            </div>
          </div>

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

        {/* pravý panel: shrnutí levelu + nástroje */}
        <div style={{ width: 290, flexShrink: 0, display: "flex", flexDirection: "column", gap: "10px", minHeight: 0 }}>
          <div style={{ ...card, padding: "12px 14px" }}>
            <p style={{ fontFamily: "var(--font-sans)", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-muted)", marginBottom: "4px" }}>{t.level} · {level.name[lang]}</p>
            <p style={{ fontFamily: "var(--font-sans)", fontSize: "11px", color: "var(--text-secondary)", marginBottom: "2px" }}>{t.sourceLbl}: {level.source[lang]} · <strong>{level.sourceDb} dB</strong></p>
            <p style={{ fontFamily: "var(--font-sans)", fontSize: "11px", color: "var(--text-secondary)", marginBottom: "8px" }}>{t.distance}: {distMeters(level)} m</p>
            <p style={{ fontFamily: "var(--font-sans)", fontSize: "12px", marginBottom: "6px" }}>{t.inTarget} ({level.target[lang]}): <strong style={{ color: meters.warming ? "var(--text-muted)" : okDb ? "#16A34A" : "#dc2626" }}>{meters.warming ? "…" : `${Math.round(meters.cityDb)} dB`}</strong> <span style={{ color: "var(--text-muted)" }}>/ {t.limitWord} {level.limitDb}</span></p>
            <div style={{ height: 10, background: "rgba(26,22,20,0.1)", border: `1.5px solid ${INK}`, borderRadius: "999px", position: "relative", overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${cityPct}%`, background: okDb ? "#16A34A" : "#dc2626" }} />
              <div style={{ position: "absolute", top: -2, bottom: -2, left: `${limPct}%`, width: 2.5, background: INK }} />
            </div>
            {level.audienceX != null && (
              <p style={{ fontFamily: "var(--font-sans)", fontSize: "12px", marginTop: "8px" }}>{t.audienceLbl}: <strong style={{ color: meters.warming ? "var(--text-muted)" : audOkUI ? "#16A34A" : "#dc2626" }}>{meters.warming ? "…" : `${Math.round(meters.audienceDb)} dB`}</strong> <span style={{ color: "var(--text-muted)" }}>/ {t.minWord} {level.audienceMinDb}</span></p>
            )}
            {started && !meters.warming && (
              <p style={{ fontFamily: "var(--font-sans)", fontSize: "11px", marginTop: "6px" }}>{t.barrier}: <strong style={{ color: reduction >= 0 ? "#16A34A" : "#dc2626" }}>{reduction >= 0 ? "−" : "+"}{Math.abs(Math.round(reduction))} dB</strong></p>
            )}
            <p style={{ fontFamily: "var(--font-sans)", fontSize: "10px", color: "var(--text-muted)", marginTop: "4px" }}>{t.budget}: {budgetUsed}/{level.budget}{budgetUsed >= level.budget ? ` · ${t.overBudget}` : ""}</p>
          </div>

          <div style={{ ...card, padding: "12px 14px", display: "flex", flexDirection: "column", gap: "10px", overflowY: "auto", minHeight: 0 }}>
            <div>
              <p style={{ fontFamily: "var(--font-sans)", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-muted)", marginBottom: "6px" }}>{t.tools}</p>
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                <button onClick={() => setTool("paint")} style={chip(tool === "paint")}>{t.paint}</button>
                <button onClick={() => setTool("erase")} style={chip(tool === "erase")}>{t.erase}</button>
                <button onClick={resetBuild} style={chip(false)}>{t.reset}</button>
              </div>
            </div>
            <div>
              <p style={{ fontFamily: "var(--font-sans)", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-muted)", marginBottom: "6px" }}>{t.material}</p>
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                {mats.map((m) => (
                  <button key={m.id} onClick={() => { setMaterial(m.id); setTool("paint"); }} style={{ ...chip(material === m.id), display: "inline-flex", alignItems: "center", gap: "6px" }}>
                    <span style={{ width: 11, height: 11, borderRadius: 3, background: m.color, border: `1px solid ${INK}` }} />{m.name[lang]} <strong>−{m.db} dB/m³</strong> <span style={{ opacity: 0.55 }}>·{m.cost}</span>
                  </button>
                ))}
              </div>
            </div>
            <p style={{ fontFamily: "var(--font-sans)", fontSize: "11px", color: "var(--text-muted)", lineHeight: 1.5 }}>{t.tip}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

