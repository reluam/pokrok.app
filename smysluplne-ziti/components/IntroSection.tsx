'use client'

import Image from 'next/image'
import Link from 'next/link'
import { BookOpen, Smartphone } from 'lucide-react'

export default function IntroSection() {
  return (
    <section className="relative min-h-[90vh] flex items-center overflow-hidden bg-gradient-to-br from-primary-50 via-background via-60% to-playful-yellow-light/30 pt-20">
      {/* Animated background blobs */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-playful-pink-light rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob"></div>
      <div className="absolute top-40 right-10 w-72 h-72 bg-playful-yellow-light rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000"></div>
      <div className="absolute -bottom-8 left-1/2 w-72 h-72 bg-playful-purple-light rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-4000"></div>
      
      <div className="max-w-7xl mx-auto container-padding relative z-10 py-20">
        <div className="max-w-6xl mx-auto">
          {/* Velký nadpis */}
          <div className="text-center mb-16 animate-fade-in-up">
            <h1 className="text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold text-text-primary mb-6 leading-tight">
              Vítej na <Link href="/o-projektu" className="gradient-text hover:opacity-80 transition-opacity">Smyslužití</Link>
            </h1>
          </div>

          {/* Main content card */}
          <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-2xl p-8 md:p-12 lg:p-16 border border-primary-100/50 animate-fade-in-up animation-delay-2000">
            <div className="flex flex-col lg:flex-row gap-10 lg:gap-16 items-center mb-10">
              {/* Fotka */}
              <div className="flex-shrink-0 order-2 lg:order-1">
                <div className="relative w-48 h-48 md:w-56 md:h-56 rounded-full overflow-hidden border-4 border-primary-200 shadow-xl">
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
                <div className="text-xl md:text-2xl leading-relaxed space-y-6">
                  <p className="font-medium text-2xl md:text-3xl text-text-primary">
                    Ahoj, já jsem <span className="text-primary-600 font-bold">Matěj</span>
                  </p>
                  <p className="text-lg md:text-xl">
                    <Link href="/o-projektu" className="text-primary-600 hover:text-primary-700 underline font-semibold decoration-2 underline-offset-2 transition-colors">Smyslužití</Link> jsem založil proto, abych lidem pomohl vytvořit a žít více smysluplný život a abych co nejvíce smysluplný život mohl žít sám.
                  </p>
                  <p className="text-lg md:text-xl">
                    Na Smyslužití najdeš <Link href="/inspirace" className="text-primary-600 hover:text-primary-700 underline font-semibold decoration-2 underline-offset-2 transition-colors">inspiraci</Link> ve formě knih, videí, článků a doporučení a <Link href="#aplikace" className="text-primary-600 hover:text-primary-700 underline font-semibold decoration-2 underline-offset-2 transition-colors">aplikaci Pokrok</Link>, kde můžeš snadno plánovat a dosahovat (nejen) smysluplných cílů.
                  </p>
                  <p className="text-lg md:text-xl">
                    Pokud tě zajímá cokoliv jiného, neváhej mě <Link href="/kontakt" className="text-primary-600 hover:text-primary-700 underline font-semibold decoration-2 underline-offset-2 transition-colors">kontaktovat</Link>. Na závěr přeji smysluplnou cestu tvým životem! ✨
                  </p>
                </div>
              </div>
            </div>

            {/* Tlačítka dole */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-8 border-t border-primary-100/50">
              <Link
                href="/inspirace"
                className="group flex items-center justify-center gap-3 px-8 py-4 rounded-full bg-primary-600 text-white font-semibold text-lg hover:bg-primary-700 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 transform w-full sm:w-auto min-w-[180px]"
              >
                <BookOpen size={22} />
                Inspirace
              </Link>
              <Link
                href="#aplikace"
                className="group flex items-center justify-center gap-3 px-8 py-4 rounded-full bg-primary-600 text-white font-semibold text-lg hover:bg-primary-700 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 transform w-full sm:w-auto min-w-[180px]"
              >
                <Smartphone size={22} />
                Aplikace Pokrok
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
