import Link from 'next/link'
import { Search, TrendingUp, Heart, Eye, Smile, ArrowRight } from 'lucide-react'

export default function AboutPage() {
  return (
    <section className="py-20 md:py-32 px-4 sm:px-6 lg:px-8 bg-background">
      <div className="max-w-4xl mx-auto">
        {/* Nadpis */}
        <header className="mb-12 md:mb-16 text-center">
          <h1 className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-text-primary leading-tight">
            Od očekávání světa k <span className="gradient-text">vlastnímu smyslu</span>.
          </h1>
        </header>

        <div className="space-y-14 md:space-y-20">
          {/* Můj příběh */}
          <section>
            <h2 className="text-2xl md:text-3xl font-bold text-text-primary mb-6">
              Můj příběh
            </h2>
            <div className="space-y-5 text-base md:text-lg lg:text-xl leading-relaxed text-text-primary">
              <p>
                Třicet let jsem hrál roli, kterou pro mě napsal někdo jiný. V různých manažerských rolích jsem dělal přesně to, co se ode mě očekávalo – využíval jsem své talenty k tomu, abych byl výkonnou součástí kolečka. Navenek to vypadalo v pořádku, ale uvnitř jsem cítil prázdnotu.
              </p>
              <p>
                Největší cenou za tento život na autopilota byl pocit, že je můj život k ničemu. Že by bylo úplně jedno, jestli tady jsem, nebo nejsem. Ve třiceti letech jsem si řekl: Dost. Jednu třetinu života jsem prožil podle pravidel, která mě neudělala šťastným. Rozhodl jsem se z toho kolečka vystoupit a začít žít život, který dává smysl mě.
              </p>
            </div>
          </section>

          {/* Co jsem ztratil a co získal */}
          <section>
            <h2 className="text-2xl md:text-3xl font-bold text-text-primary mb-6">
              Co jsem ztratil a co získal
            </h2>
            <div className="space-y-6 text-base md:text-lg lg:text-xl leading-relaxed text-text-primary">
              <p>
                Změna nebyla zadarmo. Ztratil jsem uznání některých známých a jistotu, které to soukolí poskytuje. Ale to, co jsem získal, to mnohonásobně převyšuje:
              </p>
              <ul className="space-y-4 pl-5 list-disc text-text-primary">
                <li>
                  <strong>Skutečné vztahy:</strong> Uznání od rodiny a lidí, kteří jsou mi nejbližší.
                </li>
                <li>
                  <strong>Odpuštění selhání:</strong> Přestal jsem se bát chyb. Dnes je beru jako součást cesty, protože vím, kam jdu a proč tam chci jít.
                </li>
                <li>
                  <strong>Chuť tvořit:</strong> Každé ráno se budím s obrovskou motivací budovat něco, co má přesah.
                </li>
              </ul>
              <p>
                Dnes pro mě život není povinnost, kterou musím vydržet, ale příležitost, kterou chci tvořit.
              </p>
            </div>
          </section>

          {/* Mých 5 pilířů */}
          <section>
            <h2 className="text-2xl md:text-3xl font-bold text-text-primary mb-6">
              Mých 5 pilířů <span className="text-text-secondary">(Kompas pro mou cestu)</span>
            </h2>
            <div className="space-y-6 text-base md:text-lg lg:text-xl leading-relaxed text-text-primary">
              <p>
                Při své práci (v koučinku i v komunitě) se opírám o pět hodnot, které mě osobně vrátily zpět k sobě. Jsou to pilíře, které podporují život podle sebe, ne podle ostatních:
              </p>
            </div>

            <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg border-2 border-primary-100 p-6 md:p-8">
                <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
                  <Search className="text-primary-600" size={24} />
                </div>
                <h3 className="text-xl md:text-2xl font-bold text-text-primary mb-2">Zvídavost</h3>
                <p className="text-text-secondary leading-relaxed">
                  Schopnost ptát se &bdquo;proč&ldquo;, i když jsou odpovědi nepohodlné.
                </p>
              </div>

              <div className="bg-white rounded-lg border-2 border-primary-100 p-6 md:p-8">
                <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
                  <TrendingUp className="text-primary-600" size={24} />
                </div>
                <h3 className="text-xl md:text-2xl font-bold text-text-primary mb-2">Růst</h3>
                <p className="text-text-secondary leading-relaxed">
                  Odvaha nezůstat stát na místě.
                </p>
              </div>

              <div className="bg-white rounded-lg border-2 border-primary-100 p-6 md:p-8">
                <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
                  <Heart className="text-primary-600" size={24} />
                </div>
                <h3 className="text-xl md:text-2xl font-bold text-text-primary mb-2">Otevřenost</h3>
                <p className="text-text-secondary leading-relaxed">
                  Přijímání nových cest a možností.
                </p>
              </div>

              <div className="bg-white rounded-lg border-2 border-primary-100 p-6 md:p-8">
                <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
                  <Eye className="text-primary-600" size={24} />
                </div>
                <h3 className="text-xl md:text-2xl font-bold text-text-primary mb-2">Upřímnost</h3>
                <p className="text-text-secondary leading-relaxed">
                  Konec lhaní si do vlastní kapsy.
                </p>
              </div>

              <div className="bg-white rounded-lg border-2 border-primary-100 p-6 md:p-8 md:col-span-2">
                <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
                  <Smile className="text-primary-600" size={24} />
                </div>
                <h3 className="text-xl md:text-2xl font-bold text-text-primary mb-2">Radost</h3>
                <p className="text-text-secondary leading-relaxed">
                  Protože smysluplný život má chutnat dobře.
                </p>
              </div>
            </div>

            <p className="mt-8 text-base md:text-lg lg:text-xl leading-relaxed text-text-primary">
              Tyto hodnoty nejsou univerzální pravdou pro každého, ale jsou to brýle, skrze které se dívám na svět já – a se kterými budu přistupovat i k našemu společnému dialogu.
            </p>
          </section>

          {/* Závěrečné CTA */}
          <section className="bg-primary-50/30 rounded-lg border-2 border-primary-100 p-8 md:p-12 text-center">
            <p className="text-xl md:text-2xl font-semibold text-text-primary mb-8 leading-relaxed">
              Můj příběh se stále píše. Pojďme začít psát ten tvůj.
            </p>
            <Link
              href="/coaching#konzultace"
              className="inline-flex items-center gap-2 px-10 py-5 bg-primary-600 text-white font-bold text-lg rounded-full hover:bg-primary-700 transition-all shadow-xl hover:shadow-2xl"
            >
              <span>Zarezervovat úvodní konzultaci</span>
              <ArrowRight size={20} />
            </Link>
          </section>
        </div>
      </div>
    </section>
  )
}

