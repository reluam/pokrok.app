import Link from "next/link";
import { ArrowRight } from "lucide-react";

// ── Sekce: citát + dva boxy ───────────────────────────────────────────────────

function Section({
  quote,
  emoji,
  title,
  quick,
  lead,
  body,
  detail,
  bullets,
  cta,
  href,
  reverse,
}: {
  quote: string;
  emoji: string;
  title: string;
  quick: string;
  lead?: string;
  body?: string;
  detail: string;
  bullets?: string[];
  cta: string;
  href: string;
  reverse?: boolean;
}) {
  return (
    <section className="px-4 sm:px-6 lg:px-8 py-20 md:py-28">
      <div className="max-w-6xl mx-auto space-y-10">

        {/* Citát */}
        <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-foreground leading-tight tracking-tight max-w-4xl">
          „{quote}"
        </h2>

        {/* Boxy */}
        <div className="grid lg:grid-cols-2 gap-5 lg:gap-6">

          {/* Box 1: Přehled */}
          <div className={`flex flex-col gap-6 px-8 py-10 md:px-10 md:py-12 rounded-[32px] border border-black/6 shadow-lg bg-white/80 backdrop-blur ${reverse ? "lg:order-2" : ""}`}>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-foreground/35">Přehled</p>
            <div className="space-y-4">
              <span className="text-6xl leading-none block">{emoji}</span>
              <h3 className="text-3xl md:text-4xl font-extrabold text-foreground leading-tight">{title}</h3>
              <p className="text-base md:text-lg text-foreground/65 leading-relaxed">{quick}</p>
            </div>
            <div className="mt-auto">
              <Link
                href={href}
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full text-base font-bold transition-all shadow-md hover:shadow-lg bg-accent text-white hover:bg-accent-hover"
              >
                {cta} <ArrowRight size={16} />
              </Link>
            </div>
          </div>

          {/* Box 2: Více info */}
          <div className={`flex flex-col gap-6 px-8 py-10 md:px-10 md:py-12 rounded-[32px] border border-black/6 shadow-md bg-white/60 backdrop-blur ${reverse ? "lg:order-1" : ""}`}>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-foreground/35">Více info</p>
            {lead && (
              <div className="space-y-2">
                <p className="text-base md:text-lg font-bold text-foreground/85 leading-relaxed">{lead}</p>
                {body && <p className="text-base text-foreground/60 leading-relaxed">{body}</p>}
              </div>
            )}
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
      <Section
        quote="Zkoušel jsem různé věci. Přečetl si knihy. Měl plány. A přesto jsem nevěděl, co vlastně chci."
        emoji="🗺️"
        title="Tvoje mapa"
        quick="Zmapuj kde jsi, pojmenuj co tě brzdí a naplánuj kam chceš jít. Interaktivní průvodce zdarma."
        lead="Tohle není o motivaci ani disciplíně."
        body="Je to o tom, že jsem nikdy pořádně nepřestal a nezeptal se sám sebe — kde vlastně jsem a kam chci jít. Přesně na to je Tvoje mapa."
        detail="Sedm strukturovaných kroků — od kola života přes hodnoty, vizi a překážky až po akční plán. Ke každému kroku jsou cvičení a šablony. Na konci si vygeneruješ vlastní dokument."
        bullets={[
          "Vyzkoušel/a jsi pár cest, ale v ničem ses nenašel/nenašla.",
          "Máš v hlavě chaos a potřebuješ si to srovnat.",
          "Víš, že chceš změnu, ale nedokážeš pojmenovat jakou.",
        ]}
        cta="Začít zdarma"
        href="/tvoje-mapa"
      />

      <Section
        quote="Nemůžeš naplánovat svůj život jednou a provždy. Ale můžeš si nastavit kompas."
        emoji="📖"
        title="Můj kompas"
        quick="Matějův osobní soubor principů, hodnot a lekcí. Inspirace pro tvůj vlastní kompas."
        lead="Principy a hodnoty nejsou dogma."
        body="Jsou to nástroje. Pomůžou ti dělat lepší rozhodnutí, i když nemáš všechny odpovědi. Takhle to funguje u mě — a proto jsem sepsal svůj kompas."
        detail="16 principů ve třech kategoriích — Základ (fyzická mašinérie), Principy (jak přemýšlet) a Pilulky (hořké pravdy). Každý princip je okomentovaný a doplněný tipy a zdroji. Není to dogma — je to inspirace."
        cta="Prozkoumat"
        href="/muj-kompas"
        reverse
      />
    </>
  );
}
