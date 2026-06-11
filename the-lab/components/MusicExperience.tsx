"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { Lang } from "@/lib/lang";

const INK = "#1a1614";
const sans = "var(--font-sans)";
const display: React.CSSProperties = { fontFamily: "var(--font-display)" };
type DrumLane = "kick" | "snare" | "hat" | "open";
const DRUM_LANES: DrumLane[] = ["kick", "snare", "hat", "open"];
const DRUM_COL: Record<DrumLane, string> = { kick: "#e8556d", snare: "#f4a259", hat: "#4eb4cf", open: "#56c596" };
const BASS_COL = "#7b6cf6", CHORD_COL = "#9b6cff", MEL_COL = "#ffb43c";
const NOTE = ["C", "C♯", "D", "D♯", "E", "F", "F♯", "G", "G♯", "A", "A♯", "B"];
const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII"];
type Layer = "drums" | "bass" | "chord" | "mel";
const LAYER_COL: Record<Layer, string> = { drums: "#e8556d", bass: BASS_COL, chord: CHORD_COL, mel: MEL_COL };
const FX_KEY: Record<Layer, "room" | "drive" | "reverb" | "delay"> = { drums: "room", bass: "drive", chord: "reverb", mel: "delay" };
const FXR = { room: [0, 0.4], drive: [1, 5], reverb: [0, 0.85], delay: [0, 0.6] } as const;

type Editor = "drums" | "bass" | "chords" | "melody";
const ED_LAYER: Record<Editor, Layer> = { drums: "drums", bass: "bass", chords: "chord", melody: "mel" };
type Rolls = { drums: Record<DrumLane, number[]>; bass: number[]; chord: number[]; mel: number[] };
const D = (...idx: number[]) => { const a = Array(16).fill(0); idx.forEach((i) => (a[i] = 1)); return a; };
const Rl = (pairs: [number, number][]) => { const a = Array(16).fill(-1); pairs.forEach(([i, d]) => (a[i] = d)); return a; };

type Vibe = { id: string; cs: string; en: string; bpm: number; swing: number; chordType: OscillatorType; leadType: OscillatorType; chordCut: number; rev: number; pad: boolean; rolls: () => Rolls };
const VIBES: Vibe[] = [
  { id: "lofi", cs: "lo-fi", en: "lo-fi", bpm: 76, swing: 0.2, chordType: "triangle", leadType: "sine", chordCut: 1300, rev: 0.42, pad: true,
    rolls: () => ({ drums: { kick: D(0, 6, 10), snare: D(4, 12), hat: D(2, 6, 10, 14, 15), open: D() }, bass: Rl([[0, 0], [4, 5], [8, 3], [12, 4], [14, 4]]), chord: Rl([[0, 0], [4, 5], [8, 3], [12, 4]]), mel: Rl([[2, 4], [6, 5], [9, 7], [12, 4], [14, 2]]) }) },
  { id: "house", cs: "house", en: "house", bpm: 122, swing: 0, chordType: "triangle", leadType: "square", chordCut: 1900, rev: 0.24, pad: false,
    rolls: () => ({ drums: { kick: D(0, 4, 8, 12), snare: D(4, 12), hat: D(2, 6, 10, 14), open: D(14) }, bass: Rl([[3, 5], [7, 3], [11, 0], [15, 4]]), chord: Rl([[2, 5], [6, 3], [10, 0], [14, 4]]), mel: Rl([[4, 4], [10, 6], [12, 4]]) }) },
  { id: "epic", cs: "epické", en: "epic", bpm: 86, swing: 0, chordType: "triangle", leadType: "triangle", chordCut: 1700, rev: 0.6, pad: true,
    rolls: () => ({ drums: { kick: D(0, 8), snare: D(8), hat: D(), open: D() }, bass: Rl([[0, 0], [8, 4]]), chord: Rl([[0, 0], [4, 4], [8, 5], [12, 3]]), mel: Rl([[6, 4], [12, 2]]) }) },
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
  { cs: { t: "Mix = fadery", p: "Skladba je vrstvy hrající spolu. Jako v DAW jim dole nastav hlasitost faderem a vypínej je tlačítkem mute." }, en: { t: "Mix = faders", p: "A track is layers playing together. Like in a DAW, set each one's volume with the fader below and silence it with mute." }, interactive: "mix", ed: "drums" },
  { cs: { t: "Studio — tvoř", p: "Teď jsi u kniplů. Všechny čtyři mřížky najednou, dole fader, mute a efekt (jeho účinek) u každé. Akordy i basa drží v ladění samy." }, en: { t: "Studio — make it", p: "Now you're at the controls. All four grids at once, with a fader, mute and effect (its amount) for each below. Chords and bass stay in tune by themselves." }, interactive: "studio" },
  { cs: { t: "Teď to umíš", p: "Hudba je chytře poskládaný zvuk — tep, spodek, nálada a příběh, sladěné do času. A ty teď víš jak na to." }, en: { t: "Now you get it", p: "Music is cleverly arranged sound — pulse, bottom, mood and story, locked in time. And now you know how." } },
];

