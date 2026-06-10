"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { Lang } from "@/lib/dictionaries";

const INK = "#1a1614";
const display: React.CSSProperties = { fontFamily: "var(--font-display)" };
type DrumLane = "kick" | "snare" | "hat" | "open";
const DRUM_LANES: DrumLane[] = ["kick", "snare", "hat", "open"];
const DRUM_COL: Record<DrumLane, string> = { kick: "#e8556d", snare: "#f4a259", hat: "#4eb4cf", open: "#56c596" };
const BASS_COL = "#7b6cf6", CHORD_COL = "#9b6cff", MEL_COL = "#ffb43c";
const NOTE = ["C", "C♯", "D", "D♯", "E", "F", "F♯", "G", "G♯", "A", "A♯", "B"];
const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII"];

type Editor = "drums" | "bass" | "chords" | "melody";
type Rolls = { drums: Record<DrumLane, number[]>; bass: number[]; chord: number[]; mel: number[] };
const D = (...idx: number[]) => { const a = Array(16).fill(0); idx.forEach((i) => (a[i] = 1)); return a; };
const R = (pairs: [number, number][]) => { const a = Array(16).fill(-1); pairs.forEach(([i, d]) => (a[i] = d)); return a; };

type Vibe = { id: string; cs: string; en: string; bpm: number; swing: number; chordType: OscillatorType; leadType: OscillatorType; chordCut: number; rev: number; pad: boolean; rolls: () => Rolls };
const VIBES: Vibe[] = [
  { id: "lofi", cs: "lo-fi", en: "lo-fi", bpm: 76, swing: 0.2, chordType: "triangle", leadType: "sine", chordCut: 1300, rev: 0.42, pad: true,
    rolls: () => ({ drums: { kick: D(0, 6, 10), snare: D(4, 12), hat: D(2, 6, 10, 14, 15), open: D() }, bass: R([[0, 0], [4, 5], [8, 3], [12, 4], [14, 4]]), chord: R([[0, 0], [4, 5], [8, 3], [12, 4]]), mel: R([[2, 4], [6, 5], [9, 7], [12, 4], [14, 2]]) }) },
  { id: "house", cs: "house", en: "house", bpm: 122, swing: 0, chordType: "triangle", leadType: "square", chordCut: 1900, rev: 0.24, pad: false,
    rolls: () => ({ drums: { kick: D(0, 4, 8, 12), snare: D(4, 12), hat: D(2, 6, 10, 14), open: D(14) }, bass: R([[3, 5], [7, 3], [11, 0], [15, 4]]), chord: R([[2, 5], [6, 3], [10, 0], [14, 4]]), mel: R([[4, 4], [10, 6], [12, 4]]) }) },
  { id: "epic", cs: "epické", en: "epic", bpm: 86, swing: 0, chordType: "triangle", leadType: "triangle", chordCut: 1700, rev: 0.6, pad: true,
    rolls: () => ({ drums: { kick: D(0, 8), snare: D(8), hat: D(), open: D() }, bass: R([[0, 0], [8, 4]]), chord: R([[0, 0], [4, 4], [8, 5], [12, 3]]), mel: R([[6, 4], [12, 2]]) }) },
];
const SCALES = { major: [0, 2, 4, 5, 7, 9, 11], minor: [0, 2, 3, 5, 7, 8, 10] };
const KEYS = [{ n: "C", m: 60 }, { n: "F", m: 65 }, { n: "G", m: 67 }, { n: "A", m: 69 }];
const m2f = (m: number) => 440 * Math.pow(2, (m - 69) / 12);
const degMidi = (scale: number[], key: number, deg: number, oct: number) => key + scale[((deg % 7) + 7) % 7] + 12 * (Math.floor(deg / 7) + oct);
const chordTones = (scale: number[], key: number, deg: number) => [0, 2, 4, 6].map((s) => degMidi(scale, key, deg + s, 0));
const BASS_OCT = -2, MEL_OCT = 1;

