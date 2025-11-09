'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'

interface AddAspirationModalProps {
  aspiration?: any
  goals?: any[]
  habits?: any[]
  onClose: () => void
  onAspirationAdded: (title: string, description: string, color: string, selectedGoalIds?: string[], selectedHabitIds?: string[]) => void 
}

export function AddAspirationModal({ 
  aspiration, 
  goals = [],
  habits = [],
  onClose, 
  onAspirationAdded 
}: AddAspirationModalProps) {
  const t = useTranslations()
  const [title, setTitle] = useState(aspiration?.title || '')
  const [description, setDescription] = useState(aspiration?.description || '')
  const [color, setColor] = useState(aspiration?.color || '#3B82F6')
  const [selectedGoalIds, setSelectedGoalIds] = useState<string[]>([])
  const [selectedHabitIds, setSelectedHabitIds] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showGoalDropdown, setShowGoalDropdown] = useState(false)
  const [showHabitDropdown, setShowHabitDropdown] = useState(false)
  
  // Update state when aspiration prop changes
  useEffect(() => {
    if (aspiration) {
      setTitle(aspiration.title || '')
      setDescription(aspiration.description || '')
      setColor(aspiration.color || '#3B82F6')
      // Load currently assigned goals and habits
      const assignedGoalIds = goals.filter(g => g.aspiration_id === aspiration.id).map(g => g.id)
      const assignedHabitIds = habits.filter(h => h.aspiration_id === aspiration.id).map(h => h.id)
      setSelectedGoalIds(assignedGoalIds)
      setSelectedHabitIds(assignedHabitIds)
    } else {
      setTitle('')
      setDescription('')
      setColor('#3B82F6')
      setSelectedGoalIds([])
      setSelectedHabitIds([])
    }
  }, [aspiration, goals, habits])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    setIsSubmitting(true)
    try {
      await onAspirationAdded(title.trim(), description.trim(), color, selectedGoalIds, selectedHabitIds)
      setTitle('')
      setDescription('')
      setColor('#3B82F6')
      setSelectedGoalIds([])
      setSelectedHabitIds([])
    } catch (error) {
      console.error('Error creating aspiration:', error)
    } finally {
      setIsSubmitting(false)
    }
  }
  
  const toggleGoal = (goalId: string) => {
    setSelectedGoalIds(prev => 
      prev.includes(goalId) 
        ? prev.filter(id => id !== goalId)
        : [...prev, goalId]
    )
  }
  
  const toggleHabit = (habitId: string) => {
    setSelectedHabitIds(prev => 
      prev.includes(habitId) 
        ? prev.filter(id => id !== habitId)
        : [...prev, habitId]
    )
  }
  
  const availableGoals = goals.filter(g => !g.aspiration_id || g.aspiration_id === aspiration?.id)
  const availableHabits = habits.filter(h => !h.aspiration_id || h.aspiration_id === aspiration?.id)
  
  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target.closest('.dropdown-container')) {
        setShowGoalDropdown(false)
        setShowHabitDropdown(false)
      }
    }
    
    if (showGoalDropdown || showHabitDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showGoalDropdown, showHabitDropdown])

  const colors = [
    { name: 'Modrá', value: '#3B82F6' },
    { name: 'Zelená', value: '#10B981' },
    { name: 'Fialová', value: '#8B5CF6' },
    { name: 'Růžová', value: '#EC4899' },
    { name: 'Oranžová', value: '#F59E0B' },
    { name: 'Červená', value: '#EF4444' },
  ]

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full" onClick={(e) => e.stopPropagation()}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-gray-900">{aspiration ? t('aspirace.editTitle') : t('aspirace.newAspirace')}</h3>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Název *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder="Např. Být zdravý a fit"
                required
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Popis</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder="Volitelný popis vaší aspirace..."
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Barva</label>
              <div className="flex gap-2 flex-wrap">
                {colors.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setColor(c.value)}
                    className={`w-10 h-10 rounded-lg border-2 transition-all ${
                      color === c.value ? 'border-gray-900 scale-110' : 'border-gray-300'
                    }`}
                    style={{ backgroundColor: c.value }}
                    title={c.name}
                  />
                ))}
              </div>
            </div>
        
            {/* Goals Selection */}
            <div className="relative dropdown-container">
              <label className="block text-sm font-medium text-gray-700 mb-2">Cíle</label>
              <button
                type="button"
                onClick={() => {
                  setShowGoalDropdown(!showGoalDropdown)
                  setShowHabitDropdown(false)
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-left flex items-center justify-between"
              >
                <span className="text-gray-700">
                  {selectedGoalIds.length > 0 
                    ? `${selectedGoalIds.length} ${selectedGoalIds.length === 1 ? 'cíl' : 'cílů'} vybráno`
                    : 'Vyberte cíle...'}
                </span>
                <svg className={`w-5 h-5 text-gray-500 transition-transform ${showGoalDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {showGoalDropdown && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {availableGoals.length === 0 ? (
                    <div className="px-4 py-3 text-sm text-gray-500">Žádné dostupné cíle</div>
                  ) : (
                    availableGoals.map((goal) => (
                      <label
                        key={goal.id}
                        className="flex items-center px-4 py-2 hover:bg-gray-50 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedGoalIds.includes(goal.id)}
                          onChange={() => toggleGoal(goal.id)}
                          className="mr-3 w-4 h-4 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
                        />
                        <span className="text-sm text-gray-700">{goal.title}</span>
                      </label>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Habits Selection */}
            <div className="relative dropdown-container">
              <label className="block text-sm font-medium text-gray-700 mb-2">Návyky</label>
              <button
                type="button"
                onClick={() => {
                  setShowHabitDropdown(!showHabitDropdown)
                  setShowGoalDropdown(false)
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-left flex items-center justify-between"
              >
                <span className="text-gray-700">
                  {selectedHabitIds.length > 0 
                    ? `${selectedHabitIds.length} ${selectedHabitIds.length === 1 ? 'návyk' : 'návyků'} vybráno`
                    : 'Vyberte návyky...'}
                </span>
                <svg className={`w-5 h-5 text-gray-500 transition-transform ${showHabitDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {showHabitDropdown && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {availableHabits.length === 0 ? (
                    <div className="px-4 py-3 text-sm text-gray-500">Žádné dostupné návyky</div>
                  ) : (
                    availableHabits.map((habit) => (
                      <label
                        key={habit.id}
                        className="flex items-center px-4 py-2 hover:bg-gray-50 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedHabitIds.includes(habit.id)}
                          onChange={() => toggleHabit(habit.id)}
                          className="mr-3 w-4 h-4 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
                        />
                        <span className="text-sm text-gray-700">{habit.name}</span>
                      </label>
                    ))
                  )}
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                {t('common.cancel')}
              </button>
              <button
                type="submit"
                disabled={!title.trim() || isSubmitting}
                className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (aspiration ? t('common.saving') : 'Vytváření...') : (aspiration ? t('common.save') : t('common.add'))}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

