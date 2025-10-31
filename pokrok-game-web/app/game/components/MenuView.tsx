'use client'

import { useGameState } from '../hooks/useGameState'

export function MenuView() {
  const { updateGamePhase, gameState } = useGameState()
  const character = gameState.character

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-2xl w-full" style={{
        fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        fontSize: '14px'
      }}>
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4" style={{
            textShadow: '2px 2px 0px #000000',
            color: '#2d5016'
          }}>MENU</h1>
          <p className="text-gray-600">Vítej zpět, {character?.name}!</p>
        </div>

        {/* Character Info */}
        <div className="text-center mb-8">
          <div className="w-24 h-24 mx-auto mb-4 rounded-full border-4 border-gray-300 flex items-center justify-center bg-gray-100">
            <div className="w-20 h-20 rounded-full relative" style={{ backgroundColor: character?.appearance.skinColor || '#FDBCB4' }}>
              {/* Hair */}
              <div 
                className="absolute top-0 left-1/2 transform -translate-x-1/2 w-12 h-6 rounded-full"
                style={{ backgroundColor: character?.appearance.hairColor || '#8B4513' }}
              />
              {/* Eyes */}
              <div 
                className="absolute top-4 left-3 w-2 h-2 rounded-full"
                style={{ backgroundColor: character?.appearance.eyeColor || '#4A90E2' }}
              />
              <div 
                className="absolute top-4 right-3 w-2 h-2 rounded-full"
                style={{ backgroundColor: character?.appearance.eyeColor || '#4A90E2' }}
              />
              {/* Smile */}
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 w-6 h-3 border-b-2 border-gray-600 rounded-full"></div>
            </div>
          </div>
          <div className="text-sm text-gray-600">
            Level {gameState.level} • {gameState.experience} XP
          </div>
        </div>

        {/* Menu Options */}
        <div className="space-y-4">
          <button
            onClick={() => updateGamePhase('playing')}
            className="w-full px-6 py-4 rounded-xl font-bold bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 shadow-lg transition-all duration-300"
          >
            POKRAČOVAT V HRÁNÍ
          </button>

          <button
            onClick={() => updateGamePhase('daily-setup')}
            className="w-full px-6 py-4 rounded-xl font-bold bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 shadow-lg transition-all duration-300"
          >
            DENNÍ NASTAVENÍ
          </button>

          <button
            className="w-full px-6 py-4 rounded-xl font-bold bg-gradient-to-r from-purple-500 to-purple-600 text-white hover:from-purple-600 hover:to-purple-700 shadow-lg transition-all duration-300"
          >
            SPRÁVA CÍLŮ
          </button>

          <button
            className="w-full px-6 py-4 rounded-xl font-bold bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700 shadow-lg transition-all duration-300"
          >
            SPRÁVA NÁVYKŮ
          </button>

          <button
            className="w-full px-6 py-4 rounded-xl font-bold bg-gradient-to-r from-gray-500 to-gray-600 text-white hover:from-gray-600 hover:to-gray-700 shadow-lg transition-all duration-300"
          >
            NASTAVENÍ
          </button>
        </div>

        {/* Stats Summary */}
        <div className="mt-8 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-bold text-gray-900 mb-2">STATISTIKY</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Den:</span>
              <span className="font-bold text-gray-900 ml-2">{gameState.currentDay}</span>
            </div>
            <div>
              <span className="text-gray-600">Čas:</span>
              <span className="font-bold text-gray-900 ml-2">{gameState.currentTime}:00</span>
            </div>
            <div>
              <span className="text-gray-600">Energie:</span>
              <span className="font-bold text-gray-900 ml-2">{gameState.energy}%</span>
            </div>
            <div>
              <span className="text-gray-600">Návyky:</span>
              <span className="font-bold text-gray-900 ml-2">{gameState.habits.length}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
