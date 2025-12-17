'use client'

import { ArrowRight, Target, ArrowLeft, Image as ImageIcon } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

export default function AppsPage() {
  const app = {
    name: 'Pokrok',
    shortDescription: 'Aplikace pro plánování života a dosahování cílů.',
    description: 'Pokrok je komplexní aplikace navržená pro lidi, kteří chtějí aktivně pracovat na svém osobním rozvoji a dosahovat svých životních cílů. Spojuje velký přehled s konkrétními kroky, pomáhá zvýšit motivaci a snížit přetížení.',
    features: [
      'Plánování cílů a kroků - stanovte si velké cíle a rozložte je na dosažitelné kroky',
      'Budování návyků - vytvářejte a udržujte pozitivní návyky, které vás posouvají vpřed',
      'Sledování pokroku - vizualizujte svůj pokrok a oslavujte úspěchy',
      'Denní, týdenní a měsíční přehledy - flexibilní přístup k plánování podle vašich potřeb',
      'Reflexe a učení - pravidelně reflektujte svůj pokrok a učte se z vlastních zkušeností',
    ],
    icon: Target,
    color: 'bg-primary-600',
    link: 'https://pokrok.app',
    imagePlaceholder: true,
  }

  return (
    <div className="min-h-screen bg-background">
      <section className="section-padding bg-gradient-to-b from-background to-primary-50/30 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-20 left-10 w-64 h-64 bg-playful-yellow-light rounded-full mix-blend-multiply filter blur-3xl opacity-30"></div>
        <div className="absolute bottom-20 right-10 w-64 h-64 bg-playful-purple-light rounded-full mix-blend-multiply filter blur-3xl opacity-30"></div>
        
        <div className="max-w-7xl mx-auto container-padding relative">
          {/* Back button */}
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-text-secondary hover:text-primary-600 mb-8 transition-colors"
          >
            <ArrowLeft size={20} />
            <span>Zpět na hlavní stránku</span>
          </Link>

          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl overflow-hidden border border-primary-100">
            <div className="flex flex-col md:flex-row gap-6 md:gap-8 p-6 md:p-8">
              {/* Image placeholder */}
              <div className="w-full md:w-2/5 flex-shrink-0">
                {app.imagePlaceholder ? (
                  <div className="w-full h-[40vh] max-h-[500px] bg-gradient-to-br from-primary-100 to-primary-200 rounded-2xl flex items-center justify-center border-2 border-dashed border-primary-300">
                    <div className="text-center">
                      <ImageIcon className="mx-auto text-primary-400 mb-4" size={48} />
                      <p className="text-text-secondary font-medium">Obrázek aplikace</p>
                      <p className="text-text-light text-sm mt-2">Placeholder pro obrázek</p>
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-[40vh] max-h-[500px] bg-gray-100 rounded-2xl"></div>
                )}
              </div>

              {/* Content */}
              <div className="w-full md:w-3/5 flex flex-col justify-center">
                <div className={`${app.color} w-14 h-14 rounded-xl flex items-center justify-center mb-4 shadow-lg`}>
                  <app.icon className="text-white" size={28} />
                </div>
                
                <h1 className="text-3xl md:text-4xl font-bold text-text-primary mb-3">
                  {app.name}
                </h1>
                
                <p className="text-lg text-text-secondary mb-6 font-semibold">
                  {app.shortDescription}
                </p>
                
                <p className="text-text-primary text-base leading-relaxed mb-6">
                  {app.description}
                </p>

                <ul className="space-y-2 mb-6">
                  {app.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start text-base text-text-primary">
                      <span className="text-primary-600 mr-3 text-lg font-bold flex-shrink-0">✓</span>
                      <span className="pt-0.5">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href={app.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group/link inline-flex items-center justify-center px-6 py-3 rounded-full text-white bg-primary-600 hover:bg-primary-700 font-semibold transition-all duration-300 hover:scale-105 transform shadow-lg hover:shadow-xl w-fit"
                >
                  Zjistit více o {app.name}
                  <ArrowRight className="ml-2 group-hover/link:translate-x-1 transition-transform" size={18} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
