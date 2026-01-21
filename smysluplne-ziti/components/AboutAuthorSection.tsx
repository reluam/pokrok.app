'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { useState } from 'react'

export default function AboutAuthorSection() {
  const [imageError, setImageError] = useState(false)

  return (
    <section className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 bg-background">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center">
          {/* Photo */}
          <div className="relative w-full aspect-square max-w-md mx-auto md:mx-0">
            {!imageError ? (
              <Image
                src="/matej-photo.jpg"
                alt="Matěj"
                fill
                className="object-cover rounded-lg shadow-lg"
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="w-full h-full bg-primary-100 rounded-lg flex items-center justify-center">
                <span className="text-primary-600 text-4xl font-bold">M</span>
              </div>
            )}
          </div>

          {/* Text */}
          <div className="text-center md:text-left">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-text-primary mb-6">
              Ahoj, jsem <span className="gradient-text">Matěj</span>.
            </h2>
            <div className="space-y-4 text-lg text-text-secondary leading-relaxed mb-6">
              <p>
                Dlouho jsem žil na autopilota a hledal smysl v tabulkách a cizích očekáváních. Až skrze vlastní chyby a stovky hodin seberozvoje jsem pochopil jednu věc: Smysl se nehledá, smysl se tvoří.
              </p>
              <p>
                Dnes pomáhám lidem jako jsi ty najít odvahu k vlastní autenticitě. Nejsem guru s univerzálním návodem. Jsem tvůj průvodce, který ti pomůže uklidit chaos, abychom společně našli cestu, která ti dává smysl. Moje práce vychází z reálné praxe, upřímnosti a víry, že každý z nás může mít život pevně ve svých rukou.
              </p>
            </div>
            <Link
              href="/o-mne"
              className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-semibold transition-colors"
            >
              <span>Přečíst si můj celý příběh</span>
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
