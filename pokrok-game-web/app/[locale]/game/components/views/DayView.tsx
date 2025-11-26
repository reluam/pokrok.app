'use client'

import { useState, useCallback } from 'react'
import { Check, ChevronUp, ChevronDown } from 'lucide-react'
import { useTranslations, useLocale } from 'next-intl'
import { getLocalDateString, normalizeDate } from '../utils/dateHelpers'
import { QuickOverviewWidget } from './QuickOverviewWidget'
import { TodayFocusSection } from './TodayFocusSection'
import { Timeline } from './Timeline'

interface DayViewProps {
  goals?: any[]
  habits: any[]
  dailySteps: any[]
  selectedDayDate: Date
  setSelectedDayDate: (date: Date) => void
  setShowDatePickerModal: (show: boolean) => void
  handleItemClick: (item: any, type: 'step' | 'habit' | 'goal' | 'stat') => void
  handleHabitToggle: (habitId: string, date?: string) => Promise<void>
  handleStepToggle: (stepId: string, completed: boolean) => Promise<void>
  setSelectedItem: (item: any) => void
  setSelectedItemType: (type: 'step' | 'habit' | 'goal' | 'stat' | null) => void
  onOpenStepModal?: (date?: string) => void
  loadingHabits: Set<string>
  loadingSteps: Set<string>
  player?: any
  onNavigateToHabits?: () => void
  onNavigateToSteps?: () => void
}

