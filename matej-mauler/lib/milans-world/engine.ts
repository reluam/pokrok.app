import {
  ACHS, BUILDINGS, BUILD_TIERS, BUILD_UPS, CLICK_UPS, DIFFS, FIRMA, GLOBAL_UPS, GROWTH, MARRY,
  type AchStats, type AnyUp, type Building,
} from "./data";

/**
 * Čistá herní logika. Žádný DOM, žádný React, žádné globální LANG — všechno
 * bere stav parametrem, takže se to dá testovat a komponenta nad tím jen kreslí.
 */

export type GameState = {
  diff: string | null;
  min: number;
  totalMin: number;
  money: number;
  totalMoney: number;
  clicks: number;
  owned: Record<string, number>;
  ups: Record<string, number>;
  achs: Record<string, number>;
  sound: boolean;
  lang: string;
  last: number;
  code: string | null;
};

/** Odvozená čísla — přepočítávají se po každém nákupu, ne při každém snímku. */
export type Derived = { click: number; cps: number; perB: Record<string, number> };

export const blank = (lang: string): GameState => ({
  diff: null, min: 0, totalMin: 0, money: 0, totalMoney: 0, clicks: 0,
  owned: {}, ups: {}, achs: {}, sound: true, lang, last: Date.now(), code: null,
});

export const totalProps = (s: GameState) =>
  Object.values(s.owned).reduce((a, b) => a + b, 0);

export const diffOf = (s: GameState) => DIFFS[s.diff ?? ""] || DIFFS.smrtelnik;

/** Sazba (Kč za minutu). „Na Milana" startuje na 1× a desetinásobek si musíš zasloužit svatbou. */
export const sazba = (s: GameState) =>
  s.diff === "milan" ? (s.ups.m0 ? 10 : 1) : diffOf(s).mult;

export function recompute(s: GameState): Derived {
  let g = 1;
  for (const u of GLOBAL_UPS) if (s.ups[u.id]) g *= u.m;
  let cm = 1;
  for (const u of CLICK_UPS) if (s.ups[u.id]) cm *= 2;

  const perB: Record<string, number> = {};
  let cps = 0;
  for (const b of BUILDINGS) {
    let m = g;
    BUILD_TIERS.forEach((_tier, ti) => { if (s.ups[b.id + "_t" + ti]) m *= 2; });
    perB[b.id] = b.r * m;
    cps += (s.owned[b.id] || 0) * perB[b.id];
  }
  return { click: cm * g, cps, perB };
}

/** Cena n kusů od aktuálního počtu — geometrická řada, ceny rostou o GROWTH za kus. */
export const bulkCost = (b: Building, owned: number, n: number) =>
  (b.c * Math.pow(GROWTH, owned) * (Math.pow(GROWTH, n) - 1)) / (GROWTH - 1);

/** Kolik kusů si můžeš dovolit. Strop 100 000 je pojistka proti Infinity. */
export function maxAfford(b: Building, owned: number, money: number): number {
  const base = b.c * Math.pow(GROWTH, owned);
  if (money < base) return 0;
  const n = Math.floor(Math.log((money * (GROWTH - 1)) / base + 1) / Math.log(GROWTH));
  return Math.max(0, Math.min(n, 100000));
}

/** Kolik nemovitostí je vidět: tři dopředu od té nejvyšší vlastněné. */
export function unlockedCount(s: GameState): number {
  let last = 0;
  BUILDINGS.forEach((b, i) => { if (s.owned[b.id]) last = i; });
  return Math.min(BUILDINGS.length, Math.max(3, last + 3));
}

export type UpKind = "click" | "global" | "build" | "marry" | "trap";
export type UpOffer = { u: AnyUp; kind: UpKind };

/** Nabídka vylepšení: napevno připnutá svatba a past s firmou, pak zbytek podle ceny. */
export function availableUps(s: GameState): UpOffer[] {
  const pin: UpOffer[] = [];
  if (s.diff === "milan" && !s.ups.m0) pin.push({ u: MARRY, kind: "marry" });
  if (!s.ups.f0 && s.totalMoney >= (FIRMA.since ?? 0)) pin.push({ u: FIRMA, kind: "trap" });

  const out: UpOffer[] = [];
  for (const u of CLICK_UPS) if (!s.ups[u.id] && s.clicks >= u.clicks) out.push({ u, kind: "click" });
  for (const u of GLOBAL_UPS) if (!s.ups[u.id] && totalProps(s) >= u.props) out.push({ u, kind: "global" });
  for (const u of BUILD_UPS) if (!s.ups[u.id] && (s.owned[u.build] || 0) >= u.at) out.push({ u, kind: "build" });
  out.sort((a, b) => a.u.c - b.u.c);
  return pin.concat(out).slice(0, 24);
}

/** Minuty na účet — a z nich peníze podle sazby. Mutuje stav (voláno v herní smyčce). */
export function gain(s: GameState, minutes: number): void {
  s.min += minutes;
  s.totalMin += minutes;
  const kc = minutes * sazba(s);
  s.money += kc;
  s.totalMoney += kc;
}

export const achStats = (s: GameState): AchStats => ({
  owned: s.owned, ups: s.ups, clicks: s.clicks, totalMin: s.totalMin,
  totalMoney: s.totalMoney, diff: s.diff, props: totalProps(s),
});

/** Zapíše nově splněná vyznamenání a vrátí je (pro oznámení). Mutuje stav. */
export function checkAchs(s: GameState) {
  const st = achStats(s);
  const fresh = [];
  for (const a of ACHS) {
    if (!s.achs[a.id] && a.t(st)) {
      s.achs[a.id] = 1;
      fresh.push(a);
    }
  }
  return fresh;
}
