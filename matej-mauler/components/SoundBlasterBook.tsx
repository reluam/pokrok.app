"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { Lang } from "@/lib/dictionaries";

const INK = "#1a1614";
const display: React.CSSProperties = { fontFamily: "var(--font-display)" };
type Medium = "air" | "water" | "solid" | "space";

type Voice = { id: string; cs: string; en: string; h?: number[] };
const VOICES: Voice[] = [
  { id: "sine", cs: "čistý", en: "pure" },
  { id: "saw", cs: "ostrý", en: "sharp" },
  { id: "square", cs: "drsný", en: "buzzy" },
  { id: "triangle", cs: "jemný", en: "soft" },
  { id: "flute", cs: "flétna", en: "flute", h: [1, 0.15, 0.05] },
  { id: "violin", cs: "housle", en: "violin", h: [1, 0.7, 0.55, 0.4, 0.32, 0.26, 0.2, 0.15, 0.12, 0.08] },
  { id: "piano", cs: "klavír", en: "piano", h: [1, 0.55, 0.32, 0.2, 0.13, 0.08, 0.05, 0.03] },
  { id: "pad", cs: "pad", en: "pad", h: [1, 0, 0.5, 0, 0.25, 0, 0.12] },
];
const voiceOf = (id: string) => VOICES.find((v) => v.id === id);

const MED: Record<Medium, { top: number[]; bot: number[]; speed: number; dot: number[]; filt: number }> = {
  air: { top: [250, 250, 247], bot: [238, 243, 251], speed: 1, dot: [26, 22, 20], filt: 18000 },
  water: { top: [207, 230, 255], bot: [127, 182, 224], speed: 1.5, dot: [13, 59, 102], filt: 600 },
  solid: { top: [239, 231, 218], bot: [203, 184, 154], speed: 2.6, dot: [70, 48, 22], filt: 4500 },
  space: { top: [5, 6, 15], bot: [5, 6, 15], speed: 0, dot: [200, 205, 230], filt: 8000 },
};

type Mode = "flow" | "disk" | "reflect";
type Sec = {
  cs: { t: string; p: string }; en: { t: string; p: string };
  freqMul: number; gainMul: number; filter: number; rows: number;
  medium: Medium; mode?: Mode; axis?: "long" | "trans"; interactive?: "freq" | "amp" | "medium" | "wave";
};

