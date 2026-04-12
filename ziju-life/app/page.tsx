import Image from "next/image";
import Link from "next/link";
import Parser from "rss-parser";

export const dynamic = "force-static";
export const revalidate = 3600; // revalidate every hour

/* ─── Color helpers (from matej-mauler) ─── */

const colorMap = {
  primary: {
    bg: "bg-[#fff4eb]",
    text: "text-[#ff8c42]",
    border: "border-[#ffb380]",
    iconBg: "bg-[#ffe4cc]",
  },
  teal: {
    bg: "bg-[#e8faf8]",
    text: "text-[#2ba89e]",
    border: "border-[#8be0d8]",
    iconBg: "bg-[#c6f1ec]",
  },
  lavender: {
    bg: "bg-[#f1eefc]",
    text: "text-[#7766d8]",
    border: "border-[#cdc4f5]",
    iconBg: "bg-[#dfd8fa]",
  },
};

/* ─── RSS fetch ─── */

interface SubstackArticle {
  title: string;
  link: string;
  pubDate: string;
}

async function getSubstackArticles(): Promise<SubstackArticle[]> {
  try {
    const parser = new Parser();
    const feed = await parser.parseURL("https://reluam.substack.com/feed");
    return (feed.items || []).slice(0, 5).map((item) => ({
      title: item.title || "",
      link: item.link || "",
      pubDate: item.pubDate || "",
    }));
  } catch {
    return [];
  }
}

/* ─── Page ─── */

