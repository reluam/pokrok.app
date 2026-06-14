"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { track } from "@/lib/track";
import Link from "next/link";
import { getNode, isRedLink, searchNodes, titleOf, type SearchEntry } from "@/lib/encyclopedia/graph";
import { SpaceRealm, type NavDir } from "./SpaceRealm";
import { PlanetField } from "./PlanetField";
import { PlainRealm } from "./PlainRealm";
import type { Lang } from "@/lib/dictionaries";

const UI = {
  cs: {
    home: "← Spaghetti.ltd", eyebrow: "Encyklopedie", search: "Hledat", searchPh: "Hledej heslo… (třeba „slunce“)",
    empty: "Nic. Encyklopedie je mladá — zkus to jinak.", red: "neprobádáno",
    endHint: "konec větve — vrať se výš, nebo odboč klikem", map: "Mapa všeho", related: "Souvisí",
    redText: "Tohle téma encyklopedie zná, ale zatím ho nikdo neprobádal. Jednou tu bude — pravděpodobně neškodné.",
    wish: "Chci tohle téma", wished: "Zaznamenáno ✓", wishes: (n: number) => `${n}× přáno`,
  },
  en: {
    home: "← Spaghetti.ltd", eyebrow: "Encyclopedia", search: "Search", searchPh: "Search a topic… (try “sun”)",
    empty: "Nothing. The encyclopedia is young — try something else.", red: "uncharted",
    endHint: "end of this branch — go back up, or click a detour", map: "Map of everything", related: "Related",
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
    blur: "rgba(255,255,255,0.55)", pillBg: "rgba(255,255,255,0.65)", pillBorder: "rgba(26,22,20,0.2)",
    pillText: "rgba(26,22,20,0.75)", kbdBorder: "rgba(26,22,20,0.25)", kbdText: "rgba(26,22,20,0.5)",
    hint: "rgba(26,22,20,0.6)", end: "rgba(26,22,20,0.45)", home: "rgba(26,22,20,0.65)",
  },
} as const;

export type Theme = "light" | "dark";

