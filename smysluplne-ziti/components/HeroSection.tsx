'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

export default function HeroSection() {
  return (
    <section className="relative min-h-[85vh] flex items-center justify-center pt-20 pb-16 px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <img
          src="/hero-background.jpg"
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          style={{ zIndex: 0 }}
        />
        {/* Overlay for better text readability */}
        <div className="absolute inset-0 bg-background/60 backdrop-blur-md" style={{ zIndex: 1 }}></div>
      </div>
      
      <div className="max-w-4xl mx-auto text-center relative z-10">
        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-text-primary mb-6 leading-tight">
          Žij život, který ti dává smysl.
        </h1>
        <p className="text-lg md:text-xl lg:text-2xl text-text-secondary max-w-3xl mx-auto leading-relaxed mb-10">
          Pomáhám ti vystoupit z autopilota, uklidit chaos v prioritách a najít odvahu tvořit život podle tvých vlastních pravidel. Skrze individuální koučink společně najdeme tvůj směr.
        </p>
        <div className="flex flex-col items-center gap-4">
          <a
            href="#konzultace"
            className="group inline-flex items-center justify-center gap-2 px-10 py-5 bg-primary-600 text-white font-bold text-lg rounded-full hover:bg-primary-700 transition-all duration-300 shadow-xl hover:shadow-2xl hover:scale-105"
          >
            <span>Rezervovat úvodní sezení zdarma</span>
            <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
          </a>
          <p className="text-sm text-text-secondary">
            20 minut, které ti pomohou ujasnit si další krok. Bez závazků.
          </p>
        </div>
      </div>
    </section>
  )
}
