import { notFound } from 'next/navigation'
import { ArrowLeft, Calendar, FileText, Book, Video, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { getArticleBySlug } from '@/lib/articles'
import { getInspirationData } from '@/lib/inspiration'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

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

  // Načíst inspirace přiřazené k článku
  const inspirationData = getInspirationData()
  const allInspirations = [
    ...(inspirationData.articles || []),
    ...(inspirationData.videos || []),
    ...(inspirationData.books || []),
  ]
  const articleInspirations = allInspirations.filter(insp => 
    article.inspirationIds?.includes(insp.id)
  )

  const getIcon = (type: string) => {
    switch (type) {
      case 'article': return FileText
      case 'video': return Video
      case 'book': return Book
      default: return FileText
    }
  }

  return (
    <article className="section-padding relative overflow-hidden pt-20">
        
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          {/* Back button */}
          <Link
            href="/clanky"
            className="inline-flex items-center gap-2 text-text-secondary hover:text-primary-600 mb-6 md:mb-8 transition-colors"
          >
            <ArrowLeft size={18} />
            <span className="text-sm md:text-base">Zpět na seznam článků</span>
          </Link>

          {/* Article header */}
          <header className="mb-8 md:mb-12">
            <div className="flex items-center gap-2 mb-3 md:mb-4">
              <FileText className="text-primary-600" size={18} />
              <span className="text-xs md:text-sm text-primary-600 font-semibold">Článek</span>
            </div>
            <h1 className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-text-primary mb-4 md:mb-6">
              {article.title}
            </h1>
            <div className="flex items-center gap-4 text-text-light">
              <div className="flex items-center gap-2">
                <Calendar size={14} />
                <span className="text-xs md:text-sm">{new Date(article.createdAt).toLocaleDateString('cs-CZ', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}</span>
              </div>
            </div>
          </header>

          {/* Article content */}
          <div className="mb-6 md:mb-8">
            <div className="prose prose-lg max-w-none prose-headings:text-text-primary prose-p:text-text-primary prose-strong:text-text-primary prose-a:text-primary-600 prose-a:no-underline hover:prose-a:underline prose-ul:text-text-primary prose-ol:text-text-primary prose-li:text-text-primary prose-blockquote:text-text-secondary prose-code:text-primary-600 prose-pre:bg-primary-50">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  h1: ({node, ...props}) => <h1 className="text-4xl font-bold text-text-primary mb-6 mt-8" {...props} />,
                  h2: ({node, ...props}) => <h2 className="text-3xl font-bold text-text-primary mb-4 mt-6" {...props} />,
                  h3: ({node, ...props}) => <h3 className="text-2xl font-bold text-text-primary mb-3 mt-5" {...props} />,
                  p: ({node, ...props}) => <p className="mb-4 text-lg leading-relaxed text-text-primary" {...props} />,
                  ul: ({node, ...props}) => <ul className="list-disc list-inside mb-4 space-y-2 text-text-primary" {...props} />,
                  ol: ({node, ...props}) => <ol className="list-decimal list-inside mb-4 space-y-2 text-text-primary" {...props} />,
                  li: ({node, ...props}) => <li className="ml-4 text-text-primary" {...props} />,
                  strong: ({node, ...props}) => <strong className="font-bold text-text-primary" {...props} />,
                  em: ({node, ...props}) => <em className="italic text-text-primary" {...props} />,
                  a: ({node, ...props}) => <a className="text-primary-600 hover:text-primary-700 underline font-semibold" {...props} />,
                  blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-primary-300 pl-4 italic text-text-secondary my-4" {...props} />,
                  code: ({node, ...props}) => <code className="bg-primary-100 text-primary-700 px-2 py-1 rounded text-sm font-mono" {...props} />,
                  pre: ({node, ...props}) => <pre className="bg-primary-50 p-4 rounded-lg overflow-x-auto mb-4" {...props} />,
                }}
              >
                {article.content}
              </ReactMarkdown>
            </div>
          </div>

          {/* Related inspirations */}
          {articleInspirations.length > 0 && (
            <div className="space-y-4 md:space-y-6">
              <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-text-primary">
                Související inspirace
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                {articleInspirations.map((inspiration) => {
                  const Icon = getIcon(inspiration.type)
                  return (
                    <a
                      key={inspiration.id}
                      href={inspiration.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group block bg-primary-50 p-4 md:p-5 border-2 border-primary-100 hover:border-primary-300 transition-all duration-300"
                    >
                      <div className="flex items-start justify-between mb-2 md:mb-3">
                        <div className="p-2 bg-primary-100 group-hover:bg-primary-200 transition-colors">
                          <Icon className="text-primary-600" size={16} />
                        </div>
                        <ExternalLink className="text-text-light group-hover:text-primary-600 transition-colors" size={14} />
                      </div>
                      <h3 className="text-base md:text-lg font-bold text-text-primary mb-2 group-hover:text-primary-600 transition-colors">
                        {inspiration.title}
                      </h3>
                      {inspiration.author && (
                        <p className="text-xs md:text-sm text-primary-600 mb-2 font-semibold">{inspiration.author}</p>
                      )}
                      <p className="text-xs md:text-sm text-text-secondary line-clamp-2">
                        {inspiration.description}
                      </p>
                    </a>
                  )
                })}
              </div>
            </div>
          )}
        </div>
    </article>
  )
}

