import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAllPrinciples, getPrincipleBySlug } from "@/lib/principles";
import { getInspirationData } from "@/lib/inspiration-db";
import InspirationCard from "@/components/InspirationCard";
import PrincipleShareBar from "@/components/PrincipleShareBar";
import type { InspirationItem } from "@/lib/inspiration";

const FALLBACK_PRINCIPLES = [
  {
    slug: "za-svuj-zivot-jsi-zodpovedny-pouze-ty-sam",
    title: "Za svůj život jsi zodpovědný pouze ty sám.",
    shortDescription:
      "Nikdo jiný nemůže žít tvůj život za tebe. V určitém bodě si prostě musíš říct: „Je to na mně.“",
    contentMarkdown:
      "Za svůj život jsi zodpovědný pouze ty sám.\n\nMůžeš mít podporu, kouče, partnera, komunitu. Ale rozhodnutí, které děláš každé ráno, večer i mezi tím, za tebe nikdo neudělá. V určitém bodě si prostě musíš přiznat: *„Je to na mně.“*\n\nTo není tlak, ale svoboda. Jakmile to přijmeš, můžeš s vlastním životem mnohem víc experimentovat.",
  },
  {
    slug: "skoro-nic-neni-tak-vazne-abys-z-toho-nemohl-udelat-hru",
    title: "Skoro nic není tak vážné, abys z toho nemohl udělat hru.",
    shortDescription:
      "I těžké situace se dají vzít s lehkostí. Když se na ně podíváš jako na experiment nebo hru, získáš zpátky kontrolu.",
    contentMarkdown:
      "Skoro nic není tak vážné, abys z toho nemohl udělat hru.\n\nKdyž se na změnu, projekt nebo nepříjemný rozhovor podíváš jako na hru nebo experiment, hlava si oddechne. Nejde o to vyhrát na první dobrou. Jde o to zkoušet tahy, učit se a sbírat zkušenosti.\n\nMísto *„Nesmím to pokazit“* můžeš zkusit: *„Jsem zvědavý, co se stane, když udělám tenhle krok.“*",
  },
  {
    slug: "svuj-zivotni-smysl-tvoris-kazdodennimi-kroky-a-rozhodnutimi",
    title: "Svůj životní smysl tvoříš každodenními kroky a rozhodnutími.",
    shortDescription:
      "Smysl nepřijde shora jako jeden velký „aha moment“. Vzniká z malých voleb, které děláš dnes a zítra.",
    contentMarkdown:
      "Svůj životní smysl tvoříš každodenními kroky a rozhodnutími.\n\nČasto čekáme na jeden zlomový okamžik, který nám „vysvětlí život“. V praxi ale smysl vzniká z drobných rozhodnutí – čemu říkáš ano, čemu ne, kam dáváš energii a pozornost.\n\nMůžeš začít maličkostmi: jedním projektem, jedním návykem, jedním rozhovorem, který už dlouho odkládáš.",
  },
  {
    slug: "skoro-nic-neni-pouze-cernobile",
    title: "Skoro nic není pouze černobílé.",
    shortDescription:
      "Život se nedá žít jen v režimu ano/ne. Mezi tím je obrovský prostor, kde si můžeš nastavit vlastní pravidla.",
    contentMarkdown:
      "Skoro nic není pouze černobílé.\n\nBuď práce, nebo svoboda. Buď rodina, nebo kariéra. Buď stabilita, nebo zážitky. Tenhle způsob přemýšlení tě často zbytečně zamyká.\n\nMezi černou a bílou je spousta odstínů. A právě tam si můžeš začít skládat život podle sebe – ne podle škatulek ostatních.",
  },
  {
    slug: "opravdove-sebevedomi-si-vybudujes-delanim-tezkych-veci",
    title: "Opravdové sebevědomí si vybuduješ děláním těžkých věcí.",
    shortDescription:
      "Sebevědomí není afirmace v zrcadle, ale důkaz. Přichází, když děláš kroky, do kterých se ti nechce – a ustojíš je.",
    contentMarkdown:
      "Opravdové sebevědomí si vybuduješ děláním těžkých věcí.\n\nMůžeš si opakovat, že na to máš. Ale dokud si to neověříš v reálném světě, hlava tomu stejně úplně nevěří.\n\nKaždý malý „těžký krok“, který zvládneš – nepříjemný hovor, odmítnutí, nový projekt – je malý důkaz pro tvé sebevědomí: *„Zvládl jsem to. Dám i další věc.“*",
  },
  {
    slug: "neexistuje-jedna-vec-ktera-zazracne-vyresi-tvuj-zivot",
    title:
      "Neexistuje žádná jedna věc, která zázračně vyřeší tvůj život.",
    shortDescription:
      "Žádný kurz, ezo rituál ani kniha za tebe neudělají práci. Funguje jen kombinace malých, poctivých kroků v čase.",
    contentMarkdown:
      "Neexistuje žádná jedna věc, která zázračně vyřeší tvůj život.\n\nJe lákavé věřit, že existuje jeden retreat, jeden kurz, jedna kniha nebo jedna metoda, která všechno přepne. Realita je většinou střízlivější – a zároveň mnohem víc pod tvojí kontrolou.\n\nTo, co dlouhodobě funguje, je soubor principů, návyků a rozhodnutí, které opakuješ znovu a znovu. Bez magie, ale s výsledkem.",
  },
] as const;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const principleFromDb = await getPrincipleBySlug(slug);
  const fallback = FALLBACK_PRINCIPLES.find((p) => p.slug === slug);

  const title =
    principleFromDb?.title ??
    fallback?.title ??
    "Princip – Žiju life";

  const description =
    principleFromDb?.shortDescription ??
    fallback?.shortDescription ??
    "Princip, podle kterého můžeš skládat život více podle sebe.";

  return {
    title,
    description,
  };
}

