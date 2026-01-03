import { notFound } from 'next/navigation'
import { ArrowLeft, Calendar, FileText } from 'lucide-react'
import Link from 'next/link'
import { getArticleBySlug } from '@/lib/articles'

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const article = getArticleBySlug(params.slug)
  
  if (!article || !article.published) {
    return {
      title: 'Článek nenalezen',
    }
  }

  return {
    title: `${article.title} | Smyslužití`,
    description: article.excerpt,
  }
}

export default function ArticlePage({ params }: { params: { slug: string } }) {
  const article = getArticleBySlug(params.slug)

  if (!article || !article.published) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-background">
      <article className="section-padding relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-playful-purple-light rounded-full mix-blend-multiply filter blur-3xl opacity-20 -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-playful-pink-light rounded-full mix-blend-multiply filter blur-3xl opacity-20 translate-y-1/2 -translate-x-1/2"></div>
        
        <div className="max-w-4xl mx-auto container-padding relative">
          {/* Back button */}
          <Link
            href="/clanky"
            className="inline-flex items-center gap-2 text-text-secondary hover:text-primary-600 mb-8 transition-colors"
          >
            <ArrowLeft size={20} />
            <span>Zpět na seznam článků</span>
          </Link>

          {/* Article header */}
          <header className="mb-12">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="text-primary-600" size={20} />
              <span className="text-sm text-primary-600 font-semibold">Článek</span>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-text-primary mb-6">
              {article.title}
            </h1>
            <div className="flex items-center gap-4 text-text-light">
              <div className="flex items-center gap-2">
                <Calendar size={16} />
                <span>{new Date(article.createdAt).toLocaleDateString('cs-CZ', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}</span>
              </div>
            </div>
          </header>

          {/* Article content */}
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-8 md:p-12 border border-primary-100">
            <div 
              className="prose prose-lg max-w-none text-text-primary"
              dangerouslySetInnerHTML={{ __html: article.content.replace(/\n/g, '<br>') }}
              style={{
                lineHeight: '1.8',
                fontSize: '1.125rem',
              }}
            />
          </div>
        </div>
      </article>
    </div>
  )
}