const SECTIONS: Sec[] = [
  { cs: { t: "Co je zvuk?", p: "Zvuk je chvění. Vlevo je zdroj — rozkmitá se a postrká vzduch. To šťouchnutí běží zleva doprava. Polož na vlnu ucho a uslyšíš ho." }, en: { t: "What is sound?", p: "Sound is shaking. On the left is the source — it vibrates and nudges the air. That nudge runs left to right. Put your ear on the wave to hear it." }, freqMul: 0.6, gainMul: 0.9, filter: 18000, rows: 1, medium: "air" },
  { cs: { t: "Vlna, ne voda", p: "Hodíš kamínek do vody a hladina se vlní nahoru a dolů. To je příčná vlna — body se hýbou napříč směru, kam vlna běží." }, en: { t: "A wave, not water", p: "Drop a pebble in water and the surface ripples up and down. That's a transverse wave — points move across the wave's direction." }, freqMul: 0.8, gainMul: 0.9, filter: 18000, rows: 5, medium: "water", axis: "trans" },
  { cs: { t: "Zvuk je podélný", p: "Zvuk se ale nevlní nahoru-dolů. Částice se kývou tam a zpět — podél směru letu. Sleduj zelené: jen se houpou na místě, vlna běží dál." }, en: { t: "Sound is longitudinal", p: "But sound doesn't ripple up and down. Particles swing back and forth — along the direction of travel. Watch the green ones: they bob in place, the wave moves on." }, freqMul: 0.8, gainMul: 0.9, filter: 18000, rows: 5, medium: "air" },
  { cs: { t: "Jde všemi směry", p: "Ze zdroje se zvuk šíří na všechny strany zároveň — kulové vlny, co pořád dokola hustí a řídnou vzduch kolem." }, en: { t: "It goes everywhere", p: "From the source, sound spreads in every direction at once — spheres of squeeze and spread, over and over." }, freqMul: 0.9, gainMul: 0.9, filter: 18000, rows: 7, medium: "air", mode: "disk" },
  { cs: { t: "Potřebuje médium", p: "Aby se vlna nesla, musí mít co strkat — vzduch, vodu, zeď. V dokonale prázdném prostoru není co rozhýbat." }, en: { t: "It needs a medium", p: "To travel, the wave needs something to push — air, water, a wall. In truly empty space there's nothing to move." }, freqMul: 0.9, gainMul: 0.9, filter: 18000, rows: 3, medium: "air" },
  { cs: { t: "Zkus různá prostředí", p: "Tři pásma vedle sebe: vzduch, voda, železo. Přejížděj uchem zleva doprava a slyš, jak se tentýž zvuk v každém z nich mění." }, en: { t: "Try different media", p: "Three bands side by side: air, water, iron. Glide your ear left to right and hear how the same sound changes in each." }, freqMul: 1, gainMul: 0.95, filter: 18000, rows: 5, medium: "air", interactive: "medium" },
  { cs: { t: "Výška = frekvence", p: "Jak hustě jdou komprese za sebou, taková je výška. Hustě = vysoko, řídce = basa. Zatáhni za posuvník — zůstane ti to po celou cestu." }, en: { t: "Pitch = frequency", p: "How tightly the squeezes follow each other sets the pitch. Tight = high, sparse = bass. Drag the slider — it stays with you all the way." }, freqMul: 1, gainMul: 0.9, filter: 18000, rows: 5, medium: "air", interactive: "freq" },
  { cs: { t: "Hlasitost = amplituda", p: "Jak daleko částice z místa vyrazí, tak je to hlasité. Velký rozkmit duní, malý šeptá. Zkus to — taky to zůstane." }, en: { t: "Loudness = amplitude", p: "How far the particles dart from their spot is how loud it is. A big swing booms, a small one whispers. Try it — this stays too." }, freqMul: 1, gainMul: 1, filter: 18000, rows: 5, medium: "air", interactive: "amp" },
  { cs: { t: "Barva zvuku", p: "Každé pásmo je jiný nástroj — od čistého tónu po housle a klavír. Přejížděj uchem a poslouchej, čím se liší. Co naposled posloucháš, to si neseš dál." }, en: { t: "The color of sound", p: "Each band is a different instrument — from a pure tone to violin and piano. Glide your ear across and hear how they differ. Whatever you hear last, you carry on." }, freqMul: 1, gainMul: 0.9, filter: 18000, rows: 7, medium: "air", interactive: "wave" },
  { cs: { t: "Odraz a ozvěna", p: "Když vlna narazí na zeď, odrazí se a vrací zpět. To je ozvěna. (Přesně na odrazech původně stála celá tahle hra.)" }, en: { t: "Reflection and echo", p: "When the wave hits a wall, it bounces back. That's an echo. (Reflections are what this whole thing was originally built on.)" }, freqMul: 0.9, gainMul: 0.95, filter: 9000, rows: 5, medium: "air", mode: "reflect" },
  { cs: { t: "Ve vesmíru ticho", p: "Ve vesmíru nejsou skoro žádné částice. Není co strkat — a tak je dokonalé ticho. Ucho sem dej, kam chceš, neuslyšíš nic." }, en: { t: "Silence in space", p: "Space has almost no particles. Nothing to push — so it's perfect silence. Put your ear anywhere here, you'll hear nothing." }, freqMul: 1, gainMul: 0, filter: 8000, rows: 3, medium: "space" },
  { cs: { t: "A to je celé", p: "Zvuk je rozhýbaný vzduch, co doběhne k uchu. Umíš mu měnit výšku, hlasitost i barvu, umíš ho odrazit i utišit. Teď ho slyšíš — i vidíš." }, en: { t: "That's all there is", p: "Sound is moved air reaching your ear. You can change its pitch, loudness and color, bounce it and quiet it. Now you hear it — and see it." }, freqMul: 1, gainMul: 0.95, filter: 18000, rows: 1, medium: "air" },
];

