import { ArrowLeft, BookOpen, Lightbulb, Target, Users } from 'lucide-react'
import Link from 'next/link'

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      <section className="section-padding bg-gradient-to-br from-primary-50 via-background to-playful-yellow-light/30 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-10 right-20 w-80 h-80 bg-playful-purple-light rounded-full mix-blend-multiply filter blur-3xl opacity-25"></div>
        <div className="absolute bottom-10 left-20 w-80 h-80 bg-playful-pink-light rounded-full mix-blend-multiply filter blur-3xl opacity-25"></div>
        
        <div className="max-w-4xl mx-auto container-padding relative">
          {/* Back button */}
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-text-secondary hover:text-primary-600 mb-8 transition-colors"
          >
            <ArrowLeft size={20} />
            <span>Zpět na hlavní stránku</span>
          </Link>

          {/* Main title */}
          <div className="mb-12">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-text-primary mb-6 leading-tight">
              O projektu <span className="gradient-text">Smyslužití</span>
            </h1>
            <h2 className="text-2xl md:text-3xl font-semibold text-text-secondary">
              Moje cesta z hlavy zpátky do života
            </h2>
          </div>

          {/* Main content */}
          <div className="space-y-12">
            {/* Úvod */}
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-8 md:p-12 border border-primary-100">
              <p className="text-xl md:text-2xl leading-relaxed text-text-primary font-medium">
                Věřím, že smysluplný život není za odměnu pro vyvolené. Je to možnost, kterou má v rukách každý z nás. Jenže cesta k němu občas vede přes docela temná místa.
              </p>
            </div>

            {/* Když se abstrakce stane vězením */}
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-8 md:p-12 border border-primary-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-primary-100 p-3 rounded-xl">
                  <Lightbulb className="text-primary-600" size={28} />
                </div>
                <h2 className="text-3xl md:text-4xl font-bold text-text-primary">
                  Když se abstrakce stane vězením
                </h2>
              </div>
              <div className="text-lg md:text-xl leading-relaxed text-text-primary space-y-4">
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
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-8 md:p-12 border border-primary-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-primary-100 p-3 rounded-xl">
                  <Target className="text-primary-600" size={28} />
                </div>
                <h2 className="text-3xl md:text-4xl font-bold text-text-primary">
                  Od pokusů k projektu
                </h2>
              </div>
              <div className="text-lg md:text-xl leading-relaxed text-text-primary space-y-4">
                <p>
                  Začal jsem na sobě experimentovat. Chtěl jsem vědět, co nás lidi doopravdy ovlivňuje. Zkoušel jsem minimalismus, různé diety, měnil jsem spánkové režimy a vrtal se ve filozofii. Hledal jsem, co funguje a co je jenom balast. Postupem času se všechny tyhle střípky začaly skládat do jednoho obrazu. A tak vzniklo Smyslužití.
                </p>
              </div>
            </div>

            {/* Co se tady vlastně děje? */}
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-8 md:p-12 border border-primary-100">
              <div className="flex items-center gap-3 mb-8">
                <div className="bg-primary-100 p-3 rounded-xl">
                  <BookOpen className="text-primary-600" size={28} />
                </div>
                <h2 className="text-3xl md:text-4xl font-bold text-text-primary">
                  Co se tady vlastně děje?
                </h2>
              </div>
              <div className="text-lg md:text-xl leading-relaxed text-text-primary space-y-8">
                <p className="text-xl md:text-2xl font-medium text-text-primary">
                  Smyslužití není žádný ezo-projekt se zaručeným receptem na štěstí. Je to moje upřímná snaha sdílet všechno, co jsem se naučil, abyste nemuseli bloudit tak dlouho jako já.
                </p>

                <div className="space-y-6">
                  <div>
                    <h3 className="text-2xl md:text-3xl font-bold text-text-primary mb-3">
                      Zastavení a otázky
                    </h3>
                    <p>
                      Učím lidi se občas prostě &bdquo;vypnout&ldquo; z autopilota a zeptat se: &bdquo;Dává mi tohle smysl? Je to pro mě funkční?&ldquo; Je jedno, jestli řešíte smysl práce nebo to, že už hodinu bezmyšlenkovitě scrollujete Instagramem.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-2xl md:text-3xl font-bold text-text-primary mb-3">
                      Inspirace a realita
                    </h3>
                    <p>
                      Sdílím tu články a výsledky svých pokusů. Žádné teorie &bdquo;z klobouku&ldquo;, ale věci, které mají hlavu a patu.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-2xl md:text-3xl font-bold text-text-primary mb-3">
                      Aplikace Pokrok
                    </h3>
                    <p>
                      Postavil jsem ji tak, jak sám žiju. Pomáhá mi srovnat si chaos v hlavě do konkrétních cílů a návyků. Neudělá tu práci za vás, není to kouzelná hůlka, ale udrží vás na cestě, když zrovna ztratíte směr.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-2xl md:text-3xl font-bold text-text-primary mb-3">
                      Společná cesta
                    </h3>
                    <p>
                      Pokud cítíte, že se v tom točíte sami, můžeme se potkat u <Link href="/coaching" className="text-primary-600 hover:text-primary-700 underline font-semibold">coachingu</Link>. Nebudu vás poučovat, ale podíváme se společně na to, jak tu smysluplnost dostat do vašich všedních dnů.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Závěr */}
            <div className="bg-gradient-to-br from-primary-50 to-primary-100/50 rounded-3xl shadow-xl p-8 md:p-12 border border-primary-200">
              <p className="text-xl md:text-2xl leading-relaxed text-text-primary font-medium text-center">
                Smysluplný život není cíl, ke kterému jednou dojdete a máte hotovo. Je to řemeslo. Je to každodenní zkoušení a občasné padání na pusu. Ale stojí to za to.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
