'use client'

import { useState } from 'react'
import { useGameState } from '../hooks/useGameState'

export function DailySetupView() {
  const { setDailyStats, gameState, updateGamePhase } = useGameState()
  const [energyLevel, setEnergyLevel] = useState(80)
  const [moodLevel, setMoodLevel] = useState(70)
  const [focusLevel, setFocusLevel] = useState(75)
  const [todayPlan, setTodayPlan] = useState('')

  const handleStartDay = () => {
    const stats = {
      energy: energyLevel,
      mood: moodLevel,
      focus: focusLevel,
      date: new Date().toISOString().split('T')[0],
      completedTasks: 0,
      habitsCompleted: 0
    }

    setDailyStats(stats)
  }

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
          }}>DENNÍ NASTAVENÍ</h1>
          <p className="text-gray-600">Jak se cítíš dnes, {character?.name}?</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Character Preview */}
          <div className="text-center">
            <h2 className="text-xl font-bold text-gray-900 mb-4">TVOJE POSTAVA</h2>
            <div className="w-32 h-32 mx-auto mb-4 rounded-full border-4 border-gray-300 flex items-center justify-center bg-gray-100">
              <div className="w-24 h-24 rounded-full relative" style={{ backgroundColor: character?.appearance.skinColor || '#FDBCB4' }}>
                {/* Hair */}
                <div 
                  className="absolute top-0 left-1/2 transform -translate-x-1/2 w-16 h-8 rounded-full"
                  style={{ backgroundColor: character?.appearance.hairColor || '#8B4513' }}
                />
                {/* Eyes */}
                <div 
                  className="absolute top-6 left-4 w-3 h-3 rounded-full"
                  style={{ backgroundColor: character?.appearance.eyeColor || '#4A90E2' }}
                />
                <div 
                  className="absolute top-6 right-4 w-3 h-3 rounded-full"
                  style={{ backgroundColor: character?.appearance.eyeColor || '#4A90E2' }}
                />
                {/* Smile */}
                <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 w-8 h-4 border-b-2 border-gray-600 rounded-full"></div>
              </div>
            </div>
            <p className="text-gray-600">{character?.name}</p>
          </div>

          {/* Daily Stats */}
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">TVOJE POCITY</h2>
            
            {/* Energy Level */}
            <div className="mb-4">
              <label className="block text-sm font-bold text-gray-700 mb-2">
                ENERGIE: {energyLevel}%
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={energyLevel}
                onChange={(e) => setEnergyLevel(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, #ef4444 0%, #f97316 25%, #eab308 50%, #22c55e 75%, #10b981 100%)`
                }}
              />
            </div>

            {/* Mood Level */}
            <div className="mb-4">
              <label className="block text-sm font-bold text-gray-700 mb-2">
                NÁLADA: {moodLevel}%
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={moodLevel}
                onChange={(e) => setMoodLevel(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, #dc2626 0%, #ea580c 25%, #f59e0b 50%, #84cc16 75%, #16a34a 100%)`
                }}
              />
            </div>

            {/* Focus Level */}
            <div className="mb-4">
              <label className="block text-sm font-bold text-gray-700 mb-2">
                SOUSTŘEDĚNÍ: {focusLevel}%
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={focusLevel}
                onChange={(e) => setFocusLevel(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, #7c3aed 0%, #8b5cf6 25%, #a855f7 50%, #c084fc 75%, #d8b4fe 100%)`
                }}
              />
            </div>

            {/* Today's Plan */}
            <div className="mb-6">
              <label className="block text-sm font-bold text-gray-700 mb-2">DNEŠNÍ PLÁN</label>
              <textarea
                value={todayPlan}
                onChange={(e) => setTodayPlan(e.target.value)}
                className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none resize-none"
                rows={3}
                placeholder="Co chceš dnes udělat?"
              />
            </div>

            {/* Start Day Button */}
            <button
              onClick={handleStartDay}
              className="w-full px-6 py-3 rounded-xl font-bold bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 shadow-lg transition-all duration-300"
            >
              ZAČÍT DEN
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
