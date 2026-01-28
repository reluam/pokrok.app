import DecorativeShapes from "./DecorativeShapes";
import Link from "next/link";

export default function Coffee() {
  return (
    <section className="relative py-16 md:py-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
      <DecorativeShapes position="right" />
      <div className="max-w-6xl mx-auto space-y-12 relative z-10">
        <div className="text-center">
          <h2 className="text-3xl md:text-4xl lg:text-5xl text-foreground mb-4" style={{ fontWeight: 600 }}>
            <span className="hand-drawn-underline">Dáme kávu?</span>
          </h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Cesta A: Potkejme se u kafe */}
          <div className="bg-white/50 rounded-2xl p-8 md:p-10 border-2 border-black/5 hover:border-accent/30 transition-all transform hover:-translate-y-1">
            <h3 className="text-2xl md:text-3xl text-foreground mb-4" style={{ fontWeight: 600 }}>
              Potkejme se u kafe
            </h3>
            <p className="text-lg text-foreground/80 leading-relaxed mb-6">
              Pokud si chceš jen popovídat o tom, co píšu na blogu, sdílet svůj příběh nebo tě zajímá, jak nad věcmi přemýšlím, ozvi se. Rád poznávám lidi, co nechtějí jen přežívat na autopilota. Prostě káva, žádná agenda.
            </p>
            <a
              href="https://www.skool.com/@matej-mauler-3777?g=ziju-life-9405"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-playful inline-block px-8 py-4 bg-accent text-white rounded-full text-lg font-semibold hover:bg-accent-hover transition-colors shadow-lg hover:shadow-xl"
            >
              Chci jen tak pokecat →
            </a>
          </div>

          {/* Cesta B: Pojďme do hloubky (Koučink) */}
          <div className="bg-white/50 rounded-2xl p-8 md:p-10 border-2 border-black/5 hover:border-accent/30 transition-all transform hover:-translate-y-1">
            <h3 className="text-2xl md:text-3xl text-foreground mb-4" style={{ fontWeight: 600 }}>
              Pojďme do hloubky (Koučink)
            </h3>
            <p className="text-lg text-foreground/80 leading-relaxed mb-6">
              Pokud cítíš, že ses v něčem zasekl/a a potřebuješ pomoct najít vlastní cestu ven, můžeme se do toho opřít společně. Tady už nejde o nezávazné povídání – budeme se soustředit na to, kde to v tvém životě zrovna drhne a kudy se chceš vydat dál. Aktuálně to dělám zdarma výměnou za tvůj upřímný feedback.
            </p>
            <Link
              href="/koucing"
              className="btn-playful inline-block px-8 py-4 bg-white border-2 border-accent text-accent rounded-full text-lg font-semibold hover:bg-accent/5 transition-colors shadow-lg hover:shadow-xl"
            >
              Chci jít víc do hloubky →
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
