import Link from 'next/link'
import { Users, ArrowRight } from 'lucide-react'

export default function CommunitySection() {
  return (
    <section id="komunita" className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 bg-primary-50/30">
      <div className="max-w-4xl mx-auto text-center">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-primary-100 rounded-lg flex items-center justify-center">
            <Users className="text-primary-600" size={32} />
          </div>
        </div>
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-text-primary mb-6">
          Nejsi na to <span className="gradient-text">sama / sám</span>
        </h2>
        <p className="text-lg md:text-xl text-text-secondary mb-8 leading-relaxed max-w-2xl mx-auto">
          Hledání smyslu nemusí být osamělá cesta. Smyslužití je movement lidí, kteří se rozhodli vystoupit z davu a tvořit život podle sebe. V naší free komunitě na Skoolu najdeš podporu, sdílení a prostor, kde můžeš být skutečně svůj.
        </p>
        <Link
          href="/komunita"
          className="inline-flex items-center gap-2 px-8 py-4 bg-primary-600 text-white font-semibold rounded-full hover:bg-primary-700 transition-all shadow-lg hover:shadow-xl"
        >
          <span>Vstoupit do komunity (zdarma)</span>
          <ArrowRight size={20} />
        </Link>
      </div>
    </section>
  )
}
