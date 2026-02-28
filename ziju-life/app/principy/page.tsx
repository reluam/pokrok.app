import RevealSection from "@/components/RevealSection";
import Link from "next/link";
import { getAllPrinciples } from "@/lib/principles";

const FALLBACK_PRINCIPLES = [
  {
    slug: "za-svuj-zivot-jsi-zodpovedny-pouze-ty-sam",
    title: "Za svůj život jsi zodpovědný pouze ty sám.",
    shortDescription:
      "Nikdo jiný nemůže žít tvůj život za tebe. V určitém bodě si prostě musíš říct: „Je to na mně.“",
  },
  {
    slug: "skoro-nic-neni-tak-vazne-abys-z-toho-nemohl-udelat-hru",
    title: "Skoro nic není tak vážné, abys z toho nemohl udělat hru.",
    shortDescription:
      "I těžké situace se dají vzít s lehkostí. Když se na ně podíváš jako na experiment nebo hru, získáš zpátky kontrolu.",
  },
  {
    slug: "svuj-zivotni-smysl-tvoris-kazdodennimi-kroky-a-rozhodnutimi",
    title: "Svůj životní smysl tvoříš každodenními kroky a rozhodnutími.",
    shortDescription:
      "Smysl nepřijde shora jako jeden velký „aha moment“. Vzniká z malých voleb, které děláš dnes a zítra.",
  },
  {
    slug: "skoro-nic-neni-pouze-cernobile",
    title: "Skoro nic není pouze černobílé.",
    shortDescription:
      "Život se nedá žít jen v režimu ano/ne. Mezi tím je obrovský prostor, kde si můžeš nastavit vlastní pravidla.",
  },
  {
    slug: "opravdove-sebevedomi-si-vybudujes-delanim-tezkych-veci",
    title: "Opravdové sebevědomí si vybuduješ děláním těžkých věcí.",
    shortDescription:
      "Sebevědomí není afirmace v zrcadle, ale důkaz. Přichází, když děláš kroky, do kterých se ti nechce – a ustojíš je.",
  },
  {
    slug: "neexistuje-jedna-vec-ktera-zazracne-vyresi-tvuj-zivot",
    title:
      "Neexistuje žádná jedna věc, která zázračně vyřeší tvůj život.",
    shortDescription:
      "Žádný kurz, ezo rituál ani kniha za tebe neudělají práci. Funguje jen kombinace malých, poctivých kroků v čase.",
  },
] as const;

export const dynamic = "force-dynamic";

export default async function PrinciplesPage() {
  let principles: { slug: string; title: string; shortDescription: string }[] =
    [];

  try {
    const fromDb = await getAllPrinciples();
    if (fromDb.length > 0) {
      principles = fromDb.map((p) => ({
        slug: p.slug,
        title: p.title,
        shortDescription: p.shortDescription,
      }));
    } else {
      principles = [...FALLBACK_PRINCIPLES];
    }
  } catch {
    principles = [...FALLBACK_PRINCIPLES];
  }

  return (
    <main className="min-h-screen">
      <section className="pt-8 pb-12 md:pt-10 md:pb-16 lg:pt-12 lg:pb-20">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <RevealSection triggerOnMount>
            <div className="bg-white/85 rounded-[32px] border border-white/60 shadow-md backdrop-blur glass-grain px-6 py-8 md:px-10 md:py-10 lg:px-12 lg:py-12 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 border border-accent/20 text-accent text-sm font-semibold">
                <span>Principy</span>
              </div>
              <div className="space-y-4 max-w-3xl">
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight text-foreground">
                  Principy, na kterých stavím{" "}
                  <span className="hand-drawn-underline">Žiju life</span>.
                </h1>
                <p className="text-base md:text-lg text-foreground/80 leading-relaxed">
                  Tohle není seznam univerzálních pravd, které musíš slepě
                  následovat. Je to seznam principů, které jsem si sám odzkoušel
                  a zjistil jsem, že když se jich držím, vedou k mnohem lepším
                  výsledkům a většímu klidu než jakékoliv jiné strategie.
                </p>
                <p className="text-base md:text-lg text-foreground/80 leading-relaxed">
                  Celým tímhle systémem jsem se inspiroval u Raye Dalia a jeho
                  knihy Principy. Dalio přistupuje k životu jako k sérii
                  neustále se opakujících situací (takových životních
                  algoritmů), které se dají pomocí jasně daných pravidel
                  elegantně a s chladnou hlavou vyřešit.
                </p>
              </div>
            </div>
          </RevealSection>

          <RevealSection className="mt-10 md:mt-12 lg:mt-14" delay={0.05}>
            <div className="grid gap-6 md:gap-7 md:grid-cols-2">
              {principles.map((principle, index) => (
                <article
                  key={principle.slug}
                  className="bg-white/85 rounded-[24px] p-6 md:p-7 border border-white/60 shadow-md hover:shadow-xl hover:-translate-y-1 transition-all backdrop-blur glass-grain flex flex-col h-full"
                >
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="text-sm font-semibold text-foreground/60">
                      {String(index + 1).padStart(2, "0")}
                    </div>
                    <h2 className="text-xl md:text-2xl font-semibold text-foreground flex-1">
                      {principle.title}
                    </h2>
                  </div>
                  <p className="text-foreground/75 leading-relaxed mb-4 flex-1">
                    {principle.shortDescription}
                  </p>
                  <div>
                    <Link
                      href={`/principy/${principle.slug}`}
                      className="inline-flex items-center text-accent font-semibold hover:underline"
                    >
                      Rozkliknout princip
                      <span aria-hidden className="ml-1">
                        →
                      </span>
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </RevealSection>
        </div>
      </section>
    </main>
  );
}

