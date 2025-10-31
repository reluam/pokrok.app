'use client'

import { useState } from 'react'
import { useUser } from '@clerk/nextjs'

interface HabitsSetupViewProps {
  onHabitsCreated: (habitsData: any[]) => void
}

const PREDEFINED_HABITS = [
  { name: 'Cvičení', description: 'Pravidelné cvičení', category: 'zdraví', difficulty: 'medium' as const, defaultFrequency: 'daily' },
  { name: 'Čtení', description: 'Denní čtení knih', category: 'vzdělání', difficulty: 'easy' as const, defaultFrequency: 'daily' },
  { name: 'Meditace', description: 'Meditace nebo mindfulness', category: 'duševní zdraví', difficulty: 'easy' as const, defaultFrequency: 'daily' },
  { name: 'Deník', description: 'Psaní do deníku', category: 'reflexe', difficulty: 'easy' as const, defaultFrequency: 'daily' },
  { name: 'Učení', description: 'Učení nových dovedností', category: 'vzdělání', difficulty: 'medium' as const, defaultFrequency: 'weekly' },
  { name: 'Sociální kontakt', description: 'Kontakt s přáteli', category: 'vztahy', difficulty: 'easy' as const, defaultFrequency: 'weekly' },
  { name: 'Zdravé stravování', description: 'Jíst zdravě', category: 'zdraví', difficulty: 'medium' as const, defaultFrequency: 'daily' },
  { name: 'Dostatek spánku', description: '8 hodin spánku', category: 'zdraví', difficulty: 'easy' as const, defaultFrequency: 'daily' }
]

