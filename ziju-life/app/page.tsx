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
  "Víš, jak chceš, aby tvůj život vypadal, ale nedokážeš ho začít žít?",
  "Máš tisíc plánů v hlavě, ale ráno nevíš, kde začít?",
  "Žiješ víc v budoucnosti než v přítomnosti — a ta mezera tě paralyzuje?",
  "Zkoušel/a jsi plánovače, knížky, appky — a nic ti nevydrželo víc než týden?",
];

export default async function Home() {
  const posts = await getLatestPosts();

  return (
    <main className="flex-1 bg-background overflow-x-hidden relative min-h-screen">
      <div className="max-w-5xl mx-auto px-6 py-16 md:py-20 pt-28 md:pt-32">

        {/* ─── Hero ─── */}
        <section
          className="mb-20 md:mb-24 animate-fade-up relative"
          style={{ animationDelay: "0ms" }}
        >
          <div className="absolute -top-4 -left-2 text-3xl animate-float opacity-60 hidden md:block">
            ✨
          </div>
          <div
            className="absolute top-10 -right-4 text-2xl animate-float opacity-50 hidden md:block"
            style={{ animationDelay: "1.5s" }}
          >
            🌿
          </div>

          <div className="grid grid-cols-1 md:grid-cols-[auto_1fr] gap-8 md:gap-10 items-center">
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

            <div className="text-center md:text-left">
              <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-extrabold leading-[1.05] mb-5 tracking-tight">
                Přemýšlíš hodně.{" "}
                <span className="underline-playful">Děláš málo.</span>
              </h1>

              <p className="text-lg md:text-xl text-foreground/80 leading-relaxed mb-6">
                Jsem Matěj. Pomáhám lidem, co se zasekli v hlavě, začít reálně žít. Skrz koučink a upřímný rozhovor.
              </p>

              <div className="flex flex-col sm:flex-row items-center md:items-start gap-3">
                <Link href="/koucing#rezervace" className="btn-playful">
                  Rezervovat konzultaci zdarma &rarr;
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
          </div>
        </section>

        {/* ─── Poznáváš se? (pain points) ─── */}
        <section
          className="mb-20 md:mb-24 animate-fade-up"
          style={{ animationDelay: "100ms" }}
        >
          <div className="text-center mb-8">
            <p className="font-display text-xs uppercase tracking-[0.18em] text-primary font-bold mb-2">
              Poznáváš se?
            </p>
            <h2 className="font-display text-3xl md:text-4xl font-extrabold tracking-tight">
              A co když jsi už hodně přečetl &mdash; a{" "}
              <span className="underline-teal">pořád hledáš</span>?
            </h2>
          </div>

          <div className="paper-card p-8 md:p-10 space-y-6">
            <div className="space-y-3">
              {painPoints.map((point) => (
                <div key={point} className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#e8faf8] flex items-center justify-center mt-0.5">
                    <span className="text-[#2ba89e] font-bold text-xs">&rarr;</span>
                  </span>
                  <span className="text-base md:text-lg text-foreground/80">{point}</span>
                </div>
              ))}
            </div>

            <p className="text-lg text-foreground/80 leading-relaxed">
              Koučink ti nepřidá další informace. Jde pod povrch &mdash; zjistí, co tě drží tam, kde jsi, a co konkrétně potřebuješ změnit. Pak pracujeme na akci, ne jen na pochopení.
            </p>

            <Link href="/koucing#rezervace" className="btn-playful">
              Sednout si na konzultaci &rarr;
            </Link>
          </div>
        </section>

        {/* ─── Knihovna mini ─── */}
        {posts.length > 0 && (
          <section
            className="mb-20 md:mb-24 animate-fade-up"
            style={{ animationDelay: "200ms" }}
          >
            <div className="text-center mb-10">
              <p className="font-display text-xs uppercase tracking-[0.18em] text-[#7766d8] font-bold mb-2">
                Z knihovny
              </p>
              <h2 className="font-display text-3xl md:text-4xl font-extrabold tracking-tight">
                O čem <span className="underline-playful">přemýšlím</span>
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
              {posts.map((post) => (
                <Link
                  key={post.id}
                  href={`/knihovna/${post.slug}`}
                  className="paper-card p-6 h-full flex flex-col group"
                >
                  <h3 className="font-display text-lg font-extrabold mb-2 group-hover:text-primary transition-colors">
                    {post.title}
                  </h3>
                  {post.subtitle && (
                    <p className="text-sm text-foreground/60 leading-relaxed flex-1 line-clamp-4">
                      {post.subtitle}
                    </p>
                  )}
                  <p className="font-display font-bold text-sm text-[#7766d8] mt-4 inline-flex items-center gap-1.5">
                    Číst dál
                    <span className="inline-block transition-transform group-hover:translate-x-0.5">&rarr;</span>
                  </p>
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
          <div className="paper-card p-8 md:p-10">
            <div className="flex flex-col md:flex-row gap-8 items-center">
              <div className="paper-card overflow-hidden w-36 h-36 md:w-40 md:h-40 shrink-0">
                <Image
                  src="/matej-photo.jpg"
                  alt="Matěj Mauler"
                  width={160}
                  height={160}
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
                  Jsem Matěj. Většinu života jsem strávil snahou přijít na to, jak se tenhle život vlastně &bdquo;hraje&ldquo;. Nakonec jsem zjistil, že odpovědi se neschovávají v kapitolách, ale v tom, co dělám každý den.
                </p>
                <Link
                  href="/o-mne"
                  className="inline-flex items-center gap-2 font-display font-bold text-foreground/70 hover:text-foreground transition-colors"
                >
                  Celý příběh &rarr;
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
