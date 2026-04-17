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

      {/* ─── Hero — full bleed, same bg as nav area ─── */}
      <section className="relative bg-[#F3E7D0] pt-36 md:pt-44 pb-40 md:pb-52 -mt-20 animate-fade-up overflow-hidden">
        <div className="max-w-5xl mx-auto px-6 relative">
          <div className="grid grid-cols-1 md:grid-cols-[1.1fr_1fr] gap-6 md:gap-10 items-center">
            <div className="text-center md:text-left order-2 md:order-1 relative z-10">
              <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-extrabold leading-[1.05] mb-6 tracking-tight">
                <span className="block">Přemýšlíš hodně.</span>
                <span className="underline-sketch inline-block pb-3">Děláš málo.</span>
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

            <div className="relative order-1 md:order-2 flex justify-center md:justify-end min-h-[360px] md:min-h-[520px]">
              {/* Pick/trsátko shape behind silhouette — slightly darker, rotated */}
              <svg
                aria-hidden="true"
                className="absolute top-0 right-0 w-[22rem] h-[24rem] md:w-[440px] md:h-[520px] pointer-events-none z-0"
                viewBox="0 0 200 240"
                style={{ transform: "rotate(-8deg)" }}
              >
                <path
                  fill="#E5CBA3"
                  d="M100,0 C145,0 180,30 190,75 C200,120 195,165 175,200 C155,230 130,240 100,240 C70,240 45,230 25,200 C5,165 0,120 10,75 C20,30 55,0 100,0 Z"
                />
              </svg>

              <div className="relative w-72 h-80 md:w-[420px] md:h-[520px] z-10">
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
          className="absolute bottom-0 left-0 w-full h-32 md:h-44"
          viewBox="0 0 1440 180"
          preserveAspectRatio="none"
        >
          <path
            d="M0,20 C120,20 200,120 360,140 C460,152 520,80 640,40 C700,15 760,10 820,25 C900,48 940,90 1020,85 C1100,80 1180,40 1280,20 C1360,6 1420,10 1440,15 L1440,180 L0,180 Z"
            fill="#F8F4EA"
          />
        </svg>
      </section>

      {/* ─── Poznáváš se? (pain points) — on page background ─── */}
      <section className="relative pt-16 md:pt-20 pb-16 md:pb-24 animate-fade-up" style={{ animationDelay: "100ms" }}>
        <div className="max-w-5xl mx-auto px-6 relative">
          <div className="text-center mb-12">
            <p className="font-display text-xs uppercase tracking-[0.18em] text-primary font-bold mb-3">
              Poznáváš se?
            </p>
            <h2 className="font-display text-3xl md:text-5xl font-extrabold tracking-tight leading-tight max-w-3xl mx-auto">
              Přečetl jsi hromadu knížek &mdash;{" "}
              <span className="underline-teal">a pořád hledáš</span>?
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-5 max-w-3xl mx-auto mb-12">
            {painPoints.map((point, i) => (
              <div
                key={point.text}
                className="paper-card p-5 flex items-center gap-4 animate-fade-up"
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
        </div>

      </section>

      {/* ─── Knihovna mini — on page background ─── */}
      {posts.length > 0 && (
        <section
          className="relative pt-8 md:pt-12 pb-16 md:pb-20 animate-fade-up"
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
          </div>

        </section>
      )}

      {/* ─── O mně mini ─── */}
      <section
        className="max-w-5xl mx-auto px-6 pt-12 md:pt-16 pb-16 md:pb-20 animate-fade-up"
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
    </main>
  );
}
