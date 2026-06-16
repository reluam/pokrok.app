"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ExperimentPreview } from "./ExperimentPreview";
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

function ProjectCard({ item, lang, open }: { item: PublicExperiment; lang: Lang; open: string }) {
  const cat = CATEGORIES[item.slug];
  return (
    <a
      key={item.slug}
      href={item.href}
      {...(item.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      className="scard group/card"
    >
      <div className="p-5 md:p-6 flex flex-col h-full">
        <div className="scard-banner" style={{ marginBottom: 14 }}>
          <ExperimentPreview slug={item.slug} title={item.title} color={item.color} lang={lang} />
        </div>
        {cat && <span style={{ ...display, fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--text-muted)", marginBottom: 6 }}>{cat}</span>}
        <h3 style={{ ...display, fontSize: 21, fontWeight: 900, letterSpacing: "-0.02em", lineHeight: 1.12, marginBottom: 7, color: "var(--text-primary)" }}>{item.title}</h3>
        <p style={{ fontFamily: "var(--font-grotesk)", fontSize: 14, lineHeight: 1.55, color: "var(--text-secondary)", flex: 1, marginBottom: 16 }}>{item.description}</p>
        <span style={{ ...display, fontSize: 13.5, fontWeight: 800, color: "var(--text-primary)", display: "inline-flex", alignItems: "center", gap: 6 }}>
          {open} <span className="zarrow">→</span>
        </span>
      </div>
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
        <div className="browse-grid">
          <aside className="browse-side animate-fade-up">
            <button onClick={() => setMode("home")} className="sbtn" style={{ fontSize: 12, padding: "7px 15px", marginBottom: 18 }}>{t.back}</button>
            {brand("sm")}
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t.search} autoFocus className="sinput" style={{ marginTop: 22 }} />
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
                {filtered.map((item) => <ProjectCard key={item.slug} item={item} lang={lang} open={t.open} />)}
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
      <div className="max-w-[1100px] mx-auto px-5 md:px-8">
        {/* logo + název + popis */}
        <header className="pt-16 md:pt-20 pb-12 animate-fade-up">
          <div style={{ marginBottom: 18 }}>{brand("lg")}</div>
          <p className="text-[18px] md:text-[22px] max-w-[620px]" style={{ ...display, fontStyle: "italic", color: "var(--text-primary)", lineHeight: 1.4 }}>{SPAGHETTI_BLURB[lang]}</p>
        </header>

        {/* projekty */}
        <div className="mb-6 animate-fade-up" style={{ animationDelay: "40ms", display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
          <h2 className="text-[22px] md:text-[26px] leading-none" style={{ ...display, fontWeight: 900, letterSpacing: "-0.02em" }}>{dict.products.title}</h2>
          <button onClick={() => setMode("browse")} className="sbtn" style={{ marginLeft: "auto", fontSize: 13, padding: "9px 18px" }}>{t.browse} →</button>
        </div>

        <section className="zcards animate-fade-up pb-14" style={{ animationDelay: "60ms" }}>
          {items.map((item) => <ProjectCard key={item.slug} item={item} lang={lang} open={t.open} />)}
        </section>

        {/* about */}
        <section className="py-10" style={{ borderTop: "1.5px solid rgba(26,22,20,0.1)" }}>
          <h2 className="text-[20px] md:text-[24px] mb-4" style={{ ...display, fontWeight: 900, letterSpacing: "-0.02em" }}>{a.heading}</h2>
          <div className="max-w-[620px]" style={{ color: "var(--text-secondary)", fontFamily: sans, fontSize: 15, lineHeight: 1.7 }}>
            <p className="mb-4">{a.p1}</p>
            <p className="mb-4">{a.p2}</p>
            <p className="mb-4">{a.p3a}<a href="mailto:matej@matejmauler.com" style={{ color: "var(--text-primary)", textDecoration: "underline", textUnderlineOffset: 3, fontWeight: 600 }}>{a.writeMe}</a>{a.p3b}</p>
            <p>{a.rewardA}<Link href={lang === "cs" ? "/encyklopedie" : "/encyclopedia"} style={{ color: "var(--text-primary)", textDecoration: "underline", textUnderlineOffset: 3, fontWeight: 600 }}>{a.rewardLink}</Link></p>
          </div>
        </section>

        <footer className="py-8" style={{ borderTop: "1.5px solid rgba(26,22,20,0.1)", color: "var(--text-muted)", fontFamily: sans, fontSize: 12 }}>© {new Date().getFullYear()} Spaghetti.ltd</footer>
      </div>
    </main>
  );
}

function Chip({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button onClick={onClick} className={`schip${active ? " active" : ""}`}>{label}</button>
  );
}
