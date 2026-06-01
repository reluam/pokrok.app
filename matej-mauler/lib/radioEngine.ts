import {
  TOTAL, DRUM_IDS, MELODIC_IDS, midiToFreq, findVoice,
  type SongState, type DrumId, type LayerId, type Voice,
} from "./radio";

export type HitFn = (layer: LayerId, midi: number | null, whenSec: number) => void;

export type RadioControl = {
  stop: () => void;
  getProgress: () => number;
  analyser: AnalyserNode;
  audioTime: () => number;
};

function makeReverbIR(ctx: AudioContext, seconds: number): AudioBuffer {
  const len = Math.ceil(ctx.sampleRate * seconds);
  const buf = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6);
  }
  return buf;
}
function makeSaturation(): Float32Array<ArrayBuffer> {
  const n = 1024, c = new Float32Array(new ArrayBuffer(n * 4)), k = 2.2;
  for (let i = 0; i < n; i++) { const x = (i / (n - 1)) * 2 - 1; c[i] = Math.tanh(k * x) / Math.tanh(k); }
  return c;
}

export function createRadio(opts: { getState: () => SongState; onBar?: () => void; onHit?: HitFn; startStep?: number }): RadioControl {
  const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const ctx = new Ctx();
  if (ctx.state === "suspended") ctx.resume();

  // master chain: ... → saturace → limiter → analyser → out
  const analyser = ctx.createAnalyser(); analyser.fftSize = 2048;
  const limiter = ctx.createDynamicsCompressor();
  limiter.threshold.value = -8; limiter.knee.value = 6; limiter.ratio.value = 14; limiter.attack.value = 0.003; limiter.release.value = 0.18;
  const sat = ctx.createWaveShaper(); sat.curve = makeSaturation(); sat.oversample = "2x";
  const preMaster = ctx.createGain(); preMaster.gain.value = 0.9;
  preMaster.connect(sat); sat.connect(limiter); limiter.connect(analyser); analyser.connect(ctx.destination);

  // reverb
  const reverb = ctx.createConvolver(); reverb.buffer = makeReverbIR(ctx, 1.8);
  const reverbReturn = ctx.createGain(); reverbReturn.gain.value = 0.9;
  reverb.connect(reverbReturn); reverbReturn.connect(preMaster);

  // sidechain bus (melodika) + drumbus (bicí mimo duck)
  const musicBus = ctx.createGain(); musicBus.gain.value = 1; musicBus.connect(preMaster);
  const drumBus = ctx.createGain(); drumBus.gain.value = 1; drumBus.connect(preMaster);

  let step = opts.startStep ?? 0;
  let nextTime = ctx.currentTime + 0.15;
  let stopped = false;
  let timer: ReturnType<typeof setTimeout>;
  const stepDur = () => (60 / opts.getState().tempo) / 4;

  const duck = (t: number) => {
    const g = musicBus.gain; const dt = stepDur() * 3.4;
    g.cancelScheduledValues(t);
    g.setValueAtTime(0.32, t);
    g.linearRampToValueAtTime(1, t + dt);
  };

  const playVoice = (v: Voice, midi: number, durSec: number, t: number) => {
    const amp = ctx.createGain();
    const peak = v.gain;
    const sus = peak * v.s;
    const end = t + durSec;
    amp.gain.setValueAtTime(0.0001, t);
    amp.gain.linearRampToValueAtTime(peak, t + v.a);
    amp.gain.linearRampToValueAtTime(Math.max(0.0002, sus), t + v.a + v.d);
    const relStart = Math.max(t + v.a + v.d, end);
    amp.gain.setValueAtTime(Math.max(0.0002, v.s > 0 ? sus : 0.0002), relStart);
    amp.gain.exponentialRampToValueAtTime(0.0008, relStart + v.r);

    const filt = ctx.createBiquadFilter();
    filt.type = "lowpass"; filt.Q.value = v.q;
    filt.frequency.setValueAtTime(v.cutoff, t);
    if (v.cutoffEnv > 0) {
      filt.frequency.linearRampToValueAtTime(v.cutoff + v.cutoffEnv, t + v.a + 0.005);
      filt.frequency.exponentialRampToValueAtTime(Math.max(80, v.cutoff), t + v.a + v.d + 0.05);
    }

    amp.connect(filt);
    filt.connect(musicBus);
    if (v.reverb > 0) { const send = ctx.createGain(); send.gain.value = v.reverb; filt.connect(send); send.connect(reverb); }

    const freq = midiToFreq(midi);
    const stopT = relStart + v.r + 0.05;
    for (let i = 0; i < v.unison; i++) {
      const o = ctx.createOscillator(); o.type = v.osc; o.frequency.value = freq;
      if (v.unison > 1) o.detune.value = ((i / (v.unison - 1)) - 0.5) * v.detune * 2;
      o.connect(amp); o.start(t); o.stop(stopT);
    }
    if (v.sub) { const o = ctx.createOscillator(); o.type = "sine"; o.frequency.value = freq / 2; const sg = ctx.createGain(); sg.gain.value = 0.6; o.connect(sg); sg.connect(amp); o.start(t); o.stop(stopT); }
  };

  const playDrum = (id: DrumId, t: number) => {
    if (id === "kick") {
      duck(t);
      const o = ctx.createOscillator(); const g = ctx.createGain();
      o.type = "sine"; o.frequency.setValueAtTime(165, t); o.frequency.exponentialRampToValueAtTime(46, t + 0.11);
      g.gain.setValueAtTime(0.95, t); g.gain.exponentialRampToValueAtTime(0.0008, t + 0.2);
      o.connect(g).connect(drumBus); o.start(t); o.stop(t + 0.22);
      const cl = ctx.createOscillator(); const cg = ctx.createGain();
      cl.type = "square"; cl.frequency.value = 1400; cg.gain.setValueAtTime(0.25, t); cg.gain.exponentialRampToValueAtTime(0.0008, t + 0.02);
      cl.connect(cg).connect(drumBus); cl.start(t); cl.stop(t + 0.03);
      return;
    }
    const dur = id === "clap" ? 0.16 : id === "ohat" ? 0.2 : 0.04;
    const len = Math.ceil(ctx.sampleRate * dur);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let k = 0; k < len; k++) data[k] = (Math.random() * 2 - 1) * Math.pow(1 - k / len, id === "clap" ? 1.2 : 2.5);
    const src = ctx.createBufferSource(); src.buffer = buf;
    const filt = ctx.createBiquadFilter();
    filt.type = "highpass"; filt.frequency.value = id === "clap" ? 1100 : id === "ohat" ? 7000 : 9000; filt.Q.value = id === "clap" ? 1.2 : 0.7;
    const g = ctx.createGain(); g.gain.value = id === "clap" ? 0.5 : id === "ohat" ? 0.22 : 0.2;
    src.connect(filt).connect(g).connect(drumBus); src.start(t); src.stop(t + dur + 0.02);
    if (id === "clap") { const send = ctx.createGain(); send.gain.value = 0.25; g.connect(send); send.connect(reverb); }
  };

  const scheduleStep = (st: number, t: number) => {
    const state = opts.getState();
    const sd = stepDur();
    for (const id of DRUM_IDS) {
      const d = state.drums[id];
      if (!d.muted && d.pattern[st]) { playDrum(id, t); opts.onHit?.(id, null, t); }
    }
    for (const l of MELODIC_IDS) {
      const layer = state[l];
      if (layer.muted) continue;
      const v = findVoice(l, layer.inst);
      for (const n of layer.notes) if (n.step === st) { playVoice(v, n.midi, n.dur * sd, t); opts.onHit?.(l, n.midi, t); }
    }
  };

  const loop = () => {
    if (stopped) return;
    while (nextTime < ctx.currentTime + 0.16) {
      scheduleStep(step, nextTime);
      nextTime += stepDur();
      step = (step + 1) % TOTAL;
      if (step === 0) opts.onBar?.();
    }
    timer = setTimeout(loop, 25);
  };
  loop();

  return {
    stop: () => { stopped = true; clearTimeout(timer); try { ctx.close(); } catch {} },
    getProgress: () => step / TOTAL,
    analyser,
    audioTime: () => ctx.currentTime,
  };
}
