'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useTranslations, useLocale } from 'next-intl'
import { Check, ChevronDown, ChevronUp, Plus, X, Filter } from 'lucide-react'

interface HabitsManagementViewProps {
  habits: any[]
  onHabitsUpdate?: (habits: any[]) => void
  handleHabitToggle?: (habitId: string, date?: string) => Promise<void>
  loadingHabits: Set<string>
}

export function HabitsManagementView({
  habits = [],
  onHabitsUpdate,
  handleHabitToggle,
  loadingHabits
}: HabitsManagementViewProps) {
  const t = useTranslations()
  const localeCode = useLocale()
  
  // States for habits management
  const [editingHabit, setEditingHabit] = useState<any>(null)
  
  // Filters
  const [habitsFrequencyFilter, setHabitsFrequencyFilter] = useState<'all' | 'daily' | 'weekly' | 'monthly' | 'custom'>('all')
  const [habitsShowCompletedToday, setHabitsShowCompletedToday] = useState(true)
  const [filtersExpanded, setFiltersExpanded] = useState(false)
  
  // Quick edit modals
  const [quickEditHabitId, setQuickEditHabitId] = useState<string | null>(null)
  const [quickEditHabitField, setQuickEditHabitField] = useState<'frequency' | 'days' | null>(null)
  const [quickEditHabitPosition, setQuickEditHabitPosition] = useState<{ top: number; left: number } | null>(null)

  // Auto-open modal if flag is set
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const autoOpen = localStorage.getItem('autoOpenHabitModal')
      if (autoOpen === 'true') {
        localStorage.removeItem('autoOpenHabitModal')
        setEditingHabit({
          id: null,
          name: '',
          description: '',
          frequency: 'daily',
          selectedDays: [],
          alwaysShow: false,
          reminderEnabled: false,
          reminderTime: ''
        })
      }
    }
  }, [])

  const initializeEditingHabit = (habit: any) => {
    setEditingHabit({
      ...habit,
      reminderEnabled: !!habit.reminder_time,
      selectedDays: habit.selected_days || [],
      alwaysShow: habit.always_show || false
    })
  }

  const handleUpdateHabit = async () => {
    if (!editingHabit || !editingHabit.name.trim()) {
      alert(t('table.habitNameRequired'))
      return
    }

    // Validate custom frequency
    if (editingHabit.frequency === 'custom' && editingHabit.selectedDays.length === 0) {
      alert('Pro vlastní frekvenci musíte vybrat alespoň jeden den')
      return
    }

    try {
      const isCreating = !editingHabit.id
      const response = await fetch('/api/habits', {
        method: isCreating ? 'POST' : 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(isCreating ? {
          name: editingHabit.name,
          description: '',
          frequency: editingHabit.frequency,
          reminderTime: editingHabit.reminderEnabled ? editingHabit.reminderTime : null,
          category: 'custom',
          difficulty: 'medium',
          isCustom: true,
          selectedDays: editingHabit.selectedDays,
          alwaysShow: editingHabit.alwaysShow,
          xpReward: 1
        } : {
          habitId: editingHabit.id,
          name: editingHabit.name,
          description: editingHabit.description,
          frequency: editingHabit.frequency,
          reminderTime: editingHabit.reminderEnabled ? editingHabit.reminderTime : null,
          selectedDays: editingHabit.selectedDays,
          alwaysShow: editingHabit.alwaysShow,
          xpReward: 1
        }),
      })

      if (response.ok) {
        const habit = await response.json()
        
        // Update habits in parent component
        if (onHabitsUpdate) {
          if (isCreating) {
            onHabitsUpdate([...habits, habit])
          } else {
            onHabitsUpdate(habits.map(h => h.id === habit.id ? habit : h))
          }
        }
        
        setEditingHabit(null)
      } else {
        console.error(`Failed to ${isCreating ? 'create' : 'update'} habit`)
        alert(`Nepodařilo se ${isCreating ? 'vytvořit' : 'aktualizovat'} návyk`)
      }
    } catch (error) {
      console.error(`Error ${editingHabit.id ? 'updating' : 'creating'} habit:`, error)
      alert(`Chyba při ${editingHabit.id ? 'aktualizaci' : 'vytváření'} návyku`)
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
      {/* Filters Row - Mobile: collapsible, Desktop: always visible */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-4 px-4 py-3 bg-white border-b border-gray-200">
        {/* Mobile: Collapsible filters */}
        <div className="md:hidden flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            <button
              onClick={() => setFiltersExpanded(!filtersExpanded)}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
            >
              <Filter className="w-4 h-4" />
              <span>Filtry</span>
              {filtersExpanded ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>
            
            {/* Add Button - Mobile */}
            <button
              onClick={() => {
                setEditingHabit({
                  id: null,
                  name: '',
                  frequency: 'daily',
                  reminderEnabled: true,
                  reminderTime: '09:00',
                  selectedDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
                  alwaysShow: false
                })
              }}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm font-medium flex-1"
            >
              <Plus className="w-4 h-4" />
              {t('habits.add')}
            </button>
          </div>
          
          {/* Collapsible filters content */}
          {filtersExpanded && (
            <div className="flex flex-col gap-2 pt-2 border-t border-gray-200">
          {/* Frequency Filter */}
          <select
            value={habitsFrequencyFilter}
            onChange={(e) => setHabitsFrequencyFilter(e.target.value as any)}
                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-600 focus:border-orange-600 bg-white"
          >
            <option value="all">{t('habits.filters.frequency.all')}</option>
            <option value="daily">{t('habits.filters.frequency.daily')}</option>
            <option value="weekly">{t('habits.filters.frequency.weekly')}</option>
            <option value="monthly">{t('habits.filters.frequency.monthly')}</option>
            <option value="custom">{t('habits.filters.frequency.custom')}</option>
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
          )}
        </div>
        
        {/* Desktop: Always visible filters */}
        <div className="hidden md:flex md:items-center gap-3 flex-1">
          {/* Frequency Filter */}
          <select
            value={habitsFrequencyFilter}
            onChange={(e) => setHabitsFrequencyFilter(e.target.value as any)}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-600 focus:border-orange-600 bg-white"
          >
            <option value="all">{t('habits.filters.frequency.all')}</option>
            <option value="daily">{t('habits.filters.frequency.daily')}</option>
            <option value="weekly">{t('habits.filters.frequency.weekly')}</option>
            <option value="monthly">{t('habits.filters.frequency.monthly')}</option>
            <option value="custom">{t('habits.filters.frequency.custom')}</option>
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
        
        {/* Add Button - Desktop */}
        <button
          onClick={() => {
            setEditingHabit({
              id: null,
              name: '',
              frequency: 'daily',
              reminderEnabled: true,
              reminderTime: '09:00',
              selectedDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
              alwaysShow: false
            })
          }}
          className="hidden md:flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          {t('habits.add')}
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
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">{t('table.name')}</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 w-32">{t('table.frequency')}</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 w-40">{t('table.days')}</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 w-16 last:pr-6"></th>
                </tr>
              </thead>
              <tbody style={{ overflow: 'visible' }}>
                {habits.filter((habit: any) => {
                  // Filter by frequency
                  if (habitsFrequencyFilter !== 'all' && habit.frequency !== habitsFrequencyFilter) {
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
                    <tr
                      key={habit.id}
                        onClick={() => initializeEditingHabit(habit)}
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
                            {habit.frequency === 'custom' ? t('table.custom') :
                              habit.frequency === 'daily' ? t('habits.filters.frequency.daily') :
                              habit.frequency === 'weekly' ? t('habits.filters.frequency.weekly') :
                                habit.frequency === 'monthly' ? t('habits.filters.frequency.monthly') : t('habits.filters.frequency.daily')}
                          </span>
                        </td>
                        <td className="px-4 py-2">
                          {habit.selected_days && habit.selected_days.length > 0 ? (
                            <div className="flex gap-1 flex-wrap">
                              {habit.selected_days.map((day: string) => {
                                const dayLabels: { [key: string]: string } = {
                                  monday: t('daysShort.mon'),
                                  tuesday: t('daysShort.tue'),
                                  wednesday: t('daysShort.wed'),
                                  thursday: t('daysShort.thu'),
                                  friday: t('daysShort.fri'),
                                  saturday: t('daysShort.sat'),
                                  sunday: t('daysShort.sun')
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
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              initializeEditingHabit(habit)
                            }}
                            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                            title={t('common.edit') || 'Upravit'}
                            onMouseDown={(e) => e.stopPropagation()}
                          >
                            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                        </td>
                      </tr>
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

      {/* Edit Habit Modal */}
      {editingHabit && typeof window !== 'undefined' && createPortal(
        <>
          <div 
            className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
            onClick={() => setEditingHabit(null)}
          >
            <div 
              className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-900">
                    {editingHabit.id ? t('habits.edit') : t('habits.create')}
                  </h2>
                  <button
                    onClick={() => setEditingHabit(null)}
                    className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full p-1.5 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">
                    {t('table.habitName')} <span className="text-orange-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={editingHabit.name || ''}
                    onChange={(e) => setEditingHabit({...editingHabit, name: e.target.value})}
                    className="w-full px-4 py-2.5 text-sm border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-600 focus:border-orange-600 transition-all bg-white"
                    placeholder="Např. Ranní cvičení"
                  />
                </div>

                {/* Days selection - only show for custom frequency */}
                {editingHabit.frequency === 'custom' && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-2">{t('table.daysOfWeek')}</label>
                    <div className="grid grid-cols-7 gap-2 mb-3">
                      {[
                        { key: 'monday', label: t('daysShort.mon') },
                        { key: 'tuesday', label: t('daysShort.tue') },
                        { key: 'wednesday', label: t('daysShort.wed') },
                        { key: 'thursday', label: t('daysShort.thu') },
                        { key: 'friday', label: t('daysShort.fri') },
                        { key: 'saturday', label: t('daysShort.sat') },
                        { key: 'sunday', label: t('daysShort.sun') }
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
                              ? 'bg-orange-600 text-white border-orange-600 shadow-md'
                              : 'bg-white text-gray-700 border-gray-300 hover:border-orange-600 hover:bg-orange-50'
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
                    <label className="block text-sm font-semibold text-gray-800 mb-2">{t('table.frequency')}</label>
                    <select
                      value={editingHabit.frequency || 'daily'}
                      onChange={(e) => setEditingHabit({...editingHabit, frequency: e.target.value})}
                      className="w-full px-4 py-2.5 text-sm border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-600 focus:border-orange-600 transition-all bg-white"
                    >
                      <option value="daily">{t('habits.filters.frequency.daily')}</option>
                      <option value="weekly">{t('habits.filters.frequency.weekly')}</option>
                      <option value="monthly">{t('habits.filters.frequency.monthly')}</option>
                      <option value="custom">{t('table.custom')}</option>
                    </select>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <input
                        type="checkbox"
                        id="editReminderEnabled"
                        checked={editingHabit.reminderEnabled || false}
                        onChange={(e) => setEditingHabit({...editingHabit, reminderEnabled: e.target.checked})}
                        className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                      />
                      <label htmlFor="editReminderEnabled" className="text-sm font-semibold text-gray-800">
                        {t('modal.enableReminder')}
                      </label>
                    </div>
                    {editingHabit.reminderEnabled && (
                      <input
                        type="time"
                        value={editingHabit.reminderTime || '09:00'}
                        onChange={(e) => setEditingHabit({...editingHabit, reminderTime: e.target.value})}
                        className="w-full px-4 py-2.5 text-sm border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-600 focus:border-orange-600 transition-all bg-white"
                      />
                    )}
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <input
                      type="checkbox"
                      id="editAlwaysShow"
                      checked={editingHabit.alwaysShow || false}
                      onChange={(e) => setEditingHabit({...editingHabit, alwaysShow: e.target.checked})}
                      className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                    />
                    <label htmlFor="editAlwaysShow" className="text-sm font-semibold text-gray-800">
                      {t('modal.showAlways')}
                    </label>
                  </div>
                  <p className="text-xs text-gray-500">
                    {t('modal.showAlwaysDescription')}
                  </p>
                </div>
              </div>

              <div className="p-6 border-t border-gray-200 flex items-center justify-between">
                {editingHabit.id && (
                  <button
                    onClick={handleDeleteHabit}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm font-medium"
                  >
                    {t('common.delete') || 'Smazat'}
                  </button>
                )}
                <div className={`flex gap-3 ${editingHabit.id ? '' : 'ml-auto'}`}>
                  <button
                    onClick={() => setEditingHabit(null)}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                  >
                    {t('common.cancel') || 'Zrušit'}
                  </button>
                  <button
                    onClick={handleUpdateHabit}
                    className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm font-medium"
                  >
                    {t('common.save') || 'Uložit'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>,
        document.body
      )}
      
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
              
              return null
            })()}
          </div>
        </>,
        document.body
      )}
    </div>
  )
}

