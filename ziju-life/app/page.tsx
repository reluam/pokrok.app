import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { listCuratedPosts } from "@/lib/curated-posts-db";
import HandDrawnCard from "@/components/HandDrawnCard";
import HandDrawnIcon from "@/components/HandDrawnIcon";
import HandDrawnFrame from "@/components/HandDrawnFrame";

export const dynamic = "force-static";
export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Koučink pro lidi, co moc přemýšlí | Žiju life — Matěj Mauler",
  description:
    "Víš, jak chceš žít, ale nedokážeš začít? Pomůžu ti přestat se točit v kruzích a začít konat. Konzultace zdarma.",
};

interface LatestPost {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
}

async function getLatestPosts(): Promise<LatestPost[]> {
  try {
    const { posts } = await listCuratedPosts({ status: "published", page: 1, limit: 3 });
    return posts as LatestPost[];
  } catch {
    return [];
  }
}

const painPoints = [
  {
    emoji: "🌀",
    text: "Víš, kam chceš — ale nedokážeš se hnout.",
    bg: "#dfd8fa",
  },
  {
    emoji: "💭",
    text: "Máš tisíc plánů, ráno nevíš, kde začít.",
    bg: "#c6f1ec",
  },
  {
    emoji: "⏳",
    text: "Žiješ v budoucnu. Ta mezera tě paralyzuje.",
    bg: "#fff0c2",
  },
  {
    emoji: "📚",
    text: "Další knížka, další app. A pak zas nic.",
    bg: "#ffe4cc",
  },
];

