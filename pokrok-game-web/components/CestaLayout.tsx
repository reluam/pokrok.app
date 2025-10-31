'use client'

import { useRouter } from 'next/navigation'
import { UserButton } from '@clerk/nextjs'
import { Settings, Home, Target, Footprints, FileText } from 'lucide-react'
import { memo } from 'react'
import { useTranslations } from '@/lib/use-translations'

interface CestaLayoutProps {
  children: React.ReactNode
  title: string
  subtitle?: string
  currentPage?: string
}

export const CestaLayout = memo(function CestaLayout({ children, title, subtitle, currentPage }: CestaLayoutProps) {
  const router = useRouter()
  const { translations } = useTranslations()

  return (
    <div className="h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-primary-100 flex-shrink-0">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            {/* Left side - Main Panel */}
            <div className="flex-shrink-0">
              <button
                onClick={() => router.push('/muj')}
                className={`flex items-center space-x-2 transition-all duration-200 ${
                  currentPage === '/muj' 
                    ? 'text-primary-600 bg-primary-50 px-3 py-2 rounded-lg' 
                    : 'text-gray-600 hover:text-primary-600'
                }`}
              >
                <Home className="w-5 h-5 text-primary-500" />
                <span className="text-sm font-medium">{translations?.app.mainDashboard || 'Hlavní panel'}</span>
                {currentPage === '/muj' && subtitle && (
                  <span className="text-xs text-gray-500 ml-2">{subtitle}</span>
                )}
              </button>
            </div>
            
            {/* Center - Navigation items */}
            <div className="flex-1 flex justify-end pr-8">
              <div className="flex items-center space-x-8">
                <button
                  onClick={() => router.push('/muj/cile')}
                  className={`flex items-center space-x-2 transition-all duration-200 ${
                    currentPage === '/muj/cile' 
                      ? 'text-primary-600 bg-primary-50 px-3 py-2 rounded-lg' 
                      : 'text-gray-600 hover:text-primary-600'
                  }`}
                >
                  <Target className="w-5 h-5 text-primary-500" />
                  <span className="text-sm font-medium">{translations?.app.goals || 'Cíle'}</span>
                  {currentPage === '/muj/cile' && subtitle && (
                    <span className="text-xs text-gray-500 ml-2">{subtitle}</span>
                  )}
                </button>
                <button
                  onClick={() => router.push('/muj/kroky')}
                  className={`flex items-center space-x-2 transition-all duration-200 ${
                    currentPage === '/muj/kroky' 
                      ? 'text-primary-600 bg-primary-50 px-3 py-2 rounded-lg' 
                      : 'text-gray-600 hover:text-primary-600'
                  }`}
                >
                  <Footprints className="w-5 h-5 text-primary-500" />
                  <span className="text-sm font-medium">{translations?.app.steps || 'Kroky'}</span>
                  {currentPage === '/muj/kroky' && subtitle && (
                    <span className="text-xs text-gray-500 ml-2">{subtitle}</span>
                  )}
                </button>
                <button
                  onClick={() => router.push('/muj/poznamky')}
                  className={`flex items-center space-x-2 transition-all duration-200 ${
                    currentPage === '/muj/poznamky' 
                      ? 'text-primary-600 bg-primary-50 px-3 py-2 rounded-lg' 
                      : 'text-gray-600 hover:text-primary-600'
                  }`}
                >
                  <FileText className="w-5 h-5 text-primary-500" />
                  <span className="text-sm font-medium">{translations?.app.notes || 'Poznámky'}</span>
                  {currentPage === '/muj/poznamky' && subtitle && (
                    <span className="text-xs text-gray-500 ml-2">{subtitle}</span>
                  )}
                </button>
                <button
                  onClick={() => router.push('/muj/nastaveni')}
                  className={`flex items-center space-x-2 transition-all duration-200 ${
                    currentPage === '/muj/nastaveni' 
                      ? 'text-primary-600 bg-primary-50 px-3 py-2 rounded-lg' 
                      : 'text-gray-600 hover:text-primary-600'
                  }`}
                >
                  <Settings className="w-5 h-5 text-primary-500" />
                  <span className="text-sm font-medium">{translations?.app.settings || 'Nastavení'}</span>
                  {currentPage === '/muj/nastaveni' && subtitle && (
                    <span className="text-xs text-gray-500 ml-2">{subtitle}</span>
                  )}
                </button>
              </div>
            </div>
            
            {/* Right side - User Button */}
            <div className="flex-shrink-0">
              <UserButton afterSignOutUrl="https://accounts.pokrok.app/sign-in" />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 min-h-0">
        {children}
      </main>
    </div>
  )
})
