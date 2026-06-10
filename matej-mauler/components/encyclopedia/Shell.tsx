"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { getNode, isRedLink, searchNodes, titleOf, type SearchEntry } from "@/lib/encyclopedia/graph";
import { SpaceRealm, type NavDir } from "./SpaceRealm";
import { SoundRealm } from "./SoundRealm";
import { MusicRealm } from "./MusicRealm";
import type { Lang } from "@/lib/dictionaries";

const UI = {
  cs: {
    home: "← Spaghetti.ltd", eyebrow: "Encyklopedie", search: "Hledat", searchPh: "Hledej heslo… (třeba „slunce“)",
    empty: "Nic. Encyklopedie je mladá — zkus to jinak.", red: "neprobádáno",
    endHint: "konec větve — vrať se výš, nebo odboč klikem",
    redText: "Tohle téma encyklopedie zná, ale zatím ho nikdo neprobádal. Jednou tu bude — pravděpodobně neškodné.",
    wish: "Chci tohle téma", wished: "Zaznamenáno ✓", wishes: (n: number) => `${n}× přáno`,
  },
  en: {
    home: "← Spaghetti.ltd", eyebrow: "Encyclopedia", search: "Search", searchPh: "Search a topic… (try “sun”)",
    empty: "Nothing. The encyclopedia is young — try something else.", red: "uncharted",
    endHint: "end of this branch — go back up, or click a detour",
    redText: "The encyclopedia knows about this topic, but nobody has charted it yet. One day it will be here — probably harmless.",
    wish: "I want this topic", wished: "Noted ✓", wishes: (n: number) => `wished ${n}×`,
  },
} as const;

const THEMES = {
  dark: {
    text: "#fff", body: "rgba(255,255,255,0.88)", muted: "rgba(255,255,255,0.55)", faint: "rgba(255,255,255,0.45)",
    blur: "rgba(4,6,15,0.5)", pillBg: "rgba(255,255,255,0.08)", pillBorder: "rgba(255,255,255,0.18)",
    pillText: "rgba(255,255,255,0.8)", kbdBorder: "rgba(255,255,255,0.25)", kbdText: "rgba(255,255,255,0.5)",
    hint: "rgba(255,255,255,0.65)", end: "rgba(255,255,255,0.4)", home: "rgba(255,255,255,0.7)",
  },
  light: {
    text: "#1a1614", body: "rgba(26,22,20,0.85)", muted: "rgba(26,22,20,0.55)", faint: "rgba(26,22,20,0.45)",
    blur: "rgba(255,255,255,0.55)", pillBg: "rgba(255,255,255,0.6)", pillBorder: "rgba(26,22,20,0.2)",
    pillText: "rgba(26,22,20,0.75)", kbdBorder: "rgba(26,22,20,0.25)", kbdText: "rgba(26,22,20,0.5)",
    hint: "rgba(26,22,20,0.6)", end: "rgba(26,22,20,0.45)", home: "rgba(26,22,20,0.65)",
  },
} as const;

