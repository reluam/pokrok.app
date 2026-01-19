import { getFeaturedArticles } from '@/lib/articles'
import { getSmallThingsPage } from '@/lib/small-things'
import { getQuestionsPage } from '@/lib/questions'
import Link from 'next/link'
import Image from 'next/image'
import { Calendar, ArrowRight } from 'lucide-react'

// Funkce pro určení tagu podle obsahu článku
function getArticleTag(title: string, excerpt: string): 'Věda' | 'Experiment' | 'Filozofie' {
  const text = (title + ' ' + excerpt).toLowerCase()
  if (text.includes('recenze') || text.includes('frankl') || text.includes('studie') || text.includes('věda')) {
    return 'Věda'
  }
  if (text.includes('experiment') || text.includes('zkouš') || text.includes('test')) {
    return 'Experiment'
  }
  if (text.includes('smysl') || text.includes('filozof') || text.includes('život')) {
    return 'Filozofie'
  }
  return 'Experiment' // default
}

export default async function LatestFromLab() {
  // Get featured articles
  let featuredArticles = await getFeaturedArticles(3)
  const smallThingsPage = await getSmallThingsPage()
  const questionsPage = await getQuestionsPage()
  
  // If we have no featured articles, don't show the section
  if (featuredArticles.length === 0) {
    return null
  }

  return (
    <section id="clanky" className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 scroll-mt-20">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-text-primary mb-12 text-center animate-fade-in-up">
          O čem je <span className="gradient-text">Smyslužití</span>?
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {/* Featured article - first card (Smysluplné žití) */}
          {featuredArticles.map((article) => {
            const date = new Date(article.createdAt)
            const formattedDate = date.toLocaleDateString('cs-CZ', {
              day: 'numeric',
              month: 'long',
              year: 'numeric'
            })
            const tag = getArticleTag(article.title, article.excerpt || '')

            return (
              <Link
                key={article.id}
                href={`/clanky/${article.slug}`}
                className="group bg-white rounded-lg overflow-hidden border border-primary-100 hover:border-primary-300 hover:shadow-xl transition-all duration-300"
              >
                {article.image ? (
                  <div className="relative h-48 overflow-hidden">
                    <Image
                      src={article.image}
                      alt={article.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                ) : (
                  <div className="relative h-48 bg-gradient-to-br from-primary-100 to-primary-200">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-4xl">📝</span>
                    </div>
                  </div>
                )}
                <div className="p-6">
                  <div className="flex items-center gap-2 text-sm text-text-secondary mb-3">
                    <Calendar size={16} />
                    <span>{formattedDate}</span>
                  </div>
                  <h3 className="text-xl font-bold text-text-primary mb-3 group-hover:text-primary-600 transition-colors">
                    {article.title}
                  </h3>
                  {article.excerpt && (
                    <p className="text-text-secondary leading-relaxed line-clamp-3 mb-4">
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

          {/* Special card for "Otázky" - second card */}
          <Link
            href="/clanky/otazky"
            className="group bg-white rounded-lg overflow-hidden border border-primary-100 hover:border-primary-300 hover:shadow-xl transition-all duration-300"
          >
            {questionsPage?.image ? (
              <div className="relative h-48 overflow-hidden">
                <Image
                  src={questionsPage.image}
                  alt="Otázky ke smysluplnému životu"
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
            ) : (
              <div className="relative h-48 bg-gradient-to-br from-primary-100 to-primary-200">
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-6xl">❓</span>
                </div>
              </div>
            )}
            <div className="p-6">
              <h3 className="text-xl font-bold text-text-primary mb-3 group-hover:text-primary-600 transition-colors">
                Otázky ke smysluplnému životu
              </h3>
              <p className="text-text-secondary leading-relaxed mb-4">
                Otázky pro reflexi a seberozvoj, které ti pomohou najít smysl.
              </p>
              <div className="inline-flex items-center gap-2 text-primary-600 font-semibold group-hover:gap-3 transition-all">
                <span>Zobrazit otázky</span>
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Link>

          {/* Special card for "Malé věci" - third card */}
          <Link
            href="/clanky/male-veci"
            className="group bg-white rounded-lg overflow-hidden border border-primary-100 hover:border-primary-300 hover:shadow-xl transition-all duration-300"
          >
            {smallThingsPage?.image ? (
              <div className="relative h-48 overflow-hidden">
                <Image
                  src={smallThingsPage.image}
                  alt="Malé věci s velkým dopadem"
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
            ) : (
              <div className="relative h-48 bg-gradient-to-br from-primary-100 to-primary-200">
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-6xl">✨</span>
                </div>
              </div>
            )}
            <div className="p-6">
              <h3 className="text-xl font-bold text-text-primary mb-3 group-hover:text-primary-600 transition-colors">
                Malé věci s velkým dopadem
              </h3>
              <p className="text-text-secondary leading-relaxed mb-4">
                Malé tipy pro kvalitnější život, které můžeš začít používat hned teď.
              </p>
              <div className="inline-flex items-center gap-2 text-primary-600 font-semibold group-hover:gap-3 transition-all">
                <span>Zobrazit tipy</span>
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Link>
        </div>
        
        {/* Link to all articles */}
        <div className="mt-12 text-center">
          <Link
            href="/knihovna"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white font-semibold rounded-full hover:bg-primary-700 transition-all duration-300 shadow-lg hover:shadow-xl"
          >
            <span>Zobrazit všechny články</span>
            <ArrowRight size={18} />
          </Link>
        </div>
      </div>
    </section>
  )
}
