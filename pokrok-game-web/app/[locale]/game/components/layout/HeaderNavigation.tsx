'use client'

import { useTranslations } from 'next-intl'
import { HelpCircle, Settings, Menu } from 'lucide-react'

interface HeaderNavigationProps {
  currentPage: 'main' | 'goals' | 'habits' | 'steps' | 'statistics' | 'achievements' | 'settings' | 'help'
  setCurrentPage: (page: 'main' | 'goals' | 'habits' | 'steps' | 'statistics' | 'achievements' | 'settings' | 'help') => void
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
      <div className="relative overflow-visible w-full bg-white border-b-4 border-primary-500" style={{
        zIndex: 100
      }}>
        <div className="relative z-10 py-3 px-4 sm:px-6">
          {/* Single Row: Section Name and Menu */}
          <div className="flex items-center justify-between">
            {/* Left - Section Name (mobile) or Full Menu (desktop) */}
            <div className="flex items-center gap-3 sm:gap-4">
              {/* Desktop: Full menu buttons */}
              <div className="hidden md:flex items-center gap-2">
                <button
                  onClick={() => {
                    // Load last opened view from localStorage
                    if (typeof window !== 'undefined') {
                      try {
                        const savedSection = localStorage.getItem('journeyGame_mainPanelSection')
                        if (savedSection) {
                          // Migrate old 'overview' to 'focus-day'
                          const sectionToUse = savedSection === 'overview' ? 'focus-day' : savedSection
                          setMainPanelSection(sectionToUse)
                        } else {
                          // Default to focus-day if nothing saved
                          setMainPanelSection('focus-day')
                        }
                      } catch (error) {
                        console.error('Error loading mainPanelSection:', error)
                        setMainPanelSection('focus-day')
                      }
                    }
                    setCurrentPage('main')
                  }}
                  className={`btn-playful-nav flex items-center gap-2 px-3 py-2 text-sm font-semibold ${currentPage === 'main' ? 'active border-2 border-primary-500 rounded-playful-md' : ''}`}
                  title={t('game.menu.mainPanel')}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                    <polyline points="9,22 9,12 15,12 15,22"/>
                  </svg>
                  <span>{t('game.menu.mainPanel')}</span>
                </button>
              </div>
              
              {/* Mobile: Section name only */}
              <div className="md:hidden">
                {currentPage === 'main' && (
                  <span className="text-sm font-semibold text-black font-playful">
                    {t('game.menu.mainPanel')}
                  </span>
                )}
                {currentPage === 'goals' && (
                  <button
                    onClick={() => setCurrentPage('goals')}
                    className="text-sm font-semibold text-black font-playful hover:text-primary-600 transition-colors"
                  >
                    {t('navigation.goals')}
                  </button>
                )}
                {currentPage === 'habits' && (
                  <button
                    onClick={() => {
                      setCurrentPage('habits')
                      // Reset habit selection when clicking on Habits title
                      if (typeof window !== 'undefined') {
                        window.dispatchEvent(new CustomEvent('resetHabitSelection'))
                      }
                    }}
                    className="text-sm font-semibold text-black font-playful hover:text-primary-600 transition-colors"
                  >
                    {t('navigation.habits')}
                  </button>
                )}
                {currentPage === 'steps' && (
                  <button
                    onClick={() => setCurrentPage('steps')}
                    className="text-sm font-semibold text-black font-playful hover:text-primary-600 transition-colors"
                  >
                    {t('navigation.steps')}
                  </button>
                )}
                {currentPage === 'help' && (
                  <span className="text-sm font-semibold text-black font-playful">
                    {t('help.title')}
                  </span>
                )}
                {currentPage === 'settings' && (
                  <span className="text-sm font-semibold text-black font-playful">
                    {t('game.menu.settings')}
                  </span>
                )}
                {currentPage === 'statistics' && (
                  <span className="text-sm font-semibold text-black font-playful">
                    Statistiky
                  </span>
                )}
                {currentPage === 'achievements' && (
                  <span className="text-sm font-semibold text-black font-playful">
                    Úspěchy
                  </span>
                )}
              </div>
            </div>

