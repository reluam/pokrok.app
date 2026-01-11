'use client'

import { useState } from 'react'
import { ExternalLink, X } from 'lucide-react'
import Image from 'next/image'

export default function AppsSection() {
  const [isImageModalOpen, setIsImageModalOpen] = useState(false)

  return (
    <section id="aplikace" className="relative min-h-[90vh] flex items-center overflow-hidden">
      <div className="relative z-10 w-full h-full">
        <div className="relative h-full flex items-stretch">
          {/* Left column - App image (3/5) */}
          <div className="w-3/5 relative">
            <button
              onClick={() => setIsImageModalOpen(true)}
              className="relative w-full h-full cursor-pointer hover:opacity-95 transition-opacity block"
            >
              <Image
                src="/pokrok-app.png"
                alt="Aplikace Pokrok"
                fill
                className="object-cover object-left"
                priority
              />
              {/* Light filter overlay for brightness */}
              <div className="absolute inset-0 bg-white/30"></div>
              {/* Gradient overlay for readability */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary-500/20 to-primary-600/30"></div>
            </button>
          </div>

          {/* Right column - App description (2/5) */}
          <div className="w-2/5 bg-white/50 backdrop-blur-md shadow-2xl p-8 md:p-12 lg:p-16 flex flex-col justify-center">
            <div className="flex-1 flex flex-col justify-center space-y-6">
              <h2 className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-text-primary">
                <span className="gradient-text">Aplikace Pokrok</span>
              </h2>
              
              <p className="text-xl md:text-2xl text-text-primary leading-relaxed">
                Praktický nástroj pro plánování života, budování návyků a sledování pokroku.
              </p>
              
              <p className="text-lg md:text-xl text-text-primary leading-relaxed">
                Pokrok je aplikace navržená pro ty, kteří chtějí systematicky pracovat na svém osobním rozvoji. 
                Pomáhá vám plánovat den, budovat návyky, sledovat pokrok a dosahovat vašich cílů. 
                S aplikací Pokrok můžete lépe organizovat svůj čas, soustředit se na to, co je důležité, 
                a vytvářet trvalé změny ve vašem životě.
              </p>

              {/* Button */}
              <div className="mt-8">
                <a
                  href="https://pokrok.app"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-semibold text-lg transition-all"
                >
                  <span>Otevřít aplikaci Pokrok</span>
                  <ExternalLink size={20} className="group-hover:translate-x-1 transition-transform" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modál pro zobrazení obrázku v plném rozlišení - přes celou stránku */}
      {isImageModalOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm"
          onClick={() => setIsImageModalOpen(false)}
        >
          {/* Close button */}
          <button
            onClick={() => setIsImageModalOpen(false)}
            className="absolute top-4 right-4 p-2 bg-white/90 hover:bg-white transition-colors z-10"
            aria-label="Zavřít"
          >
            <X size={24} className="text-text-primary" />
          </button>

          {/* Obrázek přes celou stránku */}
          <div className="w-full h-full flex items-center justify-center p-4">
            <div className="relative w-full h-full max-w-7xl max-h-[90vh]">
              <Image
                src="/pokrok-app.png"
                alt="Aplikace Pokrok - plné rozlišení"
                fill
                className="object-contain"
                priority
              />
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
