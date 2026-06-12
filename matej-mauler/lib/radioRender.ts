/* ── Render: stav skladby → zmasterovaný WAV segment ────────────────
   Čistý DSP v Node (žádné WebAudio): syntéza po vzorcích, sidechain,
   ping-pong delay, Schroederův reverb a master řetěz (HP → kompresor
   → saturace → normalizace). Deterministické podle čísla kola. */

import { mkRng, scaleOf, midiToFreq, degMidi, roundBars, type SongState, type LeadVoice } from "./radioComposer";

const SR = 44100;
const TAU = Math.PI * 2;

/* ── pomocné ── */
class LP1 { y = 0; a: number; constructor(fc: number) { this.a = 1 - Math.exp((-TAU * fc) / SR); } run(x: number) { this.y += this.a * (x - this.y); return this.y; } }
class HP1 { lp: LP1; constructor(fc: number) { this.lp = new LP1(fc); } run(x: number) { return x - this.lp.run(x); } }

function addNote(buf: Float32Array, at: number, dur: number, gen: (i: number, n: number) => number) {
  const start = Math.max(0, Math.floor(at * SR));
  const n = Math.min(Math.floor(dur * SR), buf.length - start);
  for (let i = 0; i < n; i++) buf[start + i] += gen(i, n);
}

/* ── bicí ── */
function kick(buf: Float32Array, at: number) {
  addNote(buf, at, 0.32, (i) => {
    const t = i / SR;
    const f = 44 + 110 * Math.exp(-t * 38);
    const a = Math.exp(-t * 11);
    const click = i < 90 ? (1 - i / 90) * 0.5 : 0;
    return (Math.sin(TAU * f * t - Math.cos(TAU * f * t) * 0.3) * a + click) * 0.95;
  });
}
function clap(buf: Float32Array, at: number, rng: () => number) {
  const bp = new LP1(3600), hp = new HP1(900);
  addNote(buf, at, 0.24, (i) => {
    const t = i / SR;
    const burst = t < 0.03 ? 1 : t < 0.042 ? 0.8 : t < 0.054 ? 0.65 : Math.exp(-(t - 0.054) * 26);
    return hp.run(bp.run((rng() * 2 - 1))) * burst * 1.5;
  });
}
function hat(buf: Float32Array, at: number, open: boolean, rng: () => number) {
  const hp = new HP1(7800);
  const dur = open ? 0.24 : 0.05;
  addNote(buf, at, dur, (i) => {
    const t = i / SR;
    return hp.run(rng() * 2 - 1) * Math.exp(-t * (open ? 16 : 70)) * 0.5;
  });
}

/* ── basa: saw+sub s filtrem ── */
function bassNote(buf: Float32Array, at: number, dur: number, freq: number) {
  const lp = new LP1(320);
  addNote(buf, at, dur + 0.03, (i, n) => {
    const t = i / SR;
    const ph = freq * t;
    const saw = 2 * (ph - Math.floor(ph + 0.5));
    const sub = Math.sin(TAU * freq * 0.5 * t);
    const env = Math.min(1, i / (0.004 * SR)) * (i > n - 0.02 * SR ? (n - i) / (0.02 * SR) : 1);
    const cut = lp.run(saw * Math.exp(-t * 7) + saw * 0.18);
    return Math.tanh((cut * 1.3 + sub * 0.85) * 1.5) * env * 0.8;
  });
}

/* ── lead hlasy ── */
function leadNote(buf: Float32Array, at: number, dur: number, freq: number, voice: LeadVoice) {
  if (voice === "bell") {
    addNote(buf, at, Math.max(dur, 0.45), (i) => {
      const t = i / SR;
      const a = Math.exp(-t * 5);
      return (Math.sin(TAU * freq * t) + Math.sin(TAU * freq * 2.76 * t) * 0.35 * Math.exp(-t * 9)) * a * 0.5;
    });
    return;
  }
  const lp = new LP1(voice === "keys" ? 1900 : 2600);
  addNote(buf, at, dur + 0.04, (i, n) => {
    const t = i / SR;
    const det = voice === "keys" || voice === "saw" ? 1.006 : 1;
    const p1 = freq * t, p2 = freq * det * t;
    let x: number;
    if (voice === "pluck") x = (2 * (p1 - Math.floor(p1 + 0.5))) * Math.exp(-t * 9) + Math.sin(TAU * freq * t) * 0.3;
    else x = (2 * (p1 - Math.floor(p1 + 0.5)) + 2 * (p2 - Math.floor(p2 + 0.5))) * 0.55;
    const env = Math.min(1, i / (0.006 * SR)) * (voice === "pluck" ? 1 : Math.exp(-t * 1.2)) * (i > n - 0.03 * SR ? (n - i) / (0.03 * SR) : 1);
    return lp.run(x) * env * (voice === "pluck" ? 0.55 : 0.4);
  });
}

