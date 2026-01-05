'use client'

import { useState, useRef, useEffect } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { ChevronLeft, ChevronRight, Check, Calendar, CheckCircle, Zap, Flame, Trophy } from 'lucide-react'
import { getLocalDateString } from '../utils/dateHelpers'
import { isHabitScheduledForDay, getHabitStartDate } from '../utils/habitHelpers'
import { HabitModal } from '../modals/HabitModal'

interface HabitDetailInlineViewProps {
  habit: any
  habitsPageTimelineOffset: number
  setHabitsPageTimelineOffset: (value: number | ((prev: number) => number)) => void
  habitsPageVisibleDays: number
  setHabitsPageVisibleDays: (value: number | ((prev: number) => number)) => void
  handleHabitCalendarToggle: (habitId: string, date: string, currentState: 'completed' | 'missed' | 'planned' | 'not-scheduled' | 'today', isScheduled: boolean) => Promise<void>
  loadingHabits: Set<string>
  onHabitUpdate: (updatedHabit: any) => void
  habitsPageTimelineContainerRef: React.RefObject<HTMLDivElement>
  areas: any[]
}

export function HabitDetailInlineView({
  habit,
  habitsPageTimelineOffset,
  setHabitsPageTimelineOffset,
  habitsPageVisibleDays,
  setHabitsPageVisibleDays,
  handleHabitCalendarToggle,
  loadingHabits,
  onHabitUpdate,
  habitsPageTimelineContainerRef,
  areas
}: HabitDetailInlineViewProps) {
  const t = useTranslations()
  const locale = useLocale()
  const localeCode = locale === 'cs' ? 'cs-CZ' : 'en-US'
  
  // Local state for habit (to update immediately on edit)
  const [localHabit, setLocalHabit] = useState(habit)
  
  // HabitModal editing state
  const [editingHabitName, setEditingHabitName] = useState(habit?.name || '')
  const [editingHabitDescription, setEditingHabitDescription] = useState(habit?.description || '')
  const [editingHabitIcon, setEditingHabitIcon] = useState(habit?.icon || 'Target')
  const [editingHabitFrequency, setEditingHabitFrequency] = useState<'daily' | 'weekly' | 'monthly'>(habit?.frequency || 'daily')
  const [editingHabitSelectedDays, setEditingHabitSelectedDays] = useState<string[]>(habit?.selected_days || [])
  const [editingHabitMonthlyType, setEditingHabitMonthlyType] = useState<'specificDays' | 'weekdayInMonth'>('specificDays')
  const [editingHabitWeekdayInMonthSelections, setEditingHabitWeekdayInMonthSelections] = useState<Array<{week: string, day: string}>>([])
  const [editingHabitAutoAdjust31, setEditingHabitAutoAdjust31] = useState(false)
  const [editingHabitReminderTime, setEditingHabitReminderTime] = useState(habit?.reminder_time || '')
  const [editingHabitNotificationEnabled, setEditingHabitNotificationEnabled] = useState(habit?.notification_enabled || false)
  const [editingHabitAreaId, setEditingHabitAreaId] = useState<string | null>(habit?.area_id || null)
  const [editingHabitMonthWeek, setEditingHabitMonthWeek] = useState('')
  const [editingHabitMonthDay, setEditingHabitMonthDay] = useState('')
  const [isSavingHabit, setIsSavingHabit] = useState(false)
  
  // Update local habit and editing state when prop changes
  useEffect(() => {
    setLocalHabit(habit)
    setEditingHabitName(habit?.name || '')
    setEditingHabitDescription(habit?.description || '')
    setEditingHabitIcon(habit?.icon || 'Target')
    setEditingHabitFrequency(habit?.frequency || 'daily')
    setEditingHabitSelectedDays(habit?.selected_days || [])
    setEditingHabitReminderTime(habit?.reminder_time || '')
    setEditingHabitNotificationEnabled(habit?.notification_enabled || false)
    setEditingHabitAreaId(habit?.area_id || null)
    
    // Parse monthly frequency selections
    if (habit?.frequency === 'monthly' && habit?.selected_days) {
      const monthWeekDays = habit.selected_days.filter((d: string) => d.includes('_'))
      if (monthWeekDays.length > 0) {
        // Group by unique combinations
        const weekSet = new Set<string>()
        const daySet = new Set<string>()
        monthWeekDays.forEach((d: string) => {
          const [week, day] = d.split('_')
          if (week) weekSet.add(week)
          if (day) daySet.add(day)
        })
        setEditingHabitWeekdayInMonthSelections([{ 
          week: Array.from(weekSet).join(','), 
          day: Array.from(daySet).join(',') 
        }])
        setEditingHabitMonthlyType('weekdayInMonth')
      } else {
        setEditingHabitWeekdayInMonthSelections([])
        setEditingHabitMonthlyType('specificDays')
      }
    } else {
      setEditingHabitWeekdayInMonthSelections([])
      setEditingHabitMonthlyType('specificDays')
    }
  }, [habit])
  
  // Calculate visible days based on container width - same as in HabitsPage
  useEffect(() => {
    const calculateVisibleDays = () => {
      if (habitsPageTimelineContainerRef.current) {
        const containerWidth = habitsPageTimelineContainerRef.current.offsetWidth
        // Each day is 32px wide + 4px gap (gap-1) = 36px total per day
        // No habit name column in detail view, so use full width
        const availableWidth = containerWidth
        const daysThatFit = Math.floor(availableWidth / 36)
        const newVisibleDays = Math.max(7, daysThatFit) // Minimum 7 days
        setHabitsPageVisibleDays(newVisibleDays)
      }
    }
    
    // Use requestAnimationFrame to ensure DOM is rendered
    const timeoutId = setTimeout(() => {
      calculateVisibleDays()
    }, 0)
    
    window.addEventListener('resize', calculateVisibleDays)
    return () => {
      clearTimeout(timeoutId)
      window.removeEventListener('resize', calculateVisibleDays)
    }
  }, [setHabitsPageVisibleDays, habitsPageTimelineContainerRef])
  
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  // Calculate statistics
  const calculateStats = () => {
    let totalPlanned = 0
    let totalCompleted = 0
    let completedOutsidePlan = 0
    let currentStreak = 0
    let maxStreak = localHabit.max_streak || 0
    
    const startDate = getHabitStartDate(localHabit)
    const currentDate = new Date(startDate)
    
    while (currentDate <= today) {
      const date = new Date(currentDate)
      const isScheduled = isHabitScheduledForDay(localHabit, date)
      const dateStr = getLocalDateString(date)
      const isCompleted = localHabit.habit_completions && localHabit.habit_completions[dateStr] === true
      
      if (isScheduled) {
        totalPlanned++
        if (isCompleted) {
          totalCompleted++
        }
      } else if (isCompleted) {
        completedOutsidePlan++
      }
      
      currentDate.setDate(currentDate.getDate() + 1)
    }
    
    // Calculate current streak
    let streakDate = new Date(today)
    while (streakDate >= startDate) {
      const dateStr = getLocalDateString(streakDate)
      const isCompleted = localHabit.habit_completions && localHabit.habit_completions[dateStr] === true
      if (isCompleted) {
        currentStreak++
        streakDate.setDate(streakDate.getDate() - 1)
      } else {
        break
      }
    }
    
    return { totalPlanned, totalCompleted, completedOutsidePlan, currentStreak, maxStreak }
  }
  
  const stats = calculateStats()
  
  // Timeline setup
  const endDate = new Date(today)
  endDate.setDate(endDate.getDate() - habitsPageTimelineOffset)
  const startDate = new Date(endDate)
  startDate.setDate(startDate.getDate() - habitsPageVisibleDays + 1)
  
  const timelineDates: Date[] = []
  for (let i = 0; i < habitsPageVisibleDays; i++) {
    const date = new Date(startDate)
    date.setDate(date.getDate() + i)
    timelineDates.push(date)
  }
  
  const handleTimelineShift = (direction: 'left' | 'right') => {
    if (direction === 'left') {
      setHabitsPageTimelineOffset(prev => prev + habitsPageVisibleDays)
    } else {
      setHabitsPageTimelineOffset(prev => Math.max(0, prev - habitsPageVisibleDays))
    }
  }
  
  const handleHabitBoxClick = async (date: Date) => {
    const dateStr = getLocalDateString(date)
    const isScheduled = isHabitScheduledForDay(localHabit, date)
    const isCompleted = localHabit.habit_completions && localHabit.habit_completions[dateStr] === true
    
    let currentState: 'completed' | 'missed' | 'planned' | 'not-scheduled' | 'today' = 'not-scheduled'
    if (isCompleted) {
      currentState = 'completed'
    } else if (isScheduled) {
      currentState = 'planned'
    }
    
    if (dateStr === getLocalDateString(today)) {
      currentState = 'today'
    }
    
    await handleHabitCalendarToggle(localHabit.id, dateStr, currentState, isScheduled)
  }
  
  // Handle saving habit from modal
  const handleSaveHabitModal = async () => {
    if (!editingHabitName.trim()) {
      alert(t('habits.nameRequired') || 'Název návyku je povinný')
      return
    }
    
    setIsSavingHabit(true)
    try {
      const response = await fetch('/api/habits', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          habitId: habit.id,
          name: editingHabitName.trim(),
          description: editingHabitDescription.trim(),
          icon: editingHabitIcon,
          frequency: editingHabitFrequency,
          selectedDays: editingHabitSelectedDays,
          reminder_time: editingHabitReminderTime || null,
          notification_enabled: editingHabitNotificationEnabled,
          area_id: editingHabitAreaId
        })
      })
      
      if (response.ok) {
        const updatedHabit = await response.json()
        setLocalHabit(updatedHabit)
        
        // Update in parent - this will trigger timeline refresh
        if (onHabitUpdate) {
          onHabitUpdate(updatedHabit)
        }
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Neznámá chyba' }))
        alert(`Chyba při aktualizaci návyku: ${errorData.error || 'Nepodařilo se uložit návyk'}`)
      }
    } catch (error) {
      console.error('Error saving habit:', error)
      alert('Chyba při ukládání návyku')
    } finally {
      setIsSavingHabit(false)
    }
  }
  
  return (
    <div className="w-full min-h-full flex flex-col bg-background p-6 pb-8">
      {/* Statistics section */}
      <div className="mb-6">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="box-playful-highlight p-3 flex items-center gap-3">
            <Calendar className="w-5 h-5 text-primary-600" />
            <div>
              <div className="text-xs text-gray-600 mb-0.5 font-playful">{t('habits.stats.totalPlanned') || 'Naplánováno'}</div>
              <div className="text-xl font-bold text-black font-playful">{stats.totalPlanned}</div>
            </div>
          </div>
          <div className="box-playful-highlight p-3 flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-primary-600" />
            <div>
              <div className="text-xs text-gray-600 mb-0.5 font-playful">{t('habits.stats.totalCompleted') || 'Splněno'}</div>
              <div className="text-xl font-bold text-black font-playful">{stats.totalCompleted}</div>
            </div>
          </div>
          <div className="box-playful-highlight p-3 flex items-center gap-3">
            <Zap className="w-5 h-5 text-primary-600" />
            <div>
              <div className="text-xs text-gray-600 mb-0.5 font-playful">{t('habits.stats.completedOutside') || 'Mimo plán'}</div>
              <div className="text-xl font-bold text-black font-playful">{stats.completedOutsidePlan}</div>
            </div>
          </div>
          <div className="box-playful-highlight p-3 flex items-center gap-3">
            <Flame className="w-5 h-5 text-primary-600" />
            <div>
              <div className="text-xs text-gray-600 mb-0.5 font-playful">{t('habits.stats.currentStreak') || 'Aktuální streak'}</div>
              <div className="text-xl font-bold text-black font-playful">{stats.currentStreak}</div>
            </div>
          </div>
          <div className="box-playful-highlight p-3 flex items-center gap-3">
            <Trophy className="w-5 h-5 text-primary-600" />
            <div>
              <div className="text-xs text-gray-600 mb-0.5 font-playful">{t('habits.stats.maxStreak') || 'Nejdelší streak'}</div>
              <div className="text-xl font-bold text-black font-playful">{stats.maxStreak}</div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Timeline section */}
      <div className="box-playful-highlight p-4 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-black font-playful">{t('habits.timeline') || 'Timeline'}</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleTimelineShift('left')}
              className="btn-playful-base p-2"
              title={t('common.previous') || 'Předchozí'}
            >
              <ChevronLeft className="w-5 h-5 text-black" />
            </button>
            <button
              onClick={() => handleTimelineShift('right')}
              disabled={habitsPageTimelineOffset === 0}
              className={`btn-playful-base p-2 ${
                habitsPageTimelineOffset === 0 
                  ? 'opacity-50 cursor-not-allowed' 
                  : ''
              }`}
              title={t('common.next') || 'Další'}
            >
              <ChevronRight className="w-5 h-5 text-black" />
            </button>
          </div>
        </div>
        
        {/* Timeline with month, dates, and boxes */}
        <div ref={habitsPageTimelineContainerRef} className="w-full">
          {/* Month row */}
          <div className="flex mb-2 relative" style={{ height: '24px' }}>
            {(() => {
              if (!timelineDates || timelineDates.length === 0) {
                return null
              }
              
              const middleIndex = Math.floor(timelineDates.length / 2)
              let targetDate = timelineDates[middleIndex]
              
              if (!targetDate) {
                return null
              }
              
              const targetMonth = targetDate.getMonth()
              const targetYear = targetDate.getFullYear()
              const monthMiddle = new Date(targetYear, targetMonth, 15)
              monthMiddle.setHours(0, 0, 0, 0)
              
              if (!timelineDates[0]) {
                return null
              }
              
              let closestIndex = 0
              let closestDistance = Math.abs(timelineDates[0].getTime() - monthMiddle.getTime())
              
              timelineDates.forEach((date, index) => {
                if (!date) return
                const distance = Math.abs(date.getTime() - monthMiddle.getTime())
                if (distance < closestDistance) {
                  closestDistance = distance
                  closestIndex = index
                }
              })
              
              const edgeThreshold = 2
              let adjustedIndex = closestIndex
              if (closestIndex < edgeThreshold) {
                adjustedIndex = Math.min(edgeThreshold, timelineDates.length - 1)
              } else if (closestIndex > timelineDates.length - 1 - edgeThreshold) {
                adjustedIndex = Math.max(timelineDates.length - 1 - edgeThreshold, 0)
              }
              
              const position = adjustedIndex * 36 + 16
              
              const monthNames = localeCode === 'cs-CZ' 
                ? ['Leden', 'Únor', 'Březen', 'Duben', 'Květen', 'Červen', 'Červenec', 'Srpen', 'Září', 'Říjen', 'Listopad', 'Prosinec']
                : ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
              
              const monthName = monthNames[targetMonth]
              
              return (
                <div 
                  className="text-sm font-medium text-black font-playful absolute"
                  style={{ 
                    left: `${position}px`,
                    transform: 'translateX(-50%)'
                  }}
                >
                  {monthName}
                </div>
              )
            })()}
          </div>
          
          {/* Dates row */}
          <div className="flex gap-2 mb-2 relative">
            <div className="flex gap-1">
              {timelineDates.map((date, index) => {
                const dateStr = getLocalDateString(date)
                const isToday = dateStr === getLocalDateString(today)
                const isMonthStart = index > 0 && date.getMonth() !== timelineDates[index - 1].getMonth()
                
                const dayNamesShort = [
                  t('calendar.daysShort.sunday'),
                  t('calendar.daysShort.monday'),
                  t('calendar.daysShort.tuesday'),
                  t('calendar.daysShort.wednesday'),
                  t('calendar.daysShort.thursday'),
                  t('calendar.daysShort.friday'),
                  t('calendar.daysShort.saturday')
                ]
                
                const day = date.getDate()
                const dayOfWeek = date.getDay()
                const dayAbbr = dayNamesShort[dayOfWeek].substring(0, 2).toUpperCase()
                
                return (
                  <div key={dateStr} className="relative w-[32px] flex-shrink-0">
                    {isMonthStart && (
                      <div 
                        className="absolute left-0 top-0 bottom-0 w-px bg-primary-300 -ml-0.5 z-10"
                        style={{ height: '100%' }}
                      />
                    )}
                    <div
                      className={`flex flex-col items-center w-full ${isToday ? 'bg-primary-100 rounded-playful-sm px-1 py-0.5' : ''}`}
                    >
                      <div className={`text-[10px] text-center leading-tight font-playful ${isToday ? 'font-semibold text-primary-700' : 'text-gray-600'}`}>
                        <div>{dayAbbr}</div>
                        <div>{day}</div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
          
          {/* Single habit row - no name, just boxes */}
          <div className="flex gap-1 relative">
            {timelineDates.map((date, index) => {
              const dateStr = getLocalDateString(date)
              const isScheduled = isHabitScheduledForDay(localHabit, date)
              const isCompleted = localHabit.habit_completions && localHabit.habit_completions[dateStr] === true
              const isToday = dateStr === getLocalDateString(today)
              const isFuture = date > today
              const isLoading = loadingHabits.has(`${localHabit.id}-${dateStr}`)
              const isMonthStart = index > 0 && date.getMonth() !== timelineDates[index - 1].getMonth()
              
              return (
                <div key={dateStr} className="relative w-[32px] flex-shrink-0">
                  {isMonthStart && (
                    <div 
                      className="absolute left-0 top-0 bottom-0 w-px bg-primary-300 -ml-0.5 z-10"
                      style={{ height: '100%' }}
                    />
                  )}
                  <button
                    onClick={() => !isFuture && !isLoading && handleHabitBoxClick(date)}
                    disabled={isFuture || isLoading}
                    className={`w-8 h-8 rounded-playful-sm flex items-center justify-center transition-all border-2 ${
                      isCompleted
                        ? 'box-playful-highlight bg-primary-100 border-primary-500 hover:bg-primary-200 cursor-pointer'
                        : isScheduled
                          ? `bg-white border-primary-500 ${isFuture ? 'cursor-not-allowed opacity-50' : 'hover:bg-primary-50 cursor-pointer box-playful-highlight'}`
                          : `bg-white border-gray-400 ${isFuture ? 'cursor-not-allowed opacity-50' : 'hover:bg-gray-50 cursor-pointer box-playful-pressed-gray'}`
                    }`}
                    title={`${dateStr}${isScheduled ? ' - Naplánováno' : ' - Nenaplánováno'}${isCompleted ? ' - Splněno' : ' - Nesplněno'}`}
                  >
                    {isLoading ? (
                      <svg className="animate-spin h-3 w-3 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    ) : isCompleted ? (
                      <Check className="w-4 h-4 text-primary-600" strokeWidth={3} />
                    ) : null}
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      </div>
      
      {/* Settings section - using HabitModal as page component */}
      <HabitModal
        show={true}
        habitModalData={habit}
        onClose={() => {}}
        onSave={handleSaveHabitModal}
        isSaving={isSavingHabit}
        areas={areas}
        asPageComponent={true}
        editingHabitName={editingHabitName}
        setEditingHabitName={setEditingHabitName}
        editingHabitDescription={editingHabitDescription}
        setEditingHabitDescription={setEditingHabitDescription}
        editingHabitIcon={editingHabitIcon}
        setEditingHabitIcon={setEditingHabitIcon}
        editingHabitFrequency={editingHabitFrequency}
        setEditingHabitFrequency={setEditingHabitFrequency}
        editingHabitSelectedDays={editingHabitSelectedDays}
        setEditingHabitSelectedDays={setEditingHabitSelectedDays}
        editingHabitMonthlyType={editingHabitMonthlyType}
        setEditingHabitMonthlyType={setEditingHabitMonthlyType}
        editingHabitWeekdayInMonthSelections={editingHabitWeekdayInMonthSelections}
        setEditingHabitWeekdayInMonthSelections={setEditingHabitWeekdayInMonthSelections}
        editingHabitAutoAdjust31={editingHabitAutoAdjust31}
        setEditingHabitAutoAdjust31={setEditingHabitAutoAdjust31}
        editingHabitReminderTime={editingHabitReminderTime}
        setEditingHabitReminderTime={setEditingHabitReminderTime}
        editingHabitNotificationEnabled={editingHabitNotificationEnabled}
        setEditingHabitNotificationEnabled={setEditingHabitNotificationEnabled}
        editingHabitAreaId={editingHabitAreaId}
        setEditingHabitAreaId={setEditingHabitAreaId}
        editingHabitMonthWeek={editingHabitMonthWeek}
        setEditingHabitMonthWeek={setEditingHabitMonthWeek}
        editingHabitMonthDay={editingHabitMonthDay}
        setEditingHabitMonthDay={setEditingHabitMonthDay}
      />
    </div>
  )
}
