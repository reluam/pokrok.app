import Link from 'next/link'
import { ArrowRight, Users, MessageCircle, BookOpen, Sparkles, HeartHandshake } from 'lucide-react'

const SKOOL_URL = 'https://www.skool.com/smysluziti-9755'

export default function KomunitaPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative py-20 md:py-28 px-4 sm:px-6 lg:px-8 bg-background overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-50 via-background to-playful-yellow-light/30" />
        <div className="relative max-w-4xl mx-auto text-center">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-primary-100 rounded-lg flex items-center justify-center">
              <Users className="text-primary-600" size={32} />
            </div>
          </div>

          <h1 className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-text-primary leading-tight mb-6">
            Movement lidí, kteří chtějí víc než jen <span className="gradient-text">přežívat</span>.
          </h1>
          <p className="text-lg md:text-xl lg:text-2xl text-text-secondary leading-relaxed max-w-3xl mx-auto">
            Komunita Smyslužití je místo, kde se teorie potkává s praxí a individuální cesta se spojuje se silou skupiny.
            Je to bezpečný prostor pro všechny, kteří hledají svůj vnitřní kompas.
          </p>
        </div>
      </section>

      {/* Co v komunitě najdeš */}
      <section className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 bg-background">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-text-primary mb-12 md:mb-16 text-center">
            Co v komunitě <span className="gradient-text">najdeš</span>?
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            <div className="bg-white rounded-lg border-2 border-primary-100 p-6 md:p-8 shadow-sm">
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
                <HeartHandshake className="text-primary-600" size={24} />
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-text-primary mb-3">Podpora a sdílení</h3>
              <p className="text-text-secondary leading-relaxed">
                Prostor pro tvé otázky a aha-momenty mezi lidmi na stejné vlně.
              </p>
            </div>

            <div className="bg-white rounded-lg border-2 border-primary-100 p-6 md:p-8 shadow-sm">
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
                <BookOpen className="text-primary-600" size={24} />
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-text-primary mb-3">Materiály &amp; Frameworky</h3>
              <p className="text-text-secondary leading-relaxed">
                Praktické listy a cvičení, které ti pomohou s reflexí.
              </p>
            </div>

            <div className="bg-white rounded-lg border-2 border-primary-100 p-6 md:p-8 shadow-sm">
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
                <Sparkles className="text-primary-600" size={24} />
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-text-primary mb-3">Společné výzvy</h3>
              <p className="text-text-secondary leading-relaxed">
                Akce, které nás společně posouvají z komfortní zóny do akce.
              </p>
            </div>

            <div className="bg-white rounded-lg border-2 border-primary-100 p-6 md:p-8 shadow-sm">
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
                <MessageCircle className="text-primary-600" size={24} />
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-text-primary mb-3">Přímý dialog</h3>
              <p className="text-text-secondary leading-relaxed">
                Možnost ptát se na to, co tě zrovna pálí, a získat jiný úhel pohledu.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 bg-primary-50/30">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-white rounded-lg border-2 border-primary-100 p-8 md:p-12 shadow-lg">
            <p className="text-2xl md:text-3xl font-bold text-text-primary mb-8 leading-tight">
              Tvoje místo u stolu je připravené. Přidej se k nám.
            </p>

            <a
              href={SKOOL_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-10 py-5 bg-primary-600 text-white font-bold text-lg rounded-full hover:bg-primary-700 transition-all shadow-xl hover:shadow-2xl"
            >
              <span>Vstoupit do komunity na Skoolu</span>
              <ArrowRight size={20} />
            </a>

            <div className="mt-6 text-sm text-text-secondary">
              <span>Raději zpátky na </span>
              <Link href="/" className="underline hover:no-underline">
                hlavní stránku
              </Link>
              <span>?</span>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}

