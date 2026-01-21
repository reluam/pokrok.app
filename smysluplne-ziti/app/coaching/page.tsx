import { ArrowRight, Search, TrendingUp, Heart, Eye, Smile, Video, DollarSign, BookOpen } from 'lucide-react'
import CTASection from '@/components/CTASection'

export default function CoachingPage() {
  return (
    <>
      {/* Hero Section */}
      <section className="relative min-h-[70vh] flex items-center justify-center pt-20 pb-16 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src="/hero-background.jpg"
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
            style={{ zIndex: 0 }}
          />
          <div className="absolute inset-0 bg-background/60 backdrop-blur-md" style={{ zIndex: 1 }}></div>
        </div>
        
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-text-primary mb-6 leading-tight">
            Individuální průvodce na tvé <span className="gradient-text">cestě</span>
          </h1>
          <p className="text-lg md:text-xl lg:text-2xl text-text-secondary max-w-3xl mx-auto leading-relaxed mb-10">
            Společně vytvoříme bezpečný prostor pro hluboký dialog, ve kterém najdeš odvahu odložit to, co ti neslouží, a začít žít život, který ti dává smysl.
          </p>
          <a
            href="#konzultace"
            className="group inline-flex items-center justify-center gap-2 px-10 py-5 bg-primary-600 text-white font-bold text-lg rounded-full hover:bg-primary-700 transition-all duration-300 shadow-xl hover:shadow-2xl hover:scale-105"
          >
            <span>Rezervovat úvodní konzultaci zdarma</span>
            <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
          </a>
        </div>
      </section>

      {/* Jak spolupráce probíhá */}
      <section className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 bg-background">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-text-primary mb-12 md:mb-16 text-center">
            Jak spolupráce <span className="gradient-text">probíhá</span>
          </h2>
          
          <div className="space-y-8 md:space-y-12">
            {/* Krok 1 */}
            <div className="flex gap-6 md:gap-8 items-start">
              <div className="flex-shrink-0">
                <div className="w-16 h-16 md:w-20 md:h-20 bg-primary-100 rounded-full flex items-center justify-center">
                  <span className="text-primary-600 font-bold text-2xl md:text-3xl">1</span>
                </div>
              </div>
              <div className="flex-1 pt-2">
                <h3 className="text-xl md:text-2xl font-bold text-text-primary mb-3">
                  Úvodní sezení (20 min)
                </h3>
                <p className="text-lg text-text-secondary leading-relaxed">
                  Seznámíme se, ujasníme si tvá očekávání a zjistíme, jestli si lidsky sedíme. Je to nezávazné a zdarma.
                </p>
              </div>
            </div>

            {/* Krok 2 */}
            <div className="flex gap-6 md:gap-8 items-start">
              <div className="flex-shrink-0">
                <div className="w-16 h-16 md:w-20 md:h-20 bg-primary-100 rounded-full flex items-center justify-center">
                  <span className="text-primary-600 font-bold text-2xl md:text-3xl">2</span>
                </div>
              </div>
              <div className="flex-1 pt-2">
                <h3 className="text-xl md:text-2xl font-bold text-text-primary mb-3">
                  Hluboký dialog
                </h3>
                <p className="text-lg text-text-secondary leading-relaxed">
                  Na pravidelných sezeních (online nebo osobně) jdeme pod povrch. Hledáme tvůj vnitřní kompas a definujeme konkrétní kroky k realitě, kterou chceš žít.
                </p>
              </div>
            </div>

            {/* Krok 3 */}
            <div className="flex gap-6 md:gap-8 items-start">
              <div className="flex-shrink-0">
                <div className="w-16 h-16 md:w-20 md:h-20 bg-primary-100 rounded-full flex items-center justify-center">
                  <span className="text-primary-600 font-bold text-2xl md:text-3xl">3</span>
                </div>
              </div>
              <div className="flex-1 pt-2">
                <h3 className="text-xl md:text-2xl font-bold text-text-primary mb-3">
                  Podpora a nástroje
                </h3>
                <p className="text-lg text-text-secondary leading-relaxed">
                  Mezi sezeními máš mou podporu a přístup k pracovním listům a otázkám pro reflexi, které ti pomohou udržet směr.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pilíře naší práce */}
      <section className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 bg-primary-50/30">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-text-primary mb-12 md:mb-16 text-center">
            Pilíře naší <span className="gradient-text">práce</span>
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            <div className="bg-white rounded-lg border-2 border-primary-100 p-6 md:p-8 hover:border-primary-300 transition-all duration-300">
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
                <Search className="text-primary-600" size={24} />
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-text-primary mb-3">
                Zvídavost
              </h3>
              <p className="text-text-secondary leading-relaxed">
                Ptám se tam, kam se jiní neodváží podívat.
              </p>
            </div>

            <div className="bg-white rounded-lg border-2 border-primary-100 p-6 md:p-8 hover:border-primary-300 transition-all duration-300">
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
                <TrendingUp className="text-primary-600" size={24} />
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-text-primary mb-3">
                Růst
              </h3>
              <p className="text-text-secondary leading-relaxed">
                Každé sezení tě posouvá blíž k tvé autentické verzi.
              </p>
            </div>

            <div className="bg-white rounded-lg border-2 border-primary-100 p-6 md:p-8 hover:border-primary-300 transition-all duration-300">
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
                <Heart className="text-primary-600" size={24} />
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-text-primary mb-3">
                Otevřenost
              </h3>
              <p className="text-text-secondary leading-relaxed">
                Vytvářím prostor bez hodnocení, kde můžeš být kýmkoliv.
              </p>
            </div>

            <div className="bg-white rounded-lg border-2 border-primary-100 p-6 md:p-8 hover:border-primary-300 transition-all duration-300">
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
                <Eye className="text-primary-600" size={24} />
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-text-primary mb-3">
                Upřímnost
              </h3>
              <p className="text-text-secondary leading-relaxed">
                Jsem tvým zrcadlem, i když pravda nemusí být vždy pohodlná.
              </p>
            </div>

            <div className="bg-white rounded-lg border-2 border-primary-100 p-6 md:p-8 hover:border-primary-300 transition-all duration-300 md:col-span-2 lg:col-span-1">
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
                <Smile className="text-primary-600" size={24} />
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-text-primary mb-3">
                Radost
              </h3>
              <p className="text-text-secondary leading-relaxed">
                Cesta ke smyslu by neměla být jen dřina, ale i objevování radosti z bytí.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Praktické informace */}
      <section className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 bg-background">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-text-primary mb-12 md:mb-16 text-center">
            Praktické <span className="gradient-text">informace</span>
          </h2>
          
          <div className="bg-white rounded-lg border-2 border-primary-100 p-8 md:p-12 shadow-lg space-y-8">
            <div className="flex gap-6 items-start">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                  <Video className="text-primary-600" size={24} />
                </div>
              </div>
              <div>
                <h3 className="text-xl md:text-2xl font-bold text-text-primary mb-2">
                  Formát
                </h3>
                <p className="text-lg text-text-secondary leading-relaxed">
                  Online (Google Meet/Zoom) nebo osobně (podle domluvy).
                </p>
              </div>
            </div>

            <div className="flex gap-6 items-start">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="text-primary-600" size={24} />
                </div>
              </div>
              <div>
                <h3 className="text-xl md:text-2xl font-bold text-text-primary mb-2">
                  Cena
                </h3>
                <p className="text-lg text-text-secondary leading-relaxed">
                  Konkrétní plán a nacenění nastavíme po úvodní konzultaci.
                </p>
              </div>
            </div>

            <div className="flex gap-6 items-start">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                  <BookOpen className="text-primary-600" size={24} />
                </div>
              </div>
              <div>
                <h3 className="text-xl md:text-2xl font-bold text-text-primary mb-2">
                  Bonus
                </h3>
                <p className="text-lg text-text-secondary leading-relaxed">
                  Jako klient získáváš exkluzivní přístup do digitální Knihovny nástrojů a otázek pro smysluplný život.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <CTASection />
    </>
  )
}
