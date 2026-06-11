"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { Lang } from "@/lib/lang";

const INK = "#1a1614";
const display: React.CSSProperties = { fontFamily: "var(--font-display)" };
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

type Mode = "flow" | "disk" | "reflect" | "compare";
type Sec = {
  cs: { t: string; p: string }; en: { t: string; p: string };
  freqMul: number; gainMul: number; filter: number; rows: number;
  medium: Medium; tint?: Medium; mode?: Mode; axis?: "long" | "trans"; interactive?: "freq" | "amp" | "medium" | "wave"; tracer?: boolean;
};

const SECTIONS: Sec[] = [
  { cs: { t: "Co je zvuk?", p: "Zvuk je chvění. Vlevo je zdroj — rozkmitá se a postrká vzduch. To šťouchnutí běží zleva doprava. Polož na vlnu ucho a uslyšíš ho." }, en: { t: "What is sound?", p: "Sound is shaking. On the left is the source — it vibrates and nudges the air. That nudge runs left to right. Put your ear on the wave to hear it." }, freqMul: 0.6, gainMul: 0.9, filter: 18000, rows: 1, medium: "air" },
  { cs: { t: "Zvuk je podélná vlna", p: "Na vodě se hladina vlní nahoru a dolů — to je příčná vlna. Zvuk je jiný: částice se kývou tam a zpět, podél směru letu. Sleduj zelené — jen se houpou na místě, vlna běží dál." }, en: { t: "Sound is a longitudinal wave", p: "On water the surface ripples up and down — that's a transverse wave. Sound is different: particles swing back and forth, along the direction of travel. Watch the green ones — they bob in place, the wave moves on." }, freqMul: 0.8, gainMul: 0.9, filter: 18000, rows: 5, medium: "air", tracer: true },
  { cs: { t: "Jde všemi směry", p: "Ze zdroje se zvuk šíří na všechny strany zároveň — kulové vlny, co pořád dokola hustí a řídnou vzduch kolem." }, en: { t: "It goes everywhere", p: "From the source, sound spreads in every direction at once — spheres of squeeze and spread, over and over." }, freqMul: 0.9, gainMul: 0.9, filter: 18000, rows: 7, medium: "air", mode: "disk" },
  { cs: { t: "Potřebuje médium", p: "Aby se vlna nesla, musí mít co strkat — vzduch, vodu, zeď. V dokonale prázdném prostoru není co rozhýbat." }, en: { t: "It needs a medium", p: "To travel, the wave needs something to push — air, water, a wall. In truly empty space there's nothing to move." }, freqMul: 0.9, gainMul: 0.9, filter: 18000, rows: 3, medium: "air" },
  { cs: { t: "Zkus různá prostředí", p: "Vzduch, voda, železo vedle sebe. Výška zůstává stejná — to dělá zdroj. Ale v hutnějším prostředí letí zvuk rychleji a vlna se roztáhne: komprese jsou od sebe dál." }, en: { t: "Try different media", p: "Air, water, iron side by side. The pitch stays the same — that's set by the source. But in a denser medium sound travels faster and the wave stretches: the squeezes spread further apart." }, freqMul: 1, gainMul: 0.95, filter: 18000, rows: 5, medium: "air", interactive: "medium" },
  { cs: { t: "Ve vesmíru ticho", p: "Ve vesmíru nejsou skoro žádné částice. Není co strkat — a tak je dokonalé ticho. Ucho sem dej, kam chceš, neuslyšíš nic." }, en: { t: "Silence in space", p: "Space has almost no particles. Nothing to push — so it's perfect silence. Put your ear anywhere here, you'll hear nothing." }, freqMul: 1, gainMul: 0, filter: 8000, rows: 3, medium: "space" },
  { cs: { t: "Jak se kreslí vs. jak se chová", p: "Zvuk se nejčastěji kreslí jako vlnka nahoru a dolů (nahoře). Ale doopravdy se vzduch jen hustí a řídne podél směru (dole). Obě křivky říkají totéž — jen ta dolní je pravdivá." }, en: { t: "How it's drawn vs. how it behaves", p: "Sound is most often drawn as a wiggle up and down (top). But really the air just squeezes and spreads along the direction (bottom). Both say the same thing — the lower one is the true picture." }, freqMul: 0.8, gainMul: 0.9, filter: 18000, rows: 1, medium: "air", mode: "compare" },
  { cs: { t: "Výška = frekvence", p: "Jak hustě jdou komprese za sebou, taková je výška. Posuň ucho vlevo (basa) ↔ vpravo (výška). Co naladíš, to si neseš dál." }, en: { t: "Pitch = frequency", p: "How tightly the squeezes follow each other sets the pitch. Move your ear left (bass) ↔ right (treble). Whatever you tune stays with you." }, freqMul: 1, gainMul: 0.9, filter: 18000, rows: 5, medium: "air", interactive: "freq" },
  { cs: { t: "Hlasitost = amplituda", p: "Jak daleko částice z místa vyrazí, tak je to hlasité. Blíž ke středu vlny = hlasitěji, k okraji = tišeji." }, en: { t: "Loudness = amplitude", p: "How far the particles dart from their spot is how loud it is. Closer to the wave's center = louder, near the edge = softer." }, freqMul: 1, gainMul: 1, filter: 18000, rows: 5, medium: "air", interactive: "amp" },
  { cs: { t: "Barva zvuku", p: "Každé pásmo je jiný nástroj — od čistého tónu po housle a klavír. Přejížděj uchem a poslouchej, čím se liší. Co posloucháš naposled, to si neseš dál." }, en: { t: "The color of sound", p: "Each band is a different instrument — from a pure tone to violin and piano. Glide your ear across and hear how they differ. Whatever you hear last, you carry on." }, freqMul: 1, gainMul: 0.9, filter: 18000, rows: 7, medium: "air", interactive: "wave" },
  { cs: { t: "Odraz a ozvěna", p: "Vyber si zvuk a poslouchej, jak se odrazí od zdi a vrací se zpět — znova a znova, jak doznívá. To je ozvěna." }, en: { t: "Reflection and echo", p: "Pick a sound and hear it bounce off the wall and come back — again and again as it fades. That's an echo." }, freqMul: 0.9, gainMul: 0.95, filter: 18000, rows: 5, medium: "air", mode: "reflect", interactive: "wave" },
  { cs: { t: "A to je celé", p: "Zvuk je rozhýbaný vzduch, co doběhne k uchu. Umíš mu měnit výšku, hlasitost i barvu, umíš ho odrazit i utišit. Teď ho slyšíš — i vidíš." }, en: { t: "That's all there is", p: "Sound is moved air reaching your ear. You can change its pitch, loudness and color, bounce it and quiet it. Now you hear it — and see it." }, freqMul: 1, gainMul: 0.95, filter: 18000, rows: 1, medium: "air" },
];

