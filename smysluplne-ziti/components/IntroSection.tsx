'use client'

import Image from 'next/image'
import Link from 'next/link'
import { BookOpen, Target, Smartphone } from 'lucide-react'

export default function IntroSection() {
  return (
    <section className="section-padding bg-background relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-playful-purple-light rounded-full mix-blend-multiply filter blur-3xl opacity-20 -translate-y-1/2 translate-x-1/2"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-playful-pink-light rounded-full mix-blend-multiply filter blur-3xl opacity-20 translate-y-1/2 -translate-x-1/2"></div>
      
      <div className="max-w-7xl mx-auto container-padding relative">
        {/* Velký nadpis nahoře */}
        <div className="text-center mb-12">
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-text-primary mb-4">
            Vítej na <span className="gradient-text">Smyslužití</span>
          </h1>
        </div>

        <div className="max-w-5xl mx-auto">
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-8 md:p-12 border border-primary-100">
            <div className="flex flex-col md:flex-row gap-8 md:gap-12 items-start mb-8">
              {/* Text */}
              <div className="flex-1 text-text-primary">
                <div className="text-lg md:text-xl leading-relaxed space-y-4">
                  <p>
                    Ahoj, já jsem Matěj a Smyslužití jsem založil proto, abych lidem pomohl vytvořit a žít více smysluplný život a abych co nejvíce smysluplný život mohl žít sám.
                  </p>
                  <p>
                    Na Smyslužití najdeš <Link href="/inspirace" className="text-primary-600 hover:text-primary-700 underline font-medium">inspiraci</Link> ve formě knih, videí, článků a doporučení, <Link href="/coaching" className="text-primary-600 hover:text-primary-700 underline font-medium">coachovací sezení</Link>, kde projdeme, jak můžeš smysluplnost více zakomponovat do tvého života a <Link href="#aplikace" className="text-primary-600 hover:text-primary-700 underline font-medium">aplikaci Pokrok</Link>, kde můžeš snadno plánovat a dosahovat (nejen) smysluplných cílů.
                  </p>
                  <p>
                    Pokud tě zajímá cokoliv jiného, neváhej mě <Link href="/kontakt" className="text-primary-600 hover:text-primary-700 underline font-medium">kontaktovat</Link>. Na závěr přeji smysluplnou cestu tvým životem!
                  </p>
                </div>
              </div>
              
              {/* Fotka */}
              <div className="flex-shrink-0 mx-auto md:mx-0">
                <div className="relative w-48 h-48 md:w-56 md:h-56 rounded-full overflow-hidden border-4 border-primary-200 shadow-lg">
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
            </div>

            {/* Tlačítka dole */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-6 border-t border-primary-100">
              <Link
                href="/inspirace"
                className="group flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-primary-600 text-white font-semibold hover:bg-primary-700 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 transform w-full sm:w-auto"
              >
                <BookOpen size={20} />
                Inspirace
              </Link>
              <Link
                href="/coaching"
                className="group flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-primary-600 text-white font-semibold hover:bg-primary-700 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 transform w-full sm:w-auto"
              >
                <Target size={20} />
                Koučing
              </Link>
              <Link
                href="#aplikace"
                className="group flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-primary-600 text-white font-semibold hover:bg-primary-700 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 transform w-full sm:w-auto"
              >
                <Smartphone size={20} />
                Aplikace Pokrok
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
