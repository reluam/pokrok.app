'use client'

import { Check, ChevronUp, ChevronDown } from 'lucide-react'
import { useTranslations, useLocale } from 'next-intl'
import { getLocalDateString, normalizeDate } from '../utils/dateHelpers'

interface DayViewProps {
  habits: any[]
  dailySteps: any[]
  aspirations: any[]
  dayAspirationBalances: Record<string, any>
  selectedDayDate: Date
  setSelectedDayDate: (date: Date) => void
  setShowDatePickerModal: (show: boolean) => void
  handleItemClick: (item: any, type: 'step' | 'habit' | 'goal' | 'stat') => void
  handleHabitToggle: (habitId: string, date?: string) => Promise<void>
  handleStepToggle: (stepId: string, completed: boolean) => Promise<void>
  setSelectedItem: (item: any) => void
  setSelectedItemType: (type: 'step' | 'habit' | 'goal' | 'stat' | null) => void
  loadingHabits: Set<string>
  loadingSteps: Set<string>
  player?: any
}

export function DayView({
  habits,
  dailySteps,
  aspirations,
  dayAspirationBalances,
  selectedDayDate,
  setSelectedDayDate,
  setShowDatePickerModal,
  handleItemClick,
  handleHabitToggle,
  handleStepToggle,
  setSelectedItem,
  setSelectedItemType,
  loadingHabits,
  loadingSteps,
  player
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
  const todaySteps = dailySteps.filter(step => {
    if (!step.date) return false // Exclude steps without date
    if (step.completed) return false // Exclude completed steps
    
    const stepDate = normalizeDate(step.date)
    const stepDateObj = new Date(stepDate)
    stepDateObj.setHours(0, 0, 0, 0)
    
    // Include if overdue or on selected day
    return stepDateObj <= displayDate
  })
  
  // Filter steps for progress calculation - only steps on selected day (exclude overdue)
  const stepsForProgress = dailySteps.filter(step => {
    if (!step.date) return false // Exclude steps without date
    if (step.completed) return false // Exclude completed steps
    
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
  
  // Only count steps on selected day (not overdue) for progress
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
    <div className="w-full flex flex-col p-6">
      {/* Header with date, navigation arrows and progress */}
      <div className="mb-6 flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
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
        
        <div className="flex items-center gap-4">
          <div className="text-3xl font-bold text-orange-600">{progressPercentage}%</div>
          <div className="flex-1 bg-orange-200 bg-opacity-50 rounded-full h-4 overflow-hidden">
            <div 
              className="bg-orange-500 h-4 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(progressPercentage, 100)}%` }}
            ></div>
          </div>
          <div className="text-base text-gray-600 font-medium">
            {completedTasks}/{totalTasks}
          </div>
        </div>
        
        {/* Aspiration Development Row */}
        {aspirations.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center gap-2 overflow-x-auto pb-2 -mx-2 px-2">
              {aspirations.map((aspiration) => {
                const balance = dayAspirationBalances[aspiration.id]
                const changePercentage = balance?.change_percentage || 0
                const trend = balance?.trend || 'neutral'
                const completionRate = balance?.completion_rate_recent || 0
                
                return (
                  <div
                    key={aspiration.id}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 hover:border-orange-300 hover:bg-orange-50 transition-all cursor-pointer flex-shrink-0 bg-white"
                  >
                    <div 
                      className="w-3 h-3 rounded-full flex-shrink-0" 
                      style={{ backgroundColor: aspiration.color || '#3B82F6' }}
                    />
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xs font-medium text-gray-700 truncate max-w-[120px]">{aspiration.title}</span>
                      <span className="text-gray-400">•</span>
                      {trend === 'positive' && (
                        <ChevronUp className="w-3.5 h-3.5 text-green-600 flex-shrink-0" />
                      )}
                      {trend === 'negative' && (
                        <ChevronDown className="w-3.5 h-3.5 text-red-600 flex-shrink-0" />
                      )}
                      {trend === 'neutral' && (
                        <div className="w-3.5 h-3.5 flex-shrink-0" />
                      )}
                      {changePercentage !== 0 && (
                        <span className={`text-xs font-medium ${
                          trend === 'positive' ? 'text-green-600' : 
                          trend === 'negative' ? 'text-red-600' : 
                          'text-gray-600'
                        }`}>
                          {changePercentage > 0 ? '+' : ''}{changePercentage.toFixed(1)}%
                        </span>
                      )}
                      {changePercentage === 0 && trend === 'neutral' && (
                        <span className="text-xs text-gray-500">
                          {completionRate.toFixed(1)}%
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
      
      {/* Two Column Layout - Habits and Steps */}
      <div className="grid grid-cols-2 gap-6 flex-1 overflow-hidden">
        {/* Habits Section */}
        <div className="flex flex-col bg-white rounded-xl p-6 border border-orange-200 shadow-sm">
          <h3 className="text-lg font-bold text-orange-800 mb-4">{t('sections.habits')}</h3>
          <div className="space-y-3 overflow-y-auto flex-1">
            {todaysHabits.map((habit) => {
              const isCompleted = habit.habit_completions && habit.habit_completions[displayDateStr] === true
              const isNotScheduled = habit.always_show ? (() => {
                // Check if scheduled for selected day
                if (habit.frequency === 'daily') return false
                if (habit.frequency === 'custom' && habit.selected_days && habit.selected_days.includes(dayName)) return false
                return true
              })() : false
              
              return (
                <div
                  key={habit.id}
                  onClick={() => handleItemClick(habit, 'habit')}
                  className={`p-3 rounded-lg border border-gray-200 bg-white hover:bg-orange-50/30 hover:border-orange-200 transition-all duration-200 cursor-pointer shadow-sm ${
                    isCompleted 
                      ? 'bg-orange-50/50 border-orange-200' 
                      : isNotScheduled
                        ? 'opacity-60'
                        : ''
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        if (!loadingHabits.has(habit.id)) {
                          handleHabitToggle(habit.id, displayDateStr)
                        }
                      }}
                      disabled={loadingHabits.has(habit.id)}
                      className="flex items-center justify-center transition-all duration-200 cursor-pointer hover:scale-110 flex-shrink-0"
                      title={isCompleted ? 'Označit jako nesplněný' : 'Označit jako splněný'}
                    >
                      {loadingHabits.has(habit.id) ? (
                        <svg className="animate-spin h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      ) : isCompleted ? (
                        <Check className="w-5 h-5 text-orange-600" strokeWidth={3} />
                      ) : (
                        <Check className="w-5 h-5 text-gray-400" strokeWidth={2.5} fill="none" />
                      )}
                    </button>
                    <span className={`truncate flex-1 font-semibold text-sm ${
                      isCompleted 
                        ? 'line-through text-orange-600' 
                        : isNotScheduled 
                          ? 'text-gray-500' 
                          : 'text-gray-900'
                    }`}>
                      {habit.name}
                    </span>
                    <span className="text-orange-600 font-bold text-sm flex-shrink-0">🔥 {(() => {
                      // Calculate current streak dynamically from habit_completions
                      const habitCompletions = habit.habit_completions || {}
                      const completionDates = Object.keys(habitCompletions).sort()
                      
                      // Calculate current streak by going backwards from the last completed day
                      let currentStreak = 0
                      const userCreatedDateFull = new Date(player?.created_at || '2024-01-01')
                      const userCreatedDate = new Date(userCreatedDateFull.getFullYear(), userCreatedDateFull.getMonth(), userCreatedDateFull.getDate())
                      
                      // Find the last completed day chronologically
                      let lastCompletedDate = null
                      for (const dateKey of completionDates) {
                        const completion = habitCompletions[dateKey]
                        if (completion === true) {
                          const date = new Date(dateKey)
                          if (!lastCompletedDate || date > lastCompletedDate) {
                            lastCompletedDate = date
                          }
                        }
                      }
                      
                      // If we have a last completed day, count streak backwards from there
                      if (lastCompletedDate) {
                        const lastCompletedDateOnly = new Date(lastCompletedDate!.getFullYear(), lastCompletedDate!.getMonth(), lastCompletedDate!.getDate())
                        for (let d = new Date(lastCompletedDateOnly); d >= userCreatedDate; d.setDate(d.getDate() - 1)) {
                          const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
                          const completion = habitCompletions[dateKey]
                          
                          if (completion === true) {
                            currentStreak++
                          } else if (completion === false) {
                            // Missed day breaks the streak
                            break
                          }
                          // completion === undefined (not-scheduled) doesn't break the streak, just doesn't add to it
                        }
                      }
                      
                      return currentStreak
                    })()}</span>
                  </div>
                </div>
              )
            })}
            {todaysHabits.length === 0 && (
              <div className="text-gray-400 text-sm text-center py-8">
                {isToday ? 'Žádné návyky na dnes' : `Žádné návyky na ${formattedDate.split(' ')[0]}`}
              </div>
            )}
          </div>
        </div>
        
        {/* Steps Section */}
        <div className="flex flex-col bg-white rounded-xl p-6 border border-orange-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-orange-800">{t('sections.steps')}</h3>
            <button
              onClick={() => {
                const newStep = {
                  id: 'new-step',
                  title: '',
                  description: '',
                  completed: false,
                  date: displayDateStr,
                  estimated_time: 0,
                  xp_reward: 0
                }
                setSelectedItem(newStep)
                setSelectedItemType('step')
              }}
              className="w-8 h-8 rounded-full bg-orange-500 text-white hover:bg-orange-600 transition-colors flex items-center justify-center text-lg font-bold"
              title="Přidat krok"
            >
              +
            </button>
          </div>
          
          <div className="space-y-3 overflow-y-auto flex-1">
            {(() => {
              // Separate steps into today's steps and overdue steps
              const todaysStepsList: typeof dailySteps = []
              const overdueStepsList: typeof dailySteps = []
              
              todaySteps.forEach(step => {
                const stepDate = normalizeDate(step.date)
                const stepDateObj = new Date(stepDate)
                stepDateObj.setHours(0, 0, 0, 0)
                const isOverdue = stepDateObj < displayDate
                
                if (isOverdue) {
                  overdueStepsList.push(step)
                } else {
                  todaysStepsList.push(step)
                }
              })
              
              const renderStep = (step: typeof dailySteps[0]) => {
                const stepDate = normalizeDate(step.date)
                const stepDateObj = new Date(stepDate)
                stepDateObj.setHours(0, 0, 0, 0)
                const isOverdue = stepDateObj < displayDate
              
                return (
                  <div
                    key={step.id}
                    onClick={() => handleItemClick(step, 'step')}
                    className={`p-3 rounded-lg border border-gray-200 bg-white hover:bg-orange-50/30 hover:border-orange-200 transition-all duration-200 cursor-pointer shadow-sm ${
                      step.completed ? 'bg-orange-50/50 border-orange-200' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          if (!loadingSteps.has(step.id)) {
                            handleStepToggle(step.id, !step.completed)
                          }
                        }}
                        disabled={loadingSteps.has(step.id)}
                        className="flex items-center justify-center transition-all duration-200 cursor-pointer hover:scale-110 flex-shrink-0"
                      >
                        {loadingSteps.has(step.id) ? (
                          <svg className="animate-spin h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        ) : step.completed ? (
                          <Check className="w-5 h-5 text-orange-600" strokeWidth={3} />
                        ) : (
                          <Check className="w-5 h-5 text-gray-400" strokeWidth={2.5} fill="none" />
                        )}
                      </button>
                      <span className={`truncate flex-1 font-semibold text-sm ${step.completed ? 'line-through text-gray-500' : isOverdue ? 'text-red-700' : 'text-gray-900'}`}>
                        {step.title}
                      </span>
                      {isOverdue && !step.completed && <span className="text-red-600 text-xs">⚠️</span>}
                    </div>
                  </div>
                )
              }
              
              return (
                <>
                  {/* Today's steps */}
                  {todaysStepsList.length > 0 && (
                    <>
                      {todaysStepsList.map(renderStep)}
                    </>
                  )}
                  
                  {/* Overdue steps with header */}
                  {overdueStepsList.length > 0 && (
                    <>
                      {todaysStepsList.length > 0 && (
                        <div className="pt-3 mt-3 border-t border-gray-200">
                          <h4 className="text-xs font-semibold text-red-600 mb-2 uppercase tracking-wide">Zpožděné kroky</h4>
                        </div>
                      )}
                      {overdueStepsList.map(renderStep)}
                    </>
                  )}
                  
                  {/* Empty state */}
                  {todaySteps.length === 0 && (
                    <div className="text-gray-400 text-sm text-center py-8">
                      {isToday ? 'Žádné kroky na dnes' : `Žádné kroky na ${formattedDate.split(' ')[0]}`}
                    </div>
                  )}
                </>
              )
            })()}
          </div>
        </div>
      </div>
    </div>
  )
}