export function HabitsSetupView({ onHabitsCreated }: HabitsSetupViewProps) {
  const { user } = useUser()
  const [habits, setHabits] = useState<any[]>([])
  const [selectedHabits, setSelectedHabits] = useState<string[]>([])
  const [customHabitName, setCustomHabitName] = useState('')
  const [customHabitDescription, setCustomHabitDescription] = useState('')
  const [customHabitCategory, setCustomHabitCategory] = useState('osobní')
  const [customHabitFrequency, setCustomHabitFrequency] = useState('daily')
  const [customHabitReminderTime, setCustomHabitReminderTime] = useState('')
  const [isCreating, setIsCreating] = useState(false)

  const categories = [
    { value: 'osobní', label: 'Osobní' },
    { value: 'zdraví', label: 'Zdraví' },
    { value: 'vzdělání', label: 'Vzdělání' },
    { value: 'duševní zdraví', label: 'Duševní zdraví' },
    { value: 'reflexe', label: 'Reflexe' },
    { value: 'vztahy', label: 'Vztahy' },
    { value: 'jiné', label: 'Jiné' }
  ]

  const frequencies = [
    { value: 'daily', label: 'Denně' },
    { value: 'weekly', label: 'Týdně' },
    { value: 'monthly', label: 'Měsíčně' },
    { value: 'custom', label: 'Vlastní' }
  ]

  const toggleHabit = (habitName: string) => {
    setSelectedHabits(prev => 
      prev.includes(habitName) 
        ? prev.filter(name => name !== habitName)
        : [...prev, habitName]
    )
  }

  const addCustomHabit = async () => {
    if (!customHabitName.trim() || !user) return

    setIsCreating(true)
    try {
      // Get user from database via API
      const userResponse = await fetch(`/api/user?clerkId=${user.id}`)
      if (!userResponse.ok) {
        console.error('User not found in database')
        return
      }

      const dbUser = await userResponse.json()

      const habitData = {
        userId: dbUser.id,
        name: customHabitName.trim(),
        description: customHabitDescription.trim() || customHabitName.trim(),
        frequency: customHabitFrequency,
        streak: 0,
        maxStreak: 0,
        category: customHabitCategory,
        difficulty: 'medium',
        isCustom: true,
        reminderTime: customHabitReminderTime || null
      }

      console.log('Creating custom habit:', habitData)
      const response = await fetch('/api/habits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(habitData)
      })
      
      if (response.ok) {
        const createdHabit = await response.json()
        console.log('Custom habit created successfully:', createdHabit)
        setHabits(prev => [...prev, createdHabit])
        
        // Reset form
        setCustomHabitName('')
        setCustomHabitDescription('')
        setCustomHabitCategory('osobní')
        setCustomHabitFrequency('daily')
        setCustomHabitReminderTime('')
      } else {
        console.error('Failed to create custom habit')
      }
    } catch (error) {
      console.error('Error creating custom habit:', error)
    } finally {
      setIsCreating(false)
    }
  }

  const handleCompleteSetup = async () => {
    if (!user) return

    setIsCreating(true)
    try {
      // Get user from database via API
      const userResponse = await fetch(`/api/user?clerkId=${user.id}`)
      if (!userResponse.ok) {
        console.error('User not found in database')
        return
      }

      const dbUser = await userResponse.json()

      // Add selected predefined habits
      const predefinedHabits = []
      for (const habitName of selectedHabits) {
        const habit = PREDEFINED_HABITS.find(h => h.name === habitName)
        if (habit) {
          const habitData = {
            userId: dbUser.id,
            name: habit.name,
            description: habit.description,
            frequency: habit.defaultFrequency,
            streak: 0,
            maxStreak: 0,
            category: habit.category,
            difficulty: habit.difficulty,
            isCustom: false
          }

          console.log('Creating predefined habit:', habitData)
          const response = await fetch('/api/habits', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(habitData)
          })
          
          if (response.ok) {
            const createdHabit = await response.json()
            predefinedHabits.push(createdHabit)
          }
        }
      }

      const allHabits = [...habits, ...predefinedHabits]
      console.log('All habits created:', allHabits)
      onHabitsCreated(allHabits)
    } catch (error) {
      console.error('Error completing habits setup:', error)
    } finally {
      setIsCreating(false)
    }
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
          }}>TVOJE NÁVYKY</h1>
          <p className="text-gray-600">Jaké návyky chceš budovat?</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Predefined Habits */}
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">PŘEDNASTAVENÉ NÁVYKY</h2>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {PREDEFINED_HABITS.map((habit) => (
                <div
                  key={habit.name}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-300 ${
                    selectedHabits.includes(habit.name)
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-300 bg-gray-50 hover:border-purple-500'
                  }`}
                  onClick={() => toggleHabit(habit.name)}
                >
                  <h3 className="font-bold text-gray-900 mb-2">{habit.name}</h3>
                  <p className="text-xs text-gray-600 mb-2">{habit.description}</p>
                  <div className="text-xs text-gray-500">
                    Kategorie: {habit.category} • Obtížnost: {habit.difficulty} • Frekvence: {habit.defaultFrequency}
                  </div>
                  {selectedHabits.includes(habit.name) && (
                    <div className="mt-2 text-purple-600 font-bold">✓ VYBRÁNO</div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Custom Habit Creation */}
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">VLASTNÍ NÁVYK</h2>
            
            <div className="space-y-4">
              {/* Habit Name */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">NÁZEV NÁVYKU</label>
                <input
                  type="text"
                  value={customHabitName}
                  onChange={(e) => setCustomHabitName(e.target.value)}
                  className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none"
                  placeholder="Např. Ranní rutina"
                  maxLength={50}
                />
              </div>

              {/* Habit Description */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">POPIS</label>
                <textarea
                  value={customHabitDescription}
                  onChange={(e) => setCustomHabitDescription(e.target.value)}
                  className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none resize-none"
                  rows={2}
                  placeholder="Co přesně budeš dělat?"
                  maxLength={200}
                />
              </div>

              {/* Habit Category */}
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

              {/* Habit Frequency */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">FREKVENCE</label>
                <select
                  value={customHabitFrequency}
                  onChange={(e) => setCustomHabitFrequency(e.target.value)}
                  className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none"
                >
                  {frequencies.map((frequency) => (
                    <option key={frequency.value} value={frequency.value}>
                      {frequency.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Reminder Time */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">ČAS PŘIPOMENUTÍ (volitelné)</label>
                <input
                  type="time"
                  value={customHabitReminderTime}
                  onChange={(e) => setCustomHabitReminderTime(e.target.value)}
                  className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none"
                />
                <p className="text-xs text-gray-500 mt-1">Nastav čas, kdy chceš být připomenut</p>
              </div>

              {/* Add Custom Habit Button */}
                      <button
                        onClick={addCustomHabit}
                        disabled={!customHabitName.trim() || isCreating}
                        className="w-full px-6 py-3 rounded-xl font-bold bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700 shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isCreating ? 'VYTVÁŘÍM...' : 'PŘIDAT VLASTNÍ NÁVYK'}
                      </button>
            </div>

            {/* Current Habits */}
            {habits.length > 0 && (
              <div className="mt-8">
                <h3 className="text-lg font-bold text-gray-900 mb-4">PŘIDANÉ NÁVYKY ({habits.length})</h3>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {habits.map((habit) => (
                    <div key={habit.id} className="p-2 bg-gray-50 rounded border text-xs">
                      <span className="font-bold">{habit.name}</span>
                      {habit.isCustom && <span className="text-orange-600 ml-2">(vlastní)</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Complete Setup Button */}
        <div className="text-center mt-8">
                <button
                  onClick={handleCompleteSetup}
                  disabled={isCreating}
                  className="px-8 py-4 rounded-xl font-bold bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCreating ? 'VYTVÁŘÍM...' : `DOKONČIT NASTAVENÍ (${selectedHabits.length + habits.length} návyků)`}
                </button>
        </div>
      </div>
    </div>
  )
}

