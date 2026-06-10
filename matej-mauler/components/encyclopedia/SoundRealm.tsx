"use client";

import { useEffect, useRef, useState } from "react";
import type { NodeDef, SoundSceneDef } from "@/lib/encyclopedia/types";
import type { Lang } from "@/lib/dictionaries";
import type { Theme } from "./Shell";

const INK = "#1a1614";
type Medium = "air" | "water" | "solid" | "space";

type Voice = { id: string; cs: string; en: string; h?: number[] };
const VOICES: Voice[] = [
  { id: "sine", cs: "čistý", en: "pure" },
  { id: "triangle", cs: "jemný", en: "soft" },
  { id: "flute", cs: "flétna", en: "flute", h: [1, 0.15, 0.05] },
  { id: "violin", cs: "housle", en: "violin", h: [1, 0.7, 0.55, 0.4, 0.32, 0.26, 0.2, 0.15, 0.12, 0.08] },
  { id: "piano", cs: "klavír", en: "piano", h: [1, 0.55, 0.32, 0.2, 0.13, 0.08, 0.05, 0.03] },
  { id: "saw", cs: "ostrý", en: "sharp" },
  { id: "square", cs: "drsný", en: "buzzy" },
  { id: "pad", cs: "pad", en: "pad", h: [1, 0, 0.5, 0, 0.25, 0, 0.12] },
];
const voiceOf = (id: string) => VOICES.find((v) => v.id === id);
// Pásma v „Barvě zvuku": tóny (drone) + reálné údery (hit)
const COLOR: { id: string; cs: string; en: string; hit: boolean }[] = [
  { id: "sine", cs: "čistý", en: "pure", hit: false },
  { id: "triangle", cs: "jemný", en: "soft", hit: false },
  { id: "piano", cs: "klavír", en: "piano", hit: true },
  { id: "knock", cs: "šťouchnutí", en: "knock", hit: true },
  { id: "stone", cs: "kámen", en: "stone", hit: true },
];
const HIT_IDS = new Set(["piano", "knock", "stone"]);

const MED: Record<Medium, { top: number[]; bot: number[]; speed: number; dot: number[]; filt: number; ms: string }> = {
  air: { top: [250, 250, 247], bot: [238, 243, 251], speed: 1, dot: [26, 22, 20], filt: 18000, ms: "~340 m/s" },
  water: { top: [201, 227, 255], bot: [86, 158, 214], speed: 2.4, dot: [11, 71, 130], filt: 340, ms: "~1480 m/s" },
  solid: { top: [240, 228, 206], bot: [191, 162, 116], speed: 4.6, dot: [92, 58, 16], filt: 7000, ms: "~5100 m/s" },
  space: { top: [5, 6, 15], bot: [5, 6, 15], speed: 0, dot: [200, 205, 230], filt: 8000, ms: "" },
};

// Tmavé varianty prostředí (theme dark) — rychlosti a filtry stejné, jen barvy
const MED_DARK: typeof MED = {
  air: { top: [26, 28, 38], bot: [14, 16, 25], speed: 1, dot: [226, 223, 218], filt: 18000, ms: "~340 m/s" },
  water: { top: [14, 40, 72], bot: [8, 22, 44], speed: 2.4, dot: [125, 185, 240], filt: 340, ms: "~1480 m/s" },
  solid: { top: [52, 40, 24], bot: [28, 22, 13], speed: 4.6, dot: [228, 188, 132], filt: 7000, ms: "~5100 m/s" },
  space: { top: [5, 6, 15], bot: [5, 6, 15], speed: 0, dot: [200, 205, 230], filt: 8000, ms: "" },
};

// Klikatelná pásma prostředí → hesla (synapse = samotný popisek pásma)
const ZONE_SLUG: Record<"air" | "water" | "solid", string> = { air: "vzduch", water: "voda", solid: "zelezo" };

const UI = {
  cs: { audio: "🔊 Zapnout zvuk", mute: "Ztlumit", unmute: "Zvuk", coach: "👂 Zaparkuj ucho (kurzor) na vlnu", hintFreq: "← basa · výška →", hintAmp: "blíž ke středu = hlasitěji", hintZone: "👂 přejížděj uchem po pásmech", media: { air: "vzduch", water: "voda", solid: "železo" }, tracerNote: "jen se kývu na místě", drawnAs: "takhle se zvuk obvykle kreslí", reallyAs: "takhle se doopravdy chová", silence: "— ticho —" },
  en: { audio: "🔊 Turn sound on", mute: "Mute", unmute: "Sound", coach: "👂 Park your ear (cursor) on the wave", hintFreq: "← bass · treble →", hintAmp: "closer to center = louder", hintZone: "👂 glide your ear across the bands", media: { air: "air", water: "water", solid: "iron" }, tracerNote: "I just bob in place", drawnAs: "how sound is usually drawn", reallyAs: "how it actually behaves", silence: "— silence —" },
} as const;