const UI = {
  cs: { back: "← Spaghetti.ltd", eyebrow: "Zvuková experience", title: "Cesta po zvukové vlně", start: "Start ▶", audio: "🔊 Zapni si zvuk. Tvůj kurzor je ucho — slyšíš jen to, co máš pod ním. Najeď na vlnu.", scroll: "scrolluj dolů", low: "basa", high: "výška", quiet: "tiše", loud: "nahlas", mute: "Ztlumit", unmute: "Zvuk", toMusic: "Pokračovat: jak vzniká hudba →", hintMove: "👂 najeď uchem na vlnu", media: { air: "vzduch", water: "voda", solid: "železo" } },
  en: { back: "← Spaghetti.ltd", eyebrow: "A sound experience", title: "A journey along a sound wave", start: "Start ▶", audio: "🔊 Turn your sound on. Your cursor is an ear — you only hear what's under it. Move onto the wave.", scroll: "scroll down", low: "bass", high: "treble", quiet: "soft", loud: "loud", mute: "Mute", unmute: "Sound", toMusic: "Next: how music is made →", hintMove: "👂 move your ear onto the wave", media: { air: "air", water: "water", solid: "iron" } },
} as const;

export function SoundBlasterBook({ lang }: { lang: Lang }) {
  const u = UI[lang]; const homeHref = lang === "cs" ? "/cs" : "/"; const N = SECTIONS.length;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [started, setStarted] = useState(false);
  const [muted, setMuted] = useState(false);
  const [step, setStep] = useState(0);

  const userFreq = useRef(220); const [freqUI, setFreqUI] = useState(220);
  const userGain = useRef(0.5); const [ampUI, setAmpUI] = useState(0.5);
  const userVoice = useRef("sine");

  const ac = useRef<AudioContext | null>(null);
  const osc = useRef<OscillatorNode | null>(null);
  const level = useRef<GainNode | null>(null);
  const filt = useRef<BiquadFilterNode | null>(null);
  const master = useRef<GainNode | null>(null);
  const lastVoice = useRef("sine");
  const pointer = useRef({ x: 0, y: 0, active: false });

  const applyVoice = (id: string) => { const o = osc.current, a = ac.current; if (!o || !a) return; const v = voiceOf(id); if (v?.h) { const imag = new Float32Array(v.h.length + 1), real = new Float32Array(v.h.length + 1); v.h.forEach((x, k) => (imag[k + 1] = x)); o.setPeriodicWave(a.createPeriodicWave(real, imag)); } else o.type = (id === "saw" ? "sawtooth" : id) as OscillatorType; };

  const start = () => {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const a = new AC(); ac.current = a;
    const o = a.createOscillator(); o.frequency.value = userFreq.current * SECTIONS[0].freqMul;
    const f = a.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = 18000;
    const lv = a.createGain(); lv.gain.value = 0;
    const ms = a.createGain(); ms.gain.value = muted ? 0 : 1;
    const conv = a.createConvolver(); const len = (a.sampleRate * 1.4) | 0; const buf = a.createBuffer(2, len, a.sampleRate);
    for (let ch = 0; ch < 2; ch++) { const d = buf.getChannelData(ch); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.2); }
    conv.buffer = buf; const wet = a.createGain(); wet.gain.value = 0.2;
    o.connect(f).connect(lv); lv.connect(ms); lv.connect(conv).connect(wet).connect(ms); ms.connect(a.destination);
    osc.current = o; level.current = lv; filt.current = f; master.current = ms;
    applyVoice(userVoice.current); lastVoice.current = userVoice.current; o.start();
    setStarted(true);
  };
  const toggleMute = () => setMuted((m) => { const nm = !m; if (master.current && ac.current) master.current.gain.setTargetAtTime(nm ? 0 : 1, ac.current.currentTime, 0.03); return nm; });
  useEffect(() => () => { try { osc.current?.stop(); ac.current?.close(); } catch {} }, []);

  useEffect(() => {
    const cv = canvasRef.current; if (!cv) return; const ctx = cv.getContext("2d"); if (!ctx) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const resize = () => { cv.width = innerWidth * dpr; cv.height = innerHeight * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); };
    resize(); addEventListener("resize", resize);
    const onMove = (e: PointerEvent) => { pointer.current = { x: e.clientX, y: e.clientY, active: true }; };
    const onLeave = () => { pointer.current.active = false; };
    cv.addEventListener("pointermove", onMove); cv.addEventListener("pointerleave", onLeave);

    type Zone = { x0: number; x1: number; voice: string; medium: Medium; label: string };
    const zonesFor = (s: Sec, w: number): Zone[] => {
      if (s.interactive === "medium") { const ms = ["air", "water", "solid"] as const; return ms.map((m, i) => ({ x0: (i * w) / 3, x1: ((i + 1) * w) / 3, voice: userVoice.current, medium: m, label: u.media[m] })); }
      if (s.interactive === "wave") { const n = VOICES.length; return VOICES.map((v, i) => ({ x0: (i * w) / n, x1: ((i + 1) * w) / n, voice: v.id, medium: s.medium, label: v[lang] })); }
      return [{ x0: 0, x1: w, voice: userVoice.current, medium: s.medium, label: "" }];
    };

    const cur = { freq: 132, level: 0, filter: 18000, rows: 1, top: [...MED.air.top], bot: [...MED.air.bot], speedF: 1, space: 0 };
    let phase = 0, raf = 0, lastStep = 0;
    const stars = Array.from({ length: 70 }, () => ({ x: Math.random(), y: Math.random(), r: Math.random() * 1.3 + 0.3 }));
    const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
    const lerpArr = (a: number[], b: number[], k: number) => a.forEach((_, i) => (a[i] = lerp(a[i], b[i], k)));

    const loop = () => {
      const track = trackRef.current; let p = 0;
      if (track) { const d = track.offsetHeight - innerHeight; p = d > 0 ? Math.min(1, Math.max(0, -track.getBoundingClientRect().top / d)) : 0; }
      const idx = Math.min(N - 1, Math.round(p * (N - 1)));
      if (idx !== lastStep) { lastStep = idx; setStep(idx); }
      const s = SECTIONS[idx]; const mode: Mode = s.mode ?? "flow"; const trans = s.axis === "trans";

      const w = innerWidth, h = innerHeight, mid = h * 0.46;
      const rowsN = Math.max(1, Math.round(cur.rows));
      const rowGap = Math.min(34, (h * 0.34) / rowsN);
      const half = rowGap * rowsN * 0.6 + 16;
      const R = Math.min(w, h) * 0.42;
      const zones = zonesFor(s, w); const multi = zones.length > 1; const lastZone = zones[zones.length - 1];

      const pt = pointer.current;
      const onBand = started && pt.active && (mode === "disk" ? Math.hypot(pt.x - w / 2, pt.y - mid) < R : Math.abs(pt.y - mid) < half + 8);
      const az: Zone | null = onBand ? (zones.find((z) => pt.x >= z.x0 && pt.x < z.x1) ?? lastZone) : null;
      const voiceEff = az ? az.voice : userVoice.current;
      if (az && s.interactive === "wave") userVoice.current = az.voice; // poslední slyšený nástroj se nese dál
      const filterEff = multi && az ? MED[az.medium].filt : s.filter;
      const tintMed: Medium = multi ? "air" : s.medium;

      cur.freq = lerp(cur.freq, userFreq.current * s.freqMul, 0.08);
      cur.filter = lerp(cur.filter, filterEff, 0.08);
      cur.rows = lerp(cur.rows, s.rows, 0.1);
      lerpArr(cur.top, MED[tintMed].top, 0.06); lerpArr(cur.bot, MED[tintMed].bot, 0.06);
      cur.speedF = lerp(cur.speedF, MED[tintMed].speed, 0.06);
      cur.space = lerp(cur.space, tintMed === "space" ? 1 : 0, 0.05);
      cur.level = lerp(cur.level, onBand ? userGain.current * s.gainMul : 0, 0.14);

      if (osc.current && level.current && filt.current && ac.current) {
        const now = ac.current.currentTime;
        osc.current.frequency.setTargetAtTime(cur.freq, now, 0.05);
        level.current.gain.setTargetAtTime(cur.level * 0.16, now, 0.05);
        filt.current.frequency.setTargetAtTime(cur.filter, now, 0.08);
        if (voiceEff !== lastVoice.current) { applyVoice(voiceEff); lastVoice.current = voiceEff; }
      }

      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, `rgb(${cur.top.map(Math.round).join(",")})`); g.addColorStop(1, `rgb(${cur.bot.map(Math.round).join(",")})`);
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
      if (cur.space > 0.02) { ctx.fillStyle = "#fff"; for (const st of stars) { ctx.globalAlpha = cur.space * (0.35 + 0.5 * Math.sin(phase * 0.6 + st.x * 9)); ctx.beginPath(); ctx.arc(st.x * w, st.y * h, st.r, 0, 7); ctx.fill(); } ctx.globalAlpha = 1; }

      phase += (0.018 + cur.freq / 6500) * cur.speedF;
      const M = 70, spacing = w / M, A = spacing * 1.3 * cur.level, K = Math.max(1.2, Math.min(20, cur.freq / 45)) * Math.PI * 2;
      const emX = w * 0.05, wallX = w * 0.84;
      const pAlpha = 1 - cur.space;
      const wv = (vid: string, t: number) => waveVal(vid, t);

      // pásma (výběr uchem podle pozice)
      if (multi) {
        ctx.textAlign = "center"; ctx.font = "700 12px system-ui";
        for (const z of zones) {
          const active = az === z;
          ctx.globalAlpha = active ? 0.1 : 0.035; ctx.fillStyle = `rgb(${MED[z.medium].dot.join(",")})`; ctx.fillRect(z.x0, mid - half - 28, z.x1 - z.x0, half * 2 + 56);
          ctx.globalAlpha = 0.16; ctx.strokeStyle = INK; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(z.x1, mid - half - 28); ctx.lineTo(z.x1, mid + half + 28); ctx.stroke();
          ctx.globalAlpha = active ? 1 : 0.45; ctx.fillStyle = INK; ctx.fillText(z.label, (z.x0 + z.x1) / 2, mid - half - 12);
        }
        ctx.globalAlpha = 1;
      }

      if (mode === "disk") {
        const cxp = w / 2, cyp = mid, gap = 30, Kd = K * 0.5;
        for (let gy = cyp - R; gy <= cyp + R; gy += gap) for (let gx = cxp - R; gx <= cxp + R; gx += gap) {
          const dx0 = gx - cxp, dy0 = gy - cyp, r = Math.hypot(dx0, dy0); if (r > R || r < gap * 0.5) continue;
          const ang = Math.atan2(dy0, dx0); const disp = A * wv(userVoice.current, (r / w) * Kd - phase);
          const disp2 = A * wv(userVoice.current, ((r + gap) / w) * Kd - phase); const comp = Math.max(0, Math.min(1, 1 - (gap + disp2 - disp) / gap));
          ctx.globalAlpha = pAlpha * (0.35 + comp * 0.5) * (1 - (r / R) * 0.5); ctx.fillStyle = `rgb(${MED.air.dot.join(",")})`;
          ctx.beginPath(); ctx.arc(gx + Math.cos(ang) * disp, gy + Math.sin(ang) * disp, 2 + comp * 1.7, 0, 7); ctx.fill();
        }
        ctx.globalAlpha = pAlpha * 0.9; ctx.fillStyle = "#e23b3b"; ctx.beginPath(); ctx.arc(cxp, cyp, 7, 0, 7); ctx.fill(); ctx.globalAlpha = 1;
      } else {
        if (pAlpha > 0.05) { ctx.globalAlpha = pAlpha * 0.85; ctx.strokeStyle = "#e23b3b"; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(emX, mid - half); ctx.lineTo(emX, mid + half); ctx.stroke(); }
        if (mode === "reflect") { ctx.globalAlpha = 0.9; ctx.strokeStyle = INK; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(wallX, mid - half); ctx.lineTo(wallX, mid + half); ctx.stroke(); }
        ctx.globalAlpha = 1;

        for (let r = 0; r < rowsN; r++) {
          const y0 = mid + (r - (rowsN - 1) / 2) * rowGap;
          const xs: number[] = new Array(M), ys: number[] = new Array(M), dc: string[] = new Array(M);
          for (let i = 0; i < M; i++) {
            const bx = (i + 0.5) * spacing;
            const z = multi ? (zones.find((zz) => bx >= zz.x0 && bx < zz.x1) ?? lastZone) : zones[0];
            dc[i] = `rgb(${MED[z.medium].dot.join(",")})`;
            let val: number;
            if (mode === "reflect") val = bx < wallX ? (wv(z.voice, (bx / w) * K - phase) + wv(z.voice, ((2 * wallX - bx) / w) * K - phase)) * 0.5 : 0;
            else val = wv(z.voice, (bx / w) * K - phase);
            xs[i] = trans ? bx : bx + A * val; ys[i] = trans ? y0 + A * val : y0;
          }
          for (let i = 0; i < M; i++) {
            const comp = !trans && i > 0 ? Math.max(0, Math.min(1, 1 - (xs[i] - xs[i - 1]) / spacing)) : 0;
            const tracer = !trans && !multi && i % 12 === 6;
            if (tracer) { ctx.globalAlpha = pAlpha * 0.25; ctx.strokeStyle = "rgba(46,125,50,0.6)"; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc((i + 0.5) * spacing, y0, 4, 0, 7); ctx.stroke(); }
            ctx.globalAlpha = pAlpha * (0.4 + comp * 0.5); ctx.fillStyle = tracer ? "#2e7d32" : dc[i];
            ctx.beginPath(); ctx.arc(xs[i], ys[i], 2 + comp * 1.7, 0, 7); ctx.fill();
          }
        }
        ctx.globalAlpha = 1;
      }

      // ucho na kurzoru
      if (pt.active) {
        ctx.save(); ctx.translate(pt.x, pt.y);
        ctx.globalAlpha = onBand ? 0.95 : 0.4; ctx.lineWidth = 2.5; ctx.strokeStyle = INK; ctx.fillStyle = onBand ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.5)";
        ctx.beginPath(); ctx.arc(0, 0, 16, 0, 7); ctx.fill(); ctx.stroke();
        ctx.beginPath(); ctx.arc(2, -1, 8, -1.1, 2.4); ctx.stroke();
        ctx.beginPath(); ctx.arc(0, 4, 2.4, 0, 7); ctx.fillStyle = INK; ctx.fill();
        ctx.restore(); ctx.globalAlpha = 1;
      }

      if (cur.space > 0.4) { ctx.fillStyle = `rgba(255,255,255,${cur.space * 0.6})`; ctx.font = "700 14px system-ui"; ctx.textAlign = "center"; ctx.fillText("— ticho —", w / 2, mid - half - 12); }
      raf = requestAnimationFrame(loop);
    };
    loop();
    return () => { cancelAnimationFrame(raf); removeEventListener("resize", resize); cv.removeEventListener("pointermove", onMove); cv.removeEventListener("pointerleave", onLeave); };
  }, [started, N, lang, u]);

  const sec = SECTIONS[step]; const txt = sec[lang]; const dark = sec.medium === "space";
  const ctrlColor = dark ? "#fff" : INK;

  return (
    <>
      <div style={{ position: "fixed", inset: 0, zIndex: 0 }}><canvas ref={canvasRef} style={{ width: "100%", height: "100%", display: "block", touchAction: "none", cursor: started ? "none" : "auto" }} /></div>

      <div style={{ position: "fixed", top: 16, left: 18, zIndex: 6 }}>
        <Link href={homeHref} style={{ fontFamily: "var(--font-sans)", fontSize: 12, color: dark ? "rgba(255,255,255,0.7)" : "var(--text-muted)", textDecoration: "none" }}>{u.back}</Link>
      </div>

      {started && (
        <button onClick={toggleMute} aria-label={muted ? u.unmute : u.mute} title={muted ? u.unmute : u.mute}
          style={{ position: "fixed", top: 14, right: 16, zIndex: 7, width: 42, height: 42, borderRadius: 12, border: `2.5px solid ${ctrlColor}`, background: dark ? "rgba(8,10,24,0.5)" : "#fff", color: ctrlColor, boxShadow: dark ? "none" : `3px 3px 0 ${INK}`, cursor: "pointer", fontSize: 16 }}>{muted ? "🔇" : "🔊"}</button>
      )}

      {started && (
        <div style={{ position: "fixed", right: 16, top: "50%", transform: "translateY(-50%)", zIndex: 6, display: "flex", flexDirection: "column", gap: 7, marginTop: 34 }}>
          {SECTIONS.map((_, i) => <div key={i} style={{ width: i === step ? 9 : 6, height: i === step ? 9 : 6, borderRadius: "50%", background: i <= step ? ctrlColor : (dark ? "rgba(255,255,255,0.3)" : "rgba(26,22,20,0.25)"), transition: "all .2s" }} />)}
        </div>
      )}

      {started && (
        <div style={{ position: "fixed", left: 0, right: 0, bottom: "7vh", zIndex: 5, display: "flex", justifyContent: "center", padding: "0 22px", pointerEvents: "none" }}>
          <div key={step} className="sb-card" style={{ maxWidth: 560, textAlign: "center", background: dark ? "rgba(8,10,24,0.6)" : "rgba(255,255,255,0.82)", border: `2.5px solid ${dark ? "rgba(255,255,255,0.3)" : INK}`, borderRadius: 18, boxShadow: dark ? "none" : `5px 5px 0 ${INK}`, padding: "20px 24px", color: ctrlColor, backdropFilter: "blur(6px)", pointerEvents: "auto" }}>
            <p style={{ ...display, fontSize: "clamp(22px,5vw,32px)", fontWeight: 700, letterSpacing: "-0.02em", marginBottom: 8 }}>{txt.t}</p>
            <p style={{ fontFamily: "var(--font-sans)", fontSize: 15.5, lineHeight: 1.55, color: dark ? "rgba(255,255,255,0.85)" : "var(--text-secondary)" }}>{txt.p}</p>

            {sec.interactive === "freq" && (<div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 14 }}>
              <span style={{ fontFamily: "var(--font-sans)", fontSize: 11, fontWeight: 700, color: "#4aa3ff" }}>{u.low}</span>
              <input type="range" min={60} max={900} value={freqUI} onChange={(e) => { const v = +e.target.value; userFreq.current = v; setFreqUI(v); }} style={{ flex: 1, accentColor: ctrlColor }} />
              <span style={{ fontFamily: "var(--font-sans)", fontSize: 11, fontWeight: 700, color: "#ff6fae" }}>{u.high}</span>
            </div>)}
            {sec.interactive === "amp" && (<div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 14 }}>
              <span style={{ fontFamily: "var(--font-sans)", fontSize: 11, fontWeight: 700 }}>{u.quiet}</span>
              <input type="range" min={0} max={1} step={0.01} value={ampUI} onChange={(e) => { const v = +e.target.value; userGain.current = v; setAmpUI(v); }} style={{ flex: 1, accentColor: ctrlColor }} />
              <span style={{ fontFamily: "var(--font-sans)", fontSize: 11, fontWeight: 700 }}>{u.loud}</span>
            </div>)}
            {(sec.interactive === "medium" || sec.interactive === "wave") && (<p style={{ fontFamily: "var(--font-sans)", fontSize: 12, fontWeight: 700, color: "var(--text-muted)", marginTop: 12 }}>{u.hintMove}</p>)}

            {step === N - 1 && <Link href="/music-blaster" style={{ display: "inline-block", marginTop: 16, fontFamily: "var(--font-sans)", fontSize: 14, fontWeight: 700, color: ctrlColor, textDecoration: "underline", textUnderlineOffset: 3, pointerEvents: "auto" }}>{u.toMusic}</Link>}
          </div>
        </div>
      )}

      {started && step < N - 1 && <div style={{ position: "fixed", bottom: "2vh", left: "50%", transform: "translateX(-50%)", zIndex: 6, fontFamily: "var(--font-sans)", fontSize: 12, color: dark ? "rgba(255,255,255,0.6)" : "var(--text-muted)", animation: "sb-bob 2s ease-in-out infinite" }}>{u.scroll} ↓</div>}

      {!started && (
        <div style={{ position: "fixed", inset: 0, zIndex: 10, display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", padding: 24 }}>
          <div>
            <p style={{ fontFamily: "var(--font-sans)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.24em", color: "var(--text-muted)", marginBottom: 16 }}>{u.eyebrow}</p>
            <h1 style={{ ...display, fontSize: "clamp(34px,8vw,60px)", fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1.05, marginBottom: 24, maxWidth: 600 }}>{u.title}</h1>
            <button onClick={start} style={{ background: INK, color: "#fff", border: `2.5px solid ${INK}`, borderRadius: 14, boxShadow: `5px 5px 0 ${INK}`, padding: "16px 38px", fontFamily: "var(--font-sans)", fontSize: 18, fontWeight: 700, cursor: "pointer" }}>{u.start}</button>
            <p style={{ fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--text-muted)", marginTop: 18, maxWidth: 380 }}>{u.audio}</p>
          </div>
        </div>
      )}

      <div ref={trackRef} style={{ height: started ? `${N * 100}vh` : "100vh" }} />

      <style>{`@keyframes sb-bob { 0%,100%{ transform:translateX(-50%) translateY(0);} 50%{ transform:translateX(-50%) translateY(6px);} }
        .sb-card { animation: sb-in .5s cubic-bezier(.22,1,.36,1); }
        @keyframes sb-in { from{ opacity:0; transform: translateY(14px);} to{opacity:1; transform:none;} }`}</style>
    </>
  );
}

function waveVal(voiceId: string, t: number): number {
  const v = voiceOf(voiceId);
  if (v?.h) { let s = 0, n = 0; for (let k = 0; k < v.h.length; k++) { s += v.h[k] * Math.sin((k + 1) * t); n += v.h[k]; } return s / (n || 1); }
  const x = ((t % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
  if (voiceId === "square") return Math.sin(t) >= 0 ? 1 : -1;
  if (voiceId === "saw") return x / Math.PI - 1;
  if (voiceId === "triangle") return x < Math.PI ? (x / Math.PI) * 2 - 1 : 3 - (x / Math.PI) * 2;
  return Math.sin(t);
}
