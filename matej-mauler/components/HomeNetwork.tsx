"use client";

import { useMemo, useState } from "react";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { ExperimentPreview } from "./ExperimentPreview";
import { HandDrawnCard } from "./HandDrawnCard";
import { CATEGORIES } from "@/lib/experiments";
import { SPAGHETTI_BLURB } from "@/lib/about";
import type { Dictionary, Lang } from "@/lib/dictionaries";
import type { PublicExperiment } from "@/lib/experimentsDb";

const display: React.CSSProperties = { fontFamily: "var(--font-display)" };
const sans = "var(--font-sans)";

const T = {
  cs: { browse: "Procházet všechny experimenty", back: "← Zpět", search: "Hledej experiment…", allCats: "Vše", open: "Otevřít", none: "Nic se nenašlo." },
  en: { browse: "Browse all experiments", back: "← Back", search: "Search experiments…", allCats: "All", open: "Open", none: "Nothing found." },
};

const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
const ROT = ["-1.3deg", "0.9deg", "-0.5deg", "1.2deg", "-0.9deg", "0.6deg"];

function ProjectCard({ item, lang, i, open }: { item: PublicExperiment; lang: Lang; i: number; open: string }) {
  const cat = CATEGORIES[item.slug];
  return (
    <a
      key={item.slug}
      href={item.href}
      {...(item.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      className="zcard group/card block"
      style={{ "--rot": ROT[i % ROT.length] } as React.CSSProperties}
    >
      <HandDrawnCard variant={i % 3} shadow shadowOffset={6} className="h-full" innerClassName="p-6 md:p-7 flex flex-col h-full">
        <div style={{ borderRadius: 12, overflow: "hidden", border: "2px solid #171717", marginBottom: 13 }}>
          <ExperimentPreview slug={item.slug} title={item.title} color={item.color} lang={lang} />
        </div>
        {cat && <span style={{ ...display, fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.14em", color: "var(--accent, #c2410c)", marginBottom: 4 }}>{cat}</span>}
        <h3 style={{ ...display, fontSize: 21, fontWeight: 900, letterSpacing: "-0.02em", lineHeight: 1.1, marginBottom: 6, color: "#171717" }}>{item.title}</h3>
        <p style={{ fontFamily: "var(--font-grotesk)", fontSize: 14, lineHeight: 1.55, color: "rgba(23,23,23,0.72)", flex: 1, marginBottom: 14 }}>{item.description}</p>
        <span style={{ ...display, fontSize: 14, fontWeight: 800, color: "#171717", display: "inline-flex", alignItems: "center", gap: 6 }}>
          {open} <span className="zarrow">→</span>
        </span>
      </HandDrawnCard>
    </a>
  );
}

export function HomeNetwork({ dict, lang, items }: { dict: Dictionary; lang: Lang; items: PublicExperiment[] }) {
  const t = T[lang];
  const [mode, setMode] = useState<"home" | "browse">("home");
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string | null>(null);

  const cats = useMemo(() => [...new Set(items.map((it) => CATEGORIES[it.slug]).filter(Boolean))], [items]);
  const filtered = useMemo(() => {
    const nq = norm(q.trim());
    return items.filter((it) => {
      const c = CATEGORIES[it.slug];
      const okCat = !cat || c === cat;
      const hay = norm(`${it.title} ${it.description} ${c ?? ""}`);
      return okCat && (!nq || hay.includes(nq));
    });
  }, [items, q, cat]);

  // ─── logo + název (sdílené oběma režimy) ───
  const brand = (size: "lg" | "sm") => (
    <div style={{ display: "flex", alignItems: "center", gap: size === "lg" ? 16 : 12 }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logo.svg" alt="Spaghetti.ltd" width={size === "lg" ? 70 : 46} height={size === "lg" ? 70 : 46} style={{ display: "block", flexShrink: 0 }} />
      <span style={{ ...display, fontSize: size === "lg" ? 40 : 25, fontWeight: 900, letterSpacing: "-0.03em", lineHeight: 1 }}>
        Spaghetti<span style={{ color: "var(--text-muted)" }}>.ltd</span>
      </span>
    </div>
  );

  if (mode === "browse") {
    return (
      <main style={{ background: "var(--bg)", minHeight: "100dvh" }}>
        <LanguageSwitcher lang={lang} labels={dict.switcher} />
        <div className="browse-grid">
          <aside className="browse-side animate-fade-up">
            <button onClick={() => setMode("home")} style={{ ...display, fontSize: 13, fontWeight: 700, color: "var(--text-muted)", background: "none", border: "none", cursor: "pointer", padding: 0, marginBottom: 18 }}>{t.back}</button>
            {brand("sm")}
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t.search}
              autoFocus
              style={{ marginTop: 22, width: "100%", padding: "11px 15px", borderRadius: 12, border: "2.5px solid var(--border)", background: "#fff", fontFamily: sans, fontSize: 14, outline: "none", boxShadow: "3px 3px 0 var(--border)" }}
            />
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 16 }}>
              <Chip active={cat === null} onClick={() => setCat(null)} label={t.allCats} />
              {cats.map((c) => <Chip key={c} active={cat === c} onClick={() => setCat(c)} label={c} />)}
            </div>
          </aside>

          <section className="browse-main">
            {filtered.length === 0 ? (
              <p style={{ fontFamily: sans, fontSize: 15, color: "var(--text-muted)", padding: "10px 2px" }}>{t.none}</p>
            ) : (
              <div className="zcards">
                {filtered.map((item, i) => <ProjectCard key={item.slug} item={item} lang={lang} i={i} open={t.open} />)}
              </div>
            )}
          </section>
        </div>
      </main>
    );
  }

  // ─── home režim ───
  const a = dict.about;
  return (
    <main style={{ background: "var(--bg)", minHeight: "100vh" }}>
      <LanguageSwitcher lang={lang} labels={dict.switcher} />
      <div className="max-w-[1100px] mx-auto px-5 md:px-8">
        {/* logo + název + popis */}
        <header className="pt-16 md:pt-20 pb-12 animate-fade-up">
          <div style={{ marginBottom: 18 }}>{brand("lg")}</div>
          <p className="text-[18px] md:text-[22px] max-w-[620px]" style={{ ...display, fontStyle: "italic", color: "var(--text-primary)", lineHeight: 1.4 }}>{SPAGHETTI_BLURB[lang]}</p>
        </header>

        {/* projekty */}
        <div className="mb-6 animate-fade-up" style={{ animationDelay: "40ms", display: "flex", alignItems: "baseline", gap: 16, flexWrap: "wrap" }}>
          <h2 className="text-[22px] md:text-[26px] leading-none" style={{ ...display, fontWeight: 900, letterSpacing: "-0.02em" }}>{dict.products.title}</h2>
          <span style={{ fontFamily: sans, fontSize: 13, color: "var(--text-muted)", fontStyle: "italic" }}>{dict.products.subtitle}</span>
          <button onClick={() => setMode("browse")} style={{ ...display, marginLeft: "auto", fontSize: 13, fontWeight: 800, color: "var(--text-primary)", background: "none", border: "none", cursor: "pointer", textDecoration: "underline", textUnderlineOffset: 4, padding: 0 }}>{t.browse} →</button>
        </div>

        <section className="zcards animate-fade-up pb-14" style={{ animationDelay: "60ms" }}>
          {items.map((item, i) => <ProjectCard key={item.slug} item={item} lang={lang} i={i} open={t.open} />)}
        </section>

        {/* about */}
        <section className="py-10" style={{ borderTop: "1.5px solid rgba(26,22,20,0.1)" }}>
          <h2 className="text-[20px] md:text-[24px] mb-4" style={{ ...display, fontWeight: 900, letterSpacing: "-0.02em" }}>{a.heading}</h2>
          <div className="max-w-[620px]" style={{ color: "var(--text-secondary)", fontFamily: sans, fontSize: 15, lineHeight: 1.7 }}>
            <p className="mb-4">{a.p1}</p>
            <p className="mb-4" style={{ fontWeight: 600, color: "var(--text-primary)" }}>{a.p2}</p>
            <p className="mb-4">{a.p3a}<a href="mailto:matej@matejmauler.com" style={{ color: "var(--text-primary)", textDecoration: "underline", textUnderlineOffset: 3, fontWeight: 600 }}>{a.writeMe}</a>{a.p3b}</p>
            <p>{a.rewardA}<a href="/pravdepodobnost" style={{ color: "var(--text-primary)", textDecoration: "underline", textUnderlineOffset: 3, fontWeight: 600 }}>{a.rewardLink}</a></p>
          </div>
        </section>

        <footer className="py-8" style={{ borderTop: "1.5px solid rgba(26,22,20,0.1)", color: "var(--text-muted)", fontFamily: sans, fontSize: 12 }}>© {new Date().getFullYear()} Spaghetti.ltd</footer>
      </div>
    </main>
  );
}

function Chip({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      style={{
        ...display, fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em",
        padding: "6px 13px", borderRadius: 999, cursor: "pointer",
        border: "2px solid var(--border)",
        background: active ? "var(--text-primary)" : "transparent",
        color: active ? "var(--bg)" : "var(--text-primary)",
        boxShadow: active ? "2px 2px 0 var(--border)" : "none",
      }}
    >
      {label}
    </button>
  );
}
