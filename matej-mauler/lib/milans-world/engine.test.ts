import { describe, expect, it } from "vitest";
import { ACHS, BUILDINGS, BUILD_UPS, CLICK_UPS, GLOBAL_UPS, GROWTH } from "./data";
import { availableUps, blank, bulkCost, checkAchs, gain, maxAfford, recompute, sazba, totalProps, unlockedCount } from "./engine";
import { fmt, fmtMoney, humanTime, moneyNum } from "./format";

const fresh = () => ({ ...blank("en"), diff: "smrtelnik" });

describe("ceny nemovitostí", () => {
  const b = BUILDINGS[0];

  it("první kus stojí základní cenu", () => {
    expect(bulkCost(b, 0, 1)).toBeCloseTo(b.c, 6);
  });

  it("každý další kus je o GROWTH dražší", () => {
    expect(bulkCost(b, 1, 1)).toBeCloseTo(b.c * GROWTH, 6);
    expect(bulkCost(b, 0, 2)).toBeCloseTo(b.c + b.c * GROWTH, 6);
  });

  it("hromadný nákup je součet jednotlivých kusů", () => {
    let sum = 0;
    for (let i = 0; i < 10; i++) sum += bulkCost(b, 3 + i, 1);
    expect(bulkCost(b, 3, 10)).toBeCloseTo(sum, 4);
  });

  it("maxAfford nikdy nenavrhne, na co nemáš", () => {
    for (const money of [0, 149, 150, 1000, 1e6, 1e12]) {
      const n = maxAfford(b, 0, money);
      expect(bulkCost(b, 0, n)).toBeLessThanOrEqual(money + 1e-6);
      if (n > 0) expect(bulkCost(b, 0, n + 1)).toBeGreaterThan(money);
    }
  });

  it("na první kus nestačí o korunu míň", () => {
    expect(maxAfford(b, 0, b.c - 1)).toBe(0);
    expect(maxAfford(b, 0, b.c)).toBe(1);
  });
});

describe("odemykání nabídky", () => {
  it("na začátku jsou vidět tři nemovitosti", () => {
    expect(unlockedCount(fresh())).toBe(3);
  });

  it("koupí se posune okno o tři dopředu", () => {
    const s = fresh();
    s.owned[BUILDINGS[4].id] = 1;
    expect(unlockedCount(s)).toBe(7);
  });

  it("okno se nikdy nepřeteče přes konec seznamu", () => {
    const s = fresh();
    s.owned[BUILDINGS[BUILDINGS.length - 1].id] = 1;
    expect(unlockedCount(s)).toBe(BUILDINGS.length);
  });
});

describe("vylepšení", () => {
  it("na začátku nemá hráč odemčené nic", () => {
    expect(availableUps(fresh())).toHaveLength(0);
  });

  it("klikací vylepšení se odemkne počtem razítek", () => {
    const s = fresh();
    s.clicks = CLICK_UPS[0].clicks;
    expect(availableUps(s).map((x) => x.u.id)).toContain(CLICK_UPS[0].id);
  });

  it("globální vylepšení se odemkne počtem nemovitostí", () => {
    const s = fresh();
    s.owned[BUILDINGS[0].id] = GLOBAL_UPS[0].props;
    expect(availableUps(s).map((x) => x.u.id)).toContain(GLOBAL_UPS[0].id);
  });

  it("svatba je připnutá nahoře jen v kategorii Na Milana", () => {
    const s = { ...fresh(), diff: "milan" };
    expect(availableUps(s)[0]?.u.id).toBe("m0");
    expect(availableUps(fresh()).map((x) => x.u.id)).not.toContain("m0");
  });

  it("nabídka se nikdy nerozroste přes 24 položek", () => {
    const s = fresh();
    s.clicks = 1e9;
    for (const b of BUILDINGS) s.owned[b.id] = 500;
    expect(availableUps(s).length).toBeLessThanOrEqual(24);
  });
});

