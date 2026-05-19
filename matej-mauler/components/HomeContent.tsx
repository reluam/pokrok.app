import fs from "node:fs";
import path from "node:path";
import { Dictionary, Lang } from "@/lib/dictionaries";
import { getSubstackPosts, formatPostDate } from "@/lib/substack";
import { LanguageSwitcher } from "./LanguageSwitcher";

const hasAvatar = fs.existsSync(
  path.join(process.cwd(), "public", "matej.jpg"),
);

/* ─── Icons ─── */

function Icon({
  name,
  size = 20,
  className = "",
}: {
  name: string;
  size?: number;
  className?: string;
}) {
  const s = { width: size, height: size };
  const stroke = {
    fill: "none" as const,
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  switch (name) {
    case "arrow_right":
      return (
        <svg {...s} viewBox="0 0 24 24" {...stroke} className={className}>
          <path d="M5 12h14M12 5l7 7-7 7" />
        </svg>
      );
    case "linkedin":
      return (
        <svg {...s} viewBox="0 0 24 24" {...stroke} className={className}>
          <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
          <rect x="2" y="9" width="4" height="12" />
          <circle cx="4" cy="4" r="2" />
        </svg>
      );
    case "mail":
      return (
        <svg {...s} viewBox="0 0 24 24" {...stroke} className={className}>
          <rect x="2" y="4" width="20" height="16" rx="2" />
          <path d="m22 7-10 5L2 7" />
        </svg>
      );
    case "globe":
      return (
        <svg {...s} viewBox="0 0 24 24" {...stroke} className={className}>
          <circle cx="12" cy="12" r="10" />
          <line x1="2" y1="12" x2="22" y2="12" />
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
      );
    case "sparkles":
      return (
        <svg {...s} viewBox="0 0 24 24" {...stroke} className={className}>
          <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1" />
        </svg>
      );
    default:
      return null;
  }
}

/* ─── Component ─── */

export async function HomeContent({
  dict,
  lang,
}: {
  dict: Dictionary;
  lang: Lang;
}) {
  const posts = await getSubstackPosts(4);

  return (
    <main className="flex-1 bg-background overflow-x-hidden">
      <LanguageSwitcher lang={lang} labels={dict.switcher} />

      <div className="max-w-3xl mx-auto px-5 md:px-8">

        {/* ══════════════════════════════════════
            HERO
        ══════════════════════════════════════ */}
        <section className="pt-20 md:pt-28 pb-20 md:pb-24 animate-fade-up">
          <div className="flex flex-col md:flex-row gap-10 items-center md:items-start">

            {/* Avatar */}
            <div className="paper-card overflow-hidden shrink-0 w-36 h-36 md:w-44 md:h-44">
              {hasAvatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src="/matej.jpg"
                  alt="Matěj Mauler"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-[#ffe4cc] to-[#c6f1ec] flex items-center justify-center">
                  <span className="font-display text-3xl font-extrabold text-[#ff6b1a]">
                    MM
                  </span>
                </div>
              )}
            </div>

            {/* Text */}
            <div className="text-center md:text-left">
              <h1 className="font-display text-5xl md:text-6xl font-extrabold leading-tight tracking-tight mb-4">
                <span className="underline-playful">{dict.hero.greeting.replace(".", "")}</span>
                <span className="text-primary">.</span>
              </h1>
              <p className="text-lg md:text-xl text-foreground/80 leading-relaxed mb-2">
                {dict.hero.tagline}
              </p>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════
            PÍŠU / WRITING
        ══════════════════════════════════════ */}
        <section
          id="pisu"
          className="pb-20 md:pb-24 animate-fade-up"
          style={{ animationDelay: "80ms" }}
        >
          <div className="mb-8">
            <h2 className="font-display text-3xl md:text-4xl font-extrabold">
              <span className="underline-teal">{dict.pisuSection.title}</span>
            </h2>
          </div>

          {/* Substack posts */}
          {posts.length === 0 ? (
            <p className="text-muted text-sm">{dict.pisuSection.emptyState}</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              {posts.map((post) => (
                <a
                  key={post.link}
                  href={post.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="paper-card flex flex-col group overflow-hidden"
                >
                  {/* Thumbnail */}
                  <div className="w-full aspect-[16/9] bg-[#f5f1e4] shrink-0">
                    {post.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={post.image}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-3xl">
                        ✍️
                      </div>
                    )}
                  </div>

                  {/* Text */}
                  <div className="flex flex-col flex-1 p-4 gap-2">
                    {post.isoDate && (
                      <p className="text-[0.68rem] font-display font-bold text-muted uppercase tracking-wide">
                        {formatPostDate(post.isoDate, lang)}
                      </p>
                    )}
                    <h3 className="font-display font-extrabold text-[0.97rem] leading-snug group-hover:text-primary transition-colors flex-1">
                      {post.title}
                    </h3>
                    <span className="inline-flex items-center gap-1 text-[#2ba89e] font-display font-bold text-xs mt-1">
                      {dict.pisuSection.readMore}
                      <Icon name="arrow_right" size={13} />
                    </span>
                  </div>
                </a>
              ))}
            </div>
          )}

          <a
            href="https://reluam.substack.com"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-outline text-sm"
          >
            {dict.pisuSection.allPosts}
          </a>
        </section>

        {/* ══════════════════════════════════════
            SPOLUPRACUJI / COLLABORATION
        ══════════════════════════════════════ */}
        <section
          id="spolupracuji"
          className="pb-20 md:pb-24 animate-fade-up"
          style={{ animationDelay: "160ms" }}
        >
          <div className="mb-8">
            <h2 className="font-display text-3xl md:text-4xl font-extrabold">
              <span className="underline-playful">{dict.spolupracujiSection.title}</span>
            </h2>
          </div>

          <div className="paper-card p-7 md:p-9">
            <div className="text-foreground/80 leading-relaxed text-[1.02rem] mb-7 space-y-3">
              {dict.spolupracujiSection.text.split("\n").map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
              <a
                href="mailto:matej@ziju.life"
                className="btn-playful"
              >
                <Icon name="mail" size={17} />
                {dict.spolupracujiSection.ctaLabel}
              </a>

              <div className="flex items-center gap-2 text-sm text-muted">
                <span>{dict.spolupracujiSection.zijuText}</span>
                <a
                  href="https://ziju.life"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-display font-bold text-primary hover:text-primary-dark transition-colors flex items-center gap-1"
                >
                  <Icon name="globe" size={14} />
                  {dict.spolupracujiSection.zijuLabel}
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-8 text-center">
          <div className="flex justify-center gap-4 mb-3">
            <a
              href="https://reluam.substack.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-muted/60 hover:text-foreground transition-colors font-display"
            >
              Substack
            </a>
            <a
              href="https://www.linkedin.com/in/matej-mauler/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-muted/60 hover:text-foreground transition-colors font-display"
            >
              LinkedIn
            </a>
            <a
              href="https://ziju.life"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-muted/60 hover:text-foreground transition-colors font-display"
            >
              Žiju.life
            </a>
          </div>
          <p className="text-xs text-muted/40 font-display">
            &copy; 2026 Matěj Mauler
          </p>
        </footer>
      </div>
    </main>
  );
}
