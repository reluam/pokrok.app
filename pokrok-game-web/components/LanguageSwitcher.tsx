'use client'

import { useState, useEffect } from 'react'
import { Globe } from 'lucide-react'
import { useLocale, type Locale } from '@/lib/use-translations'

export function LanguageSwitcher() {
  const [isOpen, setIsOpen] = useState(false)
  const [currentLocale, setCurrentLocale] = useState<Locale>(() => {
    // Initialize with the correct locale from localStorage immediately
    if (typeof window !== 'undefined') {
      const appLanguagePreference = localStorage.getItem('app-language-preference') as Locale
      if (appLanguagePreference && ['cs', 'en'].includes(appLanguagePreference)) {
        return appLanguagePreference
      }
      
      const savedLocale = localStorage.getItem('preferred-locale') as Locale
      if (savedLocale && ['cs', 'en'].includes(savedLocale)) {
        return savedLocale
      }
    }
    return 'cs'
  })

  useEffect(() => {
    // Listen for locale changes
    const handleLocaleChange = (event: CustomEvent) => {
      setCurrentLocale(event.detail.locale)
    }
    
    window.addEventListener('locale-change', handleLocaleChange as EventListener)
    
    return () => {
      window.removeEventListener('locale-change', handleLocaleChange as EventListener)
    }
  }, [])

  const handleLanguageChange = (locale: Locale) => {
    setIsOpen(false)
    setCurrentLocale(locale)
    
    // Save to both localStorage keys for consistency
    localStorage.setItem('preferred-locale', locale)
    localStorage.setItem('app-language-preference', locale)
    
    // Trigger a custom event to notify other components
    window.dispatchEvent(new CustomEvent('locale-change', { detail: { locale } }))
  }

  const languages = [
    { code: 'cs' as Locale, name: 'Čeština', flag: '🇨🇿' },
    { code: 'en' as Locale, name: 'English', flag: '🇺🇸' }
  ]

  const currentLanguage = languages.find(lang => lang.code === currentLocale)

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
        aria-label="Change language"
      >
        <Globe className="w-4 h-4" />
        <span className="text-sm font-medium">
          {currentLanguage?.flag} {currentLanguage?.name}
        </span>
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown */}
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
            <div className="py-1">
              {languages.map((language) => (
                <button
                  key={language.code}
                  onClick={() => handleLanguageChange(language.code)}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors flex items-center space-x-3 ${
                    currentLocale === language.code ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                  }`}
                >
                  <span className="text-lg">{language.flag}</span>
                  <span>{language.name}</span>
                  {currentLocale === language.code && (
                    <span className="ml-auto text-blue-600">✓</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