/* ── pad: široký akord (L/R rozladěné) ── */
function pad(bufL: Float32Array, bufR: Float32Array, at: number, dur: number, freqs: number[], gain: number) {
  const lpL = new LP1(1100), lpR = new LP1(1100);
  const start = Math.floor(at * SR), n = Math.min(Math.floor(dur * SR), bufL.length - start);
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const env = Math.min(1, t / 0.4) * (i > n - 0.25 * SR ? (n - i) / (0.25 * SR) : 1);
    let l = 0, r = 0;
    for (const f of freqs) {
      const pL = f * 0.9965 * t, pR = f * 1.0035 * t;
      l += 2 * (pL - Math.floor(pL + 0.5));
      r += 2 * (pR - Math.floor(pR + 0.5));
    }
    bufL[start + i] += lpL.run(l / freqs.length) * env * gain;
    bufR[start + i] += lpR.run(r / freqs.length) * env * gain;
  }
}

/* ── Schroeder reverb (mono in → stereo out) ── */
function reverb(input: Float32Array, outL: Float32Array, outR: Float32Array, amount: number) {
  const combs = [1557, 1617, 1491, 1422].map((d) => ({ buf: new Float32Array(d), i: 0, fb: 0.77 }));
  const aps = [225, 556].map((d) => ({ buf: new Float32Array(d), i: 0 }));
  const pre = Math.floor(0.02 * SR);
  for (let i = 0; i < input.length; i++) {
    const x = i >= pre ? input[i - pre] : 0;
    let s = 0;
    for (const c of combs) { const y = c.buf[c.i]; c.buf[c.i] = x + y * c.fb; c.i = (c.i + 1) % c.buf.length; s += y; }
    s /= combs.length;
    for (const a of aps) { const y = a.buf[a.i]; a.buf[a.i] = s + y * 0.5; s = y - 0.5 * a.buf[a.i]; a.i = (a.i + 1) % a.buf.length; }
    outL[i] += s * amount;
    outR[i] += (i > 11 ? s : 0) * amount; // nepatrný stereo posun
  }
}

/* ── ping-pong delay (tečkovaná osmina) ── */
function pingPong(input: Float32Array, outL: Float32Array, outR: Float32Array, tempo: number, amount: number) {
  const d = Math.floor(((60 / tempo) * 0.75) * SR);
  const bufL = new Float32Array(d), bufR = new Float32Array(d);
  const lp = new LP1(2800);
  let i1 = 0;
  for (let i = 0; i < input.length; i++) {
    const dry = lp.run(input[i]);
    const l = bufL[i1], r = bufR[i1];
    bufL[i1] = dry * 0.9 + r * 0.42;
    bufR[i1] = l * 0.42;
    outL[i] += l * amount;
    outR[i] += r * amount;
    i1 = (i1 + 1) % d;
  }
}

/* ── master: HP → kompresor → tanh → normalizace ── */
function master(L: Float32Array, R: Float32Array) {
  const hpL = new HP1(28), hpR = new HP1(28);
  let env = 0;
  const atk = 1 - Math.exp(-1 / (0.004 * SR)), rel = 1 - Math.exp(-1 / (0.14 * SR));
  const thresh = 0.5, ratio = 3.2;
  for (let i = 0; i < L.length; i++) {
    let l = hpL.run(L[i]), r = hpR.run(R[i]);
    const a = Math.max(Math.abs(l), Math.abs(r));
    env += (a > env ? atk : rel) * (a - env);
    const g = env > thresh ? Math.pow(env / thresh, 1 / ratio - 1) : 1;
    l = Math.tanh(l * g * 1.25); r = Math.tanh(r * g * 1.25);
    L[i] = l; R[i] = r;
  }
  let peak = 0.0001;
  for (let i = 0; i < L.length; i++) peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i]));
  const norm = 0.91 / peak;
  const fade = Math.floor(0.008 * SR);
  for (let i = 0; i < L.length; i++) {
    const f = Math.min(1, i / fade, (L.length - 1 - i) / fade);
    L[i] *= norm * f; R[i] *= norm * f;
  }
}