export default async function Home() {
  const articles = await getSubstackArticles();

  return (
    <main className="flex-1 bg-background overflow-x-hidden relative min-h-screen">
      <div className="max-w-5xl mx-auto px-6 py-16 md:py-20 pt-28 md:pt-32">

        {/* ─── Hero ─── */}
        <section
          className="mb-20 md:mb-24 animate-fade-up relative"
          style={{ animationDelay: "0ms" }}
        >
          {/* Floating decorative emoji */}
          <div className="absolute -top-4 -left-2 text-3xl animate-float opacity-60 hidden md:block">
            ✨
          </div>
          <div
            className="absolute top-10 -right-4 text-2xl animate-float opacity-50 hidden md:block"
            style={{ animationDelay: "1.5s" }}
          >
            🌿
          </div>

          <div className="grid grid-cols-1 md:grid-cols-[auto_1fr] gap-8 md:gap-10 items-start">
            {/* Avatar */}
            <div className="paper-card overflow-hidden w-56 h-56 md:w-64 md:h-64 shrink-0 mx-auto md:mx-0">
              <Image
                src="/matej-photo.jpg"
                alt="Matěj Mauler"
                width={256}
                height={256}
                className="w-full h-full object-cover"
                priority
              />
            </div>

            {/* Text */}
            <div className="text-center md:text-left">
              <h1 className="font-display text-5xl md:text-6xl font-extrabold leading-[1] mb-5 tracking-tight">
                Ahoj, jsem{" "}
                <span className="underline-playful">Matěj</span>
                <span className="text-primary">.</span>
              </h1>

              <p className="text-lg md:text-xl text-foreground/80 leading-relaxed mb-3">
                Snažím se přijít na to, jak se vlastně žije. Čtu, experimentuju,
                bastlím appky — a co z toho vypadne, sdílím dál a pomáhám
                s tím ostatním.
              </p>

              <p className="text-base text-muted">
                Tady dole je{" "}
                <span className="underline-teal font-semibold">rozcestník</span>{" "}
                toho, na čem zrovna dělám.
              </p>
            </div>
          </div>
        </section>

        {/* ─── Projekty (3 karty) ─── */}
        <section
          className="mb-20 md:mb-24 animate-fade-up"
          style={{ animationDelay: "100ms" }}
        >
          <div className="text-center mb-10">
            <p className="font-display text-xs uppercase tracking-[0.18em] text-primary font-bold mb-2">
              Na čem dělám
            </p>
            <h2 className="font-display text-3xl md:text-4xl font-extrabold">
              Moje{" "}
              <span className="underline-playful">projekty</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">

            {/* ─── Calibrate ─── */}
            <div id="calibrate" className="paper-card p-6 h-full flex flex-col relative">
              <span className="badge-soon absolute -top-2 -right-2">
                <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1" />
                </svg>
                Právě tvořím
              </span>

              <div className={`w-12 h-12 rounded-2xl ${colorMap.primary.iconBg} flex items-center justify-center mb-4 text-2xl`}>
                ⚙️
              </div>

              <p className={`font-display text-[0.7rem] uppercase tracking-[0.15em] font-bold mb-1 ${colorMap.primary.text}`}>
                Právě tvořím
              </p>
              <h3 className="font-display text-2xl font-extrabold mb-3">
                Calibrate
              </h3>
              <p className="text-foreground/70 leading-relaxed text-[0.95rem] mb-5 flex-1">
                Appka, na které právě pracuju. Duolingo pro mentální modely — každý den 5 minut, abys lépe myslel a rozhodoval se. Víc brzy.
              </p>

              <p className="text-muted text-sm italic">Brzy k vyzkoušení...</p>
            </div>

            {/* ─── Koučing & workshopy ─── */}
            <div className="paper-card p-6 h-full flex flex-col relative">
              <div className={`w-12 h-12 rounded-2xl ${colorMap.teal.iconBg} flex items-center justify-center mb-4 text-2xl`}>
                🧭
              </div>

              <p className={`font-display text-[0.7rem] uppercase tracking-[0.15em] font-bold mb-1 ${colorMap.teal.text}`}>
                Pro lidi
              </p>
              <h3 className="font-display text-2xl font-extrabold mb-3">
                Koučing &amp; workshopy
              </h3>
              <p className="text-foreground/70 leading-relaxed text-[0.95rem] mb-5 flex-1">
                Pomáhám lidem, co jsou ztraceni, najít svůj směr. Jeden na jednoho, bez bullshitu.
              </p>

              <div className="flex flex-col gap-2">
                <Link
                  href="/koucing"
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl ${colorMap.teal.bg} hover:scale-[1.02] transition-transform`}
                >
                  <span className={colorMap.teal.text}>
                    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </span>
                  <p className={`font-display font-bold text-sm leading-tight ${colorMap.teal.text}`}>
                    Zjistit víc &rarr;
                  </p>
                </Link>
              </div>
            </div>

            {/* ─── Knihovna ─── */}
            <div className="paper-card p-6 h-full flex flex-col relative sm:col-span-2 lg:col-span-1">
              <div className={`w-12 h-12 rounded-2xl ${colorMap.lavender.iconBg} flex items-center justify-center mb-4 text-2xl`}>
                📚
              </div>

              <p className={`font-display text-[0.7rem] uppercase tracking-[0.15em] font-bold mb-1 ${colorMap.lavender.text}`}>
                Články &amp; myšlenky
              </p>
              <h3 className="font-display text-2xl font-extrabold mb-3">
                Knihovna
              </h3>
              <p className="text-foreground/70 leading-relaxed text-[0.95rem] mb-4 flex-1">
                Píšu o tom, co čtu, zjišťuju a zažívám. Mentální modely, knížky, frameworky.
              </p>

              {/* Substack articles */}
              {articles.length > 0 && (
                <div className="flex flex-col gap-2 mb-4">
                  {articles.map((article) => (
                    <a
                      key={article.link}
                      href={article.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`flex items-center justify-between gap-2 px-3 py-2 rounded-xl ${colorMap.lavender.bg} hover:scale-[1.02] transition-transform`}
                    >
                      <p className="font-display font-bold text-xs leading-tight text-foreground/80 truncate">
                        {article.title}
                      </p>
                      <span className="text-[0.65rem] text-muted whitespace-nowrap">
                        {new Date(article.pubDate).toLocaleDateString("cs-CZ", {
                          day: "numeric",
                          month: "short",
                        })}
                      </span>
                    </a>
                  ))}
                </div>
              )}

              <div className="flex flex-col gap-2">
                <Link
                  href="/knihovna"
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl ${colorMap.lavender.bg} hover:scale-[1.02] transition-transform`}
                >
                  <span className={colorMap.lavender.text}>
                    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </span>
                  <p className={`font-display font-bold text-sm leading-tight ${colorMap.lavender.text}`}>
                    Celá knihovna &rarr;
                  </p>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ─── Kontakt ─── */}
        <section
          className="text-center mb-12 animate-fade-up"
          style={{ animationDelay: "300ms" }}
        >
          <div className="paper-card p-8">
            <p className="text-2xl mb-3">👋</p>
            <h3 className="font-display text-xl font-extrabold mb-2">
              Chceš se ozvat?
            </h3>
            <p className="text-muted text-sm mb-5">
              Napiš mi cokoliv — otázku, nápad, nebo jen ahoj.
            </p>
            <a href="mailto:matej@matejmauler.com" className="btn-playful">
              <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <path d="m22 7-10 5L2 7" />
              </svg>
              matej@matejmauler.com
            </a>
          </div>
        </section>
      </div>
    </main>
  );
}
