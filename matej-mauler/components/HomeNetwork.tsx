import { LanguageSwitcher } from "./LanguageSwitcher";
import { ExperimentPreview } from "./ExperimentPreview";
import { SPAGHETTI_BLURB } from "@/lib/about";
import { CATEGORIES } from "@/lib/experiments";
import type { Dictionary, Lang } from "@/lib/dictionaries";
import type { PublicExperiment } from "@/lib/experimentsDb";

const display: React.CSSProperties = { fontFamily: "var(--font-display)" };
const sans = "var(--font-sans)";
const para: React.CSSProperties = { fontFamily: sans, fontSize: 14, lineHeight: 1.7, color: "var(--text-secondary)" };

function fmtDate(iso: string, lang: Lang): string {
  const d = new Date(iso + "T00:00:00");
  return lang === "cs"
    ? d.toLocaleDateString("cs-CZ", { day: "numeric", month: "numeric", year: "numeric" })
    : d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

/** Homepage: vlevo fixní oddělený sloupec o Spaghetti, vpravo experimenty,
    které vyplní celý zbytek (roztáhnou se do min. velikosti, pak scroll).
    Na mobilu: logo + úvod → experimenty → „Ahoj, já jsem Matěj…". Nejnovější první. */
export function HomeNetwork({ dict, lang, items }: { dict: Dictionary; lang: Lang; items: PublicExperiment[] }) {
  const a = dict.about;

  return (
    <main style={{ background: "var(--bg)", minHeight: "100dvh" }}>
      <LanguageSwitcher lang={lang} labels={dict.switcher} />

      <div className="home-grid">
        {/* intro — logo + název + popisek */}
        <div className="home-intro animate-fade-up">
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.svg" alt="Spaghetti.ltd" width={46} height={46} style={{ display: "block", flexShrink: 0 }} />
            <span style={{ ...display, fontSize: 25, fontWeight: 900, letterSpacing: "-0.03em", lineHeight: 1 }}>
              Spaghetti<span style={{ color: "var(--text-muted)" }}>.ltd</span>
            </span>
          </div>
          <p style={{ ...display, fontStyle: "italic", fontSize: 16, lineHeight: 1.5, color: "var(--text-primary)", margin: 0 }}>{SPAGHETTI_BLURB[lang]}</p>
        </div>

        {/* o Matějovi — na mobilu až pod experimenty */}
        <div className="home-matej animate-fade-up">
          <p style={{ ...para, margin: "0 0 12px" }}>{a.p1}</p>
          <p style={{ ...para, margin: "0 0 12px" }}>{a.p2}</p>
          <p style={{ ...para, margin: 0 }}>
            {a.p3a}<a href="mailto:matej@matejmauler.com" style={{ color: "var(--text-primary)", fontWeight: 600, textDecoration: "underline", textUnderlineOffset: 3 }}>{a.writeMe}</a>{a.p3b}
          </p>
        </div>

        {/* experimenty — vyplní zbytek, nejnovější první */}
        <section className="home-main">
          <div className="feed-fill animate-fade-up" style={{ animationDelay: "60ms" }}>
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
                  <p className="exp-desc" style={{ fontFamily: "var(--font-grotesk)" }}>{item.description}</p>
                </div>
              </a>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