describe("sazba a výnos", () => {
  it("Na Milana startuje na 1× a desetinásobek přijde až svatbou", () => {
    const s = { ...fresh(), diff: "milan" };
    expect(sazba(s)).toBe(1);
    s.ups.m0 = 1;
    expect(sazba(s)).toBe(10);
  });

  it("klikací vylepšení zdvojnásobuje výnos razítka", () => {
    const s = fresh();
    expect(recompute(s).click).toBe(1);
    s.ups[CLICK_UPS[0].id] = 1;
    expect(recompute(s).click).toBe(2);
    s.ups[CLICK_UPS[1].id] = 1;
    expect(recompute(s).click).toBe(4);
  });

  it("globální vylepšení násobí i výnos razítka", () => {
    const s = fresh();
    s.ups[GLOBAL_UPS[0].id] = 1;
    expect(recompute(s).click).toBe(GLOBAL_UPS[0].m);
  });

  it("cps roste s počtem nemovitostí", () => {
    const s = fresh();
    s.owned[BUILDINGS[0].id] = 3;
    expect(recompute(s).cps).toBeCloseTo(BUILDINGS[0].r * 3, 6);
  });

  it("gain připíše minuty i peníze podle sazby", () => {
    const s = { ...fresh(), diff: "byrokrat" };
    gain(s, 10);
    expect(s.min).toBe(10);
    expect(s.totalMin).toBe(10);
    expect(s.money).toBe(30);
    expect(s.totalMoney).toBe(30);
  });
});

describe("vyznamenání", () => {
  it("udělí se jen jednou", () => {
    const s = fresh();
    s.clicks = 100;
    expect(checkAchs(s).map((a) => a.id)).toContain("a5");
    expect(checkAchs(s)).toHaveLength(0);
  });

  it("počítají nemovitosti napříč druhy, ne jen jeden", () => {
    const s = fresh();
    s.owned[BUILDINGS[0].id] = 6;
    s.owned[BUILDINGS[1].id] = 4;
    expect(totalProps(s)).toBe(10);
    expect(checkAchs(s).map((a) => a.id)).toContain("a2");
  });

  it("je jich dvacet a všechna mají unikátní id", () => {
    expect(ACHS).toHaveLength(20);
    expect(new Set(ACHS.map((a) => a.id)).size).toBe(20);
  });
});

describe("data jsou konzistentní", () => {
  it("nemovitosti mají rostoucí cenu a unikátní id", () => {
    expect(new Set(BUILDINGS.map((b) => b.id)).size).toBe(BUILDINGS.length);
    for (let i = 1; i < BUILDINGS.length; i++) {
      expect(BUILDINGS[i].c).toBeGreaterThan(BUILDINGS[i - 1].c);
    }
  });

  it("každé vylepšení nemovitosti ukazuje na existující nemovitost", () => {
    const ids = new Set(BUILDINGS.map((b) => b.id));
    for (const u of BUILD_UPS) expect(ids.has(u.build)).toBe(true);
  });

  it("žádné dvě vylepšení nesdílí id", () => {
    const all = [...CLICK_UPS, ...GLOBAL_UPS, ...BUILD_UPS].map((u) => u.id);
    expect(new Set(all).size).toBe(all.length);
  });

  it("všechny texty existují v obou jazycích", () => {
    for (const b of BUILDINGS) {
      for (const l of ["cs", "en"] as const) {
        expect(b.n[l].length).toBeGreaterThan(0);
        expect(b.d[l].length).toBeGreaterThan(0);
      }
    }
  });
});

describe("formátování", () => {
  it("čeština a angličtina mají různé oddělovače", () => {
    expect(fmt(1234, "cs")).toBe("1 234");
    expect(fmt(1234, "en")).toBe("1,234");
  });

  it("čeština má dlouhé měřítko, angličtina krátké", () => {
    expect(fmt(1e12, "cs")).toContain("bilion");
    expect(fmt(1e12, "en")).toContain("trillion");
  });

  it("peníze se v angličtině přepočítají kurzem", () => {
    expect(moneyNum(100, "cs")).toBe("100");
    expect(moneyNum(100, "en")).toBe("5.00");
  });

  it("měna sedí k jazyku", () => {
    expect(fmtMoney(100, "cs")).toContain("Kč");
    expect(fmtMoney(100, "en")).toContain("USD");
  });

  it("nekonečno nespadne", () => {
    expect(fmt(Infinity, "en")).toBe("infinity");
    expect(fmt(Infinity, "cs")).toBe("nekonečno");
  });

  it("čas se škáluje na lidskou jednotku", () => {
    expect(humanTime(0.5, "en")).toBe("nothing yet");
    expect(humanTime(30, "en")).toContain("minutes");
    expect(humanTime(600, "en")).toContain("hours");
    expect(humanTime(1e9, "en")).toContain("millennia");
  });
});
