'use client'

import { useState } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { HelpCircle, Settings, Menu, Check } from 'lucide-react'
import { DevVersionTooltip } from '../common/DevVersionTooltip'

interface HeaderNavigationProps {
  currentPage: 'main' | 'goals' | 'habits' | 'steps' | 'statistics' | 'achievements' | 'settings' | 'workflows' | 'help' | 'areas'
  setCurrentPage: (page: 'main' | 'goals' | 'habits' | 'steps' | 'statistics' | 'achievements' | 'settings' | 'workflows' | 'help' | 'areas') => void
  mainPanelSection: string | null
  setMainPanelSection: (section: string | null) => void
  topMenuItems: Array<{ id: string; label: string; icon: any }>
  totalXp: number
  loginStreak: number
  totalCompletedSteps: number
  totalCompletedHabits: number
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
  totalCompletedSteps,
  totalCompletedHabits,
  mobileTopMenuOpen,
  setMobileTopMenuOpen,
}: HeaderNavigationProps) {
  const t = useTranslations()
  const locale = useLocale()
  
  // Tooltip state
  const [doneTooltipVisible, setDoneTooltipVisible] = useState(false)
  
  const totalDone = totalCompletedSteps + totalCompletedHabits

  return (
    <>
      {/* Header */}
      <div className="relative overflow-visible w-full bg-white border-b-4 border-primary-500" style={{
        zIndex: 200
      }}>
        <div className="relative z-10 py-3 px-4 sm:px-6">
          {/* Single Row: Section Name and Menu */}
          <div className="flex items-center justify-between">
            {/* Left - Main Panel button and Alpha version badge */}
            <div className="flex items-center gap-3 sm:gap-4">
              {/* Desktop: Main Panel button and Alpha version */}
              <div className="hidden md:flex items-center gap-3">
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
                {/* Version badge with warning */}
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-gray-500 font-mono">v0.1.0</span>
                  <DevVersionTooltip iconSize="w-3 h-3" />
                </div>
              </div>
              
              {/* Mobile: Section name and Alpha version */}
              <div className="md:hidden flex items-center gap-2">
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
                {/* Version badge with warning - Mobile */}
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-gray-500 font-mono">v0.1.0</span>
                  <DevVersionTooltip iconSize="w-2.5 h-2.5" />
                </div>
              </div>
            </div>

            {/* Right - Statistics and Menu Icons */}
            <div className="flex items-center gap-3 sm:gap-4 lg:gap-6">
              {/* Statistics - Hidden on small screens, visible from lg breakpoint */}
              <div className="hidden lg:flex items-center gap-3">
                {/* Done counter with tooltip */}
                <div className="relative inline-block">
                  <div
                    onMouseEnter={() => setDoneTooltipVisible(true)}
                    onMouseLeave={() => setDoneTooltipVisible(false)}
                    className="box-playful-highlight flex items-center gap-1.5 px-2 py-1 cursor-help"
                  >
                    <Check className="w-4 h-4 text-primary-600" strokeWidth={3} />
                    <span className="text-black font-semibold text-sm">{totalDone}</span>
                  </div>
                  
                  {doneTooltipVisible && (
                    <div className="absolute z-50 top-full left-1/2 transform -translate-x-1/2 mt-2 px-4 py-2.5 bg-primary-500 text-white text-sm rounded-lg shadow-lg max-w-[calc(100vw-16px)] sm:max-w-md whitespace-normal leading-relaxed" style={{ minWidth: '200px' }}>
                      <div className="whitespace-normal">
                        <div>{t('header.doneTooltip.title') || 'Completed:'}</div>
                        <div>{t('header.doneTooltip.steps', { count: totalCompletedSteps }) || `${totalCompletedSteps} steps`}</div>
                        <div>{t('header.doneTooltip.habits', { count: totalCompletedHabits }) || `${totalCompletedHabits} habits`}</div>
                      </div>
                      {/* Arrow pointing up */}
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-b-primary-500"></div>
                    </div>
                  )}
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
                    <div className="fixed right-4 top-16 box-playful-highlight bg-white z-[201] min-w-[200px]">
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

