import { blank, type GameState } from "./engine";

/**
 * Ukládání do prohlížeče. Klíč je záměrně stejný jako v samostatné hře, takže
 * komu běžel postup na milanuvsvet.cz, najde ho i tady.
 *
 * Účty jsou schované (lib/features.ts) → tohle je jediné místo, kde postup žije.
 */
export const SAVE_KEY = "milanuvsvet.v3";

export function loadGame(lang: string): GameState | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const o = JSON.parse(raw) as Partial<GameState> | null;
    if (!o || typeof o !== "object") return null;
    // Klíč po klíči z čerstvého stavu → starý save bez nového pole se nerozbije.
    const b = blank(lang) as unknown as Record<string, unknown>;
    for (const k of Object.keys(b)) {
      const v = (o as Record<string, unknown>)[k];
      if (v !== undefined) b[k] = v;
    }
    return b as unknown as GameState;
  } catch {
    return null; // soukromé okno / zakázané úložiště — hraje se bez ukládání
  }
}

export function saveGame(s: GameState): void {
  try {
    s.last = Date.now();
    localStorage.setItem(SAVE_KEY, JSON.stringify(s));
  } catch {
    /* nevadí, hra běží dál */
  }
}

export function clearGame(): void {
  try {
    localStorage.removeItem(SAVE_KEY);
  } catch {
    /* nevadí */
  }
}