type SecInt = "rhythm" | "bass" | "chords" | "melody" | "mix" | "studio";
const SECTIONS: { cs: { t: string; p: string }; en: { t: string; p: string }; interactive?: SecInt; ed?: Editor }[] = [
  { cs: { t: "Co je hudba?", p: "Zvuk je jen chvění vzduchu. Hudba je zvuk, který někdo uspořádal — do času a do výšek. Pojďme jednu skladbu poskládat po vrstvách." }, en: { t: "What is music?", p: "Sound is just shaking air. Music is sound someone organized — in time and pitch. Let's build a track layer by layer." } },
  { cs: { t: "Rytmus = tep", p: "Nejdřív styl a tep. Vyber vibe, nalaď tempo a swing — a klikej do mřížky, ze čtyř bicích vrstev si poskládej beat." }, en: { t: "Rhythm = pulse", p: "First the style and the pulse. Pick a vibe, set tempo and swing — and click the grid to build a beat from four drum lanes." }, interactive: "rhythm", ed: "drums" },
  { cs: { t: "Basa drží spodek", p: "Basa dává skladbě pevnou půdu. Klikej do piano rollu — určuješ, kdy hraje i jak je vysoká. Tóny jsou z tóniny, takže to vždy ladí." }, en: { t: "Bass holds the bottom", p: "Bass gives the track solid ground. Click the piano roll — you set when it plays and how high. Notes come from the key, so it always fits." }, interactive: "bass", ed: "bass" },
  { cs: { t: "Akordy = nálada", p: "Víc tónů naráz je akord. Skládej je v piano rollu z diatonických možností. Tóninu a dur/moll měň nahoře kdykoliv — vše se přeladí." }, en: { t: "Chords = mood", p: "Several notes at once make a chord. Place them in the roll from diatonic options. Change key and major/minor up top anytime — it all re-tunes." }, interactive: "chords", ed: "chords" },
  { cs: { t: "Melodie = příběh", p: "Melodie je jeden hlas, co si zpívá nahoru a dolů. Naklikej si vlastní v piano rollu — drží se tóniny, takže to ladí." }, en: { t: "Melody = the story", p: "Melody is a single voice singing up and down. Click your own in the roll — it stays in the key, so it fits." }, interactive: "melody", ed: "melody" },
  { cs: { t: "Mix = vrstvy", p: "Skladba je vrstvy hrající spolu. Zapínej a vypínej je a poslouchej, co každá přidá." }, en: { t: "Mix = layers", p: "A track is layers playing together. Toggle them on and off and hear what each adds." }, interactive: "mix", ed: "drums" },
  { cs: { t: "Studio — tvoř", p: "Teď jsi u kniplů. Přepínej editory, klikej do mřížky, lad styl, tempo, tóninu. Akordy i basa drží v ladění samy." }, en: { t: "Studio — make it", p: "Now you're at the controls. Switch editors, click the grid, tweak style, tempo, key. Chords and bass stay in tune by themselves." }, interactive: "studio", ed: "drums" },
  { cs: { t: "Teď to umíš", p: "Hudba je chytře poskládaný zvuk — tep, spodek, nálada a příběh, sladěné do času. A ty teď víš jak na to." }, en: { t: "Now you get it", p: "Music is cleverly arranged sound — pulse, bottom, mood and story, locked in time. And now you know how." }, ed: "drums" },
];

const UI = {
  cs: { back: "← Spaghetti.ltd", eyebrow: "Hudební experience", title: "Jak vzniká hudba", start: "Start ▶", audio: "🔊 Zapni si zvuk a poskládej skladbu.", scroll: "scrolluj dolů", mute: "Ztlumit", unmute: "Zvuk", style: "styl", tempo: "tempo", swing: "swing", major: "dur", minor: "moll", drums: { kick: "kop", snare: "snare", hat: "hi-hat", open: "open hat" }, layers: { drums: "bicí", bass: "basa", chord: "akordy", mel: "melodie" }, edits: { drums: "bicí", bass: "basa", chords: "akordy", melody: "melodie" }, hint: "👆 klikej do mřížky" },
  en: { back: "← Spaghetti.ltd", eyebrow: "A music experience", title: "How music is made", start: "Start ▶", audio: "🔊 Turn your sound on and build a track.", scroll: "scroll down", mute: "Mute", unmute: "Sound", style: "style", tempo: "tempo", swing: "swing", major: "major", minor: "minor", drums: { kick: "kick", snare: "snare", hat: "hi-hat", open: "open hat" }, layers: { drums: "drums", bass: "bass", chord: "chords", mel: "melody" }, edits: { drums: "drums", bass: "bass", chords: "chords", melody: "melody" }, hint: "👆 click the grid" },
} as const;

