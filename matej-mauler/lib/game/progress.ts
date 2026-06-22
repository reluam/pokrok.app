import { SCENARIOS } from "./scenarios";

export interface DriftProgress {
  completedScenarios: string[];
  phaseBUnlocked: boolean;
  bestSurvival: number;
}

const KEY = "driftbloom:progress:v1";
const DEFAULT: DriftProgress = { completedScenarios: [], phaseBUnlocked: false, bestSurvival: 0 };

export function loadProgress(): DriftProgress {
  if (typeof window === "undefined") return { ...DEFAULT };
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...DEFAULT };
    return { ...DEFAULT, ...(JSON.parse(raw) as Partial<DriftProgress>) };
  } catch { return { ...DEFAULT }; }
}

export function saveProgress(p: DriftProgress): void {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(KEY, JSON.stringify(p)); } catch { /* quota / private mode — ignore */ }
}

export function markScenarioComplete(id: string): DriftProgress {
  const p = loadProgress();
  const completedScenarios = Array.from(new Set([...p.completedScenarios, id]));
  const phaseBUnlocked = SCENARIOS.every((s) => completedScenarios.includes(s.id));
  const next = { ...p, completedScenarios, phaseBUnlocked };
  saveProgress(next);
  return next;
}

export function recordSurvival(generations: number): DriftProgress {
  const p = loadProgress();
  const next = { ...p, bestSurvival: Math.max(p.bestSurvival, generations) };
  saveProgress(next);
  return next;
}
