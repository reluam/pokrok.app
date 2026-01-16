import { getArticles } from '@/lib/articles'
import Link from 'next/link'
import Image from 'next/image'
import { Calendar, ArrowRight } from 'lucide-react'

export default async function PopularArticles() {
  const { articles } = await getArticles()
  const popularArticles = articles
    .filter(article => article.published)
    .slice(0, 3) // Nejnovější 3 články

  if (popularArticles.length === 0) {
    return null
  }

  return (
    <section className="py-16 md:py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-text-primary mb-12 text-center">
          Populární články
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {popularArticles.map((article) => {
            const date = new Date(article.createdAt)
            const formattedDate = date.toLocaleDateString('cs-CZ', {
              day: 'numeric',
              month: 'long',
              year: 'numeric'
            })

            return (
              <Link
                key={article.id}
                href={`/clanky/${article.slug}`}
                className="group bg-white rounded-lg overflow-hidden border border-primary-100 hover:border-primary-300 hover:shadow-lg transition-all duration-300"
              >
                {article.image && (
                  <div className="relative w-full h-48 overflow-hidden">
                    <Image
                      src={article.image}
                      alt={article.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                )}
                <div className="p-6">
                  <div className="flex items-center gap-2 text-sm text-text-secondary mb-3">
                    <Calendar size={16} />
                    <span>{formattedDate}</span>
                  </div>
                  <h3 className="text-xl md:text-2xl font-bold text-text-primary mb-3 group-hover:text-primary-600 transition-colors">
                    {article.title}
                  </h3>
                  {article.excerpt && (
                    <p className="text-text-secondary leading-relaxed mb-4 line-clamp-3">
                      {article.excerpt}
                    </p>
                  )}
                  <div className="inline-flex items-center gap-2 text-primary-600 font-semibold group-hover:gap-3 transition-all">
                    <span>Číst více</span>
                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
        <div className="text-center mt-12">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 px-8 py-4 border-2 border-primary-600 text-primary-600 font-semibold rounded-full hover:bg-primary-600 hover:text-white transition-all duration-300"
          >
            <span>Zobrazit všechny články</span>
            <ArrowRight size={20} />
          </Link>
        </div>
      </div>
    </section>
  )
}
