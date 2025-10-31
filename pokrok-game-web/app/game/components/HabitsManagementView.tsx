'use client'

import { useState } from 'react'

interface HabitsManagementViewProps {
  player: any
  habits: any[]
  onHabitsUpdate: (habits: any[]) => void
  onBack?: () => void
}

const PREDEFINED_HABITS = [
  { name: 'Cvičení', description: 'Pravidelné cvičení', category: 'zdraví', difficulty: 'medium' as const },
  { name: 'Čtení', description: 'Denní čtení knih', category: 'vzdělání', difficulty: 'easy' as const },
  { name: 'Meditace', description: 'Meditace nebo mindfulness', category: 'duševní zdraví', difficulty: 'easy' as const },
  { name: 'Deník', description: 'Psaní do deníku', category: 'reflexe', difficulty: 'easy' as const },
  { name: 'Učení', description: 'Učení nových dovedností', category: 'vzdělání', difficulty: 'medium' as const },
  { name: 'Sociální kontakt', description: 'Kontakt s přáteli', category: 'vztahy', difficulty: 'easy' as const },
  { name: 'Zdravé stravování', description: 'Jíst zdravě', category: 'zdraví', difficulty: 'medium' as const },
  { name: 'Dostatek spánku', description: '8 hodin spánku', category: 'zdraví', difficulty: 'easy' as const }
]

