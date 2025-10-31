'use client'

import { useState, useEffect } from 'react'
import { ArrowRight, Sparkles } from 'lucide-react'
import Image from 'next/image'
import { getBaseUrl } from '@/lib/utils'
import { useTranslations } from '@/lib/use-translations'

export default function Hero() {
  const { translations, loading } = useTranslations()

  if (loading) {
    return (
      <section className="h-[85vh] flex items-start pt-32 -mt-10">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="flex items-center justify-center h-full">
            <div className="animate-pulse text-gray-500">Loading...</div>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="h-[85vh] flex items-start pt-32 -mt-10">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          {/* Left side - Text content */}
          <div className="space-y-10">
            {/* Tagline */}
            <div className="flex items-center space-x-3 text-primary-500">
              <Sparkles className="w-5 h-5" />
              <span className="text-asul18">{translations?.hero.tagline || 'Pokrok'}</span>
            </div>

            {/* Main heading */}
            <h1 className="text-h1 text-text-primary">
              {translations?.hero.title || 'Aplikace pro smysluplné žití a osobní rozvoj.'}
            </h1>

            {/* Subtitle */}
            <p className="text-asul18 text-gray-600">
              {translations?.hero.subtitle || 'Najděte svůj smysl, stanovte si cíle a dosáhněte pokroku v každé oblasti života.'}
            </p>

                {/* CTA Button */}
                <div>
                  <a
                    href={`${getBaseUrl()}/muj`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-2 bg-primary-500 text-white px-4 py-3 rounded-lg hover:bg-primary-600 transition-colors text-asul18"
                  >
                    <span>{translations?.hero.cta || 'Otevřít aplikaci'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </a>
                </div>
          </div>

          {/* Right side - Illustration */}
          <div className="relative">
            <div className="relative w-full h-[600px]">
              {/* Orange oval background - positioned behind and to the right */}
              <div className="absolute top-0 right-12 w-[400px] h-[600px] bg-primary-500 rounded-full"></div>
              
              {/* Picture oval - main oval with high quality image */}
              <div className="absolute top-0 left-12 w-[400px] h-[600px] bg-white rounded-full flex items-center justify-center overflow-hidden">
                {/* High quality image */}
                <Image
                  src="/images/hero-image.jpg"
                  alt="Hero image"
                  width={400}
                  height={600}
                  className="w-full h-full object-cover rounded-full"
                  quality={100}
                  priority
                  onError={(e) => {
                    // Fallback to placeholder if image doesn't exist
                    e.currentTarget.style.display = 'none'
                    const nextSibling = e.currentTarget.nextElementSibling as HTMLElement
                    if (nextSibling) {
                      nextSibling.style.display = 'flex'
                    }
                  }}
                />
                <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center hidden">
                  <span className="text-gray-600 text-sm">Add your picture to /public/images/hero-image.jpg</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// New About Coach Section Component
export function AboutCoach() {
  const [videoContent, setVideoContent] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadVideoContent()
  }, [])

  const loadVideoContent = async () => {
    try {
      const response = await fetch('/api/video-content/active')
      if (response.ok) {
        const data = await response.json()
        setVideoContent(data)
      }
    } catch (error) {
      console.error('Error loading video content:', error)
    } finally {
      setLoading(false)
    }
  }

  const renderVideo = () => {
    if (!videoContent) {
      return (
        <div className="relative aspect-video bg-gray-200 rounded-lg overflow-hidden shadow-lg">
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-300 to-gray-400">
            <div className="text-center">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                <svg className="w-8 h-8 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z"/>
                </svg>
              </div>
              <p className="text-asul16 text-gray-600">Video placeholder</p>
              <p className="text-asul10 text-gray-500 mt-2">Add your video here</p>
            </div>
          </div>
        </div>
      )
    }

    if (videoContent.embedCode) {
      return (
        <div 
          className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden shadow-lg"
          dangerouslySetInnerHTML={{ __html: videoContent.embedCode }}
        />
      )
    }

    // Check if it's a YouTube URL
    const youtubeMatch = videoContent.videoUrl.match(/(?:youtube\.com\/embed\/|youtu\.be\/)([a-zA-Z0-9_-]+)/)
    if (youtubeMatch) {
      return (
        <iframe
          className="w-full aspect-video rounded-lg shadow-lg"
          src={videoContent.videoUrl}
          title={videoContent.title}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      )
    }

    // Check if it's a Vimeo URL
    const vimeoMatch = videoContent.videoUrl.match(/vimeo\.com\/(\d+)/)
    if (vimeoMatch) {
      return (
        <iframe
          className="w-full aspect-video rounded-lg shadow-lg"
          src={`https://player.vimeo.com/video/${vimeoMatch[1]}`}
          title={videoContent.title}
          frameBorder="0"
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
        />
      )
    }

    // For other video URLs
    return (
      <video
        className="w-full aspect-video rounded-lg shadow-lg"
        controls
        poster={videoContent.thumbnailUrl}
      >
        <source src={videoContent.videoUrl} type="video/mp4" />
        Your browser does not support the video tag.
      </video>
    )
  }

  if (loading) {
    return (
      <section className="pt-28 pb-20">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-h2 text-text-primary mb-8">
              Poznej svého kouče
            </h1>
          </div>
          
          <div className="flex justify-center">
            <div className="w-full max-w-[65%]">
              <div className="relative aspect-video bg-gray-200 rounded-lg overflow-hidden shadow-lg animate-pulse">
                <div className="absolute inset-0 bg-gray-300"></div>
              </div>
            </div>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="pt-28 pb-20">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-h2 text-text-primary mb-8">
            O aplikaci Pokrok
          </h1>
        </div>
        
        <div className="flex justify-center">
          <div className="w-full max-w-[65%]">
            {renderVideo()}
            {videoContent && videoContent.title && (
              <div className="text-center mt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-2">{videoContent.title}</h3>
                {videoContent.description && (
                  <p className="text-gray-600">{videoContent.description}</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
