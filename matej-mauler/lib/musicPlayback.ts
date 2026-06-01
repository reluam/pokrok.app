import { STEPS, midiToFreq, type SongTracks, type NoteCell, type DrumCell, type Inst } from "./music";

/** Přehraje mix ve smyčce. notes mají start+len (doby). (Pouze klient.) */
export function startLoop(tracks: SongTracks, insts: { melody: Inst; bass: Inst; pluck: Inst }, tempo: number): () => void {
  const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const ctx = new Ctx();
  const master = ctx.createGain(); master.gain.value = 0.8; master.connect(ctx.destination);
  const beat = 60 / tempo;
  const bar = STEPS * beat;
  let stopped = false;
  let timer: ReturnType<typeof setTimeout>;

  const noteAt = (n: NoteCell, inst: Inst, time: number) => {
    const d = Math.max(0.05, n.len * beat * (0.55 + inst.rel * 0.4));
    const o = ctx.createOscillator(); const g = ctx.createGain();
    o.type = inst.wave; o.frequency.value = midiToFreq(n.midi);
    g.gain.setValueAtTime(0.0001, time);
    g.gain.linearRampToValueAtTime(inst.gain, time + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0008, time + d);
    o.connect(g).connect(master); o.start(time); o.stop(time + d + 0.02);
    if (inst.harm) {
      const o2 = ctx.createOscillator(); const g2 = ctx.createGain();
      o2.type = inst.wave; o2.frequency.value = midiToFreq(n.midi + 12);
      g2.gain.setValueAtTime(0.0001, time);
      g2.gain.linearRampToValueAtTime(inst.gain * 0.4, time + 0.012);
      g2.gain.exponentialRampToValueAtTime(0.0008, time + d * 0.7);
      o2.connect(g2).connect(master); o2.start(time); o2.stop(time + d);
    }
  };

  const drumAt = (h: DrumCell, time: number) => {
    if (h.lane === "kick") {
      const o = ctx.createOscillator(); const g = ctx.createGain();
      o.type = "sine"; o.frequency.setValueAtTime(150, time); o.frequency.exponentialRampToValueAtTime(45, time + 0.15);
      g.gain.setValueAtTime(0.42, time); g.gain.exponentialRampToValueAtTime(0.0008, time + 0.17);
      o.connect(g).connect(master); o.start(time); o.stop(time + 0.19);
    } else {
      const len = Math.ceil(ctx.sampleRate * 0.12);
      const buf = ctx.createBuffer(1, len, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let k = 0; k < len; k++) data[k] = Math.random() * 2 - 1;
      const src = ctx.createBufferSource(); src.buffer = buf;
      const filt = ctx.createBiquadFilter();
      filt.type = "highpass"; filt.frequency.value = h.lane === "clap" ? 1200 : 7000;
      const g = ctx.createGain();
      const dur = h.lane === "clap" ? 0.13 : 0.05;
      g.gain.setValueAtTime(h.lane === "clap" ? 0.26 : 0.16, time);
      g.gain.exponentialRampToValueAtTime(0.0008, time + dur);
      src.connect(filt).connect(g).connect(master); src.start(time); src.stop(time + dur + 0.02);
    }
  };

  const scheduleBar = (barStart: number) => {
    (["melody", "bass", "pluck"] as const).forEach((tr) => {
      for (const n of tracks[tr]) noteAt(n, insts[tr], barStart + n.start * beat);
    });
    for (const h of tracks.drums) drumAt(h, barStart + h.step * beat);
  };

  let next = ctx.currentTime + 0.12;
  const tick = () => { if (stopped) return; scheduleBar(next); next += bar; timer = setTimeout(tick, bar * 1000 - 60); };
  tick();
  return () => { stopped = true; clearTimeout(timer); try { ctx.close(); } catch {} };
}
