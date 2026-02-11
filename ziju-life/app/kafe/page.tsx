export const dynamic = "force-static";

export default function KafePage() {
  return (
    <main className="min-h-screen py-16 md:py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-12">
        <div className="text-center space-y-6">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground">
            Dáme kafe?
          </h1>
          <p className="text-lg md:text-xl text-foreground/80 leading-relaxed max-w-2xl mx-auto">
            Žádný coaching. Žádná faktura. Jenom dva lidi, co si povídají o životě.
          </p>
        </div>
        
        <div className="bg-white rounded-2xl p-8 md:p-12 border border-black/5 space-y-8">
          <div className="space-y-4">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">
              Pro koho je to?
            </h2>
            <p className="text-lg text-foreground/80 leading-relaxed">
              Máš pocit, že se v tom životě trochu motáš? Chceš probrat svoje experimenty nebo jen slyšet jiný úhel pohledu? Možná řešíš změnu kariéry, hledáš vlastní směr, nebo prostě potřebuješ s někým mluvit o tom, co tě trápí nebo na čem pracuješ.
            </p>
          </div>
          
          <div className="space-y-4">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">
              Jak to funguje?
            </h2>
            <p className="text-lg text-foreground/80 leading-relaxed">
              Pojďme se potkat u kafe v Praze nebo online přes video hovor. Nemusíš se připravovat, nemusíš mít připravené otázky. Prostě si povídáme. Sdílím svoje zkušenosti, ty sdílíš svoje. Někdy to pomůže, někdy ne. Ale vždycky to bude upřímné.
            </p>
          </div>
          
          <div className="space-y-4">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">
              Kolik to stojí?
            </h2>
            <p className="text-lg text-foreground/80 leading-relaxed">
              Nic. Opravdu. Pokud se potkáme v Praze, zaplatím kafe. Pokud online, tak online. Žádná faktura, žádná formálnost. Jestli ti to pomůže, můžeš mi pak napsat, že to stálo za to. To je všechno.
            </p>
          </div>
          
          <div className="pt-8 border-t border-black/10">
            <a
              href="mailto:ahoj@ziju.life"
              className="inline-block px-8 py-4 bg-accent text-white rounded-full text-lg font-semibold hover:bg-accent-hover transition-colors w-full sm:w-auto text-center"
            >
              Napiš mi a dáme termín
            </a>
            <p className="text-sm text-foreground/60 mt-4">
              Nebo mi napiš na <a href="mailto:ahoj@ziju.life" className="text-accent hover:underline">ahoj@ziju.life</a>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
