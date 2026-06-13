import { Dictionary, Lang } from "@/lib/dictionaries";
import type { PublicExperiment } from "@/lib/experimentsDb";
import { type PublicSong, songsUi } from "@/lib/songsUi";
import { CATEGORIES } from "@/lib/experiments";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { ExperimentPreview } from "./ExperimentPreview";
import { SongCard } from "./SongCard";

const display: React.CSSProperties = { fontFamily: "var(--font-display)" };

function fmtDate(iso: string, lang: Lang): string {
  const d = new Date(iso + "T00:00:00");
  return lang === "cs"
    ? d.toLocaleDateString("cs-CZ", { day: "numeric", month: "numeric", year: "numeric" })
    : d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export function HomeContent({ dict, lang, items, songs = [] }: { dict: Dictionary; lang: Lang; items: PublicExperiment[]; songs?: PublicSong[] }) {
  const su = songsUi[lang];
  return (
    <main style={{ background: "var(--bg)", minHeight: "100vh" }}>
      <LanguageSwitcher lang={lang} labels={dict.switcher} />

      <div className="max-w-[1100px] mx-auto px-5 md:px-8">

        {/* Header */}
        <header className="pt-20 pb-16 animate-fade-up">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.svg" alt="Spaghetti.ltd" width={76} height={76} style={{ display: "block", marginBottom: "16px" }} />
          <h1
            className="text-[40px] md:text-[56px] leading-none mb-4"
            style={{ ...display, fontWeight: 900, letterSpacing: "-0.03em" }}
          >
            {dict.hero.name}
          </h1>
          <p
            className="text-[18px] md:text-[22px] mb-3 max-w-[560px]"
            style={{ ...display, fontStyle: "italic", color: "var(--text-primary)", lineHeight: 1.3 }}
          >
            {dict.hero.tagline}
          </p>
          <p
            className="text-[14px] max-w-[480px]"
            style={{ color: "var(--text-muted)", fontFamily: "var(--font-sans)", lineHeight: 1.6 }}
          >
            {dict.hero.sub}
          </p>
        </header>

        {/* Products section header */}
        <div className="mb-6 animate-fade-up" style={{ animationDelay: "40ms" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: "14px", flexWrap: "wrap" }}>
            <h2
              className="text-[22px] md:text-[26px] leading-none"
              style={{ ...display, fontWeight: 900, letterSpacing: "-0.02em" }}
            >
              {dict.products.title}
            </h2>
            <span
              style={{
                fontFamily: "var(--font-sans)", fontSize: "13px",
                color: "var(--text-muted)", fontStyle: "italic",
              }}
            >
              {dict.products.subtitle}
            </span>
          </div>
        </div>

        {/* Experiments feed (pudding-style) */}
        <section className="experiments-feed animate-fade-up pb-16" style={{ animationDelay: "60ms" }}>
          {items.map((item) => (
            <a
              key={item.slug}
              href={item.href}
              {...(item.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
              className="exp-article"
            >
              <ExperimentPreview slug={item.slug} title={item.title} color={item.color} lang={lang} />
              <div className="exp-body">
                <div className="exp-meta">
                  <span>#{String(item.number).padStart(2, "0")}</span>
                  <span className="dot" />
                  <span>{fmtDate(item.date, lang)}</span>
                  {CATEGORIES[item.slug] && <span className="exp-cat">{CATEGORIES[item.slug]}</span>}
                </div>
                {/* A/B: popisky ve feedu = Space Grotesk */}
                <p className="exp-desc" style={{ fontFamily: "var(--font-grotesk)" }}>{item.description}</p>
              </div>
            </a>
          ))}
        </section>

        {/* Songs */}
        {songs.length > 0 && (
          <section className="py-10" style={{ borderTop: "1.5px solid rgba(26,22,20,0.1)" }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: "14px", flexWrap: "wrap", marginBottom: "18px" }}>
              <h2 className="text-[22px] md:text-[26px] leading-none" style={{ ...display, fontWeight: 900, letterSpacing: "-0.02em" }}>{su.title}</h2>
              <span style={{ fontFamily: "var(--font-sans)", fontSize: "13px", color: "var(--text-muted)", fontStyle: "italic" }}>{su.subtitle}</span>
            </div>
            <SongCard song={songs[0]} lang={lang} />
            <a href="/songs" style={{ display: "inline-block", marginTop: "16px", fontFamily: "var(--font-sans)", fontSize: "13px", fontWeight: 600, color: "var(--text-primary)", textDecoration: "underline", textUnderlineOffset: "3px" }}>{su.all}</a>
          </section>
        )}

        {/* O projektu */}
        <section
          className="py-10"
          style={{ borderTop: "1.5px solid rgba(26,22,20,0.1)" }}
        >
          <h2
            className="text-[20px] md:text-[24px] mb-4"
            style={{ ...display, fontWeight: 900, letterSpacing: "-0.02em" }}
          >
            {dict.about.heading}
          </h2>
          <div
            className="max-w-[620px]"
            style={{ color: "var(--text-secondary)", fontFamily: "var(--font-sans)", fontSize: "15px", lineHeight: 1.7 }}
          >
            <p className="mb-4">{dict.about.p1}</p>
            <p className="mb-4" style={{ fontWeight: 600, color: "var(--text-primary)" }}>{dict.about.p2}</p>
            <p className="mb-4">
              {dict.about.p3a}
              <a href="mailto:matej@matejmauler.com" style={{ color: "var(--text-primary)", textDecoration: "underline", textUnderlineOffset: "3px", fontWeight: 600 }}>
                {dict.about.writeMe}
              </a>
              {dict.about.p3b}
            </p>
            <p>
              {dict.about.rewardA}
              <a href="/pravdepodobnost" style={{ color: "var(--text-primary)", textDecoration: "underline", textUnderlineOffset: "3px", fontWeight: 600 }}>
                {dict.about.rewardLink}
              </a>
            </p>
          </div>
        </section>

        <footer className="py-8" style={{ borderTop: "1.5px solid rgba(26,22,20,0.1)", color: "var(--text-muted)", fontFamily: "var(--font-sans)", fontSize: "12px" }}>
          © {new Date().getFullYear()} Spaghetti.ltd
        </footer>

      </div>
    </main>
  );
}