            {/* Right - Statistics and Menu Icons */}
            <div className="flex items-center gap-3 sm:gap-4 lg:gap-6">
              {/* Statistics - Hidden on small screens, visible from lg breakpoint */}
              <div className="hidden lg:flex items-center gap-3">
                <div className="box-playful-highlight flex items-center gap-1.5 px-2 py-1">
                  <svg className="w-4 h-4 text-primary-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                  </svg>
                  <span className="text-black font-semibold text-sm">{totalXp}</span>
                  <span className="text-gray-600 text-xs">XP</span>
                </div>

                <div className="box-playful-highlight flex items-center gap-1.5 px-2 py-1">
                  <svg className="w-4 h-4 text-primary-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M13.5.67s.74 2.65.74 4.8c0 2.06-1.35 3.73-3.41 3.73-2.07 0-3.63-1.67-3.63-3.73l.03-.36C5.21 7.51 4 10.62 4 14c0 4.42 3.58 8 8 8s8-3.58 8-8C20 8.61 17.41 3.8 13.5.67zM11.71 19c-1.78 0-3.22-1.4-3.22-3.14 0-1.62 1.05-2.76 2.81-3.12 1.77-.36 3.6-1.21 4.62-2.58.39 1.29.59 2.65.59 4.04 0 2.65-2.15 4.8-4.8 4.8z"/>
                  </svg>
                  <span className="text-black font-semibold text-sm">{loginStreak}</span>
                  <span className="text-gray-600 text-xs">Streak</span>
                </div>
              </div>

