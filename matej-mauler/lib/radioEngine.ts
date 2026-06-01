import {
  TOTAL, DRUM_IDS, MELODIC_IDS, midiToFreq, findRInst, randomMutate, genSong,
  type SongState, type DrumId, type LayerId, type RInst,
} from "./radio";

export type HitFn = (layer: LayerId, midi: number | null, whenSec: number) => void;
export type ChangeFn = (state: SongState, label: { cs: string; en: string }) => void;

export type RadioControl = {
  stop: () => void;
  getState: () => SongState;
  getProgress: () => number; // 0..1 v rámci loopu
  analyser: AnalyserNode;
  audioTime: () => number;
};

export function createRadio(opts: { initial?: SongState; mutate?: (s: SongState) => { state: SongState; label: { cs: string; en: string } }; onHit?: HitFn; onChange?: ChangeFn }): RadioControl {
  const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const ctx = new Ctx();
  if (ctx.state === "suspended") ctx.resume();

  const master = ctx.createGain(); master.gain.value = 0.85;
  const analyser = ctx.createAnalyser(); analyser.fftSize = 1024;
  master.connect(analyser); analyser.connect(ctx.destination);

  let state = opts.initial ?? genSong();
  const mutate = opts.mutate ?? randomMutate;
  let step = 0;
  let nextTime = ctx.currentTime + 0.12;
  let stopped = false;
  let timer: ReturnType<typeof setTimeout>;

  const stepDur = () => (60 / state.tempo) / 4; // šestnáctina

  const env = (gain: number, attack: number, rel: number, t: number, dur: number) => {
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(gain, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0008, t + Math.max(attack + 0.02, dur * rel + 0.05));
    return g;
  };

  const playNote = (inst: RInst, midi: number, durSec: number, t: number) => {
    const g = env(inst.gain, inst.attack, inst.rel, t, durSec);
    const o = ctx.createOscillator();
    o.type = inst.wave; o.frequency.value = midiToFreq(midi);
    o.connect(g).connect(master);
    o.start(t); o.stop(t + durSec * inst.rel + 0.1);
    if (inst.harm) {
      const g2 = env(inst.gain * inst.harm, inst.attack, inst.rel * 0.7, t, durSec);
      const o2 = ctx.createOscillator(); o2.type = inst.wave; o2.frequency.value = midiToFreq(midi + 12);
      o2.connect(g2).connect(master); o2.start(t); o2.stop(t + durSec * inst.rel + 0.1);
    }
  };

  const playDrum = (id: DrumId, t: number) => {
    if (id === "kick") {
      const o = ctx.createOscillator(); const g = ctx.createGain();
      o.type = "sine"; o.frequency.setValueAtTime(155, t); o.frequency.exponentialRampToValueAtTime(45, t + 0.13);
      g.gain.setValueAtTime(0.5, t); g.gain.exponentialRampToValueAtTime(0.0008, t + 0.16);
      o.connect(g).connect(master); o.start(t); o.stop(t + 0.18);
      return;
    }
    const dur = id === "snare" ? 0.16 : id === "clap" ? 0.13 : 0.05;
    const len = Math.ceil(ctx.sampleRate * dur);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let k = 0; k < len; k++) data[k] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource(); src.buffer = buf;
    const filt = ctx.createBiquadFilter();
    filt.type = "highpass"; filt.frequency.value = id === "hihat" ? 8000 : id === "clap" ? 1100 : 1800;
    const g = ctx.createGain();
    g.gain.setValueAtTime(id === "hihat" ? 0.16 : 0.28, t);
    g.gain.exponentialRampToValueAtTime(0.0008, t + dur);
    src.connect(filt).connect(g).connect(master); src.start(t); src.stop(t + dur + 0.02);
    if (id === "snare") {
      const o = ctx.createOscillator(); const g2 = ctx.createGain();
      o.type = "triangle"; o.frequency.setValueAtTime(220, t); o.frequency.exponentialRampToValueAtTime(160, t + 0.1);
      g2.gain.setValueAtTime(0.14, t); g2.gain.exponentialRampToValueAtTime(0.0008, t + 0.12);
      o.connect(g2).connect(master); o.start(t); o.stop(t + 0.13);
    }
  };

  const scheduleStep = (st: number, t: number) => {
    const sd = stepDur();
    for (const id of DRUM_IDS) {
      const d = state.drums[id];
      if (!d.muted && d.pattern[st]) { playDrum(id, t); opts.onHit?.(id, null, t); }
    }
    for (const l of MELODIC_IDS) {
      const layer = state[l];
      if (layer.muted) continue;
      const inst = findRInst(l, layer.inst);
      for (const n of layer.notes) {
        if (n.step === st) { playNote(inst, n.midi, n.dur * sd, t); opts.onHit?.(l, n.midi, t); }
      }
    }
  };

  const loop = () => {
    if (stopped) return;
    while (nextTime < ctx.currentTime + 0.14) {
      scheduleStep(step, nextTime);
      nextTime += stepDur();
      step = (step + 1) % TOTAL;
      if (step === 0) {
        const m = mutate(state);
        state = m.state;
        opts.onChange?.(state, m.label);
      }
    }
    timer = setTimeout(loop, 25);
  };
  loop();

  return {
    stop: () => { stopped = true; clearTimeout(timer); try { ctx.close(); } catch {} },
    getState: () => state,
    getProgress: () => step / TOTAL,
    analyser,
    audioTime: () => ctx.currentTime,
  };
}
