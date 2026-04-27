import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { listCuratedPosts } from "@/lib/curated-posts-db";
import HandDrawnCard from "@/components/HandDrawnCard";

export const dynamic = "force-static";
export const revalidate = 3600;

const SUBSTACK_URL =
  "https://zijulife.substack.com/?r=86mho4&utm_campaign=pub-share-checklist";

export const metadata: Metadata = {
  title: "Vnitřní klid v hlučném světě | Žiju life — Matěj Mauler",
  description:
    "Učím lidi zpomalit a žít vědomě — i uprostřed chaosu.",
};

interface LatestPost {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  body_markdown: string;
  cover_image_url: string | null;
}

async function getLatestPost(): Promise<LatestPost | null> {
  try {
    const { posts } = await listCuratedPosts({ status: "published", page: 1, limit: 1 });
    return (posts[0] as LatestPost) || null;
  } catch {
    return null;
  }
}

function makeExcerpt(post: LatestPost, max = 220): string {
  if (post.subtitle && post.subtitle.trim()) return post.subtitle.trim();
  const cleaned = post.body_markdown
    .split("\n")
    .filter(
      (l) =>
        l.trim() &&
        !l.startsWith("**Autor") &&
        !l.startsWith("**Zdroj") &&
        !l.match(/^\[.*\]\(http/),
    )
    .join(" ")
    .replace(/[#*[\]()]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (cleaned.length <= max) return cleaned;
  return cleaned.slice(0, max).replace(/\s+\S*$/, "") + "…";
}

const offerings = [
  {
    emoji: "🤝",
    title: "Koučink",
    tagline: "Pro toho, kdo chce vedení.",
    text:
      "Společně přijdeme na to, jak žít klidněji a vědoměji ve tvé konkrétní situaci.",
    cta: "Více",
    href: "/koucing",
    external: false,
    badge: null as string | null,
    rotate: "rotate-[-0.8deg]",
    shape: "1",
    disabled: false,
  },
  {
    emoji: "📚",
    title: "Knihovna",
    tagline: "Pro toho, kdo chce zjišťovat.",
    text:
      "Inspirace pro tvou vlastní cestu. Najdeš zde výběr knih, které mě formovaly a články, ve kterých sdílím mé pohledy na klid, život i svět.",
    cta: "Procházet",
    href: "/knihovna",
    external: false,
    badge: null,
    rotate: "rotate-[0.6deg]",
    shape: "3",
    disabled: false,
  },
  {
    emoji: "🎓",
    title: "Kurzy",
    tagline: "Pro toho, kdo chce aplikovat.",
    text:
      "Krátké programy s konkrétní praxí — meditace, journaling, stoická cvičení. Vnitřní klid jako každodenní návyk.",
    cta: "Připravuji",
    href: "/kontakt",
    external: false,
    badge: "Brzy",
    rotate: "rotate-[-0.4deg]",
    shape: "5",
    disabled: true,
  },
];

export default async function Home() {
  const latest = await getLatestPost();

  return (
    <main className="flex-1 bg-background overflow-x-hidden relative min-h-screen">
      {/* SVG filter defs for hand-drawn pencil look */}
      <svg
        aria-hidden="true"
        className="absolute w-0 h-0 overflow-hidden"
        style={{ position: "absolute" }}
      >
        <defs>
          <filter id="pencil" x="-10%" y="-10%" width="120%" height="120%">
            <feTurbulence type="fractalNoise" baseFrequency="0.012" numOctaves="2" seed="4" />
            <feDisplacementMap in="SourceGraphic" scale="7" />
          </filter>
        </defs>
      </svg>

      {/* ─── 1. HERO ─── */}
      <section className="relative bg-[#F8EEDB] pt-28 md:pt-32 pb-20 md:pb-24 animate-fade-up">
        <div className="max-w-5xl mx-auto px-6 relative">
          <div className="grid grid-cols-1 md:grid-cols-[1.1fr_1fr] gap-6 md:gap-10 items-center">
            <div className="text-center md:text-left order-2 md:order-1 relative z-10">
              <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-extrabold leading-[1.05] mb-6 tracking-tight">
                <span className="block">
                  Vnitřní <span className="underline-teal">klid</span>
                </span>
                <span className="block">v hlučném světě.</span>
              </h1>

              <p className="text-lg md:text-xl text-foreground/80 leading-relaxed mb-7">
                Učím lidi zpomalit a žít vědomě &mdash; i uprostřed chaosu.
              </p>

              <div className="flex justify-center md:justify-start">
                <Link href="/koucing#rezervace" className="btn-playful" data-shape="1">
                  Konzultace zdarma &rarr;
                </Link>
              </div>
            </div>

            <div className="relative order-1 md:order-2 flex justify-center md:justify-end min-h-[480px] md:min-h-[520px]">
              {/* Egg/pebble shape behind silhouette */}
              <svg
                aria-hidden="true"
                className="absolute top-0 right-2 md:-top-4 md:right-0 w-[20rem] h-[28rem] md:w-[460px] md:h-[620px] pointer-events-none z-20"
                viewBox="0 0 200 240"
                style={{ transform: "rotate(-8deg)" }}
              >
                <path
                  fill="#EDD3B0"
                  d="M94,4 C142,-2 180,18 194,62 C206,100 198,138 186,172 C172,206 148,232 116,238 C88,244 58,232 34,212 C12,192 -2,160 4,120 C8,82 16,44 42,20 C58,8 74,4 94,4 Z"
                />
              </svg>

              <div className="relative w-72 h-80 md:w-[420px] md:h-[520px] z-30">
                <Image
                  src="/matej-silueta.png"
                  alt="Matěj Mauler"
                  fill
                  sizes="(max-width: 768px) 288px, 420px"
                  className="object-contain object-bottom"
                  priority
                />
              </div>
            </div>
          </div>
        </div>

        {/* Bottom wave */}
        <svg
          aria-hidden="true"
          className="absolute bottom-0 left-0 w-full h-16 md:h-20"
          viewBox="0 0 1440 180"
          preserveAspectRatio="none"
        >
          <path
            d="M0,20 C120,20 200,120 360,140 C460,152 520,80 640,40 C700,15 760,10 820,25 C900,48 940,90 1020,85 C1100,80 1180,40 1280,20 C1360,6 1420,10 1440,15 L1440,180 L0,180 Z"
            fill="#FBF8F0"
          />
        </svg>
      </section>

      {/* ─── 2. PRO KOHO ─── */}
      <section
        className="relative pt-16 md:pt-24 pb-16 md:pb-24 animate-fade-up"
        style={{ animationDelay: "100ms" }}
      >
        <div className="max-w-3xl mx-auto px-6 text-center">
          <p className="font-display text-xs uppercase tracking-[0.18em] text-primary font-bold mb-4">
            Pro koho
          </p>
          <h2 className="font-display text-3xl md:text-5xl font-extrabold tracking-tight leading-tight mb-8">
            Když máš všechno,{" "}
            <span className="underline-teal">kromě klidu</span>.
          </h2>
          <div className="space-y-5 text-lg md:text-xl text-foreground/80 leading-relaxed">
            <p>
              Na papíře vše zvládáš, uvnitř ale cítíš neklid, úzkost a stres. A ptáš se,
              jestli je tohle opravdu to, jak má život vypadat.
            </p>
            <p>
              Pokud ti tohle zní povědomě,{" "}
              <span className="underline-playful font-semibold">jsi tady správně</span>.
            </p>
          </div>
        </div>
      </section>

      {/* ─── 3. CO NABÍZÍM ─── */}
      <section
        className="relative pt-16 md:pt-20 pb-20 md:pb-28 animate-fade-up"
        style={{ animationDelay: "150ms" }}
      >
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-12 md:mb-14">
            <p className="font-display text-xs uppercase tracking-[0.18em] text-primary font-bold mb-3">
              Co nabízím
            </p>
            <h2 className="font-display text-3xl md:text-5xl font-extrabold tracking-tight">
              Tři způsoby, jak <span className="underline-teal">začít</span>.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-7">
            {offerings.map((o, i) => {
              const cardInner = (
                <HandDrawnCard
                  variant={i}
                  shadow={!o.disabled}
                  shadowOffset={5}
                  fill="#FDFBF7"
                  stroke={o.disabled ? "#9a948b" : "#171717"}
                  innerClassName="p-7 md:p-8 flex flex-col h-full min-h-[320px]"
                >
                  {o.badge && (
                    <span className="absolute -top-3 -right-2 z-10 bg-[#FFD66E] border-2 border-foreground rounded-full px-3 py-1 text-xs font-display font-extrabold tracking-wide rotate-[6deg] shadow-sm">
                      {o.badge}
                    </span>
                  )}
                  <span className={`text-4xl mb-4 leading-none ${o.disabled ? "grayscale opacity-80" : ""}`}>{o.emoji}</span>
                  <h3 className={`font-display text-2xl font-extrabold mb-1 tracking-tight transition-colors ${
                    o.disabled ? "text-foreground/55" : "group-hover/card:text-primary"
                  }`}>
                    {o.title}
                  </h3>
                  <p className={`text-sm font-semibold mb-3 ${o.disabled ? "text-foreground/45" : "text-primary"}`}>
                    {o.tagline}
                  </p>
                  <p className={`text-base leading-relaxed flex-1 mb-5 ${o.disabled ? "text-foreground/50" : "text-foreground/75"}`}>
                    {o.text}
                  </p>
                  <div className="mt-auto">
                    <span
                      className={`inline-flex items-center gap-2 font-display font-bold ${
                        o.disabled
                          ? "text-foreground/45"
                          : "text-foreground/80 group-hover/card:text-foreground transition-colors"
                      }`}
                    >
                      {o.cta}
                      {o.disabled ? (
                        " …"
                      ) : (
                        <span className="transition-transform group-hover/card:translate-x-0.5">
                          &rarr;
                        </span>
                      )}
                    </span>
                  </div>
                </HandDrawnCard>
              );

              if (o.disabled) {
                return (
                  <div
                    key={o.title}
                    className={`relative ${o.rotate} cursor-not-allowed`}
                    aria-disabled="true"
                  >
                    {cardInner}
                  </div>
                );
              }

              const linkClass = `group/card relative block ${o.rotate} hover:rotate-0 hover:-translate-y-1 transition-all duration-200`;

              return o.external ? (
                <a
                  key={o.title}
                  href={o.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={linkClass}
                >
                  {cardInner}
                </a>
              ) : (
                <Link key={o.title} href={o.href} className={linkClass}>
                  {cardInner}
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── 4. Z BLOGU ─── */}
      {latest && (
        <section
          className="relative pt-16 md:pt-20 pb-16 md:pb-20 animate-fade-up"
          style={{ animationDelay: "200ms" }}
        >
          <div className="max-w-5xl mx-auto px-6">
            <div className="text-center mb-10 md:mb-12">
              <p className="font-display text-xs uppercase tracking-[0.18em] text-[#7766d8] font-bold mb-3">
                Z blogu
              </p>
              <h2 className="font-display text-3xl md:text-5xl font-extrabold tracking-tight">
                O čem teď <span className="underline-playful">přemýšlím</span>.
              </h2>
            </div>

            <Link
              href={`/knihovna/${latest.slug}`}
              className="block group rotate-[-0.5deg] hover:rotate-0 hover:-translate-y-1 transition-all duration-200"
            >
              <article className="relative bg-[#FDFBF7] rounded-3xl border-2 border-foreground overflow-hidden shadow-[6px_6px_0_0_rgba(23,23,23,0.9)] group-hover:shadow-[10px_10px_0_0_rgba(23,23,23,0.9)] transition-shadow">
                <div className="grid grid-cols-1 md:grid-cols-[1.1fr_1fr]">
                  <div className="relative aspect-[16/10] md:aspect-auto md:min-h-[340px] bg-gradient-to-br from-[#EDD3B0] to-[#F8EEDB] overflow-hidden">
                    {latest.cover_image_url ? (
                      <img
                        src={latest.cover_image_url}
                        alt={latest.title}
                        className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-7xl opacity-40">📓</span>
                      </div>
                    )}
                  </div>
                  <div className="p-7 md:p-10 flex flex-col">
                    <h3 className="font-display text-2xl md:text-3xl font-extrabold leading-tight tracking-tight mb-4 group-hover:text-primary transition-colors">
                      {latest.title}
                    </h3>
                    <p className="text-base md:text-lg text-foreground/70 leading-relaxed flex-1 mb-6">
                      {makeExcerpt(latest)}
                    </p>
                    <span className="inline-flex items-center gap-2 font-display font-bold text-foreground/80 group-hover:text-foreground transition-colors">
                      Číst dál{" "}
                      <span className="w-9 h-9 rounded-full bg-primary text-white border-2 border-foreground flex items-center justify-center text-sm shrink-0 group-hover:bg-primary-dark group-hover:translate-x-0.5 transition-all">
                        &rarr;
                      </span>
                    </span>
                  </div>
                </div>
              </article>
            </Link>

            <div className="text-center mt-8">
              <a
                href={SUBSTACK_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 font-display font-bold text-foreground/70 hover:text-foreground transition-colors"
              >
                Všechny články &rarr;
              </a>
            </div>
          </div>
        </section>
      )}

      {/* ─── 5. CITÁT ─── */}
      <section
        className="relative pt-20 md:pt-28 pb-20 md:pb-28 animate-fade-up"
        style={{ animationDelay: "250ms" }}
      >
        <div className="max-w-3xl mx-auto px-6 text-center">
          <p className="font-display italic text-3xl md:text-5xl font-extrabold tracking-tight leading-snug text-foreground/85">
            Jak chceš <span className="underline-teal">žít</span>?
          </p>
        </div>
      </section>

    </main>
  );
}
