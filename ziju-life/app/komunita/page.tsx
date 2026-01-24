import DecorativeShapes from "@/components/DecorativeShapes";

interface Feature {
  title: string;
  description: string;
}

const whatAwaits: Feature[] = [
  {
    title: "Inspirace",
    description: "Tipy na knihy, videa a experimenty, které nás nějakým způsobem inspirovaly. Jedno za čas budu sdílet i své myšlenky k různým tématům.",
  },
  {
    title: "Nové úhly pohledu",
    description: "Prostor, kde si můžeš napsat pro nový úhel pohledu, nebo svůj úhel pohledu poskytnout dalším členům.",
  },
  {
    title: "Principy a frameworky",
    description: "Principy, které se osvědčily časem.",
  },
  {
    title: "Společné výzvy",
    description: "Ve společných výzvách se můžeš přidat k lidem, kteří chtějí růst a chtějí se v tom vzájemně podpořit.",
  },
];

const whyJoin: Feature[] = [
  {
    title: "Nadhled",
    description: "Protože když se zasmějeme tomu, jak nám něco nevyšlo, přestane to být katastrofa a stane se z toho příběh.",
  },
  {
    title: "Inspirace, ne tlak",
    description: "Nečekej žádné motivační citáty. Spíš praktické ukázky toho, jak se dá se světem interagovat a nezbláznit se z toho.",
  },
  {
    title: "Skutečná Agency",
    description: "Učíme se společně brát otěže svého života zpět do rukou. Kousek po kousku.",
  },
];

export default function KomunitaPage() {
  return (
    <main className="min-h-screen">
      {/* Hero Sekce */}
      <section className="relative py-16 md:py-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <DecorativeShapes variant="hero" />
        <div className="max-w-4xl mx-auto relative z-10 text-center space-y-8 md:space-y-12">
          <h1 className="text-3xl md:text-4xl lg:text-5xl text-foreground">
            <span className="hand-drawn-underline">Přestaň to šlapat sólo</span>
          </h1>
          
          <h2 className="text-2xl md:text-3xl lg:text-4xl text-foreground" style={{ fontWeight: 600 }}>
            Komunita pro ty, co nechtějí žít na autopilota.
          </h2>
          
          <p className="text-lg md:text-xl text-foreground/80 leading-relaxed max-w-3xl mx-auto">
            Tuhle komunitu jsem založil jako prostor, kde se můžeme potkat, sdílet svoje zkušenosti, načerpat inspiraci a podpořit se v životních výzvách.
          </p>
        </div>
      </section>

      {/* Sekce: Co tě tam čeká? */}
      <section className="relative py-16 md:py-24 px-4 sm:px-6 lg:px-8 bg-white/50 paper-texture overflow-hidden">
        <DecorativeShapes position="left" />
        <div className="max-w-6xl mx-auto relative z-10">
          <h2 className="text-3xl md:text-4xl lg:text-5xl text-foreground mb-12 text-center" style={{ fontWeight: 600 }}>
            <span className="hand-drawn-underline">Co tě tam čeká?</span>
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {whatAwaits.map((feature, index) => (
              <div
                key={index}
                className="bg-white/50 rounded-2xl p-6 md:p-8 border-2 border-black/5 hover:border-accent/30 transition-all hover:shadow-xl hover:-translate-y-1 transform"
                style={{ transform: `rotate(${index % 2 === 0 ? '-0.5deg' : '0.5deg'})` }}
              >
                <h3 className="text-xl md:text-2xl text-foreground mb-4" style={{ fontWeight: 600 }}>
                  <span className="text-accent font-bold">{feature.title}</span>
                </h3>
                <p className="text-foreground/80 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Sekce: Proč se vlastně přidat? */}
      <section className="relative py-16 md:py-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <DecorativeShapes position="right" />
        <div className="max-w-6xl mx-auto relative z-10">
          <h2 className="text-3xl md:text-4xl lg:text-5xl text-foreground mb-12 text-center" style={{ fontWeight: 600 }}>
            <span className="hand-drawn-underline">Proč se vlastně přidat?</span>
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {whyJoin.map((feature, index) => (
              <div
                key={index}
                className="bg-white/50 rounded-2xl p-6 md:p-8 border-2 border-black/5 hover:border-accent/30 transition-all hover:shadow-xl hover:-translate-y-1 transform"
                style={{ transform: `rotate(${index % 2 === 0 ? '-0.5deg' : '0.5deg'})` }}
              >
                <h3 className="text-xl md:text-2xl text-foreground mb-4" style={{ fontWeight: 600 }}>
                  <span className="text-accent font-bold">{feature.title}</span>
                </h3>
                <p className="text-foreground/80 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Sekce */}
      <section className="relative py-16 md:py-24 px-4 sm:px-6 lg:px-8 bg-white/50 paper-texture overflow-hidden">
        <div className="max-w-4xl mx-auto text-center space-y-8 relative z-10">
          <h2 className="text-3xl md:text-4xl lg:text-5xl text-foreground" style={{ fontWeight: 400 }}>
            <span className="hand-drawn-underline">Je to free a je to tvoje</span>
          </h2>
          
          <p className="text-lg md:text-xl text-foreground/80 leading-relaxed max-w-2xl mx-auto">
            Žádné marketingové háčky, žádné skryté poplatky. Jen banda lidí, co si chce ten život trochu víc užít.
          </p>
          
          <a
            href="https://www.skool.com/ziju-life-9405"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-playful inline-block px-8 py-4 bg-accent text-white rounded-full text-xl font-bold hover:bg-accent-hover transition-colors shadow-lg hover:shadow-xl"
          >
            Vstoupit do laboratoře (Skool)
          </a>
        </div>
      </section>
    </main>
  );
}
