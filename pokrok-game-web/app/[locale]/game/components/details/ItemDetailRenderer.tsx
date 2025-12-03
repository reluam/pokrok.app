'use client'

import { useState } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { getLocalDateString } from '../utils/dateHelpers'
import { GoalEditingForm } from '../journey/GoalEditingForm'

interface ItemDetailRendererProps {
  item: any
  type: 'step' | 'habit' | 'goal' | 'stat'
  // Step-related state
  editingStepTitle: boolean
  setEditingStepTitle: (value: boolean) => void
  stepTitle: string
  setStepTitle: (value: string) => void
  stepDescription: string
  setStepDescription: (value: string) => void
  showTimeEditor: boolean
  setShowTimeEditor: (value: boolean) => void
  stepEstimatedTime: number
  setStepEstimatedTime: (value: number) => void
  showDatePicker: boolean
  setShowDatePicker: (value: boolean) => void
  selectedDate: string
  setSelectedDate: (value: string) => void
  stepIsImportant: boolean
  setStepIsImportant: (value: boolean) => void
  stepIsUrgent: boolean
  setStepIsUrgent: (value: boolean) => void
  showStepGoalPicker: boolean
  setShowStepGoalPicker: (value: boolean) => void
  stepGoalId: string | null
  setStepGoalId: (value: string | null) => void
  // Habit-related state
  habitDetailTab: 'calendar' | 'settings'
  setHabitDetailTab: (value: 'calendar' | 'settings') => void
  currentMonth: Date
  setCurrentMonth: (value: Date) => void
  editingHabitName: string
  setEditingHabitName: (value: string) => void
  editingHabitDescription: string
  setEditingHabitDescription: (value: string) => void
  editingHabitFrequency: 'daily' | 'weekly' | 'monthly'
  setEditingHabitFrequency: (value: 'daily' | 'weekly' | 'monthly') => void
  editingHabitSelectedDays: string[]
  setEditingHabitSelectedDays: (value: string[]) => void
  editingHabitAlwaysShow: boolean | undefined
  setEditingHabitAlwaysShow: (value: boolean) => void
  editingHabitXpReward: number
  setEditingHabitXpReward: (value: number) => void
  editingHabitCategory: string
  setEditingHabitCategory: (value: string) => void
  editingHabitDifficulty: 'easy' | 'medium' | 'hard'
  setEditingHabitDifficulty: (value: 'easy' | 'medium' | 'hard') => void
  editingHabitReminderTime: string
  setEditingHabitReminderTime: (value: string) => void
  // Handlers
  handleCloseDetail: () => void
  handleToggleStepCompleted: (completed: boolean) => Promise<void>
  handleSaveStep: () => Promise<void>
  handleRescheduleStep: (date: string) => Promise<void>
  handleHabitCalendarToggle: (habitId: string, date: string, currentState: 'completed' | 'missed' | 'planned' | 'not-scheduled' | 'today', isScheduled: boolean) => Promise<void>
  handleUpdateGoalForDetail: (goalId: string, updates: any) => Promise<void>
  handleDeleteGoalForDetail: (goalId: string, showConfirm: boolean) => Promise<void>
  // Data
  goals: any[]
  habits: any[]
  player: any
  userId: string | null
  selectedItem: any
  setSelectedItem: (item: any) => void
  onHabitsUpdate?: (habits: any[]) => void
  stepsCacheRef: React.MutableRefObject<Record<string, { data: any[], loaded: boolean }>>
  setStepsCacheVersion: React.Dispatch<React.SetStateAction<Record<string, number>>>
  // Stats
  completedSteps: number
  activeHabits: number
  completedGoals: number
  progressPercentage: number
}

