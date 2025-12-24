'use client'

import { useState } from 'react'
import { ExternalLink, X } from 'lucide-react'
import Image from 'next/image'

export default function AppsSection() {
  const [isImageModalOpen, setIsImageModalOpen] = useState(false)

  return (
    <section id="aplikace" className="py-8 md:py-12 bg-gradient-to-b from-background to-primary-50/30 relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-20 left-10 w-64 h-64 bg-playful-yellow-light rounded-full mix-blend-multiply filter blur-3xl opacity-30"></div>
      <div className="absolute bottom-20 right-10 w-64 h-64 bg-playful-purple-light rounded-full mix-blend-multiply filter blur-3xl opacity-30"></div>
      
      <div className="max-w-7xl mx-auto container-padding relative">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-text-primary mb-6">
            <span className="gradient-text">Aplikace Pokrok</span>
          </h2>
        </div>
        
        <div className="max-w-6xl mx-auto bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-8 md:p-12 border border-primary-100 overflow-hidden">
          {/* Obrázek aplikace - float left pro obtékání */}
          <button
            onClick={() => setIsImageModalOpen(true)}
            className="relative float-left w-full sm:w-2/3 md:w-2/3 lg:w-2/3 rounded-2xl overflow-hidden border-2 border-primary-200 shadow-lg mr-6 md:mr-8 mb-4 md:mb-6 cursor-pointer hover:shadow-xl transition-shadow"
          >
            <div className="relative w-full">
              <Image
                src="/pokrok-app.png"
                alt="Aplikace Pokrok"
                width={600}
                height={800}
                className="object-contain w-full h-auto rounded-2xl"
                priority
              />
            </div>
          </button>
          
          {/* Textový obsah - obtéká kolem obrázku */}
          <div>
            <p className="text-text-secondary text-lg mb-4 leading-relaxed">
              Praktický nástroj pro plánování života, budování návyků a sledování pokroku.
            </p>
            <p className="text-text-primary text-base leading-relaxed mb-6">
              Pokrok je aplikace navržená pro ty, kteří chtějí systematicky pracovat na svém osobním rozvoji. 
              Pomáhá vám plánovat den, budovat návyky, sledovat pokrok a dosahovat vašich cílů. 
              S aplikací Pokrok můžete lépe organizovat svůj čas, soustředit se na to, co je důležité, 
              a vytvářet trvalé změny ve vašem životě.
            </p>
          </div>
          
          {/* Tlačítko - clear float, aby bylo pod obrázkem */}
          <div className="clear-both pt-4 flex justify-end">
            <a
              href="https://pokrok.app"
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center justify-center px-8 py-4 text-lg font-semibold rounded-full text-white bg-primary-600 hover:bg-primary-700 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 transform"
            >
              Otevřít aplikaci Pokrok
              <ExternalLink className="ml-2 group-hover:translate-x-1 transition-transform" size={20} />
            </a>
          </div>
        </div>
      </div>

      {/* Modál pro zobrazení obrázku v plném rozlišení */}
      {isImageModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={() => setIsImageModalOpen(false)}
        >
          <div className="relative max-w-7xl max-h-[90vh] w-full h-full flex items-center justify-center">
            {/* Close button */}
            <button
              onClick={() => setIsImageModalOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-full bg-white/90 hover:bg-white transition-colors z-10"
              aria-label="Zavřít"
            >
              <X size={24} className="text-text-primary" />
            </button>

            {/* Obrázek v plném rozlišení */}
            <div className="relative w-full h-full flex items-center justify-center">
              <Image
                src="/pokrok-app.png"
                alt="Aplikace Pokrok - plné rozlišení"
                width={1200}
                height={1600}
                className="object-contain max-w-full max-h-full rounded-2xl"
                priority
              />
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
