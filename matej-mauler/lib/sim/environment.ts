export interface Environment {
  foodAbundance: number;    // 0–1
  predatorPressure: number; // 0–1
  temperature: number;      // 0–1 (extremes punish high metabolism)
  backgroundHue: number;    // 0–1 (camouflage works when genome.hue is near this)
}

export const TEMP_NEUTRAL = 0.5;
