import { ArrowRight } from 'lucide-react'
import Link from 'next/link'

export default function AboutSection() {
  return (
    <section id="o-projektu" className="section-padding bg-gradient-to-br from-primary-50 via-background to-playful-yellow-light/30 relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-10 right-20 w-80 h-80 bg-playful-purple-light rounded-full mix-blend-multiply filter blur-3xl opacity-25"></div>
      <div className="absolute bottom-10 left-20 w-80 h-80 bg-playful-pink-light rounded-full mix-blend-multiply filter blur-3xl opacity-25"></div>
      
      <div className="max-w-7xl mx-auto container-padding relative">
        <div className="text-center mb-12">
          <div className="inline-block px-4 py-2 rounded-full bg-primary-100 text-primary-700 text-sm font-semibold mb-6">
            O projektu
          </div>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-text-primary mb-6">
            O projektu{' '}
            <span className="gradient-text">Smysluplné žití</span>
          </h2>
          <p className="text-xl md:text-2xl text-text-secondary max-w-4xl mx-auto leading-relaxed mb-8">
            Smysluplné žití je projekt zaměřený na pomoc lidem najít smysl v jejich životě,
            stanovit si jasné cíle a vytvářet návyky, které vedou k naplněnějšímu a šťastnějšímu životu.
            Objevte naši vizi, hodnoty a to, co nabízíme.
          </p>
          <Link
            href="/o-projektu"
            className="group inline-flex items-center justify-center px-8 py-4 text-lg font-semibold rounded-full text-primary-600 bg-white/80 backdrop-blur-sm border-2 border-primary-600 hover:bg-primary-50 transition-all duration-300 hover:scale-105 transform"
          >
            Zjistit více o projektu
            <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" size={20} />
          </Link>
        </div>
      </div>
    </section>
  )
}
