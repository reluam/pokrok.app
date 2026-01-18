import { ArrowRight } from 'lucide-react'
import Link from 'next/link'

export default function InspirationSection() {
  return (
    <section id="inspirace" className="section-padding relative overflow-hidden">
      
      <div className="max-w-7xl mx-auto container-padding relative">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-text-primary mb-6">
            Najděte{' '}
            <span className="gradient-text">inspiraci</span>
          </h2>
          <p className="text-xl md:text-2xl text-text-secondary max-w-3xl mx-auto leading-relaxed mb-8">
            Články, videa a knihy, které vás mohou inspirovat na cestě k smysluplnějšímu životu.
          </p>
          <Link
            href="/clanky"
            className="group inline-flex items-center justify-center px-8 py-4 text-lg font-semibold rounded-full text-primary-600 bg-white/80 backdrop-blur-sm border-2 border-primary-600 hover:bg-primary-50 transition-all duration-300 hover:scale-105 transform"
          >
            Prozkoumat inspiraci
            <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" size={20} />
          </Link>
        </div>
      </div>
    </section>
  )
}
