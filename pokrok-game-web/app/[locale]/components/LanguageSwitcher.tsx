'use client'

import { useLocale } from 'next-intl'
import { useRouter, usePathname } from 'next/navigation'
import { Globe } from 'lucide-react'
import { useState } from 'react'
import { locales, type Locale } from '@/i18n/config'

export function LanguageSwitcher() {
  const locale = useLocale() as Locale
  const router = useRouter()
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)

  const switchLocale = (newLocale: Locale) => {
    setIsOpen(false)
    
    // Handle locale switching with 'as-needed' prefix strategy
    // Current locale might or might not have prefix in URL
    let newPathname: string
    
    // Check if current path has a locale prefix
    const hasLocalePrefix = locales.some(l => pathname.startsWith(`/${l}/`) || pathname === `/${l}`)
    
    if (hasLocalePrefix) {
      // Replace existing locale prefix (en is default, no prefix needed)
      newPathname = pathname.replace(/^\/(cs|en)/, newLocale === 'en' ? '' : `/${newLocale}`)
    } else {
      // No locale prefix (default locale en), add new one if needed
      newPathname = newLocale === 'en' ? pathname : `/${newLocale}${pathname}`
    }
    
    // Ensure we have a valid path
    // Ensure we have a valid path (en is default, no prefix needed)
    if (!newPathname || newPathname === '') {
      newPathname = newLocale === 'en' ? '/' : `/${newLocale}`
    }
    
    router.push(newPathname)
    router.refresh()
  }

  const languages = [
    { code: 'cs' as Locale, name: 'Čeština', flag: '🇨🇿' },
    { code: 'en' as Locale, name: 'English', flag: '🇺🇸' }
  ]

  const currentLanguage = languages.find(lang => lang.code === locale)

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white bg-opacity-80 hover:bg-opacity-100 transition-colors border border-gray-200 shadow-sm"
        aria-label="Switch language"
      >
        <Globe className="w-4 h-4" />
        <span className="text-sm font-medium">{currentLanguage?.flag} {currentLanguage?.name}</span>
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => switchLocale(lang.code)}
                className={`w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors flex items-center gap-2 ${
                  locale === lang.code ? 'bg-blue-50 font-semibold' : ''
                }`}
              >
                <span>{lang.flag}</span>
                <span>{lang.name}</span>
                {locale === lang.code && (
                  <span className="ml-auto text-blue-600">✓</span>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

