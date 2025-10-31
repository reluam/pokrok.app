'use client'

import { useState, useEffect } from 'react'
import { Lightbulb, Flag, MessageCircle, Target, Users, Star, Heart, Zap, ChevronLeft, ChevronRight } from 'lucide-react'
import { OfferSection } from '@/lib/admin-types'

const iconMap = {
  Lightbulb,
  Flag,
  MessageCircle,
  Target,
  Users,
  Star,
  Heart,
  Zap
}

export default function Services() {
  const [sections, setSections] = useState<OfferSection[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadSections()
  }, [])

  const defaultSections: OfferSection[] = [
    {
      id: '1',
      title: 'Stanovování cílů',
      description: 'Vytvářejte si jasné a dosažitelné cíle s pomocí inteligentních nástrojů aplikace.',
      icon: 'Target' as const,
      href: '/muj',
      enabled: true,
      order: 1,
      createdAt: '',
      updatedAt: ''
    },
    {
      id: '2',
      title: 'Sledování pokroku',
      description: 'Měřte svůj pokrok a oslavujte úspěchy na cestě k lepšímu životu.',
      icon: 'Flag' as const,
      href: '/muj',
      enabled: true,
      order: 2,
      createdAt: '',
      updatedAt: ''
    },
    {
      id: '3',
      title: 'Osobní rozvoj',
      description: 'Rozvíjejte se systematicky pomocí personalizovaných cvičení a materiálů.',
      icon: 'Lightbulb' as const,
      href: '/muj',
      enabled: true,
      order: 3,
      createdAt: '',
      updatedAt: ''
    }
  ]

  const loadSections = async () => {
    try {
      const response = await fetch('/api/offer-sections')
      if (response.ok) {
        const data = await response.json()
        setSections(data)
      } else {
        console.error('Failed to load offer sections, using defaults')
        setSections(defaultSections)
      }
    } catch (error) {
      console.error('Error loading offer sections, using defaults:', error)
      setSections(defaultSections)
    } finally {
      setLoading(false)
    }
  }

  const getIconComponent = (iconName: string) => {
    const IconComponent = iconMap[iconName as keyof typeof iconMap]
    return IconComponent || Lightbulb
  }

  const visibleSections = sections.slice(currentIndex, currentIndex + 3)
  const canScrollLeft = currentIndex > 0
  const canScrollRight = currentIndex + 3 < sections.length

  const scrollLeft = () => {
    if (canScrollLeft) {
      setCurrentIndex(currentIndex - 1)
    }
  }

  const scrollRight = () => {
    if (canScrollRight) {
      setCurrentIndex(currentIndex + 1)
    }
  }

  if (loading) {
    return (
      <section className="py-20">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 dashed-border">
            {[1, 2, 3].map((i) => (
              <div key={i} className="text-center space-y-4 p-8 animate-pulse">
                <div className="flex justify-center">
                  <div className="w-16 h-16 bg-gray-300 rounded-full"></div>
                </div>
                <div className="h-6 bg-gray-300 rounded mx-auto w-24"></div>
                <div className="h-4 bg-gray-300 rounded mx-auto w-32"></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="py-20">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative">
          {/* Navigation arrows - only show if more than 3 sections */}
          {sections.length > 3 && (
            <>
              <button
                onClick={scrollLeft}
                disabled={!canScrollLeft}
                className={`absolute left-0 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-white shadow-lg border ${
                  canScrollLeft 
                    ? 'text-gray-700 hover:text-primary-500 hover:border-primary-500' 
                    : 'text-gray-300 cursor-not-allowed'
                } transition-colors`}
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                onClick={scrollRight}
                disabled={!canScrollRight}
                className={`absolute right-0 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-white shadow-lg border ${
                  canScrollRight 
                    ? 'text-gray-700 hover:text-primary-500 hover:border-primary-500' 
                    : 'text-gray-300 cursor-not-allowed'
                } transition-colors`}
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 dashed-border">
            {visibleSections.map((section) => {
              const IconComponent = getIconComponent(section.icon)
              return (
                <a
                  key={section.id}
                  href={section.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-center space-y-4 p-8 hover:bg-gray-50 rounded-lg transition-colors group"
                >
                  <div className="flex justify-center">
                    <div className="w-16 h-16 bg-primary-500 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                      <IconComponent className="w-8 h-8 text-white" />
                    </div>
                  </div>
                  <h3 className="text-h3 text-text-primary underline decoration-primary-500 decoration-2 underline-offset-4">
                    {section.title}
                  </h3>
                  <p className="text-p16 text-gray-600">
                    {section.description}
                  </p>
                </a>
              )
            })}
          </div>

          {/* Dots indicator - only show if more than 3 sections */}
          {sections.length > 3 && (
            <div className="flex justify-center mt-8 space-x-2">
              {Array.from({ length: Math.max(0, sections.length - 2) }).map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    index === currentIndex ? 'bg-primary-500' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