export default async function Home() {
  const posts = await getLatestPosts();

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


      {/* ─── Hero — full bleed, same bg as nav area ─── */}
      <section className="relative bg-[#F8EEDB] pt-28 md:pt-32 pb-20 md:pb-24 animate-fade-up">
        <div className="max-w-5xl mx-auto px-6 relative">
          <div className="grid grid-cols-1 md:grid-cols-[1.1fr_1fr] gap-6 md:gap-10 items-center">
            <div className="text-center md:text-left order-2 md:order-1 relative z-10">
              <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-extrabold leading-[1.05] mb-6 tracking-tight">
                <span className="block">Hodně přemýšlíš,</span>
                <span className="underline-sketch inline-block pb-3">málo děláš.</span>
              </h1>

              <p className="text-lg md:text-xl text-foreground/80 leading-relaxed mb-7">
                Taky jsem to tak měl. Teď pomáhám lidem, co se zasekli v hlavě, začít reálně žít.
              </p>

              <div className="flex justify-center md:justify-start">
                <Link href="/koucing#rezervace" className="btn-playful" data-shape="1">
                  Konzultace zdarma &rarr;
                </Link>
              </div>
            </div>

            <div className="relative order-1 md:order-2 flex justify-center md:justify-end min-h-[360px] md:min-h-[520px]">
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

        {/* Bottom wave: dip left → rise → pick bump → two small waves → rise right */}
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

      {/* ─── Poznáváš se? (pain points) — on page background ─── */}
      <section className="relative pt-16 md:pt-20 pb-32 md:pb-40 animate-fade-up" style={{ animationDelay: "100ms" }}>
        <div className="max-w-5xl mx-auto px-6 relative">
          <div className="text-center mb-12">
            <p className="font-display text-xs uppercase tracking-[0.18em] text-primary font-bold mb-3">
              Poznáváš se?
            </p>
            <h2 className="font-display text-3xl md:text-5xl font-extrabold tracking-tight leading-tight max-w-3xl mx-auto relative inline-block">
              {/* Hand-drawn "speed lines" — common origin at P, visible with gap, tilted down-left */}
              <svg
                aria-hidden="true"
                className="absolute -top-6 -left-[76px] md:-top-8 md:-left-[108px] w-24 h-12 md:w-32 md:h-16 text-primary pointer-events-none"
                viewBox="0 0 120 50"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
              >
                <path d="M112 15 Q95 4 76 3" />
                <path d="M117 29 Q92 20 66 31" />
                <path d="M113 41 Q92 50 74 48" />
              </svg>
              Přečetl jsi hromadu knížek &mdash;{" "}
              <span className="underline-teal">a pořád hledáš</span>?
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-5 max-w-3xl mx-auto mb-12">
            {painPoints.map((point, i) => {
              const rotations = ["rotate-[-0.8deg]", "rotate-[0.5deg]", "rotate-[-0.4deg]", "rotate-[0.7deg]"];
              return (
                <HandDrawnCard
                  key={point.text}
                  variant={i}
                  className={`animate-fade-up group ${rotations[i % 4]} hover:rotate-0 hover:-translate-y-0.5 transition-all duration-200`}
                  innerClassName="p-5 flex items-center gap-4"
                >
                  <HandDrawnIcon bg={point.bg} variant={i} size={56}>
                    <span className="text-2xl">{point.emoji}</span>
                  </HandDrawnIcon>
                  <p className="text-sm md:text-base text-foreground/80 leading-snug">
                    {point.text}
                  </p>
                </HandDrawnCard>
              );
            })}
          </div>

          <div className="text-center max-w-2xl mx-auto space-y-6">
            <p className="text-lg md:text-xl text-foreground/80 leading-relaxed">
              Další informace nepotřebuješ. Potřebuješ{" "}
              <span className="underline-playful font-semibold">něco nebo někoho, kdo ti pomůže začít konat</span>.
            </p>

            <Link href="/koucing#rezervace" className="btn-playful" data-shape="2">
              Sednout si na konzultaci &rarr;
            </Link>
          </div>
        </div>

      </section>

      {/* ─── Knihovna mini — page bg ─── */}
      {posts.length > 0 && (
        <section
          className="relative pt-16 md:pt-20 pb-16 md:pb-20 animate-fade-up"
          style={{ animationDelay: "200ms" }}
        >
          <div className="max-w-5xl mx-auto px-6 relative">
            <div className="text-center mb-10">
              <p className="font-display text-xs uppercase tracking-[0.18em] text-[#7766d8] font-bold mb-2">
                Z knihovny
              </p>
              <h2 className="font-display text-3xl md:text-5xl font-extrabold tracking-tight">
                O čem <span className="underline-playful">přemýšlím</span>
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">
              {posts.map((post, i) => {
                const rotations = ["rotate-[-1.2deg]", "rotate-[0.8deg]", "rotate-[-0.6deg]"];
                return (
                  <Link
                    key={post.id}
                    href={`/knihovna/${post.slug}`}
                    className={`block h-full group ${rotations[i % 3]} hover:rotate-0 hover:-translate-y-0.5 transition-all duration-200`}
                  >
                    <HandDrawnCard variant={i} className="h-full" innerClassName="p-6 h-full flex flex-col">
                      <h3 className="font-display text-lg font-extrabold mb-2 group-hover:text-primary transition-colors leading-snug">
                        {post.title}
                      </h3>
                      {post.subtitle && (
                        <p className="text-sm text-foreground/60 leading-relaxed flex-1 line-clamp-3 mb-5">
                          {post.subtitle}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-auto">
                        <span className="font-display font-bold text-sm text-foreground/70 group-hover:text-foreground transition-colors">
                          Číst dál
                        </span>
                        <span className="w-8 h-8 rounded-full bg-primary text-white border-2 border-foreground flex items-center justify-center text-sm shrink-0 group-hover:bg-primary-dark transition-colors group-hover:translate-x-0.5">
                          &rarr;
                        </span>
                      </div>
                    </HandDrawnCard>
                  </Link>
                );
              })}
            </div>

            <div className="text-center">
              <Link
                href="/knihovna"
                className="inline-flex items-center gap-2 font-display font-bold text-foreground/70 hover:text-foreground transition-colors"
              >
                Celá knihovna &rarr;
              </Link>
            </div>
          </div>

        </section>
      )}



      {/* ─── O mně mini ─── */}
      <section
        className="max-w-5xl mx-auto px-6 pt-12 md:pt-16 pb-16 md:pb-20 animate-fade-up"
        style={{ animationDelay: "300ms" }}
      >
        <div className="flex flex-col md:flex-row gap-8 md:gap-12 items-center">
          <HandDrawnFrame className="w-40 h-40 md:w-48 md:h-48 shrink-0">
            <Image
              src="/o-mne-hloubani.jpg"
              alt="Matěj Mauler"
              width={192}
              height={192}
              className="w-full h-full object-cover"
            />
          </HandDrawnFrame>
          <div className="flex-1 text-center md:text-left">
            <p className="font-display text-xs uppercase tracking-[0.18em] text-primary font-bold mb-2">
              O mně
            </p>
            <h2 className="font-display text-2xl md:text-3xl font-extrabold mb-4 tracking-tight">
              Bývalý muzikant, <span className="underline-teal">věčný hledač</span>
            </h2>
            <p className="text-base md:text-lg text-foreground/70 leading-relaxed mb-5">
              Většinu života jsem strávil snahou přijít na to, jak se tenhle život vlastně &bdquo;hraje&ldquo;. Nakonec jsem zjistil, že odpovědi se neschovávají v kapitolách, ale v tom, co dělám každý den.
            </p>
            <Link
              href="/o-mne"
              className="inline-flex items-center gap-2 font-display font-bold text-foreground/70 hover:text-foreground transition-colors"
            >
              Celý příběh &rarr;
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
