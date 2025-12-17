import { ArrowRight, Users } from 'lucide-react'
import Link from 'next/link'

export default function BookingSection() {
  return (
    <section id="coaching" className="section-padding bg-background relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-playful-purple-light rounded-full mix-blend-multiply filter blur-3xl opacity-20 -translate-y-1/2 translate-x-1/2"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-playful-pink-light rounded-full mix-blend-multiply filter blur-3xl opacity-20 translate-y-1/2 -translate-x-1/2"></div>
      
      <div className="max-w-7xl mx-auto container-padding relative">
        <div className="text-center mb-12">
          <div className="inline-block px-4 py-2 rounded-full bg-primary-100 text-primary-700 text-sm font-semibold mb-6">
            Coaching
          </div>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-text-primary mb-6">
            <span className="gradient-text">Coaching sezení</span>
          </h2>
          <p className="text-xl md:text-2xl text-text-secondary max-w-3xl mx-auto leading-relaxed mb-8">
            Pojďme společně prozkoumat vaše cíle, hodnoty a najít cestu k smysluplnějšímu životu. 
            Individuální podpora při hledání životního smyslu a stanovování cílů.
          </p>
          <Link
            href="/coaching"
            className="group inline-flex items-center justify-center px-8 py-4 text-lg font-semibold rounded-full text-white bg-primary-600 hover:bg-primary-700 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 transform"
          >
            Rezervovat sezení
            <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" size={20} />
          </Link>
        </div>
      </div>
    </section>
  )
}