export function HabitsManagementView({ player, habits, onHabitsUpdate, onBack }: HabitsManagementViewProps) {
  const [showAddForm, setShowAddForm] = useState(false)
  const [customHabitName, setCustomHabitName] = useState('')
  const [customHabitDescription, setCustomHabitDescription] = useState('')
  const [customHabitCategory, setCustomHabitCategory] = useState('osobní')

  const categories = [
    { value: 'osobní', label: 'Osobní' },
    { value: 'zdraví', label: 'Zdraví' },
    { value: 'vzdělání', label: 'Vzdělání' },
    { value: 'duševní zdraví', label: 'Duševní zdraví' },
    { value: 'reflexe', label: 'Reflexe' },
    { value: 'vztahy', label: 'Vztahy' },
    { value: 'jiné', label: 'Jiné' }
  ]

  const handleAddCustomHabit = () => {
    if (!customHabitName.trim()) return

    const newHabit = {
      id: `habit_${Date.now()}`,
      name: customHabitName.trim(),
      description: customHabitDescription.trim() || customHabitName.trim(),
      frequency: 'daily',
      streak: 0,
      maxStreak: 0,
      category: customHabitCategory,
      difficulty: 'medium',
      isCustom: true,
      createdAt: new Date()
    }

    onHabitsUpdate([...habits, newHabit])

    // Reset form
    setCustomHabitName('')
    setCustomHabitDescription('')
    setCustomHabitCategory('osobní')
    setShowAddForm(false)
  }

  const handleAddPredefinedHabit = (habitName: string) => {
    const habit = PREDEFINED_HABITS.find(h => h.name === habitName)
    if (!habit) return

    const newHabit = {
      id: `habit_${Date.now()}_${habitName}`,
      ...habit,
      frequency: 'daily',
      streak: 0,
      maxStreak: 0,
      isCustom: false,
      createdAt: new Date()
    }

    onHabitsUpdate([...habits, newHabit])
  }

  const handleDeleteHabit = (habitId: string) => {
    onHabitsUpdate(habits.filter(habit => habit.id !== habitId))
  }

  const handleUpdateStreak = (habitId: string, increment: boolean) => {
    onHabitsUpdate(habits.map(habit => 
      habit.id === habitId 
        ? { 
            ...habit, 
            streak: increment ? habit.streak + 1 : Math.max(0, habit.streak - 1),
            maxStreak: increment ? Math.max(habit.maxStreak, habit.streak + 1) : habit.maxStreak
          }
        : habit
    ))
  }

  return (
    <div className="bg-white bg-opacity-95 rounded-2xl p-8 border border-orange-200 shadow-xl backdrop-blur-sm" style={{
      boxShadow: '0 12px 24px rgba(251, 146, 60, 0.15), 0 4px 8px rgba(0, 0, 0, 0.05)'
    }}>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-orange-800" style={{ letterSpacing: '1px' }}>NÁVYKY</h1>
        <div className="flex gap-2">
          {onBack && (
            <button
              onClick={onBack}
              className="px-4 py-2 rounded-lg bg-gray-500 text-white hover:bg-gray-600 transition-colors"
            >
              ← Zpět
            </button>
          )}
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="p-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
            title={showAddForm ? 'Zrušit' : 'Přidat návyk'}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={showAddForm ? "M6 18L18 6M6 6l12 12" : "M12 6v6m0 0v6m0-6h6m-6 0H6"} />
            </svg>
          </button>
        </div>
      </div>

      {/* Add Habit Form */}
      {showAddForm && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h2 className="text-lg font-bold text-gray-900 mb-4">PŘIDAT NOVÝ NÁVYK</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">NÁZEV NÁVYKU</label>
              <input
                type="text"
                value={customHabitName}
                onChange={(e) => setCustomHabitName(e.target.value)}
                className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none"
                placeholder="Např. Ranní rutina"
                maxLength={100}
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">POPIS (volitelné)</label>
              <textarea
                value={customHabitDescription}
                onChange={(e) => setCustomHabitDescription(e.target.value)}
                className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none resize-none"
                rows={3}
                placeholder="Podrobnější popis návyku..."
                maxLength={500}
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">KATEGORIE</label>
              <select
                value={customHabitCategory}
                onChange={(e) => setCustomHabitCategory(e.target.value)}
                className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none"
              >
                {categories.map((category) => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-4">
              <button
                onClick={handleAddCustomHabit}
                disabled={!customHabitName.trim()}
                className="px-6 py-3 rounded-xl font-bold bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                PŘIDAT NÁVYK
              </button>
              <button
                onClick={() => setShowAddForm(false)}
                className="px-6 py-3 rounded-xl font-bold bg-gradient-to-r from-gray-500 to-gray-600 text-white hover:from-gray-600 hover:to-gray-700 shadow-lg transition-all duration-300"
              >
                ZRUŠIT
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Predefined Habits */}
      <div className="mb-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">PŘEDNASTAVENÉ NÁVYKY</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {PREDEFINED_HABITS.map((habit) => (
            <div
              key={habit.name}
              className="p-4 rounded-lg border-2 border-gray-300 bg-gray-50 hover:border-purple-500 transition-all duration-300 cursor-pointer"
              onClick={() => handleAddPredefinedHabit(habit.name)}
            >
              <h3 className="font-bold text-gray-900 mb-2">{habit.name}</h3>
              <p className="text-sm text-gray-600 mb-2">{habit.description}</p>
              <div className="text-xs text-gray-500">
                Kategorie: {habit.category} • Obtížnost: {habit.difficulty}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Current Habits */}
      <div>
        {habits.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-lg font-bold text-gray-700 mb-2">Žádné návyky nejsou nastavené</p>
            <p className="text-sm text-gray-500">Klikněte na tlačítko níže pro přidání nového návyku</p>
          </div>
        ) : (
          <div className="space-y-4">
            {habits.map((habit) => (
              <div
                key={habit.id}
                className={`p-4 rounded-lg border-2 transition-all duration-300 ${
                  'border-gray-300 bg-gray-50 hover:border-purple-500'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-bold text-gray-900">{habit.name}</h3>
                    </div>
                    
                    {habit.description && (
                      <p className="text-sm text-gray-600 mb-2">{habit.description}</p>
                    )}
                    
                    <div className="text-xs text-gray-500">
                      Kategorie: {habit.category} • 
                      Obtížnost: {habit.difficulty} • 
                      Vytvořeno: {new Date(habit.createdAt).toLocaleDateString('cs-CZ')}
                      {habit.isCustom && <span className="text-orange-600 ml-2">• Vlastní</span>}
                    </div>
                    
                    {/* Streak info - simpler display */}
                    {(habit.streak > 0 || habit.maxStreak > 0) && (
                      <div className="mt-2 text-sm text-gray-600">
                        <span className="font-bold">Streak:</span> {habit.streak || 0} dní
                        {habit.maxStreak > 0 && (
                          <span className="ml-3">
                            <span className="font-bold">Max streak:</span> {habit.maxStreak} dní
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <button
                    onClick={() => handleDeleteHabit(habit.id)}
                    className="ml-4 px-3 py-1 rounded bg-red-500 text-white hover:bg-red-600 transition-colors text-sm"
                  >
                    SMAZAT
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
