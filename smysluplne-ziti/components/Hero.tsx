'use client'

import { ArrowDown, Sparkles } from 'lucide-react'
import Link from 'next/link'

export default function Hero() {
  return (
    <section className="relative min-h-[90vh] flex items-center overflow-hidden">
      {/* Background gradient with animated elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary-50 via-background via-60% to-playful-yellow-light opacity-50"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(232,135,30,0.1),transparent_50%)]"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(255,179,186,0.1),transparent_50%)]"></div>
      
      {/* Decorative elements */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-playful-pink-light rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob"></div>
      <div className="absolute top-40 right-10 w-72 h-72 bg-playful-yellow-light rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000"></div>
      <div className="absolute -bottom-8 left-1/2 w-72 h-72 bg-playful-purple-light rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-4000"></div>
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="text-center animate-fade-in-up">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 backdrop-blur-sm border border-primary-200 mb-8 animate-fade-in">
            <Sparkles className="w-4 h-4 text-primary-600" />
            <span className="text-sm font-medium text-text-primary">Osobní rozvoj a smysluplné žití</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold text-text-primary mb-6 leading-tight">
            <span className="block">Smysluplné</span>
            <span className="gradient-text">žití</span>
          </h1>
          
          <p className="text-xl md:text-2xl lg:text-3xl text-text-secondary mb-12 max-w-4xl mx-auto leading-relaxed font-light">
            Cesta k životu plnému smyslu, růstu a naplnění. Objevte nástroje, inspiraci a podporu pro váš osobní rozvoj.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-24 md:mb-32">
            <Link
              href="/coaching"
              className="group inline-flex items-center justify-center px-8 py-4 text-lg font-semibold rounded-full text-white bg-primary-600 hover:bg-primary-700 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 transform relative z-10"
            >
              Zarezervovat sezení
            </Link>
            <Link
              href="#aplikace"
              className="group inline-flex items-center justify-center px-8 py-4 text-lg font-semibold rounded-full text-primary-600 bg-white/80 backdrop-blur-sm border-2 border-primary-600 hover:bg-primary-50 transition-all duration-300 hover:scale-105 transform relative z-10"
            >
              Prozkoumat aplikaci
              <ArrowDown className="ml-2 w-5 h-5 group-hover:translate-y-1 transition-transform" />
            </Link>
          </div>
        </div>
        
        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce z-0">
          <a
            href="#coaching"
            className="flex flex-col items-center gap-2 text-text-secondary hover:text-primary-600 transition-colors"
          >
            <span className="text-sm font-medium">Scroll</span>
            <ArrowDown size={24} />
          </a>
        </div>
      </div>
    </section>
  )
}