/* ── hlavní render kola ── */
export function renderRound(state: SongState, roundNo: number): { wav: Buffer; durationMs: number } {
  const bars = roundBars(state.tempo);
  const stepSec = 60 / state.tempo / 4;
  const total = Math.round(bars * 16 * stepSec * SR);
  const rng = mkRng(roundNo * 7919 + 17);

  const drumsB = new Float32Array(total);
  const bassB = new Float32Array(total);
  const musL = new Float32Array(total), musR = new Float32Array(total);
  const leadDry = new Float32Array(total);
  const revSend = new Float32Array(total);

  const sc = scaleOf(state);
  const chordFreqs = (deg: number) => [0, 2, 4].map((o) => midiToFreq(state.rootMidi + sc[((deg + o) % 7 + 7) % 7] + (deg + o >= 7 ? 12 : 0)));

  for (let bar = 0; bar < bars; bar++) {
    const chordDeg = state.prog[bar % 4];
    const barAt = bar * 16 * stepSec;
    // pad — držený akord, šířka podle energie
    pad(musL, musR, barAt, 16 * stepSec * 1.02, chordFreqs(chordDeg).map((f) => f), 0.1 + state.energy * 0.12);

    for (let st = 0; st < 16; st++) {
      const at = barAt + st * stepSec;
      const lastBar = bar % 4 === 3;
      // bicí (+ fill na konci čtyřtaktí)
      if (state.drums.kick[st]) kick(drumsB, at);
      if (state.drums.clap[st] || (lastBar && st === 14)) { clap(drumsB, at, rng); revSend[Math.floor(at * SR)] += 0.001; }
      if (state.drums.chh[st] && (state.energy > 0.4 || st % 4 === 2)) hat(drumsB, at + (st % 4 === 2 ? 0.004 : 0), false, rng);
      if (state.drums.ohh[st]) hat(drumsB, at, true, rng);
      // basa — sleduje root akordu
      const bp = state.bassPat[st];
      if (bp >= 0) {
        const base = degMidi(state, chordDeg, -2) + (bp === 1 ? 12 : bp === 2 ? 7 : 0);
        let len = 1; while (len < 8 && state.bassPat[(st + len) % 16] < 0) len++;
        bassNote(bassB, at, Math.min(len, 3) * stepSec * 0.92, midiToFreq(base));
      }
    }
  }

  // melodie: 32krokový motiv se opakuje přes celé kolo
  for (let rep = 0; rep < Math.ceil((bars * 16) / 32); rep++) {
    for (const n of state.lead.notes) {
      const gStep = rep * 32 + n.step;
      if (gStep >= bars * 16) continue;
      const at = gStep * stepSec;
      const freq = midiToFreq(degMidi(state, n.deg, 1));
      leadNote(leadDry, at, n.len * stepSec * 0.9, freq, state.lead.voice);
    }
  }

  // ztlumené vrstvy — brány do mixu (vždy aspoň jedna hraje, hlídá composer)
  const mu = state.mutes ?? {};
  const gD = mu.drums ? 0 : 1, gB = mu.bass ? 0 : 1, gL = mu.lead ? 0 : 1, gP = mu.pad ? 0 : 1;

  // clap + lead do reverbu, lead do delaye
  for (let i = 0; i < total; i++) revSend[i] += leadDry[i] * 0.35 * gL + drumsB[i] * 0.06 * gD;

  // sidechain duck od kicků (moderní pumpování basy + hudby) — jen když bicí hrají
  const duck = new Float32Array(total).fill(1);
  if (gD) for (let bar = 0; bar < bars; bar++) for (let st = 0; st < 16; st++) {
    if (!state.drums.kick[st]) continue;
    const k = Math.floor((bar * 16 + st) * stepSec * SR);
    const n = Math.floor(0.22 * SR);
    for (let i = 0; i < n && k + i < total; i++) {
      const g = 0.45 + 0.55 * Math.min(1, i / n / 0.85);
      if (g < duck[k + i]) duck[k + i] = g;
    }
  }

  const L = new Float32Array(total), R = new Float32Array(total);
  for (let i = 0; i < total; i++) {
    const mus = (musL[i] * gP + leadDry[i] * gL) * duck[i];
    const musr = (musR[i] * gP + leadDry[i] * gL) * duck[i];
    L[i] = drumsB[i] * gD * 0.9 + bassB[i] * gB * duck[i] * 0.85 + mus * 0.85;
    R[i] = drumsB[i] * gD * 0.9 + bassB[i] * gB * duck[i] * 0.85 + musr * 0.85;
  }
  if (gL) pingPong(leadDry, L, R, state.tempo, 0.16 + state.energy * 0.1);
  reverb(revSend, L, R, 0.5);
  master(L, R);

  return { wav: encodeWav(L, R), durationMs: Math.round((total / SR) * 1000) };
}

/* ── WAV (16-bit PCM stereo) ── */
function encodeWav(L: Float32Array, R: Float32Array): Buffer {
  const n = L.length;
  const buf = Buffer.alloc(44 + n * 4);
  buf.write("RIFF", 0); buf.writeUInt32LE(36 + n * 4, 4); buf.write("WAVE", 8);
  buf.write("fmt ", 12); buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(2, 22);
  buf.writeUInt32LE(SR, 24); buf.writeUInt32LE(SR * 4, 28); buf.writeUInt16LE(4, 32); buf.writeUInt16LE(16, 34);
  buf.write("data", 36); buf.writeUInt32LE(n * 4, 40);
  for (let i = 0; i < n; i++) {
    buf.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(L[i] * 32767))), 44 + i * 4);
    buf.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(R[i] * 32767))), 46 + i * 4);
  }
  return buf;
}
