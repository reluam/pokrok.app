import fs from "node:fs";
import path from "node:path";
import { Dictionary, Lang } from "@/lib/dictionaries";
import { getSubstackPosts, formatPostDate } from "@/lib/substack";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { CalButton } from "./CalButton";

const hasAvatar = fs.existsSync(
  path.join(process.cwd(), "public", "matej.jpg"),
);

/* ─── Icons ─── */

function Icon({ name, size = 16 }: { name: string; size?: number }) {
  const s = { width: size, height: size };
  const stroke = {
    fill: "none" as const,
    stroke: "currentColor",
    strokeWidth: 1.75,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  switch (name) {
    case "arrow":
      return (
        <svg {...s} viewBox="0 0 24 24" {...stroke}>
          <path d="M5 12h14M12 5l7 7-7 7" />
        </svg>
      );
    case "mail":
      return (
        <svg {...s} viewBox="0 0 24 24" {...stroke}>
          <rect x="2" y="4" width="20" height="16" rx="2" />
          <path d="m22 7-10 5L2 7" />
        </svg>
      );
    case "calendar":
      return (
        <svg {...s} viewBox="0 0 24 24" {...stroke}>
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      );
    case "rss":
      return (
        <svg {...s} viewBox="0 0 24 24" {...stroke}>
          <path d="M4 11a9 9 0 0 1 9 9" />
          <path d="M4 4a16 16 0 0 1 16 16" />
          <circle cx="5" cy="19" r="1" fill="currentColor" stroke="none" />
        </svg>
      );
    case "globe":
      return (
        <svg {...s} viewBox="0 0 24 24" {...stroke}>
          <circle cx="12" cy="12" r="10" />
          <line x1="2" y1="12" x2="22" y2="12" />
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
      );
    default:
      return null;
  }
}

/* ─── Helpers ─── */

const serif: React.CSSProperties = { fontFamily: "var(--font-serif)" };
const serifItalic: React.CSSProperties = { fontFamily: "var(--font-serif)", fontStyle: "italic" };

/* ─── Component ─── */

export async function HomeContent({ dict, lang }: { dict: Dictionary; lang: Lang }) {
  const posts = await getSubstackPosts(3);

  return (
    <main className="flex-1 overflow-x-hidden" style={{ background: "var(--bg-page)" }}>
      <LanguageSwitcher lang={lang} labels={dict.switcher} />

      <div className="max-w-[680px] mx-auto px-5 md:px-8">

        {/* ══════════════════════════════════════
            HERO
        ══════════════════════════════════════ */}
        <section className="pt-24 md:pt-32 pb-[72px] md:pb-[112px] animate-fade-up">

          {/* Avatar */}
          <div
            className="mb-8 w-16 h-16 md:w-16 md:h-16 rounded-full overflow-hidden flex items-center justify-center shrink-0"
            style={{ background: "var(--bg-card-elevated)", border: "1px solid var(--border-subtle)" }}
          >
            {hasAvatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src="/matej.jpg" alt="Matěj Mauler" className="w-full h-full object-cover" />
            ) : (
              <span style={{ ...serif, color: "var(--accent)", fontSize: "1rem", fontWeight: 600 }}>
                MM
              </span>
            )}
          </div>

          {/* H1 */}
          <h1
            className="text-[40px] md:text-[56px] leading-[1.2] mb-5 tracking-[-0.02em]"
            style={serif}
          >
            {dict.hero.greeting}
          </h1>

          {/* Tagline — kurzíva, větší */}
          <p
            className="text-[22px] md:text-[28px] leading-[1.3] mb-6"
            style={{ ...serifItalic, color: "var(--text-primary)" }}
          >
            {dict.hero.tagline}
          </p>

          {/* Bio */}
          <p
            className="text-[17px] md:text-[18px] leading-relaxed max-w-[540px]"
            style={{ color: "var(--text-secondary)" }}
          >
            {dict.hero.bio}
          </p>
        </section>

        {/* ══════════════════════════════════════
            ČÍM SE TEĎ ZABÝVÁM + PÍŠU (merged)
        ══════════════════════════════════════ */}
        <section
          className="pb-[72px] md:pb-[112px] animate-fade-up"
          style={{ animationDelay: "60ms" }}
        >
          <h2
            className="text-[26px] md:text-[32px] leading-[1.2] tracking-[-0.01em] mb-3"
            style={serif}
          >
            {dict.pisuSection.title}
          </h2>
          <p
            className="text-[15px] mb-8"
            style={{ fontFamily: "var(--font-sans)", fontStyle: "italic", color: "var(--text-muted)" }}
          >
            {dict.pisuSection.lead}
          </p>

          {posts.length === 0 ? (
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              {dict.pisuSection.emptyState}
            </p>
          ) : (
            <ul className="space-y-5 mb-7">
              {posts.map((post) => (
                <li
                  key={post.link}
                  className="pl-5"
                  style={{ borderLeft: "2px solid var(--accent)" }}
                >
                  <a
                    href={post.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group"
                  >
                    {post.isoDate && (
                      <span className="section-label text-[11px] block mb-1">
                        {formatPostDate(post.isoDate, lang)}
                      </span>
                    )}
                    <p
                      className="text-[17px] leading-[1.35] group-hover:opacity-70 transition-opacity"
                      style={{ ...serif, color: "var(--text-primary)" }}
                    >
                      {post.title}
                    </p>
                  </a>
                </li>
              ))}
            </ul>
          )}

          <a
            href="https://matejmauler.substack.com"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary text-[14px] px-5 py-3"
          >
            {dict.pisuSection.allPosts} →
          </a>
        </section>

        {/* ══════════════════════════════════════
            CO MĚ FORMUJE / FORMATIVE
        ══════════════════════════════════════ */}
        <section
          className="pb-[72px] md:pb-[112px] animate-fade-up"
          style={{ animationDelay: "120ms" }}
        >
          <h2
            className="text-[26px] md:text-[32px] leading-[1.2] tracking-[-0.01em] mb-2"
            style={serif}
          >
            {dict.formativeSection.title}
          </h2>
          <p
            className="text-[14px] mb-8"
            style={{ ...serifItalic, color: "var(--text-muted)" }}
          >
            {dict.formativeSection.subtitle}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {dict.formativeSection.items.map((item) => (
              <div key={item.name} className="card p-7 md:p-9">
                <p
                  className="text-[20px] leading-snug mb-3"
                  style={serif}
                >
                  {item.name}
                </p>
                <p
                  className="text-[14px] leading-relaxed"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {item.note}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ══════════════════════════════════════
            MYSLÍME SPOLU / COLLABORATION
        ══════════════════════════════════════ */}
        <section
          className="pb-[72px] md:pb-[112px] animate-fade-up"
          style={{ animationDelay: "180ms" }}
        >
          <h2
            className="text-[26px] md:text-[32px] leading-[1.2] tracking-[-0.01em] mb-8"
            style={serif}
          >
            {dict.spolupracujiSection.title}
          </h2>

          <div className="card-elevated p-7 md:p-9 mb-7">
            <p
              className="text-[17px] leading-relaxed mb-2"
              style={{ color: "var(--text-primary)" }}
            >
              {dict.spolupracujiSection.mainText}
            </p>
            <p
              className="text-[15px] font-semibold"
              style={{ color: "var(--accent)" }}
            >
              {dict.spolupracujiSection.slotsLabel}
            </p>

            <div
              className="mt-6 pt-6"
              style={{ borderTop: "1px solid var(--border-subtle)" }}
            >
              <p className="section-label mb-3">{dict.spolupracujiSection.otherLabel}</p>
              <ul className="space-y-1.5">
                {dict.spolupracujiSection.otherItems.map((item, i) => (
                  <li
                    key={i}
                    className="text-[14px] flex gap-2.5"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    <span style={{ color: "var(--text-muted)" }}>–</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* CTA trojice */}
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center flex-wrap">
            <a
              href="https://matejmauler.substack.com/subscribe"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary"
            >
              <Icon name="rss" size={14} />
              {dict.spolupracujiSection.ctaSubstackLabel}
            </a>
            <CalButton
              label={dict.spolupracujiSection.ctaCallLabel}
              icon={<Icon name="calendar" size={14} />}
            />
            <a
              href="mailto:matej@matejmauler.com"
              className="inline-flex items-center gap-2 text-[14px]"
              style={{
                color: "var(--text-secondary)",
                textDecoration: "underline",
                textUnderlineOffset: "4px",
              }}
            >
              <Icon name="mail" size={13} />
              {dict.spolupracujiSection.ctaEmailLabel}
            </a>
          </div>
        </section>

        {/* Footer */}
        <footer
          className="py-10"
          style={{ borderTop: "1px solid var(--border-subtle)" }}
        >
          <div className="flex gap-5 mb-4">
            {[
              { label: "Substack", href: "https://matejmauler.substack.com" },
              { label: "LinkedIn", href: "https://www.linkedin.com/in/matej-mauler/" },
              { label: "Žiju.life", href: "https://ziju.life" },
            ].map((l) => (
              <a
                key={l.label}
                href={l.href}
                target="_blank"
                rel="noopener noreferrer"
                className="footer-link"
              >
                {l.label}
              </a>
            ))}
          </div>
          <p className="text-[12px]" style={{ color: "var(--text-muted)", opacity: 0.6 }}>
            &copy; 2026 Matěj Mauler
          </p>
        </footer>
      </div>
    </main>
  );
}