const UI = {
  cs: { back: "← The Lab", eyebrow: "Hudební experience", title: "Jak vzniká hudba", start: "Start ▶", audio: "🔊 Zapni si zvuk a poskládej skladbu.", scroll: "scrolluj dolů", mute: "Ztlumit", unmute: "Zvuk", style: "styl", tempo: "tempo", swing: "swing", major: "dur", minor: "moll", drums: { kick: "kop", snare: "snare", hat: "hi-hat", open: "open" }, layers: { drums: "bicí", bass: "basa", chord: "akordy", mel: "melodie" }, fx: { room: "room", drive: "drive", reverb: "reverb", delay: "delay" }, on: "zap", off: "mute", hint: "👆 klikej do mřížky" },
  en: { back: "← The Lab", eyebrow: "A music experience", title: "How music is made", start: "Start ▶", audio: "🔊 Turn your sound on and build a track.", scroll: "scroll down", mute: "Mute", unmute: "Sound", style: "style", tempo: "tempo", swing: "swing", major: "major", minor: "minor", drums: { kick: "kick", snare: "snare", hat: "hi-hat", open: "open" }, layers: { drums: "drums", bass: "bass", chord: "chords", mel: "melody" }, fx: { room: "room", drive: "drive", reverb: "reverb", delay: "delay" }, on: "on", off: "mute", hint: "👆 click the grid" },
} as const;