export function EncyclopediaShell({ initialSlug, lang }: { initialSlug: string; lang: Lang }) {
  const u = UI[lang];
  const homeHref = lang === "cs" ? "/cs" : "/";
  const [slug, setSlug] = useState(initialSlug);
  const [dir, setDir] = useState<NavDir>("jump");
  const [trail, setTrail] = useState<string[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const node = getNode(slug);
  const C = THEMES[node?.theme ?? "dark"];
  const topText = node?.textPos === "top";

  const go = useCallback((to: string, d: NavDir) => {
    setDir(d); setSlug(to); setSearchOpen(false);
    window.history.pushState({ ency: true }, "", `/${to}`);
  }, []);
  const dive = useCallback((to: string) => { setTrail((t) => [...t, slug]); go(to, "dive"); }, [go, slug]);
  const goUp = useCallback(() => {
    setTrail((t) => {
      if (t.length) { go(t[t.length - 1], "rise"); return t.slice(0, -1); }
      const up = getNode(slug)?.up;
      if (up) go(up, "rise");
      return t;
    });
  }, [go, slug]);
  const goNext = useCallback(() => { const next = getNode(slug)?.next; if (next) dive(next); }, [dive, slug]);

  // aktuální akce v ref, ať globální listenery nepřepojujeme při každé navigaci
  const act = useRef({ goNext, goUp, searchOpen });
  useEffect(() => { act.current = { goNext, goUp, searchOpen }; });

  // zpět/vpřed prohlížeče
  useEffect(() => {
    const onPop = () => {
      const s = location.pathname.replace(/^\//, "");
      if (getNode(s) || isRedLink(s)) { setDir("jump"); setSlug(s); setTrail([]); }
      else location.reload();
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  // scroll ↓ = hloub po trase, scroll ↑ = výš; swipe a klávesy stejně
  useEffect(() => {
    const lock = { until: 0, acc: 0 };
    const step = (d: number) => {
      const now = Date.now();
      if (now < lock.until || act.current.searchOpen) return;
      lock.acc += d;
      if (lock.acc > 70) { lock.acc = 0; lock.until = now + 900; act.current.goNext(); }
      else if (lock.acc < -70) { lock.acc = 0; lock.until = now + 900; act.current.goUp(); }
    };
    const onWheel = (e: WheelEvent) => step(e.deltaY);
    let startY = 0;
    const onTS = (e: TouchEvent) => { startY = e.touches[0].clientY; };
    const onTE = (e: TouchEvent) => { const dy = startY - e.changedTouches[0].clientY; if (Math.abs(dy) > 60) step(dy > 0 ? 100 : -100); };
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setSearchOpen((o) => !o); return; }
      if (act.current.searchOpen) { if (e.key === "Escape") setSearchOpen(false); return; }
      if (e.key === "Escape" || e.key === "ArrowUp" || e.key === "PageUp") act.current.goUp();
      if (e.key === "ArrowDown" || e.key === "PageDown") act.current.goNext();
    };
    const decay = setInterval(() => { lock.acc *= 0.5; }, 250);
    window.addEventListener("wheel", onWheel, { passive: true });
    window.addEventListener("touchstart", onTS, { passive: true });
    window.addEventListener("touchend", onTE, { passive: true });
    window.addEventListener("keydown", onKey);
    return () => {
      clearInterval(decay);
      window.removeEventListener("wheel", onWheel); window.removeEventListener("touchstart", onTS);
      window.removeEventListener("touchend", onTE); window.removeEventListener("keydown", onKey);
    };
  }, []);

  useEffect(() => { document.title = `${titleOf(slug, lang)} — Spaghetti.ltd`; }, [slug, lang]);

  const upTarget = trail.length ? trail[trail.length - 1] : node?.up;

  return (
    <>
      {/* realm (pozadí + interaktivní obsah) */}
      {node ? (
        node.realm === "space" ? <SpaceRealm node={node} lang={lang} dir={dir} onNavigate={dive} />
        : node.realm === "sound" ? <SoundRealm node={node} lang={lang} onNavigate={dive} />
        : <MusicRealm node={node} lang={lang} onNavigate={dive} />
      ) : (
        <RedLink slug={slug} lang={lang} />
      )}

      {/* text přes subjekt — bez boxu, jen rozmazané pozadí; nic klikatelného pod ním */}
      {node && (
        <div style={{ position: "fixed", inset: 0, zIndex: 8, display: "flex", justifyContent: "center", alignItems: topText ? "flex-start" : "center", padding: topText ? "8vh 22px 0" : "0 22px", pointerEvents: "none" }}>
          <div key={slug} style={{ position: "relative", maxWidth: topText ? "min(620px, calc(100vw - 240px))" : 620, animation: "encyText 560ms cubic-bezier(0.22,1,0.36,1)" }}>
            <div aria-hidden style={{ position: "absolute", inset: "-34px -50px", background: C.blur, backdropFilter: "blur(13px)", WebkitBackdropFilter: "blur(13px)", maskImage: "radial-gradient(closest-side, #000 55%, transparent 100%)", WebkitMaskImage: "radial-gradient(closest-side, #000 55%, transparent 100%)" }} />
            <div style={{ position: "relative", textAlign: "center", pointerEvents: "auto" }}>
              <p style={{ fontFamily: "var(--font-sans)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.28em", color: C.faint, marginBottom: 10 }}>{u.eyebrow}</p>
              <h1 style={{ fontFamily: "var(--font-display)", fontSize: topText ? "clamp(26px,5vw,38px)" : "clamp(28px,6vw,44px)", fontWeight: 700, color: C.text, letterSpacing: "-0.03em", lineHeight: 1.05, marginBottom: 12 }}>{node.title[lang]}</h1>
              <p style={{ fontFamily: "var(--font-sans)", fontSize: topText ? 14 : 15, lineHeight: 1.65, color: C.body }}>{node.guide[lang]}</p>
              {node.features && node.features.length > 0 && (
                <p style={{ fontFamily: "var(--font-sans)", fontSize: 11.5, letterSpacing: "0.04em", color: C.muted, marginTop: 12 }}>
                  ✦ {node.features.map((f) => f[lang]).join(" · ")}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* chrome */}
      <div style={{ position: "fixed", top: 16, left: 20, zIndex: 20 }}>
        <Link href={homeHref} style={{ fontFamily: "var(--font-sans)", fontSize: 12, color: C.home, textDecoration: "none" }}>{u.home}</Link>
      </div>

      <button onClick={() => setSearchOpen(true)}
        style={{ position: "fixed", top: 12, left: "50%", transform: "translateX(-50%)", zIndex: 20, display: "flex", alignItems: "center", gap: 8, background: C.pillBg, border: `1px solid ${C.pillBorder}`, borderRadius: 999, padding: "7px 16px", color: C.pillText, fontFamily: "var(--font-sans)", fontSize: 12.5, fontWeight: 600, cursor: "pointer", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}>
        <span aria-hidden>🔍</span> {u.search}
        <kbd style={{ fontFamily: "var(--font-sans)", fontSize: 10, padding: "1px 5px", borderRadius: 5, border: `1px solid ${C.kbdBorder}`, color: C.kbdText }}>⌘K</kbd>
      </button>

      {/* výš (obecněji) */}
      {upTarget && (
        <button onClick={goUp}
          style={{ position: "fixed", top: 56, left: "50%", transform: "translateX(-50%)", zIndex: 20, background: "none", border: "none", color: C.muted, fontFamily: "var(--font-sans)", fontSize: 12, fontWeight: 600, cursor: "pointer", padding: 6 }}>
          ↑ {titleOf(upTarget, lang)}
        </button>
      )}

      {/* dál (konkrétněji) */}
      <div style={{ position: "fixed", bottom: "3vh", left: "50%", transform: "translateX(-50%)", zIndex: 20, textAlign: "center" }}>
        {node?.next ? (
          <button onClick={goNext}
            style={{ background: "none", border: "none", color: C.hint, fontFamily: "var(--font-sans)", fontSize: 12.5, fontWeight: 600, cursor: "pointer", padding: 6, animation: "encyBob 2s ease-in-out infinite" }}>
            ↓ {titleOf(node.next, lang)}
          </button>
        ) : node ? (
          <span style={{ color: C.end, fontFamily: "var(--font-sans)", fontSize: 11.5 }}>{u.endHint}</span>
        ) : null}
      </div>

      {searchOpen && <Search lang={lang} onPick={(s) => dive(s)} onClose={() => setSearchOpen(false)} />}

      <style>{`
        @keyframes encyText { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: none; } }
        @keyframes encyBob { 0%,100% { transform: translateY(0); } 50% { transform: translateY(5px); } }
      `}</style>
    </>
  );
}

/* ── Hledání — vždy nahoře uprostřed, ⌘K ────────────────────────── */
function Search({ lang, onPick, onClose }: { lang: Lang; onPick: (slug: string) => void; onClose: () => void }) {
  const u = UI[lang];
  const [q, setQ] = useState("");
  const results: SearchEntry[] = searchNodes(q, lang);
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 50, background: "rgba(2,4,12,0.72)", backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)", display: "flex", justifyContent: "center", alignItems: "flex-start", paddingTop: "16vh" }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: "min(560px, calc(100vw - 40px))" }}>
        <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder={u.searchPh}
          onKeyDown={(e) => { if (e.key === "Enter" && results[0]) onPick(results[0].slug); }}
          style={{ width: "100%", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.22)", borderRadius: 16, padding: "14px 18px", color: "#fff", fontFamily: "var(--font-sans)", fontSize: 16, outline: "none" }} />
        <div style={{ marginTop: 10, maxHeight: "52vh", overflowY: "auto", display: "flex", flexDirection: "column", gap: 6 }}>
          {q.trim() && results.length === 0 && (
            <p style={{ color: "rgba(255,255,255,0.5)", fontFamily: "var(--font-sans)", fontSize: 13, padding: "10px 6px" }}>{u.empty}</p>
          )}
          {results.map((r) => (
            <button key={r.slug} onClick={() => onPick(r.slug)}
              style={{ textAlign: "left", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, padding: "10px 14px", cursor: "pointer", display: "flex", flexDirection: "column", gap: 3 }}>
              <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ color: "#fff", fontFamily: "var(--font-sans)", fontSize: 14, fontWeight: 700 }}>{r.title[lang]}</span>
                {r.red && <span style={{ fontFamily: "var(--font-sans)", fontSize: 9, textTransform: "uppercase", letterSpacing: "0.12em", color: "rgba(255,255,255,0.4)", border: "1px dashed rgba(255,255,255,0.3)", borderRadius: 6, padding: "1px 6px" }}>{u.red}</span>}
              </span>
              {r.guide && <span style={{ color: "rgba(255,255,255,0.55)", fontFamily: "var(--font-sans)", fontSize: 12, lineHeight: 1.45, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 1, WebkitBoxOrient: "vertical" }}>{r.guide[lang]}</span>}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Červený odkaz — heslo, které ještě nikdo neprobádal ────────── */
function RedLink({ slug, lang }: { slug: string; lang: Lang }) {
  const u = UI[lang];
  const [votes, setVotes] = useState<number | null>(null);
  const [wished, setWished] = useState(false);
  useEffect(() => {
    let alive = true;
    const had = !!localStorage.getItem(`ency-wish:${slug}`);
    fetch(`/api/wish/${slug}`)
      .then((r) => r.json()).catch(() => ({ votes: 0 }))
      .then((d) => { if (!alive) return; setWished(had); setVotes(d.votes ?? 0); });
    return () => { alive = false; };
  }, [slug]);
  const wish = async () => {
    if (wished) return;
    setWished(true); localStorage.setItem(`ency-wish:${slug}`, "1");
    try { const r = await fetch(`/api/wish/${slug}`, { method: "POST" }); const d = await r.json(); setVotes(d.votes ?? null); } catch {}
  };
  return (
    <div style={{ position: "fixed", inset: 0, background: "radial-gradient(120% 100% at 35% 30%, #0b1026, #04060f 75%)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "70px 24px", textAlign: "center" }}>
      <div style={{ width: 130, height: 130, borderRadius: "50%", border: "2px dashed rgba(255,255,255,0.35)", display: "grid", placeItems: "center", color: "rgba(255,255,255,0.55)", fontFamily: "var(--font-display)", fontSize: 52, fontWeight: 700, marginBottom: 26, animation: "encyFloat 5s ease-in-out infinite" }}>?</div>
      <p style={{ fontFamily: "var(--font-sans)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.28em", color: "rgba(255,255,255,0.45)", marginBottom: 10 }}>{u.red}</p>
      <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(28px,6vw,44px)", fontWeight: 700, color: "#fff", letterSpacing: "-0.03em", marginBottom: 12 }}>{titleOf(slug, lang)}</h1>
      <p style={{ fontFamily: "var(--font-sans)", fontSize: 15, lineHeight: 1.7, color: "rgba(255,255,255,0.8)", maxWidth: 460, marginBottom: 24 }}>{u.redText}</p>
      <button onClick={wish} disabled={wished}
        style={{ background: wished ? "rgba(255,255,255,0.1)" : "#fff", color: wished ? "rgba(255,255,255,0.8)" : "#0b1026", border: "none", borderRadius: 999, padding: "11px 26px", fontFamily: "var(--font-sans)", fontSize: 14, fontWeight: 700, cursor: wished ? "default" : "pointer" }}>
        {wished ? u.wished : u.wish}
      </button>
      {votes !== null && votes > 0 && (
        <p style={{ fontFamily: "var(--font-sans)", fontSize: 12, color: "rgba(255,255,255,0.45)", marginTop: 12 }}>{u.wishes(votes)}</p>
      )}
      <style>{`@keyframes encyFloat { 0%,100% { margin-top: -3px; } 50% { margin-top: 3px; } }`}</style>
    </div>
  );
}