const UI = {
  cs: { back: "← The Lab", eyebrow: "Zvuková experience", title: "Cesta po zvukové vlně", start: "Start ▶", audio: "🔊 Zapni si zvuk. Tvůj kurzor je ucho — slyšíš jen to, co máš pod ním.", scroll: "scrolluj dolů", mute: "Ztlumit", unmute: "Zvuk", toMusic: "Pokračovat: jak vzniká hudba →", coach: "👂 Zaparkuj ucho na vlnu", hintFreq: "← basa · výška →", hintAmp: "blíž ke středu = hlasitěji", hintZone: "👂 přejížděj uchem po pásmech", media: { air: "vzduch", water: "voda", solid: "železo" }, tracerNote: "jen se kývu na místě", drawnAs: "takhle se zvuk obvykle kreslí", reallyAs: "takhle se doopravdy chová" },
  en: { back: "← The Lab", eyebrow: "A sound experience", title: "A journey along a sound wave", start: "Start ▶", audio: "🔊 Turn your sound on. Your cursor is an ear — you only hear what's under it.", scroll: "scroll down", mute: "Mute", unmute: "Sound", toMusic: "Next: how music is made →", coach: "👂 Park your ear on the wave", hintFreq: "← bass · treble →", hintAmp: "closer to center = louder", hintZone: "👂 glide your ear across the bands", media: { air: "air", water: "water", solid: "iron" }, tracerNote: "I just bob in place", drawnAs: "how sound is usually drawn", reallyAs: "how it actually behaves" },
} as const;

