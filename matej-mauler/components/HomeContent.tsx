import { Dictionary, Lang } from "@/lib/dictionaries";
import { experiments } from "@/lib/experiments";
import { LanguageSwitcher } from "./LanguageSwitcher";

const display: React.CSSProperties = { fontFamily: "var(--font-display)" };

export function HomeContent({ dict, lang }: { dict: Dictionary; lang: Lang }) {
  return (
    <main style={{ background: "var(--bg)", minHeight: "100vh" }}>
      <LanguageSwitcher lang={lang} labels={dict.switcher} />

      <div className="max-w-[860px] mx-auto px-5 md:px-8">

        {/* Header */}
        <header className="pt-20 pb-12 animate-fade-up">
          <h1
            className="text-[32px] md:text-[40px] leading-none mb-3"
            style={{ ...display, fontWeight: 900, letterSpacing: "-0.02em" }}
          >
            {dict.hero.name}
          </h1>
          <p
            className="text-[16px]"
            style={{ color: "var(--text-secondary)", fontFamily: "var(--font-sans)" }}
          >
            {dict.hero.tagline}
          </p>
        </header>

        {/* Experiments grid */}
        <section className="experiments-grid animate-fade-up pb-20" style={{ animationDelay: "60ms" }}>
          {experiments.map((meta) => {
            const content = dict.experiments.find((e) => e.slug === meta.slug);
            if (!content) return null;

            const CardTag = (meta.href && !meta.wip) ? "a" : "div";
            const cardProps = (meta.href && !meta.wip)
              ? {
                  href: meta.href,
                  ...(meta.external ? { target: "_blank", rel: "noopener noreferrer" } : {}),
                }
              : {};

            return (
              <CardTag
                key={meta.slug}
                {...(cardProps as object)}
                className={`exp-card${meta.size === "wide" ? " exp-card--wide" : ""}${meta.wip ? " exp-card--wip" : ""}`}
                style={{ "--card-color": meta.color } as React.CSSProperties}
              >
                {meta.wip && (
                  <span className="wip-badge">{dict.wipLabel}</span>
                )}

                {/* Emoji */}
                <span
                  style={{ fontSize: "44px", lineHeight: 1, display: "block" }}
                  aria-hidden="true"
                >
                  {meta.emoji}
                </span>

                {/* Text */}
                <div>
                  <h2
                    className="text-[22px] leading-tight mb-1.5"
                    style={{ ...display, fontWeight: 800 }}
                  >
                    {content.title}
                  </h2>
                  <p
                    className="text-[14px] leading-snug"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {content.description}
                  </p>
                </div>
              </CardTag>
            );
          })}
        </section>

        {/* Journey credit */}
        <div className="pb-8">
          <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>
            {lang === "cs" ? "Tvůrce projektu" : "Creator of"}{" "}
            <a
              href="https://ziju.life/cesta"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "var(--text-secondary)", textDecoration: "underline", textUnderlineOffset: "3px" }}
            >
              {lang === "cs" ? "Cesta" : "Journey"}
            </a>
          </p>
        </div>

        {/* Footer */}
        <footer
          className="py-8"
          style={{ borderTop: "1.5px solid rgba(26,22,20,0.1)" }}
        >
          <div className="flex gap-5">
            {[
              { label: "Substack", href: "https://matejmauler.substack.com" },
              { label: "LinkedIn", href: "https://www.linkedin.com/in/matej-mauler/" },
              { label: "matej@matejmauler.com", href: "mailto:matej@matejmauler.com" },
            ].map((l) => (
              <a
                key={l.label}
                href={l.href}
                target={l.href.startsWith("mailto") ? undefined : "_blank"}
                rel="noopener noreferrer"
                className="footer-link"
              >
                {l.label}
              </a>
            ))}
          </div>
        </footer>

      </div>
    </main>
  );
}