export function MusicExperience({ lang }: { lang: Lang }) {
  const u = UI[lang]; const homeHref = "/"; const N = SECTIONS.length;
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
  const mute = useRef<Record<Layer, boolean>>({ drums: false, bass: false, chord: false, mel: false }); const [muteUI, setMuteUI] = useState<Record<Layer, boolean>>({ drums: false, bass: false, chord: false, mel: false });
  const vol = useRef<Record<Layer, number>>({ drums: 0.85, bass: 0.95, chord: 0.55, mel: 0.6 }); const [volUI, setVolUI] = useState<Record<Layer, number>>({ drums: 85, bass: 95, chord: 55, mel: 60 });
  const fx = useRef({ room: 0.12, drive: 1.6, reverb: 0.42, delay: 0.3 }); const [fxUI, setFxUI] = useState({ room: 30, drive: 15, reverb: 49, delay: 50 });
  const rolls = useRef<Rolls>(VIBES[0].rolls());

  const ac = useRef<AudioContext | null>(null);
  const bus = useRef<Record<Layer, GainNode | null>>({ drums: null, bass: null, chord: null, mel: null });
  const master = useRef<GainNode | null>(null); const duck = useRef<GainNode | null>(null);
  const nDrumRoom = useRef<GainNode | null>(null); const nChordRev = useRef<GainNode | null>(null); const nBassPre = useRef<GainNode | null>(null); const nMelSend = useRef<GainNode | null>(null); const dly = useRef<DelayNode | null>(null);
  const enable = useRef<Record<Layer, boolean>>({ drums: false, bass: false, chord: false, mel: false });
  const pending = useRef<{ step: number; time: number }[]>([]); const curStep = useRef(0);
  const grids = useRef<{ editor: Editor; gx: number; gy: number; cw: number; rh: number; gap: number; rows: number }[]>([]); const timer = useRef(0);

  const fxNode = (k: "room" | "drive" | "reverb" | "delay") => k === "room" ? nDrumRoom.current : k === "drive" ? nBassPre.current : k === "reverb" ? nChordRev.current : nMelSend.current;
  const applyVibe = (v: Vibe) => { vibe.current = v; setVibeUI(v.id); bpm.current = v.bpm; setBpmUI(v.bpm); swing.current = v.swing; setSwingUI(Math.round(v.swing * 100)); rolls.current = v.rolls(); fx.current.reverb = v.rev; setFxUI((f) => ({ ...f, reverb: Math.round((v.rev / FXR.reverb[1]) * 100) })); if (nChordRev.current && ac.current) nChordRev.current.gain.setTargetAtTime(v.rev, ac.current.currentTime, 0.1); if (dly.current) dly.current.delayTime.value = (60 / v.bpm / 4) * 3; };
  const setVol = (k: Layer, pct: number) => { vol.current[k] = pct / 100; setVolUI((s) => ({ ...s, [k]: pct })); };
  const setFx = (k: "room" | "drive" | "reverb" | "delay", pct: number) => { const [lo, hi] = FXR[k]; const v = lo + (pct / 100) * (hi - lo); fx.current[k] = v; setFxUI((s) => ({ ...s, [k]: pct })); const n = fxNode(k); if (n && ac.current) n.gain.setTargetAtTime(v, ac.current.currentTime, 0.05); };

  const start = () => {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const a = new AC(); ac.current = a;
    const comp = a.createDynamicsCompressor(); comp.threshold.value = -15; comp.ratio.value = 3; comp.attack.value = 0.004; comp.release.value = 0.25; comp.connect(a.destination);
    const ms = a.createGain(); ms.gain.value = muted ? 0 : 0.9; ms.connect(comp); master.current = ms;
    const conv = a.createConvolver(); const L = (a.sampleRate * 2.8) | 0; const b = a.createBuffer(2, L, a.sampleRate);
    for (let ch = 0; ch < 2; ch++) { const d = b.getChannelData(ch); for (let i = 0; i < L; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / L, 2.6); }
    conv.buffer = b; const rRet = a.createGain(); rRet.gain.value = 0.9; conv.connect(rRet).connect(ms);
    const dl = a.createDelay(0.9); dl.delayTime.value = (60 / bpm.current / 4) * 3; const fb = a.createGain(); fb.gain.value = 0.34; const dOut = a.createGain(); dOut.gain.value = 0.45; const dSend = a.createGain(); dSend.gain.value = fx.current.delay; dSend.connect(dl); dl.connect(fb); fb.connect(dl); dl.connect(dOut).connect(ms); dly.current = dl; nMelSend.current = dSend;
    // bicí: bus -> shaper -> master ; send do reverbu (room)
    const drumBus = a.createGain(); const drumShaper = a.createWaveShaper(); drumShaper.curve = shaperCurve(2.2); drumShaper.oversample = "2x"; drumBus.connect(drumShaper).connect(ms); const drumRoom = a.createGain(); drumRoom.gain.value = fx.current.room; drumBus.connect(drumRoom).connect(conv); bus.current.drums = drumBus; nDrumRoom.current = drumRoom;
    // basa: bus -> drive(pre) -> shaper -> sidechain -> master
    const bassBus = a.createGain(); const bassPre = a.createGain(); bassPre.gain.value = fx.current.drive; const bassDrive = a.createWaveShaper(); bassDrive.curve = shaperCurve(2.4); bassDrive.oversample = "2x"; const dk = a.createGain(); dk.gain.value = 1; bassBus.connect(bassPre).connect(bassDrive).connect(dk).connect(ms); bus.current.bass = bassBus; duck.current = dk; nBassPre.current = bassPre;
    // akordy: bus -> master ; send do reverbu
    const chordBus = a.createGain(); chordBus.connect(ms); const chordRev = a.createGain(); chordRev.gain.value = fx.current.reverb; chordBus.connect(chordRev).connect(conv); bus.current.chord = chordBus; nChordRev.current = chordRev;
    // melodie: bus -> master ; send do delaye
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
      if (r.drums.kick[st]) { kick(a, bus.current.drums!, t); if (duck.current) { const d = duck.current.gain; d.cancelScheduledValues(t); d.setValueAtTime(0.38, t); d.linearRampToValueAtTime(1, t + 0.16); } }
      if (r.drums.snare[st]) snare(a, bus.current.drums!, t);
      if (r.drums.hat[st]) hat(a, bus.current.drums!, t, false);
      if (r.drums.open[st]) hat(a, bus.current.drums!, t, true);
    }
    if (en.bass && r.bass[st] >= 0) bass(a, bus.current.bass!, t, m2f(degMidi(scale, keyM.current, r.bass[st], BASS_OCT)), sec16 * 1.8);
    if (en.chord && r.chord[st] >= 0) { let gap = 1; while (gap < 16 && r.chord[(st + gap) % 16] < 0) gap++; const dur = v.pad ? gap * sec16 * 0.98 : sec16 * 1.1; chordPlay(a, bus.current.chord!, chordTones(scale, keyM.current, r.chord[st]).map(m2f), v, dur, v.pad ? 0.12 : 0.005, t); }
    if (en.mel && r.mel[st] >= 0) lead(a, bus.current.mel!, t, m2f(degMidi(scale, keyM.current, r.mel[st], MEL_OCT)), v, sec16 * 1.6);
  };

  const toggleMute = () => setMuted((m) => { const nm = !m; if (master.current && ac.current) master.current.gain.setTargetAtTime(nm ? 0 : 0.9, ac.current.currentTime, 0.03); return nm; });
  const toggleLayer = (k: Layer) => { mute.current[k] = !mute.current[k]; setMuteUI({ ...mute.current }); };
  useEffect(() => () => { clearInterval(timer.current); try { ac.current?.close(); } catch {} }, []);

  useEffect(() => {
    const cv = canvasRef.current; if (!cv) return; const ctx = cv.getContext("2d"); if (!ctx) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const resize = () => { cv.width = innerWidth * dpr; cv.height = innerHeight * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); };
    resize(); addEventListener("resize", resize);
    const onDown = (e: PointerEvent) => {
      for (const g of grids.current) { const x = e.clientX - g.gx, y = e.clientY - g.gy; if (x < 0 || y < 0 || x > g.cw * 16 || y > g.rows * (g.rh + g.gap)) continue; const col = Math.floor(x / g.cw), row = Math.floor(y / (g.rh + g.gap)); if (col < 0 || col > 15 || row < 0 || row >= g.rows) continue; const r = rolls.current; if (g.editor === "drums") { const lane = DRUM_LANES[row]; r.drums[lane][col] = r.drums[lane][col] > 0 ? 0 : 1; } else { const deg = g.rows - 1 - row; const arr = g.editor === "bass" ? r.bass : g.editor === "chords" ? r.chord : r.mel; arr[col] = arr[col] === deg ? -1 : deg; } return; }
    };
    cv.addEventListener("pointerdown", onDown);

    let raf = 0, last = -1;
    const rowsOf = (e: Editor) => (e === "drums" ? 4 : e === "chords" ? 7 : 8);
    const loop = () => {
      const tr = trackRef.current; let p = 0; if (tr) { const dd = tr.offsetHeight - innerHeight; p = dd > 0 ? Math.min(1, Math.max(0, -tr.getBoundingClientRect().top / dd)) : 0; }
      const idx = Math.min(N - 1, Math.round(p * (N - 1)));
      if (idx !== last) { last = idx; setStep(idx); }
      const reach = { drums: idx >= 1, bass: idx >= 2, chord: idx >= 3, mel: idx >= 4 };
      (["drums", "bass", "chord", "mel"] as Layer[]).forEach((k) => (enable.current[k] = started && reach[k] && !mute.current[k]));
      if (ac.current) { const now = ac.current.currentTime; (["drums", "bass", "chord", "mel"] as Layer[]).forEach((k) => bus.current[k]?.gain.setTargetAtTime(enable.current[k] ? vol.current[k] : 0, now, 0.12)); while (pending.current.length && pending.current[0].time <= now) curStep.current = pending.current.shift()!.step; if (pending.current.length > 40) pending.current.splice(0, pending.current.length - 40); }

      const scale = minor.current ? SCALES.minor : SCALES.major;
      const w = innerWidth, h = innerHeight; ctx.clearRect(0, 0, w, h);
      const grd = ctx.createLinearGradient(0, 0, 0, h); grd.addColorStop(0, "#FAFAF7"); grd.addColorStop(1, "#efe9fb"); ctx.fillStyle = grd; ctx.fillRect(0, 0, w, h);
      grids.current = [];
      if (!started || idx < 1) { raf = requestAnimationFrame(loop); return; }

      const cs = curStep.current;
      const paint = (editor: Editor, gx: number, gy: number, cw: number, rh: number, gap: number, rows: number, active: boolean) => {
        const baseCol = editor === "bass" ? BASS_COL : editor === "chords" ? CHORD_COL : editor === "melody" ? MEL_COL : "";
        for (let r = 0; r < rows; r++) {
          const y = gy + r * (rh + gap); const deg = rows - 1 - r; const r2 = rolls.current; let label = ""; let col = baseCol;
          if (editor === "drums") { label = u.drums[DRUM_LANES[r]]; col = DRUM_COL[DRUM_LANES[r]]; }
          else if (editor === "chords") label = ROMAN[deg];
          else label = NOTE[degMidi(scale, keyM.current, deg, editor === "bass" ? BASS_OCT : MEL_OCT) % 12];
          for (let c = 0; c < 16; c++) {
            const on = editor === "drums" ? r2.drums[DRUM_LANES[r]][c] > 0 : (editor === "bass" ? r2.bass[c] : editor === "chords" ? r2.chord[c] : r2.mel[c]) === deg;
            if (c === cs) { ctx.globalAlpha = 0.07; ctx.fillStyle = INK; roundRect(ctx, gx + c * cw, y - gap / 2, cw, rh + gap, 4); ctx.fill(); }
            ctx.globalAlpha = on ? (active ? 0.92 : 0.4) : (c % 4 === 0 ? 0.13 : 0.07); ctx.fillStyle = on ? col : INK;
            roundRect(ctx, gx + c * cw + 2, y + 2, cw - 4, rh - 4, 4); ctx.fill();
            if (on && c === cs) { ctx.globalAlpha = 0.85; ctx.fillStyle = "#fff"; roundRect(ctx, gx + c * cw + 2, y + 2, cw - 4, rh - 4, 4); ctx.fill(); }
          }
          ctx.globalAlpha = active ? 0.8 : 0.36; ctx.fillStyle = INK; ctx.font = `700 ${rh < 16 ? 9 : 11}px system-ui`; ctx.textAlign = "right"; ctx.fillText(label, gx - 8, y + rh / 2 + 3);
        }
        ctx.globalAlpha = 1;
      };

      const gw = Math.min(620, w * 0.82), gx = (w - gw) / 2, cw = gw / 16;
      if (idx === 6) {
        const eds: Editor[] = ["drums", "bass", "chords", "melody"]; const rh = 9, gap = 2, groupGap = 13;
        const totalH = eds.reduce((sm, e) => sm + rowsOf(e) * (rh + gap) - gap + groupGap, 0) - groupGap;
        let yy = h * 0.56 - totalH / 2;
        for (const e of eds) { const rows = rowsOf(e); paint(e, gx, yy, cw, rh, gap, rows, !mute.current[ED_LAYER[e]]); grids.current.push({ editor: e, gx, gy: yy, cw, rh, gap, rows }); yy += rows * (rh + gap) - gap + groupGap; }
      } else {
        const editor = (SECTIONS[idx].ed ?? "drums"); const rows = rowsOf(editor); const rh = editor === "drums" ? 36 : 24, gap = editor === "drums" ? 10 : 6;
        const totalH = rows * (rh + gap) - gap, gy = h * 0.58 - totalH / 2;
        paint(editor, gx, gy, cw, rh, gap, rows, enable.current[ED_LAYER[editor]]); grids.current.push({ editor, gx, gy, cw, rh, gap, rows });
      }
      raf = requestAnimationFrame(loop);
    };
    loop();
    return () => { cancelAnimationFrame(raf); removeEventListener("resize", resize); cv.removeEventListener("pointerdown", onDown); };
  }, [started, N, u]);

  const sec = SECTIONS[step]; const txt = sec[lang];
  const showMixer = started && (sec.interactive === "mix" || sec.interactive === "studio"); const showFx = sec.interactive === "studio";

  return (
    <>
      <div style={{ position: "fixed", inset: 0, zIndex: 0 }}><canvas ref={canvasRef} style={{ width: "100%", height: "100%", display: "block" }} /></div>

      <div style={{ position: "fixed", top: 16, left: 18, zIndex: 6 }}><Link href={homeHref} style={{ fontFamily: sans, fontSize: 12, color: "var(--text-muted)", textDecoration: "none" }}>{u.back}</Link></div>
      {started && <button onClick={toggleMute} aria-label={muted ? u.unmute : u.mute} style={{ position: "fixed", top: 14, right: 16, zIndex: 7, width: 42, height: 42, borderRadius: 12, border: `2.5px solid ${INK}`, background: "#fff", color: INK, boxShadow: `3px 3px 0 ${INK}`, cursor: "pointer", fontSize: 16 }}>{muted ? "🔇" : "🔊"}</button>}

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
        <div style={{ position: "fixed", left: 0, right: 0, top: "23%", transform: "translateY(-50%)", zIndex: 5, display: "flex", justifyContent: "center", padding: "0 22px", pointerEvents: "none" }}>
          <div key={step} className="mb-card" style={{ maxWidth: 540, width: "100%", textAlign: "center", background: "rgba(255,255,255,0.72)", border: `1px solid rgba(26,22,20,0.1)`, borderRadius: 22, boxShadow: "0 16px 44px rgba(26,22,20,0.12)", padding: "15px 28px 16px", color: INK, backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)", pointerEvents: "auto" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 5 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#7b6cf6" }} />
              <span style={{ fontFamily: sans, fontSize: 11, fontWeight: 700, letterSpacing: "0.24em", color: "var(--text-muted)" }}>{String(step + 1).padStart(2, "0")} / {String(N).padStart(2, "0")}</span>
            </div>
            <p style={{ ...display, fontSize: "clamp(20px,4.4vw,28px)", fontWeight: 700, letterSpacing: "-0.025em", marginBottom: 5 }}>{txt.t}</p>
            <p style={{ fontFamily: sans, fontSize: 14, lineHeight: 1.48, color: "var(--text-secondary)" }}>{txt.p}</p>

            {(sec.interactive === "rhythm" || sec.interactive === "studio") && (<div style={{ marginTop: 11, display: "flex", flexDirection: "column", gap: 7 }}>
              <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>{VIBES.map((v) => <button key={v.id} onClick={() => applyVibe(v)} style={pill(vibeUI === v.id)}>{v[lang]}</button>)}</div>
              <Row label={`${u.tempo} · ${bpmUI} BPM`}><input type="range" min={60} max={150} value={bpmUI} onChange={(e) => { const v = +e.target.value; bpm.current = v; setBpmUI(v); if (dly.current) dly.current.delayTime.value = (60 / v / 4) * 3; }} style={{ width: "100%", accentColor: INK }} /></Row>
              <Row label={`${u.swing} · ${swingUI}%`}><input type="range" min={0} max={60} value={swingUI} onChange={(e) => { const v = +e.target.value; swing.current = v / 100; setSwingUI(v); }} style={{ width: "100%", accentColor: INK }} /></Row>
            </div>)}
            {sec.ed && sec.interactive !== "mix" && sec.interactive !== "studio" && <p style={{ fontFamily: sans, fontSize: 12, fontWeight: 700, color: "var(--text-muted)", marginTop: 10 }}>{u.hint}</p>}
            {step === N - 1 && <Link href={homeHref} style={{ display: "inline-block", marginTop: 10, fontFamily: sans, fontSize: 14, fontWeight: 700, color: INK, textDecoration: "underline", textUnderlineOffset: 3 }}>← The Lab</Link>}
          </div>
        </div>
      )}

      {/* DAW mixer */}
      {showMixer && (
        <div style={{ position: "fixed", left: 0, right: 0, bottom: "8vh", zIndex: 6, display: "flex", justifyContent: "center", padding: "0 16px" }}>
          <div style={{ display: "flex", gap: 10, background: "rgba(255,255,255,0.78)", border: `1px solid rgba(26,22,20,0.12)`, borderRadius: 16, boxShadow: "0 10px 30px rgba(26,22,20,0.1)", padding: "10px 14px", backdropFilter: "blur(12px)" }}>
            {(["drums", "bass", "chord", "mel"] as Layer[]).map((k) => (
              <Strip key={k} label={u.layers[k]} color={LAYER_COL[k]} vol={volUI[k]} onVol={(v) => setVol(k, v)} muted={muteUI[k]} onMute={() => toggleLayer(k)} on={u.on} off={u.off}
                fx={showFx ? { label: u.fx[FX_KEY[k]], pct: fxUI[FX_KEY[k]], on: (v: number) => setFx(FX_KEY[k], v) } : undefined} />
            ))}
          </div>
        </div>
      )}

      {started && step < N - 1 && !showMixer && <div style={{ position: "fixed", bottom: "2vh", left: "50%", transform: "translateX(-50%)", zIndex: 6, fontFamily: sans, fontSize: 12, color: "var(--text-muted)", animation: "mb-bob 2s ease-in-out infinite" }}>{u.scroll} ↓</div>}

      {!started && (
        <div style={{ position: "fixed", inset: 0, zIndex: 10, display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", padding: 24 }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", maxWidth: 640, width: "100%" }}>
            <p style={{ fontFamily: sans, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.28em", color: "var(--text-muted)", marginBottom: 26 }}>{u.eyebrow}</p>
            <MusicHero />
            <h1 style={{ ...display, fontSize: "clamp(36px,8.5vw,68px)", fontWeight: 700, letterSpacing: "-0.035em", lineHeight: 1.02, margin: "26px 0 28px" }}>{u.title}</h1>
            <button onClick={start} className="mb-start" style={{ background: INK, color: "#fff", border: `2.5px solid ${INK}`, borderRadius: 16, boxShadow: `5px 5px 0 ${INK}`, padding: "16px 42px", fontFamily: sans, fontSize: 18, fontWeight: 700, cursor: "pointer" }}>{u.start}</button>
            <p style={{ fontFamily: sans, fontSize: 12.5, lineHeight: 1.5, color: "var(--text-muted)", marginTop: 22, maxWidth: 360 }}>{u.audio}</p>
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
  return <div><div style={{ fontFamily: sans, fontSize: 11, fontWeight: 700, color: "var(--text-muted)", marginBottom: 3, textAlign: "left" }}>{label}</div>{children}</div>;
}
function Strip({ label, color, vol, onVol, muted, onMute, on, off, fx }: { label: string; color: string; vol: number; onVol: (v: number) => void; muted: boolean; onMute: () => void; on: string; off: string; fx?: { label: string; pct: number; on: (v: number) => void } }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5, width: 92 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 5 }}><span style={{ width: 7, height: 7, borderRadius: "50%", background: color }} /><span style={{ fontFamily: sans, fontSize: 11, fontWeight: 700 }}>{label}</span></div>
      <input type="range" min={0} max={100} value={vol} onChange={(e) => onVol(+e.target.value)} style={{ width: "100%", accentColor: INK }} />
      {fx && <div style={{ width: "100%" }}><div style={{ fontFamily: sans, fontSize: 9, fontWeight: 700, color: "var(--text-muted)", textAlign: "center" }}>{fx.label}</div><input type="range" min={0} max={100} value={fx.pct} onChange={(e) => fx.on(+e.target.value)} style={{ width: "100%", accentColor: color }} /></div>}
      <button onClick={onMute} style={{ padding: "2px 10px", borderRadius: 999, fontFamily: sans, fontSize: 10, fontWeight: 700, cursor: "pointer", border: `1.5px solid ${muted ? "#e8556d" : INK}`, background: muted ? "#e8556d" : "transparent", color: muted ? "#fff" : INK }}>{muted ? off : on}</button>
    </div>
  );
}
const pill = (active: boolean): React.CSSProperties => ({ padding: "7px 14px", borderRadius: 999, border: `2px solid ${INK}`, background: active ? INK : "transparent", color: active ? "#fff" : INK, fontFamily: sans, fontSize: 12, fontWeight: 700, cursor: "pointer" });
const mini = (active: boolean): React.CSSProperties => ({ padding: "4px 9px", borderRadius: 999, border: "none", background: active ? INK : "transparent", color: active ? "#fff" : INK, fontFamily: sans, fontSize: 12, fontWeight: 700, cursor: "pointer" });

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
