// Procedurální zvuky zdrojů hluku pro Sound Universe.
import type { SourceKind } from "./soundUniverse";

export function buildSource(ac: AudioContext, into: AudioNode, kind: SourceKind): () => void {
  const stops: (() => void)[] = [];
  const reg = (fn: () => void) => stops.push(fn);
  const noiseBuf = (sec = 2) => { const b = ac.createBuffer(1, (ac.sampleRate * sec) | 0, ac.sampleRate); const d = b.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; return b; };
  const loopNoise = (type: BiquadFilterType, freq: number, gain: number) => {
    const src = ac.createBufferSource(); src.buffer = noiseBuf(2); src.loop = true;
    const f = ac.createBiquadFilter(); f.type = type; f.frequency.value = freq;
    const g = ac.createGain(); g.gain.value = gain;
    src.connect(f).connect(g).connect(into); src.start();
    reg(() => { try { src.stop(); } catch {} });
    return { f, g };
  };
  const blip = (freq: number, dur: number, type: OscillatorType, peak: number, lp?: number) => {
    const o = ac.createOscillator(); o.type = type; o.frequency.value = freq;
    const g = ac.createGain(); g.gain.value = 0.0001; const tn = ac.currentTime;
    g.gain.setValueAtTime(0.0001, tn); g.gain.exponentialRampToValueAtTime(peak, tn + 0.01); g.gain.exponentialRampToValueAtTime(0.0008, tn + dur);
    let node: AudioNode = o; if (lp) { const f = ac.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = lp; o.connect(f); node = f; }
    node.connect(g).connect(into); o.start(tn); o.stop(tn + dur + 0.05);
    return { o, g };
  };
  const noiseHit = (type: BiquadFilterType, freq: number, dur: number, peak: number) => {
    const s = ac.createBufferSource(); s.buffer = noiseBuf(0.5); const f = ac.createBiquadFilter(); f.type = type; f.frequency.value = freq;
    const g = ac.createGain(); const tn = ac.currentTime; g.gain.setValueAtTime(peak, tn); g.gain.exponentialRampToValueAtTime(0.0006, tn + dur);
    s.connect(f).connect(g).connect(into); s.start(tn); s.stop(tn + dur + 0.05);
  };
  const every = (ms: number, fn: () => void) => { const id = setInterval(fn, ms); reg(() => clearInterval(id)); };

  switch (kind) {
    case "cars": {
      loopNoise("lowpass", 780, 0.5);
      every(700, () => { if (Math.random() < 0.45) return; const s = ac.createBufferSource(); s.buffer = noiseBuf(1); const bp = ac.createBiquadFilter(); bp.type = "bandpass"; bp.Q.value = 1.4; const g = ac.createGain(); const tn = ac.currentTime; bp.frequency.setValueAtTime(420, tn); bp.frequency.linearRampToValueAtTime(1300, tn + 0.45); bp.frequency.linearRampToValueAtTime(420, tn + 0.9); g.gain.setValueAtTime(0.0001, tn); g.gain.linearRampToValueAtTime(0.35, tn + 0.4); g.gain.linearRampToValueAtTime(0.0001, tn + 0.9); s.connect(bp).connect(g).connect(into); s.start(tn); s.stop(tn + 1); });
      break;
    }
    case "train": {
      loopNoise("lowpass", 220, 0.45);
      let on = true; every(170, () => { on = !on; if (on) noiseHit("highpass", 1600, 0.05, 0.3); });
      every(6500, () => { blip(220, 1.0, "sawtooth", 0.22, 1200); blip(294, 1.0, "sawtooth", 0.18, 1200); });
      break;
    }
    case "machinery": case "factory": {
      const o = ac.createOscillator(); o.type = "sawtooth"; o.frequency.value = 68; const f = ac.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = 420; const g = ac.createGain(); g.gain.value = 0.3; o.connect(f).connect(g).connect(into); o.start(); reg(() => { try { o.stop(); } catch {} });
      if (kind === "factory") loopNoise("highpass", 4000, 0.04);
      every(430, () => { blip(170, 0.12, "square", 0.28, 1400); noiseHit("bandpass", 2200, 0.08, 0.18); });
      break;
    }
    case "crowd": {
      const { g } = loopNoise("bandpass", 900, 0.42);
      const lfo = ac.createOscillator(); lfo.type = "sine"; lfo.frequency.value = 0.18; const la = ac.createGain(); la.gain.value = 0.18; lfo.connect(la).connect(g.gain); lfo.start(); reg(() => { try { lfo.stop(); } catch {} });
      break;
    }
    case "engine": {
      const o = ac.createOscillator(); o.type = "sawtooth"; const lfo = ac.createOscillator(); lfo.type = "sine"; lfo.frequency.value = 0.7; const la = ac.createGain(); la.gain.value = 90; o.frequency.value = 150; lfo.connect(la).connect(o.frequency); const f = ac.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = 1600; const g = ac.createGain(); g.gain.value = 0.3; o.connect(f).connect(g).connect(into); o.start(); lfo.start(); reg(() => { try { o.stop(); lfo.stop(); } catch {} });
      break;
    }
    case "dog": {
      every(750, () => { if (Math.random() < 0.4) return; const n = 1 + (Math.random() < 0.5 ? 1 : 0); for (let i = 0; i < n; i++) setTimeout(() => { blip(420 - Math.random() * 80, 0.16, "sawtooth", 0.32, 1500); noiseHit("bandpass", 900, 0.12, 0.12); }, i * 180); });
      break;
    }
    case "bell": {
      every(2600, () => { const f0 = 520; [1, 2.4, 3.9, 5.3].forEach((r, i) => { const o = ac.createOscillator(); o.type = "sine"; o.frequency.value = f0 * r; const g = ac.createGain(); const tn = ac.currentTime; const peak = 0.3 / (i + 1); g.gain.setValueAtTime(peak, tn); g.gain.exponentialRampToValueAtTime(0.0005, tn + 2.2); o.connect(g).connect(into); o.start(tn); o.stop(tn + 2.3); }); });
      break;
    }
    case "unit": {
      [100, 108].forEach((fr) => { const o = ac.createOscillator(); o.type = "sine"; o.frequency.value = fr; const g = ac.createGain(); g.gain.value = 0.12; o.connect(g).connect(into); o.start(); reg(() => { try { o.stop(); } catch {} }); });
      loopNoise("lowpass", 320, 0.05);
      break;
    }
    case "turbine": {
      const o = ac.createOscillator(); o.type = "sine"; o.frequency.value = 72; const g = ac.createGain(); g.gain.value = 0.18; o.connect(g).connect(into); o.start(); reg(() => { try { o.stop(); } catch {} });
      const { g: ng } = loopNoise("lowpass", 600, 0.12); const lfo = ac.createOscillator(); lfo.type = "sine"; lfo.frequency.value = 1.1; const la = ac.createGain(); la.gain.value = 0.1; lfo.connect(la).connect(ng.gain); lfo.start(); reg(() => { try { lfo.stop(); } catch {} });
      break;
    }
    case "club": {
      let step = 0; const bassNotes = [55, 55, 82, 65];
      every(130, () => { const s = step % 8; if (s % 2 === 0) { const o = ac.createOscillator(); o.type = "sine"; const g = ac.createGain(); const tn = ac.currentTime; o.frequency.setValueAtTime(150, tn); o.frequency.exponentialRampToValueAtTime(48, tn + 0.1); g.gain.setValueAtTime(0.9, tn); g.gain.exponentialRampToValueAtTime(0.001, tn + 0.18); o.connect(g).connect(into); o.start(tn); o.stop(tn + 0.2); } if (s % 2 === 1) noiseHit("highpass", 8000, 0.04, 0.12); if (s % 4 === 0) blip(bassNotes[(step >> 2) % bassNotes.length], 0.22, "sawtooth", 0.3, 700); step++; });
      break;
    }
    case "band": {
      const riff = [0, 0, 3, 5]; let i = 0;
      every(500, () => { const root = 110 * Math.pow(2, riff[i % riff.length] / 12); blip(root, 0.42, "sawtooth", 0.26, 1800); blip(root * 1.5, 0.42, "sawtooth", 0.18, 1800); const tn = ac.currentTime; const o = ac.createOscillator(); o.type = "sine"; const g = ac.createGain(); o.frequency.setValueAtTime(140, tn); o.frequency.exponentialRampToValueAtTime(50, tn + 0.1); g.gain.setValueAtTime(0.7, tn); g.gain.exponentialRampToValueAtTime(0.001, tn + 0.18); o.connect(g).connect(into); o.start(tn); o.stop(tn + 0.2); if (i % 2 === 1) noiseHit("highpass", 3000, 0.12, 0.2); i++; });
      break;
    }
    case "heli": {
      const o = ac.createOscillator(); o.type = "sawtooth"; o.frequency.value = 70; const src = ac.createBufferSource(); src.buffer = noiseBuf(2); src.loop = true; const nlp = ac.createBiquadFilter(); nlp.type = "lowpass"; nlp.frequency.value = 500; const chop = ac.createGain(); chop.gain.value = 0.5; const lfo = ac.createOscillator(); lfo.type = "square"; lfo.frequency.value = 13; const lg = ac.createGain(); lg.gain.value = 0.5; lfo.connect(lg).connect(chop.gain); const mix = ac.createGain(); mix.gain.value = 0.7; o.connect(mix); src.connect(nlp).connect(chop).connect(mix); mix.connect(into); o.start(); src.start(); lfo.start(); reg(() => { try { o.stop(); src.stop(); lfo.stop(); } catch {} });
      break;
    }
    case "gun": {
      every(1300, () => { if (Math.random() < 0.3) return; noiseHit("highpass", 900, 0.09, 0.8); blip(80, 0.12, "sine", 0.5); });
      break;
    }
    case "plane": {
      const { f } = loopNoise("lowpass", 700, 0.5); const lfo = ac.createOscillator(); lfo.type = "sine"; lfo.frequency.value = 0.12; const la = ac.createGain(); la.gain.value = 1100; lfo.connect(la); const base = ac.createConstantSource(); base.offset.value = 1500; base.connect(f.frequency); la.connect(f.frequency); lfo.start(); base.start(); reg(() => { try { lfo.stop(); base.stop(); } catch {} });
      const wh = ac.createOscillator(); wh.type = "sine"; wh.frequency.value = 1200; const wg = ac.createGain(); wg.gain.value = 0.06; wh.connect(wg).connect(into); wh.start(); reg(() => { try { wh.stop(); } catch {} });
      break;
    }
    case "stage": default: {
      const notes = [0, 4, 7, 12, 7, 4]; const root = 220; let s = 0;
      every(300, () => { blip(root * Math.pow(2, notes[s % notes.length] / 12), 0.34, "sawtooth", 0.45, 2200); s++; });
      break;
    }
  }
  return () => stops.forEach((s) => { try { s(); } catch {} });
}
