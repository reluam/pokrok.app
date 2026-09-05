"use client";

import Link from "next/link";
import { useCallback, useRef, useState } from "react";
import type { Lang } from "@/lib/dictionaries";
import { SAYINGS, UI } from "@/lib/milans-world/copy";
import { ACHS, BUILDINGS, DIFFS } from "@/lib/milans-world/data";
import {
  availableUps, bulkCost, diffOf, maxAfford, sazba, totalProps, unlockedCount,
} from "@/lib/milans-world/engine";
import { fmt, fmtMoney, humanTime, moneyNum } from "@/lib/milans-world/format";
import { grp } from "@/lib/milans-world/numbers";
import { useGame, type Bulk } from "./useGame";

type Tip = { n: string; d: string; eff: string; price: string };
type Float = { key: number; x: number; y: number; txt: string; say: boolean };
type Splat = { key: number; x: number; y: number; scale: number };

export function MilansWorld({ initialLang }: { initialLang: Lang }) {
  const g = useGame(initialLang);
  const { s, c, lang } = g;
  const T = UI[lang];

  const [tab, setTab] = useState<"build" | "up" | "ach">("build");
  const [bulk, setBulk] = useState<Bulk>(1);
  const [tip, setTip] = useState<Tip | null>(null);
  const [floats, setFloats] = useState<Float[]>([]);
  const [splats, setSplats] = useState<Splat[]>([]);
  const [resetArmed, setResetArmed] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);
  const fxKey = useRef(0);

  const onStamp = useCallback((ev: React.MouseEvent) => {
    const r = sheetRef.current?.getBoundingClientRect();
    const x = r && ev.clientX ? ev.clientX - r.left : (r?.width ?? 0) / 2;
    const y = r && ev.clientY ? ev.clientY - r.top : (r?.height ?? 0) / 2;

    g.stamp();

    const add: Float[] = [{ key: ++fxKey.current, x, y, txt: "+" + fmt(c.click, lang) + " " + T.min, say: false }];
    // Každé sedmé razítko si úřednice něco odsekne. g.stamp() výše už s.clicks
    // zvýšil (je to tentýž mutovaný objekt), takže se tady nepřičítá znovu.
    if (s.clicks % 7 === 0) {
      const say = SAYINGS[lang];
      add.push({
        key: ++fxKey.current,
        x: (r?.width ?? 0) / 2 + (Math.random() * 80 - 40),
        y: 26 + Math.random() * 20,
        txt: say[Math.floor(Math.random() * say.length)],
        say: true,
      });
    }
    setFloats((f) => [...f, ...add]);
    for (const fl of add) setTimeout(() => setFloats((cur) => cur.filter((x2) => x2.key !== fl.key)), 1150);

    const sk = ++fxKey.current;
    setSplats((p) => [...p, {
      key: sk, x: x + (Math.random() * 30 - 15), y: y + (Math.random() * 30 - 15),
      scale: 0.6 + Math.random() * 1.1,
    }].slice(-14));
  }, [g, c.click, lang, T.min, s.clicks]);

  const onReset = () => {
    if (!resetArmed) {
      setResetArmed(true);
      setTimeout(() => setResetArmed(false), 4000);
      return;
    }
    g.reset();
  };

  // ── úvodní formulář: kolonka 4 ──
  if (!g.ready || !s.diff) {
    return (
      <div className="msw">
        <div className="msw-overlay">
          <div className="msw-start">
            <div className="msw-start__band">
              <span className="msw-band__l">
                <BackLink />
                <span>{T.startBand}</span>
              </span>
              <span style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <span>{T.startBand2}</span>
                <LangSwitch lang={lang} onSet={g.setLang} />
              </span>
            </div>
            <div className="msw-start__body">
              <h2>Milanův svět</h2>
              <p className="msw-lead msw-lead--punch">{T.lead1}</p>
              <p className="msw-lead">{T.lead2}</p>
              <p className="msw-q">{T.box4}</p>
              <div className="msw-picks">
                {["smrtelnik", "byrokrat", "milan"].map((id) => {
                  const d = DIFFS[id];
                  return (
                    <button key={id} className="msw-pick" onClick={() => g.start(id)}>
                      <span className="msw-pick__x">{d.x}</span>
                      <span className="msw-pick__n">{d.name[lang]}</span>
                      <span className="msw-pick__d">{d.desc[lang]}</span>
                      <span className="msw-pick__w">{d.warn[lang]}</span>
                    </button>
                  );
                })}
              </div>
              <p className="msw-warn">{T.startWarn}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const vis = unlockedCount(s);
  const ups = availableUps(s);
  const kinds = BUILDINGS.filter((b) => s.owned[b.id]).length;

  return (
    <div className="msw">
      <div className="msw-app">
        <header className="msw-head">
          <div className="msw-head__band">
            <span className="msw-band__l">
              <BackLink />
              <span>{T.bandOffice}</span>
            </span>
            <span><b>{T.bandForm}</b> {T.bandFormWhat}</span>
          </div>
          <div className="msw-head__top">
            <h1>Milanův svět<span>{T.tagline}</span></h1>
            <div className="msw-head__meta">
              <span className="msw-rank">{diffOf(s).name[lang]} · {sazba(s)}×</span>
              <LangSwitch lang={lang} onSet={g.setLang} />
              <button className="msw-mini" aria-pressed={s.sound} onClick={g.toggleSound}>
                {s.sound ? T.sound : T.soundOff}
              </button>
              <button className="msw-mini msw-mini--danger" onClick={onReset}>
                {resetArmed ? T.resetSure : T.reset}
              </button>
            </div>
          </div>
          <div className="msw-fields">
            <Field mod="min" k={T.kMinutes} v={fmt(Math.floor(s.min), lang)} sub={humanTime(s.totalMin, lang)} />
            <Field mod="money" k={T.kAccount} v={moneyNum(s.money, lang)} unit={T.currency} sub={T.rateLine(sazba(s))} />
            <Field k={T.kYield} v={fmt(c.cps, lang)} unit={T.minPerSec} sub={T.perSec(moneyNum(c.cps * sazba(s), lang))} />
            <Field k={T.kPerStamp} v={fmt(c.click, lang)} unit={T.min} sub={T.stampsTotal(grp(s.clicks, lang))} />
            <Field k={T.kProps} v={fmt(totalProps(s), lang)} sub={T.ofKinds(kinds, BUILDINGS.length)} />
          </div>
        </header>

        <main className="msw-main">
          <section className="msw-desk">
            <div className="msw-desk__hdr"><span>{T.filingSheet}</span><span>{s.code || "A‑0000"}</span></div>
            <div className="msw-sheet" ref={sheetRef}>
              <div className="msw-splats">
                {splats.map((p) => (
                  <div key={p.key} className="msw-splat"
                       style={{ left: p.x, top: p.y, transform: `translate(-50%,-50%) scale(${p.scale})` }} />
                ))}
              </div>
              {floats.map((f) => (
                <div key={f.key} className={"msw-float" + (f.say ? " msw-float--say" : "")}
                     style={{ left: f.x, top: f.y }}>{f.txt}</div>
              ))}
              <button className="msw-stampbtn" onClick={onStamp}
                      aria-label={`${T.filingSheet} — ${T.kPerStamp}`}>
                <svg viewBox="0 0 240 240" aria-hidden="true">
                  <defs>
                    <path id="msw-arcT" d="M 32 120 A 88 88 0 0 1 208 120" />
                    <path id="msw-arcB" d="M 44 120 A 76 76 0 0 0 196 120" />
                  </defs>
                  <circle className="msw-ring" cx="120" cy="120" r="106" />
                  <circle className="msw-ring2" cx="120" cy="120" r="98" />
                  <circle className="msw-ring2" cx="120" cy="120" r="64" />
                  <text className="msw-arc"><textPath href="#msw-arcT" startOffset="50%" textAnchor="middle">{T.arcTop}</textPath></text>
                  <text className="msw-arc"><textPath href="#msw-arcB" startOffset="50%" textAnchor="middle">{T.arcBot}</textPath></text>
                  <path className="msw-star" d="M22 120 l7-4 v8 z" />
                  <path className="msw-star" d="M218 120 l-7-4 v8 z" />
                  <text className="msw-mid msw-mid--big" x="120" y="128">+{fmt(c.click, lang)}</text>
                  <text className="msw-mid msw-mid--sm" x="120" y="152">{T.stampUnit}</text>
                </svg>
              </button>
              <p className="msw-hint" dangerouslySetInnerHTML={{ __html: T.hint }} />
            </div>
            <dl className="msw-deskfoot">
              <div><dt>{T.kTotalEarned}</dt><dd>{fmtMoney(s.totalMoney, lang)}</dd></div>
              <div><dt>{T.kAwards}</dt><dd>{g.achCount} / {g.achTotal}</dd></div>
            </dl>
          </section>

          <section className="msw-shop">
            <div className="msw-tabs" role="tablist">
              <button className="msw-tab" role="tab" aria-selected={tab === "build"} onClick={() => setTab("build")}>{T.tabProps}</button>
              <button className="msw-tab" role="tab" aria-selected={tab === "up"} onClick={() => setTab("up")}>
                {T.tabUps} <i>{ups.length ? `(${ups.length})` : ""}</i>
              </button>
              <button className="msw-tab" role="tab" aria-selected={tab === "ach"} onClick={() => setTab("ach")}>{T.tabAch}</button>
            </div>

            {tab === "build" && (
              <div className="msw-bulkbar">
                <span>{T.buyInLots}</span>
                <div className="msw-bulk">
                  {([1, 10, 100, "max"] as Bulk[]).map((n) => (
                    <button key={String(n)} aria-pressed={bulk === n} onClick={() => setBulk(n)}>
                      {n === "max" ? "max" : n}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {tab === "build" && (
              <div className="msw-panel" role="tabpanel">
                {BUILDINGS.map((b, idx) => {
                  const owned = s.owned[b.id] || 0;
                  const locked = idx >= vis && owned === 0;
                  const teaser = idx === vis && owned === 0;
                  if (locked && !teaser) return null;
                  const n = bulk === "max" ? Math.max(1, maxAfford(b, owned, s.money)) : bulk;
                  const cost = bulkCost(b, owned, n);
                  const poor = cost > s.money;
                  return (
                    <button key={b.id}
                            className={"msw-row" + (teaser ? " locked" : "") + (poor ? " poor" : "")}
                            disabled={teaser || poor}
                            onClick={() => g.buyBuilding(b, bulk)}>
                      <span className="msw-row__ico">{teaser ? "❓" : b.i}</span>
                      <span>
                        <span className="msw-row__name">
                          {teaser ? "???" : b.n[lang]}
                          {!teaser && owned > 0 && <em>{grp(owned, lang)}×</em>}
                        </span>
                        <span className="msw-row__desc">{teaser ? T.teaser : b.d[lang]}</span>
                      </span>
                      <span className="msw-row__right">
                        {!teaser && <span className={"msw-row__cnt" + (owned === 0 ? " zero" : "")}>{owned ? grp(owned, lang) : "0"}</span>}
                        <span className="msw-row__cost">{teaser ? "???" : (n > 1 ? n + "× " : "") + fmtMoney(cost, lang)}</span>
                        {!teaser && <span className="msw-row__rate">{T.totalRate(fmt(c.perB[b.id], lang), fmt(c.perB[b.id] * owned, lang))}</span>}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {tab === "up" && (
              <div className="msw-panel" role="tabpanel">
                <div className="msw-ups">
                  {ups.length === 0
                    ? <div className="msw-empty">{T.upsEmpty}</div>
                    : ups.map((x) => {
                        const show = () => {
                          const eff = x.kind === "click" ? T.effClick
                            : x.kind === "global" ? T.effGlobal((x.u as { m: number }).m)
                            : x.kind === "marry" ? T.effMarry : "";
                          setTip({
                            n: x.u.n[lang], d: x.u.d[lang], eff,
                            price: fmtMoney(x.u.c, lang) + (s.money < x.u.c ? T.cantAfford : T.canBuy),
                          });
                        };
                        return (
                          <button key={x.u.id} className="msw-up" disabled={s.money < x.u.c}
                                  onMouseEnter={show} onFocus={show} onClick={() => g.buyUp(x.u)}>
                            <span>{x.u.i}</span>
                            <i>{fmtMoney(x.u.c, lang)}</i>
                          </button>
                        );
                      })}
                </div>
                <Uptip tip={tip} fallbackTitle={T.upsTitle} fallbackText={T.upsIntro} />
              </div>
            )}

            {tab === "ach" && (
              <div className="msw-panel" role="tabpanel">
                <div className="msw-achs">
                  {ACHS.map((a) => (
                    <div key={a.id} className={"msw-ach" + (s.achs[a.id] ? " on" : "")}>
                      <div className="msw-ach__n">{s.achs[a.id] ? a.n[lang] : T.notAwarded}</div>
                      <div className="msw-ach__d">{a.d[lang]}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        </main>

        <footer className="msw-footer">{T.footer}</footer>
      </div>

      <div className="msw-notes">
        {g.notes.map((n) => (
          <div key={n.key} className={"msw-note" + (n.kind === "ach" ? " msw-note--ach" : n.kind === "bad" ? " msw-note--bad" : "")}>
            <b>{n.title}</b>{n.text}
          </div>
        ))}
      </div>
    </div>
  );
}

// Cesta ven ze hry. Jméno je vlastní, takže se nepřekládá — proto nesahá do copy.ts,
// který je doslovný přenos ze samostatné hry.
function BackLink() {
  return <Link href="/" className="msw-back">← Spaghetti.ltd</Link>;
}

function LangSwitch({ lang, onSet }: { lang: Lang; onSet: (l: Lang) => void }) {
  return (
    <span className="msw-langsw">
      {(["cs", "en"] as Lang[]).map((l) => (
        <button key={l} aria-pressed={lang === l} onClick={() => onSet(l)}>{l === "cs" ? "CZ" : "EN"}</button>
      ))}
    </span>
  );
}

function Field({ k, v, unit, sub, mod }: { k: string; v: string; unit?: string; sub: string; mod?: "min" | "money" }) {
  return (
    <div className={"msw-field" + (mod ? ` msw-field--${mod}` : "")}>
      <span className="msw-field__k">{k}</span>
      <span className="msw-field__v">{v}{unit && <small> {unit}</small>}</span>
      <span className="msw-field__s">{sub}</span>
    </div>
  );
}

function Uptip({ tip: d, fallbackTitle, fallbackText }: { tip: Tip | null; fallbackTitle: string; fallbackText: string }) {
  return (
    <div className="msw-uptip">
      <h4>{d ? d.n : fallbackTitle}</h4>
      <p>{d ? d.d : fallbackText}</p>
      {d?.eff && <p>{d.eff}</p>}
      {d && <span className="msw-price">{d.price}</span>}
    </div>
  );
}
