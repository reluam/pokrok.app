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
        <header className="pt-20 pb-16 animate-fade-up">
          <span style={{ fontSize: "48px", display: "block", marginBottom: "16px", lineHeight: 1 }}>🍝</span>
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

        {/* Experiments grid */}
        <section className="experiments-grid animate-fade-up pb-16" style={{ animationDelay: "60ms" }}>
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

        {/* Journey */}
        <footer
          className="py-8"
          style={{ borderTop: "1.5px solid rgba(26,22,20,0.1)" }}
        >
          <a
            href="https://journey-ruddy-psi.vercel.app"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "10px",
              textDecoration: "none",
              color: "var(--text-muted)",
              fontFamily: "var(--font-sans)",
              fontSize: "13px",
              transition: "color 140ms ease",
            }}
            className="journey-link"
          >
            <span style={{ fontSize: "16px" }}>🌌</span>
            <span>{dict.journeyCredit.prefix}</span>
            <span style={{ color: "var(--text-secondary)", fontWeight: 500 }}>
              {dict.journeyCredit.label}
            </span>
          </a>
        </footer>

      </div>
    </main>
  );
}
