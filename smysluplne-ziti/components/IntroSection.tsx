'use client'

import Image from 'next/image'
import Link from 'next/link'
import { BookOpen, Smartphone, Target, FileText } from 'lucide-react'

export default function IntroSection() {
  return (
    <section className="relative min-h-[90vh] flex items-center overflow-hidden pt-20">
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 py-12 md:py-16 lg:py-20">
        <div className="max-w-6xl mx-auto">
          {/* Velký nadpis */}
          <div className="text-center mb-8 md:mb-12 lg:mb-16 animate-fade-in-up">
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold text-text-primary mb-4 md:mb-6 leading-tight">
              Vítej na <Link href="/o-projektu" className="gradient-text hover:opacity-80 transition-opacity">Smyslužití</Link>
            </h1>
          </div>

          {/* Main content */}
          <div className="space-y-8 md:space-y-10 lg:space-y-12 animate-fade-in-up animation-delay-2000">
            <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 xl:gap-16 items-center">
              {/* Fotka */}
              <div className="flex-shrink-0 order-2 lg:order-1">
                <div className="relative w-40 h-40 sm:w-48 sm:h-48 md:w-56 md:h-56 rounded-full overflow-hidden border-4 border-primary-200 shadow-xl">
                  <Image
                    src="/matej-foto.jpg"
                    alt="Matěj"
                    width={224}
                    height={224}
                    className="object-cover w-full h-full"
                    priority
                  />
                </div>
              </div>
              
              {/* Text */}
              <div className="flex-1 text-text-primary order-1 lg:order-2">
                <div className="text-base md:text-lg lg:text-xl xl:text-2xl leading-relaxed space-y-4 md:space-y-6">
                  <p className="font-medium text-xl md:text-2xl lg:text-3xl text-text-primary">
                    Ahoj, já jsem <span className="text-primary-600 font-bold">Matěj</span>
                  </p>
                  <p className="text-base md:text-lg lg:text-xl">
                    <Link href="/o-projektu" className="text-primary-600 hover:text-primary-700 underline font-semibold decoration-2 underline-offset-2 transition-colors">Smyslužití</Link> jsem založil proto, abych lidem pomohl vytvořit a žít více smysluplný život a abych co nejvíce smysluplný život mohl žít sám.
                  </p>
                  <p className="text-base md:text-lg lg:text-xl">
                    Na Smyslužití najdeš <Link href="/clanky" className="text-primary-600 hover:text-primary-700 underline font-semibold decoration-2 underline-offset-2 transition-colors">články</Link>, kde sdílím své poznatky, experimenty a zkušenosti o smysluplném žití. Najdeš tam také <Link href="/clanky" className="text-primary-600 hover:text-primary-700 underline font-semibold decoration-2 underline-offset-2 transition-colors">inspiraci</Link> ve formě knih, videí a doporučení a <Link href="#aplikace" className="text-primary-600 hover:text-primary-700 underline font-semibold decoration-2 underline-offset-2 transition-colors">aplikaci Pokrok</Link>, kde můžeš snadno plánovat a dosahovat (nejen) smysluplných cílů.
                  </p>
                  <p className="text-base md:text-lg lg:text-xl">
                    Pokud chceš jít trochu více do hloubky, můžeme se spolu potkat na <Link href="/coaching" className="text-primary-600 hover:text-primary-700 underline font-semibold decoration-2 underline-offset-2 transition-colors">koučovacím sezení</Link>, kde probereme, jak můžeš smysluplnost více zakomponovat do tvé konkrétní situace.
                  </p>
                  <p className="text-base md:text-lg lg:text-xl">
                    Pokud tě zajímá cokoliv jiného, neváhej mě <Link href="/kontakt" className="text-primary-600 hover:text-primary-700 underline font-semibold decoration-2 underline-offset-2 transition-colors">kontaktovat</Link>. Přeji smysluplnou cestu životem! ✨
                  </p>
                </div>
              </div>
            </div>

            {/* Tlačítka dole */}
            <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center items-center pt-6 md:pt-8">
              <Link
                href="#coaching"
                className="group flex items-center justify-center gap-2 md:gap-3 px-6 md:px-8 py-3 md:py-4 rounded-full bg-primary-600 text-white font-semibold text-base md:text-lg hover:bg-primary-700 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 transform w-full sm:w-auto min-w-[160px] md:min-w-[180px]"
              >
                <Target size={20} />
                Koučing
              </Link>
              <Link
                href="/clanky"
                className="group flex items-center justify-center gap-2 md:gap-3 px-6 md:px-8 py-3 md:py-4 rounded-full bg-primary-600 text-white font-semibold text-base md:text-lg hover:bg-primary-700 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 transform w-full sm:w-auto min-w-[160px] md:min-w-[180px]"
              >
                <FileText size={20} />
                Blog a inspirace
              </Link>
              <Link
                href="#aplikace"
                className="group flex items-center justify-center gap-2 md:gap-3 px-6 md:px-8 py-3 md:py-4 rounded-full bg-primary-600 text-white font-semibold text-base md:text-lg hover:bg-primary-700 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 transform w-full sm:w-auto min-w-[160px] md:min-w-[180px]"
              >
                <Smartphone size={20} />
                Aplikace Pokrok
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
