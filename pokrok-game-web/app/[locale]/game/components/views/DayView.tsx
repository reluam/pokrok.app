'use client'

import { useState, useCallback, useEffect } from 'react'
import { Check } from 'lucide-react'
import { useTranslations, useLocale } from 'next-intl'
import { getLocalDateString, normalizeDate } from '../utils/dateHelpers'
import { QuickOverviewWidget } from './QuickOverviewWidget'
import { TodayFocusSection } from './TodayFocusSection'
import { Timeline } from './Timeline'
import { isHabitScheduledForDay } from '../utils/habitHelpers'
import { ImportantStepsPlanningView } from '../workflows/ImportantStepsPlanningView'

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
  userId?: string | null
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
  onNavigateToSteps,
  userId
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

  // Check if "only the important" workflow is active and get important steps
  const [importantStepsWorkflow, setImportantStepsWorkflow] = useState<any>(null)
  const [importantStepIds, setImportantStepIds] = useState<Set<string>>(new Set())
  const [otherStepIds, setOtherStepIds] = useState<Set<string>>(new Set())
  const [showOtherSteps, setShowOtherSteps] = useState(false)
  const [showPlanTomorrow, setShowPlanTomorrow] = useState(false)

  // Always show all sections in calendar views - ignore API settings
  // Calendar view can only be turned on/off as a whole, not individual sections
  const visibleSections: Record<string, boolean> = {
    quickOverview: true,
    todayFocus: true,
    habits: true,
    futureSteps: true,
    overdueSteps: true
  }

  useEffect(() => {
    if (!userId || !isToday) return

    const checkWorkflow = async () => {
      try {
        // Check if workflow is enabled
        const workflowResponse = await fetch('/api/workflows/only-the-important/check')
        if (workflowResponse.ok) {
          const workflowData = await workflowResponse.json()
          setImportantStepsWorkflow(workflowData.workflow_enabled ? workflowData : null)
          
          if (workflowData.workflow_enabled) {
            // Get planning data for today
            const planningResponse = await fetch(`/api/workflows/only-the-important/planning?date=${displayDateStr}`)
            if (planningResponse.ok) {
              const planningData = await planningResponse.json()
              setImportantStepIds(new Set(planningData.important_steps.map((s: any) => s.id)))
              setOtherStepIds(new Set(planningData.other_steps.map((s: any) => s.id)))
              
              // Check if all important steps are completed
              const allImportantCompleted = planningData.important_steps.every((s: any) => {
                const step = dailySteps.find((ds: any) => ds.id === s.id)
                return step?.completed === true
              })
              
              // Check if all other steps are completed
              const allOtherCompleted = planningData.other_steps.length === 0 || planningData.other_steps.every((s: any) => {
                const step = dailySteps.find((ds: any) => ds.id === s.id)
                return step?.completed === true
              })
              
              setShowOtherSteps(allImportantCompleted && planningData.other_steps.length > 0)
              setShowPlanTomorrow(allImportantCompleted && allOtherCompleted)
            }
          }
        }
      } catch (error) {
        console.error('Error checking workflow:', error)
      }
    }

    checkWorkflow()
  }, [userId, isToday, displayDateStr, dailySteps])
  
  // Filter habits for selected day - only selected day's habits + always_show habits
  const dayOfWeek = displayDate.getDay()
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
  const dayName = dayNames[dayOfWeek]
  
  // Filter habits for display - includes always_show habits even if not scheduled
  const todaysHabits = habits.filter(habit => {
    return isHabitScheduledForDay(habit, displayDate)
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
  let todaySteps = dailySteps.filter(step => {
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

  // If workflow is active and it's today, filter to show only important or other steps
  if (importantStepsWorkflow && isToday) {
    if (showOtherSteps) {
      // Show only other steps
      todaySteps = todaySteps.filter(step => otherStepIds.has(step.id))
    } else {
      // Show only important steps
      todaySteps = todaySteps.filter(step => importantStepIds.has(step.id))
    }
  }
  
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
    <div className="w-full h-full flex flex-col" style={{ minHeight: 0 }}>
      <div className="flex-1 overflow-y-auto">
        <div className="flex flex-col py-6 px-6 space-y-6">
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
                className="px-3 py-1 text-sm bg-primary-100 text-primary-700 rounded-lg hover:bg-primary-200 transition-colors"
                title="Přejít na dnes"
              >
                {t('focus.today')}
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
        {visibleSections.quickOverview !== false && (
          <QuickOverviewWidget
            habits={habits}
            dailySteps={dailySteps}
            selectedDayDate={selectedDayDate}
            player={player}
          />
        )}
        
        {/* Habits in a row - only name and checkbox */}
        {visibleSections.habits !== false && todaysHabits.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {todaysHabits.map((habit) => {
              const isCompleted = habit.habit_completions && habit.habit_completions[displayDateStr] === true
              const isLoading = loadingHabits.has(`${habit.id}-${displayDateStr}`)
              
              return (
                <div
                  key={habit.id}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-playful-md border-2 transition-all bg-white cursor-pointer hover:border-primary-300"
                  style={{
                    borderColor: isCompleted ? 'var(--color-primary-500)' : '#d1d5db',
                    boxShadow: isCompleted 
                      ? '0 2px 8px rgba(249, 115, 22, 0.2) !important'
                      : '0 2px 8px rgba(249, 115, 22, 0.15) !important'
                  }}
                  onClick={() => handleItemClick(habit, 'habit')}
                >
                  <span className={`text-xs font-medium whitespace-nowrap ${
                    isCompleted ? 'text-primary-800 line-through' : 'text-black'
                  }`}>
                    {habit.name}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      if (handleHabitToggle && !isLoading) {
                        handleHabitToggle(habit.id, displayDateStr)
                      }
                    }}
                    disabled={isLoading}
                    className={`flex-shrink-0 w-6 h-6 rounded-playful-sm flex items-center justify-center transition-all border-2 ${
                      isCompleted
                        ? 'bg-primary-100 border-primary-500 hover:bg-primary-200 cursor-pointer'
                        : 'bg-white border-primary-500 hover:bg-primary-50 cursor-pointer'
                    }`}
                    title={isCompleted ? 'Splněno' : 'Klikni pro splnění'}
                  >
                    {isLoading ? (
                      <svg className="animate-spin h-3 w-3 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    ) : isCompleted ? (
                      <Check className="w-3 h-3 text-primary-600" strokeWidth={3} />
                    ) : null}
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>
      
      {/* Today Focus Section */}
      {visibleSections.todayFocus !== false && (
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
          visibleSections={visibleSections}
        />
      )}
        </div>
      </div>
    </div>
  )
}

