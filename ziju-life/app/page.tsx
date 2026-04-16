import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { listCuratedPosts } from "@/lib/curated-posts-db";

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
    bg: "bg-[#dfd8fa]",
  },
  {
    emoji: "💭",
    text: "Máš tisíc plánů, ráno nevíš, kde začít.",
    bg: "bg-[#c6f1ec]",
  },
  {
    emoji: "⏳",
    text: "Žiješ v budoucnu. Ta mezera tě paralyzuje.",
    bg: "bg-[#fff0c2]",
  },
  {
    emoji: "📚",
    text: "Další knížka, další app. A pak zas nic.",
    bg: "bg-[#ffe4cc]",
  },
];

export default async function Home() {
  const posts = await getLatestPosts();

  return (
    <main className="flex-1 bg-background overflow-x-hidden relative min-h-screen">

      {/* ─── Hero — full bleed peachy background ─── */}
      <section className="relative bg-[#fdf0e6] pt-28 md:pt-32 pb-32 md:pb-40 -mt-20 animate-fade-up">
        <div className="max-w-5xl mx-auto px-6 relative">
          <div className="grid grid-cols-1 md:grid-cols-[1.1fr_1fr] gap-6 md:gap-8 items-center">
            <div className="text-center md:text-left order-2 md:order-1">
              <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-extrabold leading-[1.05] mb-5 tracking-tight">
                Přemýšlíš hodně.{" "}
                <span className="underline-playful">Děláš málo.</span>
              </h1>

              <p className="text-lg md:text-xl text-foreground/80 leading-relaxed mb-7">
                Taky jsem to tak měl. Teď pomáhám lidem, co se zasekli v hlavě, začít reálně žít.
              </p>

              <div className="flex flex-col sm:flex-row items-center md:items-start gap-3">
                <Link href="/koucing#rezervace" className="btn-playful">
                  Konzultace zdarma &rarr;
                </Link>
                <Link
                  href="/knihovna"
                  className="inline-flex items-center gap-2 text-sm text-muted hover:text-foreground transition-colors group px-3 py-2"
                >
                  Nebo si nejdřív přečti, o čem přemýšlím
                  <span className="inline-block transition-transform group-hover:translate-x-0.5">
                    &rarr;
                  </span>
                </Link>
              </div>
            </div>

            <div className="relative order-1 md:order-2 h-72 md:h-[460px]">
              {/* Decorative circle behind photo */}
              <div
                aria-hidden="true"
                className="absolute inset-0 flex items-center justify-center md:justify-end"
              >
                <div className="w-60 h-60 md:w-[380px] md:h-[380px] rounded-full bg-[#ff8c42]/25" />
              </div>
              <Image
                src="/matej-photo.jpg"
                alt="Matěj Mauler"
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-contain object-center md:object-right relative z-10"
                priority
              />
            </div>
          </div>
        </div>

        {/* Wavy bottom edge — multiple peaks */}
        <svg
          aria-hidden="true"
          className="absolute bottom-0 left-0 w-full h-20 md:h-28"
          viewBox="0 0 1440 120"
          preserveAspectRatio="none"
        >
          <path
            d="M0,70 C120,120 240,20 360,60 C480,100 600,20 720,60 C840,100 960,20 1080,60 C1200,100 1320,20 1440,60 L1440,120 L0,120 Z"
            fill="#FDFDF7"
          />
        </svg>
      </section>

      <div className="max-w-5xl mx-auto px-6 pt-12 md:pt-16 pb-16 md:pb-20">

        {/* ─── Poznáváš se? (pain points) ─── */}
        <section
          className="mb-24 md:mb-32 animate-fade-up relative"
          style={{ animationDelay: "100ms" }}
        >
          <div className="text-center mb-12">
            <p className="font-display text-xs uppercase tracking-[0.18em] text-primary font-bold mb-3">
              Poznáváš se?
            </p>
            <h2 className="font-display text-3xl md:text-5xl font-extrabold tracking-tight leading-tight max-w-3xl mx-auto">
              Přečetl jsi hromadu knížek &mdash;{" "}
              <span className="underline-teal">a pořád hledáš</span>?
            </h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-5 mb-12">
            {painPoints.map((point, i) => (
              <div
                key={point.text}
                className="paper-card p-5 flex flex-col items-center text-center gap-3 animate-fade-up"
                style={{ animationDelay: `${200 + i * 80}ms` }}
              >
                <div className={`w-14 h-14 rounded-full ${point.bg} flex items-center justify-center text-2xl shrink-0`}>
                  {point.emoji}
                </div>
                <p className="text-sm md:text-base text-foreground/80 leading-snug">
                  {point.text}
                </p>
              </div>
            ))}
          </div>

          <div className="text-center max-w-2xl mx-auto space-y-6">
            <p className="text-lg md:text-xl text-foreground/80 leading-relaxed">
              Další informace nepotřebuješ. Potřebuješ{" "}
              <span className="underline-playful font-semibold">něco nebo někoho, kdo ti pomůže začít konat</span>.
            </p>

            <Link href="/koucing#rezervace" className="btn-playful">
              Sednout si na konzultaci &rarr;
            </Link>
          </div>
        </section>

        {/* ─── Knihovna mini ─── */}
        {posts.length > 0 && (
          <section
            className="mb-24 md:mb-32 animate-fade-up"
            style={{ animationDelay: "200ms" }}
          >
            <div className="text-center mb-10">
              <p className="font-display text-xs uppercase tracking-[0.18em] text-[#7766d8] font-bold mb-2">
                Z knihovny
              </p>
              <h2 className="font-display text-3xl md:text-5xl font-extrabold tracking-tight">
                O čem <span className="underline-playful">přemýšlím</span>
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">
              {posts.map((post) => (
                <Link
                  key={post.id}
                  href={`/knihovna/${post.slug}`}
                  className="paper-card p-6 h-full flex flex-col group relative border-l-[6px] border-l-[#ffe4cc] pl-5"
                >
                  <h3 className="font-display text-lg font-extrabold mb-2 group-hover:text-primary transition-colors leading-snug pr-8">
                    {post.title}
                  </h3>
                  {post.subtitle && (
                    <p className="text-sm text-foreground/60 leading-relaxed flex-1 line-clamp-3 mb-5">
                      {post.subtitle}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-auto">
                    <span className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm shrink-0 group-hover:bg-primary-dark transition-colors">
                      &rarr;
                    </span>
                    <span className="font-display font-bold text-sm text-foreground/70 group-hover:text-foreground transition-colors">
                      Číst dál
                    </span>
                  </div>
                </Link>
              ))}
            </div>

            <div className="text-center">
              <Link
                href="/knihovna"
                className="inline-flex items-center gap-2 font-display font-bold text-foreground/70 hover:text-foreground transition-colors"
              >
                Celá knihovna &rarr;
              </Link>
            </div>
          </section>
        )}

        {/* ─── O mně mini ─── */}
        <section
          className="mb-12 animate-fade-up"
          style={{ animationDelay: "300ms" }}
        >
          <div className="flex flex-col md:flex-row gap-8 md:gap-12 items-center">
            <div className="paper-card overflow-hidden w-40 h-40 md:w-48 md:h-48 shrink-0">
              <Image
                src="/o-mne-hloubani.jpg"
                alt="Matěj Mauler"
                width={192}
                height={192}
                className="w-full h-full object-cover"
              />
            </div>
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
      </div>
    </main>
  );
}
