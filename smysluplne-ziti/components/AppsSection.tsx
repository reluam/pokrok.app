import { ArrowRight, Target } from 'lucide-react'
import Link from 'next/link'

export default function AppsSection() {
  return (
    <section id="apps" className="section-padding bg-gradient-to-b from-background to-primary-50/30 relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-20 left-10 w-64 h-64 bg-playful-yellow-light rounded-full mix-blend-multiply filter blur-3xl opacity-30"></div>
      <div className="absolute bottom-20 right-10 w-64 h-64 bg-playful-purple-light rounded-full mix-blend-multiply filter blur-3xl opacity-30"></div>
      
      <div className="max-w-7xl mx-auto container-padding relative">
        <div className="text-center mb-12">
          <div className="inline-block px-4 py-2 rounded-full bg-primary-100 text-primary-700 text-sm font-semibold mb-6">
            Aplikace
          </div>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-text-primary mb-6">
            <span className="gradient-text">Aplikace</span>
          </h2>
          <p className="text-xl md:text-2xl text-text-secondary max-w-3xl mx-auto leading-relaxed mb-8">
            Praktický nástroj pro plánování života, budování návyků a sledování pokroku. 
            Aplikace Pokrok vám pomůže žít smysluplnější život a dosahovat vašich cílů.
          </p>
          <Link
            href="/aplikace"
            className="group inline-flex items-center justify-center px-8 py-4 text-lg font-semibold rounded-full text-primary-600 bg-white/80 backdrop-blur-sm border-2 border-primary-600 hover:bg-primary-50 transition-all duration-300 hover:scale-105 transform"
          >
            Zjistit více o aplikaci
            <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" size={20} />
          </Link>
        </div>
      </div>
    </section>
  )
}
