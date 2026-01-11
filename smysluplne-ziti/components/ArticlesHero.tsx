'use client'

import { useEffect, useState, useRef } from 'react'
import { ChevronLeft, ChevronRight, FileText, Calendar, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { Article } from '@/lib/articles'

export default function ArticlesHero() {
  const [articles, setArticles] = useState<Article[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [isTruncated, setIsTruncated] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch('/api/articles?published=true')
      .then(res => res.json())
      .then(data => {
        const latestArticles = (data.articles || []).slice(0, 5)
        setArticles(latestArticles)
        setLoading(false)
      })
      .catch(err => {
        console.error('Error fetching articles:', err)
        setLoading(false)
      })
  }, [])

  useEffect(() => {
    // Kontrola, zda je obsah zkrácen
    if (contentRef.current) {
      const element = contentRef.current
      setIsTruncated(element.scrollHeight > element.clientHeight)
    }
  }, [currentIndex, articles])

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % articles.length)
  }

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + articles.length) % articles.length)
  }

  const goToSlide = (index: number) => {
    setCurrentIndex(index)
  }

  if (loading) {
    return null
  }

  if (articles.length === 0) {
    return null
  }

  const currentArticle = articles[currentIndex]

  return (
    <section className="relative min-h-[90vh] flex items-center overflow-hidden pt-20">
      {/* Background gradient for when no image */}
      {!currentArticle.image && (
        <div className="absolute inset-0 bg-gradient-to-br from-primary-50 via-background via-60% to-playful-yellow-light/30">
          {/* Animated background blobs */}
          <div className="absolute top-20 left-10 w-72 h-72 bg-playful-pink-light rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob"></div>
          <div className="absolute top-40 right-10 w-72 h-72 bg-playful-yellow-light rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-8 left-1/2 w-72 h-72 bg-playful-purple-light rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-4000"></div>
        </div>
      )}

      <div className="relative z-10 w-full h-full">
        <div className="relative h-full flex flex-col md:flex-row items-stretch">
          {/* Image with text overlay on mobile, separate on desktop */}
          <div className="w-full md:w-2/5 relative h-[60vh] md:h-auto order-1 md:order-2">
            {currentArticle.image ? (
              <>
                <Image
                  src={currentArticle.image}
                  alt={currentArticle.title}
                  fill
                  className="object-cover"
                  priority
                />
                {/* Filter overlay for better text readability on mobile */}
                <div className="absolute inset-0 bg-black/50 md:bg-white/30"></div>
                {/* Gradient overlay for readability */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/40 md:bg-gradient-to-l md:from-transparent md:via-primary-500/20 md:to-primary-600/30"></div>
              </>
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary-100 to-primary-200"></div>
            )}

            {/* Text content on image for mobile */}
            <div className="md:hidden absolute inset-0 flex flex-col justify-end p-6 z-10">
              <h1 className="text-3xl font-bold text-white mb-4 leading-tight drop-shadow-lg">
                {currentArticle.title}
              </h1>
              <p className="text-lg text-white/90 leading-relaxed mb-6 drop-shadow-md line-clamp-3">
                {currentArticle.excerpt}
              </p>
              <Link
                href={`/clanky/${currentArticle.slug}`}
                className="group inline-flex items-center gap-2 text-white hover:text-primary-200 font-semibold text-lg transition-all"
              >
                <span>Číst celý článek</span>
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            {/* Navigation arrows */}
            {articles.length > 1 && (
              <>
                <button
                  onClick={prevSlide}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:text-primary-200 transition-colors z-20 md:hidden"
                  aria-label="Předchozí článek"
                >
                  <ChevronLeft size={32} />
                </button>
                <button
                  onClick={nextSlide}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:text-primary-200 transition-colors z-20 md:z-10"
                  aria-label="Další článek"
                >
                  <ChevronRight size={32} className="md:w-10 md:h-10" />
                </button>
              </>
            )}
          </div>

          {/* Text content - desktop only (3/5) */}
          <div className="hidden md:flex w-3/5 bg-white/50 backdrop-blur-md shadow-2xl p-8 md:p-12 lg:p-16 flex-col justify-center relative order-2 md:order-1">
            {/* Left arrow - desktop only */}
            {articles.length > 1 && (
              <button
                onClick={prevSlide}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-text-primary hover:text-primary-600 transition-colors z-10"
                aria-label="Předchozí článek"
              >
                <ChevronLeft size={32} className="md:w-10 md:h-10" />
              </button>
            )}

            <div className="flex-1 flex flex-col justify-center">
              <h1 className="text-4xl lg:text-5xl xl:text-6xl font-bold text-text-primary mb-6 leading-tight">
                {currentArticle.title}
              </h1>

              <p className="text-xl lg:text-2xl text-text-primary leading-relaxed">
                {currentArticle.excerpt}
              </p>

              {/* Read more link */}
              <div className="mt-8">
                <Link
                  href={`/clanky/${currentArticle.slug}`}
                  className="group inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-semibold text-lg transition-all"
                >
                  <span>Číst celý článek</span>
                  <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Dots indicator */}
        {articles.length > 1 && (
          <div className="flex justify-center gap-2 mt-8">
            {articles.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`h-2 rounded-full transition-all ${
                  index === currentIndex
                    ? 'bg-primary-600 w-8 shadow-lg'
                    : 'bg-primary-300 hover:bg-primary-400 w-2'
                }`}
                aria-label={`Přejít na článek ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