export function MusicBlasterBook({ lang }: { lang: Lang }) {
  const u = UI[lang]; const homeHref = lang === "cs" ? "/cs" : "/"; const N = SECTIONS.length;
  const trackRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [started, setStarted] = useState(false);
  const [muted, setMuted] = useState(false);
  const [step, setStep] = useState(0);

  const bpm = useRef(76); const [bpmUI, setBpmUI] = useState(76);
  const swing = useRef(0.2); const [swingUI, setSwingUI] = useState(20);
  const minor = useRef(false); const [minorUI, setMinorUI] = useState(false);
  const keyM = useRef(60); const [keyUI, setKeyUI] = useState(60);
  const vibe = useRef<Vibe>(VIBES[0]); const [vibeUI, setVibeUI] = useState("lofi");
  const mute = useRef({ drums: false, bass: false, chord: false, mel: false }); const [muteUI, setMuteUI] = useState({ drums: false, bass: false, chord: false, mel: false });
  const tab = useRef<Editor>("drums"); const [tabUI, setTabUI] = useState<Editor>("drums");
  const rolls = useRef<Rolls>(VIBES[0].rolls());

  const ac = useRef<AudioContext | null>(null);
  const bus = useRef<Record<"drums" | "bass" | "chord" | "mel", GainNode | null>>({ drums: null, bass: null, chord: null, mel: null });
  const master = useRef<GainNode | null>(null); const revIn = useRef<GainNode | null>(null); const duck = useRef<GainNode | null>(null); const melSend = useRef<GainNode | null>(null); const dly = useRef<DelayNode | null>(null);
  const enable = useRef({ drums: false, bass: false, chord: false, mel: false });
  const pending = useRef<{ step: number; time: number }[]>([]); const curStep = useRef(0);
  const grid = useRef({ gx: 0, gy: 0, cw: 0, rh: 0, gap: 0, rows: 4, on: false }); const editorRef = useRef<Editor>("drums"); const timer = useRef(0);

  const applyVibe = (v: Vibe) => { vibe.current = v; setVibeUI(v.id); bpm.current = v.bpm; setBpmUI(v.bpm); swing.current = v.swing; setSwingUI(Math.round(v.swing * 100)); rolls.current = v.rolls(); if (revIn.current && ac.current) revIn.current.gain.setTargetAtTime(v.rev, ac.current.currentTime, 0.1); if (dly.current) dly.current.delayTime.value = (60 / v.bpm / 4) * 3; };

  const start = () => {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const a = new AC(); ac.current = a;
    const comp = a.createDynamicsCompressor(); comp.threshold.value = -15; comp.ratio.value = 3; comp.attack.value = 0.004; comp.release.value = 0.25; comp.connect(a.destination);
    const ms = a.createGain(); ms.gain.value = muted ? 0 : 0.9; ms.connect(comp); master.current = ms;
    // reverb (akordy)
    const conv = a.createConvolver(); const L = (a.sampleRate * 2.6) | 0; const b = a.createBuffer(2, L, a.sampleRate);
    for (let ch = 0; ch < 2; ch++) { const d = b.getChannelData(ch); for (let i = 0; i < L; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / L, 2.6); }
    conv.buffer = b; const rIn = a.createGain(); rIn.gain.value = vibe.current.rev; const rOut = a.createGain(); rOut.gain.value = 0.9; rIn.connect(conv).connect(rOut).connect(ms); revIn.current = rIn;
    // delay (melodie)
    const dl = a.createDelay(0.9); dl.delayTime.value = (60 / bpm.current / 4) * 3; const fb = a.createGain(); fb.gain.value = 0.34; const dOut = a.createGain(); dOut.gain.value = 0.4; const dSend = a.createGain(); dSend.gain.value = 0.32; dSend.connect(dl); dl.connect(fb); fb.connect(dl); dl.connect(dOut).connect(ms); dly.current = dl; melSend.current = dSend;
    // sběrnice + efekty
    const drumBus = a.createGain(); const drumShaper = a.createWaveShaper(); drumShaper.curve = shaperCurve(2.2); drumShaper.oversample = "2x"; drumBus.connect(drumShaper).connect(ms); bus.current.drums = drumBus;
    const bassBus = a.createGain(); const bassDrive = a.createWaveShaper(); bassDrive.curve = shaperCurve(2.6); bassDrive.oversample = "2x"; const dk = a.createGain(); dk.gain.value = 1; bassBus.connect(bassDrive).connect(dk).connect(ms); bus.current.bass = bassBus; duck.current = dk;
    const chordBus = a.createGain(); chordBus.connect(ms); chordBus.connect(rIn); bus.current.chord = chordBus;
    const melBus = a.createGain(); melBus.connect(ms); melBus.connect(dSend); bus.current.mel = melBus;
    (["drums", "bass", "chord", "mel"] as const).forEach((k) => (bus.current[k]!.gain.value = 0));

    let s = 0; let nextT = a.currentTime + 0.12; const sec16 = () => 60 / bpm.current / 4;
    const schedule = () => { const aa = ac.current; if (!aa) return; while (nextT < aa.currentTime + 0.13) { const st = s % 16; const sw = st % 2 === 1 ? swing.current * sec16() * 0.66 : 0; const t = nextT + sw; playStep(st, t); pending.current.push({ step: st, time: t }); nextT += sec16(); s = (s + 1) % 16; } };
    timer.current = window.setInterval(schedule, 25);
    setStarted(true);
  };

  const playStep = (st: number, t: number) => {
    const a = ac.current; if (!a) return; const v = vibe.current; const scale = minor.current ? SCALES.minor : SCALES.major; const en = enable.current; const r = rolls.current; const sec16 = 60 / bpm.current / 4;
    if (en.drums) {
      if (r.drums.kick[st]) { kick(a, bus.current.drums!, t); if (duck.current) { const d = duck.current.gain; d.cancelScheduledValues(t); d.setValueAtTime(0.4, t); d.linearRampToValueAtTime(1, t + 0.16); } }
      if (r.drums.snare[st]) snare(a, bus.current.drums!, t);
      if (r.drums.hat[st]) hat(a, bus.current.drums!, t, false);
      if (r.drums.open[st]) hat(a, bus.current.drums!, t, true);
    }
    if (en.bass && r.bass[st] >= 0) bass(a, bus.current.bass!, t, m2f(degMidi(scale, keyM.current, r.bass[st], BASS_OCT)), sec16 * 1.8);
    if (en.chord && r.chord[st] >= 0) { let gap = 1; while (gap < 16 && r.chord[(st + gap) % 16] < 0) gap++; const dur = v.pad ? gap * sec16 * 0.98 : sec16 * 1.1; chordPlay(a, bus.current.chord!, chordTones(scale, keyM.current, r.chord[st]).map(m2f), v, dur, v.pad ? 0.12 : 0.005, t); }
    if (en.mel && r.mel[st] >= 0) lead(a, bus.current.mel!, t, m2f(degMidi(scale, keyM.current, r.mel[st], MEL_OCT)), v, sec16 * 1.6);
  };

  const toggleMute = () => setMuted((m) => { const nm = !m; if (master.current && ac.current) master.current.gain.setTargetAtTime(nm ? 0 : 0.9, ac.current.currentTime, 0.03); return nm; });
  const toggleLayer = (k: "drums" | "bass" | "chord" | "mel") => { mute.current[k] = !mute.current[k]; setMuteUI({ ...mute.current }); };
  const setTab = (e: Editor) => { tab.current = e; setTabUI(e); };
  useEffect(() => () => { clearInterval(timer.current); try { ac.current?.close(); } catch {} }, []);

  useEffect(() => {
    const cv = canvasRef.current; if (!cv) return; const ctx = cv.getContext("2d"); if (!ctx) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const resize = () => { cv.width = innerWidth * dpr; cv.height = innerHeight * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); };
    resize(); addEventListener("resize", resize);
    const onDown = (e: PointerEvent) => {
      const g = grid.current; if (!g.on) return; const x = e.clientX - g.gx, y = e.clientY - g.gy; const col = Math.floor(x / g.cw), row = Math.floor(y / (g.rh + g.gap));
      if (col < 0 || col > 15 || row < 0 || row >= g.rows) return; const ed = editorRef.current; const r = rolls.current;
      if (ed === "drums") { const lane = DRUM_LANES[row]; r.drums[lane][col] = r.drums[lane][col] > 0 ? 0 : 1; }
      else { const deg = g.rows - 1 - row; const arr = ed === "bass" ? r.bass : ed === "chords" ? r.chord : r.mel; arr[col] = arr[col] === deg ? -1 : deg; }
    };
    cv.addEventListener("pointerdown", onDown);

    const gl = { d: 0.12, b: 0.12, c: 0.12, m: 0.12 }; let raf = 0, last = -1;
    const lerp = (a: number, x: number, k: number) => a + (x - a) * k;
    const loop = () => {
      const tr = trackRef.current; let p = 0; if (tr) { const dd = tr.offsetHeight - innerHeight; p = dd > 0 ? Math.min(1, Math.max(0, -tr.getBoundingClientRect().top / dd)) : 0; }
      const idx = Math.min(N - 1, Math.round(p * (N - 1)));
      if (idx !== last) { last = idx; setStep(idx); }
      const reach = { drums: idx >= 1, bass: idx >= 2, chord: idx >= 3, mel: idx >= 4 };
      enable.current = { drums: started && reach.drums && !mute.current.drums, bass: started && reach.bass && !mute.current.bass, chord: started && reach.chord && !mute.current.chord, mel: started && reach.mel && !mute.current.mel };
      if (ac.current) { const now = ac.current.currentTime; bus.current.drums?.gain.setTargetAtTime(enable.current.drums ? 0.9 : 0, now, 0.12); bus.current.bass?.gain.setTargetAtTime(enable.current.bass ? 0.95 : 0, now, 0.12); bus.current.chord?.gain.setTargetAtTime(enable.current.chord ? 0.42 : 0, now, 0.18); bus.current.mel?.gain.setTargetAtTime(enable.current.mel ? 0.5 : 0, now, 0.18); while (pending.current.length && pending.current[0].time <= now) curStep.current = pending.current.shift()!.step; if (pending.current.length > 40) pending.current.splice(0, pending.current.length - 40); }

      const sd = SECTIONS[idx]; const editor: Editor = idx === 6 ? tab.current : (sd.ed ?? "drums"); editorRef.current = editor;
      const scale = minor.current ? SCALES.minor : SCALES.major;
      const w = innerWidth, h = innerHeight; ctx.clearRect(0, 0, w, h);
      const grd = ctx.createLinearGradient(0, 0, 0, h); grd.addColorStop(0, "#FAFAF7"); grd.addColorStop(1, "#efe9fb"); ctx.fillStyle = grd; ctx.fillRect(0, 0, w, h);
      if (!started || idx < 1) { gl.d = 0; raf = requestAnimationFrame(loop); return; } // intro/„co je hudba" bez mřížky

      const rows = editor === "drums" ? 4 : editor === "chords" ? 7 : 8;
      const gw = Math.min(620, w * 0.82), gx = (w - gw) / 2, cw = gw / 16, rh = editor === "drums" ? 38 : 26, gap = editor === "drums" ? 12 : 6;
      const totalH = rows * (rh + gap) - gap, gy = h * 0.64 - totalH / 2;
      grid.current = { gx, gy, cw, rh, gap, rows, on: true };
      const cs = curStep.current;
      const laneActive = { drums: reach.drums, bass: reach.bass, chord: reach.chord, mel: reach.mel };
      const active = editor === "drums" ? laneActive.drums : editor === "bass" ? laneActive.bass : editor === "chords" ? laneActive.chord : laneActive.mel;
      const baseCol = editor === "bass" ? BASS_COL : editor === "chords" ? CHORD_COL : editor === "melody" ? MEL_COL : "";
      for (let r = 0; r < rows; r++) {
        const y = gy + r * (rh + gap); const deg = rows - 1 - r; const r2 = rolls.current;
        let label = ""; let col = baseCol;
        if (editor === "drums") { label = u.drums[DRUM_LANES[r]]; col = DRUM_COL[DRUM_LANES[r]]; }
        else if (editor === "chords") label = ROMAN[deg] + " · " + NOTE[degMidi(scale, keyM.current, deg, 0) % 12];
        else label = NOTE[degMidi(scale, keyM.current, deg, editor === "bass" ? BASS_OCT : MEL_OCT) % 12];
        for (let c = 0; c < 16; c++) {
          const on = editor === "drums" ? r2.drums[DRUM_LANES[r]][c] > 0 : (editor === "bass" ? r2.bass[c] : editor === "chords" ? r2.chord[c] : r2.mel[c]) === deg;
          if (c === cs) { ctx.globalAlpha = 0.07; ctx.fillStyle = INK; roundRect(ctx, gx + c * cw, y - (gap / 2), cw, rh + gap, 5); ctx.fill(); }
          ctx.globalAlpha = on ? (active ? 0.92 : 0.5) : (c % 4 === 0 ? 0.13 : 0.07); ctx.fillStyle = on ? col : INK;
          roundRect(ctx, gx + c * cw + 2.5, y + 3, cw - 5, rh - 6, 5); ctx.fill();
          if (on && c === cs) { ctx.globalAlpha = 0.85; ctx.fillStyle = "#fff"; roundRect(ctx, gx + c * cw + 2.5, y + 3, cw - 5, rh - 6, 5); ctx.fill(); }
        }
        ctx.globalAlpha = active ? 0.8 : 0.4; ctx.fillStyle = INK; ctx.font = "700 11px system-ui"; ctx.textAlign = "right"; ctx.fillText(label, gx - 10, y + rh / 2 + 4);
      }
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(loop);
    };
    loop();
    return () => { cancelAnimationFrame(raf); removeEventListener("resize", resize); cv.removeEventListener("pointerdown", onDown); };
  }, [started, N, u]);

  const sec = SECTIONS[step]; const txt = sec[lang];

  return (
    <>
      <div style={{ position: "fixed", inset: 0, zIndex: 0 }}><canvas ref={canvasRef} style={{ width: "100%", height: "100%", display: "block" }} /></div>

      <div style={{ position: "fixed", top: 16, left: 18, zIndex: 6 }}><Link href={homeHref} style={{ fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--text-muted)", textDecoration: "none" }}>{u.back}</Link></div>
      {started && <button onClick={toggleMute} aria-label={muted ? u.unmute : u.mute} style={{ position: "fixed", top: 14, right: 16, zIndex: 7, width: 42, height: 42, borderRadius: 12, border: `2.5px solid ${INK}`, background: "#fff", color: INK, boxShadow: `3px 3px 0 ${INK}`, cursor: "pointer", fontSize: 16 }}>{muted ? "🔇" : "🔊"}</button>}

      {/* tónina + dur/moll — pořád k dispozici */}
      {started && (
        <div style={{ position: "fixed", top: 14, left: "50%", transform: "translateX(-50%)", zIndex: 7, display: "flex", gap: 6, alignItems: "center", background: "rgba(255,255,255,0.7)", border: `1px solid rgba(26,22,20,0.12)`, borderRadius: 999, padding: "5px 8px", backdropFilter: "blur(10px)" }}>
          {KEYS.map((k) => <button key={k.m} onClick={() => { keyM.current = k.m; setKeyUI(k.m); }} style={mini(keyUI === k.m)}>{k.n}</button>)}
          <span style={{ width: 1, height: 16, background: "rgba(26,22,20,0.15)" }} />
          <button onClick={() => { minor.current = false; setMinorUI(false); }} style={mini(!minorUI)}>{u.major}</button>
          <button onClick={() => { minor.current = true; setMinorUI(true); }} style={mini(minorUI)}>{u.minor}</button>
        </div>
      )}

      {started && (
        <div style={{ position: "fixed", right: 16, top: "50%", transform: "translateY(-50%)", zIndex: 6, display: "flex", flexDirection: "column", gap: 7 }}>
          {SECTIONS.map((_, i) => <div key={i} style={{ width: i === step ? 9 : 6, height: i === step ? 9 : 6, borderRadius: "50%", background: i <= step ? INK : "rgba(26,22,20,0.25)", transition: "all .2s" }} />)}
        </div>
      )}

      {started && (
        <div style={{ position: "fixed", left: 0, right: 0, top: "24%", transform: "translateY(-50%)", zIndex: 5, display: "flex", justifyContent: "center", padding: "0 22px", pointerEvents: "none" }}>
          <div key={step} className="mb-card" style={{ maxWidth: 540, width: "100%", textAlign: "center", background: "rgba(255,255,255,0.72)", border: `1px solid rgba(26,22,20,0.1)`, borderRadius: 22, boxShadow: "0 16px 44px rgba(26,22,20,0.12)", padding: "16px 28px 18px", color: INK, backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)", pointerEvents: "auto" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 6 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#7b6cf6" }} />
              <span style={{ fontFamily: "var(--font-sans)", fontSize: 11, fontWeight: 700, letterSpacing: "0.24em", color: "var(--text-muted)" }}>{String(step + 1).padStart(2, "0")} / {String(N).padStart(2, "0")}</span>
            </div>
            <p style={{ ...display, fontSize: "clamp(21px,4.6vw,30px)", fontWeight: 700, letterSpacing: "-0.025em", marginBottom: 6 }}>{txt.t}</p>
            <p style={{ fontFamily: "var(--font-sans)", fontSize: 14.5, lineHeight: 1.5, color: "var(--text-secondary)" }}>{txt.p}</p>

            {(sec.interactive === "rhythm" || sec.interactive === "studio") && (<div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>{VIBES.map((v) => <button key={v.id} onClick={() => applyVibe(v)} style={pill(vibeUI === v.id)}>{v[lang]}</button>)}</div>
              <Row label={`${u.tempo} · ${bpmUI} BPM`}><input type="range" min={60} max={150} value={bpmUI} onChange={(e) => { const v = +e.target.value; bpm.current = v; setBpmUI(v); if (dly.current) dly.current.delayTime.value = (60 / v / 4) * 3; }} style={{ width: "100%", accentColor: INK }} /></Row>
              <Row label={`${u.swing} · ${swingUI}%`}><input type="range" min={0} max={60} value={swingUI} onChange={(e) => { const v = +e.target.value; swing.current = v / 100; setSwingUI(v); }} style={{ width: "100%", accentColor: INK }} /></Row>
            </div>)}
            {(sec.interactive === "mix" || sec.interactive === "studio") && (<div style={{ marginTop: 12, display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
              {(["drums", "bass", "chord", "mel"] as const).map((k) => <button key={k} onClick={() => toggleLayer(k)} style={pill(!muteUI[k])}>{u.layers[k]}</button>)}
            </div>)}
            {sec.interactive === "studio" && (<div style={{ marginTop: 10, display: "flex", gap: 6, justifyContent: "center", flexWrap: "wrap" }}>
              {(["drums", "bass", "chords", "melody"] as const).map((e) => <button key={e} onClick={() => setTab(e)} style={pill(tabUI === e)}>{u.edits[e]}</button>)}
            </div>)}
            {sec.ed && sec.interactive !== "mix" && <p style={{ fontFamily: "var(--font-sans)", fontSize: 12, fontWeight: 700, color: "var(--text-muted)", marginTop: 12 }}>{u.hint}</p>}
            {step === N - 1 && <Link href={homeHref} style={{ display: "inline-block", marginTop: 12, fontFamily: "var(--font-sans)", fontSize: 14, fontWeight: 700, color: INK, textDecoration: "underline", textUnderlineOffset: 3 }}>← Spaghetti.ltd</Link>}
          </div>
        </div>
      )}

      {started && step < N - 1 && <div style={{ position: "fixed", bottom: "2vh", left: "50%", transform: "translateX(-50%)", zIndex: 6, fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--text-muted)", animation: "mb-bob 2s ease-in-out infinite" }}>{u.scroll} ↓</div>}

      {!started && (
        <div style={{ position: "fixed", inset: 0, zIndex: 10, display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", padding: 24 }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", maxWidth: 640, width: "100%" }}>
            <p style={{ fontFamily: "var(--font-sans)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.28em", color: "var(--text-muted)", marginBottom: 26 }}>{u.eyebrow}</p>
            <MusicHero />
            <h1 style={{ ...display, fontSize: "clamp(36px,8.5vw,68px)", fontWeight: 700, letterSpacing: "-0.035em", lineHeight: 1.02, margin: "26px 0 28px" }}>{u.title}</h1>
            <button onClick={start} className="mb-start" style={{ background: INK, color: "#fff", border: `2.5px solid ${INK}`, borderRadius: 16, boxShadow: `5px 5px 0 ${INK}`, padding: "16px 42px", fontFamily: "var(--font-sans)", fontSize: 18, fontWeight: 700, cursor: "pointer" }}>{u.start}</button>
            <p style={{ fontFamily: "var(--font-sans)", fontSize: 12.5, lineHeight: 1.5, color: "var(--text-muted)", marginTop: 22, maxWidth: 360 }}>{u.audio}</p>
          </div>
        </div>
      )}

      <div ref={trackRef} style={{ height: started ? `${N * 100}vh` : "100vh" }} />
      <style>{`@keyframes mb-bob { 0%,100%{ transform:translateX(-50%) translateY(0);} 50%{ transform:translateX(-50%) translateY(6px);} } .mb-card{ animation: mb-in .5s cubic-bezier(.22,1,.36,1);} @keyframes mb-in{ from{opacity:0; transform:translateY(14px);} to{opacity:1; transform:none;} }
        .mb-start{ transition: transform .12s ease, box-shadow .12s ease; } .mb-start:hover{ transform:translate(-2px,-2px); box-shadow:7px 7px 0 ${INK}; } .mb-start:active{ transform:translate(2px,2px); box-shadow:2px 2px 0 ${INK}; }`}</style>
    </>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><div style={{ fontFamily: "var(--font-sans)", fontSize: 11, fontWeight: 700, color: "var(--text-muted)", marginBottom: 3, textAlign: "left" }}>{label}</div>{children}</div>;
}
const pill = (active: boolean): React.CSSProperties => ({ padding: "7px 14px", borderRadius: 999, border: `2px solid ${INK}`, background: active ? INK : "transparent", color: active ? "#fff" : INK, fontFamily: "var(--font-sans)", fontSize: 12, fontWeight: 700, cursor: "pointer" });
const mini = (active: boolean): React.CSSProperties => ({ padding: "4px 9px", borderRadius: 999, border: "none", background: active ? INK : "transparent", color: active ? "#fff" : INK, fontFamily: "var(--font-sans)", fontSize: 12, fontWeight: 700, cursor: "pointer" });

function MusicHero() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const cv = ref.current; if (!cv) return; const ctx = cv.getContext("2d"); if (!ctx) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1); const CH = 104; let w = 0;
    const fit = () => { w = Math.min(560, cv.parentElement?.clientWidth || 560); cv.style.width = w + "px"; cv.style.height = CH + "px"; cv.width = w * dpr; cv.height = CH * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); };
    fit(); const onR = () => fit(); addEventListener("resize", onR);
    let t = 0, raf = 0; const cols = ["#e8556d", "#f4a259", "#4eb4cf", "#7b6cf6"];
    const loop = () => {
      ctx.clearRect(0, 0, w, CH); const n = 22, bw = w / n, base = CH * 0.9;
      for (let i = 0; i < n; i++) { const hgt = (0.2 + 0.8 * Math.abs(Math.sin(t * 1.6 + i * 0.6) * Math.cos(t * 0.7 + i))) * CH * 0.7; ctx.globalAlpha = 0.85; ctx.fillStyle = cols[i % 4]; roundRect(ctx, i * bw + bw * 0.2, base - hgt, bw * 0.6, hgt, 3); ctx.fill(); }
      ctx.globalAlpha = 1; t += 0.03; raf = requestAnimationFrame(loop);
    };
    loop(); return () => { cancelAnimationFrame(raf); removeEventListener("resize", onR); };
  }, []);
  return <canvas ref={ref} style={{ display: "block", margin: "0 auto", width: "100%", maxWidth: 560 }} />;
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) { const rr = Math.min(r, h / 2, w / 2); ctx.beginPath(); ctx.moveTo(x + rr, y); ctx.arcTo(x + w, y, x + w, y + h, rr); ctx.arcTo(x + w, y + h, x, y + h, rr); ctx.arcTo(x, y + h, x, y, rr); ctx.arcTo(x, y, x + w, y, rr); ctx.closePath(); }
function shaperCurve(amount: number) { const n = 1024, c = new Float32Array(n); for (let i = 0; i < n; i++) { const x = (i / (n - 1)) * 2 - 1; c[i] = Math.tanh(x * amount) / Math.tanh(amount); } return c; }
function noise(a: AudioContext, sec: number) { const L = (a.sampleRate * sec) | 0; const b = a.createBuffer(1, L, a.sampleRate); const d = b.getChannelData(0); for (let i = 0; i < L; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / L, 1.5); return b; }
function kick(a: AudioContext, out: AudioNode, t: number) {
  const o = a.createOscillator(); o.type = "sine"; o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(46, t + 0.1);
  const g = a.createGain(); g.gain.setValueAtTime(1, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.34); o.connect(g).connect(out); o.start(t); o.stop(t + 0.36);
  const c = a.createOscillator(); c.type = "triangle"; c.frequency.value = 900; const cg = a.createGain(); cg.gain.setValueAtTime(0.45, t); cg.gain.exponentialRampToValueAtTime(0.001, t + 0.03); c.connect(cg).connect(out); c.start(t); c.stop(t + 0.04);
}
function snare(a: AudioContext, out: AudioNode, t: number) {
  const s = a.createBufferSource(); s.buffer = noise(a, 0.2); const bp = a.createBiquadFilter(); bp.type = "highpass"; bp.frequency.value = 1300; const g = a.createGain(); g.gain.setValueAtTime(0.7, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.17); s.connect(bp).connect(g).connect(out); s.start(t); s.stop(t + 0.19);
  const o = a.createOscillator(); o.type = "triangle"; o.frequency.setValueAtTime(190, t); o.frequency.exponentialRampToValueAtTime(130, t + 0.1); const og = a.createGain(); og.gain.setValueAtTime(0.5, t); og.gain.exponentialRampToValueAtTime(0.001, t + 0.12); o.connect(og).connect(out); o.start(t); o.stop(t + 0.14);
}
function hat(a: AudioContext, out: AudioNode, t: number, open: boolean) {
  const s = a.createBufferSource(); s.buffer = noise(a, 0.16); const hp = a.createBiquadFilter(); hp.type = "highpass"; hp.frequency.value = 7600; const g = a.createGain(); const dur = open ? 0.17 : 0.04; g.gain.setValueAtTime(0.5, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur); s.connect(hp).connect(g).connect(out); s.start(t); s.stop(t + dur + 0.02);
}
function bass(a: AudioContext, out: AudioNode, t: number, freq: number, dur: number) {
  const o = a.createOscillator(); o.type = "sawtooth"; o.frequency.value = freq; const lp = a.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.setValueAtTime(700, t); lp.frequency.exponentialRampToValueAtTime(150, t + dur * 0.8);
  const g = a.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.6, t + 0.02); g.gain.exponentialRampToValueAtTime(0.001, t + dur); o.connect(lp).connect(g).connect(out); o.start(t); o.stop(t + dur + 0.05);
  const sub = a.createOscillator(); sub.type = "sine"; sub.frequency.value = freq / 2; const sg = a.createGain(); sg.gain.setValueAtTime(0.0001, t); sg.gain.exponentialRampToValueAtTime(0.7, t + 0.02); sg.gain.exponentialRampToValueAtTime(0.001, t + dur); sub.connect(sg).connect(out); sub.start(t); sub.stop(t + dur + 0.05);
}
function chordPlay(a: AudioContext, out: AudioNode, freqs: number[], v: Vibe, dur: number, attack: number, t: number) {
  freqs.forEach((f) => {
    const lp = a.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = v.chordCut; lp.Q.value = 0.4;
    const g = a.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.1, t + attack); g.gain.setValueAtTime(0.1, t + Math.max(attack, dur * 0.6)); g.gain.exponentialRampToValueAtTime(0.001, t + dur); lp.connect(g).connect(out);
    [-5, 6].forEach((det) => { const o = a.createOscillator(); o.type = v.chordType; o.frequency.value = f; o.detune.value = det; o.connect(lp); o.start(t); o.stop(t + dur + 0.05); });
    const so = a.createOscillator(); so.type = "sine"; so.frequency.value = f; const sg = a.createGain(); sg.gain.setValueAtTime(0.0001, t); sg.gain.exponentialRampToValueAtTime(0.05, t + attack); sg.gain.exponentialRampToValueAtTime(0.001, t + dur); so.connect(sg).connect(out); so.start(t); so.stop(t + dur + 0.05);
  });
}
function lead(a: AudioContext, out: AudioNode, t: number, freq: number, v: Vibe, dur: number) {
  const o = a.createOscillator(); o.type = v.leadType; o.frequency.value = freq; const lp = a.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.setValueAtTime(3200, t); lp.frequency.exponentialRampToValueAtTime(1100, t + dur);
  const g = a.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.22, t + 0.012); g.gain.exponentialRampToValueAtTime(0.001, t + dur); o.connect(lp).connect(g).connect(out); o.start(t); o.stop(t + dur + 0.05);
}