const NOTE = ["C", "C♯", "D", "D♯", "E", "F", "F♯", "G", "G♯", "A", "A♯", "B"];
const noteName = (f: number) => { const m = Math.round(69 + 12 * Math.log2(f / 440)); return NOTE[((m % 12) + 12) % 12] + (Math.floor(m / 12) - 1); };

/** Zvukový realm: společný canvas + WebAudio přes všechna zvuková hesla.
    Komponenta zůstává namountovaná, scény do sebe plynule morfují. */
export function SoundRealm({ node, lang, theme, onNavigate }: { node: NodeDef; lang: Lang; theme: Theme; onNavigate: (slug: string) => void }) {
  const u = UI[lang];
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [audioOn, setAudioOn] = useState(false);
  const [muted, setMuted] = useState(false);
  const [coachDone, setCoachDone] = useState(false);

  const userFreq = useRef(220);
  const userGain = useRef(0.5);
  const userVoice = useRef("sine");

  const ac = useRef<AudioContext | null>(null);
  const osc = useRef<OscillatorNode | null>(null);
  const level = useRef<GainNode | null>(null);
  const filt = useRef<BiquadFilterNode | null>(null);
  const master = useRef<GainNode | null>(null);
  const echoSend = useRef<GainNode | null>(null);
  const echoFb = useRef<GainNode | null>(null);
  const revWet = useRef<GainNode | null>(null);
  const lastVoice = useRef("sine");
  const pointer = useRef({ x: 0, y: 0, active: false });
  const everOn = useRef(false);
  const hitTimer = useRef(0);
  const hitEnv = useRef(0);

  // aktuální scéna + navigace pro smyčku a click handler (bez restartu enginu)
  const secRef = useRef<SoundSceneDef>(node.sound!);
  const slugRef = useRef(node.slug);
  const navRef = useRef(onNavigate);
  const themeRef = useRef<Theme>(theme);
  useEffect(() => { secRef.current = node.sound!; slugRef.current = node.slug; navRef.current = onNavigate; themeRef.current = theme; }, [node, onNavigate, theme]);

  const applyVoice = (id: string) => { const o = osc.current, a = ac.current; if (!o || !a) return; const v = voiceOf(id); if (v?.h) { const imag = new Float32Array(v.h.length + 1), real = new Float32Array(v.h.length + 1); v.h.forEach((x, k) => (imag[k + 1] = x)); o.setPeriodicWave(a.createPeriodicWave(real, imag)); } else o.type = (id === "saw" ? "sawtooth" : id) as OscillatorType; };

  const start = () => {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const a = new AC(); ac.current = a;
    const o = a.createOscillator(); o.frequency.value = userFreq.current * secRef.current.freqMul;
    const f = a.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = 18000;
    const lv = a.createGain(); lv.gain.value = 0;
    const ms = a.createGain(); ms.gain.value = muted ? 0 : 1;
    const conv = a.createConvolver(); const len = (a.sampleRate * 1.4) | 0; const buf = a.createBuffer(2, len, a.sampleRate);
    for (let ch = 0; ch < 2; ch++) { const d = buf.getChannelData(ch); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.2); }
    conv.buffer = buf; const wet = a.createGain(); wet.gain.value = 0.2;
    const dly = a.createDelay(1.0); dly.delayTime.value = 0.3; const fb = a.createGain(); fb.gain.value = 0.42; const es = a.createGain(); es.gain.value = 0; const eo = a.createGain(); eo.gain.value = 0.6;
    o.connect(f).connect(lv);
    lv.connect(ms); lv.connect(conv).connect(wet).connect(ms);
    lv.connect(es); es.connect(dly); dly.connect(fb); fb.connect(dly); dly.connect(eo).connect(ms);
    ms.connect(a.destination);
    osc.current = o; level.current = lv; filt.current = f; master.current = ms; echoSend.current = es; echoFb.current = fb; revWet.current = wet;
    applyVoice(userVoice.current); lastVoice.current = userVoice.current; o.start();
    setAudioOn(true);
  };
  const toggleMute = () => setMuted((m) => { const nm = !m; if (master.current && ac.current) master.current.gain.setTargetAtTime(nm ? 0 : 1, ac.current.currentTime, 0.03); return nm; });
  useEffect(() => () => { try { osc.current?.stop(); ac.current?.close(); } catch {} }, []);

  useEffect(() => {
    const cv = canvasRef.current; if (!cv) return; const ctx = cv.getContext("2d"); if (!ctx) return;
    const uu = UI[lang];
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const coarse = typeof matchMedia !== "undefined" && matchMedia("(hover: none)").matches;
    const resize = () => { cv.width = innerWidth * dpr; cv.height = innerHeight * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); };
    resize(); addEventListener("resize", resize);
    const onMove = (e: PointerEvent) => { pointer.current = { x: e.clientX, y: e.clientY, active: true }; };
    const onLeave = () => { pointer.current.active = false; };
    cv.addEventListener("pointermove", onMove); cv.addEventListener("pointerleave", onLeave);

    type Zone = { x0: number; x1: number; voice: string; medium: Medium; label: string; sub: string };
    const zonesFor = (s: SoundSceneDef, x0p: number, ww: number): Zone[] => {
      if (s.interactive === "medium") { const ms = ["air", "water", "solid"] as const; return ms.map((m, i) => ({ x0: x0p + (i * ww) / 3, x1: x0p + ((i + 1) * ww) / 3, voice: userVoice.current, medium: m, label: uu.media[m], sub: MED[m].ms })); }
      if (s.interactive === "wave") { const n = COLOR.length; return COLOR.map((c, i) => ({ x0: x0p + (i * ww) / n, x1: x0p + ((i + 1) * ww) / n, voice: c.id, medium: s.medium, label: c[lang], sub: "" })); }
      return [{ x0: x0p, x1: x0p + ww, voice: userVoice.current, medium: s.medium, label: "", sub: "" }];
    };

    // geometrie posledního framu pro klikání na popisky pásem (synapse)
    const geom = { zones: [] as Zone[], labelTop: 0, labelBot: 0, interactive: "" as string };
    const onClick = (e: MouseEvent) => {
      if (geom.interactive !== "medium") return;
      if (e.clientY < geom.labelTop - 8 || e.clientY > geom.labelBot + 6) return;
      const z = geom.zones.find((zz) => e.clientX >= zz.x0 && e.clientX < zz.x1);
      if (z && z.medium !== "space") navRef.current(ZONE_SLUG[z.medium as "air" | "water" | "solid"]);
    };
    cv.addEventListener("click", onClick);

    const cur = { freq: 132, level: 0, filter: 18000, rows: 1, top: [...MED.air.top], bot: [...MED.air.bot], speedF: 1, space: 0, fade: 0 };
    let phase = 0, raf = 0, lastSlug = "";
    const stars = Array.from({ length: 70 }, () => ({ x: Math.random(), y: Math.random(), r: Math.random() * 1.3 + 0.3 }));
    const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
    const lerpArr = (a: number[], b: number[], k: number) => a.forEach((_, i) => (a[i] = lerp(a[i], b[i], k)));
    const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

    const loop = () => {
      const s = secRef.current; const mode = s.mode ?? "flow";
      const dk = themeRef.current === "dark";
      const MEDX = dk ? MED_DARK : MED;
      const ink = dk ? "#ece9e4" : INK;
      if (slugRef.current !== lastSlug) { lastSlug = slugRef.current; cur.fade = 0; }

      const w = innerWidth, h = innerHeight, mid = h * 0.6;
      const rowsN = Math.max(1, Math.round(cur.rows));
      const rowGap = Math.min(34, (h * 0.34) / rowsN);
      const half = rowGap * rowsN * 0.6 + 16;
      const R = Math.min(w, h) * 0.42;
      const padX = Math.max(64, w * 0.06), spkX = padX, fieldX0 = padX + 46, fieldX1 = w - padX, FW = Math.max(80, fieldX1 - fieldX0);
      const zones = zonesFor(s, fieldX0, FW); const multi = zones.length > 1; const lastZone = zones[zones.length - 1];
      geom.zones = zones; geom.labelTop = mid - half - 34; geom.labelBot = mid - half; geom.interactive = s.interactive ?? "";

      const pt = coarse ? { x: w / 2, y: mid, active: true } : pointer.current;
      const onBand = pt.active && (mode === "disk" ? Math.hypot(pt.x - w / 2, pt.y - mid) < R : ((mode === "compare" ? Math.abs(pt.y - mid) < 110 : Math.abs(pt.y - mid) < half + 22) && pt.x >= fieldX0 - 8 && pt.x <= fieldX1 + 8));
      if (onBand && !everOn.current) { everOn.current = true; setCoachDone(true); }
      const az: Zone | null = onBand ? (zones.find((z) => pt.x >= z.x0 && pt.x < z.x1) ?? lastZone) : null;
      const azHit = s.interactive === "wave" && !!az && HIT_IDS.has(az.voice);
      const voiceEff = az && !HIT_IDS.has(az.voice) ? az.voice : userVoice.current;
      if (az && s.interactive === "wave" && !azHit) userVoice.current = az.voice; // jen tóny se nesou dál

      // výška podle X
      if (s.interactive === "freq" && onBand && !coarse) userFreq.current = clamp(80 * Math.pow(10, (pt.x - fieldX0) / FW), 60, 900);
      // hlasitost podle blízkosti ke středu pásma
      let loud = userGain.current;
      if (s.interactive === "amp") { if (onBand && !coarse) { loud = 0.05 + clamp(1 - Math.abs(pt.y - mid) / half, 0, 1) * 0.95; userGain.current = loud; } else loud = userGain.current; }
      const gainBase = s.interactive === "amp" ? loud : s.interactive === "wave" ? 0.5 : userGain.current; // barva: hlasitost na normál
      const filterEff = multi && az ? MEDX[az.medium].filt : s.filter;
      const tintMed: Medium = multi ? "air" : s.medium;

      cur.freq = lerp(cur.freq, userFreq.current * s.freqMul, 0.08);
      cur.filter = lerp(cur.filter, filterEff, 0.08);
      cur.rows = lerp(cur.rows, s.rows, 0.1);
      cur.fade = lerp(cur.fade, 1, 0.1);
      lerpArr(cur.top, MEDX[tintMed].top, 0.06); lerpArr(cur.bot, MEDX[tintMed].bot, 0.06);
      cur.speedF = lerp(cur.speedF, MEDX[tintMed].speed, 0.06);
      cur.space = lerp(cur.space, tintMed === "space" ? 1 : 0, 0.05);
      cur.level = lerp(cur.level, azHit ? 0 : (onBand ? gainBase * s.gainMul : 0), 0.14); // u úderů drone ztiš

      if (osc.current && level.current && filt.current && ac.current) {
        const now = ac.current.currentTime;
        osc.current.frequency.setTargetAtTime(cur.freq, now, 0.05);
        level.current.gain.setTargetAtTime(cur.level * 0.16, now, 0.05);
        filt.current.frequency.setTargetAtTime(cur.filter, now, 0.08);
        echoSend.current?.gain.setTargetAtTime(mode === "reflect" ? 1 : 0, now, 0.12);
        echoFb.current?.gain.setTargetAtTime(mode === "reflect" ? 0.62 : 0.42, now, 0.2);
        revWet.current?.gain.setTargetAtTime(mode === "reflect" ? 0.6 : 0.2, now, 0.2);
        if (voiceEff !== lastVoice.current) { applyVoice(voiceEff); lastVoice.current = voiceEff; }
      }
      // reálné údery (piano/šťouchnutí/kámen) — opakovaně, dokud je ucho na pásmu
      if (azHit && onBand && ac.current && master.current) { const now = ac.current.currentTime; const iv = az!.voice === "piano" ? 0.8 : 0.62; if (now >= hitTimer.current) { triggerHit(ac.current, master.current, az!.voice, userFreq.current, now); hitTimer.current = now + iv; hitEnv.current = 1; } }
      else if (ac.current) hitTimer.current = ac.current.currentTime;
      hitEnv.current *= 0.86;

      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, `rgb(${cur.top.map(Math.round).join(",")})`); g.addColorStop(1, `rgb(${cur.bot.map(Math.round).join(",")})`);
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
      if (cur.space > 0.02) { ctx.fillStyle = "#fff"; for (const st of stars) { ctx.globalAlpha = cur.space * (0.35 + 0.5 * Math.sin(phase * 0.6 + st.x * 9)); ctx.beginPath(); ctx.arc(st.x * w, st.y * h, st.r, 0, 7); ctx.fill(); } ctx.globalAlpha = 1; }

      phase += (0.018 + cur.freq / 6500) * cur.speedF;
      const M = 70, spacing = FW / M, A = spacing * 1.3 * cur.level, K = clamp(cur.freq / 45, 1.2, 20) * Math.PI * 2;
      const wallX = fieldX0 + FW * 0.96;
      const pAlpha = (1 - cur.space) * cur.fade;
      const wv = (vid: string, t: number) => waveVal(vid, t);

      // vodítko, kde vlna „bydlí"
      if (mode !== "disk" && mode !== "compare" && cur.space < 0.3) { ctx.globalAlpha = (onBand ? 0.05 : 0.09) * cur.fade; ctx.fillStyle = ink; roundRect(ctx, fieldX0, mid - half, FW, half * 2, half); ctx.fill(); ctx.globalAlpha = 1; }

      if (multi) {
        ctx.textAlign = "center";
        const clickable = s.interactive === "medium";
        for (const z of zones) {
          const active = az === z;
          ctx.globalAlpha = (active ? 0.12 : 0.04) * cur.fade; ctx.fillStyle = `rgb(${MEDX[z.medium].dot.join(",")})`; ctx.fillRect(z.x0, mid - half - 30, z.x1 - z.x0, half * 2 + 60);
          ctx.globalAlpha = 0.16 * cur.fade; ctx.strokeStyle = ink; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(z.x1, mid - half - 30); ctx.lineTo(z.x1, mid + half + 30); ctx.stroke();
          ctx.globalAlpha = (active ? 1 : 0.5) * cur.fade; ctx.fillStyle = ink; ctx.font = "700 13px system-ui";
          const lbl = clickable ? z.label + " ↗" : z.label;
          ctx.fillText(lbl, (z.x0 + z.x1) / 2, mid - half - 16);
          if (clickable) { const tw = ctx.measureText(lbl).width; ctx.globalAlpha = (active ? 0.7 : 0.3) * cur.fade; ctx.beginPath(); ctx.moveTo((z.x0 + z.x1) / 2 - tw / 2, mid - half - 12); ctx.lineTo((z.x0 + z.x1) / 2 + tw / 2, mid - half - 12); ctx.lineWidth = 1; ctx.stroke(); }
          if (z.sub) { ctx.globalAlpha = (active ? 0.8 : 0.4) * cur.fade; ctx.font = "600 11px system-ui"; ctx.fillText(z.sub, (z.x0 + z.x1) / 2, mid - half - 2); }
        }
        ctx.globalAlpha = 1;
      }

      if (mode === "compare") {
        const topY = mid - 64, botY = mid + 48;
        // nahoře: klasická oscilační (čárová) vlna
        ctx.globalAlpha = pAlpha; ctx.strokeStyle = ink; ctx.lineWidth = 2.6; ctx.beginPath();
        for (let i = 0; i <= 140; i++) { const xx = fieldX0 + (i / 140) * FW, nx2 = i / 140; const yy = topY + Math.sin(nx2 * K - phase) * 30; if (i === 0) ctx.moveTo(xx, yy); else ctx.lineTo(xx, yy); }
        ctx.stroke();
        // dole: skutečná podélná částicová vlna (1 řada)
        const Mc = 70, sp = FW / Mc, Ac = sp * 1.3 * Math.max(cur.level, 0.4);
        const xs2: number[] = new Array(Mc);
        for (let i = 0; i < Mc; i++) { const bx = fieldX0 + (i + 0.5) * sp; xs2[i] = bx + Ac * Math.sin(((bx - fieldX0) / FW) * K - phase); }
        for (let i = 0; i < Mc; i++) { const comp = i > 0 ? clamp(1 - (xs2[i] - xs2[i - 1]) / sp, 0, 1) : 0; ctx.globalAlpha = pAlpha * (0.4 + comp * 0.5); ctx.fillStyle = ink; ctx.beginPath(); ctx.arc(xs2[i], botY, 2 + comp * 1.7, 0, 7); ctx.fill(); }
        // popisky
        ctx.globalAlpha = pAlpha * 0.7; ctx.fillStyle = ink; ctx.font = "700 12px system-ui"; ctx.textAlign = "left";
        ctx.fillText("↑ " + uu.drawnAs, fieldX0, topY - 34); ctx.fillText("↓ " + uu.reallyAs, fieldX0, botY + 40);
        ctx.globalAlpha = 1;
      } else if (mode === "disk") {
        const cxp = w / 2, cyp = mid, gap = 30, Kd = K * 0.5;
        for (let gy = cyp - R; gy <= cyp + R; gy += gap) for (let gx = cxp - R; gx <= cxp + R; gx += gap) {
          const dx0 = gx - cxp, dy0 = gy - cyp, r = Math.hypot(dx0, dy0); if (r > R || r < gap * 0.5) continue;
          const ang = Math.atan2(dy0, dx0); const disp = A * wv(userVoice.current, (r / w) * Kd - phase);
          const disp2 = A * wv(userVoice.current, ((r + gap) / w) * Kd - phase); const comp = clamp(1 - (gap + disp2 - disp) / gap, 0, 1);
          ctx.globalAlpha = pAlpha * (0.35 + comp * 0.5) * (1 - (r / R) * 0.5); ctx.fillStyle = `rgb(${MEDX.air.dot.join(",")})`;
          ctx.beginPath(); ctx.arc(gx + Math.cos(ang) * disp, gy + Math.sin(ang) * disp, 2 + comp * 1.7, 0, 7); ctx.fill();
        }
        ctx.globalAlpha = pAlpha * 0.9; ctx.fillStyle = "#e23b3b"; const pr = 7 + (0.5 + 0.5 * Math.sin(phase * 2)) * (2 + cur.level * 6); ctx.beginPath(); ctx.arc(cxp, cyp, pr, 0, 7); ctx.fill(); ctx.globalAlpha = 1;
      } else {
        if (cur.space < 0.5) { ctx.globalAlpha = pAlpha; drawSpeaker(ctx, spkX, mid, half * 0.82, phase, cur.level); ctx.globalAlpha = 1; }
        if (mode === "reflect") { ctx.globalAlpha = cur.fade * 0.9; ctx.strokeStyle = ink; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(wallX, mid - half); ctx.lineTo(wallX, mid + half); ctx.stroke(); }
        ctx.globalAlpha = 1;

        let trX = 0;
        for (let r = 0; r < rowsN; r++) {
          const y0 = mid + (r - (rowsN - 1) / 2) * rowGap;
          const xs: number[] = new Array(M), dc: string[] = new Array(M); const ys: number[] = new Array(M);
          for (let i = 0; i < M; i++) {
            const bx = fieldX0 + (i + 0.5) * spacing; const nx = (bx - fieldX0) / FW;
            const z = multi ? (zones.find((zz) => bx >= zz.x0 && bx < zz.x1) ?? lastZone) : zones[0];
            dc[i] = `rgb(${MEDX[z.medium].dot.join(",")})`;
            const kz = s.interactive === "medium" ? K / MEDX[z.medium].speed : K; // λ ∝ rychlost: v hutnějším delší vlna + rychlejší šíření, výška stejná
            let val: number;
            if (mode === "reflect") val = bx < wallX ? (wv(z.voice, nx * K - phase) + wv(z.voice, ((2 * wallX - bx - fieldX0) / FW) * K - phase)) * 0.5 : 0;
            else val = wv(z.voice, nx * kz - phase);
            let aCol = A;
            if (s.interactive === "wave") { const active = z === az; const zHit = HIT_IDS.has(z.voice); aCol = spacing * 0.95 * (active ? (zHit ? 0.2 + hitEnv.current * 1.6 : 1) : 0.5); }
            xs[i] = bx + aCol * val; ys[i] = y0;
          }
          for (let i = 0; i < M; i++) {
            const comp = i > 0 ? clamp(1 - (xs[i] - xs[i - 1]) / spacing, 0, 1) : 0;
            const tracer = !multi && i % 12 === 6;
            const big = tracer && s.tracer;
            if (tracer) { ctx.globalAlpha = pAlpha * 0.3; ctx.strokeStyle = "rgba(46,125,50,0.6)"; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc((i + 0.5) * spacing, y0, big ? 6 : 4, 0, 7); ctx.stroke(); }
            ctx.globalAlpha = pAlpha * (0.4 + comp * 0.5); ctx.fillStyle = tracer ? "#2e7d32" : dc[i];
            ctx.beginPath(); ctx.arc(xs[i], ys[i], (big ? 3 : 2) + comp * 1.7, 0, 7); ctx.fill();
            if (big && r === Math.floor(rowsN / 2) && i === 6) trX = xs[i];
          }
        }
        if (s.tracer && trX) { ctx.globalAlpha = pAlpha; ctx.fillStyle = "#2e7d32"; ctx.font = "700 12px system-ui"; ctx.textAlign = "left"; ctx.fillText("← " + uu.tracerNote, trX + 12, mid); ctx.globalAlpha = 1; }
      }

      // Hz · nota u výšky
      if (s.interactive === "freq" && onBand && !coarse) { ctx.globalAlpha = pAlpha; ctx.fillStyle = ink; ctx.font = "700 15px system-ui"; ctx.textAlign = "center"; ctx.fillText(`${Math.round(cur.freq)} Hz · ${noteName(cur.freq)}`, pt.x, mid - half - 14); ctx.globalAlpha = 1; }

      // ucho na kurzoru
      if (!coarse && pt.active) {
        ctx.save(); ctx.translate(pt.x, pt.y);
        ctx.globalAlpha = onBand ? 0.95 : 0.4; ctx.lineWidth = 2.5; ctx.strokeStyle = ink; ctx.fillStyle = dk ? (onBand ? "rgba(14,16,26,0.9)" : "rgba(14,16,26,0.5)") : (onBand ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.5)");
        ctx.beginPath(); ctx.arc(0, 0, 16, 0, 7); ctx.fill(); ctx.stroke();
        ctx.beginPath(); ctx.arc(2, -1, 8, -1.1, 2.4); ctx.stroke();
        ctx.beginPath(); ctx.arc(0, 4, 2.4, 0, 7); ctx.fillStyle = ink; ctx.fill();
        ctx.restore(); ctx.globalAlpha = 1;
      }

      if (cur.space > 0.4) { ctx.fillStyle = `rgba(255,255,255,${cur.space * 0.6})`; ctx.font = "700 14px system-ui"; ctx.textAlign = "center"; ctx.fillText(uu.silence, w / 2, mid - half - 12); }
      raf = requestAnimationFrame(loop);
    };
    loop();
    return () => { cancelAnimationFrame(raf); removeEventListener("resize", resize); cv.removeEventListener("pointermove", onMove); cv.removeEventListener("pointerleave", onLeave); cv.removeEventListener("click", onClick); };
  }, [lang]);

  const sec = node.sound!;
  const dark = theme === "dark" || sec.medium === "space";
  const ctrlColor = dark ? "#fff" : INK;
  const hint = sec.interactive === "freq" ? u.hintFreq : sec.interactive === "amp" ? u.hintAmp : (sec.interactive === "medium" || sec.interactive === "wave") ? u.hintZone : null;

  return (
    <div style={{ position: "fixed", inset: 0, overflow: "hidden" }}>
      <canvas ref={canvasRef} style={{ width: "100%", height: "100%", display: "block", cursor: "none" }} />

      {/* zapnutí zvuku / mute */}
      {!audioOn ? (
        <button onClick={start}
          style={{ position: "fixed", bottom: 18, left: 18, zIndex: 22, background: ctrlColor, color: dark ? INK : "#fff", border: "none", borderRadius: 999, padding: "10px 20px", fontFamily: "var(--font-sans)", fontSize: 13, fontWeight: 700, cursor: "pointer", boxShadow: "0 6px 20px rgba(0,0,0,0.18)", animation: "encySndFloat 3s ease-in-out infinite" }}>
          {u.audio}
        </button>
      ) : (
        <button onClick={toggleMute} aria-label={muted ? u.unmute : u.mute} title={muted ? u.unmute : u.mute}
          style={{ position: "fixed", bottom: 18, left: 18, zIndex: 22, width: 42, height: 42, borderRadius: 12, border: `2.5px solid ${ctrlColor}`, background: dark ? "rgba(8,10,24,0.5)" : "#fff", color: ctrlColor, boxShadow: dark ? "none" : `3px 3px 0 ${INK}`, cursor: "pointer", fontSize: 16 }}>{muted ? "🔇" : "🔊"}</button>
      )}

      {/* nápověda pod hřištěm */}
      {(!coachDone || hint) && (
        <div style={{ position: "fixed", left: 0, right: 0, top: "calc(60% + 118px)", zIndex: 6, textAlign: "center", pointerEvents: "none", fontFamily: "var(--font-sans)", fontSize: 13, fontWeight: 700, color: dark ? "rgba(255,255,255,0.6)" : "var(--text-secondary)", animation: !coachDone ? "encySndBob 1.6s ease-in-out infinite" : "none" }}>
        {!coachDone ? `↑ ${u.coach}` : hint}
        </div>
      )}

      <style>{`
        @keyframes encySndBob { 0%,100%{ transform: translateY(0);} 50%{ transform: translateY(6px);} }
        @keyframes encySndFloat { 0%,100% { margin-top: -2px; } 50% { margin-top: 2px; } }
        @keyframes encySndIn { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
    </div>
  );
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) { const rr = Math.min(r, h / 2, w / 2); ctx.beginPath(); ctx.moveTo(x + rr, y); ctx.arcTo(x + w, y, x + w, y + h, rr); ctx.arcTo(x + w, y + h, x, y + h, rr); ctx.arcTo(x, y + h, x, y, rr); ctx.arcTo(x, y, x + w, y, rr); ctx.closePath(); }

// Animovaný zaoblený reproduktor = zdroj. Membrána pulzuje a tělo lehce vibruje.
function drawSpeaker(ctx: CanvasRenderingContext2D, x: number, mid: number, bh: number, t: number, amp: number) {
  const wob = Math.sin(t * 2) * (0.8 + amp * 3);
  const bulge = 5 + (0.5 + 0.5 * Math.sin(t * 2)) * (4 + amp * 14);
  ctx.save(); ctx.translate(x + wob, mid);
  ctx.fillStyle = "rgba(226,59,59,0.32)"; ctx.beginPath(); ctx.moveTo(6, -bh * 0.62); ctx.quadraticCurveTo(6 + bulge, 0, 6, bh * 0.62); ctx.closePath(); ctx.fill();
  ctx.fillStyle = "#e23b3b"; roundRect(ctx, -8, -bh, 16, bh * 2, 8); ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,0.35)"; roundRect(ctx, -4, -bh + 5, 4, bh * 2 - 10, 3); ctx.fill();
  ctx.restore();
}

function waveVal(voiceId: string, t: number): number {
  const x = ((t % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
  if (voiceId === "knock") return Math.exp(-Math.pow((x / (Math.PI * 2) - 0.5) * 6, 2)) * 2 - 0.35; // krátký pulz = ťuknutí
  if (voiceId === "stone") return (Math.sin(t) * Math.sin(t * 2.27 + 1) + Math.sin(t * 5.1) * 0.5) * 0.7; // nepravidelný klepot
  const v = voiceOf(voiceId);
  if (v?.h) { let s = 0, n = 0; for (let k = 0; k < v.h.length; k++) { s += v.h[k] * Math.sin((k + 1) * t); n += v.h[k]; } return s / (n || 1); }
  if (voiceId === "square") return Math.sin(t) >= 0 ? 1 : -1;
  if (voiceId === "saw") return x / Math.PI - 1;
  if (voiceId === "triangle") return x < Math.PI ? (x / Math.PI) * 2 - 1 : 3 - (x / Math.PI) * 2;
  return Math.sin(t);
}

function hitNoise(a: AudioContext, sec: number) { const L = (a.sampleRate * sec) | 0; const b = a.createBuffer(1, L, a.sampleRate); const d = b.getChannelData(0); for (let i = 0; i < L; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / L, 1.5); return b; }
function triggerHit(a: AudioContext, out: AudioNode, id: string, freq: number, t: number) { if (id === "piano") playPiano(a, out, freq, t); else if (id === "knock") playKnock(a, out, t); else playStone(a, out, t); }
function playPiano(a: AudioContext, out: AudioNode, freq: number, t: number) {
  const h = [1, 0.55, 0.32, 0.2, 0.13, 0.08, 0.05, 0.03]; const im = new Float32Array(h.length + 1), re = new Float32Array(h.length + 1); h.forEach((x, k) => (im[k + 1] = x));
  const o = a.createOscillator(); o.setPeriodicWave(a.createPeriodicWave(re, im)); o.frequency.value = freq;
  const lp = a.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.setValueAtTime(5200, t); lp.frequency.exponentialRampToValueAtTime(1100, t + 0.9);
  const g = a.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.5, t + 0.005); g.gain.exponentialRampToValueAtTime(0.001, t + 1.4);
  o.connect(lp).connect(g).connect(out); o.start(t); o.stop(t + 1.5);
  const s = a.createBufferSource(); s.buffer = hitNoise(a, 0.03); const hp = a.createBiquadFilter(); hp.type = "highpass"; hp.frequency.value = 2200; const ng = a.createGain(); ng.gain.setValueAtTime(0.14, t); ng.gain.exponentialRampToValueAtTime(0.001, t + 0.03); s.connect(hp).connect(ng).connect(out); s.start(t); s.stop(t + 0.04);
}
function playKnock(a: AudioContext, out: AudioNode, t: number) {
  const o = a.createOscillator(); o.type = "sine"; o.frequency.setValueAtTime(130, t); o.frequency.exponentialRampToValueAtTime(50, t + 0.08);
  const g = a.createGain(); g.gain.setValueAtTime(0.8, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.22); o.connect(g).connect(out); o.start(t); o.stop(t + 0.24);
  const s = a.createBufferSource(); s.buffer = hitNoise(a, 0.05); const lp = a.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 480; const ng = a.createGain(); ng.gain.setValueAtTime(0.4, t); ng.gain.exponentialRampToValueAtTime(0.001, t + 0.05); s.connect(lp).connect(ng).connect(out); s.start(t); s.stop(t + 0.06);
}
function playStone(a: AudioContext, out: AudioNode, t: number) {
  const s = a.createBufferSource(); s.buffer = hitNoise(a, 0.05); const bp = a.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = 2500; bp.Q.value = 1.3; const ng = a.createGain(); ng.gain.setValueAtTime(0.5, t); ng.gain.exponentialRampToValueAtTime(0.001, t + 0.06); s.connect(bp).connect(ng).connect(out); s.start(t); s.stop(t + 0.07);
  [1150, 1950, 3100].forEach((fr, i) => { const o = a.createOscillator(); o.type = "sine"; o.frequency.value = fr; const g = a.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.12 / (i + 1), t + 0.004); g.gain.exponentialRampToValueAtTime(0.001, t + 0.13); o.connect(g).connect(out); o.start(t); o.stop(t + 0.15); });
}
