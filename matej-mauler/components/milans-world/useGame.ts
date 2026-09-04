"use client";

/* eslint-disable react-hooks/refs, react-hooks/set-state-in-effect --
 * Obojí je tady záměr, ne nedopatření:
 *
 * `refs`: herní stav je mutovaný objekt v ref a překresluje se přiškrceně
 * (FRAME_MS). Držet ho v useState by znamenalo kopírovat celý stav 15×/s jen
 * proto, aby se změnilo jedno číslo — na mobilu zbytečná daň. Čtení refu při
 * renderu je bezpečné: po každé mutaci hned voláme render(), takže nejhorší
 * možný důsledek je o snímek starší číslo na displeji.
 *
 * `set-state-in-effect`: uložený postup se načítá z localStorage, který na
 * serveru neexistuje. Lazy useState initializer by rozbil hydrataci (server by
 * vykreslil úvodní formulář, klient rozehranou hru), takže se to musí stát
 * až v efektu po mountu.
 */

import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import type { Lang } from "@/lib/dictionaries";
import { UI } from "@/lib/milans-world/copy";
import { ACHS, type AnyUp, type Building } from "@/lib/milans-world/data";
import {
  blank, bulkCost, checkAchs, gain, maxAfford, recompute, sazba,
  type Derived, type GameState,
} from "@/lib/milans-world/engine";
import { fmt, fmtMoney, hoursMins } from "@/lib/milans-world/format";
import { clearGame, loadGame, saveGame } from "@/lib/milans-world/save";
import { playThump } from "./sound";

export type Note = { key: number; title: string; text: string; kind: "" | "ach" | "bad" };
export type Bulk = 1 | 10 | 100 | "max";

/** Pasivní tik překresluje 15×/s. Čísla se mění plynule, takže rychleji to nikdo
 *  nepozná — ale 60 fps re-render mřížky nemovitostí by topil telefon. */
const FRAME_MS = 66;
/** Offline výnos se počítá nejvýš za 8 hodin — jinak by týden pryč hru dohrál sám. */
const OFFLINE_CAP_S = 8 * 3600;

