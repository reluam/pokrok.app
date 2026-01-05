'use client'

import { Check } from 'lucide-react'
import { getLocalDateString } from '../utils/dateHelpers'

interface DailyPlanContentProps {
  dailySteps: any[]
  habits: any[]
  handleItemClick: (item: any, type: string) => void
  handleStepToggle: (stepId: string, completed: boolean) => void
  handleHabitToggle: (habitId: string) => void
  loadingSteps: Set<string>
  loadingHabits: Set<string>
}

export function DailyPlanContent({
  dailySteps,
  habits,
  handleItemClick,
  handleStepToggle,
  handleHabitToggle,
  loadingSteps,
  loadingHabits
}: DailyPlanContentProps) {
  // Get today's date in local timezone
  const today = getLocalDateString()
  
  // Filter today's steps - normalize dates by taking only the date part, accounting for timezone
  const todaysSteps = dailySteps.filter(step => {
    if (!step.date) return false
    
    // Parse the date and get local date string
    const stepDateObj = new Date(step.date)
    const localYear = stepDateObj.getFullYear()
    const localMonth = String(stepDateObj.getMonth() + 1).padStart(2, '0')
    const localDay = String(stepDateObj.getDate()).padStart(2, '0')
    const stepDate = `${localYear}-${localMonth}-${localDay}`
    
    return stepDate === today
  })
  
  // Filter today's habits
  const dayOfWeek = new Date().getDay()
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
  const todayName = dayNames[dayOfWeek]
  
  const todaysHabits = habits.filter(habit => {
    // If frequency is 'daily', always include
    if (habit.frequency === 'daily') {
      return true
    }
    
    // Custom frequency was removed - treat as weekly
    // This handles legacy habits that were converted from custom to weekly
    if (habit.frequency === 'custom' && habit.selected_days) {
      const included = habit.selected_days.includes(todayName)
      return included
    }
    
    return false
  })

  // Count all habits for total tasks
  // But only count completed habits
  const totalHabits = todaysHabits.length
  
  // Calculate today's progress based on completed steps and habits
  const completedSteps = todaysSteps.filter(step => step.completed).length
  const completedHabits = todaysHabits.filter(habit => {
    const todayDate = today
    return habit.habit_completions && habit.habit_completions[todayDate] === true
  }).length
  
  const totalItems = todaysSteps.length + totalHabits
  const completedItems = completedSteps + completedHabits
  const todayProgressPercentage = totalItems > 0 ? Math.min((completedItems / totalItems) * 100, 100) : 0

  return (
    <div className="w-full h-full flex flex-col p-4">
      {/* Compact Progress Section */}
      <div className="flex items-center gap-3 mb-6">
        <div className="text-2xl font-bold text-orange-600">{Math.round(todayProgressPercentage)}%</div>
        <div className="flex-1 bg-orange-200 bg-opacity-50 rounded-full h-2">
          <div 
            className="bg-orange-600 h-2 rounded-full transition-all duration-500"
            style={{ width: `${Math.min(todayProgressPercentage, 100)}%` }}
          ></div>
        </div>
      </div>
      
      {/* Two Column Layout */}
      <div className="grid grid-cols-2 gap-6 flex-1 overflow-hidden">
        {/* Left Column - Today's Steps */}
        <div className="flex flex-col">
          <h4 className="text-lg font-semibold text-orange-900 mb-4">Dnešní kroky:</h4>
          <div className="space-y-3 overflow-y-auto">
            {todaysSteps.map((step, index) => (
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
                  <span 
                    className={`flex-1 truncate font-semibold text-sm ${step.completed ? 'line-through text-gray-500' : 'text-gray-900'}`}
                  >
                    {step.title}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Right Column - Today's Habits */}
        <div className="flex flex-col">
          <h4 className="text-lg font-semibold text-orange-900 mb-4">Návyky:</h4>
          <div className="space-y-3 overflow-y-auto">
            {todaysHabits.map((habit) => {
              const today = getLocalDateString()
              const isCompleted = habit.habit_completions && habit.habit_completions[today] === true
              
              return (
                <div
                  key={habit.id}
                  onClick={() => handleItemClick(habit, 'habit')}
                  className={`p-3 rounded-lg border border-gray-200 bg-white hover:bg-orange-50/30 hover:border-orange-200 transition-all duration-200 cursor-pointer shadow-sm ${
                    isCompleted ? 'bg-orange-50/50 border-orange-200' : ''
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        if (!loadingHabits.has(habit.id)) {
                          handleHabitToggle(habit.id)
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
                        : 'text-gray-900'
                    }`}>
                      {habit.name}
                    </span>
                  </div>
                </div>
              )
            })}
            {todaysHabits.length === 0 && (
              <div className="text-gray-400 text-sm text-center py-4">
                Žádné návyky na dnes
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

