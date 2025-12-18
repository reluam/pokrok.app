'use client'

import { Heart, Target, Users, Lightbulb, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function AboutPage() {
  const values = [
    {
      icon: Heart,
      title: 'Autenticita',
      description: 'Věřím v autentický přístup k životu a práci na sobě.',
    },
    {
      icon: Target,
      title: 'Cílevědomost',
      description: 'Pomáhám lidem najít a dosáhnout jejich skutečných cílů.',
    },
    {
      icon: Users,
      title: 'Společenství',
      description: 'Vytvářím prostředí, kde se lidé mohou vzájemně podporovat.',
    },
    {
      icon: Lightbulb,
      title: 'Růst',
      description: 'Věřím v kontinuální osobní rozvoj a učení se.',
    },
  ]

  return (
    <div className="min-h-screen bg-background">
      <section className="section-padding bg-gradient-to-br from-primary-50 via-background to-playful-yellow-light/30 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-10 right-20 w-80 h-80 bg-playful-purple-light rounded-full mix-blend-multiply filter blur-3xl opacity-25"></div>
        <div className="absolute bottom-10 left-20 w-80 h-80 bg-playful-pink-light rounded-full mix-blend-multiply filter blur-3xl opacity-25"></div>
        
        <div className="max-w-7xl mx-auto container-padding relative">
          {/* Back button */}
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-text-secondary hover:text-primary-600 mb-8 transition-colors"
          >
            <ArrowLeft size={20} />
            <span>Zpět na hlavní stránku</span>
          </Link>

          <div className="text-center mb-16">
            <div className="inline-block px-4 py-2 rounded-full bg-primary-100 text-primary-700 text-sm font-semibold mb-6">
              O projektu
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-text-primary mb-6">
              O projektu{' '}
              <span className="gradient-text">Smysluplné žití</span>
            </h1>
            <p className="text-xl md:text-2xl text-text-secondary max-w-4xl mx-auto leading-relaxed">
              Smysluplné žití je projekt zaměřený na pomoc lidem najít smysl v jejich životě,
              stanovit si jasné cíle a vytvářet návyky, které vedou k naplněnějšímu a šťastnějšímu životu.
            </p>
          </div>

          <div className="max-w-4xl mx-auto mb-12">
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl p-10 md:p-14 border border-primary-100 hover:shadow-3xl transition-shadow duration-300">
              <h2 className="text-3xl md:text-4xl font-bold text-text-primary mb-6">Moje vize</h2>
              <p className="text-text-primary text-lg md:text-xl leading-relaxed mb-6">
                Věřím, že každý člověk má potenciál žít smysluplný a naplněný život.
                Mým cílem je poskytnout nástroje, inspiraci a podporu, které lidem pomohou
                objevit jejich vlastní cestu k osobnímu růstu a spokojenosti.
              </p>
              <p className="text-text-primary text-lg md:text-xl leading-relaxed">
                Kombinuji moderní technologie s osvědčenými přístupy k osobnímu rozvoji,
                abych vytvořil komplexní ekosystém pro všechny, kteří chtějí aktivně pracovat
                na svém životě a dosahovat svých cílů.
              </p>
            </div>
          </div>

          <div className="mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-text-primary mb-12 text-center">Moje hodnoty</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {values.map((value, index) => {
                const Icon = value.icon
                return (
                  <div
                    key={index}
                    className="group bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-8 text-center hover:shadow-xl transition-all duration-300 border-2 border-primary-100 hover:border-primary-300 hover:-translate-y-2 transform"
                  >
                    <div className="bg-primary-100 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 group-hover:bg-primary-200 transition-all duration-300 shadow-md">
                      <Icon className="text-primary-600" size={36} />
                    </div>
                    <h3 className="text-2xl font-bold text-text-primary mb-3">{value.title}</h3>
                    <p className="text-text-secondary text-base leading-relaxed">{value.description}</p>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl p-10 md:p-14 border border-primary-100 hover:shadow-3xl transition-shadow duration-300">
              <h2 className="text-3xl md:text-4xl font-bold text-text-primary mb-8">Co nabízím</h2>
              <ul className="space-y-6 text-text-primary">
                <li className="flex items-start group/item">
                  <span className="text-primary-600 mr-4 text-2xl font-bold group-hover/item:scale-125 transition-transform">•</span>
                  <span className="text-lg leading-relaxed">
                    <strong className="font-bold text-xl">Koučing sezení</strong> - individuální podpora při hledání
                    životního smyslu a stanovování cílů
                  </span>
                </li>
                <li className="flex items-start group/item">
                  <span className="text-primary-600 mr-4 text-2xl font-bold group-hover/item:scale-125 transition-transform">•</span>
                  <span className="text-lg leading-relaxed">
                    <strong className="font-bold text-xl">Aplikace</strong> - praktické nástroje pro plánování života,
                    budování návyků a sledování pokroku
                  </span>
                </li>
                <li className="flex items-start group/item">
                  <span className="text-primary-600 mr-4 text-2xl font-bold group-hover/item:scale-125 transition-transform">•</span>
                  <span className="text-lg leading-relaxed">
                    <strong className="font-bold text-xl">Inspirace</strong> - články, videa a knihy, které vás mohou
                    inspirovat na vaší cestě
                  </span>
                </li>
                <li className="flex items-start group/item">
                  <span className="text-primary-600 mr-4 text-2xl font-bold group-hover/item:scale-125 transition-transform">•</span>
                  <span className="text-lg leading-relaxed">
                    <strong className="font-bold text-xl">Komunita</strong> - prostředí pro sdílení zkušeností a vzájemnou
                    podporu
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
