'use client'

import { useTranslations } from 'next-intl'
import { HelpCircle, Settings, Menu } from 'lucide-react'

interface HeaderNavigationProps {
  currentPage: 'main' | 'statistics' | 'achievements' | 'settings' | 'help'
  setCurrentPage: (page: 'main' | 'statistics' | 'achievements' | 'settings' | 'help') => void
  mainPanelSection: string
  setMainPanelSection: (section: string) => void
  topMenuItems: Array<{ id: string; label: string; icon: any }>
  totalXp: number
  loginStreak: number
  mobileTopMenuOpen: boolean
  setMobileTopMenuOpen: (open: boolean) => void
}

export function HeaderNavigation({
  currentPage,
  setCurrentPage,
  mainPanelSection,
  setMainPanelSection,
  topMenuItems,
  totalXp,
  loginStreak,
  mobileTopMenuOpen,
  setMobileTopMenuOpen,
}: HeaderNavigationProps) {
  const t = useTranslations()

  return (
    <>
      {/* Header */}
      <div className="relative overflow-visible w-full bg-orange-600" style={{
        boxShadow: '0 4px 12px rgba(234, 88, 12, 0.3)',
        zIndex: 100
      }}>
        <div className="relative z-10 py-3 px-6">
          {/* Single Row: Section Name and Menu */}
          <div className="flex items-center justify-between">
            {/* Left - Section Name (mobile) or Full Menu (desktop) */}
            <div className="flex items-center space-x-4">
              {/* Desktop: Full menu buttons */}
              <div className="hidden md:flex items-center space-x-4">
                <button
                  onClick={() => setCurrentPage('main')}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white hover:bg-opacity-20 transition-all duration-200 text-white ${currentPage === 'main' ? 'bg-white bg-opacity-25' : ''}`}
                  title={t('game.menu.mainPanel')}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                    <polyline points="9,22 9,12 15,12 15,22"/>
                  </svg>
                  <span className="text-sm font-medium">{t('game.menu.mainPanel')}</span>
                </button>
              </div>
              
              {/* Mobile: Section name only */}
              <div className="md:hidden">
                <span className="text-sm font-medium text-white">
                  {currentPage === 'main' && t('game.menu.mainPanel')}
                  {currentPage === 'help' && t('help.title')}
                  {currentPage === 'settings' && t('game.menu.settings')}
                  {currentPage === 'statistics' && 'Statistiky'}
                  {currentPage === 'achievements' && 'Úspěchy'}
                </span>
              </div>
            </div>

            {/* Right - Statistics and Menu Icons */}
            <div className="flex items-center gap-6">
              {/* Statistics - Hidden on small screens, visible from lg breakpoint */}
              <div className="hidden lg:flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <svg className="w-4 h-4 text-white opacity-90" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                  </svg>
                  <span className="text-white font-semibold text-sm">{totalXp}</span>
                  <span className="text-white opacity-75 text-xs">XP</span>
                </div>

                <div className="flex items-center gap-1.5">
                  <svg className="w-4 h-4 text-white opacity-90" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M13.5.67s.74 2.65.74 4.8c0 2.06-1.35 3.73-3.41 3.73-2.07 0-3.63-1.67-3.63-3.73l.03-.36C5.21 7.51 4 10.62 4 14c0 4.42 3.58 8 8 8s8-3.58 8-8C20 8.61 17.41 3.8 13.5.67zM11.71 19c-1.78 0-3.22-1.4-3.22-3.14 0-1.62 1.05-2.76 2.81-3.12 1.77-.36 3.6-1.21 4.62-2.58.39 1.29.59 2.65.59 4.04 0 2.65-2.15 4.8-4.8 4.8z"/>
                  </svg>
                  <span className="text-white font-semibold text-sm">{loginStreak}</span>
                  <span className="text-white opacity-75 text-xs">Streak</span>
                </div>
              </div>

              {/* Menu Icons - Desktop: Full buttons, Mobile: Hamburger menu */}
              <div className="hidden md:flex items-center space-x-4 lg:border-l lg:border-white lg:border-opacity-30 lg:pl-6">
                {/* Goals, Habits, Steps buttons */}
                {topMenuItems.map((item) => {
                  const Icon = item.icon
                  const isActive = currentPage === 'main' && mainPanelSection === item.id
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setCurrentPage('main')
                        setMainPanelSection(item.id)
                      }}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white hover:bg-opacity-20 transition-all duration-200 text-white ${isActive ? 'bg-white bg-opacity-25' : ''}`}
                      title={item.label}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="text-sm font-medium">{item.label}</span>
                    </button>
                  )
                })}
              
                <button
                  onClick={() => setCurrentPage('help')}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white hover:bg-opacity-20 transition-all duration-200 text-white ${currentPage === 'help' ? 'bg-white bg-opacity-25' : ''}`}
                  title={t('help.title')}
                >
                  <HelpCircle className="w-5 h-5" />
                  <span className="text-sm font-medium">{t('help.title')}</span>
                </button>
              
                <button
                  onClick={() => setCurrentPage('settings')}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white hover:bg-opacity-20 transition-all duration-200 text-white ${currentPage === 'settings' ? 'bg-white bg-opacity-25' : ''}`}
                  title={t('game.menu.settings')}
                >
                  <Settings className="w-5 h-5" strokeWidth="2" />
                  <span className="text-sm font-medium">{t('game.menu.settings')}</span>
                </button>
              </div>
              
              {/* Mobile: Hamburger menu */}
              <div className="md:hidden relative">
                <button
                  onClick={() => setMobileTopMenuOpen(!mobileTopMenuOpen)}
                  className="p-2 rounded-lg hover:bg-white hover:bg-opacity-20 transition-all duration-200 text-white"
                  title="Menu"
                >
                  <Menu className="w-5 h-5" />
                </button>
                
                {/* Mobile top menu dropdown */}
                {mobileTopMenuOpen && (
                  <>
                    {/* Backdrop */}
                    <div 
                      className="fixed inset-0 z-[100]" 
                      onClick={() => setMobileTopMenuOpen(false)}
                    />
                    <div className="fixed right-6 top-16 bg-white border border-gray-200 rounded-lg shadow-lg z-[101] min-w-[200px]">
                      <nav className="py-2">
                        {/* Main Panel button */}
                        <button
                          onClick={() => {
                            setCurrentPage('main')
                            setMainPanelSection('overview')
                            setMobileTopMenuOpen(false)
                          }}
                          className={`w-full flex items-center gap-3 px-4 py-3 transition-colors text-left ${
                            currentPage === 'main' && mainPanelSection === 'overview'
                              ? 'bg-orange-600 text-white'
                              : 'text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                            <polyline points="9,22 9,12 15,12 15,22"/>
                          </svg>
                          <span className="font-medium">{t('game.menu.mainPanel')}</span>
                        </button>
                        
                        {/* Goals, Habits, Steps buttons */}
                        {topMenuItems.map((item) => {
                          const Icon = item.icon
                          const isActive = currentPage === 'main' && mainPanelSection === item.id
                          return (
                            <button
                              key={item.id}
                              onClick={() => {
                                setCurrentPage('main')
                                setMainPanelSection(item.id)
                                setMobileTopMenuOpen(false)
                              }}
                              className={`w-full flex items-center gap-3 px-4 py-3 transition-colors text-left ${
                                isActive
                                  ? 'bg-orange-600 text-white'
                                  : 'text-gray-700 hover:bg-gray-100'
                              }`}
                            >
                              <Icon className="w-5 h-5" />
                              <span className="font-medium">{item.label}</span>
                            </button>
                          )
                        })}
                        
                        <button
                          onClick={() => {
                            setCurrentPage('help')
                            setMobileTopMenuOpen(false)
                          }}
                          className={`w-full flex items-center gap-3 px-4 py-3 transition-colors text-left ${
                            currentPage === 'help'
                              ? 'bg-orange-600 text-white'
                              : 'text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          <HelpCircle className="w-5 h-5" />
                          <span className="font-medium">{t('help.title')}</span>
                        </button>
                        <button
                          onClick={() => {
                            setCurrentPage('settings')
                            setMobileTopMenuOpen(false)
                          }}
                          className={`w-full flex items-center gap-3 px-4 py-3 transition-colors text-left ${
                            currentPage === 'settings'
                              ? 'bg-orange-600 text-white'
                              : 'text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          <Settings className="w-5 h-5" strokeWidth="2" />
                          <span className="font-medium">{t('game.menu.settings')}</span>
                        </button>
                      </nav>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom divider line - separates menu from page content */}
        <div className="h-px bg-orange-300 opacity-50 w-full"></div>
      </div>
    </>
  )
}

