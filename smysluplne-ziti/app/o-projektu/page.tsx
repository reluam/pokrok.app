import { ArrowLeft, BookOpen, Lightbulb, Target, Users } from 'lucide-react'
import Link from 'next/link'

export default function AboutPage() {
  return (
    <section className="section-padding relative overflow-hidden pt-20">
        
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          {/* Back button */}
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-text-secondary hover:text-primary-600 mb-6 md:mb-8 transition-colors"
          >
            <ArrowLeft size={18} />
            <span className="text-sm md:text-base">Zpět na hlavní stránku</span>
          </Link>

          {/* Main title */}
          <div className="mb-8 md:mb-12">
            <h1 className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-text-primary mb-4 md:mb-6 leading-tight">
              O projektu <span className="gradient-text">Smyslužití</span>
            </h1>
            <h2 className="text-xl md:text-2xl lg:text-3xl font-semibold text-text-secondary">
              Moje cesta z hlavy zpátky do života
            </h2>
          </div>

          {/* Main content */}
          <div className="space-y-8 md:space-y-12">
            {/* Úvod */}
            <div>
              <p className="text-base md:text-lg lg:text-xl xl:text-2xl leading-relaxed text-text-primary font-medium">
                Věřím, že smysluplný život není za odměnu pro vyvolené. Je to možnost, kterou má v rukách každý z nás. Jenže cesta k němu občas vede přes docela temná místa.
              </p>
            </div>

            {/* Když se abstrakce stane vězením */}
            <div>
              <div className="flex items-center gap-3 mb-4 md:mb-6">
                <div className="bg-primary-100 p-2 md:p-3">
                  <Lightbulb className="text-primary-600" size={24} />
                </div>
                <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-text-primary">
                  Když se abstrakce stane vězením
                </h2>
              </div>
              <div className="text-base md:text-lg lg:text-xl leading-relaxed text-text-primary space-y-3 md:space-y-4">
                <p>
                  Už od dětství jsem měl hlavu v oblacích. Pořád jsem přemýšlel, proč tu jsme a co to všechno znamená. Postupně jsem se ale v těch úvahách začal ztrácet. Balancoval jsem na hraně mezi realitou a totální abstrakcí a upřímně – byly chvíle, kdy jsem si nebyl jistý, jestli už jsem se nezbláznil.
                </p>
                <p>
                  Moje mysl byla fascinující místo, ale čím víc jsem do ní utíkal, tím hůř jsem zvládal ten skutečný svět venku. Došlo to až do bodu, kdy jsem nebyl schopen normálně fungovat. Zachránila mě terapie. Tam mi došlo, že smysl života nenajdu v nějaké hluboké teorii ve vesmíru, ale v tom, jak si ráno uvařím kafe, jaká dělám rozhodnutí a jestli dokážu být aspoň na chvíli v klidu v přítomném okamžiku.
                </p>
                <p>
                  Pochopil jsem, že to &bdquo;moje abstraktno&ldquo; nemusí být past. Může to být kompas. Ale ty kroky musím dělat já, nohama na zemi.
                </p>
              </div>
            </div>

            {/* Od pokusů k projektu */}
            <div>
              <div className="flex items-center gap-3 mb-4 md:mb-6">
                <div className="bg-primary-100 p-2 md:p-3">
                  <Target className="text-primary-600" size={24} />
                </div>
                <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-text-primary">
                  Od pokusů k projektu
                </h2>
              </div>
              <div className="text-base md:text-lg lg:text-xl leading-relaxed text-text-primary space-y-3 md:space-y-4">
                <p>
                  Začal jsem na sobě experimentovat. Chtěl jsem vědět, co nás lidi doopravdy ovlivňuje. Zkoušel jsem minimalismus, různé diety, měnil jsem spánkové režimy a vrtal se ve filozofii. Hledal jsem, co funguje a co je jenom balast. Postupem času se všechny tyhle střípky začaly skládat do jednoho obrazu. A tak vzniklo Smyslužití.
                </p>
              </div>
            </div>

            {/* Projekt Smyslužití */}
            <div>
              <div className="flex items-center gap-3 mb-6 md:mb-8">
                <div className="bg-primary-100 p-2 md:p-3">
                  <BookOpen className="text-primary-600" size={24} />
                </div>
                <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-text-primary">
                  Projekt Smyslužití
                </h2>
              </div>
              <div className="text-base md:text-lg lg:text-xl leading-relaxed text-text-primary space-y-6 md:space-y-8">
                <p className="text-lg md:text-xl lg:text-2xl font-medium text-text-primary">
                  Smyslužití není žádný ezo-projekt se zaručeným receptem na štěstí. Je to moje upřímná snaha sdílet všechno, co jsem se naučil, abyste nemuseli bloudit tak dlouho jako já.
                </p>

                <div className="space-y-4 md:space-y-6">
                  <div>
                    <h3 className="text-xl md:text-2xl lg:text-3xl font-bold text-text-primary mb-2 md:mb-3">
                      Zastavení a otázky
                    </h3>
                    <p className="text-base md:text-lg">
                      Učím lidi se občas prostě &bdquo;vypnout&ldquo; z autopilota a zeptat se: &bdquo;Dává mi tohle smysl? Je to pro mě funkční?&ldquo; Je jedno, jestli řešíte smysl práce nebo to, že už hodinu bezmyšlenkovitě scrollujete Instagramem.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-xl md:text-2xl lg:text-3xl font-bold text-text-primary mb-2 md:mb-3">
                      Inspirace a realita
                    </h3>
                    <p className="text-base md:text-lg">
                      Sdílím tu články a výsledky svých pokusů. Žádné teorie &bdquo;z klobouku&ldquo;, ale věci, které mají hlavu a patu.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-xl md:text-2xl lg:text-3xl font-bold text-text-primary mb-2 md:mb-3">
                      Aplikace Pokrok
                    </h3>
                    <p className="text-base md:text-lg">
                      Postavil jsem ji tak, jak sám žiju. Pomáhá mi srovnat si chaos v hlavě do konkrétních cílů a návyků. Neudělá tu práci za vás, není to kouzelná hůlka, ale udrží vás na cestě, když zrovna ztratíte směr.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-xl md:text-2xl lg:text-3xl font-bold text-text-primary mb-2 md:mb-3">
                      Společná cesta
                    </h3>
                    <p className="text-base md:text-lg">
                      Pokud cítíte, že se v tom točíte sami, můžete mě <Link href="/kontakt" className="text-primary-600 hover:text-primary-700 underline font-semibold">kontaktovat</Link>. Rád se s vámi podělím o své zkušenosti a podíváme se společně na to, jak tu smysluplnost dostat do vašich všedních dnů.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Závěr */}
            <div>
              <p className="text-lg md:text-xl lg:text-2xl leading-relaxed text-text-primary font-medium text-center">
                Smysluplný život není cíl, ke kterému jednou dojdete a máte hotovo. Je to řemeslo. Je to každodenní zkoušení a občasné padání na pusu. Ale stojí to za to.
              </p>
            </div>
          </div>
        </div>
    </section>
  )
}
