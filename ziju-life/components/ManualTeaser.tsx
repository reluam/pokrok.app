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

// ── Sekce se dvěma samostatnými boxy vedle sebe ───────────────────────────────

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
    <div className="px-4 sm:px-6 lg:px-8 pb-20 md:pb-28">
      <div className="max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-5 lg:gap-6">

          {/* Box 1: Přehled */}
          <div className={`flex flex-col gap-6 px-8 py-10 md:px-10 md:py-12 rounded-[32px] border shadow-lg ${
            primary
              ? "bg-accent/8 border-accent/20"
              : "bg-white/80 border-black/6 backdrop-blur"
          } ${reverse ? "lg:order-2" : ""}`}>
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

          {/* Box 2: Více info */}
          <div className={`flex flex-col gap-6 px-8 py-10 md:px-10 md:py-12 rounded-[32px] border border-black/6 shadow-md bg-white/60 backdrop-blur ${
            reverse ? "lg:order-1" : ""
          }`}>
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
    </div>
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

      {/* Přechod */}
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
    </>
  );
}
