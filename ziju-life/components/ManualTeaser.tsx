import Link from "next/link";
import { ArrowRight } from "lucide-react";

// ── Interstitiální sekce (velký citát + odstavec) ─────────────────────────────

function Interstitial({
  quote,
  lead,
  body,
}: {
  quote: string;
  lead: string;
  body: string;
}) {
  return (
    <section className="px-4 sm:px-6 lg:px-8 py-20 md:py-28">
      <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 lg:gap-20 items-start">
        <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-foreground leading-tight tracking-tight">
          „{quote}"
        </h2>
        <div className="space-y-4 pt-2">
          <p className="text-lg md:text-xl font-bold text-foreground/85 leading-relaxed">
            {lead}
          </p>
          <p className="text-base md:text-lg text-foreground/60 leading-relaxed">
            {body}
          </p>
        </div>
      </div>
    </section>
  );
}

// ── Karta se dvěma stranami v jedné sekci ─────────────────────────────────────

function CardSection({
  emoji,
  title,
  quick,
  detail,
  bullets,
  cta,
  href,
  primary,
  reverse,
}: {
  emoji: string;
  title: string;
  quick: string;
  detail: string;
  bullets?: string[];
  cta: string;
  href: string;
  primary?: boolean;
  reverse?: boolean;
}) {
  return (
    <section className={`px-4 sm:px-6 lg:px-8 py-16 md:py-20 ${primary ? "bg-accent/4" : ""}`}>
      <div className="max-w-6xl mx-auto">
        <div className={`grid lg:grid-cols-2 gap-0 rounded-[32px] overflow-hidden border ${primary ? "border-accent/20" : "border-black/6"} shadow-lg`}>

          {/* Levá / přední strana */}
          <div className={`flex flex-col gap-6 px-8 py-10 md:px-10 md:py-12 ${reverse ? "order-2 lg:order-2" : ""} ${primary ? "bg-accent/8" : "bg-white/80 backdrop-blur"}`}>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-foreground/35">Přehled</p>
            <div className="space-y-4">
              <span className="text-6xl leading-none block">{emoji}</span>
              <h3 className="text-3xl md:text-4xl font-extrabold text-foreground leading-tight">{title}</h3>
              <p className="text-base md:text-lg text-foreground/65 leading-relaxed">{quick}</p>
            </div>
            <div className="mt-auto">
              <Link
                href={href}
                className={`inline-flex items-center gap-2 px-7 py-3.5 rounded-full text-base font-bold transition-all shadow-md hover:shadow-lg ${
                  primary
                    ? "bg-accent text-white hover:bg-accent-hover"
                    : "bg-foreground text-white hover:opacity-90"
                }`}
              >
                {cta} <ArrowRight size={16} />
              </Link>
            </div>
          </div>

          {/* Pravá / zadní strana */}
          <div className={`flex flex-col gap-6 px-8 py-10 md:px-10 md:py-12 border-t lg:border-t-0 lg:border-l border-black/6 ${reverse ? "order-1 lg:order-1" : ""} bg-white/60 backdrop-blur`}>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-foreground/35">Více info</p>
            <p className="text-base md:text-lg text-foreground/70 leading-relaxed">{detail}</p>
            {bullets && bullets.length > 0 && (
              <ul className="space-y-2.5">
                {bullets.map((b) => (
                  <li key={b} className="flex items-start gap-3 text-sm text-foreground/60">
                    <span className="flex-shrink-0 mt-2 w-1.5 h-1.5 rounded-full bg-accent/50" />
                    {b}
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-auto">
              <Link href={href} className="text-sm font-semibold text-accent hover:underline underline-offset-2 transition-colors inline-flex items-center gap-1.5">
                {cta} <ArrowRight size={14} />
              </Link>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}

// ── Export ────────────────────────────────────────────────────────────────────

export default function ManualTeaser() {
  return (
    <>
      {/* Karta 1: Tvoje mapa */}
      <CardSection
        emoji="🗺️"
        title="Tvoje mapa"
        quick="Zmapuj kde jsi, pojmenuj co tě brzdí a naplánuj kam chceš. Interaktivní průvodce zdarma."
        detail="Sedm strukturovaných kroků — od kola života přes hodnoty, vizi a překážky až po akční plán. Ke každému kroku jsou cvičení a šablony. Na konci si vygeneruješ vlastní dokument."
        bullets={[
          "Vyzkoušel/a jsi pár cest, ale v ničem ses nenašel/nenašla.",
          "Máš v hlavě chaos a potřebuješ si to srovnat.",
          "Víš, že chceš změnu, ale nedokážeš pojmenovat jakou.",
        ]}
        cta="Začít zdarma"
        href="/tvoje-mapa"
        primary
      />

      {/* Přechod 1 */}
      <Interstitial
        quote="Zkoušel jsem různé věci. Přečetl si knihy. Měl plány. A přesto jsem nevěděl, co vlastně chci."
        lead="Tohle není o motivaci ani disciplíně."
        body="Je to o tom, že jsem nikdy pořádně nepřestal a nezeptal se sám sebe — kde vlastně jsem a kam chci jít. Přesně na to je Tvoje mapa."
      />

      {/* Karta 2: Můj kompas */}
      <CardSection
        emoji="📖"
        title="Můj kompas"
        quick="Matějův osobní soubor principů, hodnot a lekcí. Inspirace pro tvůj vlastní kompas."
        detail="16 principů ve třech kategoriích — Základ (fyzická mašinérie), Principy (jak přemýšlet) a Pilulky (hořké pravdy). Každý princip je okomentovaný a doplněný tipy a zdroji. Není to dogma — je to inspirace."
        cta="Prozkoumat"
        href="/muj-kompas"
        reverse
      />

      {/* Přechod 2 */}
      <Interstitial
        quote="Nemůžeš naplánovat svůj život jednou a provždy. Ale můžeš si nastavit kompas."
        lead="Principy a hodnoty nejsou dogma."
        body="Jsou to nástroje. Pomůžou ti dělat lepší rozhodnutí, i když nemáš všechny odpovědi. Takhle to funguje u mě — a proto jsem sepsal svůj kompas."
      />

      {/* Karta 3: Inspirace */}
      <CardSection
        emoji="✨"
        title="Inspirace"
        quick="Knihy, podcasty, články a nápady, které mě formovaly a můžou být užitečné i pro tebe."
        detail="Knihy, videa, reelsky a články, které Matěje formovaly. Roztříděné do kategorií — od osobního rozvoje přes zdraví po mindset. Průběžně doplňováno."
        cta="Prozkoumat"
        href="/inspirace"
      />
    </>
  );
}