const NOTE = ["C", "C♯", "D", "D♯", "E", "F", "F♯", "G", "G♯", "A", "A♯", "B"];
const noteName = (f: number) => { const m = Math.round(69 + 12 * Math.log2(f / 440)); return NOTE[((m % 12) + 12) % 12] + (Math.floor(m / 12) - 1); };

export function SoundExperience({ lang }: { lang: Lang }) {
  const u = UI[lang]; const homeHref = "/"; const N = SECTIONS.length;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [started, setStarted] = useState(false);
  const [muted, setMuted] = useState(false);
  const [step, setStep] = useState(0);
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
    const dly = a.createDelay(1.0); dly.delayTime.value = 0.3; const fb = a.createGain(); fb.gain.value = 0.42; const es = a.createGain(); es.gain.value = 0; const eo = a.createGain(); eo.gain.value = 0.6;
    o.connect(f).connect(lv);
    lv.connect(ms); lv.connect(conv).connect(wet).connect(ms);
    lv.connect(es); es.connect(dly); dly.connect(fb); fb.connect(dly); dly.connect(eo).connect(ms);
    ms.connect(a.destination);
    osc.current = o; level.current = lv; filt.current = f; master.current = ms; echoSend.current = es; echoFb.current = fb; revWet.current = wet;
    applyVoice(userVoice.current); lastVoice.current = userVoice.current; o.start();
    setStarted(true);
  };
  const toggleMute = () => setMuted((m) => { const nm = !m; if (master.current && ac.current) master.current.gain.setTargetAtTime(nm ? 0 : 1, ac.current.currentTime, 0.03); return nm; });
  useEffect(() => () => { try { osc.current?.stop(); ac.current?.close(); } catch {} }, []);

  useEffect(() => {
    const cv = canvasRef.current; if (!cv) return; const ctx = cv.getContext("2d"); if (!ctx) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const coarse = typeof matchMedia !== "undefined" && matchMedia("(hover: none)").matches;
    const resize = () => { cv.width = innerWidth * dpr; cv.height = innerHeight * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); };
    resize(); addEventListener("resize", resize);
    const onMove = (e: PointerEvent) => { pointer.current = { x: e.clientX, y: e.clientY, active: true }; };
    const onLeave = () => { pointer.current.active = false; };
    cv.addEventListener("pointermove", onMove); cv.addEventListener("pointerleave", onLeave);

    type Zone = { x0: number; x1: number; voice: string; medium: Medium; label: string; sub: string };
    const zonesFor = (s: Sec, x0p: number, ww: number): Zone[] => {
      if (s.interactive === "medium") { const ms = ["air", "water", "solid"] as const; return ms.map((m, i) => ({ x0: x0p + (i * ww) / 3, x1: x0p + ((i + 1) * ww) / 3, voice: userVoice.current, medium: m, label: u.media[m], sub: MED[m].ms })); }
      if (s.interactive === "wave") { const n = COLOR.length; return COLOR.map((c, i) => ({ x0: x0p + (i * ww) / n, x1: x0p + ((i + 1) * ww) / n, voice: c.id, medium: s.medium, label: c[lang], sub: "" })); }
      return [{ x0: x0p, x1: x0p + ww, voice: userVoice.current, medium: s.medium, label: "", sub: "" }];
    };

    const cur = { freq: 132, level: 0, filter: 18000, rows: 1, top: [...MED.air.top], bot: [...MED.air.bot], speedF: 1, space: 0, fade: 0 };
    let phase = 0, raf = 0, lastStep = -1;
    const stars = Array.from({ length: 70 }, () => ({ x: Math.random(), y: Math.random(), r: Math.random() * 1.3 + 0.3 }));
    const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
    const lerpArr = (a: number[], b: number[], k: number) => a.forEach((_, i) => (a[i] = lerp(a[i], b[i], k)));
    const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

    const loop = () => {
      const track = trackRef.current; let p = 0;
      if (track) { const d = track.offsetHeight - innerHeight; p = d > 0 ? Math.min(1, Math.max(0, -track.getBoundingClientRect().top / d)) : 0; }
      const idx = Math.min(N - 1, Math.round(p * (N - 1)));
      if (idx !== lastStep) { lastStep = idx; setStep(idx); cur.fade = 0; }
      const s = SECTIONS[idx]; const mode: Mode = s.mode ?? "flow"; const trans = s.axis === "trans";

      const w = innerWidth, h = innerHeight, mid = h * 0.6;
      const rowsN = Math.max(1, Math.round(cur.rows));
      const rowGap = Math.min(34, (h * 0.34) / rowsN);
      const half = rowGap * rowsN * 0.6 + 16;
      const R = Math.min(w, h) * 0.42;
      const padX = Math.max(64, w * 0.06), spkX = padX, fieldX0 = padX + 46, fieldX1 = w - padX, FW = Math.max(80, fieldX1 - fieldX0);
      const zones = zonesFor(s, fieldX0, FW); const multi = zones.length > 1; const lastZone = zones[zones.length - 1];

      const pt = coarse ? { x: w / 2, y: mid, active: started } : pointer.current;
      const onBand = started && pt.active && (mode === "disk" ? Math.hypot(pt.x - w / 2, pt.y - mid) < R : ((mode === "compare" ? Math.abs(pt.y - mid) < 110 : Math.abs(pt.y - mid) < half + 22) && pt.x >= fieldX0 - 8 && pt.x <= fieldX1 + 8));
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
      const filterEff = multi && az ? MED[az.medium].filt : s.filter;
      const tintMed: Medium = multi ? "air" : s.medium;

      cur.freq = lerp(cur.freq, userFreq.current * s.freqMul, 0.08);
      cur.filter = lerp(cur.filter, filterEff, 0.08);
      cur.rows = lerp(cur.rows, s.rows, 0.1);
      cur.fade = lerp(cur.fade, 1, 0.1);
      lerpArr(cur.top, MED[tintMed].top, 0.06); lerpArr(cur.bot, MED[tintMed].bot, 0.06);
      cur.speedF = lerp(cur.speedF, MED[tintMed].speed, 0.06);
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
      if (!started) { raf = requestAnimationFrame(loop); return; }

      phase += (0.018 + cur.freq / 6500) * cur.speedF;
      const M = 70, spacing = FW / M, A = spacing * 1.3 * cur.level, K = clamp(cur.freq / 45, 1.2, 20) * Math.PI * 2;
      const wallX = fieldX0 + FW * 0.96;
      const pAlpha = (1 - cur.space) * cur.fade;
      const wv = (vid: string, t: number) => waveVal(vid, t);

      // vodítko, kde vlna „bydlí"
      if (mode !== "disk" && mode !== "compare" && cur.space < 0.3) { ctx.globalAlpha = (onBand ? 0.05 : 0.09) * cur.fade; ctx.fillStyle = INK; roundRect(ctx, fieldX0, mid - half, FW, half * 2, half); ctx.fill(); ctx.globalAlpha = 1; }

      if (multi) {
        ctx.textAlign = "center";
        for (const z of zones) {
          const active = az === z;
          ctx.globalAlpha = (active ? 0.12 : 0.04) * cur.fade; ctx.fillStyle = `rgb(${MED[z.medium].dot.join(",")})`; ctx.fillRect(z.x0, mid - half - 30, z.x1 - z.x0, half * 2 + 60);
          ctx.globalAlpha = 0.16 * cur.fade; ctx.strokeStyle = INK; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(z.x1, mid - half - 30); ctx.lineTo(z.x1, mid + half + 30); ctx.stroke();
          ctx.globalAlpha = (active ? 1 : 0.5) * cur.fade; ctx.fillStyle = INK; ctx.font = "700 13px system-ui"; ctx.fillText(z.label, (z.x0 + z.x1) / 2, mid - half - 16);
          if (z.sub) { ctx.globalAlpha = (active ? 0.8 : 0.4) * cur.fade; ctx.font = "600 11px system-ui"; ctx.fillText(z.sub, (z.x0 + z.x1) / 2, mid - half - 2); }
        }
        ctx.globalAlpha = 1;
      }

      if (mode === "compare") {
        const topY = mid - 64, botY = mid + 48;
        // nahoře: klasická oscilační (čárová) vlna
        ctx.globalAlpha = pAlpha; ctx.strokeStyle = INK; ctx.lineWidth = 2.6; ctx.beginPath();
        for (let i = 0; i <= 140; i++) { const xx = fieldX0 + (i / 140) * FW, nx2 = i / 140; const yy = topY + Math.sin(nx2 * K - phase) * 30; i === 0 ? ctx.moveTo(xx, yy) : ctx.lineTo(xx, yy); }
        ctx.stroke();
        // dole: skutečná podélná částicová vlna (1 řada)
        const Mc = 70, sp = FW / Mc, Ac = sp * 1.3 * Math.max(cur.level, 0.4);
        const xs2: number[] = new Array(Mc);
        for (let i = 0; i < Mc; i++) { const bx = fieldX0 + (i + 0.5) * sp; xs2[i] = bx + Ac * Math.sin(((bx - fieldX0) / FW) * K - phase); }
        for (let i = 0; i < Mc; i++) { const comp = i > 0 ? clamp(1 - (xs2[i] - xs2[i - 1]) / sp, 0, 1) : 0; ctx.globalAlpha = pAlpha * (0.4 + comp * 0.5); ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(xs2[i], botY, 2 + comp * 1.7, 0, 7); ctx.fill(); }
        // popisky
        ctx.globalAlpha = pAlpha * 0.7; ctx.fillStyle = INK; ctx.font = "700 12px system-ui"; ctx.textAlign = "left";
        ctx.fillText("↑ " + u.drawnAs, fieldX0, topY - 34); ctx.fillText("↓ " + u.reallyAs, fieldX0, botY + 40);
        ctx.globalAlpha = 1;
      } else if (mode === "disk") {
        const cxp = w / 2, cyp = mid, gap = 30, Kd = K * 0.5;
        for (let gy = cyp - R; gy <= cyp + R; gy += gap) for (let gx = cxp - R; gx <= cxp + R; gx += gap) {
          const dx0 = gx - cxp, dy0 = gy - cyp, r = Math.hypot(dx0, dy0); if (r > R || r < gap * 0.5) continue;
          const ang = Math.atan2(dy0, dx0); const disp = A * wv(userVoice.current, (r / w) * Kd - phase);
          const disp2 = A * wv(userVoice.current, ((r + gap) / w) * Kd - phase); const comp = clamp(1 - (gap + disp2 - disp) / gap, 0, 1);
          ctx.globalAlpha = pAlpha * (0.35 + comp * 0.5) * (1 - (r / R) * 0.5); ctx.fillStyle = `rgb(${MED.air.dot.join(",")})`;
          ctx.beginPath(); ctx.arc(gx + Math.cos(ang) * disp, gy + Math.sin(ang) * disp, 2 + comp * 1.7, 0, 7); ctx.fill();
        }
        ctx.globalAlpha = pAlpha * 0.9; ctx.fillStyle = "#e23b3b"; const pr = 7 + (0.5 + 0.5 * Math.sin(phase * 2)) * (2 + cur.level * 6); ctx.beginPath(); ctx.arc(cxp, cyp, pr, 0, 7); ctx.fill(); ctx.globalAlpha = 1;
      } else {
        if (cur.space < 0.5) { ctx.globalAlpha = pAlpha; drawSpeaker(ctx, spkX, mid, half * 0.82, phase, cur.level); ctx.globalAlpha = 1; }
        if (mode === "reflect") { ctx.globalAlpha = cur.fade * 0.9; ctx.strokeStyle = INK; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(wallX, mid - half); ctx.lineTo(wallX, mid + half); ctx.stroke(); }
        ctx.globalAlpha = 1;

        let trX = 0;
        for (let r = 0; r < rowsN; r++) {
          const y0 = mid + (r - (rowsN - 1) / 2) * rowGap;
          const xs: number[] = new Array(M), dc: string[] = new Array(M); const ys: number[] = new Array(M);
          for (let i = 0; i < M; i++) {
            const bx = fieldX0 + (i + 0.5) * spacing; const nx = (bx - fieldX0) / FW;
            const z = multi ? (zones.find((zz) => bx >= zz.x0 && bx < zz.x1) ?? lastZone) : zones[0];
            dc[i] = `rgb(${MED[z.medium].dot.join(",")})`;
            const kz = s.interactive === "medium" ? K / MED[z.medium].speed : K; // λ ∝ rychlost: v hutnějším delší vlna + rychlejší šíření, výška stejná
            let val: number;
            if (mode === "reflect") val = bx < wallX ? (wv(z.voice, nx * K - phase) + wv(z.voice, ((2 * wallX - bx - fieldX0) / FW) * K - phase)) * 0.5 : 0;
            else val = wv(z.voice, nx * kz - phase);
            let aCol = A;
            if (s.interactive === "wave") { const active = z === az; const zHit = HIT_IDS.has(z.voice); aCol = spacing * 0.95 * (active ? (zHit ? 0.2 + hitEnv.current * 1.6 : 1) : 0.5); }
            xs[i] = trans ? bx : bx + aCol * val; ys[i] = trans ? y0 + aCol * val : y0;
          }
          for (let i = 0; i < M; i++) {
            const comp = !trans && i > 0 ? clamp(1 - (xs[i] - xs[i - 1]) / spacing, 0, 1) : 0;
            const tracer = !trans && !multi && i % 12 === 6;
            const big = tracer && s.tracer;
            if (tracer) { ctx.globalAlpha = pAlpha * 0.3; ctx.strokeStyle = "rgba(46,125,50,0.6)"; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc((i + 0.5) * spacing, y0, big ? 6 : 4, 0, 7); ctx.stroke(); }
            ctx.globalAlpha = pAlpha * (0.4 + comp * 0.5); ctx.fillStyle = tracer ? "#2e7d32" : dc[i];
            ctx.beginPath(); ctx.arc(xs[i], ys[i], (big ? 3 : 2) + comp * 1.7, 0, 7); ctx.fill();
            if (big && r === Math.floor(rowsN / 2) && i === 6) trX = xs[i];
          }
        }
        if (s.tracer && trX) { ctx.globalAlpha = pAlpha; ctx.fillStyle = "#2e7d32"; ctx.font = "700 12px system-ui"; ctx.textAlign = "left"; ctx.fillText("← " + u.tracerNote, trX + 12, mid); ctx.globalAlpha = 1; }
      }

      // Hz · nota u výšky
      if (s.interactive === "freq" && onBand && !coarse) { ctx.globalAlpha = pAlpha; ctx.fillStyle = INK; ctx.font = "700 15px system-ui"; ctx.textAlign = "center"; ctx.fillText(`${Math.round(cur.freq)} Hz · ${noteName(cur.freq)}`, pt.x, mid - half - 14); ctx.globalAlpha = 1; }

      // ucho na kurzoru
      if (!coarse && pt.active) {
        ctx.save(); ctx.translate(pt.x, pt.y);
        ctx.globalAlpha = onBand ? 0.95 : 0.4; ctx.lineWidth = 2.5; ctx.strokeStyle = INK; ctx.fillStyle = onBand ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.5)";
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
  }, [started, N, lang, u, coachDone]);

  const sec = SECTIONS[step]; const txt = sec[lang]; const dark = sec.medium === "space";
  const ctrlColor = dark ? "#fff" : INK;
  const hint = sec.interactive === "freq" ? u.hintFreq : sec.interactive === "amp" ? u.hintAmp : (sec.interactive === "medium" || sec.interactive === "wave") ? u.hintZone : null;

  return (
    <>
      <div style={{ position: "fixed", inset: 0, zIndex: 0 }}><canvas ref={canvasRef} style={{ width: "100%", height: "100%", display: "block", cursor: started ? "none" : "auto" }} /></div>

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

      {started && !coachDone && (
        <div style={{ position: "fixed", left: 0, right: 0, top: "calc(60% + 110px)", zIndex: 6, textAlign: "center", pointerEvents: "none", fontFamily: "var(--font-sans)", fontSize: 14, fontWeight: 700, color: "var(--text-secondary)", animation: "sb-bob 1.6s ease-in-out infinite" }}>↑ {u.coach}</div>
      )}

      {started && (
        <div style={{ position: "fixed", left: 0, right: 0, top: "26%", transform: "translateY(-50%)", zIndex: 5, display: "flex", justifyContent: "center", padding: "0 22px", pointerEvents: "none" }}>
          <div key={step} className="sb-card" style={{ maxWidth: 520, textAlign: "center", background: dark ? "rgba(10,12,28,0.5)" : "rgba(255,255,255,0.66)", border: `1px solid ${dark ? "rgba(255,255,255,0.16)" : "rgba(26,22,20,0.1)"}`, borderRadius: 22, boxShadow: dark ? "0 14px 44px rgba(0,0,0,0.4)" : "0 16px 44px rgba(26,22,20,0.12)", padding: "16px 30px 22px", color: ctrlColor, backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 10 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#e23b3b", display: "inline-block" }} />
              <span style={{ fontFamily: "var(--font-sans)", fontSize: 11, fontWeight: 700, letterSpacing: "0.24em", color: dark ? "rgba(255,255,255,0.55)" : "var(--text-muted)" }}>{String(step + 1).padStart(2, "0")} / {String(N).padStart(2, "0")}</span>
            </div>
            <p style={{ ...display, fontSize: "clamp(21px,4.6vw,30px)", fontWeight: 700, letterSpacing: "-0.025em", marginBottom: 8 }}>{txt.t}</p>
            <p style={{ fontFamily: "var(--font-sans)", fontSize: 15, lineHeight: 1.55, color: dark ? "rgba(255,255,255,0.85)" : "var(--text-secondary)" }}>{txt.p}</p>
            {hint && <p style={{ fontFamily: "var(--font-sans)", fontSize: 12, fontWeight: 700, color: dark ? "rgba(255,255,255,0.6)" : "var(--text-muted)", marginTop: 12 }}>{hint}</p>}
            {step === N - 1 && <Link href="/music" style={{ display: "inline-block", marginTop: 16, fontFamily: "var(--font-sans)", fontSize: 14, fontWeight: 700, color: ctrlColor, textDecoration: "underline", textUnderlineOffset: 3, pointerEvents: "auto" }}>{u.toMusic}</Link>}
          </div>
        </div>
      )}

      {started && step < N - 1 && <div style={{ position: "fixed", bottom: "2vh", left: "50%", transform: "translateX(-50%)", zIndex: 6, fontFamily: "var(--font-sans)", fontSize: 12, color: dark ? "rgba(255,255,255,0.6)" : "var(--text-muted)", animation: "sb-bob 2s ease-in-out infinite" }}>{u.scroll} ↓</div>}

      {!started && (
        <div style={{ position: "fixed", inset: 0, zIndex: 10, display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", padding: 24 }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", maxWidth: 640, width: "100%" }}>
            <p style={{ fontFamily: "var(--font-sans)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.28em", color: "var(--text-muted)", marginBottom: 26 }}>{u.eyebrow}</p>
            <IntroWave />
            <h1 style={{ ...display, fontSize: "clamp(36px,8.5vw,68px)", fontWeight: 700, letterSpacing: "-0.035em", lineHeight: 1.02, margin: "26px 0 28px" }}>{u.title}</h1>
            <button onClick={start} className="sb-start" style={{ background: INK, color: "#fff", border: `2.5px solid ${INK}`, borderRadius: 16, boxShadow: `5px 5px 0 ${INK}`, padding: "16px 42px", fontFamily: "var(--font-sans)", fontSize: 18, fontWeight: 700, cursor: "pointer" }}>{u.start}</button>
            <p style={{ fontFamily: "var(--font-sans)", fontSize: 12.5, lineHeight: 1.5, color: "var(--text-muted)", marginTop: 22, maxWidth: 360 }}>{u.audio}</p>
          </div>
        </div>
      )}

      <div ref={trackRef} style={{ height: started ? `${N * 100}vh` : "100vh" }} />

      <style>{`@keyframes sb-bob { 0%,100%{ transform:translateX(-50%) translateY(0);} 50%{ transform:translateX(-50%) translateY(6px);} }
        .sb-card { animation: sb-in .5s cubic-bezier(.22,1,.36,1); }
        @keyframes sb-in { from{ opacity:0; transform: translateY(14px);} to{opacity:1; transform:none;} }
        .sb-start { transition: transform .12s ease, box-shadow .12s ease; }
        .sb-start:hover { transform: translate(-2px,-2px); box-shadow: 7px 7px 0 ${INK}; }
        .sb-start:active { transform: translate(2px,2px); box-shadow: 2px 2px 0 ${INK}; }`}</style>
    </>
  );
}

function IntroWave() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const cv = ref.current; if (!cv) return; const ctx = cv.getContext("2d"); if (!ctx) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1); const CH = 104; let w = 0;
    const fit = () => { w = Math.min(560, (cv.parentElement?.clientWidth || 560)); cv.style.width = w + "px"; cv.style.height = CH + "px"; cv.width = w * dpr; cv.height = CH * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); };
    fit(); const onR = () => fit(); addEventListener("resize", onR);
    let phase = 0, raf = 0; const ROWS = [-1, 0, 1];
    const loop = () => {
      ctx.clearRect(0, 0, w, CH);
      const mid = CH / 2, M = 46, spacing = w / M, breath = 0.62 + 0.38 * Math.sin(phase * 0.7), A = spacing * 1.25 * breath, K = 3 * Math.PI * 2, src = spacing * 0.5;
      for (const rr of ROWS) {
        const y = mid + rr * 17; const rowA = rr === 0 ? 1 : 0.42; let prevX = 0;
        for (let i = 0; i < M; i++) {
          const bx = (i + 0.5) * spacing; const val = Math.sin((bx / w) * K - phase + rr * 0.5); const x = bx + A * val;
          const comp = i > 0 ? Math.max(0, Math.min(1, 1 - (x - prevX) / spacing)) : 0; prevX = x;
          const ef = Math.max(0, Math.min(1, Math.min(bx, w - bx) / (w * 0.14)));
          ctx.globalAlpha = rowA * ef * (0.4 + comp * 0.55); ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(x, y, 2.1 + comp * 1.9, 0, 7); ctx.fill();
        }
      }
      const pulse = 0.5 + 0.5 * Math.sin(phase * 1.6);
      ctx.globalAlpha = 0.25 + pulse * 0.3; ctx.fillStyle = "#e23b3b"; ctx.beginPath(); ctx.arc(src, mid, 9 + pulse * 3, 0, 7); ctx.fill();
      ctx.globalAlpha = 0.95; ctx.beginPath(); ctx.arc(src, mid, 4.5, 0, 7); ctx.fill(); ctx.globalAlpha = 1;
      phase += 0.045; raf = requestAnimationFrame(loop);
    };
    loop();
    return () => { cancelAnimationFrame(raf); removeEventListener("resize", onR); };
  }, []);
  return <canvas ref={ref} style={{ display: "block", margin: "0 auto", width: "100%", maxWidth: 560 }} />;
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
