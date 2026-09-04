/**
 * Dutá rána razítka — šum s rychlým doběhem plus krátký sinus dolů.
 * Přeneseno z původní hry. AudioContext se drží jeden na celou stránku.
 */
let ac: AudioContext | null = null;

export function playThump(): void {
  try {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    ac = ac || new AC();
    if (ac.state === "suspended") void ac.resume();

    const now = ac.currentTime;
    const N = 2400;

    // úder papíru o desku: filtrovaný šum
    const buf = ac.createBuffer(1, N, ac.sampleRate);
    const ch = buf.getChannelData(0);
    for (let i = 0; i < N; i++) ch[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / N, 4);
    const src = ac.createBufferSource();
    src.buffer = buf;
    const flt = ac.createBiquadFilter();
    flt.type = "lowpass";
    flt.frequency.value = 1600;
    const g1 = ac.createGain();
    g1.gain.setValueAtTime(0.16, now);
    g1.gain.exponentialRampToValueAtTime(0.0008, now + 0.13);
    src.connect(flt); flt.connect(g1); g1.connect(ac.destination);
    src.start(now);

    // tělo rány: sinus 170 → 55 Hz
    const osc = ac.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(170, now);
    osc.frequency.exponentialRampToValueAtTime(55, now + 0.1);
    const g2 = ac.createGain();
    g2.gain.setValueAtTime(0.14, now);
    g2.gain.exponentialRampToValueAtTime(0.0008, now + 0.15);
    osc.connect(g2); g2.connect(ac.destination);
    osc.start(now); osc.stop(now + 0.17);
  } catch {
    /* zvuk je nepodstatný */
  }
}
