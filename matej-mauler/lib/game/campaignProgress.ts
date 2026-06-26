export interface CampaignProgress {
  tutorialDone: boolean;
  wins: number;
  bestBiomes: number;
}

const KEY = "driftbloom:campaign:v1";
const DEFAULT: CampaignProgress = { tutorialDone: false, wins: 0, bestBiomes: 0 };

export function loadCampaignProgress(): CampaignProgress {
  if (typeof window === "undefined") return { ...DEFAULT };
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...DEFAULT };
    return { ...DEFAULT, ...(JSON.parse(raw) as Partial<CampaignProgress>) };
  } catch { return { ...DEFAULT }; }
}

export function saveCampaignProgress(p: CampaignProgress): void {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(KEY, JSON.stringify(p)); } catch { /* quota / private mode — ignore */ }
}

export function markTutorialDone(): CampaignProgress {
  const next = { ...loadCampaignProgress(), tutorialDone: true };
  saveCampaignProgress(next);
  return next;
}

export function recordCampaignResult({ won, playerBiomes }: { won: boolean; playerBiomes: number }): CampaignProgress {
  const p = loadCampaignProgress();
  const next = { ...p, wins: p.wins + (won ? 1 : 0), bestBiomes: Math.max(p.bestBiomes, playerBiomes) };
  saveCampaignProgress(next);
  return next;
}