export function ItemDetailRenderer({
  item,
  type,
  editingStepTitle,
  setEditingStepTitle,
  stepTitle,
  setStepTitle,
  stepDescription,
  setStepDescription,
  showTimeEditor,
  setShowTimeEditor,
  stepEstimatedTime,
  setStepEstimatedTime,
  showDatePicker,
  setShowDatePicker,
  selectedDate,
  setSelectedDate,
  stepIsImportant,
  setStepIsImportant,
  stepIsUrgent,
  setStepIsUrgent,
  showStepGoalPicker,
  setShowStepGoalPicker,
  stepGoalId,
  setStepGoalId,
  habitDetailTab,
  setHabitDetailTab,
  currentMonth,
  setCurrentMonth,
  editingHabitName,
  setEditingHabitName,
  editingHabitDescription,
  setEditingHabitDescription,
  editingHabitFrequency,
  setEditingHabitFrequency,
  editingHabitSelectedDays,
  setEditingHabitSelectedDays,
  editingHabitAlwaysShow,
  setEditingHabitAlwaysShow,
  editingHabitXpReward,
  setEditingHabitXpReward,
  editingHabitCategory,
  setEditingHabitCategory,
  editingHabitDifficulty,
  setEditingHabitDifficulty,
  editingHabitReminderTime,
  setEditingHabitReminderTime,
  handleCloseDetail,
  handleToggleStepCompleted,
  handleSaveStep,
  handleRescheduleStep,
  handleHabitCalendarToggle,
  handleUpdateGoalForDetail,
  handleDeleteGoalForDetail,
  goals,
  habits,
  player,
  userId,
  selectedItem,
  setSelectedItem,
  onHabitsUpdate,
  stepsCacheRef,
  setStepsCacheVersion,
  completedSteps,
  activeHabits,
  completedGoals,
  progressPercentage
}: ItemDetailRendererProps) {
  const t = useTranslations()
  const locale = useLocale()
  const localeCode = locale === 'cs' ? 'cs-CZ' : 'en-US'

  switch (type) {
    case 'step':
      return (
        <div className="w-full h-full flex flex-col">
          {/* Back Button */}
          <div className="px-8 pt-6 pb-2 flex-shrink-0">
            <button
              onClick={handleCloseDetail}
              className="flex items-center gap-2 text-gray-600 hover:text-orange-600 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="font-medium">{t('details.backToOverview')}</span>
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto px-8 pb-8">
          <div className="w-full max-w-2xl space-y-6 mx-auto">
            {/* Title with checkbox and edit button */}
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={item.completed || false}
                onChange={(e) => handleToggleStepCompleted(e.target.checked)}
                className="w-6 h-6 mt-1 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
              />
              {editingStepTitle ? (
                <input
                  type="text"
                  value={stepTitle}
                  onChange={(e) => setStepTitle(e.target.value)}
                  onBlur={() => handleSaveStep()}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSaveStep()
                    }
                    if (e.key === 'Escape') {
                      setEditingStepTitle(false)
                      setStepTitle(selectedItem?.title || '')
                    }
                  }}
                  className="flex-1 text-2xl font-bold text-orange-900 border-b-2 border-orange-600 focus:outline-none bg-transparent"
                  autoFocus
                />
              ) : (
                <>
                  <h4 className="text-2xl font-bold text-orange-900 flex-1">{stepTitle}</h4>
                  <button
                    onClick={() => setEditingStepTitle(true)}
                    className="text-gray-400 hover:text-orange-600 transition-colors"
                    title={t('details.step.editTitle')}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                </>
              )}
            </div>

            {/* Description */}
            <textarea
              value={stepDescription}
              onChange={(e) => setStepDescription(e.target.value)}
              onBlur={handleSaveStep}
              placeholder={t('details.step.descriptionPlaceholder')}
              className="w-full px-4 py-3 text-orange-800 border border-orange-200 rounded-lg focus:ring-2 focus:ring-orange-600 focus:border-orange-600 bg-white bg-opacity-50 resize-none"
              rows={3}
            />

            {/* Info tags */}
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => {
                  setShowDatePicker(false)
                  setShowTimeEditor(!showTimeEditor)
                }}
                className={`text-sm px-4 py-2 rounded-full font-medium transition-colors ${
                  stepEstimatedTime > 0 
                    ? 'bg-blue-200 bg-opacity-80 text-blue-800 hover:bg-blue-300' 
                    : 'bg-gray-200 bg-opacity-80 text-gray-600 hover:bg-gray-300'
                }`}
              >
                ⏱️ {stepEstimatedTime > 0 ? `${stepEstimatedTime} min` : t('details.step.addTime')}
              </button>
              
              <button
                onClick={() => {
                  setShowTimeEditor(false)
                  setShowDatePicker(!showDatePicker)
                }}
                className="text-sm px-4 py-2 bg-gray-200 bg-opacity-80 text-gray-800 rounded-full font-medium hover:bg-gray-300 transition-colors"
              >
                📅 {item.date ? new Date(item.date).toLocaleDateString(localeCode) : t('common.noDate')}
              </button>
              
              <button
                onClick={() => {
                  setStepIsImportant(!stepIsImportant)
                  handleSaveStep()
                }}
                className={`text-sm px-4 py-2 rounded-full font-medium transition-colors ${
                  stepIsImportant 
                    ? 'bg-red-200 bg-opacity-80 text-red-800 hover:bg-red-300' 
                    : 'bg-gray-200 bg-opacity-80 text-gray-600 hover:bg-gray-300'
                }`}
              >
                {stepIsImportant ? '⭐' : '☆'} {t('details.step.important')}
              </button>
              
              <button
                onClick={() => {
                  setStepIsUrgent(!stepIsUrgent)
                  handleSaveStep()
                }}
                className={`text-sm px-4 py-2 rounded-full font-medium transition-colors ${
                  stepIsUrgent 
                    ? 'bg-orange-200 bg-opacity-80 text-orange-800 hover:bg-orange-300' 
                    : 'bg-gray-200 bg-opacity-80 text-gray-600 hover:bg-gray-300'
                }`}
              >
                {stepIsUrgent ? '🔥' : '⚡'} {t('details.step.urgent')}
              </button>
              
              {/* Goal picker */}
              <div className="relative">
                <button
                  onClick={() => {
                    setShowTimeEditor(false)
                    setShowDatePicker(false)
                    setShowStepGoalPicker(!showStepGoalPicker)
                  }}
                  className={`text-sm px-4 py-2 rounded-full font-medium transition-colors ${
                    stepGoalId 
                      ? 'bg-purple-200 bg-opacity-80 text-purple-800 hover:bg-purple-300' 
                      : 'bg-gray-200 bg-opacity-80 text-gray-600 hover:bg-gray-300'
                  }`}
                >
                  🎯 {stepGoalId ? goals.find(g => g.id === stepGoalId)?.title || t('details.step.goal') : t('details.step.goal')}
                </button>
                {showStepGoalPicker && (
                  <div className="absolute top-full left-0 mt-2 bg-white border-2 border-gray-200 rounded-xl shadow-2xl z-50 min-w-[200px] max-h-64 overflow-y-auto">
                    <button
                      onClick={() => {
                        setStepGoalId(null)
                        setShowStepGoalPicker(false)
                        handleSaveStep()
                      }}
                      className="w-full text-left px-4 py-3 text-sm hover:bg-purple-50 border-b border-gray-100 font-medium transition-colors"
                    >
                      {t('details.step.noGoal')}
                    </button>
                    {goals.map((goal) => (
                      <button
                        key={goal.id}
                        onClick={() => {
                          setStepGoalId(goal.id)
                          setShowStepGoalPicker(false)
                          handleSaveStep()
                        }}
                        className={`w-full text-left px-4 py-3 text-sm hover:bg-purple-50 transition-colors ${
                          stepGoalId === goal.id ? 'bg-purple-50 text-purple-700 font-semibold' : 'text-gray-700'
                        }`}
                      >
                        {goal.title}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              
            </div>

            {/* Time editor */}
            {showTimeEditor && (
              <div className="p-4 bg-white bg-opacity-95 rounded-lg border border-orange-200">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('details.step.estimatedTime')}
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={stepEstimatedTime}
                    onChange={(e) => setStepEstimatedTime(parseInt(e.target.value) || 0)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-600 focus:border-orange-600"
                    min="0"
                  />
                  <button
                    onClick={() => {
                      handleSaveStep()
                      setShowTimeEditor(false)
                    }}
                    className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                  >
                    {t('details.step.confirm')}
                  </button>
                  <button
                    onClick={() => setShowTimeEditor(false)}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    {t('common.cancel')}
                  </button>
                </div>
              </div>
            )}


            {/* Date picker */}
            {showDatePicker && (
              <div className="p-4 bg-white bg-opacity-95 rounded-lg border border-orange-200">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('details.step.newDate')}
                </label>
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={selectedDate || ''}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-600 focus:border-orange-600"
                  />
                  <button
                    onClick={() => handleRescheduleStep(selectedDate)}
                    className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                  >
                    {t('details.step.confirm')}
                  </button>
                  <button
                    onClick={() => setShowDatePicker(false)}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    {t('common.cancel')}
                  </button>
                </div>
              </div>
            )}

            </div>
          </div>
        </div>
      )

    case 'habit':
      return (
        <div className="w-full h-full flex flex-col">
          {/* Back Button */}
          <div className="px-4 pt-4 pb-2 flex-shrink-0">
            <button
              onClick={handleCloseDetail}
              className="flex items-center gap-2 text-gray-600 hover:text-orange-600 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="font-medium">{t('details.backToOverview')}</span>
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto px-4 pb-4">
            <div className="w-full max-w-3xl mx-auto">
            <div className="space-y-4">
              {/* Header */}
              <div className="text-center">
                <h4 className="text-2xl font-bold text-orange-900 mb-2">{item.name}</h4>
                {item.description && item.description !== item.name && (
                  <p className="text-orange-800 text-base leading-relaxed">{item.description}</p>
                )}
              </div>
              
              {/* Compact Stats with Icons */}
              <div className="flex justify-center gap-4">
                {(() => {
                  // Calculate real statistics from habit_completions
                  const habitCompletions = item.habit_completions || {}
                  const now = new Date()
                  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
                  
                  // Use only the date part (without time) for comparison
                  const userCreatedDateFull = new Date(player?.created_at || '2024-01-01')
                  const userCreatedDate = new Date(userCreatedDateFull.getFullYear(), userCreatedDateFull.getMonth(), userCreatedDateFull.getDate())
                  
                  
                  // Count completed and missed days
                  let totalCompleted = 0
                  let totalMissed = 0
                  let currentStreak = 0
                  let longestStreak = 0
                  let tempStreak = 0
                  
                  // Go through all completion records in habit_completions
                  const completionDates = Object.keys(habitCompletions).sort()
                  
                  for (const dateKey of completionDates) {
                    const completion = habitCompletions[dateKey]
                    
                    if (completion === true) {
                      totalCompleted++
                    } else if (completion === false) {
                      totalMissed++
                    }
                  }
                  
                      // Calculate longest streak separately
                      tempStreak = 0
                      longestStreak = 0
                      
                      // Go through all days from user creation to today to calculate longest streak
                      for (let d = new Date(userCreatedDate); d <= now; d.setDate(d.getDate() + 1)) {
                        const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
                        const completion = habitCompletions[dateKey]
                        
                        if (completion === true) {
                          tempStreak++
                          longestStreak = Math.max(longestStreak, tempStreak)
                        } else if (completion === false) {
                          // Missed day breaks the streak
                          tempStreak = 0
                        }
                        // completion === undefined (not-scheduled) doesn't break the streak, just doesn't add to it
                      }
                  
                  // Update longest streak if current streak is longer
                  longestStreak = Math.max(longestStreak, currentStreak)
                  
                  // Calculate current streak by going backwards from the last completed day
                  currentStreak = 0
                  
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
                    // Create date-only versions for comparison
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
                  
                  // Also count missed days for scheduled habits from user creation to today
                  for (let d = new Date(userCreatedDate); d <= new Date(); d.setDate(d.getDate() + 1)) {
                    const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
                    const completion = habitCompletions[dateKey]
                    
                    // If no completion record exists, check if it was scheduled
                    if (completion === undefined) {
                      const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
                      const dayName = dayNames[d.getDay()]
                      const isScheduled = item.selected_days && item.selected_days.includes(dayName)
                      
                      if (isScheduled) {
                        // Was scheduled but not completed = missed
                        totalMissed++
                      }
                    }
                  }
                  
                  return (
                    <>
                      <div 
                        className="flex items-center gap-2 px-3 py-2 rounded-lg" 
                        style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
                        title={t('details.habit.currentStreak')}
                      >
                        <span className="text-lg">🔥</span>
                        <span className="text-lg font-bold text-green-600">{currentStreak}</span>
                      </div>
                      <div 
                        className="flex items-center gap-2 px-3 py-2 rounded-lg" 
                        style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
                        title={t('details.habit.longestStreak')}
                      >
                        <span className="text-lg">🏆</span>
                        <span className="text-lg font-bold text-blue-600">{longestStreak}</span>
                      </div>
                      <div 
                        className="flex items-center gap-2 px-3 py-2 rounded-lg" 
                        style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
                        title={t('details.habit.totalCompleted')}
                      >
                        <span className="text-lg">✅</span>
                        <span className="text-lg font-bold text-purple-600">{totalCompleted}</span>
                      </div>
                      <div 
                        className="flex items-center gap-2 px-3 py-2 rounded-lg" 
                        style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
                        title={t('details.habit.totalMissed')}
                      >
                        <span className="text-lg">❌</span>
                        <span className="text-lg font-bold text-red-600">{totalMissed}</span>
                      </div>
                    </>
                  )
                })()}
              </div>

              {/* Tabs */}
              <div className="flex gap-2 border-b-2 border-orange-200">
                <button
                  onClick={() => setHabitDetailTab('calendar')}
                  className={`px-4 py-2 font-medium transition-colors ${
                    habitDetailTab === 'calendar'
                      ? 'text-orange-600 border-b-2 border-orange-600 -mb-[2px]'
                      : 'text-gray-600 hover:text-orange-600'
                  }`}
                >
                  📅 {t('details.habit.calendar')}
                </button>
                <button
                  onClick={() => setHabitDetailTab('settings')}
                  className={`px-4 py-2 font-medium transition-colors ${
                    habitDetailTab === 'settings'
                      ? 'text-orange-600 border-b-2 border-orange-600 -mb-[2px]'
                      : 'text-gray-600 hover:text-orange-600'
                  }`}
                >
                  ⚙️ {t('details.habit.settingsTab')}
                </button>
              </div>

              {/* Calendar Tab */}
              {habitDetailTab === 'calendar' && (
              <div className="p-3 rounded-xl" style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}>
                {/* Month Navigation */}
                <div className="flex items-center justify-between mb-4">
                  <button
                    onClick={() => {
                      const newDate = new Date(currentMonth)
                      newDate.setMonth(newDate.getMonth() - 1)
                      setCurrentMonth(newDate)
                    }}
                    className="px-3 py-1 rounded-lg bg-orange-200 text-orange-800 hover:bg-orange-300 transition-all duration-200"
                  >
                    ←
                  </button>
                  <h5 className="text-lg font-semibold text-orange-900">
                    {currentMonth.toLocaleDateString(localeCode, { month: 'long', year: 'numeric' })}
                  </h5>
                  <button
                    onClick={() => {
                      const newDate = new Date(currentMonth)
                      newDate.setMonth(newDate.getMonth() + 1)
                      setCurrentMonth(newDate)
                    }}
                    className="px-3 py-1 rounded-lg bg-orange-200 text-orange-800 hover:bg-orange-300 transition-all duration-200"
                  >
                    →
                  </button>
                </div>
                
                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-1 mb-3">
                  {['Po', 'Út', 'St', 'Čt', 'Pá', 'So', 'Ne'].map(day => (
                    <div key={day} className="text-center text-xs font-medium text-orange-800 py-1">
                      {day}
                    </div>
                  ))}
                  {/* Generate calendar days for current month */}
                  {(() => {
                    const year = currentMonth.getFullYear()
                    const month = currentMonth.getMonth()
                    const firstDay = new Date(year, month, 1)
                    const lastDay = new Date(year, month + 1, 0)
                    const daysInMonth = lastDay.getDate()
                    const startDay = (firstDay.getDay() + 6) % 7 // Convert Sunday=0 to Monday=0
                    
                    const days = []
                    
                    // Empty cells for days before month starts
                    for (let i = 0; i < startDay; i++) {
                      days.push(
                        <div key={`empty-${i}`} className="text-center text-xs py-1"></div>
                      )
                    }
                    
                    // Days of the month
                    for (let day = 1; day <= daysInMonth; day++) {
                      const date = new Date(year, month, day)
                      const today = new Date()
                      const isToday = date.toDateString() === today.toDateString()
                      const isFuture = date > today
                      const isPast = date < today
                      
                      // Get actual data from habit_completions
                      const habitCompletions = item.habit_completions || {}
                      const dateKey = getLocalDateString(date)
                      const isCompleted = habitCompletions[dateKey] === true
                      const isMissed = habitCompletions[dateKey] === false
                      
                      // Check if this day is scheduled for this habit
                      const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
                      const dayName = dayNames[date.getDay()]
                      const isScheduled = item.selected_days && item.selected_days.includes(dayName)
                      
                      // Check if this date is after user account creation (not habit creation)
                      const userCreatedDateFull = new Date(player?.created_at || '2024-01-01')
                      const userCreatedDate = new Date(userCreatedDateFull.getFullYear(), userCreatedDateFull.getMonth(), userCreatedDateFull.getDate())
                      const isAfterUserCreation = date >= userCreatedDate
                      
                      // Determine day state based on new logic
                      // For past days (before today), only show "completed" or "missed"
                      // If scheduled but not completed in the past, automatically show as "missed"
                      let dayState = 'not-planned' // default
                      let className = 'text-center text-xs py-1 rounded transition-all duration-200 '
                      let onClick = () => {}
                      
                      if (isCompleted) {
                        // 1. Splněno - zeleně
                        dayState = 'completed'
                        className += 'bg-green-200 text-green-800 hover:bg-green-300 cursor-pointer'
                        onClick = () => {
                          handleHabitCalendarToggle(item.id, dateKey, 'completed', isScheduled)
                        }
                      } else if (isMissed) {
                        // 2. Vynecháno - červeně
                        dayState = 'missed'
                        className += 'bg-red-200 text-red-800 hover:bg-red-300 cursor-pointer'
                        onClick = () => {
                          handleHabitCalendarToggle(item.id, dateKey, 'missed', isScheduled)
                        }
                      } else if (isPast && isAfterUserCreation) {
                        // Past days: if scheduled but not completed, show as "missed"
                        // If not scheduled and not completed, also show as "missed" (user can mark as completed)
                        dayState = 'missed'
                        className += 'bg-red-200 text-red-800 hover:bg-red-300 cursor-pointer'
                        onClick = () => {
                          handleHabitCalendarToggle(item.id, dateKey, 'missed', isScheduled)
                        }
                      } else if (isToday) {
                        // 3. Dnešní den - podtržený, ale stejný styl jako ostatní
                        dayState = 'today'
                        if (isCompleted) {
                          className += 'bg-green-200 text-green-800 hover:bg-green-300 cursor-pointer border-b-2 border-orange-600'
                        } else if (isMissed) {
                          className += 'bg-red-200 text-red-800 hover:bg-red-300 cursor-pointer border-b-2 border-orange-600'
                        } else if (isScheduled) {
                          className += 'bg-gray-100 text-gray-500 cursor-pointer hover:bg-gray-200 border-b-2 border-orange-600'
                        } else {
                          className += 'bg-gray-200 text-gray-600 hover:bg-gray-300 cursor-pointer border-b-2 border-orange-600'
                        }
                        onClick = () => {
                          handleHabitCalendarToggle(item.id, dateKey, isCompleted ? 'completed' : isMissed ? 'missed' : isScheduled ? 'planned' : 'not-scheduled', isScheduled)
                        }
                      } else if (isScheduled && isAfterUserCreation && isFuture) {
                        // 4b. Budoucí naplánovaný den - světle šedě (nelze kliknout)
                        dayState = 'planned-future'
                        className += 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      } else if (isAfterUserCreation && isFuture) {
                        // 5b. Budoucí nenaplánovaný den - šedě (nelze kliknout)
                        dayState = 'not-scheduled-future'
                        className += 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      } else {
                        // Ostatní případy - velmi světle šedě (před vytvořením účtu)
                        dayState = 'inactive'
                        className += 'bg-gray-50 text-gray-300 cursor-not-allowed'
                      }
                      
                      days.push(
                        <div
                          key={day}
                          className={className}
                          onClick={onClick}
                          title={
                            isFuture ? t('details.habit.futureDay') :
                            dayState === 'completed' || dayState === 'missed' || dayState === 'not-scheduled' || dayState === 'planned' ? `Den ${day}.${month + 1}. - klikněte pro změnu` :
                            t('details.habit.dayBeforeAccount')
                          }
                        >
                          {day}
                        </div>
                      )
                    }
                    
                    return days
                  })()}
                </div>
                
                {/* Updated Legend - 4 States */}
                <div className="flex gap-2 justify-center text-xs flex-wrap">
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-green-200 rounded"></div>
                    <span className="text-orange-800">Splněno</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-red-200 rounded"></div>
                    <span className="text-orange-800">Vynecháno</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-gray-100 rounded"></div>
                    <span className="text-orange-800">Naplánováno</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-gray-200 rounded"></div>
                    <span className="text-orange-800">Nenaplánováno</span>
                  </div>
                </div>
              </div>
              )}

              {/* Settings Tab */}
              {habitDetailTab === 'settings' && (
                <div className="p-4 bg-white bg-opacity-95 rounded-lg border border-orange-200 space-y-4">
                  <h5 className="text-lg font-semibold text-gray-800 mb-4">{t('details.habit.settings')}</h5>
                  
                  {/* Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('details.habit.name')}
                    </label>
                <input
                  type="text"
                      value={editingHabitName || item.name}
                      onChange={(e) => setEditingHabitName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-600 focus:border-orange-600"
                    />
              </div>

              {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('details.habit.description')}
                    </label>
              <textarea
                      value={editingHabitDescription || item.description || ''}
                      onChange={(e) => setEditingHabitDescription(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-600 focus:border-orange-600 resize-none"
              rows={3}
            />
            </div>

                  {/* Frequency */}
                  <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                      Frekvence:
                </label>
                    <select
                      value={editingHabitFrequency || item.frequency || 'daily'}
                      onChange={(e) => setEditingHabitFrequency(e.target.value as 'daily' | 'weekly' | 'monthly')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-600 focus:border-orange-600"
                    >
                      <option value="daily">Denně</option>
                      <option value="weekly">Týdně</option>
                      <option value="monthly">Měsíčně</option>
                    </select>
                  </div>
                  
                  {/* Selected Days */}
                  {(editingHabitFrequency === 'weekly' || item.frequency === 'weekly') && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Dny v týdnu:
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day) => {
                          const dayLabels: { [key: string]: string } = {
                            monday: 'Po',
                            tuesday: 'Út',
                            wednesday: 'St',
                            thursday: 'Čt',
                            friday: 'Pá',
                            saturday: 'So',
                            sunday: 'Ne'
                          }
                          const currentDays = editingHabitSelectedDays.length > 0 ? editingHabitSelectedDays : (item.selected_days || [])
                          const isSelected = currentDays.includes(day)
                          return (
                    <button
                                key={day}
                      onClick={() => {
                                  const newDays = isSelected
                                    ? currentDays.filter((d: string) => d !== day)
                                    : [...currentDays, day]
                                  setEditingHabitSelectedDays(newDays)
                      }}
                                className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                                  isSelected
                                    ? 'bg-orange-600 text-white'
                                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                }`}
                    >
                                {dayLabels[day]}
                    </button>
                          )
                        })}
                </div>
              </div>
            )}

                  {/* Always Show */}
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={editingHabitAlwaysShow !== undefined ? editingHabitAlwaysShow : (item.always_show || false)}
                      onChange={(e) => setEditingHabitAlwaysShow(e.target.checked)}
                      className="w-5 h-5 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                    />
                    <label className="text-sm font-medium text-gray-700">
                      Zobrazovat vždy (i když není naplánováno)
                    </label>
                  </div>
                  
                  {/* XP Reward */}
                  <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                      XP odměna:
                </label>
                    <input
                      type="number"
                      value={editingHabitXpReward || item.xp_reward || 0}
                      onChange={(e) => setEditingHabitXpReward(parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-600 focus:border-orange-600"
                      min="0"
                    />
                  </div>
                  
                  {/* Category */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('details.habit.category')}
                    </label>
                    <input
                      type="text"
                      value={editingHabitCategory || item.category || ''}
                      onChange={(e) => setEditingHabitCategory(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-600 focus:border-orange-600"
                      placeholder="Např. Zdraví, Vzdělání..."
                    />
                  </div>
                  
                  {/* Difficulty */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Obtížnost:
                    </label>
                <select
                      value={editingHabitDifficulty || item.difficulty || 'medium'}
                      onChange={(e) => setEditingHabitDifficulty(e.target.value as 'easy' | 'medium' | 'hard')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-600 focus:border-orange-600"
                    >
                      <option value="easy">Snadná</option>
                      <option value="medium">Střední</option>
                      <option value="hard">Těžká</option>
                    </select>
                  </div>

                  {/* Reminder Time */}
                  <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                      Čas připomínky (volitelné):
                </label>
                    <input
                      type="time"
                      value={editingHabitReminderTime || (item.reminder_time || '')}
                      onChange={(e) => setEditingHabitReminderTime(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-600 focus:border-orange-600"
                    />
                  </div>
                  
                  <div className="flex gap-2 pt-2">
                <button
                    onClick={async () => {
                      try {
                        const response = await fetch('/api/habits', {
                          method: 'PUT',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            habitId: item.id,
                            name: editingHabitName || item.name,
                            description: editingHabitDescription !== undefined ? editingHabitDescription : item.description,
                            frequency: editingHabitFrequency || item.frequency,
                            selectedDays: editingHabitSelectedDays.length > 0 ? editingHabitSelectedDays : item.selected_days,
                            alwaysShow: editingHabitAlwaysShow !== undefined ? editingHabitAlwaysShow : item.always_show,
                            xpReward: editingHabitXpReward || item.xp_reward,
                            category: editingHabitCategory || item.category,
                            difficulty: editingHabitDifficulty || item.difficulty,
                            reminderTime: editingHabitReminderTime || item.reminder_time
                          })
                        })
                        if (response.ok) {
                          const updatedHabit = await response.json()
                          if (onHabitsUpdate) {
                            onHabitsUpdate(habits.map(h => h.id === updatedHabit.id ? updatedHabit : h))
                          }
                          // Update selectedItem
                          setSelectedItem(updatedHabit)
                          alert('Návyk byl úspěšně aktualizován')
                        }
                      } catch (error) {
                        console.error('Error updating habit:', error)
                        alert('Chyba při aktualizaci návyku')
                      }
                  }}
                    className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                  >
                      {t('details.habit.saveChanges')}
                    </button>
                  </div>
                </div>
              )}

              </div>
            </div>
          </div>
        </div>
      )

    case 'goal':
      // Create a goal object that matches GoalEditingForm's expected format
      const goalForEditing = {
        ...item
      }

      return (
        <div className="w-full h-full flex flex-col">
          {/* Back Button - positioned higher */}
          <div className="px-6 pt-4 pb-2 flex-shrink-0">
                  <button
              onClick={handleCloseDetail}
              className="flex items-center gap-2 text-gray-600 hover:text-orange-600 transition-colors"
                  >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="font-medium">{t('details.backToOverview')}</span>
                  </button>
                </div>
          
          {/* Goal Editing Form - without max-height constraint */}
          <div className="flex-1 overflow-hidden px-6 pb-6">
            <GoalEditingForm
              goal={goalForEditing}
              userId={userId || player?.user_id}
              player={player}
              onUpdate={handleUpdateGoalForDetail}
              onCancel={handleCloseDetail}
              onDelete={(goalId) => handleDeleteGoalForDetail(goalId, false)}
              stepsCacheRef={stepsCacheRef}
              setStepsCacheVersion={setStepsCacheVersion}
            />
          </div>
        </div>
      )

    case 'stat':
      return (
        <div className="w-full h-full flex flex-col justify-center items-center p-8">
          <div className="grid grid-cols-2 gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold text-orange-600 mb-2">{completedSteps}</div>
              <div className="text-lg text-orange-800 font-medium">Dokončené kroky</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-green-600 mb-2">{activeHabits}</div>
              <div className="text-lg text-orange-800 font-medium">Splněné návyky</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600 mb-2">{completedGoals}</div>
              <div className="text-lg text-orange-800 font-medium">Dokončené cíle</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-purple-600 mb-2">{Math.round(progressPercentage)}%</div>
              <div className="text-lg text-orange-800 font-medium">Celkový pokrok</div>
            </div>
          </div>
        </div>
      )

    default:
      return null
  }
}