export function DayView({
  goals = [],
  habits,
  dailySteps,
  selectedDayDate,
  setSelectedDayDate,
  setShowDatePickerModal,
  handleItemClick,
  handleHabitToggle,
  handleStepToggle,
  setSelectedItem,
  setSelectedItemType,
  onOpenStepModal,
  loadingHabits,
  loadingSteps,
  player,
  onNavigateToHabits,
  onNavigateToSteps
}: DayViewProps) {
  const t = useTranslations()
  const locale = useLocale()
  const localeCode = locale === 'cs' ? 'cs-CZ' : 'en-US'
  
  const today = getLocalDateString()
  const todayObj = new Date()
  todayObj.setHours(0, 0, 0, 0)
  
  // Use selectedDayDate or default to today
  const displayDate = new Date(selectedDayDate)
  displayDate.setHours(0, 0, 0, 0)
  const displayDateStr = getLocalDateString(displayDate)
  const isToday = displayDateStr === today
  
  // Track which steps are displayed in TodayFocusSection to exclude them from "Další kroky"
  const [displayedStepIds, setDisplayedStepIds] = useState<Set<string>>(new Set())
  
  const handleDisplayedStepsChange = useCallback((stepIds: Set<string>) => {
    setDisplayedStepIds(stepIds)
  }, [])
  
  // Filter habits for selected day - only selected day's habits + always_show habits
  const dayOfWeek = displayDate.getDay()
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
  const dayName = dayNames[dayOfWeek]
  
  // Filter habits for display - includes always_show habits even if not scheduled
  const todaysHabits = habits.filter(habit => {
    // Always show if always_show is true
    if (habit.always_show) return true
    
    // Check if scheduled for selected day
    if (habit.frequency === 'daily') return true
    if (habit.frequency === 'custom' && habit.selected_days && habit.selected_days.includes(dayName)) return true
    
    return false
  })
  
  // Filter habits for progress calculation - only habits actually scheduled for this day
  // Always_show habits are only counted if they are also scheduled for this day
  const habitsForProgress = habits.filter(habit => {
    // Check if scheduled for selected day
    if (habit.frequency === 'daily') return true
    if (habit.frequency === 'custom' && habit.selected_days && habit.selected_days.includes(dayName)) return true
    
    // Always_show habits are NOT counted unless they are also scheduled for this day
    return false
  })
  
  // Filter steps - overdue (incomplete) + selected day's steps (incomplete) - for display
  // Exclude steps that are already displayed in TodayFocusSection
  const todaySteps = dailySteps.filter(step => {
    if (!step.date) return false // Exclude steps without date
    if (step.completed) return false // Exclude completed steps
    
    // Exclude steps that are already displayed in TodayFocusSection
    if (displayedStepIds.has(step.id)) return false
    
    const stepDate = normalizeDate(step.date)
    const stepDateObj = new Date(stepDate)
    stepDateObj.setHours(0, 0, 0, 0)
    
    // Include if overdue or on selected day
    return stepDateObj <= displayDate
  })
  
  // Filter steps for progress calculation - only steps on selected day (exclude overdue)
  // Include ALL steps (both completed and incomplete) for total count
  const stepsForProgress = dailySteps.filter(step => {
    if (!step.date) return false // Exclude steps without date
    
    const stepDate = normalizeDate(step.date)
    const stepDateObj = new Date(stepDate)
    stepDateObj.setHours(0, 0, 0, 0)
    
    // Only include steps on selected day (not overdue)
    return stepDateObj.getTime() === displayDate.getTime()
  })
  
  // Calculate selected day's stats
  const completedSteps = dailySteps.filter(step => {
    const stepDate = normalizeDate(step.date)
    return stepDate === displayDateStr && step.completed
  }).length
  
  // Count only habits scheduled for this day (not always_show habits that aren't scheduled)
  // Always_show habits are only counted if they are also scheduled for this day
  const totalHabits = habitsForProgress.length
  const completedHabits = habitsForProgress.filter(habit => {
    return habit.habit_completions && habit.habit_completions[displayDateStr] === true
  }).length
  
  // Count ALL tasks (habits + steps) on selected day for progress calculation
  const totalTasks = totalHabits + stepsForProgress.length
  const completedTasks = completedHabits + completedSteps
  const progressPercentage = totalTasks > 0 ? Math.min(Math.round((completedTasks / totalTasks) * 100), 100) : 0
  
  // Format selected day's date for display
  const formattedDate = displayDate.toLocaleDateString(localeCode, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  
  // Navigation functions
  const goToPreviousDay = () => {
    const prevDate = new Date(displayDate)
    prevDate.setDate(prevDate.getDate() - 1)
    setSelectedDayDate(prevDate)
  }
  
  const goToNextDay = () => {
    const nextDate = new Date(displayDate)
    nextDate.setDate(nextDate.getDate() + 1)
    setSelectedDayDate(nextDate)
  }
  
  const goToToday = () => {
    setSelectedDayDate(new Date())
  }
  
  return (
    <div className="w-full flex flex-col p-6 space-y-6">
      {/* Header with date and navigation */}
      <div className="flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={goToPreviousDay}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors flex items-center justify-center"
            title="Předchozí den"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <div className="flex items-center gap-3 flex-1 justify-center">
            <button
              onClick={() => setShowDatePickerModal(true)}
              className="cursor-pointer hover:opacity-80 transition-opacity"
            >
              <h2 className="text-2xl font-bold text-gray-900">{formattedDate}</h2>
            </button>
            {!isToday && (
              <button
                onClick={goToToday}
                className="px-3 py-1 text-sm bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition-colors"
                title="Přejít na dnes"
              >
                Dnes
              </button>
            )}
          </div>
          
          <button
            onClick={goToNextDay}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors flex items-center justify-center"
            title="Následující den"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
        
        {/* Timeline */}
        <Timeline
          selectedDate={selectedDayDate}
          viewMode="day"
          onDateClick={(date) => setSelectedDayDate(date)}
          habits={habits}
          dailySteps={dailySteps}
        />
        
        {/* Quick Overview Widget */}
        <QuickOverviewWidget
          habits={habits}
          dailySteps={dailySteps}
          selectedDayDate={selectedDayDate}
          player={player}
        />
      </div>
      
      {/* Today Focus Section */}
      <TodayFocusSection
        goals={goals}
        dailySteps={dailySteps}
        habits={habits}
        selectedDayDate={selectedDayDate}
        handleStepToggle={handleStepToggle}
        handleHabitToggle={handleHabitToggle}
        handleItemClick={handleItemClick}
        loadingSteps={loadingSteps}
        loadingHabits={loadingHabits}
        player={player}
        todaySteps={todaySteps}
        onOpenStepModal={onOpenStepModal}
        onDisplayedStepsChange={handleDisplayedStepsChange}
        onNavigateToHabits={onNavigateToHabits}
        onNavigateToSteps={onNavigateToSteps}
      />
    </div>
  )
}

