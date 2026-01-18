import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight } from 'lucide-react'

export default function AboutMeSection() {
  return (
    <section className="py-16 md:py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-text-primary mb-8 md:mb-12 text-center animate-fade-in-up font-serif">
          Z hlavy zpátky do reality. Jsem Matěj.
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16 items-center">
          <div className="relative aspect-square max-w-md mx-auto md:mx-0">
            <div className="relative w-full h-full rounded-lg overflow-hidden">
              <Image
                src="/matej-foto.png"
                alt="Matěj"
                fill
                className="object-cover"
              />
            </div>
          </div>
          <div>
            <div className="prose prose-lg max-w-none text-text-secondary leading-relaxed space-y-6 mb-8">
              <p className="text-lg md:text-xl">
                Jsem tvůj průvodce na cestě za smysluplnějším životem. Smyslužití jsem založil proto, že chci pomáhat lidem žít více vědomý, smysluplný a prožitý život. Od mala jsem sám hodně bloudil a zkoumal, o čem život je. Protože jsem už na pár věcí přišel, rád je nasdílím s ostatními.
              </p>
            </div>
            <Link
              href="/o-projektu"
              className="group inline-flex items-center gap-2 px-6 py-3 border-2 border-primary-600 text-primary-600 font-semibold rounded-full hover:bg-primary-600 hover:text-white transition-all duration-300"
            >
              <span>Přečíst si celý příběh</span>
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
