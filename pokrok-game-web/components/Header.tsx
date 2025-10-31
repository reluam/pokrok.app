'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Menu, X, ArrowRight } from 'lucide-react'
import { getBaseUrl } from '@/lib/utils'
import { LanguageSwitcher } from './LanguageSwitcher'
import { useTranslations } from '@/lib/use-translations'

interface NavigationSettings {
  coaching_enabled: boolean
  workshops_enabled: boolean
}

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [navSettings, setNavSettings] = useState<NavigationSettings>({
    coaching_enabled: false,
    workshops_enabled: false
  })
  const { translations } = useTranslations()

  useEffect(() => {
    loadNavigationSettings()
  }, [])

  const loadNavigationSettings = async () => {
    try {
      const response = await fetch('/api/navigation-settings')
      if (response.ok) {
        const settings = await response.json()
        setNavSettings(settings)
      }
    } catch (error) {
      console.error('Error loading navigation settings:', error)
    }
  }

  const closeMenu = () => {
    setIsMenuOpen(false)
  }

  return (
    <header className="sticky top-0 z-50 pt-2.5 pb-2.5 bg-background" style={{
      backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.15'/%3E%3C/svg%3E")`,
      backgroundRepeat: 'repeat',
      backgroundSize: '100px 100px'
    }}>
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link href="/" className="block">
              <div className="relative h-16 w-64">
                <Image
                  src="/images/logo.png"
                  alt="Pokrok - Aplikace pro osobní rozvoj"
                  fill
                  className="object-contain hover:opacity-80 transition-opacity"
                  priority
                />
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8 ml-auto mr-4">
            <Link href="/materialy" className="text-asul18 text-text-primary hover:text-primary-600 transition-colors">
              {translations?.navigation.materials || 'Materiály'}
            </Link>
            <Link href="/o-mne" className="text-asul18 text-text-primary hover:text-primary-600 transition-colors">
              {translations?.navigation.about || 'O aplikaci'}
            </Link>
          </nav>

          {/* Language Switcher */}
          <div className="hidden md:block mr-4">
            <LanguageSwitcher />
          </div>

              {/* App Button */}
              <div className="hidden md:block">
                <a
                  href={`${getBaseUrl()}/muj`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-primary-500 text-white px-4 py-3 rounded-lg hover:bg-primary-600 transition-colors flex items-center space-x-2 text-asul18"
                >
                  <span>{translations?.hero.cta || 'Otevřít aplikaci'}</span>
                  <ArrowRight className="w-4 h-4" />
                </a>
              </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-700 hover:text-primary-600"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-background border-t">
              <Link href="/materialy" onClick={closeMenu} className="block px-3 py-2 text-asul18 text-text-primary hover:text-primary-600">
                {translations?.navigation.materials || 'Materiály'}
              </Link>
              <Link href="/o-mne" onClick={closeMenu} className="block px-3 py-2 text-asul18 text-text-primary hover:text-primary-600">
                {translations?.navigation.about || 'O aplikaci'}
              </Link>
              <div className="px-3 py-2">
                <LanguageSwitcher />
              </div>
              <a
                href={`${getBaseUrl()}/muj`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={closeMenu}
                className="block px-4 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 flex items-center space-x-2 text-asul18"
              >
                <span>{translations?.hero.cta || 'Otevřít aplikaci'}</span>
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