export function EncyclopediaShell({ initialSlug, lang }: { initialSlug: string; lang: Lang }) {
  const u = UI[lang];
  const homeHref = lang === "cs" ? "/cs" : "/";
  const [slug, setSlug] = useState(initialSlug);
  const [dir, setDir] = useState<NavDir>("jump");
  const [trail, setTrail] = useState<string[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [theme, setTheme] = useState<Theme>("light");
  useEffect(() => { if (localStorage.getItem("ency-theme") === "dark") { const r = requestAnimationFrame(() => setTheme("dark")); return () => cancelAnimationFrame(r); } }, []);
  const toggleTheme = () => setTheme((t) => { const n = t === "light" ? "dark" : "light"; localStorage.setItem("ency-theme", n); return n; });

  const node = getNode(slug);
  const isGate = slug === "brana";
  const chromeDark = theme === "dark";
  const C = THEMES[chromeDark ? "dark" : "light"];
  const PC = C;
  const topText = node?.textPos === "top";

  const go = useCallback((to: string, d: NavDir) => {
    track("encyklopedie", "interact");
    setDir(d); setSlug(to); setSearchOpen(false);
    window.history.pushState({ ency: true }, "", to === "brana" ? "/encyclopedia" : `/${to}`);
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
  const act = useRef({ goNext, goUp, searchOpen, gate: isGate });
  useEffect(() => { act.current = { goNext, goUp, searchOpen, gate: isGate }; });

  useEffect(() => { track("encyklopedie", "open"); }, []);

  // zpět/vpřed prohlížeče
  useEffect(() => {
    const onPop = () => {
      const p = location.pathname.replace(/^\//, "");
      const s = p === "encyclopedia" || p === "encyklopedie" ? "brana" : p;
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
      if (now < lock.until || act.current.searchOpen || act.current.gate) return; // na rozcestí se nescrolluje do hloubky
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

  useEffect(() => { document.title = `${titleOf(slug === "brana" ? "brana" : slug, lang)} — Spaghetti.ltd`; }, [slug, lang]);

  const switchLang = () => {
    const target = lang === "cs" ? "en" : "cs";
    document.cookie = `lang=${target}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
    const p = location.pathname;
    if (p === "/cs" && target === "en") location.href = "/";
    else if (p === "/" && target === "cs") location.href = "/cs";
    else location.reload();
  };

  const overlayMax = node?.realm === "space" ? "min(470px, 84vmin)" : topText ? "min(560px, calc(100vw - 48px))" : "min(520px, 86vmin)";

  // související pojmy — místo špaget se vypíšou textem pod vysvětlením (obecnější, hlubší, odbočky)
  const related = node && !isGate
    ? (() => {
        const ids = [node.up, node.next, ...(node.satellites ?? []).map((s) => s.to)].filter((x): x is string => !!x);
        const seen = new Set<string>(); const out: { slug: string; label: string }[] = [];
        for (const id of ids) { if (id === slug || seen.has(id)) continue; seen.add(id); out.push({ slug: id, label: titleOf(id, lang) }); }
        return out;
      })()
    : [];

  return (
    <>
      {/* stránka — světlá default, tmavá volbou */}
      <div style={{ position: "fixed", inset: 0, zIndex: 0, background: theme === "dark" ? "#06070d" : "var(--bg)" }} />

      {/* realm (střed — tady se hesla smí lišit) */}
      {node ? (
        isGate ? <PlanetField lang={lang} theme={theme} onPick={dive} />
        : node.realm === "space" ? <SpaceRealm node={node} lang={lang} dir={dir} theme={theme} />
        : <PlainRealm node={node} lang={lang} theme={theme} />
      ) : (
        <RedLink slug={slug} lang={lang} dark={theme === "dark"} />
      )}

      {/* text přes střed — bez boxu, jen rozmazané pozadí; pro myš průhledný (brána má vlastní rozcestí) */}
      {node && !isGate && (
        <div style={{ position: "fixed", inset: 0, zIndex: 8, display: "flex", justifyContent: "center", alignItems: topText ? "flex-start" : "center", padding: topText ? "120px 22px 0" : "0 22px", pointerEvents: "none" }}>
          <div key={slug} style={{ position: "relative", maxWidth: overlayMax, animation: "encyText 560ms cubic-bezier(0.22,1,0.36,1)" }}>
            <div aria-hidden style={{ position: "absolute", inset: "-34px -50px", background: C.blur, backdropFilter: "blur(13px)", WebkitBackdropFilter: "blur(13px)", maskImage: "radial-gradient(closest-side, #000 55%, transparent 100%)", WebkitMaskImage: "radial-gradient(closest-side, #000 55%, transparent 100%)" }} />
            <div style={{ position: "relative", textAlign: "center", pointerEvents: "none" }}>
              <p style={{ fontFamily: "var(--font-sans)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.28em", color: C.faint, marginBottom: 10 }}>{u.eyebrow}</p>
              <h1 style={{ fontFamily: "var(--font-display)", fontSize: topText ? "clamp(26px,5vw,38px)" : "clamp(28px,6vw,42px)", fontWeight: 700, color: C.text, letterSpacing: "-0.03em", lineHeight: 1.05, marginBottom: 12 }}>{node.title[lang]}</h1>
              <p style={{ fontFamily: "var(--font-sans)", fontSize: topText ? 14 : 15, lineHeight: 1.65, color: C.body }}>{node.guide[lang]}</p>
              {node.features && node.features.length > 0 && node.realm !== "space" && (
                <p style={{ fontFamily: "var(--font-sans)", fontSize: 11.5, letterSpacing: "0.04em", color: C.muted, marginTop: 12 }}>
                  ✦ {node.features.map((f) => f[lang]).join(" · ")}
                </p>
              )}
              {/* související pojmy — jen text, žádné špagety */}
              {related.length > 0 && (
                <p style={{ pointerEvents: "auto", fontFamily: "var(--font-sans)", fontSize: 13, marginTop: 16, display: "flex", gap: "8px 14px", justifyContent: "center", flexWrap: "wrap" }}>
                  <span style={{ color: C.faint, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em", alignSelf: "center" }}>{u.related}</span>
                  {related.map((r) => (
                    <button key={r.slug} onClick={() => dive(r.slug)} style={{ background: "none", border: "none", padding: 0, cursor: "pointer", color: C.text, fontWeight: 600, fontFamily: "var(--font-sans)", fontSize: 13, textDecoration: "underline", textUnderlineOffset: 3 }}>{r.label}</button>
                  ))}
                </p>
              )}
              {node.links && node.links.length > 0 && (
                <p style={{ pointerEvents: "auto", fontFamily: "var(--font-sans)", fontSize: 13, fontWeight: 600, marginTop: 12, display: "flex", gap: 18, justifyContent: "center", flexWrap: "wrap" }}>
                  {node.links.map((l) => (
                    <Link key={l.href} href={l.href} style={{ color: C.text, textDecoration: "underline", textUnderlineOffset: 3 }}>{l.label[lang]}</Link>
                  ))}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* horní lišta — domů vlevo, hledání nahoře (mobil i PC) */}
      <div style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 50, display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", pointerEvents: "none" }}>
        <Link href={homeHref} style={{ fontFamily: "var(--font-sans)", fontSize: 12, color: PC.home, textDecoration: "none", flexShrink: 0, whiteSpace: "nowrap", pointerEvents: "auto" }}>{u.home}</Link>
        <div style={{ flex: 1, display: "flex", justifyContent: "center" }}>
          <div style={{ width: "min(420px, 100%)", pointerEvents: "auto" }}>
            <InlineSearch lang={lang} dark={chromeDark} gate open={searchOpen} onOpen={() => setSearchOpen(true)} onClose={() => setSearchOpen(false)} onPick={dive} />
          </div>
        </div>
      </div>


      {/* dolní řádek: konec větve dostane text (brána má vlastní rozcestí) */}
      {!isGate && (
        <div style={{ position: "fixed", bottom: "3vh", left: "50%", transform: "translateX(-50%)", zIndex: 20, textAlign: "center" }}>
          {node && !node.next ? (
            <span style={{ color: PC.end, fontFamily: "var(--font-sans)", fontSize: 11.5 }}>{u.endHint}</span>
          ) : null}
        </div>
      )}

      {/* mapa + téma + jazyk */}
      <div style={{ position: "fixed", bottom: 18, right: 18, zIndex: 20, display: "flex", gap: 8, alignItems: "center" }}>
        <Link href="/mapa" title={u.map} aria-label={u.map}
          style={{ width: 34, height: 34, borderRadius: 10, display: "grid", placeItems: "center", background: PC.pillBg, border: `1px solid ${PC.pillBorder}`, textDecoration: "none", fontSize: 15, backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}>🗺</Link>
        <button onClick={toggleTheme} title={theme === "light" ? "Dark" : "Light"}
          style={{ width: 34, height: 34, borderRadius: 10, display: "grid", placeItems: "center", background: PC.pillBg, border: `1px solid ${PC.pillBorder}`, cursor: "pointer", fontSize: 14, backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}>
          {theme === "light" ? "🌙" : "☀️"}
        </button>
        <button onClick={switchLang} title={lang === "cs" ? "English" : "Čeština"}
          style={{ height: 34, padding: "0 10px", borderRadius: 10, background: PC.pillBg, border: `1px solid ${PC.pillBorder}`, color: PC.pillText, fontFamily: "var(--font-sans)", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", cursor: "pointer", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}>
          {lang === "cs" ? "EN" : "CS"}
        </button>
      </div>

      {/* rozmazání stránky při hledání — výsledky se píšou přímo do pole */}
      {searchOpen && (
        <div onClick={() => setSearchOpen(false)}
          style={{ position: "fixed", inset: 0, zIndex: 44, background: chromeDark ? "rgba(2,4,12,0.5)" : "rgba(250,248,243,0.45)", backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)" }} />
      )}

      <style>{`
        @keyframes encyText { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: none; } }
        @keyframes encyBob { 0%,100% { transform: translateY(0); } 50% { transform: translateY(5px); } }
      `}</style>
    </>
  );
}

/* ── Hledání — píše se přímo do pole, výsledky pod ním ──────────── */
function InlineSearch({ lang, dark, gate, open, onOpen, onClose, onPick }: {
  lang: Lang; dark: boolean; gate?: boolean; open: boolean;
  onOpen: () => void; onClose: () => void; onPick: (slug: string) => void;
}) {
  const u = UI[lang];
  const [q, setQ] = useState("");
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (open) { ref.current?.focus(); return; }
    ref.current?.blur();
    const r = requestAnimationFrame(() => setQ(""));
    return () => cancelAnimationFrame(r);
  }, [open]);
  const results: SearchEntry[] = open && q.trim() ? searchNodes(q, lang) : [];
  const pick = (s: string) => { onPick(s); onClose(); };
  const ink = dark ? "#fff" : "#1a1614";
  const soft = dark ? "rgba(255,255,255,0.55)" : "rgba(26,22,20,0.55)";
  const rowBg = dark ? "rgba(12,14,24,0.88)" : "rgba(255,255,255,0.94)";
  const rowBorder = dark ? "1px solid rgba(255,255,255,0.14)" : "1px solid rgba(26,22,20,0.14)";

  return (
    <div style={{ position: "relative", pointerEvents: "auto" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 9, background: dark ? "rgba(255,255,255,0.09)" : "rgba(255,255,255,0.8)", border: dark ? "1px solid rgba(255,255,255,0.2)" : "1px solid rgba(26,22,20,0.2)", borderRadius: 999, padding: gate ? "11px 18px" : "10px 20px", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}>
        <span aria-hidden>🔍</span>
        <input ref={ref} value={q} className="ency-search"
          onFocus={onOpen}
          onChange={(e) => { setQ(e.target.value); if (!open) onOpen(); }}
          onKeyDown={(e) => { if (e.key === "Enter" && results[0]) pick(results[0].slug); if (e.key === "Escape") onClose(); }}
          placeholder={u.searchPh}
          style={{ background: "none", border: "none", outline: "none", color: ink, fontFamily: "var(--font-sans)", fontSize: 16, width: gate ? "100%" : open ? "min(380px, 56vw)" : 180, transition: "width 250ms ease", minWidth: 0, flex: gate ? 1 : undefined }} />
        <kbd style={{ fontFamily: "var(--font-sans)", fontSize: 10, padding: "1px 5px", borderRadius: 5, border: dark ? "1px solid rgba(255,255,255,0.25)" : "1px solid rgba(26,22,20,0.25)", color: soft, flexShrink: 0 }}>⌘K</kbd>
      </div>

      {open && q.trim() && (
        <div style={{ position: "absolute", top: "calc(100% + 10px)", left: "50%", transform: "translateX(-50%)", width: "min(480px, calc(100vw - 36px))", maxHeight: "52vh", overflowY: "auto", display: "flex", flexDirection: "column", gap: 6 }}>
          {results.length === 0 && (
            <p style={{ color: soft, fontFamily: "var(--font-sans)", fontSize: 13, padding: "10px 6px", textAlign: "center", background: rowBg, border: rowBorder, borderRadius: 12 }}>{u.empty}</p>
          )}
          {results.map((r) => (
            <button key={r.slug} onClick={() => pick(r.slug)}
              style={{ textAlign: "left", background: rowBg, border: rowBorder, borderRadius: 12, padding: "10px 14px", cursor: "pointer", display: "flex", flexDirection: "column", gap: 3 }}>
              <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ color: ink, fontFamily: "var(--font-sans)", fontSize: 14, fontWeight: 700 }}>{r.title[lang]}</span>
                {r.red && <span style={{ fontFamily: "var(--font-sans)", fontSize: 9, textTransform: "uppercase", letterSpacing: "0.12em", color: soft, border: `1px dashed ${soft}`, borderRadius: 6, padding: "1px 6px" }}>{u.red}</span>}
              </span>
              {r.guide && <span style={{ color: soft, fontFamily: "var(--font-sans)", fontSize: 12, lineHeight: 1.45, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 1, WebkitBoxOrient: "vertical" }}>{r.guide[lang]}</span>}
            </button>
          ))}
        </div>
      )}
      <style>{`.ency-search::placeholder { color: inherit; opacity: 0.5; }`}</style>
    </div>
  );
}

/* ── Červený odkaz — heslo, které ještě nikdo neprobádal ────────── */
function RedLink({ slug, lang, dark }: { slug: string; lang: Lang; dark: boolean }) {
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
  const ink = dark ? "#fff" : "#1a1614";
  const soft = dark ? "rgba(255,255,255,0.55)" : "rgba(26,22,20,0.55)";
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1, background: dark ? "radial-gradient(120% 100% at 35% 30%, #0b1026, #04060f 75%)" : "radial-gradient(120% 100% at 35% 30%, #fffdf6, #f1ece0 75%)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "70px 24px", textAlign: "center" }}>
      <div style={{ width: 130, height: 130, borderRadius: "50%", border: `2px dashed ${dark ? "rgba(255,255,255,0.35)" : "rgba(26,22,20,0.3)"}`, display: "grid", placeItems: "center", color: soft, fontFamily: "var(--font-display)", fontSize: 52, fontWeight: 700, marginBottom: 26, animation: "encyFloat 5s ease-in-out infinite" }}>?</div>
      <p style={{ fontFamily: "var(--font-sans)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.28em", color: soft, marginBottom: 10 }}>{u.red}</p>
      <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(28px,6vw,44px)", fontWeight: 700, color: ink, letterSpacing: "-0.03em", marginBottom: 12 }}>{titleOf(slug, lang)}</h1>
      <p style={{ fontFamily: "var(--font-sans)", fontSize: 15, lineHeight: 1.7, color: dark ? "rgba(255,255,255,0.8)" : "rgba(26,22,20,0.75)", maxWidth: 460, marginBottom: 24 }}>{u.redText}</p>
      <button onClick={wish} disabled={wished}
        style={{ background: wished ? (dark ? "rgba(255,255,255,0.1)" : "rgba(26,22,20,0.08)") : ink, color: wished ? soft : (dark ? "#0b1026" : "#fff"), border: "none", borderRadius: 999, padding: "11px 26px", fontFamily: "var(--font-sans)", fontSize: 14, fontWeight: 700, cursor: wished ? "default" : "pointer" }}>
        {wished ? u.wished : u.wish}
      </button>
      {votes !== null && votes > 0 && (
        <p style={{ fontFamily: "var(--font-sans)", fontSize: 12, color: soft, marginTop: 12 }}>{u.wishes(votes)}</p>
      )}
      <style>{`@keyframes encyFloat { 0%,100% { margin-top: -3px; } 50% { margin-top: 3px; } }`}</style>
    </div>
  );
}