              {/* Menu Icons - Desktop: Full buttons, Mobile: Hamburger menu */}
              <div className="hidden md:flex items-center gap-2 lg:border-l-2 lg:border-primary-500 lg:pl-4">
                {/* Goals, Habits, Steps buttons */}
                {topMenuItems.map((item) => {
                  const Icon = item.icon
                  const isActive = currentPage === item.id
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setCurrentPage(item.id as 'goals' | 'habits' | 'steps')
                        // If clicking on Habits and already on habits page, reset habit selection
                        if (item.id === 'habits' && currentPage === 'habits') {
                          if (typeof window !== 'undefined') {
                            window.dispatchEvent(new CustomEvent('resetHabitSelection'))
                          }
                        }
                      }}
                      className={`btn-playful-nav flex items-center gap-2 px-3 py-2 text-sm font-semibold ${isActive ? 'active border-2 border-primary-500 rounded-playful-md' : ''}`}
                      title={item.label}
                    >
                      <Icon className="w-5 h-5" />
                      <span>{item.label}</span>
                    </button>
                  )
                })}
              
                <button
                  onClick={() => setCurrentPage('help')}
                  className={`btn-playful-nav flex items-center gap-2 px-3 py-2 text-sm font-semibold ${currentPage === 'help' ? 'active border-2 border-primary-500 rounded-playful-md' : ''}`}
                  title={t('help.title')}
                >
                  <HelpCircle className="w-5 h-5" />
                  <span>{t('help.title')}</span>
                </button>
              
                <button
                  onClick={() => setCurrentPage('settings')}
                  className={`btn-playful-nav flex items-center gap-2 px-3 py-2 text-sm font-semibold ${currentPage === 'settings' ? 'active border-2 border-primary-500 rounded-playful-md' : ''}`}
                  title={t('game.menu.settings')}
                >
                  <Settings className="w-5 h-5" strokeWidth="2" />
                  <span>{t('game.menu.settings')}</span>
                </button>
              </div>
              
              {/* Mobile: Hamburger menu */}
              <div className="md:hidden relative">
                <button
                  onClick={() => setMobileTopMenuOpen(!mobileTopMenuOpen)}
                  className="btn-playful-nav p-2"
                  title="Menu"
                >
                  <Menu className="w-5 h-5 text-black" />
                </button>
                
                {/* Mobile top menu dropdown */}
                {mobileTopMenuOpen && (
                  <>
                    {/* Backdrop */}
                    <div 
                      className="fixed inset-0 z-[100]" 
                      onClick={() => setMobileTopMenuOpen(false)}
                    />
                    <div className="fixed right-4 top-16 box-playful-highlight z-[101] min-w-[200px]">
                      <nav className="py-2">
                        {/* Main Panel button */}
                        <button
                          onClick={() => {
                            // Load last opened view from localStorage
                            if (typeof window !== 'undefined') {
                              try {
                                const savedSection = localStorage.getItem('journeyGame_mainPanelSection')
                                if (savedSection) {
                                  // Migrate old 'overview' to 'focus-day'
                                  const sectionToUse = savedSection === 'overview' ? 'focus-day' : savedSection
                                  setMainPanelSection(sectionToUse)
                                } else {
                                  // Default to focus-day if nothing saved
                                  setMainPanelSection('focus-day')
                                }
                              } catch (error) {
                                console.error('Error loading mainPanelSection:', error)
                                setMainPanelSection('focus-day')
                              }
                            }
                            setCurrentPage('main')
                            setMobileTopMenuOpen(false)
                          }}
                          className={`w-full flex items-center gap-3 px-4 py-3 transition-all text-left btn-playful-nav ${
                            currentPage === 'main' ? 'active border-2 border-primary-500 rounded-playful-md' : ''
                          }`}
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                            <polyline points="9,22 9,12 15,12 15,22"/>
                          </svg>
                          <span className="font-semibold">{t('game.menu.mainPanel')}</span>
                        </button>
                        
                        {/* Goals, Habits, Steps buttons */}
                        {topMenuItems.map((item) => {
                          const Icon = item.icon
                          const isActive = currentPage === item.id
                          return (
                            <button
                              key={item.id}
                              onClick={() => {
                                setCurrentPage(item.id as 'goals' | 'habits' | 'steps')
                                setMobileTopMenuOpen(false)
                                // If clicking on Habits and already on habits page, reset habit selection
                                if (item.id === 'habits' && currentPage === 'habits') {
                                  if (typeof window !== 'undefined') {
                                    window.dispatchEvent(new CustomEvent('resetHabitSelection'))
                                  }
                                }
                              }}
                              className={`w-full flex items-center gap-3 px-4 py-3 transition-all text-left btn-playful-nav ${isActive ? 'active border-2 border-primary-500 rounded-playful-md' : ''}`}
                            >
                              <Icon className="w-5 h-5" />
                              <span className="font-semibold">{item.label}</span>
                            </button>
                          )
                        })}
                        
                        <button
                          onClick={() => {
                            setCurrentPage('help')
                            setMobileTopMenuOpen(false)
                          }}
                          className={`w-full flex items-center gap-3 px-4 py-3 transition-all text-left btn-playful-nav ${currentPage === 'help' ? 'active border-2 border-primary-500 rounded-playful-md' : ''}`}
                        >
                          <HelpCircle className="w-5 h-5" />
                          <span className="font-semibold">{t('help.title')}</span>
                        </button>
                        <button
                          onClick={() => {
                            setCurrentPage('settings')
                            setMobileTopMenuOpen(false)
                          }}
                          className={`w-full flex items-center gap-3 px-4 py-3 transition-all text-left btn-playful-nav ${currentPage === 'settings' ? 'active border-2 border-primary-500 rounded-playful-md' : ''}`}
                        >
                          <Settings className="w-5 h-5" strokeWidth="2" />
                          <span className="font-semibold">{t('game.menu.settings')}</span>
                        </button>
                      </nav>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

      </div>
    </>
  )
}

