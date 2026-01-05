'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { LanguageSwitcher } from '../../components/LanguageSwitcher'

interface GameLayoutProps {
  children: React.ReactNode
  player: any
  level: number
  experience: number
  onBackToGame: () => void
  onNavigateToGoals?: () => void
  onNavigateToHabits?: () => void
  onNavigateToStatistics?: () => void
  onNavigateToAchievements?: () => void
  onNavigateToSettings?: () => void
}

export function GameLayout({ 
  children, 
  player, 
  level, 
  experience, 
  onBackToGame,
  onNavigateToGoals,
  onNavigateToHabits,
  onNavigateToStatistics,
  onNavigateToAchievements,
  onNavigateToSettings
}: GameLayoutProps) {
  const t = useTranslations()
  const [showMenu, setShowMenu] = useState(false)

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showMenu && !(event.target as Element).closest('.menu-container')) {
        setShowMenu(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showMenu])

  return (
    <div className="h-screen bg-gradient-to-br from-blue-100 via-purple-50 to-pink-100 p-4 flex flex-col" style={{
      fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      fontSize: '14px'
    }}>
      {/* Game Header */}
      <div className="bg-white rounded-xl shadow-lg p-4 mb-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full border-2 border-gray-300 flex items-center justify-center bg-gray-100">
              <div className="w-8 h-8 rounded-full relative" style={{ backgroundColor: player?.appearance?.skinColor || '#FDBCB4' }}>
                <div 
                  className="absolute top-0 left-1/2 transform -translate-x-1/2 w-6 h-3 rounded-full"
                  style={{ backgroundColor: player?.appearance?.hairColor || '#8B4513' }}
                />
                <div 
                  className="absolute top-2 left-1 w-1 h-1 rounded-full"
                  style={{ backgroundColor: player?.appearance?.eyeColor || '#4A90E2' }}
                />
                <div 
                  className="absolute top-2 right-1 w-1 h-1 rounded-full"
                  style={{ backgroundColor: player?.appearance?.eyeColor || '#4A90E2' }}
                />
              </div>
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">{player?.name}</h1>
              <p className="text-xs text-gray-600">{t('game.level')} {level} • {experience} {t('game.xp')}</p>
            </div>
          </div>
          
          {/* Language Switcher and Menu Button */}
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <div className="relative menu-container">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 rounded-lg bg-gray-500 text-white hover:bg-gray-600 transition-colors"
            >
              ⚙️
            </button>
            
            {/* Dropdown Menu */}
            {showMenu && (
              <div className="absolute right-0 top-12 bg-white rounded-lg shadow-lg border border-gray-200 py-2 min-w-48 z-50">
                <button
                  onClick={() => {
                    setShowMenu(false)
                    onBackToGame()
                  }}
                  className="w-full px-4 py-2 text-left hover:bg-gray-100 text-sm"
                >
                  🎮 {t('game.menu.backToGame')}
                </button>
                <hr className="my-2" />
                <button
                  onClick={() => {
                    setShowMenu(false)
                    onNavigateToGoals?.()
                  }}
                  className="w-full px-4 py-2 text-left hover:bg-gray-100 text-sm"
                >
                  🎯 {t('game.menu.goals')}
                </button>
                <button
                  onClick={() => {
                    setShowMenu(false)
                    onNavigateToHabits?.()
                  }}
                  className="w-full px-4 py-2 text-left hover:bg-gray-100 text-sm"
                >
                  ⚡ {t('game.menu.habits')}
                </button>
                <button
                  onClick={() => {
                    setShowMenu(false)
                    onNavigateToStatistics?.()
                  }}
                  className="w-full px-4 py-2 text-left hover:bg-gray-100 text-sm"
                >
                  📊 {t('game.menu.statistics')}
                </button>
                <button
                  onClick={() => {
                    setShowMenu(false)
                    onNavigateToAchievements?.()
                  }}
                  className="w-full px-4 py-2 text-left hover:bg-gray-100 text-sm"
                >
                  🏆 {t('game.menu.achievements')}
                </button>
                <hr className="my-2" />
                <button
                  onClick={() => {
                    setShowMenu(false)
                    onNavigateToSettings?.()
                  }}
                  className="w-full px-4 py-2 text-left hover:bg-gray-100 text-sm"
                >
                  ⚙️ {t('game.menu.settings')}
                </button>
                <button
                  onClick={() => {
                    setShowMenu(false)
                    // TODO: Implement logout
                  }}
                  className="w-full px-4 py-2 text-left hover:bg-gray-100 text-sm text-red-600"
                >
                  🚪 {t('game.menu.logout')}
                </button>
              </div>
            )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        {children}
      </div>
    </div>
  )
}
