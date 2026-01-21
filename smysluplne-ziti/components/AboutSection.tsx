import { ArrowRight } from 'lucide-react'
import Link from 'next/link'

export default function AboutSection() {
  return (
    <section id="o-mne" className="section-padding relative overflow-hidden">
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="text-center mb-8 md:mb-12">
          <h2 className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-text-primary mb-4 md:mb-6">
            O projektu{' '}
            <span className="gradient-text">Smyslužití</span>
          </h2>
          <p className="text-base md:text-lg lg:text-xl xl:text-2xl text-text-secondary max-w-4xl mx-auto leading-relaxed mb-6 md:mb-8">
            Smyslužití je projekt zaměřený na pomoc lidem najít smysl v jejich životě,
            stanovit si jasné cíle a vytvářet návyky, které vedou k naplněnějšímu a šťastnějšímu životu.
            Objevte moji vizi, hodnoty a to, co nabízím.
          </p>
          <Link
            href="/o-mne"
            className="group inline-flex items-center justify-center px-6 md:px-8 py-3 md:py-4 text-base md:text-lg font-semibold rounded-full text-primary-600 bg-white/80 backdrop-blur-sm border-2 border-primary-600 hover:bg-primary-50 transition-all duration-300 hover:scale-105 transform"
          >
            Zjistit více o projektu
            <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" size={18} />
          </Link>
        </div>
      </div>
    </section>
  )
}
