'use client'

import Link from 'next/link'
import Image from 'next/image'
import { ArrowDown, ArrowRight } from 'lucide-react'

export default function HeroSection() {
  return (
    <section className="relative min-h-[85vh] flex items-center justify-center pt-20 pb-16 px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/hero-background"
          alt=""
          fill
          className="object-cover"
          priority
          quality={90}
        />
        {/* Overlay for better text readability */}
        <div className="absolute inset-0 bg-background/60 backdrop-blur-md"></div>
      </div>
      
      <div className="max-w-4xl mx-auto text-center relative z-10">
        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-text-primary mb-6 leading-tight">
          Žij život, který dává smysl tobě.
        </h1>
        <p className="text-lg md:text-xl lg:text-2xl text-text-secondary max-w-3xl mx-auto leading-relaxed mb-10">
          Protože svět se nikdy nezastaví a úkoly nikdy neskončí. Nečekej, až se všechno uklidní – vezmi svůj smysl do vlastních rukou. Se Smyslužitím ti pomůžu najít tvůj směr a podpořím tě na tvé vlastní cestě za smysluplným životem.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <a
            href="#clanky"
            className="group inline-flex items-center justify-center gap-2 px-8 py-4 bg-primary-600 text-white font-semibold text-lg rounded-full hover:bg-primary-700 transition-all duration-300 shadow-md hover:shadow-lg hover:scale-105"
          >
            <span>Kde začít</span>
            <ArrowDown size={20} className="group-hover:translate-y-1 transition-transform" />
          </a>
          <Link
            href="/coaching"
            className="group inline-flex items-center justify-center gap-2 px-8 py-4 border-2 border-primary-600 text-primary-600 font-semibold text-lg rounded-full hover:bg-primary-50 transition-all duration-300"
          >
            <span>Koučing</span>
            <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </section>
  )
}
