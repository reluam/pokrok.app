'use client'

import { useState } from 'react'
import { useGameState } from '../hooks/useGameState'

const AVAILABLE_HABITS = [
  { id: 'exercise', name: 'Cvičení', description: 'Pravidelné cvičení', category: 'zdraví', difficulty: 'medium' as const },
  { id: 'reading', name: 'Čtení', description: 'Denní čtení knih', category: 'vzdělání', difficulty: 'easy' as const },
  { id: 'meditation', name: 'Meditace', description: 'Meditace nebo mindfulness', category: 'duševní zdraví', difficulty: 'easy' as const },
  { id: 'journaling', name: 'Deník', description: 'Psaní do deníku', category: 'reflexe', difficulty: 'easy' as const },
  { id: 'learning', name: 'Učení', description: 'Učení nových dovedností', category: 'vzdělání', difficulty: 'medium' as const },
  { id: 'social', name: 'Sociální kontakt', description: 'Kontakt s přáteli', category: 'vztahy', difficulty: 'easy' as const }
]

export function OnboardingView() {
  const { addHabit, updateGamePhase } = useGameState()
  const [selectedHabits, setSelectedHabits] = useState<string[]>([])

  const toggleHabit = (habitId: string) => {
    setSelectedHabits(prev => 
      prev.includes(habitId) 
        ? prev.filter(id => id !== habitId)
        : [...prev, habitId]
    )
  }

  const completeOnboarding = () => {
    // Add selected habits
    selectedHabits.forEach(habitId => {
      const habit = AVAILABLE_HABITS.find(h => h.id === habitId)
      if (habit) {
        addHabit({
          ...habit,
          streak: 0,
          maxStreak: 0,
          frequency: 'daily'
        })
      }
    })
    
    updateGamePhase('character-creation')
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-4xl w-full" style={{
        fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        fontSize: '14px'
      }}>
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4" style={{
            textShadow: '2px 2px 0px #000000',
            color: '#2d5016'
          }}>VÍTEJ V ŽIVOTNÍ HŘE!</h1>
          <p className="text-gray-600">Vyber si návyky pro svou cestu</p>
        </div>

        {/* Habits Selection */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">TVOJE NÁVYKY</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {AVAILABLE_HABITS.map((habit) => (
              <div
                key={habit.id}
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-300 ${
                  selectedHabits.includes(habit.id)
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-gray-300 bg-gray-50 hover:border-purple-500'
                }`}
                onClick={() => toggleHabit(habit.id)}
              >
                <h3 className="font-bold text-gray-900 mb-2">{habit.name}</h3>
                <p className="text-xs text-gray-600 mb-2">{habit.description}</p>
                <div className="text-xs text-gray-500">
                  Kategorie: {habit.category}
                </div>
                {selectedHabits.includes(habit.id) && (
                  <div className="mt-2 text-purple-600 font-bold">✓ VYBRÁNO</div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Continue Button */}
        <div className="text-center">
          <button
            onClick={completeOnboarding}
            className="px-8 py-4 rounded-xl font-bold bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 shadow-lg transition-all duration-300"
          >
            POKRAČOVAT ({selectedHabits.length} návyků)
          </button>
        </div>
      </div>
    </div>
  )
}
