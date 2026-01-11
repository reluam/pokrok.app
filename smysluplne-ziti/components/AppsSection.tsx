'use client'

import { useState } from 'react'
import { ExternalLink, X } from 'lucide-react'
import Image from 'next/image'

export default function AppsSection() {
  const [isImageModalOpen, setIsImageModalOpen] = useState(false)

  return (
    <section id="aplikace" className="py-8 md:py-12 relative overflow-hidden">
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="text-center mb-8 md:mb-12">
          <h2 className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-text-primary mb-4 md:mb-6">
            <span className="gradient-text">Aplikace Pokrok</span>
          </h2>
        </div>
        
        <div className="max-w-6xl mx-auto space-y-6 md:space-y-8">
          {/* Obrázek aplikace - float left pro obtékání */}
          <button
            onClick={() => setIsImageModalOpen(true)}
            className="relative float-left w-full sm:w-2/3 md:w-2/3 lg:w-2/3 overflow-hidden border-2 border-primary-200 shadow-lg mr-4 md:mr-6 lg:mr-8 mb-4 md:mb-6 cursor-pointer hover:shadow-xl transition-shadow"
          >
            <div className="relative w-full">
              <Image
                src="/pokrok-app.png"
                alt="Aplikace Pokrok"
                width={600}
                height={800}
                className="object-contain w-full h-auto"
                priority
              />
            </div>
          </button>
          
          {/* Textový obsah - obtéká kolem obrázku */}
          <div>
            <p className="text-text-secondary text-base md:text-lg mb-3 md:mb-4 leading-relaxed">
              Praktický nástroj pro plánování života, budování návyků a sledování pokroku.
            </p>
            <p className="text-text-primary text-sm md:text-base leading-relaxed mb-4 md:mb-6">
              Pokrok je aplikace navržená pro ty, kteří chtějí systematicky pracovat na svém osobním rozvoji. 
              Pomáhá vám plánovat den, budovat návyky, sledovat pokrok a dosahovat vašich cílů. 
              S aplikací Pokrok můžete lépe organizovat svůj čas, soustředit se na to, co je důležité, 
              a vytvářet trvalé změny ve vašem životě.
            </p>
          </div>
          
          {/* Tlačítko - clear float, aby bylo pod obrázkem */}
          <div className="clear-both pt-4 flex justify-center sm:justify-end">
            <a
              href="https://pokrok.app"
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center justify-center px-6 md:px-8 py-3 md:py-4 text-base md:text-lg font-semibold rounded-full text-white bg-primary-600 hover:bg-primary-700 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 transform"
            >
              Otevřít aplikaci Pokrok
              <ExternalLink className="ml-2 group-hover:translate-x-1 transition-transform" size={18} />
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
              className="absolute top-4 right-4 p-2 bg-white/90 hover:bg-white transition-colors z-10"
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
                className="object-contain max-w-full max-h-full"
                priority
              />
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