export function useGame(initialLang: Lang) {
  const [, render] = useReducer((x: number) => x + 1, 0);
  const [lang, setLangState] = useState<Lang>(initialLang);
  const [ready, setReady] = useState(false);
  const [notes, setNotes] = useState<Note[]>([]);

  const S = useRef<GameState>(blank(initialLang));
  const C = useRef<Derived>({ click: 1, cps: 0, perB: {} });
  const langRef = useRef<Lang>(initialLang);
  const noteKey = useRef(0);

  const t = useCallback((k: keyof typeof UI.cs) => UI[langRef.current][k], []);

  const note = useCallback((title: string, text: string, kind: Note["kind"] = "", ms = 4200) => {
    const key = ++noteKey.current;
    setNotes((n) => [...n, { key, title, text, kind }].slice(-3));
    setTimeout(() => setNotes((n) => n.filter((x) => x.key !== key)), ms);
  }, []);

  const announceAchs = useCallback(() => {
    for (const a of checkAchs(S.current)) {
      note(String(t("noteAch")), a.n[langRef.current] + " — " + a.d[langRef.current], "ach");
    }
  }, [note, t]);

  // ── načtení uloženého postupu (až na klientovi, localStorage není na serveru) ──
  useEffect(() => {
    const saved = loadGame(initialLang);
    if (saved) {
      S.current = saved;
      const l: Lang = saved.lang === "cs" ? "cs" : "en";
      langRef.current = l;
      setLangState(l);
    }
    C.current = recompute(S.current);

    // Offline výnos: co nateklo, zatímco jsi stál ve frontě jinde.
    const s = S.current;
    if (s.diff && C.current.cps > 0) {
      const dt = (Date.now() - (s.last || Date.now())) / 1000;
      if (dt >= 60) {
        const capped = Math.min(dt, OFFLINE_CAP_S);
        const got = C.current.cps * capped;
        gain(s, got);
        const l = langRef.current;
        note(
          String(UI[l].noteOffline),
          UI[l].noteOfflineTxt(hoursMins(capped), fmt(got, l), fmtMoney(got * sazba(s), l)),
          "", 7000,
        );
      }
    }
    setReady(true);
    // Jen jednou při mountu — initialLang se nemění a note/​t jsou stabilní.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── herní smyčka + průběžné ukládání ──
  // `started` musí být v závislostech: při první hře je diff na začátku null a
  // nastaví ho až volba kategorie. Bez něj by se efekt po startu znovu nespustil
  // a pasivní výnos by se nikdy nerozjel (chytil to e2e průchod).
  const started = S.current.diff;
  useEffect(() => {
    if (!ready || !started) return;
    let raf = 0;
    let lastTs = 0;
    let lastPaint = 0;

    const loop = (ts: number) => {
      if (!lastTs) lastTs = ts;
      const dt = Math.min((ts - lastTs) / 1000, 0.25); // skok po probuzení tabu neřeší smyčka, ale offline výnos
      lastTs = ts;
      if (C.current.cps > 0) gain(S.current, C.current.cps * dt);
      if (ts - lastPaint >= FRAME_MS) {
        lastPaint = ts;
        announceAchs();
        render();
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    const iv = setInterval(() => saveGame(S.current), 5000);
    const onHide = () => { if (document.hidden) saveGame(S.current); };
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("beforeunload", onHide);
    return () => {
      cancelAnimationFrame(raf);
      clearInterval(iv);
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("beforeunload", onHide);
      saveGame(S.current);
    };
  }, [ready, started, announceAchs]);

  // ── akce ──
  const setLang = useCallback((l: Lang) => {
    langRef.current = l;
    S.current.lang = l;
    setLangState(l);
    saveGame(S.current);
  }, []);

  const stamp = useCallback(() => {
    S.current.clicks++;
    gain(S.current, C.current.click);
    if (S.current.sound) playThump();
    announceAchs();
    render();
  }, [announceAchs]);

  const buyBuilding = useCallback((b: Building, bulk: Bulk) => {
    const s = S.current;
    const owned = s.owned[b.id] || 0;
    let n = bulk === "max" ? maxAfford(b, owned, s.money) : bulk;
    if (n < 1) return;
    let cost = bulkCost(b, owned, n);
    if (cost > s.money) {
      if (bulk === "max") return;
      n = maxAfford(b, owned, s.money);
      if (n < 1) return;
      cost = bulkCost(b, owned, n);
    }
    s.money -= cost;
    s.owned[b.id] = owned + n;
    C.current = recompute(s);
    const l = langRef.current;
    if (owned === 0) note(String(UI[l].noteBought), b.n[l] + " — " + b.d[l]);
    announceAchs();
    saveGame(s);
    render();
  }, [note, announceAchs]);

  const buyUp = useCallback((u: AnyUp) => {
    const s = S.current;
    if (s.ups[u.id] || s.money < u.c) return;
    s.money -= u.c;
    s.ups[u.id] = 1;
    const l = langRef.current;
    if (u.id === "f0") note(String(UI[l].noteFirm), String(UI[l].noteFirmTxt), "bad", 9000);
    if (u.id === "m0") note(String(UI[l].noteWedding), String(UI[l].noteWeddingTxt), "ach", 7000);
    C.current = recompute(s);
    announceAchs();
    saveGame(s);
    render();
  }, [note, announceAchs]);

  const start = useCallback((diffId: string) => {
    const s = S.current;
    s.diff = diffId;
    s.code = "A-" + String(Math.floor(Math.random() * 9000) + 1000);
    C.current = recompute(s);
    announceAchs();
    saveGame(s);
    if (diffId === "milan") {
      const l = langRef.current;
      note(String(UI[l].noteBox4), String(UI[l].noteBox4Txt));
    }
    render();
  }, [note, announceAchs]);

  const toggleSound = useCallback(() => {
    S.current.sound = !S.current.sound;
    saveGame(S.current);
    render();
  }, []);

  const reset = useCallback(() => {
    clearGame();
    location.reload();
  }, []);

  const achCount = Object.keys(S.current.achs).length;
  return {
    s: S.current, c: C.current, lang, ready, notes, achTotal: ACHS.length, achCount,
    setLang, stamp, buyBuilding, buyUp, start, toggleSound, reset,
  };
}