export default async function PrincipleDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const principleFromDb = await getPrincipleBySlug(slug);
  const fallback = FALLBACK_PRINCIPLES.find((p) => p.slug === slug);

  if (!principleFromDb && !fallback) {
    notFound();
  }

  const title = principleFromDb?.title ?? fallback!.title;
  const shortDescription =
    principleFromDb?.shortDescription ?? fallback!.shortDescription;
  const principleNumber = principleFromDb
    ? principleFromDb.orderIndex
    : FALLBACK_PRINCIPLES.findIndex((p) => p.slug === slug) + 1;

  const allPrinciples: { slug: string; title: string }[] =
    principleFromDb !== null
      ? (await getAllPrinciples()).map((p) => ({ slug: p.slug, title: p.title }))
      : FALLBACK_PRINCIPLES.map((p) => ({ slug: p.slug, title: p.title }));
  const currentIndex = allPrinciples.findIndex((p) => p.slug === slug);
  const prevPrinciple =
    currentIndex > 0 ? allPrinciples[currentIndex - 1] : null;
  const nextPrinciple =
    currentIndex >= 0 && currentIndex < allPrinciples.length - 1
      ? allPrinciples[currentIndex + 1]
      : null;

  const relatedIds = principleFromDb?.relatedInspirationIds ?? [];
  let relatedItems: InspirationItem[] = [];

  if (relatedIds.length > 0) {
    const inspirationData = await getInspirationData(false);
    const all: InspirationItem[] = [
      ...inspirationData.blogs,
      ...inspirationData.videos,
      ...inspirationData.books,
      ...inspirationData.articles,
      ...inspirationData.other,
      ...inspirationData.music,
    ];
    relatedItems = all.filter((item) => relatedIds.includes(item.id));
  }

  return (
    <main className="min-h-screen py-12 md:py-16 lg:py-20 px-4 md:px-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <Link
            href="/principy"
            className="inline-flex items-center gap-2 text-foreground/70 hover:text-foreground transition-colors"
          >
            <span aria-hidden>←</span>
            <span>Zpět na principy</span>
          </Link>
        </div>

        <article className="relative overflow-hidden rounded-[32px] border border-white/60 bg-white/85 shadow-xl backdrop-blur glass-grain px-6 py-8 md:px-10 md:py-10 space-y-6">
          <header className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 border border-accent/20 text-accent text-sm font-semibold">
              <span>#{principleNumber}</span>
            </div>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight text-foreground">
              {title}
            </h1>
            <p className="text-base md:text-lg text-foreground/80 leading-relaxed">
              {shortDescription}
            </p>
            <PrincipleShareBar title={title} shortDescription={shortDescription} slug={slug} />
          </header>

          {relatedItems.length > 0 && (
            <div className="pt-6 border-t border-black/10 space-y-4">
              {(() => {
                const webArticles = relatedItems.filter(
                  (item) => item.type === "article" || item.type === "blog"
                );
                const otherItems = relatedItems.filter(
                  (item) => item.type !== "article" && item.type !== "blog"
                );
                return (
                  <>
                    {webArticles.length > 0 && (
                      <div className="space-y-2">
                        <h2 className="text-lg font-semibold text-foreground">
                          Články
                        </h2>
                        <ul className="space-y-1">
                          {webArticles.map((item) => {
                            const isExternal =
                              item.url.startsWith("http://") ||
                              item.url.startsWith("https://");
                            return (
                              <li key={item.id}>
                                {isExternal ? (
                                  <a
                                    href={item.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-accent font-semibold hover:underline"
                                  >
                                    {item.title}
                                    <span className="ml-1 text-foreground/60" aria-hidden>
                                      ↗
                                    </span>
                                  </a>
                                ) : (
                                  <Link
                                    href={`/inspirace/${item.id}`}
                                    className="text-accent font-semibold hover:underline"
                                  >
                                    {item.title}
                                  </Link>
                                )}
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    )}
                    {otherItems.length > 0 && (
                      <div className="space-y-4">
                        <h2 className="text-lg font-semibold text-foreground">
                          Ostatní inspirace
                        </h2>
                        <div className="grid gap-4 md:gap-5 md:grid-cols-3">
                          {otherItems.map((item, index) => (
                            <InspirationCard key={item.id} item={item} index={index} />
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          )}
        </article>

        <nav
          className="flex items-center justify-between gap-4"
          aria-label="Předchozí a další princip"
        >
          {prevPrinciple ? (
            <Link
              href={`/principy/${prevPrinciple.slug}`}
              className="group flex items-center gap-2 text-foreground/80 hover:text-foreground transition-colors min-w-0 flex-1"
            >
              <span className="text-foreground font-bold text-2xl shrink-0 leading-none" aria-hidden>
                ←
              </span>
              <span className="truncate font-semibold">{prevPrinciple.title}</span>
            </Link>
          ) : (
            <span className="flex-1" />
          )}
          {nextPrinciple ? (
            <Link
              href={`/principy/${nextPrinciple.slug}`}
              className="group flex items-center gap-2 text-foreground/80 hover:text-foreground transition-colors min-w-0 flex-1 justify-end text-right"
            >
              <span className="truncate font-semibold">{nextPrinciple.title}</span>
              <span className="text-foreground font-bold text-2xl shrink-0 leading-none" aria-hidden>
                →
              </span>
            </Link>
          ) : (
            <span className="flex-1" />
          )}
        </nav>
      </div>
    </main>
  );
}

export async function generateStaticParams() {
  try {
    const principles = await getAllPrinciples();
    if (principles.length > 0) {
      return principles.map((p) => ({ slug: p.slug }));
    }
  } catch {
    // ignore – fall back to hardcoded slugs
  }

  return FALLBACK_PRINCIPLES.map((p) => ({ slug: p.slug }));
}

