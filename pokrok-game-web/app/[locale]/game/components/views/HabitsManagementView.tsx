'use client'

import { useState, Fragment } from 'react'
import { createPortal } from 'react-dom'
import { useTranslations, useLocale } from 'next-intl'
import { Check, ChevronDown, Plus } from 'lucide-react'

interface HabitsManagementViewProps {
  habits: any[]
  aspirations: any[]
  onHabitsUpdate?: (habits: any[]) => void
  handleHabitToggle?: (habitId: string, date?: string) => Promise<void>
  loadingHabits: Set<string>
  setOverviewBalances?: (setter: (prev: Record<string, any>) => Record<string, any>) => void
}

export function HabitsManagementView({
  habits = [],
  aspirations = [],
  onHabitsUpdate,
  handleHabitToggle,
  loadingHabits,
  setOverviewBalances
}: HabitsManagementViewProps) {
  const t = useTranslations()
  const localeCode = useLocale()
  
  // States for habits management
  const [showAddHabitForm, setShowAddHabitForm] = useState(false)
  const [editingHabit, setEditingHabit] = useState<any>(null)
  const [newHabit, setNewHabit] = useState<{
    name: string
    description: string
    frequency: string
    reminderTime: string
    reminderEnabled: boolean
    selectedDays: string[]
    alwaysShow: boolean
    xpReward: number
    customXpReward: string
    aspirationId: string | null
  }>({
    name: '',
    description: '',
    frequency: 'daily',
    reminderTime: '09:00',
    reminderEnabled: true,
    selectedDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
    alwaysShow: false,
    xpReward: 1,
    customXpReward: '',
    aspirationId: null
  })
  
  // Filters
  const [habitsFrequencyFilter, setHabitsFrequencyFilter] = useState<'all' | 'daily' | 'weekly' | 'monthly' | 'custom'>('all')
  const [habitsAspirationFilter, setHabitsAspirationFilter] = useState<string | null>(null)
  const [habitsShowCompletedToday, setHabitsShowCompletedToday] = useState(true)
  
  // Quick edit modals
  const [quickEditHabitId, setQuickEditHabitId] = useState<string | null>(null)
  const [quickEditHabitField, setQuickEditHabitField] = useState<'frequency' | 'aspiration' | 'days' | null>(null)
  const [quickEditHabitPosition, setQuickEditHabitPosition] = useState<{ top: number; left: number } | null>(null)

  const toggleDay = (day: string) => {
    setNewHabit(prev => ({
      ...prev,
      selectedDays: prev.selectedDays.includes(day)
        ? prev.selectedDays.filter(d => d !== day)
        : [...prev.selectedDays, day]
    }))
  }

  const toggleAllDays = () => {
    const allDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    const isAllSelected = allDays.every(day => newHabit.selectedDays.includes(day))
    
    setNewHabit(prev => ({
      ...prev,
      selectedDays: isAllSelected ? [] : allDays
    }))
  }

  const initializeEditingHabit = (habit: any) => {
    setEditingHabit({
      ...habit,
      reminderEnabled: !!habit.reminder_time,
      selectedDays: habit.selected_days || [],
      alwaysShow: habit.always_show || false,
      xpReward: habit.xp_reward || 1,
      customXpReward: '',
      aspirationId: habit.aspiration_id || habit.aspirationId || null
    })
  }

  const handleCreateHabit = async () => {
    if (!newHabit.name.trim()) {
      alert('Název návyku je povinný')
      return
    }

    // Validate custom frequency
    if (newHabit.frequency === 'custom' && newHabit.selectedDays.length === 0) {
      alert('Pro vlastní frekvenci musíte vybrat alespoň jeden den')
      return
    }

    try {
      const response = await fetch('/api/habits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newHabit.name,
          description: '',
          frequency: newHabit.frequency,
          reminderTime: newHabit.reminderEnabled ? newHabit.reminderTime : null,
          category: 'custom',
          difficulty: 'medium',
          isCustom: true,
          selectedDays: newHabit.selectedDays,
          alwaysShow: newHabit.alwaysShow,
          xpReward: newHabit.customXpReward ? parseInt(newHabit.customXpReward) : newHabit.xpReward,
          aspirationId: newHabit.aspirationId
        }),
      })

      if (response.ok) {
        const createdHabit = await response.json()
        
        // Update habits in parent component
        if (onHabitsUpdate) {
          onHabitsUpdate([...habits, createdHabit])
        }
        
        // Update overview balance if habit has aspiration
        if (createdHabit.aspiration_id && setOverviewBalances) {
          try {
            const balanceResponse = await fetch(`/api/aspirations/balance?aspirationId=${createdHabit.aspiration_id}`)
            if (balanceResponse.ok) {
              const balance = await balanceResponse.json()
              setOverviewBalances((prev: Record<string, any>) => ({
                ...prev,
                [createdHabit.aspiration_id]: balance
              }))
            }
          } catch (error) {
            console.error('Error updating aspiration balance:', error)
          }
        }
        
        // Reset form
        setNewHabit({
          name: '',
          description: '',
          frequency: 'daily',
          reminderTime: '09:00',
          reminderEnabled: true,
          selectedDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
          alwaysShow: false,
          xpReward: 1,
          customXpReward: '',
          aspirationId: null
        })
        setShowAddHabitForm(false)
      } else {
        console.error('Failed to create habit')
        alert('Nepodařilo se vytvořit návyk')
      }
    } catch (error) {
      console.error('Error creating habit:', error)
      alert('Chyba při vytváření návyku')
    }
  }

  const handleUpdateHabit = async () => {
    if (!editingHabit || !editingHabit.name.trim()) {
      alert('Název návyku je povinný')
      return
    }

    try {
      const response = await fetch('/api/habits', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          habitId: editingHabit.id,
          name: editingHabit.name,
          description: editingHabit.description,
          frequency: editingHabit.frequency,
          reminderTime: editingHabit.reminderEnabled ? editingHabit.reminderTime : null,
          selectedDays: editingHabit.selectedDays,
          alwaysShow: editingHabit.alwaysShow,
          xpReward: editingHabit.customXpReward ? parseInt(editingHabit.customXpReward) : editingHabit.xpReward,
          aspirationId: editingHabit.aspirationId
        }),
      })

      if (response.ok) {
        const updatedHabit = await response.json()
        
        // Update habits in parent component
        if (onHabitsUpdate) {
          onHabitsUpdate(habits.map(habit => 
            habit.id === updatedHabit.id ? updatedHabit : habit
          ))
        }
        
        // Update overview balance if we're on overview page
        if (updatedHabit.aspiration_id && setOverviewBalances) {
          try {
            const balanceResponse = await fetch(`/api/aspirations/balance?aspirationId=${updatedHabit.aspiration_id}`)
            if (balanceResponse.ok) {
              const balance = await balanceResponse.json()
              setOverviewBalances((prev: Record<string, any>) => ({
                ...prev,
                [updatedHabit.aspiration_id]: balance
              }))
            }
          } catch (error) {
            console.error('Error updating aspiration balance:', error)
          }
        }
        
        // Also update balance for old aspiration if aspirationId changed
        const oldHabit = habits.find(h => h.id === updatedHabit.id)
        if (oldHabit && oldHabit.aspiration_id && oldHabit.aspiration_id !== updatedHabit.aspiration_id && setOverviewBalances) {
          try {
            const balanceResponse = await fetch(`/api/aspirations/balance?aspirationId=${oldHabit.aspiration_id}`)
            if (balanceResponse.ok) {
              const balance = await balanceResponse.json()
              setOverviewBalances((prev: Record<string, any>) => ({
                ...prev,
                [oldHabit.aspiration_id]: balance
              }))
            }
          } catch (error) {
            console.error('Error updating old aspiration balance:', error)
          }
        }
        
        setEditingHabit(null)
      } else {
        console.error('Failed to update habit')
        alert('Nepodařilo se aktualizovat návyk')
      }
    } catch (error) {
      console.error('Error updating habit:', error)
      alert('Chyba při aktualizaci návyku')
    }
  }

  const handleDeleteHabit = async () => {
    if (!editingHabit) return

    if (!confirm(`Opravdu chcete smazat návyk "${editingHabit.name}"? Tato akce je nevratná.`)) {
      return
    }

    try {
      const response = await fetch('/api/habits', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          habitId: editingHabit.id
        }),
      })

      if (response.ok) {
        // Remove habit from parent component
        if (onHabitsUpdate) {
          onHabitsUpdate(habits.filter(habit => habit.id !== editingHabit.id))
        }
        
        setEditingHabit(null)
      } else {
        console.error('Failed to delete habit')
        alert('Nepodařilo se smazat návyk')
      }
    } catch (error) {
      console.error('Error deleting habit:', error)
      alert('Chyba při mazání návyku')
    }
  }

  return (
    <div className="w-full h-full flex flex-col">
      {/* Add Habit Form */}
      {showAddHabitForm && (
        <div className="p-6 bg-gray-50 border-b border-gray-200 max-h-[50vh] overflow-y-auto">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Nový návyk</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Název návyku</label>
              <input
                type="text"
                value={newHabit.name}
                onChange={(e) => setNewHabit({...newHabit, name: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder="Např. Ranní cvičení"
              />
            </div>

            {/* Days selection - only show for custom frequency */}
            {newHabit.frequency === 'custom' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Dny v týdnu</label>
                <div className="grid grid-cols-7 gap-2 mb-3">
                  {[
                    { key: 'monday', label: 'Po' },
                    { key: 'tuesday', label: 'Út' },
                    { key: 'wednesday', label: 'St' },
                    { key: 'thursday', label: 'Čt' },
                    { key: 'friday', label: 'Pá' },
                    { key: 'saturday', label: 'So' },
                    { key: 'sunday', label: 'Ne' }
                  ].map(({ key, label }) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => toggleDay(key)}
                      className={`px-3 py-2 text-sm rounded-lg border transition-all duration-200 ${
                        newHabit.selectedDays.includes(key)
                          ? 'bg-orange-500 text-white border-orange-500 shadow-md'
                          : 'bg-white text-gray-700 border-gray-300 hover:border-orange-400 hover:bg-orange-50'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={toggleAllDays}
                  className="text-sm text-orange-600 hover:text-orange-700 font-medium"
                >
                  {newHabit.selectedDays.length === 7 ? 'Zrušit všechny' : 'Vybrat všechny'}
                </button>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Frekvence</label>
                <select
                  value={newHabit.frequency}
                  onChange={(e) => setNewHabit({...newHabit, frequency: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                >
                  <option value="daily">Denně</option>
                  <option value="weekly">Týdně</option>
                  <option value="monthly">Měsíčně</option>
                  <option value="custom">Vlastní</option>
                </select>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <input
                    type="checkbox"
                    id="reminderEnabled"
                    checked={newHabit.reminderEnabled}
                    onChange={(e) => setNewHabit({...newHabit, reminderEnabled: e.target.checked})}
                    className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                  />
                  <label htmlFor="reminderEnabled" className="text-sm font-medium text-gray-700">
                    Zapnout připomenutí
                  </label>
                </div>
                {newHabit.reminderEnabled && (
                  <input
                    type="time"
                    value={newHabit.reminderTime}
                    onChange={(e) => setNewHabit({...newHabit, reminderTime: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                )}
              </div>
            </div>

            {/* Aspiration Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Aspirace (volitelné)</label>
              <select
                value={newHabit.aspirationId || ''}
                onChange={(e) => setNewHabit({...newHabit, aspirationId: e.target.value ? e.target.value : null})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              >
                <option value="">Žádná aspirace</option>
                {aspirations.map((aspiration: any) => (
                  <option key={aspiration.id} value={aspiration.id}>
                    {aspiration.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <input
                    type="checkbox"
                    id="alwaysShow"
                    checked={newHabit.alwaysShow}
                    onChange={(e) => setNewHabit({...newHabit, alwaysShow: e.target.checked})}
                    className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                  />
                  <label htmlFor="alwaysShow" className="text-sm font-medium text-gray-700">
                    Zobrazit vždy
                  </label>
                </div>
                <p className="text-xs text-gray-500">
                  Návyk se zobrazí v hlavním panelu nehledě na frekvenci
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">XP odměna</label>
                <div className="flex gap-2 mb-2">
                  {[1, 2, 3, 4, 5].map(xp => (
                    <button
                      key={xp}
                      type="button"
                      onClick={() => setNewHabit({...newHabit, xpReward: xp, customXpReward: ''})}
                      className={`px-3 py-1 text-sm rounded-lg border transition-all duration-200 ${
                        newHabit.xpReward === xp && !newHabit.customXpReward
                          ? 'bg-orange-500 text-white border-orange-500'
                          : 'bg-white text-gray-700 border-gray-300 hover:border-orange-400'
                      }`}
                    >
                      {xp}
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  value={newHabit.customXpReward}
                  onChange={(e) => setNewHabit({...newHabit, customXpReward: e.target.value, xpReward: parseInt(e.target.value) || 1})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="Vlastní XP"
                  min="1"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleCreateHabit}
                className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium"
              >
                Vytvořit návyk
              </button>
              <button
                onClick={() => setShowAddHabitForm(false)}
                className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors font-medium"
              >
                {t('common.cancel')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filters Row */}
      <div className="flex items-center justify-between gap-4 px-4 py-2 bg-white border-b border-gray-200">
        <div className="flex items-center gap-3 flex-wrap">
          {/* Frequency Filter */}
          <select
            value={habitsFrequencyFilter}
            onChange={(e) => setHabitsFrequencyFilter(e.target.value as any)}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white"
          >
            <option value="all">{t('habits.filters.frequency.all')}</option>
            <option value="daily">{t('habits.filters.frequency.daily')}</option>
            <option value="weekly">{t('habits.filters.frequency.weekly')}</option>
            <option value="monthly">{t('habits.filters.frequency.monthly')}</option>
            <option value="custom">{t('habits.filters.frequency.custom')}</option>
          </select>
          
          {/* Aspiration Filter */}
          <select
            value={habitsAspirationFilter || ''}
            onChange={(e) => setHabitsAspirationFilter(e.target.value || null)}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white min-w-[150px]"
          >
            <option value="">{t('habits.filters.aspiration.all')}</option>
            {aspirations.map((aspiration: any) => (
              <option key={aspiration.id} value={aspiration.id}>{aspiration.title}</option>
            ))}
          </select>
          
          {/* Completed Today Filter */}
          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input
              type="checkbox"
              checked={habitsShowCompletedToday}
              onChange={(e) => setHabitsShowCompletedToday(e.target.checked)}
              className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
            />
            <span>{t('habits.filters.showCompletedToday')}</span>
          </label>
        </div>
        
        {/* Add Button */}
        <button
          onClick={() => setShowAddHabitForm(!showAddHabitForm)}
          className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          {t('habits.addHabit')}
        </button>
      </div>

      {/* Habits List */}
      <div className="flex-1 overflow-y-auto">
        <div className="w-full overflow-x-auto">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden m-4">
            <table className="w-full border-collapse" style={{ overflow: 'visible' }}>
              <thead>
                <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 w-12 first:pl-6">#</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Název</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 w-32">Frekvence</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 w-40">Dny</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 w-40 last:pr-6">Aspirace</th>
                </tr>
              </thead>
              <tbody style={{ overflow: 'visible' }}>
                {habits.filter((habit: any) => {
                  // Filter by frequency
                  if (habitsFrequencyFilter !== 'all' && habit.frequency !== habitsFrequencyFilter) {
                    return false
                  }
                  
                  // Filter by aspiration
                  if (habitsAspirationFilter && (habit.aspiration_id || habit.aspirationId) !== habitsAspirationFilter) {
                    return false
                  }
                  
                  // Filter by completed today (if unchecked, hide completed)
                  if (!habitsShowCompletedToday) {
                    const today = new Date().toISOString().split('T')[0]
                    const habitCompletions = habit.completions || []
                    const isCompletedToday = habitCompletions.some((c: any) => c.date === today)
                    if (isCompletedToday) {
                      return false
                    }
                  }
                  
                  return true
                }).map((habit, index) => {
                  // Calculate isCompletedToday using local date and habit_completions
                  const now = new Date()
                  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
                  const isCompletedToday = habit && habit.habit_completions && habit.habit_completions[today] === true
                  const isEditing = editingHabit && editingHabit.id === habit.id
                  const habitAspiration = habit.aspiration_id || habit.aspirationId ? aspirations.find((a: any) => a.id === (habit.aspiration_id || habit.aspirationId)) : null
                  
                  // Check if habit is active today
                  const todayDay = now.getDay() // 0 = Sunday, 1 = Monday, etc.
                  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
                  const todayName = dayNames[todayDay]
                  
                  let isActiveToday = false
                  if (habit.always_show || habit.alwaysShow) {
                    isActiveToday = true
                  } else {
                    switch (habit.frequency) {
                      case 'daily':
                        isActiveToday = true
                        break
                      case 'weekly':
                      case 'custom':
                        if (habit.selected_days && habit.selected_days.length > 0) {
                          isActiveToday = habit.selected_days.includes(todayName)
                        }
                        break
                      case 'monthly':
                        const createdDate = habit.created_at ? new Date(habit.created_at) : new Date()
                        isActiveToday = now.getDate() === createdDate.getDate()
                        break
                    }
                  }
                  
                  const shouldGrayOut = !isActiveToday && !(habit.always_show || habit.alwaysShow)
                  
                  return (
                    <Fragment key={habit.id}>
                      <tr
                        onClick={() => {
                          if (isEditing) {
                            setEditingHabit(null)
                          } else {
                            initializeEditingHabit(habit)
                          }
                        }}
                        className={`border-b border-gray-100 hover:bg-orange-50/30 cursor-pointer transition-all duration-200 last:border-b-0 ${
                          isCompletedToday ? 'bg-orange-50/50 hover:bg-orange-50' : 'bg-white'
                        } ${shouldGrayOut ? 'opacity-50' : ''}`}
                      >
                        <td className="px-4 py-2 first:pl-6">
                          <div className="flex items-center justify-center">
                            <button
                              onClick={async (e) => {
                                e.stopPropagation()
                                if (!loadingHabits.has(habit.id) && handleHabitToggle) {
                                  await handleHabitToggle(habit.id)
                                }
                              }}
                              disabled={loadingHabits.has(habit.id)}
                              className="flex items-center justify-center transition-all duration-200 cursor-pointer hover:scale-110"
                            >
                              {loadingHabits.has(habit.id) ? (
                                <svg className="animate-spin h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                              ) : isCompletedToday ? (
                                <Check className="w-5 h-5 text-orange-600" strokeWidth={3} />
                              ) : (
                                <Check className={`w-5 h-5 ${shouldGrayOut ? 'text-gray-300' : 'text-gray-400'}`} strokeWidth={2.5} fill="none" />
                              )}
                            </button>
                          </div>
                        </td>
                        <td className="px-4 py-2">
                          <span className={`font-semibold text-sm ${isCompletedToday ? 'text-gray-500 line-through' : shouldGrayOut ? 'text-gray-400' : 'text-gray-900'}`}>
                            {habit.name}
                          </span>
                        </td>
                        <td className="px-4 py-2">
                          <span 
                            onClick={(e) => {
                              e.stopPropagation()
                              const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
                              setQuickEditHabitPosition({ top: rect.bottom + 4, left: rect.left })
                              setQuickEditHabitId(habit.id)
                              setQuickEditHabitField('frequency')
                            }}
                            className={`text-xs px-2.5 py-1.5 rounded-lg bg-gray-50 border border-gray-200 font-medium cursor-pointer hover:opacity-80 transition-opacity ${
                              shouldGrayOut ? 'text-gray-400' : 'text-gray-700'
                            }`}
                          >
                            {habit.frequency === 'custom' ? 'Vlastní' :
                              habit.frequency === 'daily' ? 'Denně' :
                              habit.frequency === 'weekly' ? 'Týdně' :
                                habit.frequency === 'monthly' ? 'Měsíčně' : 'Denně'}
                          </span>
                        </td>
                        <td className="px-4 py-2">
                          {habit.selected_days && habit.selected_days.length > 0 ? (
                            <div className="flex gap-1 flex-wrap">
                              {habit.selected_days.map((day: string) => {
                                const dayLabels: { [key: string]: string } = {
                                  monday: 'Po',
                                  tuesday: 'Út',
                                  wednesday: 'St',
                                  thursday: 'Čt',
                                  friday: 'Pá',
                                  saturday: 'So',
                                  sunday: 'Ne'
                                }
                                return (
                                  <span key={day} className={`text-xs px-1.5 py-0.5 rounded ${
                                    shouldGrayOut 
                                      ? 'bg-gray-100 text-gray-400' 
                                      : 'bg-orange-100 text-orange-700'
                                  }`}>
                                    {dayLabels[day]}
                                  </span>
                                )
                              })}
                            </div>
                          ) : (
                            <span className={`text-xs ${shouldGrayOut ? 'text-gray-300' : 'text-gray-400'}`}>-</span>
                          )}
                        </td>
                        <td className="px-4 py-2 last:pr-6">
                          <div
                            onClick={(e) => {
                              e.stopPropagation()
                              const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
                              setQuickEditHabitPosition({ top: rect.bottom + 4, left: rect.left })
                              setQuickEditHabitId(habit.id)
                              setQuickEditHabitField('aspiration')
                            }}
                            className="flex items-center gap-1.5 cursor-pointer hover:opacity-80 transition-opacity"
                          >
                            {habitAspiration ? (
                              <>
                                <div 
                                  className="w-3 h-3 rounded-full"
                                  style={{ backgroundColor: habitAspiration.color || '#9333EA', opacity: shouldGrayOut ? 0.5 : 1 }}
                                />
                                <span className={`text-xs truncate max-w-[150px] ${
                                  shouldGrayOut ? 'text-gray-400' : 'text-gray-700'
                                }`}>
                                  {habitAspiration.title}
                                </span>
                              </>
                            ) : (
                              <span className={`text-xs ${shouldGrayOut ? 'text-gray-300' : 'text-gray-400'}`}>Bez aspirace</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-2 last:pr-6">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              initializeEditingHabit(habit)
                            }}
                            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                            title={t('common.edit') || 'Upravit'}
                          >
                            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                      {isEditing && (
                        <tr>
                          <td colSpan={7} className="px-4 py-3 bg-orange-50/50 first:pl-6 last:pr-6">
                            <div className="editing-form p-4 bg-white rounded-xl border border-orange-200 shadow-sm">
                              <h4 className="text-md font-semibold text-gray-800 mb-4">Upravit návyk</h4>
                              <div className="space-y-4">
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-2">Název návyku</label>
                                  <input
                                    type="text"
                                    value={editingHabit.name}
                                    onChange={(e) => setEditingHabit({...editingHabit, name: e.target.value})}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                    placeholder="Např. Ranní cvičení"
                                  />
                                </div>

                                {/* Days selection - only show for custom frequency */}
                                {editingHabit.frequency === 'custom' && (
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Dny v týdnu</label>
                                    <div className="grid grid-cols-7 gap-2 mb-3">
                                      {[
                                        { key: 'monday', label: 'Po' },
                                        { key: 'tuesday', label: 'Út' },
                                        { key: 'wednesday', label: 'St' },
                                        { key: 'thursday', label: 'Čt' },
                                        { key: 'friday', label: 'Pá' },
                                        { key: 'saturday', label: 'So' },
                                        { key: 'sunday', label: 'Ne' }
                                      ].map(({ key, label }) => (
                                        <button
                                          key={key}
                                          type="button"
                                          onClick={() => {
                                            const newDays = editingHabit.selectedDays.includes(key)
                                              ? editingHabit.selectedDays.filter((d: string) => d !== key)
                                              : [...editingHabit.selectedDays, key]
                                            setEditingHabit({...editingHabit, selectedDays: newDays})
                                          }}
                                          className={`px-3 py-2 text-sm rounded-lg border transition-all duration-200 ${
                                            editingHabit.selectedDays.includes(key)
                                              ? 'bg-orange-500 text-white border-orange-500 shadow-md'
                                              : 'bg-white text-gray-700 border-gray-300 hover:border-orange-400 hover:bg-orange-50'
                                          }`}
                                        >
                                          {label}
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Frekvence</label>
                                    <select
                                      value={editingHabit.frequency}
                                      onChange={(e) => setEditingHabit({...editingHabit, frequency: e.target.value})}
                                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                    >
                                      <option value="daily">Denně</option>
                                      <option value="weekly">Týdně</option>
                                      <option value="monthly">Měsíčně</option>
                                      <option value="custom">Vlastní</option>
                                    </select>
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-2 mb-2">
                                      <input
                                        type="checkbox"
                                        id={`editReminderEnabled-${habit.id}`}
                                        checked={editingHabit.reminderEnabled}
                                        onChange={(e) => setEditingHabit({...editingHabit, reminderEnabled: e.target.checked})}
                                        className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                                      />
                                      <label htmlFor={`editReminderEnabled-${habit.id}`} className="text-sm font-medium text-gray-700">
                                        Zapnout připomenutí
                                      </label>
                                    </div>
                                    {editingHabit.reminderEnabled && (
                                      <input
                                        type="time"
                                        value={editingHabit.reminderTime}
                                        onChange={(e) => setEditingHabit({...editingHabit, reminderTime: e.target.value})}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                      />
                                    )}
                                  </div>
                                </div>

                                {/* Aspiration Selection */}
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-2">Aspirace (volitelné)</label>
                                  <select
                                    value={editingHabit.aspirationId || ''}
                                    onChange={(e) => setEditingHabit({...editingHabit, aspirationId: e.target.value ? e.target.value : null})}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                  >
                                    <option value="">Žádná aspirace</option>
                                    {aspirations.map((aspiration: any) => (
                                      <option key={aspiration.id} value={aspiration.id}>
                                        {aspiration.title}
                                      </option>
                                    ))}
                                  </select>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <div className="flex items-center gap-2 mb-2">
                                      <input
                                        type="checkbox"
                                        id={`editAlwaysShow-${habit.id}`}
                                        checked={editingHabit.alwaysShow}
                                        onChange={(e) => setEditingHabit({...editingHabit, alwaysShow: e.target.checked})}
                                        className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                                      />
                                      <label htmlFor={`editAlwaysShow-${habit.id}`} className="text-sm font-medium text-gray-700">
                                        Zobrazit vždy
                                      </label>
                                    </div>
                                    <p className="text-xs text-gray-500">
                                      Návyk se zobrazí v hlavním panelu nehledě na frekvenci
                                    </p>
                                  </div>
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">XP odměna</label>
                                    <div className="flex gap-2 mb-2">
                                      {[1, 2, 3, 4, 5].map(xp => (
                                        <button
                                          key={xp}
                                          type="button"
                                          onClick={() => setEditingHabit({...editingHabit, xpReward: xp, customXpReward: ''})}
                                          className={`px-3 py-1 text-sm rounded-lg border transition-all duration-200 ${
                                            editingHabit.xpReward === xp && !editingHabit.customXpReward
                                              ? 'bg-orange-500 text-white border-orange-500'
                                              : 'bg-white text-gray-700 border-gray-300 hover:border-orange-400'
                                          }`}
                                        >
                                          {xp}
                                        </button>
                                      ))}
                                    </div>
                                    <input
                                      type="number"
                                      value={editingHabit.customXpReward}
                                      onChange={(e) => setEditingHabit({...editingHabit, customXpReward: e.target.value, xpReward: parseInt(e.target.value) || 1})}
                                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                      placeholder="Vlastní XP"
                                      min="1"
                                    />
                                  </div>
                                </div>

                                <div className="flex gap-3">
                                  <button
                                    onClick={handleUpdateHabit}
                                    className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium"
                                  >
                                    {t('details.habit.saveChanges')}
                                  </button>
                                  <button
                                    onClick={() => setEditingHabit(null)}
                                    className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors font-medium"
                                  >
                                    {t('common.cancel')}
                                  </button>
                                  <button
                                    onClick={handleDeleteHabit}
                                    className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium"
                                  >
                                    Smazat návyk
                                  </button>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  )
                })}
                {habits.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                      <p className="text-lg">Žádné návyky nejsou nastavené</p>
                      <p className="text-sm">Klikněte na tlačítko výše pro přidání nového návyku</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
      {/* Quick Edit Modals for Habits */}
      {quickEditHabitId && quickEditHabitPosition && typeof window !== 'undefined' && createPortal(
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={(e) => {
              e.stopPropagation()
              setQuickEditHabitId(null)
              setQuickEditHabitField(null)
              setQuickEditHabitPosition(null)
            }}
          />
          <div 
            className="fixed z-50 bg-white border-2 border-gray-200 rounded-xl shadow-2xl p-4 min-w-[250px] max-w-[90vw]"
            style={(() => {
              if (typeof window === 'undefined') {
                return {
                  top: `${quickEditHabitPosition.top}px`,
                  left: `${quickEditHabitPosition.left}px`
                }
              }
              
              const modalWidth = 250
              const modalHeight = 200
              const padding = 10
              
              let adjustedTop = quickEditHabitPosition.top
              let adjustedLeft = quickEditHabitPosition.left
              
              if (adjustedLeft + modalWidth > window.innerWidth - padding) {
                adjustedLeft = window.innerWidth - modalWidth - padding
              }
              if (adjustedLeft < padding) {
                adjustedLeft = padding
              }
              
              if (adjustedTop + modalHeight > window.innerHeight - padding) {
                adjustedTop = quickEditHabitPosition.top - modalHeight - 40
                if (adjustedTop < padding) {
                  adjustedTop = padding
                }
              }
              if (adjustedTop < padding) {
                adjustedTop = padding
              }
              
              return {
                top: `${adjustedTop}px`,
                left: `${adjustedLeft}px`
              }
            })()}
            onClick={(e) => e.stopPropagation()}
          >
            {(() => {
              const habit = habits.find((h: any) => h.id === quickEditHabitId)
              if (!habit) return null
              
              if (quickEditHabitField === 'frequency') {
                return (
                  <>
                    <div className="max-h-[300px] overflow-y-auto">
                      <button
                        onClick={async (e) => {
                          e.stopPropagation()
                          try {
                            const response = await fetch(`/api/cesta/habits/${habit.id}`, {
                              method: 'PATCH',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ frequency: 'daily' })
                            })
                            if (response.ok) {
                              const updatedHabit = await response.json()
                              const updatedHabits = habits.map((h: any) => h.id === habit.id ? updatedHabit : h)
                              onHabitsUpdate?.(updatedHabits)
                              setQuickEditHabitId(null)
                              setQuickEditHabitField(null)
                              setQuickEditHabitPosition(null)
                            }
                          } catch (error) {
                            console.error('Error updating habit frequency:', error)
                          }
                        }}
                        className={`w-full text-left px-4 py-3 text-sm hover:bg-purple-50 transition-colors ${
                          habit.frequency === 'daily' ? 'bg-purple-50 text-purple-700 font-semibold' : 'text-gray-700'
                        }`}
                      >
                        {t('habits.filters.frequency.daily')}
                      </button>
                      <button
                        onClick={async (e) => {
                          e.stopPropagation()
                          try {
                            const response = await fetch(`/api/cesta/habits/${habit.id}`, {
                              method: 'PATCH',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ frequency: 'weekly' })
                            })
                            if (response.ok) {
                              const updatedHabit = await response.json()
                              const updatedHabits = habits.map((h: any) => h.id === habit.id ? updatedHabit : h)
                              onHabitsUpdate?.(updatedHabits)
                              setQuickEditHabitId(null)
                              setQuickEditHabitField(null)
                              setQuickEditHabitPosition(null)
                            }
                          } catch (error) {
                            console.error('Error updating habit frequency:', error)
                          }
                        }}
                        className={`w-full text-left px-4 py-3 text-sm hover:bg-purple-50 transition-colors ${
                          habit.frequency === 'weekly' ? 'bg-purple-50 text-purple-700 font-semibold' : 'text-gray-700'
                        }`}
                      >
                        {t('habits.filters.frequency.weekly')}
                      </button>
                      <button
                        onClick={async (e) => {
                          e.stopPropagation()
                          try {
                            const response = await fetch(`/api/cesta/habits/${habit.id}`, {
                              method: 'PATCH',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ frequency: 'monthly' })
                            })
                            if (response.ok) {
                              const updatedHabit = await response.json()
                              const updatedHabits = habits.map((h: any) => h.id === habit.id ? updatedHabit : h)
                              onHabitsUpdate?.(updatedHabits)
                              setQuickEditHabitId(null)
                              setQuickEditHabitField(null)
                              setQuickEditHabitPosition(null)
                            }
                          } catch (error) {
                            console.error('Error updating habit frequency:', error)
                          }
                        }}
                        className={`w-full text-left px-4 py-3 text-sm hover:bg-purple-50 transition-colors ${
                          habit.frequency === 'monthly' ? 'bg-purple-50 text-purple-700 font-semibold' : 'text-gray-700'
                        }`}
                      >
                        {t('habits.filters.frequency.monthly')}
                      </button>
                      <button
                        onClick={async (e) => {
                          e.stopPropagation()
                          try {
                            const response = await fetch(`/api/cesta/habits/${habit.id}`, {
                              method: 'PATCH',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ frequency: 'custom' })
                            })
                            if (response.ok) {
                              const updatedHabit = await response.json()
                              const updatedHabits = habits.map((h: any) => h.id === habit.id ? updatedHabit : h)
                              onHabitsUpdate?.(updatedHabits)
                              setQuickEditHabitId(null)
                              setQuickEditHabitField(null)
                              setQuickEditHabitPosition(null)
                            }
                          } catch (error) {
                            console.error('Error updating habit frequency:', error)
                          }
                        }}
                        className={`w-full text-left px-4 py-3 text-sm hover:bg-purple-50 transition-colors ${
                          habit.frequency === 'custom' ? 'bg-purple-50 text-purple-700 font-semibold' : 'text-gray-700'
                        }`}
                      >
                        {t('habits.filters.frequency.custom')}
                      </button>
                    </div>
                  </>
                )
              }
              
              if (quickEditHabitField === 'aspiration') {
                return (
                  <>
                    <div className="max-h-[300px] overflow-y-auto">
                      <button
                        onClick={async (e) => {
                          e.stopPropagation()
                          try {
                            const response = await fetch(`/api/cesta/habits/${habit.id}`, {
                              method: 'PATCH',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ aspiration_id: null })
                            })
                            if (response.ok) {
                              const updatedHabit = await response.json()
                              const updatedHabits = habits.map((h: any) => h.id === habit.id ? updatedHabit : h)
                              onHabitsUpdate?.(updatedHabits)
                              setQuickEditHabitId(null)
                              setQuickEditHabitField(null)
                              setQuickEditHabitPosition(null)
                            }
                          } catch (error) {
                            console.error('Error updating habit aspiration:', error)
                          }
                        }}
                        className={`w-full text-left px-4 py-3 text-sm hover:bg-purple-50 transition-colors ${
                          !habit.aspiration_id && !habit.aspirationId ? 'bg-purple-50 text-purple-700 font-semibold' : 'text-gray-700'
                        }`}
                      >
                        {t('goals.noAspiration') || 'Bez aspirace'}
                      </button>
                      {aspirations.map((aspiration: any) => (
                        <button
                          key={aspiration.id}
                          onClick={async (e) => {
                            e.stopPropagation()
                            try {
                              const response = await fetch(`/api/cesta/habits/${habit.id}`, {
                                method: 'PATCH',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ aspiration_id: aspiration.id })
                              })
                              if (response.ok) {
                                const updatedHabit = await response.json()
                                const updatedHabits = habits.map((h: any) => h.id === habit.id ? updatedHabit : h)
                                onHabitsUpdate?.(updatedHabits)
                                setQuickEditHabitId(null)
                                setQuickEditHabitField(null)
                                setQuickEditHabitPosition(null)
                              }
                            } catch (error) {
                              console.error('Error updating habit aspiration:', error)
                            }
                          }}
                          className={`w-full text-left px-4 py-3 text-sm hover:bg-purple-50 transition-colors flex items-center gap-2 ${
                            (habit.aspiration_id || habit.aspirationId) === aspiration.id ? 'bg-purple-50 text-purple-700 font-semibold' : 'text-gray-700'
                          }`}
                        >
                          <div 
                            className="w-3 h-3 rounded-full flex-shrink-0"
                            style={{ backgroundColor: aspiration.color || '#9333EA' }}
                          ></div>
                          <span className="truncate">{aspiration.title}</span>
                        </button>
                      ))}
                    </div>
                  </>
                )
              }
              
              return null
            })()}
          </div>
        </>,
        document.body
      )}
    </div>
  )
}

