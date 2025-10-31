'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useUser } from '@clerk/nextjs'
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent, DragStartEvent, DragOverlay, useDroppable, useDraggable } from '@dnd-kit/core'
import { arrayMove, SortableContext, sortableKeyboardCoordinates, rectSortingStrategy } from '@dnd-kit/sortable'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { SettingsView } from './SettingsView'
import { Footprints } from 'lucide-react'
import { DailyReviewWorkflow } from './DailyReviewWorkflow'
import { CalendarProgram } from './CalendarProgram'

interface JourneyGameViewProps {
  player?: any
  userId?: string | null
  goals?: any[]
  habits?: any[]
  dailySteps?: any[]
  onNavigateToGoals?: () => void
  onNavigateToHabits?: () => void
  onNavigateToSteps?: () => void
  onNavigateToDailyPlan?: () => void
  onNavigateToStatistics?: () => void
  onNavigateToAchievements?: () => void
  onNavigateToSettings?: () => void
  onHabitsUpdate?: (habits: any[]) => void
  onGoalsUpdate?: (goals: any[]) => void
  onDailyStepsUpdate?: (steps: any[]) => void
}

export function JourneyGameView({ 
  player, 
  userId: userIdProp,
  goals = [], 
  habits = [], 
  dailySteps = [],
  onNavigateToGoals,
  onNavigateToHabits,
  onNavigateToSteps,
  onNavigateToDailyPlan,
  onNavigateToStatistics,
  onNavigateToAchievements,
  onNavigateToSettings,
  onHabitsUpdate,
  onGoalsUpdate,
  onDailyStepsUpdate
}: JourneyGameViewProps) {
  const { user } = useUser()
  const [userId, setUserId] = useState<string | null>(userIdProp || null)
  const [characterDialogue, setCharacterDialogue] = useState("Ahoj! Jsem tvůj průvodce na cestě k úspěchu. Co chceš dělat dnes?")
  const [showDialogue, setShowDialogue] = useState(true)
  
  // Update userId when prop changes
  useEffect(() => {
    if (userIdProp) {
      setUserId(userIdProp)
    }
  }, [userIdProp])
  
  // Load userId from API as fallback if not provided as prop
  useEffect(() => {
    if (userId || !user?.id) return
    
    const loadUserId = async () => {
      try {
        console.log('Loading userId for Clerk ID:', user.id)
        const response = await fetch(`/api/user?clerkId=${user.id}`)
        if (response.ok) {
          const dbUser = await response.json()
          console.log('User loaded from DB:', dbUser)
          setUserId(dbUser.id)
        } else {
          console.error('Failed to load user, status:', response.status)
          const errorText = await response.text()
          console.error('Error response:', errorText)
        }
      } catch (error) {
        console.error('Error loading userId:', error)
      }
    }
    
    loadUserId()
  }, [user?.id, userId])
  const [currentPage, setCurrentPage] = useState<'main' | 'goals' | 'habits' | 'steps' | 'daily-plan' | 'statistics' | 'achievements' | 'settings'>('main')
  const [showAddHabitForm, setShowAddHabitForm] = useState(false)
  const [editingHabit, setEditingHabit] = useState<any>(null)
  const [editingGoal, setEditingGoal] = useState<any>(null)
  const [editingStep, setEditingStep] = useState<any>(null)
  const [displayMode, setDisplayMode] = useState<'character' | 'progress' | 'motivation' | 'stats' | 'dialogue'>('character')
  const [selectedItem, setSelectedItem] = useState<any>(null)
  const [selectedItemType, setSelectedItemType] = useState<'step' | 'habit' | 'goal' | 'stat' | null>(null)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [currentProgram, setCurrentProgram] = useState<'daily-plan' | 'statistics' | 'goals' | 'habits' | 'steps' | 'chill' | 'workflow' | 'calendar'>('daily-plan')
  const [expandedLeftSection, setExpandedLeftSection] = useState<'goals' | null>(null)
  const [expandedRightSection, setExpandedRightSection] = useState<'habits' | 'steps' | null>(null)
  const [leftSectionHeights, setLeftSectionHeights] = useState({ goals: 0 })
  const [rightSectionHeights, setRightSectionHeights] = useState({ habits: 0, steps: 0 })
  const [leftSidebarWidth, setLeftSidebarWidth] = useState<'288px' | '48px' | '0px'>('288px')
  const [rightSidebarWidth, setRightSidebarWidth] = useState<'288px' | '48px' | '0px'>('288px')
  const [expandedAreas, setExpandedAreas] = useState<Set<string | null>>(new Set())
  const [pendingWorkflow, setPendingWorkflow] = useState<any>(null)
  
  // Responsive logic
  useEffect(() => {
    const handleResize = () => {
      const availableWidth = window.innerWidth
      const minDisplayWidth = 430
      
      // Start with both sidebars maximized (288px)
      const sidebarsWidth = 288 + 288
      const margins = 40 // Left + right margins
      const availableForDisplay = availableWidth - sidebarsWidth - margins
      
      if (availableForDisplay >= minDisplayWidth) {
        // Both sidebars can stay maximized
        setLeftSidebarWidth('288px')
        setRightSidebarWidth('288px')
      } else {
        // Try with left minimized
        const leftMinWidth = 48
        const leftMinRightMaxDisplay = availableWidth - leftMinWidth - 288 - margins
        
        if (leftMinRightMaxDisplay >= minDisplayWidth) {
          // Left minimized, right maximized
          setLeftSidebarWidth('48px')
          setRightSidebarWidth('288px')
        } else {
          // Try with both minimized
          const bothMinDisplay = availableWidth - 48 - 48 - margins
          
          if (bothMinDisplay >= minDisplayWidth) {
            // Both minimized
            setLeftSidebarWidth('48px')
            setRightSidebarWidth('48px')
          } else {
            // Not enough space at all - hide everything
            setLeftSidebarWidth('0px')
            setRightSidebarWidth('0px')
          }
        }
      }
    }
    
    // Run immediately on mount
    handleResize()
    
    // Also listen for resize events
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, []) // Empty dependency array - only run on mount and resize
  
  // When sidebars are maximized, show all sections by default
  // expandedLeftSection and expandedRightSection will be managed by hover when minimized
  
  const habitsRef = useRef<HTMLDivElement>(null)
  const goalsRef = useRef<HTMLDivElement>(null)
  const stepsRef = useRef<HTMLDivElement>(null)
  
  const [areas, setAreas] = useState<any[]>([])
  const [sortedGoals, setSortedGoals] = useState<any[]>([])
  const [showCreateGoal, setShowCreateGoal] = useState(false)
  const [newGoal, setNewGoal] = useState({
    title: '',
    description: '',
    areaId: null,
    target_date: null,
    status: 'active'
  })
  const [showCreateStep, setShowCreateStep] = useState(false)
  const [newStep, setNewStep] = useState({
    title: '',
    description: '',
    goalId: null,
    isImportant: false,
    isUrgent: false,
    estimatedTime: 30,
    xpReward: 1,
    date: new Date().toISOString().split('T')[0] // Default to today
  })
  const [newHabit, setNewHabit] = useState({
    name: '',
    description: '',
    frequency: 'daily',
    reminderTime: '09:00',
    reminderEnabled: true,
    selectedDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
    alwaysShow: false,
    xpReward: 1,
    customXpReward: ''
  })
  
  // Filters for steps page
  const [stepsShowCompleted, setStepsShowCompleted] = useState(false)
  const [stepsDateFilter, setStepsDateFilter] = useState<'all' | 'overdue' | 'today' | 'future'>('all')
  const [stepsGoalFilter, setStepsGoalFilter] = useState<string | null>(null)

  const handleCharacterClick = () => {
    // Cycle through different display modes
    const modes = ['character', 'progress', 'motivation', 'stats', 'dialogue'] as const
    const currentIndex = modes.indexOf(displayMode)
    const nextIndex = (currentIndex + 1) % modes.length
    setDisplayMode(modes[nextIndex])
  }

  const handleItemClick = (item: any, type: 'step' | 'habit' | 'goal' | 'stat') => {
    setSelectedItem(item)
    setSelectedItemType(type)
    // Don't change displayMode, just show detail in current program
  }

  const handleCloseDetail = () => {
    setSelectedItem(null)
    setSelectedItemType(null)
    // Stay in current program, don't change displayMode
  }

  const handleHabitCalendarToggle = async (habitId: string, date: string, currentState: 'completed' | 'missed' | 'planned' | 'not-scheduled' | 'today', isScheduled: boolean) => {
    try {
      let newState: boolean | null = null
      
      // Determine new state based on current state and whether habit is scheduled for this day
      if (currentState === 'completed') {
        if (isScheduled) {
          newState = false // Scheduled + completed -> missed
        } else {
          newState = null // Not scheduled + completed -> not scheduled (remove completion)
        }
      } else if (currentState === 'missed') {
        newState = true // Missed -> completed
      } else if (currentState === 'planned') {
        newState = true // Planned -> completed
      } else if (currentState === 'not-scheduled') {
        newState = true // Not scheduled -> completed
      } else if (currentState === 'today') {
        // For today, cycle between completed and original state
        const habitCompletions = selectedItem?.habit_completions || {}
        const isCompletedToday = habitCompletions[date] === true
        if (isCompletedToday) {
          newState = null // Completed today -> back to original state (planned/not-scheduled)
        } else {
          newState = true // Not completed today -> completed
        }
      } else {
        newState = true // Default to completed
      }
      
      console.log('Calendar toggle:', { habitId, date, currentState, newState })
      
      const response = await fetch('/api/habits/calendar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          habitId,
          date,
          completed: newState
        }),
      })
      
      console.log('Calendar response:', response.status, response.ok)
      
      if (response.ok) {
        // Update the habit in state via callback
        if (onHabitsUpdate) {
          // Refresh habits from server
          const habitsResponse = await fetch('/api/habits')
          if (habitsResponse.ok) {
            const updatedHabits = await habitsResponse.json()
            console.log('Debug - updated habits from server:', updatedHabits)
            console.log('Debug - Studená sprcha from server:', updatedHabits.find((h: any) => h.name === 'Studená sprcha'))
            console.log('Debug - Studená sprcha habit_completions from server:', updatedHabits.find((h: any) => h.name === 'Studená sprcha')?.habit_completions)
            onHabitsUpdate(updatedHabits)
          }
        }
        
        // Update selected item if it's the same habit
        if (selectedItem && selectedItem.id === habitId) {
          const updatedCompletions = {
            ...selectedItem.habit_completions,
            [date]: newState
          }
          setSelectedItem({
            ...selectedItem,
            habit_completions: updatedCompletions
          })
        }
        
      } else {
        const errorText = await response.text()
        console.error('Failed to update habit calendar:', response.status, errorText)
      }
    } catch (error) {
      console.error('Error updating habit calendar:', error)
    }
  }

  const handleStepToggle = async (stepId: string, completed: boolean) => {
    try {
      const response = await fetch('/api/daily-steps', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          stepId: stepId,
          completed: completed,
          completedAt: completed ? new Date().toISOString() : null
        }),
      })

      if (response.ok) {
        const updatedStep = await response.json()
        // Update the step in dailySteps array
        const updatedSteps = dailySteps.map(step => 
          step.id === updatedStep.id ? updatedStep : step
        )
        if (onDailyStepsUpdate) {
          onDailyStepsUpdate(updatedSteps)
        }
        // Update selected item if it's the same step
        if (selectedItem && selectedItem.id === stepId) {
          setSelectedItem(updatedStep)
        }
      } else {
        console.error('Failed to update step')
        alert('Nepodařilo se aktualizovat krok')
      }
    } catch (error) {
      console.error('Error updating step:', error)
      alert('Chyba při aktualizaci kroku')
    }
  }

  // Auto-cycle display mode
  useEffect(() => {
    const interval = setInterval(() => {
      const modes = ['character', 'progress', 'motivation', 'stats', 'dialogue'] as const
      const currentIndex = modes.indexOf(displayMode)
      const nextIndex = (currentIndex + 1) % modes.length
      setDisplayMode(modes[nextIndex])
    }, 8000) // Change every 8 seconds

    return () => clearInterval(interval)
  }, [displayMode])

  // Measure heights of expanded sections on first load
  useEffect(() => {
    const timer = setTimeout(() => {
      if (goalsRef.current) {
        const height = goalsRef.current.scrollHeight
        setLeftSectionHeights(prev => ({ ...prev, goals: height }))
      }
      if (habitsRef.current) {
        const height = habitsRef.current.scrollHeight
        setRightSectionHeights(prev => ({ ...prev, habits: height }))
      }
      if (stepsRef.current) {
        const height = stepsRef.current.scrollHeight
        setRightSectionHeights(prev => ({ ...prev, steps: height }))
      }
    }, 100)
    
    return () => clearTimeout(timer)
  }, [habits, goals, dailySteps, areas])

  // Also measure when sections expand
  useEffect(() => {
    if (goalsRef.current && expandedLeftSection === 'goals') {
      const height = goalsRef.current.scrollHeight
      setLeftSectionHeights(prev => ({ ...prev, goals: height }))
    }
    if (habitsRef.current && expandedRightSection === 'habits') {
      const height = habitsRef.current.scrollHeight
      setRightSectionHeights(prev => ({ ...prev, habits: height }))
    }
    if (stepsRef.current && expandedRightSection === 'steps') {
      const height = stepsRef.current.scrollHeight
      setRightSectionHeights(prev => ({ ...prev, steps: height }))
    }
  }, [expandedLeftSection, expandedRightSection])

  const initializeEditingHabit = (habit: any) => {
    setEditingHabit({
      ...habit,
      reminderEnabled: !!habit.reminder_time,
      selectedDays: habit.selected_days || [],
      alwaysShow: habit.always_show || false,
      xpReward: habit.xp_reward || 1,
      customXpReward: ''
    })
  }

  const initializeEditingGoal = (goal: any) => {
    setEditingGoal({
      ...goal,
      title: goal.title || '',
      description: goal.description || '',
      areaId: goal.area_id || null,
      target_date: goal.target_date || null,
      status: goal.status || 'active'
    })
  }

  const getMotivationalDialogue = () => {
    const dialogues = [
      "Každý den je nová příležitost k růstu!",
      "Malé kroky vedou k velkým změnám.",
      "Ty máš sílu dosáhnout svých cílů!",
      "Dnes je skvělý den pro pokrok!",
      "Věř si a pokračuj v cestě!",
      "Každý úspěch začíná rozhodnutím zkusit to."
    ]
    return dialogues[Math.floor(Math.random() * dialogues.length)]
  }

  const [editingStepTitle, setEditingStepTitle] = useState(false)
  const [stepTitle, setStepTitle] = useState('')
  const [stepDescription, setStepDescription] = useState('')
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [selectedDate, setSelectedDate] = useState('')
  const [showTimeEditor, setShowTimeEditor] = useState(false)
  const [showXpEditor, setShowXpEditor] = useState(false)
  const [stepEstimatedTime, setStepEstimatedTime] = useState<number>(0)
  const [stepXpReward, setStepXpReward] = useState<number>(0)

  // Goal editing states
  const [editingGoalTitle, setEditingGoalTitle] = useState(false)
  const [goalTitle, setGoalTitle] = useState('')
  const [goalDescription, setGoalDescription] = useState('')
  const [showGoalDatePicker, setShowGoalDatePicker] = useState(false)
  const [goalDate, setGoalDate] = useState('')
  const [goalStatus, setGoalStatus] = useState('')
  const [goalAreaId, setGoalAreaId] = useState('')
  const [showGoalAreaEditor, setShowGoalAreaEditor] = useState(false)
  const [showGoalStatusEditor, setShowGoalStatusEditor] = useState(false)
  
  // Drag & drop state
  const [activeDragId, setActiveDragId] = useState<string | null>(null)

  useEffect(() => {
    if (selectedItem && selectedItemType === 'step') {
      // Check if this is a new step (placeholder)
      const isNewStep = selectedItem.id === 'new-step'
      setStepTitle(isNewStep ? 'Nový krok' : (selectedItem.title || ''))
      setStepDescription(selectedItem.description || '')
      setEditingStepTitle(isNewStep) // Start editing for new steps
      setSelectedDate(selectedItem.date || '')
      setShowDatePicker(false)
      setShowTimeEditor(false)
      setShowXpEditor(false)
      setStepEstimatedTime(selectedItem.estimated_time || 0)
      setStepXpReward(selectedItem.xp_reward || 0)
    }
    
    if (selectedItem && selectedItemType === 'goal') {
      setGoalTitle(selectedItem.title || '')
      setGoalDescription(selectedItem.description || '')
      setEditingGoalTitle(false)
      setGoalDate(selectedItem.target_date || '')
      setShowGoalDatePicker(false)
      setShowGoalAreaEditor(false)
      setShowGoalStatusEditor(false)
      setGoalStatus(selectedItem.status || 'active')
      setGoalAreaId(selectedItem.area_id || '')
    }
  }, [selectedItem, selectedItemType])

  const handleSaveStep = async () => {
    if (!selectedItem || selectedItemType !== 'step') return

    try {
      const isNewStep = selectedItem.id === 'new-step'
      
      // For new step, create it
      if (isNewStep) {
        const response = await fetch('/api/daily-steps', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: player?.user_id,
            title: stepTitle,
            description: stepDescription,
            date: selectedDate || new Date().toISOString().split('T')[0],
            estimated_time: stepEstimatedTime,
            xp_reward: stepXpReward
          })
        })

        if (response.ok) {
          const updatedSteps = await fetch(`/api/daily-steps?userId=${player?.user_id}&date=${new Date().toISOString().split('T')[0]}`)
            .then(res => res.json())
          onDailyStepsUpdate?.(updatedSteps)
          setEditingStepTitle(false)
          setSelectedItem(null)
          setSelectedItemType(null)
        }
      } else {
        // For existing step, update it
        const response = await fetch('/api/daily-steps', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            stepId: selectedItem.id,
            title: stepTitle,
            description: stepDescription,
            estimated_time: stepEstimatedTime,
            xp_reward: stepXpReward
          })
        })

        if (response.ok) {
          // Optimistically update the selected item
          setSelectedItem({ 
            ...selectedItem, 
            title: stepTitle,
            description: stepDescription,
            estimated_time: stepEstimatedTime,
            xp_reward: stepXpReward
          })
          
          const updatedSteps = await fetch(`/api/daily-steps?userId=${player?.user_id}&date=${new Date().toISOString().split('T')[0]}`)
            .then(res => res.json())
          onDailyStepsUpdate?.(updatedSteps)
          setEditingStepTitle(false)
        }
      }
    } catch (error) {
      console.error('Error saving step:', error)
    }
  }

  const handleToggleStepCompleted = async (completed: boolean) => {
    if (!selectedItem || selectedItemType !== 'step') return

    try {
      const response = await fetch('/api/daily-steps', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stepId: selectedItem.id,
          completed
        })
      })

      if (response.ok) {
        // Optimistically update the selected item
        setSelectedItem({ ...selectedItem, completed })
        
        // Also update the dailySteps list
        const updatedSteps = await fetch(`/api/daily-steps?userId=${player?.user_id}&date=${new Date().toISOString().split('T')[0]}`)
          .then(res => res.json())
        onDailyStepsUpdate?.(updatedSteps)
      }
    } catch (error) {
      console.error('Error toggling step completion:', error)
      // Revert on error
      setSelectedItem({ ...selectedItem, completed: !completed })
    }
  }

  const handleRescheduleStep = async (newDate: string) => {
    if (!selectedItem || selectedItemType !== 'step') return

    try {
      const response = await fetch('/api/daily-steps', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stepId: selectedItem.id,
          title: selectedItem.title,
          description: selectedItem.description,
          goalId: selectedItem.goal_id,
          isImportant: selectedItem.is_important,
          isUrgent: selectedItem.is_urgent,
          estimatedTime: selectedItem.estimated_time,
          xpReward: selectedItem.xp_reward,
          date: newDate
        })
      })

      if (response.ok) {
        setShowDatePicker(false)
        const updatedSteps = await fetch(`/api/daily-steps?userId=${player?.user_id}&date=${new Date().toISOString().split('T')[0]}`)
          .then(res => res.json())
        onDailyStepsUpdate?.(updatedSteps)
        setSelectedItem(null)
        setSelectedItemType(null)
      } else {
        const errorData = await response.json()
        console.error('Error rescheduling step:', errorData)
      }
    } catch (error) {
      console.error('Error rescheduling step:', error)
    }
  }

  const handleSaveGoal = async () => {
    if (!selectedItem || selectedItemType !== 'goal') return

    try {
      const response = await fetch('/api/goals', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          goalId: selectedItem.id,
          title: goalTitle,
          description: goalDescription,
          target_date: goalDate,
          status: goalStatus,
          area_id: goalAreaId
        })
      })

      if (response.ok) {
        // Optimistically update the selected item
        const updatedGoal = { 
          ...selectedItem, 
          title: goalTitle,
          description: goalDescription,
          target_date: goalDate,
          status: goalStatus,
          area_id: goalAreaId
        }
        setSelectedItem(updatedGoal)
        
        const updatedGoals = await fetch(`/api/goals?userId=${player?.user_id}`)
          .then(res => res.json())
        onGoalsUpdate?.(updatedGoals)
        setEditingGoalTitle(false)
      }
    } catch (error) {
      console.error('Error updating goal:', error)
    }
  }

  const renderItemDetail = (item: any, type: 'step' | 'habit' | 'goal' | 'stat') => {
    switch (type) {
      case 'step':
        return (
          <div className="w-full h-full flex flex-col justify-between p-8">
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
                    className="flex-1 text-2xl font-bold text-orange-900 border-b-2 border-orange-500 focus:outline-none bg-transparent"
                    autoFocus
                  />
                ) : (
                  <>
                    <h4 className="text-2xl font-bold text-orange-900 flex-1">{stepTitle}</h4>
                    <button
                      onClick={() => setEditingStepTitle(true)}
                      className="text-gray-400 hover:text-orange-600 transition-colors"
                      title="Upravit název"
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
                placeholder="Popis kroku..."
                className="w-full px-4 py-3 text-orange-800 border border-orange-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white bg-opacity-50 resize-none"
                rows={3}
              />

              {/* Info tags */}
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => {
                    setShowXpEditor(false)
                    setShowDatePicker(false)
                    setShowTimeEditor(!showTimeEditor)
                  }}
                  className={`text-sm px-4 py-2 rounded-full font-medium transition-colors ${
                    stepEstimatedTime > 0 
                      ? 'bg-blue-200 bg-opacity-80 text-blue-800 hover:bg-blue-300' 
                      : 'bg-gray-200 bg-opacity-80 text-gray-600 hover:bg-gray-300'
                  }`}
                >
                  ⏱️ {stepEstimatedTime > 0 ? `${stepEstimatedTime} min` : 'Přidat čas'}
                </button>
                
                <button
                  onClick={() => {
                    setShowTimeEditor(false)
                    setShowDatePicker(false)
                    setShowXpEditor(!showXpEditor)
                  }}
                  className={`text-sm px-4 py-2 rounded-full font-medium transition-colors ${
                    stepXpReward > 0 
                      ? 'bg-purple-200 bg-opacity-80 text-purple-800 hover:bg-purple-300' 
                      : 'bg-gray-200 bg-opacity-80 text-gray-600 hover:bg-gray-300'
                  }`}
                >
                  ⭐ {stepXpReward > 0 ? `${stepXpReward} XP` : 'Přidat XP'}
                </button>
                <button
                  onClick={() => {
                    setShowTimeEditor(false)
                    setShowXpEditor(false)
                    setShowDatePicker(!showDatePicker)
                  }}
                  className="text-sm px-4 py-2 bg-gray-200 bg-opacity-80 text-gray-800 rounded-full font-medium hover:bg-gray-300 transition-colors"
                >
                  📅 {item.date ? new Date(item.date).toLocaleDateString('cs-CZ') : 'Bez data'}
                </button>
              </div>

              {/* Time editor */}
              {showTimeEditor && (
                <div className="p-4 bg-white bg-opacity-95 rounded-lg border border-orange-200">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Odhadovaný čas (min):
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={stepEstimatedTime}
                      onChange={(e) => setStepEstimatedTime(parseInt(e.target.value) || 0)}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      min="0"
                    />
                    <button
                      onClick={() => {
                        handleSaveStep()
                        setShowTimeEditor(false)
                      }}
                      className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                    >
                      Potvrdit
                    </button>
                    <button
                      onClick={() => setShowTimeEditor(false)}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                    >
                      Zrušit
                    </button>
                  </div>
                </div>
              )}

              {/* XP editor */}
              {showXpEditor && (
                <div className="p-4 bg-white bg-opacity-95 rounded-lg border border-orange-200">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    XP odměna:
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={stepXpReward}
                      onChange={(e) => setStepXpReward(parseInt(e.target.value) || 0)}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      min="0"
                    />
                    <button
                      onClick={() => {
                        handleSaveStep()
                        setShowXpEditor(false)
                      }}
                      className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                    >
                      Potvrdit
                    </button>
                    <button
                      onClick={() => setShowXpEditor(false)}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                    >
                      Zrušit
                    </button>
                  </div>
                </div>
              )}

              {/* Date picker */}
              {showDatePicker && (
                <div className="p-4 bg-white bg-opacity-95 rounded-lg border border-orange-200">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nové datum:
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="date"
                      value={selectedDate ? new Date(selectedDate).toISOString().split('T')[0] : ''}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    />
                    <button
                      onClick={() => handleRescheduleStep(selectedDate)}
                      className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                    >
                      Potvrdit
                    </button>
                    <button
                      onClick={() => setShowDatePicker(false)}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                    >
                      Zrušit
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )

      case 'habit':
        return (
          <div className="w-full h-full flex flex-col justify-center items-center p-4">
            <div className="w-full max-w-3xl">
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
                          title="Aktuální streak"
                        >
                          <span className="text-lg">🔥</span>
                          <span className="text-lg font-bold text-green-600">{currentStreak}</span>
                        </div>
                        <div 
                          className="flex items-center gap-2 px-3 py-2 rounded-lg" 
                          style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
                          title="Nejdelší streak"
                        >
                          <span className="text-lg">🏆</span>
                          <span className="text-lg font-bold text-blue-600">{longestStreak}</span>
                        </div>
                        <div 
                          className="flex items-center gap-2 px-3 py-2 rounded-lg" 
                          style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
                          title="Celkem splněno"
                        >
                          <span className="text-lg">✅</span>
                          <span className="text-lg font-bold text-purple-600">{totalCompleted}</span>
                        </div>
                        <div 
                          className="flex items-center gap-2 px-3 py-2 rounded-lg" 
                          style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
                          title="Celkem vynecháno"
                        >
                          <span className="text-lg">❌</span>
                          <span className="text-lg font-bold text-red-600">{totalMissed}</span>
                        </div>
                      </>
                    )
                  })()}
                </div>

                {/* Monthly Calendar */}
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
                      {currentMonth.toLocaleDateString('cs-CZ', { month: 'long', year: 'numeric' })}
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
                        const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
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
                        } else if (isToday) {
                          // 3. Dnešní den - podtržený, ale stejný styl jako ostatní
                          dayState = 'today'
                          if (isCompleted) {
                            className += 'bg-green-200 text-green-800 hover:bg-green-300 cursor-pointer border-b-2 border-orange-500'
                          } else if (isMissed) {
                            className += 'bg-red-200 text-red-800 hover:bg-red-300 cursor-pointer border-b-2 border-orange-500'
                          } else if (isScheduled) {
                            className += 'bg-gray-100 text-gray-500 cursor-pointer hover:bg-gray-200 border-b-2 border-orange-500'
                          } else {
                            className += 'bg-gray-200 text-gray-600 hover:bg-gray-300 cursor-pointer border-b-2 border-orange-500'
                          }
                          onClick = () => {
                            handleHabitCalendarToggle(item.id, dateKey, isCompleted ? 'completed' : isMissed ? 'missed' : isScheduled ? 'planned' : 'not-scheduled', isScheduled)
                          }
                        } else if (isScheduled && isAfterUserCreation && !isFuture) {
                          // 4. Naplánováno - světle šedě (pouze minulost a dnešek)
                          dayState = 'planned'
                          className += 'bg-gray-100 text-gray-500 cursor-pointer hover:bg-gray-200'
                          onClick = () => {
                            handleHabitCalendarToggle(item.id, dateKey, 'planned', isScheduled)
                          }
                        } else if (isScheduled && isAfterUserCreation && isFuture) {
                          // 4b. Budoucí naplánovaný den - světle šedě (nelze kliknout)
                          dayState = 'planned-future'
                          className += 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        } else if (isAfterUserCreation && !isFuture) {
                          // 5. Nenaplánováno - šedě (ale klikatelné pouze pro minulost a dnešek)
                          dayState = 'not-scheduled'
                          className += 'bg-gray-200 text-gray-600 hover:bg-gray-300 cursor-pointer'
                          onClick = () => {
                            handleHabitCalendarToggle(item.id, dateKey, 'not-scheduled', isScheduled)
                          }
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
                              isFuture ? 'Budoucí den - nelze upravit' :
                              dayState === 'completed' || dayState === 'missed' || dayState === 'not-scheduled' || dayState === 'planned' ? `Den ${day}.${month + 1}. - klikněte pro změnu` :
                              'Den před vytvořením účtu - nelze upravit'
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

              </div>
            </div>
          </div>
        )

      case 'goal':
        return (
          <div className="w-full h-full flex flex-col justify-between p-8">
            <div className="w-full max-w-2xl space-y-6 mx-auto">
              {/* Title with edit button */}
              <div className="flex items-start gap-3">
                {editingGoalTitle ? (
                  <input
                    type="text"
                    value={goalTitle}
                    onChange={(e) => setGoalTitle(e.target.value)}
                    onBlur={() => handleSaveGoal()}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleSaveGoal()
                      }
                      if (e.key === 'Escape') {
                        setEditingGoalTitle(false)
                        setGoalTitle(selectedItem?.title || '')
                      }
                    }}
                    className="flex-1 text-2xl font-bold text-orange-900 border-b-2 border-orange-500 focus:outline-none bg-transparent"
                    autoFocus
                  />
                ) : (
                  <>
                    <h4 className="text-2xl font-bold text-orange-900 flex-1">{goalTitle}</h4>
                    <button
                      onClick={() => setEditingGoalTitle(true)}
                      className="text-gray-400 hover:text-orange-600 transition-colors"
                      title="Upravit název"
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
                value={goalDescription}
                onChange={(e) => setGoalDescription(e.target.value)}
                onBlur={handleSaveGoal}
                placeholder="Popis cíle..."
                className="w-full px-4 py-3 text-orange-800 border border-orange-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white bg-opacity-50 resize-none"
                rows={3}
              />

              {/* Info tags */}
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => {
                    setShowGoalStatusEditor(false)
                    setShowGoalDatePicker(false)
                    setShowGoalAreaEditor(!showGoalAreaEditor)
                  }}
                  className={`text-sm px-4 py-2 rounded-full font-medium transition-colors ${
                    areas.find(a => a.id === goalAreaId)?.name
                      ? 'bg-purple-200 bg-opacity-80 text-purple-800 hover:bg-purple-300' 
                      : 'bg-gray-200 bg-opacity-80 text-gray-600 hover:bg-gray-300'
                  }`}
                >
                  📍 {areas.find(a => a.id === goalAreaId)?.name || 'Vybrat oblast'}
                </button>
                
                <button
                  onClick={() => {
                    setShowGoalAreaEditor(false)
                    setShowGoalDatePicker(false)
                    setShowGoalStatusEditor(!showGoalStatusEditor)
                  }}
                  className={`text-sm px-4 py-2 rounded-full font-medium transition-colors ${
                    goalStatus === 'active' ? 'bg-green-200 text-green-800 hover:bg-green-300' :
                    goalStatus === 'completed' ? 'bg-blue-200 text-blue-800 hover:bg-blue-300' :
                    'bg-yellow-200 text-yellow-800 hover:bg-yellow-300'
                  }`}
                >
                  {goalStatus === 'active' ? '✓ Aktivní' : 
                   goalStatus === 'completed' ? '✓ Splněný' : '✓ Ke zvážení'}
                </button>
                <button
                  onClick={() => {
                    setShowGoalAreaEditor(false)
                    setShowGoalStatusEditor(false)
                    setShowGoalDatePicker(!showGoalDatePicker)
                  }}
                  className="text-sm px-4 py-2 bg-gray-200 bg-opacity-80 text-gray-800 rounded-full font-medium hover:bg-gray-300 transition-colors"
                >
                  📅 {goalDate ? new Date(goalDate).toLocaleDateString('cs-CZ') : 'Bez data'}
                </button>
              </div>

              {/* Area editor */}
              {showGoalAreaEditor && (
                <div className="p-4 bg-white bg-opacity-95 rounded-lg border border-orange-200">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Oblast:
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={goalAreaId}
                      onChange={(e) => setGoalAreaId(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    >
                      {areas.map(area => (
                        <option key={area.id} value={area.id}>{area.name}</option>
                      ))}
                    </select>
                    <button
                      onClick={() => {
                        handleSaveGoal()
                        setShowGoalAreaEditor(false)
                      }}
                      className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                    >
                      Potvrdit
                    </button>
                    <button
                      onClick={() => setShowGoalAreaEditor(false)}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                    >
                      Zrušit
                    </button>
                  </div>
                </div>
              )}

              {/* Status editor */}
              {showGoalStatusEditor && (
                <div className="p-4 bg-white bg-opacity-95 rounded-lg border border-orange-200">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status:
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={goalStatus}
                      onChange={(e) => setGoalStatus(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    >
                      <option value="active">Aktivní</option>
                      <option value="completed">Splněný</option>
                      <option value="considering">Ke zvážení</option>
                    </select>
                    <button
                      onClick={() => {
                        handleSaveGoal()
                        setShowGoalStatusEditor(false)
                      }}
                      className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                    >
                      Potvrdit
                    </button>
                    <button
                      onClick={() => setShowGoalStatusEditor(false)}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                    >
                      Zrušit
                    </button>
                  </div>
                </div>
              )}

              {/* Date picker */}
              {showGoalDatePicker && (
                <div className="p-4 bg-white bg-opacity-95 rounded-lg border border-orange-200">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cílové datum:
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="date"
                      value={goalDate ? new Date(goalDate).toISOString().split('T')[0] : ''}
                      onChange={(e) => setGoalDate(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    />
                    <button
                      onClick={() => {
                        handleSaveGoal()
                        setShowGoalDatePicker(false)
                      }}
                      className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                    >
                      Potvrdit
                    </button>
                    <button
                      onClick={() => setShowGoalDatePicker(false)}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                    >
                      Zrušit
                    </button>
                  </div>
                </div>
              )}
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

  const renderActionButtons = () => {
    // If there's a selected item, show edit buttons
    if (selectedItem && selectedItemType) {
      switch (selectedItemType) {
        case 'step':
          return (
            <>
              <button
                onClick={() => handleStepToggle(selectedItem.id, !selectedItem.completed)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                  selectedItem.completed 
                    ? 'bg-gray-500 text-white hover:bg-gray-600' 
                    : 'bg-orange-500 text-white hover:bg-orange-600'
                }`}
              >
                {selectedItem.completed ? 'Označit jako nedokončený' : 'Dokončit krok'}
              </button>
              <button
                onClick={() => {
                  initializeEditingStep(selectedItem)
                  handleCloseDetail()
                }}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-500 text-white hover:bg-blue-600 transition-all duration-300"
              >
                Upravit
              </button>
              <button
                onClick={handleCloseDetail}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-500 text-white hover:bg-gray-600 transition-all duration-300"
              >
                Zavřít
              </button>
            </>
          )
        case 'habit':
          return (
            <>
              <button
                onClick={() => handleHabitToggle(selectedItem.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                  selectedItem.completed_today 
                    ? 'bg-gray-500 text-white hover:bg-gray-600' 
                    : 'bg-orange-500 text-white hover:bg-orange-600'
                }`}
              >
                {selectedItem.completed_today ? 'Označit jako nesplněný' : 'Splnit návyk'}
              </button>
              <button
                onClick={() => {
                  initializeEditingHabit(selectedItem)
                  handleCloseDetail()
                }}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-500 text-white hover:bg-blue-600 transition-all duration-300"
              >
                Upravit
              </button>
              <button
                onClick={handleCloseDetail}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-500 text-white hover:bg-gray-600 transition-all duration-300"
              >
                Zavřít
              </button>
            </>
          )
        case 'goal':
          return (
            <>
              <button
                onClick={() => {
                  initializeEditingGoal(selectedItem)
                  handleCloseDetail()
                }}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-500 text-white hover:bg-blue-600 transition-all duration-300"
              >
                Upravit
              </button>
              <button
                onClick={handleCloseDetail}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-500 text-white hover:bg-gray-600 transition-all duration-300"
              >
                Zavřít
              </button>
            </>
          )
        case 'stat':
          return (
            <>
              <button
                onClick={handleCloseDetail}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-500 text-white hover:bg-gray-600 transition-all duration-300"
              >
                Zavřít
              </button>
            </>
          )
        default:
          return null
      }
    }

    // Show program-specific buttons
    switch (currentProgram) {
      case 'daily-plan':
        return (
          <>
            <button
              onClick={() => setShowCreateStep(true)}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-orange-500 text-white hover:bg-orange-600 transition-all duration-300 shadow-md"
            >
              Přidat krok
            </button>
            <button
              onClick={() => setCurrentProgram('goals')}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-500 text-white hover:bg-blue-600 transition-all duration-300 shadow-md"
            >
              Spravovat cíle
            </button>
          </>
        )
      case 'statistics':
        return (
          <>
            <button
              onClick={() => setCurrentProgram('daily-plan')}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-orange-500 text-white hover:bg-orange-600 transition-all duration-300 shadow-md"
            >
              Zpět na plán
            </button>
          </>
        )
      case 'goals':
        return (
          <>
            <button
              onClick={() => setShowCreateGoal(true)}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-orange-500 text-white hover:bg-orange-600 transition-all duration-300 shadow-md"
            >
              Přidat cíl
            </button>
            <button
              onClick={() => setCurrentProgram('daily-plan')}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-500 text-white hover:bg-gray-600 transition-all duration-300 shadow-md"
            >
              Zpět na plán
            </button>
          </>
        )
      case 'habits':
        return (
          <>
            <button
              onClick={() => setShowAddHabitForm(true)}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-orange-500 text-white hover:bg-orange-600 transition-all duration-300 shadow-md"
            >
              Přidat návyk
            </button>
            <button
              onClick={() => setCurrentProgram('daily-plan')}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-500 text-white hover:bg-gray-600 transition-all duration-300 shadow-md"
            >
              Zpět na plán
            </button>
          </>
        )
      case 'steps':
        return (
          <>
            <button
              onClick={() => setShowCreateStep(true)}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-orange-500 text-white hover:bg-orange-600 transition-all duration-300 shadow-md"
            >
              Přidat krok
            </button>
            <button
              onClick={() => setCurrentProgram('daily-plan')}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-500 text-white hover:bg-gray-600 transition-all duration-300 shadow-md"
            >
              Zpět na plán
            </button>
          </>
        )
      default:
        return null
    }
  }

  const renderChillContent = () => {
    const chillPlaces = [
      // Tropical Beach - Line Art Style
      {
        name: 'Tropická pláž',
        background: 'linear-gradient(180deg, #E6F3FF 0%, #87CEEB 30%, #F4A460 70%, #DEB887 100%)',
        svg: (
          <svg viewBox="0 0 400 300" className="w-full h-full">
            {/* Sky */}
            <defs>
              <pattern id="skyGradient" patternUnits="userSpaceOnUse" width="400" height="150">
                <stop offset="0%" stopColor="#E6F3FF"/>
                <stop offset="100%" stopColor="#87CEEB"/>
              </pattern>
            </defs>
            
            {/* Background sky */}
            <rect width="400" height="150" fill="url(#skyGradient)"/>
            
            {/* Ocean waves */}
            <path d="M0,150 Q50,140 100,150 T200,150 T300,150 T400,150 L400,200 L0,200 Z" fill="#4682B4" stroke="#2E5B8A" strokeWidth="1"/>
            <path d="M0,160 Q30,155 60,160 T120,160 T180,160 T240,160 T300,160 T360,160 T400,160 L400,200 L0,200 Z" fill="#5A9BD4" stroke="#2E5B8A" strokeWidth="0.5"/>
            <path d="M0,170 Q40,165 80,170 T160,170 T240,170 T320,170 T400,170 L400,200 L0,200 Z" fill="#6BB6E8" stroke="#2E5B8A" strokeWidth="0.5"/>
            
            {/* Beach */}
            <path d="M0,200 Q100,190 200,200 T400,200 L400,300 L0,300 Z" fill="#DEB887" stroke="#CD853F" strokeWidth="1"/>
            
            {/* Palm trees */}
            {/* Left palm */}
            <line x1="80" y1="200" x2="80" y2="120" stroke="#8B4513" strokeWidth="3"/>
            <path d="M80,120 Q60,100 40,120 Q60,110 80,120 Q100,100 120,120 Q100,110 80,120" fill="none" stroke="#228B22" strokeWidth="2"/>
            <path d="M80,120 Q70,100 50,110 Q70,105 80,120 Q90,100 110,110 Q90,105 80,120" fill="none" stroke="#228B22" strokeWidth="1.5"/>
            
            {/* Right palm */}
            <line x1="320" y1="200" x2="320" y2="100" stroke="#8B4513" strokeWidth="4"/>
            <path d="M320,100 Q300,80 280,100 Q300,90 320,100 Q340,80 360,100 Q340,90 320,100" fill="none" stroke="#228B22" strokeWidth="2.5"/>
            <path d="M320,100 Q310,80 290,90 Q310,85 320,100 Q330,80 350,90 Q330,85 320,100" fill="none" stroke="#228B22" strokeWidth="2"/>
            
            {/* Center palm */}
            <line x1="200" y1="200" x2="200" y2="110" stroke="#8B4513" strokeWidth="3.5"/>
            <path d="M200,110 Q180,90 160,110 Q180,100 200,110 Q220,90 240,110 Q220,100 200,110" fill="none" stroke="#228B22" strokeWidth="2.2"/>
            <path d="M200,110 Q190,90 170,100 Q190,95 200,110 Q210,90 230,100 Q210,95 200,110" fill="none" stroke="#228B22" strokeWidth="1.8"/>
            
            {/* Sun */}
            <circle cx="350" cy="50" r="15" fill="#FFD700" stroke="#FFA500" strokeWidth="1"/>
            <line x1="350" y1="20" x2="350" y2="15" stroke="#FFA500" strokeWidth="1"/>
            <line x1="365" y1="35" x2="370" y2="30" stroke="#FFA500" strokeWidth="1"/>
            <line x1="365" y1="65" x2="370" y2="70" stroke="#FFA500" strokeWidth="1"/>
            <line x1="335" y1="65" x2="330" y2="70" stroke="#FFA500" strokeWidth="1"/>
            <line x1="335" y1="35" x2="330" y2="30" stroke="#FFA500" strokeWidth="1"/>
            
            {/* Clouds */}
            <ellipse cx="100" cy="40" rx="20" ry="8" fill="none" stroke="#FFFFFF" strokeWidth="1.5"/>
            <ellipse cx="120" cy="40" rx="15" ry="6" fill="none" stroke="#FFFFFF" strokeWidth="1.5"/>
            <ellipse cx="110" cy="35" rx="12" ry="5" fill="none" stroke="#FFFFFF" strokeWidth="1.5"/>
            
            <ellipse cx="250" cy="60" rx="18" ry="7" fill="none" stroke="#FFFFFF" strokeWidth="1.5"/>
            <ellipse cx="270" cy="60" rx="12" ry="5" fill="none" stroke="#FFFFFF" strokeWidth="1.5"/>
            
            {/* Small birds */}
            <path d="M150,80 Q155,75 160,80" fill="none" stroke="#2C3E50" strokeWidth="1"/>
            <path d="M180,70 Q185,65 190,70" fill="none" stroke="#2C3E50" strokeWidth="1"/>
            <path d="M220,90 Q225,85 230,90" fill="none" stroke="#2C3E50" strokeWidth="1"/>
          </svg>
        )
      },
      // Mountain Landscape
      {
        name: 'Horské panorama',
        background: 'linear-gradient(180deg, #E6F3FF 0%, #B0C4DE 20%, #708090 40%, #2F4F4F 100%)',
        svg: (
          <svg viewBox="0 0 400 300" className="w-full h-full">
            {/* Sky */}
            <rect width="400" height="150" fill="#E6F3FF"/>
            
            {/* Mountains */}
            <path d="M0,150 L50,80 L100,120 L150,60 L200,100 L250,40 L300,80 L350,50 L400,90 L400,150 Z" fill="#708090" stroke="#2F4F4F" strokeWidth="1"/>
            <path d="M0,150 L30,100 L60,130 L90,90 L120,110 L150,70 L180,100 L210,60 L240,90 L270,50 L300,80 L330,40 L360,70 L400,60 L400,150 Z" fill="#8A9BA8" stroke="#2F4F4F" strokeWidth="0.8"/>
            
            {/* Foreground mountains */}
            <path d="M0,150 L80,100 L160,130 L240,80 L320,110 L400,90 L400,150 Z" fill="#2F4F4F" stroke="#1A252F" strokeWidth="1.2"/>
            
            {/* Sun */}
            <circle cx="350" cy="50" r="12" fill="#FFD700" stroke="#FFA500" strokeWidth="1"/>
            
            {/* Clouds */}
            <ellipse cx="100" cy="40" rx="25" ry="10" fill="none" stroke="#FFFFFF" strokeWidth="2"/>
            <ellipse cx="120" cy="40" rx="18" ry="8" fill="none" stroke="#FFFFFF" strokeWidth="2"/>
            <ellipse cx="110" cy="35" rx="15" ry="6" fill="none" stroke="#FFFFFF" strokeWidth="2"/>
            
            <ellipse cx="250" cy="60" rx="20" ry="8" fill="none" stroke="#FFFFFF" strokeWidth="1.5"/>
            <ellipse cx="270" cy="60" rx="15" ry="6" fill="none" stroke="#FFFFFF" strokeWidth="1.5"/>
            
            {/* Trees */}
            <line x1="50" y1="150" x2="50" y2="120" stroke="#8B4513" strokeWidth="2"/>
            <path d="M50,120 Q40,110 30,120 Q40,115 50,120 Q60,110 70,120 Q60,115 50,120" fill="none" stroke="#228B22" strokeWidth="1.5"/>
            
            <line x1="150" y1="150" x2="150" y2="110" stroke="#8B4513" strokeWidth="2.5"/>
            <path d="M150,110 Q140,100 130,110 Q140,105 150,110 Q160,100 170,110 Q160,105 150,110" fill="none" stroke="#228B22" strokeWidth="2"/>
            
            <line x1="300" y1="150" x2="300" y2="125" stroke="#8B4513" strokeWidth="2"/>
            <path d="M300,125 Q290,115 280,125 Q290,120 300,125 Q310,115 320,125 Q310,120 300,125" fill="none" stroke="#228B22" strokeWidth="1.5"/>
          </svg>
        )
      },
      // Forest
      {
        name: 'Tajemný les',
        background: 'linear-gradient(180deg, #E6F3FF 0%, #87CEEB 20%, #228B22 60%, #006400 100%)',
        svg: (
          <svg viewBox="0 0 400 300" className="w-full h-full">
            {/* Sky */}
            <rect width="400" height="120" fill="#E6F3FF"/>
            
            {/* Ground */}
            <rect width="400" height="180" y="120" fill="#228B22"/>
            
            {/* Trees */}
            {/* Left tree */}
            <line x1="80" y1="300" x2="80" y2="100" stroke="#8B4513" strokeWidth="4"/>
            <path d="M80,100 Q60,80 40,100 Q60,90 80,100 Q100,80 120,100 Q100,90 80,100" fill="none" stroke="#228B22" strokeWidth="3"/>
            <path d="M80,100 Q70,80 50,90 Q70,85 80,100 Q90,80 110,90 Q90,85 80,100" fill="none" stroke="#228B22" strokeWidth="2"/>
            
            {/* Center tree */}
            <line x1="200" y1="300" x2="200" y2="80" stroke="#8B4513" strokeWidth="5"/>
            <path d="M200,80 Q180,60 160,80 Q180,70 200,80 Q220,60 240,80 Q220,70 200,80" fill="none" stroke="#228B22" strokeWidth="3.5"/>
            <path d="M200,80 Q190,60 170,70 Q190,65 200,80 Q210,60 230,70 Q210,65 200,80" fill="none" stroke="#228B22" strokeWidth="2.5"/>
            
            {/* Right tree */}
            <line x1="320" y1="300" x2="320" y2="90" stroke="#8B4513" strokeWidth="4"/>
            <path d="M320,90 Q300,70 280,90 Q300,80 320,90 Q340,70 360,90 Q340,80 320,90" fill="none" stroke="#228B22" strokeWidth="3"/>
            <path d="M320,90 Q310,70 290,80 Q310,75 320,90 Q330,70 350,80 Q330,75 320,90" fill="none" stroke="#228B22" strokeWidth="2"/>
            
            {/* Sun */}
            <circle cx="350" cy="50" r="15" fill="#FFD700" stroke="#FFA500" strokeWidth="1"/>
            
            {/* Birds */}
            <path d="M150,60 Q155,55 160,60" fill="none" stroke="#2C3E50" strokeWidth="1.5"/>
            <path d="M180,70 Q185,65 190,70" fill="none" stroke="#2C3E50" strokeWidth="1.5"/>
            <path d="M220,50 Q225,45 230,50" fill="none" stroke="#2C3E50" strokeWidth="1.5"/>
            
            {/* Small plants */}
            <path d="M50,300 Q45,290 40,300 Q45,295 50,300 Q55,290 60,300 Q55,295 50,300" fill="none" stroke="#228B22" strokeWidth="1"/>
            <path d="M120,300 Q115,290 110,300 Q115,295 120,300 Q125,290 130,300 Q125,295 120,300" fill="none" stroke="#228B22" strokeWidth="1"/>
          </svg>
        )
      }
    ]

    const randomPlace = chillPlaces[Math.floor(Math.random() * chillPlaces.length)]

    return (
      <div className="w-full h-full relative overflow-hidden" style={{
        background: randomPlace.background,
        minHeight: '400px'
      }}>
        {randomPlace.svg}
        
        {/* Place name */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white text-lg font-semibold text-center bg-black bg-opacity-30 px-4 py-2 rounded-lg">
          {randomPlace.name}
        </div>
      </div>
    )
  }

  const renderDisplayContent = () => {
    // If there's a selected item, show its detail for editing
    if (selectedItem && selectedItemType) {
      return renderItemDetail(selectedItem, selectedItemType)
    }

    // Show detailed content based on current program
    switch (currentProgram) {
      case 'daily-plan':
        return renderDailyPlanContent()
      case 'statistics':
        return renderStatisticsContent()
      case 'goals':
        return renderGoalsContent()
      case 'habits':
        return renderHabitsContent()
      case 'steps':
        return renderStepsContent()
      case 'chill':
        console.log('Debug - switch case chill called')
        return renderChillContent()
      case 'workflow':
        return renderWorkflowContent()
      case 'calendar':
        return renderCalendarContent()
      default:
        return renderDailyPlanContent()
    }
  }

  const renderWorkflowContent = () => {
    if (!pendingWorkflow || pendingWorkflow.type !== 'daily_review') {
      return renderDailyPlanContent()
    }

    return (
      <DailyReviewWorkflow
        workflow={pendingWorkflow}
        goals={goals}
        player={player}
        onComplete={handleWorkflowComplete}
        onSkip={handleWorkflowSkip}
        onGoalProgressUpdate={handleGoalProgressUpdate}
      />
    )
  }

  const renderCalendarContent = () => {
    // Calendar will be imported and rendered here
    return (
      <CalendarProgram
        player={player}
        goals={goals}
        habits={habits}
        dailySteps={dailySteps}
        onHabitsUpdate={onHabitsUpdate}
        onDailyStepsUpdate={onDailyStepsUpdate}
      />
    )
  }

  const renderDailyPlanContent = () => {
    // Get today's date
    const today = new Date().toISOString().split('T')[0]
    
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
      
      // If frequency is 'custom', check if today is in selected_days
      if (habit.frequency === 'custom' && habit.selected_days) {
        const included = habit.selected_days.includes(todayName)
        return included
      }
      
      return false
    })

    // Calculate today's progress based on completed steps and habits
    const completedSteps = todaysSteps.filter(step => step.completed).length
    const completedHabits = todaysHabits.filter(habit => {
      const todayDate = today
      return habit.habit_completions && habit.habit_completions[todayDate] === true
    }).length
    
    const totalItems = todaysSteps.length + todaysHabits.length
    const completedItems = completedSteps + completedHabits
    const todayProgressPercentage = totalItems > 0 ? (completedItems / totalItems) * 100 : 0

    return (
      <div className="w-full h-full flex flex-col p-4">
        {/* Compact Progress Section */}
        <div className="flex items-center gap-3 mb-6">
          <div className="text-2xl font-bold text-orange-600">{Math.round(todayProgressPercentage)}%</div>
          <div className="flex-1 bg-orange-200 bg-opacity-50 rounded-full h-2">
            <div 
              className="bg-orange-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${todayProgressPercentage}%` }}
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
                  className={`p-3 rounded-xl border text-sm transition-all duration-300 cursor-pointer ${
                    step.completed 
                      ? 'bg-green-50 border-green-200 text-green-700 shadow-md' 
                      : 'bg-gray-50 border-gray-200 hover:shadow-md'
                  }`}
                  style={{
                    boxShadow: step.completed ? '0 4px 12px rgba(34, 197, 94, 0.2)' : '0 2px 4px rgba(0, 0, 0, 0.05)'
                  }}
                >
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleStepToggle(step.id, !step.completed)
                      }}
                      className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all duration-300 ${
                        step.completed
                          ? 'bg-green-500 border-green-500 text-white shadow-md'
                          : 'border-gray-300 hover:border-green-400 hover:shadow-sm'
                      }`}
                      style={{
                        boxShadow: step.completed ? '0 2px 8px rgba(34, 197, 94, 0.3)' : '0 1px 2px rgba(0, 0, 0, 0.1)'
                      }}
                      title={step.completed ? 'Označit jako nedokončený' : 'Označit jako dokončený'}
                    >
                      {step.completed && '✓'}
                    </button>
                    <span className="text-gray-400">#{index + 1}</span>
                    <span 
                      className={`flex-1 truncate ${step.completed ? 'line-through' : 'cursor-pointer'}`}
                      onClick={() => handleItemClick(step, 'step')}
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
                const today = new Date().toISOString().split('T')[0]
                const isCompleted = habit.habit_completions && habit.habit_completions[today] === true
                
                return (
                  <div
                    key={habit.id}
                    onClick={() => handleItemClick(habit, 'habit')}
                    className={`p-3 rounded-xl border transition-all duration-300 cursor-pointer ${
                      isCompleted 
                        ? 'bg-orange-100 border-orange-300 shadow-md' 
                        : 'bg-gray-50 border-gray-200 hover:shadow-md hover:bg-gray-100'
                    }`}
                    style={{
                      boxShadow: isCompleted ? '0 4px 12px rgba(251, 146, 60, 0.2)' : '0 2px 4px rgba(0, 0, 0, 0.05)'
                    }}
                  >
                    <div className="flex items-center gap-2 text-sm">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleHabitToggle(habit.id)
                        }}
                        className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all duration-300 ${
                          isCompleted
                            ? 'bg-orange-500 border-orange-500 text-white shadow-md'
                            : 'border-gray-300 hover:border-orange-400 hover:shadow-sm'
                        }`}
                        style={{
                          boxShadow: isCompleted ? '0 2px 8px rgba(251, 146, 60, 0.3)' : '0 1px 2px rgba(0, 0, 0, 0.1)'
                        }}
                        title={isCompleted ? 'Označit jako nesplněný' : 'Označit jako splněný'}
                      >
                        {isCompleted && '✓'}
                      </button>
                      <span className={`truncate flex-1 ${
                        isCompleted 
                          ? 'line-through text-orange-600' 
                          : 'text-gray-700'
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

  const renderStatisticsContent = () => {
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
  }

  const renderGoalsContent = () => {
    return (
      <div className="w-full h-full flex flex-col justify-center items-center p-8">
        <div className="w-full max-w-4xl">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sortedGoals.map((goal, index) => (
              <div
                key={goal.id}
                onClick={() => handleItemClick(goal, 'goal')}
                className="p-4 rounded-xl border cursor-pointer transition-all duration-300 hover:shadow-md"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  borderColor: 'rgba(251, 146, 60, 0.3)',
                  boxShadow: '0 2px 8px rgba(251, 146, 60, 0.1)'
                }}
              >
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 bg-orange-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                      {index + 1}
                    </span>
                    <h4 className="font-semibold text-orange-900 truncate">{goal.title}</h4>
                  </div>
                  {goal.description && (
                    <p className="text-orange-700 text-sm">{goal.description}</p>
                  )}
                  <div className="flex flex-wrap gap-1">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      goal.status === 'active' ? 'bg-green-200 text-green-800' :
                      goal.status === 'completed' ? 'bg-blue-200 text-blue-800' :
                      'bg-yellow-200 text-yellow-800'
                    }`}>
                      {goal.status === 'active' ? 'Aktivní' : 
                       goal.status === 'completed' ? 'Splněný' : 'Ke zvážení'}
                    </span>
                    {goal.target_date && (
                      <span className="text-xs px-2 py-1 bg-gray-200 text-gray-800 rounded-full">
                        {new Date(goal.target_date).toLocaleDateString('cs-CZ')}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const renderHabitsContent = () => {
    return (
      <div className="w-full h-full flex flex-col justify-center items-center p-8">
        <div className="w-full max-w-2xl">
          <div className="space-y-4">
            {habits.map((habit) => {
              // Calculate isCompletedToday using local date and habit_completions
              const now = new Date()
              const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
              const isCompletedToday = habit && habit.habit_completions && habit.habit_completions[today] === true;
              return (
                <div
                  key={habit.id}
                  onClick={() => handleItemClick(habit, 'habit')}
                  className="p-4 rounded-xl border cursor-pointer transition-all duration-300 hover:shadow-md"
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    borderColor: 'rgba(251, 146, 60, 0.3)',
                    boxShadow: '0 2px 8px rgba(251, 146, 60, 0.1)'
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="text-lg font-semibold text-orange-900">{habit.name}</h4>
                      {habit.description && (
                        <p className="text-sm text-orange-700 mt-1">{habit.description}</p>
                      )}
                      <div className="flex flex-wrap gap-2 mt-2">
                        <span className="text-xs px-2 py-1 bg-orange-200 text-orange-800 rounded-full">
                          {habit.frequency === 'daily' ? 'Denně' : 
                           habit.frequency === 'weekly' ? 'Týdně' : 
                           habit.frequency === 'monthly' ? 'Měsíčně' : 'Vlastní'}
                        </span>
                        {habit.xp_reward && (
                          <span className="text-xs px-2 py-1 bg-purple-200 text-purple-800 rounded-full">
                            {habit.xp_reward} XP
                          </span>
                        )}
                        {habit.streak && (
                          <span className="text-xs px-2 py-1 bg-green-200 text-green-800 rounded-full">
                            Streak: {habit.streak}
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleHabitToggle(habit.id)
                      }}
                      className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                        isCompletedToday 
                          ? 'bg-green-500 text-white' 
                          : 'bg-orange-200 text-orange-600 hover:bg-orange-300'
                      }`}
                    >
                      {isCompletedToday ? '✓' : '○'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    )
  }

  const renderStepsContent = () => {
    return (
      <div className="w-full h-full flex flex-col justify-center items-center p-8">
        <div className="w-full max-w-2xl">
          <div className="space-y-4">
            {dailySteps.map((step, index) => (
              <div
                key={step.id}
                onClick={() => handleItemClick(step, 'step')}
                className="p-4 rounded-xl border cursor-pointer transition-all duration-300 hover:shadow-md"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  borderColor: 'rgba(251, 146, 60, 0.3)',
                  boxShadow: '0 2px 8px rgba(251, 146, 60, 0.1)'
                }}
              >
                <div className="flex items-center gap-3">
                  <span className="text-orange-400 font-bold">#{index + 1}</span>
                  <div className="flex-1">
                    <div className="font-semibold text-orange-900">{step.title}</div>
                    {step.description && (
                      <div className="text-orange-700 text-sm mt-1">{step.description}</div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {step.estimated_time && (
                      <span className="text-xs px-2 py-1 bg-blue-200 text-blue-800 rounded-full">
                        {step.estimated_time} min
                      </span>
                    )}
                    {step.xp_reward && (
                      <span className="text-xs px-2 py-1 bg-purple-200 text-purple-800 rounded-full">
                        {step.xp_reward} XP
                      </span>
                    )}
                    {step.date && (
                      <span className="text-xs px-2 py-1 bg-gray-200 text-gray-800 rounded-full">
                        {new Date(step.date).toLocaleDateString('cs-CZ')}
                      </span>
                    )}
                    {step.completed && <span className="text-green-600">✓</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const renderDisplayContentOld = () => {
    // If there's a selected item, show its detail
    if (selectedItem && selectedItemType) {
      return renderItemDetail(selectedItem, selectedItemType)
    }

    switch (displayMode) {
      case 'character':
        return (
          <div className="text-center">
            {/* Journey-style Character */}
            <div 
              className="w-36 h-36 mx-auto mb-6 rounded-full border-4 border-orange-200 flex items-center justify-center bg-gradient-to-br from-orange-50 to-orange-100 cursor-pointer hover:scale-105 transition-all duration-500 shadow-xl"
              onClick={handleCharacterClick}
              style={{
                background: 'radial-gradient(circle at 30% 30%, #fff7ed, #fed7aa)',
                boxShadow: '0 15px 30px rgba(251, 146, 60, 0.2), inset 0 2px 0 rgba(255,255,255,0.3)'
              }}
            >
              <div className="w-28 h-28 rounded-full relative" style={{ backgroundColor: player?.appearance?.skinColor || '#FDBCB4' }}>
                {/* Hair */}
                <div
                  className="absolute top-0 left-1/2 transform -translate-x-1/2 w-24 h-12 rounded-full"
                  style={{ backgroundColor: player?.appearance?.hairColor || '#8B4513' }}
                />
                {/* Eyes */}
                <div className="absolute top-8 left-1/2 transform -translate-x-1/2 flex gap-4">
                  <div 
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: player?.appearance?.eyeColor || '#4A90E2' }}
                  />
                  <div 
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: player?.appearance?.eyeColor || '#4A90E2' }}
                  />
                </div>
                {/* Smile */}
                <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 w-12 h-3 bg-gray-700 rounded-sm" />
              </div>
            </div>

            {/* Character Name */}
            <h2 className="text-2xl font-bold text-orange-800 mb-6" style={{
              textShadow: '2px 2px 4px rgba(0,0,0,0.1)',
              letterSpacing: '1px'
            }}>
              {player?.name || 'Hrdina'}
            </h2>
          </div>
        )

      case 'progress':
        return (
          <div className="text-center">
            <h3 className="text-xl font-bold text-orange-800 mb-6" style={{ letterSpacing: '1px' }}>DNEŠNÍ CESTA</h3>
            <div className="bg-white bg-opacity-90 rounded-xl p-6 max-w-md mx-auto shadow-lg border border-orange-200" style={{
              background: 'linear-gradient(135deg, #ffffff, #f8fafc)',
              boxShadow: '0 8px 16px rgba(251, 146, 60, 0.1)'
            }}>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Pokrok</span>
                  <span className="text-orange-600 text-sm font-bold">
                    {completedSteps}/{totalSteps} kroků
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 shadow-inner">
                  <div 
                    className="bg-gradient-to-r from-orange-400 to-orange-600 h-3 rounded-full transition-all duration-700 shadow-sm"
                    style={{ 
                      width: `${progressPercentage}%`,
                      boxShadow: '0 2px 4px rgba(251, 146, 60, 0.3)'
                    }}
                  ></div>
                </div>
                <div className="text-sm text-gray-600 text-center">
                  {progressPercentage === 100 ? '🎉 Všechny kroky dokončeny!' : `${Math.round(progressPercentage)}% dokončeno`}
                </div>
              </div>
              <p className="text-sm text-gray-700 italic text-center mt-4">
                Každý krok tě přibližuje k cíli!
              </p>
            </div>
          </div>
        )

      case 'motivation':
        return (
          <div className="text-center">
            <h3 className="text-xl font-bold text-orange-800 mb-6" style={{ letterSpacing: '1px' }}>MOTIVACE</h3>
            <div className="bg-gradient-to-r from-yellow-100 to-orange-100 border border-orange-200 rounded-xl p-8 max-w-lg mx-auto shadow-lg" style={{
              background: 'linear-gradient(135deg, #fef3c7, #fed7aa)',
              boxShadow: '0 8px 16px rgba(251, 146, 60, 0.15)'
            }}>
              <p className="text-gray-800 text-base leading-relaxed" style={{
                letterSpacing: '0.5px',
                lineHeight: '1.6'
              }}>
                "{getMotivationalDialogue()}"
              </p>
            </div>
          </div>
        )

      case 'stats':
        return (
          <div className="text-center">
            <h3 className="text-xl font-bold text-orange-800 mb-6" style={{ letterSpacing: '1px' }}>STATISTIKY</h3>
            <div className="bg-white bg-opacity-90 rounded-xl p-6 max-w-md mx-auto shadow-lg border border-orange-200" style={{
              background: 'linear-gradient(135deg, #ffffff, #f8fafc)',
              boxShadow: '0 8px 16px rgba(251, 146, 60, 0.1)'
            }}>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">{completedSteps}</div>
                  <div className="text-sm text-gray-600">Dokončené kroky</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">{activeHabits}</div>
                  <div className="text-sm text-gray-600">Splněné návyky</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">{completedGoals}</div>
                  <div className="text-sm text-gray-600">Splněné cíle</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">{currentDay}</div>
                  <div className="text-sm text-gray-600">Den cesty</div>
                </div>
              </div>
            </div>
          </div>
        )

      case 'dialogue':
        return (
          <div className="text-center">
            <h3 className="text-xl font-bold text-orange-800 mb-6" style={{ letterSpacing: '1px' }}>ROZHOVOR</h3>
            <div className="bg-gradient-to-r from-yellow-100 to-orange-100 border border-orange-200 rounded-xl p-8 max-w-lg mx-auto shadow-lg" style={{
              background: 'linear-gradient(135deg, #fef3c7, #fed7aa)',
              boxShadow: '0 8px 16px rgba(251, 146, 60, 0.15)'
            }}>
              <p className="text-gray-800 text-base leading-relaxed" style={{
                letterSpacing: '0.5px',
                lineHeight: '1.6'
              }}>
                "{getMotivationalDialogue()}"
              </p>
              <div className="text-right mt-4">
                <button
                  onClick={() => setDisplayMode('character')}
                  className="text-sm text-gray-600 hover:text-orange-700 bg-white bg-opacity-50 px-3 py-1 rounded hover:bg-opacity-70 transition-colors"
                >
                  Zavřít
                </button>
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

        // Sortable Goal Component
        function SortableGoal({ goal, index, isEditing, editingGoal, setEditingGoal, handleUpdateGoal, getStatusColor, areas, initializeEditingGoal }: any) {
          const {
            attributes,
            listeners,
            setNodeRef,
            transform,
            transition,
            isDragging,
          } = useSortable({ 
            id: goal.id,
            disabled: isEditing
          })

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.5 : 1,
    }

    const goalProgress = goal.steps ? (goal.steps.filter((step: any) => step.completed).length / Math.max(goal.steps.length, 1)) * 100 : 0;
    const targetDate = goal.target_date ? new Date(goal.target_date).toLocaleDateString('cs-CZ') : 'Bez termínu';
    const areaName = goal.area_name || 'Obecná oblast';

    // Handle click vs drag detection
    const [dragStartPosition, setDragStartPosition] = useState({ x: 0, y: 0 })
    const [isDragStarted, setIsDragStarted] = useState(false)

          const handleMouseDown = (e: any) => {
            setDragStartPosition({ x: e.clientX, y: e.clientY })
            setIsDragStarted(false)
          }

          const handleMouseMove = (e: any) => {
            if (!isDragStarted) {
              const dragDistance = Math.sqrt(
                Math.pow(e.clientX - dragStartPosition.x, 2) + 
                Math.pow(e.clientY - dragStartPosition.y, 2)
              )
              
              if (dragDistance > 5) {
                setIsDragStarted(true)
              }
            }
          }

          const handleMouseUp = (e: any) => {
            // Don't close if clicking on editing form
            if (e.target.closest('.editing-form') !== null) {
              return
            }
            
            if (!isDragStarted) {
              // Treat as click - open/close editing
              if (isEditing) {
                setEditingGoal(null)
              } else {
                initializeEditingGoal(goal)
              }
            }
            setIsDragStarted(false)
          }

        return (
          <div 
            ref={setNodeRef} 
            style={style} 
            {...attributes} 
            {...listeners}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200 cursor-grab active:cursor-grabbing"
          >
            <div className={`p-4 ${isEditing ? 'border-b border-gray-200' : ''}`}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-start gap-3 flex-1">
                  {/* Priority indicator */}
                  <div className="flex flex-col items-center gap-1 mt-1">
                    <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 font-bold text-sm">
                      {index + 1}
                    </div>
                    <div className="w-1 h-8 bg-orange-200 rounded-full"></div>
                  </div>
                  
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-800 mb-1">
                      {goal.title}
                    </h3>
                    <p className="text-gray-600 text-sm mb-2">{goal.description}</p>
                  </div>
                </div>
                <div className="text-right ml-4">
                  <span className="text-orange-600 font-bold text-lg">{Math.round(goalProgress)}%</span>
                </div>
              </div>
          
          {/* Progress bar */}
          <div className="w-full bg-gray-200 rounded-full h-3 shadow-inner mb-3" style={{
            boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.1)'
          }}>
            <div 
              className="bg-gradient-to-r from-orange-400 to-orange-600 h-3 rounded-full transition-all duration-700 shadow-sm"
              style={{ 
                width: `${goalProgress}%`,
                boxShadow: '0 2px 4px rgba(251, 146, 60, 0.3)'
              }}
            ></div>
          </div>
          
          {/* Goal metadata */}
          <div className="flex flex-wrap gap-2 mb-2">
            <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(goal.status)}`}>
              {goal.status === 'active' ? 'Aktivní' : 
               goal.status === 'completed' ? 'Splněný' : 'Ke zvážení'}
            </span>
            <span className="text-xs px-2 py-1 rounded-full font-medium text-purple-600 bg-purple-100">
              {goal.category === 'short-term' ? 'Krátkodobý' :
               goal.category === 'medium-term' ? 'Střednědobý' : 'Dlouhodobý'}
            </span>
          </div>
          
          {/* Goal details */}
          <div className="flex flex-wrap gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>{targetDate}</span>
            </div>
            <div className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>{areaName}</span>
            </div>
            {goal.steps && (
              <div className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <span>{goal.steps.length} kroků</span>
              </div>
            )}
          </div>
        </div>
        
        {isEditing && (
          <GoalEditingForm 
            goal={editingGoal}
            onUpdate={handleUpdateGoal}
            onCancel={() => setEditingGoal(null)}
            onDelete={handleDeleteGoal}
            areas={areas}
          />
        )}
      </div>
    )
  }

  const handleHabitToggle = async (habitId: string) => {
    try {
      // Use local date to avoid timezone issues
      const now = new Date()
      const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
      const response = await fetch('/api/habits/toggle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ habitId, date: today }),
      })

      if (response.ok) {
        const result = await response.json()
        
        // Update habits in parent component
        if (onHabitsUpdate) {
          // Refresh habits from server to get updated habit_completions
          const habitsResponse = await fetch('/api/habits')
          if (habitsResponse.ok) {
            const updatedHabits = await habitsResponse.json()
            onHabitsUpdate(updatedHabits)
          }
        }
        
        // Update selected item if it's the same habit
        if (selectedItem && selectedItem.id === habitId) {
          const updatedCompletions = {
            ...selectedItem.habit_completions,
            [today]: result.completed
          }
          setSelectedItem({
            ...selectedItem,
            habit_completions: updatedCompletions
          })
        }
      } else {
        console.error('Failed to toggle habit')
      }
    } catch (error) {
      console.error('Error toggling habit:', error);
    }
  }

  const handleUpdateHabit = async () => {
    if (!editingHabit || !editingHabit.name.trim()) {
      alert('Název návyku je povinný')
      return
    }

    try {
      console.log('Updating habit:', editingHabit)
      console.log('Habit ID:', editingHabit.id)
      
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
          xpReward: editingHabit.customXpReward ? parseInt(editingHabit.customXpReward) : editingHabit.xpReward
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

  const handleUpdateGoal = async (goalId: string, updates: any) => {
    if (!updates.title || !updates.title.trim()) {
      alert('Název cíle je povinný')
      return
    }

    try {
      console.log('Updating goal:', goalId, updates)
      
      const response = await fetch('/api/goals', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          goalId,
          ...updates
        }),
      })

      if (response.ok) {
        const updatedGoal = await response.json()
        
        // Update goals in parent component
        if (onGoalsUpdate) {
          onGoalsUpdate(goals.map(goal => 
            goal.id === updatedGoal.id ? updatedGoal : goal
          ))
        }
        
        setEditingGoal(null)
      } else {
        console.error('Failed to update goal')
        alert('Nepodařilo se aktualizovat cíl')
      }
    } catch (error) {
      console.error('Error updating goal:', error)
      alert('Chyba při aktualizaci cíle')
    }
  }

  const handleCreateGoal = async () => {
    if (!newGoal.title.trim()) {
      alert('Název cíle je povinný')
      return
    }

    // Get userId from state
    if (!userId) {
      alert('Chyba: Uživatel není nalezen')
      return
    }

    try {
      const response = await fetch('/api/goals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: userId,
          title: newGoal.title,
          description: newGoal.description,
          areaId: newGoal.areaId,
          targetDate: newGoal.target_date,
          status: newGoal.status
        }),
      })

      if (response.ok) {
        const createdGoal = await response.json()
        
        // Update goals in parent component
        if (onGoalsUpdate) {
          onGoalsUpdate([...goals, createdGoal])
        }
        
        // Reset form
        setNewGoal({
          title: '',
          description: '',
          areaId: null,
          target_date: null,
          status: 'active'
        })
        setShowCreateGoal(false)
      } else {
        console.error('Failed to create goal')
        alert('Nepodařilo se vytvořit cíl')
      }
    } catch (error) {
      console.error('Error creating goal:', error)
      alert('Chyba při vytváření cíle')
    }
  }

  const handleCreateStep = async () => {
    if (!newStep.title.trim()) {
      alert('Název kroku je povinný')
      return
    }

    if (!player?.user_id) {
      alert('Chyba: Uživatel není nalezen')
      return
    }

    try {
      console.log('Creating step:', newStep)
      
      const response = await fetch('/api/daily-steps', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: player.user_id,
          goalId: newStep.goalId || null,
          title: newStep.title,
          description: newStep.description,
          date: newStep.date ? new Date(newStep.date).toISOString() : new Date().toISOString(),
          isImportant: newStep.isImportant,
          isUrgent: newStep.isUrgent,
          stepType: 'custom',
          estimatedTime: newStep.estimatedTime,
          xpReward: newStep.xpReward
        }),
      })

      if (response.ok) {
        const createdStep = await response.json()
        console.log('Step created successfully:', createdStep)
        
        // Reset form
        setNewStep({
          title: '',
          description: '',
          goalId: null,
          isImportant: false,
          isUrgent: false,
          estimatedTime: 30,
          xpReward: 1,
          date: new Date().toISOString().split('T')[0]
        })
        setShowCreateStep(false)
        
        // Reload steps data instead of full page reload
        const currentDate = new Date().toISOString().split('T')[0]
        const stepsResponse = await fetch(`/api/daily-steps?userId=${player.user_id}&date=${currentDate}`)
        if (stepsResponse.ok) {
          const steps = await stepsResponse.json()
          // Update dailySteps in parent component
          if (onDailyStepsUpdate) {
            onDailyStepsUpdate(steps)
          }
        }
      } else {
        console.error('Failed to create step, status:', response.status)
        alert('Nepodařilo se vytvořit krok')
      }
    } catch (error) {
      console.error('Error creating step:', error)
      alert('Chyba při vytváření kroku')
    }
  }

  const initializeEditingStep = (step: any) => {
    setEditingStep({
      id: step.id,
      title: step.title,
      description: step.description || '',
      goalId: step.goal_id || null,
      isImportant: step.is_important || false,
      isUrgent: step.is_urgent || false,
      estimatedTime: step.estimated_time || 30,
      xpReward: step.xp_reward || 1,
      date: step.date ? new Date(step.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
    })
  }

  const handleUpdateStep = async () => {
    if (!editingStep || !editingStep.title.trim()) {
      alert('Název kroku je povinný')
      return
    }

    try {
      console.log('Updating step:', editingStep)
      
      // Format date as YYYY-MM-DD for consistency with API
      let formattedDate = editingStep.date || ''
      if (formattedDate && formattedDate.includes('T')) {
        // If it's already an ISO string, extract date part
        formattedDate = formattedDate.split('T')[0]
      } else if (formattedDate) {
        // If it's already YYYY-MM-DD, use it as is
        formattedDate = formattedDate
      } else {
        // Default to today in YYYY-MM-DD format
        const today = new Date()
        formattedDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
      }
      
      const requestBody = {
        stepId: editingStep.id,
        title: editingStep.title,
        description: editingStep.description || undefined,
        goalId: editingStep.goalId || undefined,
        isImportant: editingStep.isImportant,
        isUrgent: editingStep.isUrgent,
        estimatedTime: editingStep.estimatedTime,
        xpReward: editingStep.xpReward,
        date: formattedDate
      }
      
      console.log('Request body:', requestBody)
      
      const response = await fetch('/api/daily-steps', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })

      if (response.ok) {
        const updatedStep = await response.json()
        console.log('Step updated successfully:', updatedStep)
        
        // Close editing form
        setEditingStep(null)
        
        // Update the step in dailySteps array instead of reloading
        const updatedSteps = dailySteps.map(step => 
          step.id === updatedStep.id ? updatedStep : step
        )
        // Update dailySteps in parent component
        if (onDailyStepsUpdate) {
          onDailyStepsUpdate(updatedSteps)
        }
      } else {
        const errorText = await response.text()
        console.error('Failed to update step, status:', response.status, 'Error:', errorText)
        alert('Nepodařilo se aktualizovat krok')
      }
    } catch (error) {
      console.error('Error updating step:', error)
      alert('Chyba při aktualizaci kroku')
    }
  }

  const handleDeleteStep = async (stepId: string) => {
    if (!confirm('Opravdu chcete smazat tento krok? Tato akce je nevratná.')) {
      return
    }

    try {
      console.log('Deleting step:', stepId)
      
      const response = await fetch(`/api/daily-steps?stepId=${stepId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        console.log('Step deleted successfully')
        
        // Close editing form if it was open for this step
        if (editingStep && editingStep.id === stepId) {
          setEditingStep(null)
        }
        
        // Reload steps data instead of full page reload
        const currentDate = new Date().toISOString().split('T')[0]
        const stepsResponse = await fetch(`/api/daily-steps?userId=${player.user_id}&date=${currentDate}`)
        if (stepsResponse.ok) {
          const steps = await stepsResponse.json()
          // Update dailySteps in parent component
          if (onDailyStepsUpdate) {
            onDailyStepsUpdate(steps)
          }
        }
      } else {
        console.error('Failed to delete step, status:', response.status)
        alert('Nepodařilo se smazat krok')
      }
    } catch (error) {
      console.error('Error deleting step:', error)
      alert('Chyba při mazání kroku')
    }
  }

  const handleStepDragStart = (event: DragStartEvent) => {
    setActiveDragId(event.active.id as string)
  }

  const handleStepDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    
    // Reset active drag ID
    setActiveDragId(null)
    
    if (!over) {
      console.log('handleStepDragEnd: No over target')
      return
    }
    
    const stepId = active.id as string
    let targetColumn = over.id as string
    
    console.log('handleStepDragEnd: stepId =', stepId, 'over.id =', targetColumn)
    
    // Find the step
    const step = dailySteps.find(s => s.id === stepId)
    if (!step) {
      console.log('handleStepDragEnd: Step not found')
      return
    }
    
    // If dropped on a step (not column), find which column that step belongs to
    if (!targetColumn.startsWith('column-')) {
      console.log('handleStepDragEnd: Dropped on step, finding column...')
      const targetStep = dailySteps.find(s => s.id === targetColumn)
      if (targetStep) {
        // Determine which column this step belongs to
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        
        if (targetStep.completed) {
          targetColumn = 'column-completed'
        } else if (!targetStep.date) {
          targetColumn = 'column-no-date'
        } else {
          const stepDate = new Date(targetStep.date)
          stepDate.setHours(0, 0, 0, 0)
          const stepTime = stepDate.getTime()
          const todayTime = today.getTime()
          
          if (stepTime < todayTime) {
            targetColumn = 'column-overdue'
          } else if (stepTime === todayTime) {
            targetColumn = 'column-today'
          } else {
            targetColumn = 'column-future'
          }
        }
      } else {
        console.log('handleStepDragEnd: Target step not found, cannot determine column')
        return
      }
    }
    
    console.log('handleStepDragEnd: Determined target column =', targetColumn)
    
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    // Helper function to format date as YYYY-MM-DD in local timezone
    const formatLocalDate = (date: Date): string => {
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    }
    
    let newDate: string | null = null
    
    if (targetColumn === 'column-overdue') {
      // Set to yesterday to make it overdue
      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)
      newDate = formatLocalDate(yesterday)
    } else if (targetColumn === 'column-today') {
      newDate = formatLocalDate(today)
    } else if (targetColumn === 'column-future') {
      // Set to tomorrow
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)
      newDate = formatLocalDate(tomorrow)
    } else if (targetColumn === 'column-no-date') {
      newDate = null
    } else if (targetColumn === 'column-completed') {
      // Just mark as completed, don't change date
      if (!step.completed) {
        await handleStepToggle(stepId, true)
      }
      return
    } else {
      console.log('handleStepDragEnd: Unknown target column:', targetColumn)
      return
    }
    
    console.log('handleStepDragEnd: Setting newDate =', newDate, 'current step.date =', step.date)
    
    // Don't update if date is the same
    const currentDateStr = step.date ? (typeof step.date === 'string' ? step.date : new Date(step.date).toISOString().split('T')[0]) : null
    if (currentDateStr === newDate) {
      console.log('handleStepDragEnd: Date unchanged, skipping update')
      return
    }
    
    // Update step date
    try {
      console.log('handleStepDragEnd: Sending PUT request with stepId =', stepId, 'date =', newDate)
      const response = await fetch('/api/daily-steps', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          stepId: stepId,
          date: newDate,
        }),
      })

      if (response.ok) {
        const updatedStep = await response.json()
        console.log('handleStepDragEnd: Step updated successfully:', updatedStep)
        console.log('handleStepDragEnd: Updated step date:', updatedStep.date)
        
        // Update the step in dailySteps array
        const updatedSteps = dailySteps.map(s => {
          if (s.id === updatedStep.id) {
            console.log('handleStepDragEnd: Replacing step:', s.id, 'old date:', s.date, 'new date:', updatedStep.date)
            return updatedStep
          }
          return s
        })
        
        console.log('handleStepDragEnd: Calling onDailyStepsUpdate with', updatedSteps.length, 'steps')
        if (onDailyStepsUpdate) {
          onDailyStepsUpdate(updatedSteps)
        } else {
          console.warn('handleStepDragEnd: onDailyStepsUpdate is not defined!')
        }
      } else {
        const errorText = await response.text()
        console.error('Failed to update step date, status:', response.status, 'error:', errorText)
        alert('Nepodařilo se aktualizovat datum kroku')
      }
    } catch (error) {
      console.error('Error updating step date:', error)
      alert('Chyba při aktualizaci data kroku')
    }
  }

  const handleDeleteGoal = async (goalId: string) => {
    console.log('handleDeleteGoal called with goalId:', goalId)
    console.log('editingGoal:', editingGoal)
    
    if (!confirm('Opravdu chcete smazat tento cíl? Tato akce je nevratná.')) {
      return
    }

    try {
      console.log('Sending DELETE request for goalId:', goalId)
      const response = await fetch('/api/goals', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ goalId }),
      })

      console.log('DELETE response status:', response.status)
      
      if (response.ok) {
        console.log('Goal deleted successfully, updating states...')
        
        // Update goals in parent component
        if (onGoalsUpdate) {
          onGoalsUpdate(goals.filter(goal => goal.id !== goalId))
        }
        
        // Update sortedGoals locally
        const newSortedGoals = sortedGoals.filter(goal => goal.id !== goalId)
        setSortedGoals(newSortedGoals)
        
        // Update localStorage
        try {
          const goalOrder = newSortedGoals.map(goal => goal.id)
          localStorage.setItem('goals-order', JSON.stringify(goalOrder))
        } catch (error) {
          console.error('Error updating localStorage after delete:', error)
        }
        
        // Close editing form if it was open for this goal
        if (editingGoal && editingGoal.id === goalId) {
          setEditingGoal(null)
        }
        
        console.log('All states updated successfully')
      } else {
        console.error('Failed to delete goal, status:', response.status)
        alert('Nepodařilo se smazat cíl')
      }
    } catch (error) {
      console.error('Error deleting goal:', error)
      alert('Chyba při mazání cíle')
    }
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
          xpReward: newHabit.customXpReward ? parseInt(newHabit.customXpReward) : newHabit.xpReward
        }),
      })

      if (response.ok) {
        const createdHabit = await response.json()
        
        // Update habits in parent component
        if (onHabitsUpdate) {
          onHabitsUpdate([...habits, createdHabit])
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
          customXpReward: ''
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

  // Filter habits for main page display
  const getTodaysHabits = () => {
    const today = new Date().getDay() // 0 = Sunday, 1 = Monday, etc.
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
    const todayName = dayNames[today]
    
    return habits.filter(habit => {
      // Always show if "always_show" is true
      if (habit.always_show) {
        return true
      }
      
      // Check if habit should be shown today based on frequency
      switch (habit.frequency) {
        case 'daily':
          return true
        case 'weekly':
          // For weekly habits, check if today is in selected days
          if (habit.selected_days && habit.selected_days.length > 0) {
            return habit.selected_days.includes(todayName)
          }
          return false
        case 'monthly':
          // For monthly habits, show on the same day of month as created
          const createdDate = new Date(habit.created_at)
          return new Date().getDate() === createdDate.getDate()
        case 'custom':
          // For custom habits, check if today is in selected days
          if (habit.selected_days && habit.selected_days.length > 0) {
            return habit.selected_days.includes(todayName)
          }
          return false
        default:
          return false
      }
    })
  }

  const todaysHabits = getTodaysHabits()

  // Initialize sorted goals
  // Initialize sorted goals when goals change
  useEffect(() => {
    if (goals.length > 0) {
      // Try to load order from localStorage
      try {
        const savedOrder = localStorage.getItem('goals-order')
        if (savedOrder) {
          const goalIds = JSON.parse(savedOrder)
          // Create ordered goals based on saved order
          const orderedGoals = goalIds
            .map((id: string) => goals.find(goal => goal.id === id))
            .filter(Boolean)
          
          // Add any new goals that weren't in the saved order
          const newGoals = goals.filter(goal => !goalIds.includes(goal.id))
          const finalOrder = [...orderedGoals, ...newGoals]
          
          setSortedGoals(finalOrder)
        } else {
          setSortedGoals(goals)
        }
      } catch (error) {
        console.error('Error loading goals order from localStorage:', error)
        setSortedGoals(goals)
      }
    } else {
      setSortedGoals(goals)
    }
  }, [goals])

  // Load areas
  useEffect(() => {
    const loadAreas = async () => {
      try {
        // Get user ID from userId state
        if (userId) {
          console.log('Loading areas for userId:', userId)
          const response = await fetch(`/api/areas?userId=${userId}`)
          if (response.ok) {
            const areasData = await response.json()
            console.log('Areas loaded:', areasData)
            
            // If no areas exist, create default ones
            if (areasData.length === 0) {
              console.log('No areas found, creating default areas...')
              const initResponse = await fetch('/api/areas/initialize-default', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId })
              })
              
              if (initResponse.ok) {
                const initData = await initResponse.json()
                console.log('Default areas created:', initData)
                setAreas(initData.areas || [])
              } else {
                console.error('Failed to initialize default areas')
                setAreas([])
              }
            } else {
              setAreas(areasData)
            }
          } else {
            console.error('Failed to load areas, status:', response.status)
            const errorText = await response.text()
            console.error('Error response:', errorText)
          }
        } else {
          console.log('userId not available yet, waiting...')
        }
      } catch (error) {
        console.error('Error loading areas:', error)
      }
    }
    loadAreas()
  }, [userId])

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 10, // User must drag at least 10px before drag starts
        delay: 100, // Wait 100ms before allowing drag to start (allows clicks)
        tolerance: 5, // Allow 5px tolerance for mouse movement during delay
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = (event: any) => {
    const { active, over } = event

    if (active.id !== over.id) {
      const newSortedGoals = arrayMove(sortedGoals, 
        sortedGoals.findIndex((item) => item.id === active.id),
        sortedGoals.findIndex((item) => item.id === over.id)
      )
      
      setSortedGoals(newSortedGoals)
      
      // Save order to localStorage
      try {
        const goalOrder = newSortedGoals.map(goal => goal.id)
        localStorage.setItem('goals-order', JSON.stringify(goalOrder))
      } catch (error) {
        console.error('Error saving goals order to localStorage:', error)
      }
    }
  }

  // Separate editing form component to prevent re-renders
  const GoalEditingForm = ({ goal, onUpdate, onCancel, onDelete, areas }: any) => {
    const [formData, setFormData] = useState({
      title: goal.title,
      description: goal.description || '',
      target_date: goal.target_date ? new Date(goal.target_date).toISOString().split('T')[0] : '',
      areaId: goal.areaId || '',
      status: goal.status || 'active'
    })

    const handleSubmit = () => {
      const updates = {
        title: formData.title,
        description: formData.description,
        target_date: formData.target_date ? new Date(formData.target_date).toISOString() : null,
        areaId: formData.areaId || null,
        status: formData.status
      }
      onUpdate(goal.id, updates)
    }

    return (
      <div 
        className="editing-form p-4 bg-gray-50 border-t border-gray-200"
        onMouseDown={(e) => e.stopPropagation()}
        onMouseMove={(e) => e.stopPropagation()}
        onMouseUp={(e) => e.stopPropagation()}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Název cíle</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              placeholder="Zadejte název cíle"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Popis cíle</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              rows={3}
              placeholder="Zadejte popis cíle"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Datum skončení</label>
            <input
              type="date"
              value={formData.target_date}
              onChange={(e) => setFormData({...formData, target_date: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Životní oblast</label>
            <select
              value={formData.areaId}
              onChange={(e) => setFormData({...formData, areaId: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            >
              <option value="">Vyberte oblast</option>
              {areas.map((area: any) => (
                <option key={area.id} value={area.id}>
                  {area.name}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({...formData, status: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            >
              <option value="active">Aktivní</option>
              <option value="completed">Splněný</option>
              <option value="considering">Ke zvážení</option>
            </select>
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={handleSubmit}
              className="p-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
              title="Uložit změny"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </button>
            <button
              onClick={onCancel}
              className="p-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              title="Zrušit"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <button
              onClick={() => onDelete(goal.id)}
              className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              title="Smazat cíl"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    )
  };

  // Get status color function
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100';
      case 'completed': return 'text-blue-600 bg-blue-100';
      case 'considering': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  }

  // Calculate stats
  const completedSteps = dailySteps.filter(step => step.completed).length
  const totalSteps = dailySteps.length
  const progressPercentage = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0
  const completedGoals = goals.filter(goal => goal.steps && goal.steps.every((step: any) => step.completed)).length
  const activeHabits = todaysHabits.filter(habit => habit && habit.completed_today === true).length

  // Get current day and time
  const currentDay = Math.floor(Date.now() / (1000 * 60 * 60 * 24)) % 365 + 1
  const currentHour = new Date().getHours()
  const timeOfDay = currentHour < 6 ? 'night' : currentHour < 12 ? 'morning' : currentHour < 18 ? 'afternoon' : 'evening'

  // Calculate statistics
  const totalXp = useMemo(() => {
    let xp = 0
    // XP from completed daily steps
    dailySteps.forEach(step => {
      if (step.completed && step.xp_reward) {
        xp += step.xp_reward
      }
    })
    // XP from completed habits
    habits.forEach(habit => {
      if (habit.habit_completions) {
        Object.values(habit.habit_completions).forEach(completed => {
          if (completed && habit.xp_reward) {
            xp += habit.xp_reward
          }
        })
      }
    })
    return xp
  }, [dailySteps, habits])

  // Calculate login streak (days in a row with activity)
  const loginStreak = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    let streak = 0
    let checkDate = new Date(today)
    
    while (true) {
      const dateStr = checkDate.toISOString().split('T')[0]
      // Check if there was activity (completed habit or step) on this date
      const hasActivity = habits.some(habit => habit.habit_completions?.[dateStr]) ||
                         dailySteps.some(step => {
                           const stepDate = step.date ? new Date(step.date).toISOString().split('T')[0] : null
                           return stepDate === dateStr && step.completed
                         })
      
      if (hasActivity) {
        streak++
        checkDate.setDate(checkDate.getDate() - 1)
      } else {
        break
      }
    }
    
    return streak
  }, [habits, dailySteps])

  // Total completed habits
  const totalCompletedHabits = useMemo(() => {
    let count = 0
    habits.forEach(habit => {
      if (habit.habit_completions) {
        count += Object.values(habit.habit_completions).filter(completed => completed === true).length
      }
    })
    return count
  }, [habits])

  // Total completed steps
  const totalCompletedSteps = dailySteps.filter(step => step.completed).length

  // Total completed goals
  const totalCompletedGoals = goals.filter(goal => goal.status === 'completed').length

  // Check for pending workflows
  useEffect(() => {
    if (!player?.user_id) return

    const checkPendingWorkflows = async () => {
      try {
        const response = await fetch(`/api/workflows/pending?userId=${player.user_id}`)
        if (response.ok) {
          const pending = await response.json()
          if (pending.length > 0 && !pendingWorkflow && currentProgram !== 'workflow') {
            // Show first pending workflow as program
            setPendingWorkflow(pending[0])
            setCurrentProgram('workflow')
          } else if (pending.length === 0 && currentProgram === 'workflow') {
            // No pending workflows, return to daily-plan
            setPendingWorkflow(null)
            setCurrentProgram('daily-plan')
          }
        }
      } catch (error) {
        console.error('Error checking pending workflows:', error)
      }
    }

    // Check immediately
    checkPendingWorkflows()

    // Check every minute for new workflows
    const interval = setInterval(checkPendingWorkflows, 60000)
    return () => clearInterval(interval)
  }, [player, pendingWorkflow, currentProgram])

  // Handle workflow completion
  const handleWorkflowComplete = async (workflowId: string, xp: number) => {
    try {
      // Add XP to player
      if (player?.id) {
        const response = await fetch('/api/player', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: player.id,
            xp: (player.xp || 0) + xp,
            experience: (player.experience || 0) + xp
          })
        })
        if (response.ok) {
          const updatedPlayer = await response.json()
          // Update player in parent if callback exists
        }
      }

      // Hide workflow and return to daily-plan
      setPendingWorkflow(null)
      setCurrentProgram('daily-plan')
    } catch (error) {
      console.error('Error completing workflow:', error)
    }
  }

  // Handle workflow skip
  const handleWorkflowSkip = async (workflowId: string) => {
    try {
      // Mark as skipped (completed_at = null but don't give XP)
      await fetch(`/api/workflows/${workflowId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed_at: null })
      })

      // Hide workflow and return to daily-plan
      setPendingWorkflow(null)
      setCurrentProgram('daily-plan')
    } catch (error) {
      console.error('Error skipping workflow:', error)
    }
  }

  // Handle goal progress update from workflow
  const handleGoalProgressUpdate = async (goalId: string, progress: number) => {
    try {
      const response = await fetch('/api/goals', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          goalId,
          progressPercentage: progress
        })
      })
      if (response.ok) {
        const updatedGoal = await response.json()
        // Update goals list
        if (onGoalsUpdate) {
          const updatedGoals = goals.map(g => 
            g.id === goalId ? updatedGoal : g
          )
          onGoalsUpdate(updatedGoals)
        }
      }
    } catch (error) {
      console.error('Error updating goal progress:', error)
    }
  }

  // Draggable Step Component
  function DraggableStep({ step, isEditing, initializeEditingStep, handleStepToggle, goals, editingStep, setEditingStep, handleUpdateStep, dailySteps, onDailyStepsUpdate }: any) {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      isDragging,
    } = useDraggable({
      id: step.id,
    })

    const [showDateMenu, setShowDateMenu] = useState(false)
    const [showXpMenu, setShowXpMenu] = useState(false)

    const style = {
      transform: CSS.Translate.toString(transform),
      opacity: isDragging ? 0 : 1, // Hide original element completely when dragging
    }

    return (
      <div
        ref={setNodeRef}
        style={style}
        className="p-3 rounded-lg border-2 bg-white hover:shadow-md transition-all relative"
      >
        <div className="flex items-start gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation()
              handleStepToggle(step.id, !step.completed)
            }}
            onPointerDown={(e) => {
              e.stopPropagation() // Prevent drag when clicking checkbox
            }}
            className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
              step.completed 
                ? 'bg-green-500 border-green-500 text-white' 
                : 'border-gray-300 hover:border-green-400'
            }`}
          >
            {step.completed && '✓'}
          </button>
          <div 
            className="flex-1 min-w-0 cursor-pointer"
            onClick={() => isEditing ? setEditingStep(null) : initializeEditingStep(step)}
          >
            <div className={`font-medium text-sm ${step.completed ? 'line-through text-gray-400' : 'text-gray-800'}`}>
              {step.title}
            </div>
            {step.description && (
              <div className="text-xs text-gray-500 mt-1 line-clamp-1">
                {step.description}
              </div>
            )}
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              {step.goal_id && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    initializeEditingStep(step)
                  }}
                  className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded hover:bg-gray-200 transition-colors cursor-pointer"
                  title="Kliknutím otevřete úpravu"
                >
                  {goals.find((g: any) => g.id === step.goal_id)?.title || 'Cíl'}
                </button>
              )}
              {step.xp_reward > 0 && (
                <div className="relative">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setShowXpMenu(!showXpMenu)
                    }}
                    className="text-xs text-purple-600 bg-purple-100 px-2 py-0.5 rounded font-medium hover:bg-purple-200 transition-colors cursor-pointer"
                    title="Kliknutím upravíte XP"
                  >
                    ⭐ {step.xp_reward} XP
                  </button>
                  {/* XP Menu Popup */}
                  {showXpMenu && (
                    <>
                      <div 
                        className="fixed inset-0 z-10" 
                        onClick={() => setShowXpMenu(false)}
                      />
                      <div className="absolute left-0 top-full mt-1 z-30 bg-white rounded-lg shadow-lg border border-gray-200 p-3 min-w-[200px]">
                        <label className="block text-xs font-medium text-gray-700 mb-1">XP Odměna</label>
                        <div className="flex gap-2 mb-2">
                          {[1, 2, 3, 4, 5].map(xp => (
                            <button
                              key={xp}
                              onClick={async (e) => {
                                e.stopPropagation()
                                try {
                                  const response = await fetch('/api/daily-steps', {
                                    method: 'PUT',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                      stepId: step.id,
                                      title: step.title,
                                      description: step.description,
                                      goalId: step.goal_id,
                                      isImportant: step.is_important,
                                      isUrgent: step.is_urgent,
                                      estimatedTime: step.estimated_time,
                                      xpReward: xp,
                                      date: step.date
                                    })
                                  })
                                  if (response.ok) {
                                    const updatedStep = await response.json()
                                    setShowXpMenu(false)
                                    // Refresh steps
                                    if (onDailyStepsUpdate) {
                                      const allSteps = dailySteps.map((s: any) => s.id === step.id ? updatedStep : s)
                                      onDailyStepsUpdate(allSteps)
                                    }
                                  }
                                } catch (error) {
                                  console.error('Error updating XP:', error)
                                }
                              }}
                              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                                step.xp_reward === xp 
                                  ? 'bg-purple-500 text-white' 
                                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                              }`}
                            >
                              {xp}
                            </button>
                          ))}
                        </div>
                        <input
                          type="number"
                          min="1"
                          placeholder="Vlastní XP"
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 mb-2"
                          onClick={(e) => e.stopPropagation()}
                          onKeyDown={async (e) => {
                            if (e.key === 'Enter') {
                              const xpValue = parseInt((e.target as HTMLInputElement).value)
                              if (xpValue && xpValue > 0) {
                                try {
                                  const response = await fetch('/api/daily-steps', {
                                    method: 'PUT',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                      stepId: step.id,
                                      title: step.title,
                                      description: step.description,
                                      goalId: step.goal_id,
                                      isImportant: step.is_important,
                                      isUrgent: step.is_urgent,
                                      estimatedTime: step.estimated_time,
                                      xpReward: xpValue,
                                      date: step.date
                                    })
                                  })
                                  if (response.ok) {
                                    const updatedStep = await response.json()
                                    setShowXpMenu(false)
                                    // Refresh steps
                                    if (onDailyStepsUpdate) {
                                      const allSteps = dailySteps.map((s: any) => s.id === step.id ? updatedStep : s)
                                      onDailyStepsUpdate(allSteps)
                                    }
                                  }
                                } catch (error) {
                                  console.error('Error updating XP:', error)
                                }
                              }
                            }
                          }}
                        />
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setShowXpMenu(false)
                          }}
                          className="w-full px-3 py-1 bg-gray-500 text-white text-xs rounded hover:bg-gray-600"
                        >
                          Zavřít
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
              {step.date && (
                <div className="relative">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setShowDateMenu(!showDateMenu)
                    }}
                    className="text-xs text-gray-600 bg-gray-100 px-2 py-0.5 rounded hover:bg-gray-200 transition-colors cursor-pointer"
                    title="Kliknutím upravíte datum"
                  >
                    📅 {new Date(step.date).toLocaleDateString('cs-CZ')}
                  </button>
                  {/* Date Menu Popup */}
                  {showDateMenu && (
                    <>
                      <div 
                        className="fixed inset-0 z-10" 
                        onClick={() => setShowDateMenu(false)}
                      />
                      <div className="absolute left-0 top-full mt-1 z-30 bg-white rounded-lg shadow-lg border border-gray-200 p-3 min-w-[200px]">
                        <label className="block text-xs font-medium text-gray-700 mb-1">Datum</label>
                        <input
                          type="date"
                          value={step.date ? new Date(step.date).toISOString().split('T')[0] : ''}
                          onChange={async (e) => {
                            const newDate = e.target.value
                            try {
                              const response = await fetch('/api/daily-steps', {
                                method: 'PUT',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                  stepId: step.id,
                                  date: newDate
                                })
                              })
                              if (response.ok) {
                                const updatedStep = await response.json()
                                setShowDateMenu(false)
                                // Refresh steps
                                if (onDailyStepsUpdate) {
                                  const allSteps = dailySteps.map((s: any) => s.id === step.id ? updatedStep : s)
                                  onDailyStepsUpdate(allSteps)
                                }
                              }
                            } catch (error) {
                              console.error('Error updating date:', error)
                            }
                          }}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-orange-500"
                          onClick={(e) => e.stopPropagation()}
                        />
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setShowDateMenu(false)
                          }}
                          className="mt-2 w-full px-3 py-1 bg-gray-500 text-white text-xs rounded hover:bg-gray-600"
                        >
                          Zavřít
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
          
          {/* Drag handle - only this area activates drag */}
          <div
            {...listeners}
            {...attributes}
            className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600"
            onClick={(e) => e.stopPropagation()}
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M7 2a2 2 0 1 1 0 4 2 2 0 0 1 0-4zM7 8a2 2 0 1 1 0 4 2 2 0 0 1 0-4zM7 14a2 2 0 1 1 0 4 2 2 0 0 1 0-4zM13 2a2 2 0 1 1 0 4 2 2 0 0 1 0-4zM13 8a2 2 0 1 1 0 4 2 2 0 0 1 0-4zM13 14a2 2 0 1 1 0 4 2 2 0 0 1 0-4z" />
            </svg>
          </div>
        </div>
        {isEditing && (
          <div className="mt-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
            <div className="space-y-2">
              <input
                type="text"
                value={editingStep.title || ''}
                onChange={(e) => setEditingStep({...editingStep, title: e.target.value})}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-orange-500"
                placeholder="Název"
              />
              <textarea
                value={editingStep.description || ''}
                onChange={(e) => setEditingStep({...editingStep, description: e.target.value})}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 resize-none"
                placeholder="Popis (volitelné)"
                rows={2}
              />
              <select
                value={editingStep.goalId || ''}
                onChange={(e) => setEditingStep({...editingStep, goalId: e.target.value || null})}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-orange-500"
              >
                <option value="">Vyberte cíl (volitelné)</option>
                {goals.filter((goal: any) => goal.status === 'active').map((goal: any) => (
                  <option key={goal.id} value={goal.id}>
                    {goal.title}
                  </option>
                ))}
              </select>
              <div className="flex items-center gap-2">
                <label className="text-xs text-gray-600 whitespace-nowrap">⭐ XP:</label>
                <input
                  type="number"
                  min="1"
                  value={editingStep.xpReward || 1}
                  onChange={(e) => setEditingStep({...editingStep, xpReward: parseInt(e.target.value) || 1})}
                  className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <input
                type="date"
                value={editingStep.date || ''}
                onChange={(e) => setEditingStep({...editingStep, date: e.target.value})}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-orange-500"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleUpdateStep}
                  className="px-3 py-1 bg-orange-500 text-white text-xs rounded hover:bg-orange-600"
                >
                  Uložit
                </button>
                <button
                  onClick={() => setEditingStep(null)}
                  className="px-3 py-1 bg-gray-500 text-white text-xs rounded hover:bg-gray-600"
                >
                  Zrušit
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  // Droppable Column Component
  function DroppableColumn({ id, children, className, style }: { id: string, children: React.ReactNode, className?: string, style?: React.CSSProperties }) {
    const { setNodeRef, isOver } = useDroppable({
      id: id,
    })

    return (
      <div
        ref={setNodeRef}
        className={`${className} ${isOver ? 'ring-4 ring-orange-400 ring-opacity-50' : ''}`}
        style={style}
      >
        {children}
      </div>
    )
  }

  const renderPageContent = () => {
    switch (currentPage) {
      case 'goals':
        return (
          <div className="bg-white bg-opacity-95 rounded-2xl p-8 border border-orange-200 shadow-xl backdrop-blur-sm" style={{
            boxShadow: '0 12px 24px rgba(251, 146, 60, 0.15), 0 4px 8px rgba(0, 0, 0, 0.05)'
          }}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-orange-800" style={{ letterSpacing: '1px' }}>CÍLE</h2>
              <button
                onClick={() => setShowCreateGoal(true)}
                className="p-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                title="Přidat cíl"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </button>
            </div>
            
            {/* Create Goal Form */}
            {showCreateGoal && (
              <div className="bg-gray-50 rounded-xl p-6 border border-gray-200 mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Vytvořit nový cíl</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Název cíle *</label>
                    <input
                      type="text"
                      value={newGoal.title}
                      onChange={(e) => setNewGoal({...newGoal, title: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      placeholder="Zadejte název cíle"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Popis cíle</label>
                    <textarea
                      value={newGoal.description || ''}
                      onChange={(e) => setNewGoal({...newGoal, description: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      rows={3}
                      placeholder="Zadejte popis cíle"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Datum skončení</label>
                    <input
                      type="date"
                      value={newGoal.target_date ? new Date(newGoal.target_date).toISOString().split('T')[0] : ''}
                      onChange={(e) => setNewGoal({...newGoal, target_date: e.target.value ? new Date(e.target.value).toISOString() : null as any})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Životní oblast</label>
                    <select
                      value={newGoal.areaId || ''}
                      onChange={(e) => setNewGoal({...newGoal, areaId: e.target.value || null as any})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    >
                      <option value="">Vyberte oblast (volitelné)</option>
                      {areas.length > 0 ? (
                        areas.map((area: any) => (
                          <option key={area.id} value={area.id}>
                            {area.name}
                          </option>
                        ))
                      ) : (
                        <option value="" disabled>Žádné oblasti k dispozici</option>
                      )}
                    </select>
                    {areas.length === 0 && userId && (
                      <p className="text-xs text-gray-500 mt-1">
                        Pro vytvoření oblastí použijte nastavení nebo API
                      </p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                    <select
                      value={newGoal.status}
                      onChange={(e) => setNewGoal({...newGoal, status: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    >
                      <option value="active">Aktivní</option>
                      <option value="completed">Splněný</option>
                      <option value="considering">Ke zvážení</option>
                    </select>
                  </div>
                  
                  <div className="flex gap-3">
                    <button
                      onClick={handleCreateGoal}
                      className="p-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                      title="Vytvořit cíl"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    </button>
                    <button
                      onClick={() => {
                        setShowCreateGoal(false)
                        setNewGoal({
                          title: '',
                          description: '',
                          areaId: null,
                          target_date: null,
                          status: 'active'
                        })
                      }}
                      className="p-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                      title="Zrušit"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={sortedGoals.map(goal => goal.id)}
                strategy={rectSortingStrategy}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {sortedGoals.map((goal, index) => {
                    const isEditing = editingGoal && editingGoal.id === goal.id;
                    return (
                      <SortableGoal
                        key={goal.id}
                        goal={goal}
                        index={index}
                        isEditing={isEditing}
                        editingGoal={editingGoal}
                        setEditingGoal={setEditingGoal}
                        handleUpdateGoal={handleUpdateGoal}
                        getStatusColor={getStatusColor}
                        areas={areas}
                        initializeEditingGoal={initializeEditingGoal}
                      />
                    );
                  })}
                  {sortedGoals.length === 0 && (
                    <div className="col-span-full text-center text-gray-500 py-8">
                      <p className="text-lg">Žádné cíle nejsou nastavené</p>
                      <p className="text-sm">Klikněte na tlačítko níže pro přidání nového cíle</p>
                    </div>
                  )}
                </div>
              </SortableContext>
            </DndContext>
          </div>
        );

      case 'habits':
        return (
          <div className="bg-white bg-opacity-95 rounded-2xl p-8 border border-orange-200 shadow-xl backdrop-blur-sm" style={{
            boxShadow: '0 12px 24px rgba(251, 146, 60, 0.15), 0 4px 8px rgba(0, 0, 0, 0.05)'
          }}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-orange-800" style={{ letterSpacing: '1px' }}>NÁVYKY</h2>
              <button
                onClick={() => setShowAddHabitForm(!showAddHabitForm)}
                className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors text-sm font-medium"
              >
                {showAddHabitForm ? 'Zrušit' : '+ Přidat návyk'}
              </button>
            </div>

            {/* Add Habit Form */}
            {showAddHabitForm && (
              <div className="mb-6 p-6 bg-gray-50 rounded-xl border border-gray-200">
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
                      Zrušit
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Habits List */}
            <div className="space-y-4">
              {habits.map((habit, index) => {
                // Calculate isCompletedToday using local date and habit_completions
              const now = new Date()
              const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
              const isCompletedToday = habit && habit.habit_completions && habit.habit_completions[today] === true;
                const isEditing = editingHabit && editingHabit.id === habit.id;
                return (
                  <div key={habit.id} className={`rounded-xl border transition-all duration-300 ${
                    isCompletedToday 
                      ? 'bg-orange-100 border-orange-300 shadow-md' 
                      : 'bg-gray-50 border-gray-200 hover:shadow-md'
                  }`} style={{
                    boxShadow: isCompletedToday ? '0 4px 12px rgba(251, 146, 60, 0.2)' : '0 2px 4px rgba(0, 0, 0, 0.05)'
                  }}>
                    {/* Habit Display */}
                    <div className={`p-4 cursor-pointer ${isEditing ? 'border-b border-gray-200' : ''}`} onClick={() => initializeEditingHabit(habit)}>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleHabitToggle(habit.id)
                          }}
                          className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all duration-300 ${
                            isCompletedToday
                              ? 'bg-orange-500 border-orange-500 text-white shadow-md'
                              : 'border-gray-300 hover:border-orange-400 hover:shadow-sm'
                          }`}
                          style={{
                            boxShadow: isCompletedToday ? '0 2px 8px rgba(251, 146, 60, 0.3)' : '0 1px 2px rgba(0, 0, 0, 0.1)'
                          }}
                          title={isCompletedToday ? 'Označit jako nesplněný' : 'Označit jako splněný'}
                        >
                          {isCompletedToday && '✓'}
                        </button>
                        <div className="flex-1">
                          <h3 className={`font-semibold ${isCompletedToday ? 'line-through text-orange-600' : 'text-gray-700'}`}>
                            {habit.name}
                          </h3>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-orange-600 font-bold text-sm">🔥 {(() => {
                              // Calculate current streak dynamically from habit_completions
                              const habitCompletions = habit.habit_completions || {}
                              const completionDates = Object.keys(habitCompletions).sort()
                              
                              // Debug log for left sidebar
                              if (habit.name === 'Studená sprcha') {
                                console.log('Debug - Left sidebar habit_completions:', habitCompletions)
                                console.log('Debug - Left sidebar completionDates:', completionDates)
                                console.log('Debug - Left sidebar habit object:', habit)
                              }
                              
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
                            <span className="text-gray-500 text-xs">• {
                              habit.frequency === 'custom' ? 'Vlastní' :
                              habit.frequency === 'daily' ? 'Denně' :
                              habit.frequency === 'weekly' ? 'Týdně' :
                              habit.frequency === 'monthly' ? 'Měsíčně' : 'Denně'
                            }</span>
                            {habit.reminder_time && (
                              <span className="text-gray-500 text-xs">• {habit.reminder_time}</span>
                            )}
                            {habit.always_show && (
                              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">Vždy</span>
                            )}
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">+{habit.xp_reward || 1} XP</span>
                            {habit.selected_days && habit.selected_days.length > 0 && (
                              <div className="flex gap-1">
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
                                    <span key={day} className="text-xs bg-orange-100 text-orange-700 px-1 rounded">
                                      {dayLabels[day]}
                                    </span>
                                  )
                                })}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Edit Form - Expanded */}
        {isEditing && (
          <div className="editing-form p-4 bg-gray-50 border-t border-gray-200">
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
                              Uložit změny
                            </button>
                            <button
                              onClick={() => setEditingHabit(null)}
                              className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors font-medium"
                            >
                              Zrušit
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
                    )}
                  </div>
                );
              })}
              {habits.length === 0 && (
                <div className="text-center text-gray-500 py-8">
                  <p className="text-lg">Žádné návyky nejsou nastavené</p>
                  <p className="text-sm">Klikněte na tlačítko "Přidat návyk" pro vytvoření nového návyku</p>
                </div>
              )}
            </div>

          </div>
        );

      case 'steps':
        // Filter and categorize steps
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        
        const filteredSteps = dailySteps.filter(step => {
          // Filter by completed status
          if (!stepsShowCompleted && step.completed) {
            return false
          }
          
          // Filter by date
          if (stepsDateFilter !== 'all') {
            if (!step.date) {
              return false // Steps without date don't match any date filter
            }
            const stepDate = new Date(step.date)
            stepDate.setHours(0, 0, 0, 0)
            const stepTime = stepDate.getTime()
            const todayTime = today.getTime()
            
            if (stepsDateFilter === 'overdue' && stepTime >= todayTime) {
              return false
            }
            if (stepsDateFilter === 'today' && stepTime !== todayTime) {
              return false
            }
            if (stepsDateFilter === 'future' && stepTime <= todayTime) {
              return false
            }
          }
          
          // Filter by goal
          if (stepsGoalFilter && step.goal_id !== stepsGoalFilter) {
            return false
          }
          
          return true
        })
        
        // Categorize steps into columns
        const overdueSteps = filteredSteps.filter(step => {
          if (!step.date || step.completed) return false
          const stepDate = new Date(step.date)
          stepDate.setHours(0, 0, 0, 0)
          return stepDate < today
        })
        
        const todaySteps = filteredSteps.filter(step => {
          if (!step.date || step.completed) return false
          const stepDate = new Date(step.date)
          stepDate.setHours(0, 0, 0, 0)
          return stepDate.getTime() === today.getTime()
        })
        
        const futureSteps = filteredSteps.filter(step => {
          if (!step.date || step.completed) return false
          const stepDate = new Date(step.date)
          stepDate.setHours(0, 0, 0, 0)
          return stepDate > today
        })
        
        const noDateSteps = filteredSteps.filter(step => !step.date && !step.completed)
        
        const completedSteps = filteredSteps.filter(step => step.completed)
        
        return (
          <div className="bg-white bg-opacity-95 rounded-2xl p-8 border border-orange-200 shadow-xl backdrop-blur-sm" style={{
            boxShadow: '0 12px 24px rgba(251, 146, 60, 0.15), 0 4px 8px rgba(0, 0, 0, 0.05)'
          }}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-orange-800" style={{ letterSpacing: '1px' }}>KROKY</h2>
              <button
                onClick={() => setShowCreateStep(!showCreateStep)}
                className="p-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                title="Přidat krok"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>
            
            {/* Filters */}
            <div className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Date Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Filtr podle data</label>
                  <select
                    value={stepsDateFilter}
                    onChange={(e) => setStepsDateFilter(e.target.value as 'all' | 'overdue' | 'today' | 'future')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  >
                    <option value="all">Všechny</option>
                    <option value="overdue">Zpožděné</option>
                    <option value="today">Dnešní</option>
                    <option value="future">Budoucí</option>
                  </select>
                </div>
                
                {/* Goal Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Filtr podle cíle</label>
                  <select
                    value={stepsGoalFilter || ''}
                    onChange={(e) => setStepsGoalFilter(e.target.value || null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  >
                    <option value="">Všechny cíle</option>
                    {goals.filter(goal => goal.status === 'active').map((goal: any) => (
                      <option key={goal.id} value={goal.id}>
                        {goal.title}
                      </option>
                    ))}
                  </select>
                </div>
                
                {/* Completed Filter */}
                <div className="flex items-center">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={stepsShowCompleted}
                      onChange={(e) => setStepsShowCompleted(e.target.checked)}
                      className="mr-2 w-4 h-4 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Zobrazit dokončené</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Create Step Form */}
            {showCreateStep && (
              <div className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Vytvořit nový krok</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Název kroku</label>
                    <input
                      type="text"
                      value={newStep.title}
                      onChange={(e) => setNewStep({...newStep, title: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      placeholder="Zadejte název kroku"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Popis kroku</label>
                    <textarea
                      value={newStep.description}
                      onChange={(e) => setNewStep({...newStep, description: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      rows={3}
                      placeholder="Zadejte popis kroku"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Cíl (volitelné)</label>
                    <select
                      value={newStep.goalId || ''}
                      onChange={(e) => setNewStep({...newStep, goalId: e.target.value || null as any})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    >
                      <option value="">Vyberte cíl</option>
                      {goals.filter(goal => goal.status === 'active').map((goal: any) => (
                        <option key={goal.id} value={goal.id}>
                          {goal.title}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Datum (volitelné)</label>
                    <input
                      type="date"
                      value={newStep.date}
                      onChange={(e) => setNewStep({...newStep, date: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Odhadovaný čas (minuty)</label>
                      <input
                        type="number"
                        value={newStep.estimatedTime}
                        onChange={(e) => setNewStep({...newStep, estimatedTime: parseInt(e.target.value) || 30})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        min="1"
                        max="480"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">XP odměna</label>
                      <div className="flex gap-2 mb-2">
                        {[1, 2, 3, 4, 5].map(xp => (
                          <button
                            key={xp}
                            type="button"
                            onClick={() => setNewStep({...newStep, xpReward: xp})}
                            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                              newStep.xpReward === xp 
                                ? 'bg-orange-500 text-white' 
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                          >
                            {xp}
                          </button>
                        ))}
                      </div>
                      <input
                        type="number"
                        value={newStep.xpReward > 5 ? newStep.xpReward : ''}
                        onChange={(e) => {
                          const value = parseInt(e.target.value) || 1
                          if (value > 5) {
                            setNewStep({...newStep, xpReward: value})
                          }
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        placeholder="Vlastní XP (6+)"
                        min="6"
                      />
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={newStep.isImportant}
                        onChange={(e) => setNewStep({...newStep, isImportant: e.target.checked})}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">Důležitý</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={newStep.isUrgent}
                        onChange={(e) => setNewStep({...newStep, isUrgent: e.target.checked})}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">Naléhavý</span>
                    </label>
                  </div>
                  
                  <div className="flex gap-3">
                    <button
                      onClick={handleCreateStep}
                      className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                    >
                      Vytvořit krok
                    </button>
                    <button
                      onClick={() => setShowCreateStep(false)}
                      className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                    >
                      Zrušit
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Kanban Board with Columns */}
            <DndContext 
              sensors={sensors} 
              collisionDetection={closestCenter} 
              onDragStart={handleStepDragStart}
              onDragEnd={handleStepDragEnd}
            >
              <div className={`grid grid-cols-1 gap-4 mb-6 ${stepsShowCompleted ? 'md:grid-cols-4' : 'md:grid-cols-3'}`} style={{ height: 'calc(100vh - 300px)' }}>
                {/* Overdue Column */}
                <DroppableColumn id="column-overdue" className="bg-red-50 rounded-xl p-4 border-2 border-red-200 flex flex-col" style={{ minHeight: '400px', maxHeight: 'calc(100vh - 200px)', height: '100%' }}>
                <div className="flex items-center justify-between mb-4 flex-shrink-0">
                  <h3 className="font-bold text-red-800 flex items-center gap-2">
                    ⚠️ Zpožděné
                    <span className="text-sm text-red-600 bg-red-100 px-2 py-0.5 rounded-full">
                      {overdueSteps.length}
                    </span>
                  </h3>
                </div>
                <div className="space-y-2 flex-1 overflow-y-auto" style={{ minHeight: 0 }}>
                  {overdueSteps.map((step) => {
                    const isEditing = editingStep && editingStep.id === step.id
                    return (
                      <DraggableStep
                        key={step.id}
                        step={step}
                        isEditing={isEditing}
                        initializeEditingStep={initializeEditingStep}
                        handleStepToggle={handleStepToggle}
                        goals={goals}
                        editingStep={editingStep}
                        setEditingStep={setEditingStep}
                        handleUpdateStep={handleUpdateStep}
                        dailySteps={dailySteps}
                        onDailyStepsUpdate={onDailyStepsUpdate}
                      />
                    )
                  })}
                  {overdueSteps.length === 0 && (
                    <div className="text-center text-gray-400 text-sm py-8">Žádné zpožděné kroky</div>
                  )}
                </div>
                </DroppableColumn>

              {/* Today Column */}
              <DroppableColumn id="column-today" className="bg-orange-50 rounded-xl p-4 border-2 border-orange-200 flex flex-col" style={{ minHeight: '400px', maxHeight: 'calc(100vh - 200px)', height: '100%' }}>
                <div className="flex items-center justify-between mb-4 flex-shrink-0">
                  <h3 className="font-bold text-orange-800 flex items-center gap-2">
                    📅 Dnešní
                    <span className="text-sm text-orange-600 bg-orange-100 px-2 py-0.5 rounded-full">
                      {todaySteps.length}
                    </span>
                  </h3>
                </div>
                <div className="space-y-2 flex-1 overflow-y-auto" style={{ minHeight: 0 }}>
                  {todaySteps.map((step) => {
                    const isEditing = editingStep && editingStep.id === step.id
                    return (
                      <DraggableStep
                        key={step.id}
                        step={step}
                        isEditing={isEditing}
                        initializeEditingStep={initializeEditingStep}
                        handleStepToggle={handleStepToggle}
                        goals={goals}
                        editingStep={editingStep}
                        setEditingStep={setEditingStep}
                        handleUpdateStep={handleUpdateStep}
                        dailySteps={dailySteps}
                        onDailyStepsUpdate={onDailyStepsUpdate}
                      />
                    )
                  })}
                  {todaySteps.length === 0 && (
                    <div className="text-center text-gray-400 text-sm py-8">Žádné dnešní kroky</div>
                  )}
                </div>
                </DroppableColumn>

              {/* Future Column */}
              <DroppableColumn id="column-future" className="bg-blue-50 rounded-xl p-4 border-2 border-blue-200 flex flex-col" style={{ minHeight: '400px', maxHeight: 'calc(100vh - 200px)', height: '100%' }}>
                <div className="flex items-center justify-between mb-4 flex-shrink-0">
                  <h3 className="font-bold text-blue-800 flex items-center gap-2">
                    🔮 Budoucí
                    <span className="text-sm text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">
                      {futureSteps.length}
                    </span>
                  </h3>
                </div>
                <div className="space-y-2 flex-1 overflow-y-auto" style={{ minHeight: 0 }}>
                  {futureSteps.map((step) => {
                    const isEditing = editingStep && editingStep.id === step.id
                    return (
                      <DraggableStep
                        key={step.id}
                        step={step}
                        isEditing={isEditing}
                        initializeEditingStep={initializeEditingStep}
                        handleStepToggle={handleStepToggle}
                        goals={goals}
                        editingStep={editingStep}
                        setEditingStep={setEditingStep}
                        handleUpdateStep={handleUpdateStep}
                        dailySteps={dailySteps}
                        onDailyStepsUpdate={onDailyStepsUpdate}
                      />
                    )
                  })}
                  {noDateSteps.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-blue-300">
                      <DroppableColumn id="column-no-date" className="">
                        <div className="text-xs font-semibold text-blue-700 mb-2">Bez data ({noDateSteps.length})</div>
                        {noDateSteps.map((step) => {
                          const isEditing = editingStep && editingStep.id === step.id
                          return (
                            <DraggableStep
                              key={step.id}
                              step={step}
                              isEditing={isEditing}
                              initializeEditingStep={initializeEditingStep}
                              handleStepToggle={handleStepToggle}
                              goals={goals}
                              editingStep={editingStep}
                              setEditingStep={setEditingStep}
                              handleUpdateStep={handleUpdateStep}
                            />
                          )
                        })}
                      </DroppableColumn>
                    </div>
                  )}
                  {futureSteps.length === 0 && noDateSteps.length === 0 && (
                    <div className="text-center text-gray-400 text-sm py-8">Žádné budoucí kroky</div>
                  )}
                </div>
                </DroppableColumn>

              {/* Completed Column (shown only if filter enabled) */}
              {stepsShowCompleted && (
                <DroppableColumn id="column-completed" className="bg-green-50 rounded-xl p-4 border-2 border-green-200 flex flex-col" style={{ minHeight: '400px', maxHeight: 'calc(100vh - 200px)', height: '100%' }}>
                  <div className="flex items-center justify-between mb-4 flex-shrink-0">
                    <h3 className="font-bold text-green-800 flex items-center gap-2">
                      ✓ Dokončené
                      <span className="text-sm text-green-600 bg-green-100 px-2 py-0.5 rounded-full">
                        {completedSteps.length}
                      </span>
                    </h3>
                  </div>
                  <div className="space-y-2 flex-1 overflow-y-auto" style={{ minHeight: 0 }}>
                    {completedSteps.map((step) => {
                      const isEditing = editingStep && editingStep.id === step.id
                      return (
                        <DraggableStep
                          key={step.id}
                          step={step}
                          isEditing={isEditing}
                          initializeEditingStep={initializeEditingStep}
                          handleStepToggle={handleStepToggle}
                          goals={goals}
                          editingStep={editingStep}
                          setEditingStep={setEditingStep}
                          handleUpdateStep={handleUpdateStep}
                        />
                      )
                    })}
                    {completedSteps.length === 0 && (
                      <div className="text-center text-gray-400 text-sm py-8">Žádné dokončené kroky</div>
                    )}
                  </div>
                </DroppableColumn>
              )}
              </div>
              
              {/* Drag Overlay - shows the dragged step */}
              <DragOverlay adjustScale={false} dropAnimation={null}>
                {activeDragId ? (() => {
                  const draggedStep = dailySteps.find((s: any) => s.id === activeDragId)
                  if (!draggedStep) return null
                  
                  return (
                    <div 
                      className="p-3 rounded-lg border-2 bg-white cursor-move shadow-2xl opacity-95"
                      style={{
                        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
                        transform: 'rotate(2deg) translate(-50%, -50%)',
                        pointerEvents: 'none'
                      }}
                    >
                      <div className="flex items-start gap-2">
                        <button
                          className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                            draggedStep.completed 
                              ? 'bg-green-500 border-green-500 text-white' 
                              : 'border-gray-300'
                          }`}
                          disabled
                        >
                          {draggedStep.completed && '✓'}
                        </button>
                        <div className="flex-1 min-w-0">
                          <div className={`font-medium text-sm ${draggedStep.completed ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                            {draggedStep.title}
                          </div>
                          {draggedStep.goal_id && (
                            <div className="text-xs text-gray-500 mt-1">
                              {goals.find((g: any) => g.id === draggedStep.goal_id)?.title || 'Cíl'}
                            </div>
                          )}
                          {draggedStep.date && (
                            <div className="text-xs text-gray-600 mt-1">
                              {new Date(draggedStep.date).toLocaleDateString('cs-CZ')}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })() : null}
              </DragOverlay>
            </DndContext>
            
            {filteredSteps.length === 0 && (
              <div className="text-center text-gray-500 py-8">
                <p className="text-lg">Žádné kroky neodpovídají filtru</p>
                <p className="text-sm">Změňte nastavení filtru nebo přidejte nové kroky</p>
              </div>
            )}
          </div>
        );

      case 'daily-plan':
        return (
          <div className="bg-white bg-opacity-95 rounded-2xl p-8 border border-orange-200 shadow-xl backdrop-blur-sm" style={{
            boxShadow: '0 12px 24px rgba(251, 146, 60, 0.15), 0 4px 8px rgba(0, 0, 0, 0.05)'
          }}>
            <h2 className="text-2xl font-bold text-orange-800 mb-6" style={{ letterSpacing: '1px' }}>DENNÍ PLÁN</h2>
            <div className="text-center text-gray-500 py-8">
              <p className="text-lg">Denní plánování</p>
              <p className="text-sm">Funkce bude brzy dostupná</p>
            </div>
          </div>
        );

      case 'statistics':
        return (
          <div className="bg-white bg-opacity-95 rounded-2xl p-8 border border-orange-200 shadow-xl backdrop-blur-sm" style={{
            boxShadow: '0 12px 24px rgba(251, 146, 60, 0.15), 0 4px 8px rgba(0, 0, 0, 0.05)'
          }}>
            <h2 className="text-2xl font-bold text-orange-800 mb-6" style={{ letterSpacing: '1px' }}>STATISTIKY</h2>
            <div className="grid grid-cols-2 gap-6">
              <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Pokrok</h3>
                <p className="text-3xl font-bold text-orange-600">{Math.round(progressPercentage)}%</p>
              </div>
              <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Cíle</h3>
                <p className="text-3xl font-bold text-orange-600">{completedGoals}/{goals.length}</p>
              </div>
              <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Návyky</h3>
                <p className="text-3xl font-bold text-orange-600">{activeHabits}</p>
              </div>
              <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Energie</h3>
                <p className="text-3xl font-bold text-orange-600">{player?.energy || 100}%</p>
              </div>
            </div>
          </div>
        );

      case 'achievements':
        return (
          <div className="bg-white bg-opacity-95 rounded-2xl p-8 border border-orange-200 shadow-xl backdrop-blur-sm" style={{
            boxShadow: '0 12px 24px rgba(251, 146, 60, 0.15), 0 4px 8px rgba(0, 0, 0, 0.05)'
          }}>
            <h2 className="text-2xl font-bold text-orange-800 mb-6" style={{ letterSpacing: '1px' }}>ÚSPĚCHY</h2>
            <div className="text-center text-gray-500 py-8">
              <p className="text-lg">Systém úspěchů</p>
              <p className="text-sm">Funkce bude brzy dostupná</p>
            </div>
          </div>
        );

      case 'settings':
        return (
          <SettingsView 
            player={player} 
            onPlayerUpdate={(updatedPlayer) => {
              // Update player in parent component if needed
              console.log('Player updated:', updatedPlayer)
            }}
            onBack={() => setCurrentPage('main')}
          />
        );

      default: // 'main'
        return (
          <>
            {/* Hidden measurement containers */}
            <div style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', zIndex: -1 }}>
              <div ref={habitsRef} style={{ width: '288px' }}>
                <div className="bg-white bg-opacity-95 rounded-2xl p-6 border border-orange-200 shadow-xl backdrop-blur-sm">
                  <h4 className="text-base font-bold text-orange-800 mb-4">NÁVYKY</h4>
                  <div className="space-y-3">
                    {(() => {
                      const now = new Date()
                      const dayOfWeek = now.getDay()
                      const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
                      const visibleHabits = habits.filter(habit => {
                        if (habit.always_show) return true
                        if (habit.frequency === 'daily') return true
                        if (habit.frequency === 'custom' && habit.selected_days) {
                          return habit.selected_days.includes(dayNames[dayOfWeek])
                        }
                        return false
                      })
                      return visibleHabits.slice(0, 4).map(habit => (
                        <div key={habit.id} className="p-3 rounded-xl border">
                          <div className="flex items-center gap-2 text-sm">
                            <span className="truncate flex-1">{habit.name}</span>
                          </div>
                        </div>
                      ))
                    })()}
                    {habits.filter(h => {
                      const now = new Date()
                      const dayOfWeek = now.getDay()
                      const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
                      if (h.always_show) return true
                      if (h.frequency === 'daily') return true
                      if (h.frequency === 'custom' && h.selected_days) {
                        return h.selected_days.includes(dayNames[dayOfWeek])
                      }
                      return false
                    }).length === 0 && (
                      <div className="text-center text-gray-500 py-4">
                        <p className="text-sm">Žádné návyky na dnes</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div ref={goalsRef} style={{ width: '288px' }}>
                <div className="bg-white bg-opacity-95 rounded-2xl p-6 border border-orange-200 shadow-xl backdrop-blur-sm">
                  <h4 className="text-base font-bold text-orange-800 mb-4">AKTIVNÍ CÍLE</h4>
                  <div className="space-y-4">
                    {goals.filter(goal => goal.status === 'active').slice(0, 4).map((goal, index) => {
                      const goalArea = areas.find(area => area.id === goal.area_id);
                      return (
                        <div key={goal.id} className="bg-white border border-orange-200 rounded-xl p-3">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-lg">{goalArea?.icon || '🎯'}</span>
                            <h5 className="font-semibold text-gray-800">{goal.title}</h5>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
              
              <div ref={stepsRef} style={{ width: '288px' }}>
                <div className="bg-white bg-opacity-95 rounded-2xl p-6 text-gray-800 backdrop-blur-sm border border-orange-200 shadow-xl">
                  <h3 className="text-base font-bold mb-4 text-orange-800">DALŠÍ KROKY</h3>
                  <div className="space-y-3">
                    {dailySteps.slice(0, 5).map((step) => (
                      <div key={step.id} className="p-3 rounded-xl border text-sm">
                        <span className="truncate">{step.title}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Goals Overlay - Left Side */}
            <div className="absolute left-2 top-8 bottom-8 z-10 flex flex-col" style={{ gap: '12px', width: leftSidebarWidth, overflow: 'visible' }}>
              {/* Goals Section */}
              <div 
                className="relative transition-all duration-300"
                style={{ width: leftSidebarWidth === '288px' ? '288px' : (expandedLeftSection === 'goals' ? '288px' : '48px'), marginLeft: expandedLeftSection && expandedLeftSection !== 'goals' ? '0' : '0' }}
                onMouseEnter={() => {
                  // Only allow hover expansion if sidebar is minimized
                  if (leftSidebarWidth === '48px') {
                    setExpandedLeftSection('goals')
                  }
                }}
                onMouseLeave={() => {
                  // Only allow hover collapse if sidebar is minimized
                  if (leftSidebarWidth === '48px') {
                    setExpandedLeftSection(null)
                  }
                }}
              >
                {(expandedLeftSection !== 'goals' && leftSidebarWidth === '48px') && (
                  <div 
                    className="bg-white bg-opacity-95 rounded-xl p-3 border border-orange-200 shadow-xl backdrop-blur-sm flex items-center justify-center"
                    style={{ height: leftSectionHeights.goals > 0 ? `${leftSectionHeights.goals}px` : 'auto' }}
                  >
                    <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                )}
                {(expandedLeftSection === 'goals' || leftSidebarWidth === '288px') && (
                  <div ref={goalsRef}>
              {/* Goals Overview - Grouped by Areas */}
              <div className="bg-white bg-opacity-95 rounded-2xl p-6 border border-orange-200 shadow-xl backdrop-blur-sm" style={{
                boxShadow: '0 12px 24px rgba(251, 146, 60, 0.15), 0 4px 8px rgba(0, 0, 0, 0.05)'
              }}>
                <div className="space-y-6">
                  {(() => {
                    const activeGoals = goals.filter(goal => goal.status === 'active')
                    
                    // Group goals by area
                    const goalsByArea = areas.map(area => {
                      const areaGoals = activeGoals.filter(goal => goal.area_id === area.id)
                      return { area, goals: areaGoals }
                    }).filter(item => item.goals.length > 0)
                    
                    // Add goals without area
                    const goalsWithoutArea = activeGoals.filter(goal => !goal.area_id || !areas.find(a => a.id === goal.area_id))
                    if (goalsWithoutArea.length > 0) {
                      goalsByArea.push({ 
                        area: { id: null, name: 'Ostatní', color: '#9CA3AF', icon: '📌' }, 
                        goals: goalsWithoutArea 
                      })
                    }
                    
                    return goalsByArea.map(({ area, goals: areaGoals }) => {
                      const areaKey = area.id || 'other'
                      const isExpanded = expandedAreas.has(areaKey)
                      
                      // Sort goals by target date (nearest first, then goals without date)
                      const sortedGoals = [...areaGoals].sort((a, b) => {
                        const dateA = a.target_date ? new Date(a.target_date).getTime() : Infinity
                        const dateB = b.target_date ? new Date(b.target_date).getTime() : Infinity
                        if (dateA === Infinity && dateB === Infinity) return 0
                        if (dateA === Infinity) return 1
                        if (dateB === Infinity) return -1
                        return dateA - dateB
                      })
                      
                      // In collapsed state, show only the nearest goal (first one)
                      const goalsToShow = isExpanded ? sortedGoals : sortedGoals.slice(0, 1)
                      
                      const toggleArea = () => {
                        setExpandedAreas(prev => {
                          const newSet = new Set(prev)
                          if (newSet.has(areaKey)) {
                            newSet.delete(areaKey)
                          } else {
                            newSet.add(areaKey)
                          }
                          return newSet
                        })
                      }
                      
                      return (
                        <div key={areaKey} className="bg-gray-100 rounded-lg border border-gray-200">
                          {/* Area Header */}
                          <div 
                            className="flex items-center justify-between cursor-pointer p-3 hover:bg-gray-150 transition-colors"
                            onClick={toggleArea}
                          >
                            <div className="flex items-center gap-2">
                              <span 
                                className="w-5 h-5 rounded-full flex items-center justify-center text-xs flex-shrink-0"
                                style={{ backgroundColor: area.color }}
                              >
                                <span className="text-white text-xs">{area.icon}</span>
                              </span>
                              <span className="text-sm font-bold text-gray-800">{area.name}</span>
                              <span className="text-sm text-gray-500">({areaGoals.length})</span>
                            </div>
                            {isExpanded ? (
                              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            ) : (
                              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            )}
                          </div>
                          
                          {/* Goals in this area */}
                          {goalsToShow.length > 0 && (
                            // If expanded, wrap goals in white sub-box, otherwise show directly in gray box
                            isExpanded ? (
                              <div className="p-2 pb-3">
                                <div className="bg-white rounded-lg p-3 space-y-2">
                                  {goalsToShow.map((goal) => {
                                    const goalProgress = goal.steps ? (goal.steps.filter((step: any) => step.completed).length / Math.max(goal.steps.length, 1)) * 100 : 0;
                                    
                                    // Calculate days until target date
                                    const today = new Date();
                                    const targetDate = goal.target_date ? new Date(goal.target_date) : null;
                                    const daysUntilTarget = targetDate ? Math.ceil((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)) : null;
                                    
                                    // Find area color for this goal
                                    const goalArea = areas.find(area => area.id === goal.area_id);
                                    const areaColor = goalArea?.color || '#F59E0B'; // Default orange if no area
                                    const areaIcon = goalArea?.icon || '🎯'; // Default target icon if no area
                                    
                                    return (
                                      <div 
                                        key={goal.id} 
                                        className="cursor-pointer hover:opacity-80 transition-opacity"
                                        onClick={() => handleItemClick(goal, 'goal')}
                                      >
                                        <div className="flex gap-3">
                                          {/* Left: Icon */}
                                          <div className="flex-shrink-0">
                                            <span 
                                              className="w-10 h-10 rounded-full flex items-center justify-center"
                                              style={{ backgroundColor: '#FB923C' }}
                                            >
                                              <span className="text-white text-lg">{areaIcon}</span>
                                            </span>
                                          </div>
                                          
                                          {/* Right: Content */}
                                          <div className="flex-1 min-w-0 flex flex-col justify-between">
                                            {/* Top Right: Title and Date */}
                                            <div className="ml-auto">
                                              <div className="flex flex-col items-end">
                                                <span className="text-sm font-medium text-gray-800">{goal.title}</span>
                                                {daysUntilTarget !== null && (
                                                  <span className="text-xs text-orange-600 mt-1">
                                                    {daysUntilTarget < 0 ? (
                                                      `Pozdě o ${Math.abs(daysUntilTarget)} dní`
                                                    ) : daysUntilTarget === 0 ? (
                                                      'Dnes'
                                                    ) : daysUntilTarget === 1 ? (
                                                      'Zítra'
                                                    ) : (
                                                      `Za ${daysUntilTarget} dní`
                                                    )}
                                                  </span>
                                                )}
                                                {daysUntilTarget === null && (
                                                  <span className="text-xs text-gray-400 mt-1">Bez termínu</span>
                                                )}
                                              </div>
                                            </div>
                                            
                                            {/* Bottom: Progress */}
                                            <div className="flex items-center justify-between gap-2 mt-auto">
                                              <span className="text-xs text-gray-400">Pokrok</span>
                                              <div className="flex items-center gap-2 flex-1 max-w-[100px] justify-end">
                                                <div className="flex-1 bg-gray-200 rounded-full h-1.5 min-w-[40px]">
                                                  <div 
                                                    className="bg-gray-400 h-1.5 rounded-full transition-all duration-300"
                                                    style={{ width: `${goalProgress}%` }}
                                                  ></div>
                                                </div>
                                                <span className="text-xs text-gray-400 whitespace-nowrap">{Math.round(goalProgress)}%</span>
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            ) : (
                              // Collapsed: show goals directly in gray box without white sub-box
                              <div className="px-3 pb-3 space-y-2">
                                {goalsToShow.map((goal) => {
                                  const goalProgress = goal.steps ? (goal.steps.filter((step: any) => step.completed).length / Math.max(goal.steps.length, 1)) * 100 : 0;
                                  
                                  // Calculate days until target date
                                  const today = new Date();
                                  const targetDate = goal.target_date ? new Date(goal.target_date) : null;
                                  const daysUntilTarget = targetDate ? Math.ceil((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)) : null;
                                  
                                  // Find area color for this goal
                                  const goalArea = areas.find(area => area.id === goal.area_id);
                                  const areaColor = goalArea?.color || '#F59E0B'; // Default orange if no area
                                  const areaIcon = goalArea?.icon || '🎯'; // Default target icon if no area
                                  
                                  return (
                                    <div 
                                      key={goal.id} 
                                      className="flex gap-3 cursor-pointer hover:opacity-80 transition-opacity"
                                      onClick={() => handleItemClick(goal, 'goal')}
                                    >
                                      {/* Left: Icon */}
                                      <div className="flex-shrink-0">
                                        <span 
                                          className="w-10 h-10 rounded-full flex items-center justify-center"
                                          style={{ backgroundColor: '#FB923C' }}
                                        >
                                          <span className="text-white text-lg">{areaIcon}</span>
                                        </span>
                                      </div>
                                      
                                      {/* Right: Content */}
                                      <div className="flex-1 min-w-0 flex flex-col justify-between">
                                        {/* Top Right: Title and Date */}
                                        <div className="ml-auto">
                                          <div className="flex flex-col items-end">
                                            <span className="text-sm font-medium text-gray-800">{goal.title}</span>
                                            {daysUntilTarget !== null && (
                                              <span className="text-xs text-orange-600 mt-1">
                                                {daysUntilTarget < 0 ? (
                                                  `Pozdě o ${Math.abs(daysUntilTarget)} dní`
                                                ) : daysUntilTarget === 0 ? (
                                                  'Dnes'
                                                ) : daysUntilTarget === 1 ? (
                                                  'Zítra'
                                                ) : (
                                                  `Za ${daysUntilTarget} dní`
                                                )}
                                              </span>
                                            )}
                                            {daysUntilTarget === null && (
                                              <span className="text-xs text-gray-400 mt-1">Bez termínu</span>
                                            )}
                                          </div>
                                        </div>
                                        
                                        {/* Bottom: Progress */}
                                        <div className="flex items-center justify-end gap-2 mt-auto">
                                          <div className="flex items-center gap-2 flex-1 max-w-[100px] justify-end">
                                            <div className="flex-1 bg-gray-200 rounded-full h-1.5 min-w-[40px]">
                                              <div 
                                                className="bg-gray-400 h-1.5 rounded-full transition-all duration-300"
                                                style={{ width: `${goalProgress}%` }}
                                              ></div>
                                            </div>
                                            <span className="text-xs text-gray-400 whitespace-nowrap">{Math.round(goalProgress)}%</span>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )
                          )}
                        </div>
                      )
                    })
                  })()}
                  
                  {(() => {
                    const activeGoals = goals.filter(goal => goal.status === 'active')
                    const hasAnyGoals = areas.some(area => activeGoals.some(goal => goal.area_id === area.id)) || 
                                      activeGoals.some(goal => !goal.area_id || !areas.find(a => a.id === goal.area_id))
                    return !hasAnyGoals && (
                      <div className="text-sm text-gray-500 text-center py-4">Žádné aktivní cíle</div>
                    )
                  })()}
                </div>
              </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Sidebar - Habits and Next Steps */}
            <div className="absolute right-2 top-8 bottom-8 z-10 flex flex-col items-end" style={{ gap: '12px', width: rightSidebarWidth, overflow: 'visible' }}>
              {/* Habits Section */}
              <div 
                className="transition-all duration-300"
                style={{ width: rightSidebarWidth === '288px' ? '288px' : (expandedRightSection === 'habits' ? '288px' : '48px') }}
                onMouseEnter={() => {
                  // Only allow hover expansion if sidebar is minimized
                  if (rightSidebarWidth === '48px') {
                    setExpandedRightSection('habits')
                  }
                }}
                onMouseLeave={() => {
                  // Only allow hover collapse if sidebar is minimized
                  if (rightSidebarWidth === '48px') {
                    setExpandedRightSection(null)
                  }
                }}
              >
                {(expandedRightSection !== 'habits' && rightSidebarWidth === '48px') && (
                  <div 
                    className="bg-white bg-opacity-95 rounded-xl p-3 border border-orange-200 shadow-xl backdrop-blur-sm flex items-center justify-center"
                    style={{ height: rightSectionHeights.habits > 0 ? `${rightSectionHeights.habits}px` : 'calc(50% - 6px)' }}
                  >
                    <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 9l3 3m0 0l-3 3m3-3H8m13 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                )}
                {(expandedRightSection === 'habits' || rightSidebarWidth === '288px') && (
                  <div ref={habitsRef}>
              {/* Habits Overview */}
              <div className="bg-white bg-opacity-95 rounded-2xl p-6 border border-orange-200 shadow-xl backdrop-blur-sm" style={{
                boxShadow: '0 12px 24px rgba(251, 146, 60, 0.15), 0 4px 8px rgba(0, 0, 0, 0.05)'
              }}>
                <h4 className="text-base font-bold text-orange-800 mb-4" style={{ letterSpacing: '1px' }}>NÁVYKY</h4>
                <div className="space-y-3">
                  {(() => {
                    const now = new Date()
                    const dayOfWeek = now.getDay()
                    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
                    
                    // Filter habits to show only those scheduled for today OR always_show
                    const visibleHabits = habits.filter(habit => {
                      if (habit.always_show) return true
                      if (habit.frequency === 'daily') return true
                      if (habit.frequency === 'custom' && habit.selected_days) {
                        return habit.selected_days.includes(dayNames[dayOfWeek])
                      }
                      return false
                    })
                    
                    return visibleHabits.slice(0, 4).map((habit, index) => {
                      // Check if habit is scheduled for today
                      const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
                      const isCompletedToday = habit && habit.habit_completions && habit.habit_completions[today] === true;
                      
                      // Check if habit is scheduled for today based on frequency and selected days
                      let isScheduledForTask = false
                      if (habit.frequency === 'daily') {
                        isScheduledForTask = true
                      } else if (habit.frequency === 'custom' && habit.selected_days) {
                        isScheduledForTask = habit.selected_days.includes(dayNames[dayOfWeek])
                      }
                      
                      // Habit should be grayed if it has always_show enabled AND it's not scheduled for today
                      const isNotScheduled = habit.always_show ? !isScheduledForTask : false
                    
                    return (
                      <div key={habit.id} className={`p-3 rounded-xl border transition-all duration-300 cursor-pointer ${
                        isCompletedToday 
                          ? 'bg-orange-100 border-orange-300 shadow-md' 
                          : isNotScheduled
                            ? 'bg-gray-50 border-gray-200 opacity-60'
                            : 'bg-gray-50 border-gray-200 hover:shadow-md hover:bg-gray-100'
                      }`} style={{
                        boxShadow: isCompletedToday ? '0 4px 12px rgba(251, 146, 60, 0.2)' : '0 2px 4px rgba(0, 0, 0, 0.05)'
                      }}
                      onClick={() => handleItemClick(habit, 'habit')}
                      >
                        <div className="flex items-center gap-2 text-sm">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleHabitToggle(habit.id)
                            }}
                            className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all duration-300 ${
                              isCompletedToday
                                ? 'bg-orange-500 border-orange-500 text-white shadow-md'
                                : 'border-gray-300 hover:border-orange-400 hover:shadow-sm'
                            }`}
                            style={{
                              boxShadow: isCompletedToday ? '0 2px 8px rgba(251, 146, 60, 0.3)' : '0 1px 2px rgba(0, 0, 0, 0.1)'
                            }}
                            title={isCompletedToday ? 'Označit jako nesplněný' : 'Označit jako splněný'}
                          >
                            {isCompletedToday && '✓'}
                          </button>
                          <span className={`truncate flex-1 ${
                            isCompletedToday 
                              ? 'line-through text-orange-600' 
                            : isNotScheduled
                              ? 'text-gray-500'
                              : 'text-gray-700'
                          }`}>
                            {habit.name}
                          </span>
                          <div className="flex items-center gap-1">
                            {(() => {
                              const habitCompletions = habit.habit_completions || {}
                              const completionDates = Object.keys(habitCompletions).sort()
                              let currentStreak = 0
                              const userCreatedDateFull = new Date(player?.created_at || '2024-01-01')
                              const userCreatedDate = new Date(userCreatedDateFull.getFullYear(), userCreatedDateFull.getMonth(), userCreatedDateFull.getDate())
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
                              if (lastCompletedDate) {
                                for (let d = new Date(lastCompletedDate); d >= userCreatedDate; d.setDate(d.getDate() - 1)) {
                                  const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
                                  const completion = habitCompletions[dateKey]
                                  if (completion === true) {
                                    currentStreak++
                                  } else if (completion === false) {
                                    break
                                  }
                                }
                              }
                              return (
                                <>
                                  <span className={`font-bold text-sm ${isNotScheduled ? 'text-gray-400' : 'text-orange-600'}`}>🔥</span>
                                  <span className={`font-bold text-sm ${isNotScheduled ? 'text-gray-400' : 'text-orange-600'}`}>{currentStreak}</span>
                                </>
                              )
                            })()}
                          </div>
                        </div>
                      </div>
                    );
                  })})()}
                  {habits.filter(h => {
                    const now = new Date()
                    const dayOfWeek = now.getDay()
                    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
                    if (h.always_show) return true
                    if (h.frequency === 'daily') return true
                    if (h.frequency === 'custom' && h.selected_days) {
                      return h.selected_days.includes(dayNames[dayOfWeek])
                    }
                    return false
                  }).length === 0 && (
                    <div className="text-center text-gray-500 py-4">
                      <p className="text-sm">Žádné návyky na dnes</p>
                      <p className="text-xs mt-1">Návyky se zobrazí podle jejich frekvence</p>
                    </div>
                  )}
                </div>
              </div>
                  </div>
                )}
              </div>

              {/* Steps Section */}
              <div 
                className="transition-all duration-300"
                style={{ width: rightSidebarWidth === '288px' ? '288px' : (expandedRightSection === 'steps' ? '288px' : '48px') }}
                onMouseEnter={() => {
                  // Only allow hover expansion if sidebar is minimized
                  if (rightSidebarWidth === '48px') {
                    setExpandedRightSection('steps')
                  }
                }}
                onMouseLeave={() => {
                  // Only allow hover collapse if sidebar is minimized
                  if (rightSidebarWidth === '48px') {
                    setExpandedRightSection(null)
                  }
                }}
              >
                {(expandedRightSection !== 'steps' && rightSidebarWidth === '48px') && (
                  <div 
                    className="bg-white bg-opacity-95 rounded-xl p-3 border border-orange-200 shadow-xl backdrop-blur-sm flex items-center justify-center"
                    style={{ height: rightSectionHeights.steps > 0 ? `${rightSectionHeights.steps}px` : 'calc(50% - 6px)' }}
                  >
                    <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                )}
                {(expandedRightSection === 'steps' || rightSidebarWidth === '288px') && (
                  <div ref={stepsRef}>
              {/* Next Steps Panel */}
              <div className="bg-white bg-opacity-95 rounded-2xl p-6 text-gray-800 backdrop-blur-sm border border-orange-200 shadow-xl" style={{
                boxShadow: '0 12px 24px rgba(251, 146, 60, 0.15), 0 4px 8px rgba(0, 0, 0, 0.05)'
              }}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-bold text-orange-800" style={{ letterSpacing: '1px' }}>DALŠÍ KROKY</h3>
                  <button
                    onClick={() => {
                      // Format date in local timezone
                      const today = new Date()
                      const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
                      const newStep = {
                        id: 'new-step',
                        title: '',
                        description: '',
                        completed: false,
                        date: todayStr,
                        estimated_time: 0,
                        xp_reward: 0
                      }
                      setSelectedItem(newStep)
                      setSelectedItemType('step')
                    }}
                    className="w-7 h-7 rounded-full bg-orange-500 text-white hover:bg-orange-600 transition-colors flex items-center justify-center text-lg font-bold"
                    title="Přidat krok"
                  >
                    +
                  </button>
                </div>
                
                {dailySteps.length === 0 ? (
                  <div className="text-gray-400 text-sm text-center py-4">
                    Žádné kroky naplánované
                  </div>
                ) : (
                  <div className="space-y-3" style={{ maxHeight: 'calc(100vh - 400px)', overflowY: 'auto' }}>
                    {(() => {
                      const today = new Date()
                      today.setHours(0, 0, 0, 0)
                      
                      // Filter: only incomplete steps, and date should be today or in the past (including overdue) or future
                      const filteredSteps = dailySteps
                        .filter(step => !step.completed) // Only incomplete steps
                        .filter(step => {
                          if (!step.date) {
                            // Steps without date are always shown
                            return true
                          }
                          const stepDateObj = new Date(step.date)
                          stepDateObj.setHours(0, 0, 0, 0)
                          // Include overdue (past), today, and future steps
                          return true // Show all incomplete steps regardless of date
                        })
                        .sort((a, b) => {
                          // Sort: overdue first, then today, then future
                          const dateA = a.date ? new Date(a.date).getTime() : 0
                          const dateB = b.date ? new Date(b.date).getTime() : 0
                          
                          // Overdue steps first (negative days)
                          if (dateA < today.getTime() && dateB >= today.getTime()) return -1
                          if (dateA >= today.getTime() && dateB < today.getTime()) return 1
                          
                          // Then sort by date (earliest first)
                          return dateA - dateB
                        })
                      
                      return filteredSteps.slice(0, 5).map((step, index) => {
                        const stepDate = step.date ? new Date(step.date) : null
                        const stepDateOnly = stepDate ? new Date(stepDate.getFullYear(), stepDate.getMonth(), stepDate.getDate()) : null
                        const isOverdue = stepDateOnly && stepDateOnly < today
                        const isToday = stepDateOnly && stepDateOnly.getTime() === today.getTime()
                        const isFuture = stepDateOnly && stepDateOnly > today
                        
                        return (
                          <div
                            key={step.id}
                            className={`p-3 rounded-xl border text-sm transition-all duration-300 hover:shadow-md ${
                              isOverdue 
                                ? 'bg-red-50 border-red-200' 
                                : isToday 
                                  ? 'bg-orange-50 border-orange-200' 
                                  : 'bg-gray-50 border-gray-200'
                            }`}
                            style={{
                              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
                            }}
                          >
                            <div className="flex items-center gap-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleStepToggle(step.id, !step.completed)
                                }}
                                className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all duration-300 ${
                                  isOverdue
                                    ? 'border-red-300 hover:border-red-400'
                                    : 'border-gray-300 hover:border-green-400'
                                } hover:shadow-sm`}
                                style={{
                                  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)'
                                }}
                                title="Označit jako dokončený"
                              >
                              </button>
                              <span className={`text-xs ${
                                isOverdue ? 'text-red-600' : isToday ? 'text-orange-600' : 'text-gray-400'
                              }`}>
                                {isOverdue && '⚠️'}
                                {isToday && '📅'}
                                {isFuture && '🔮'}
                              </span>
                              <span 
                                className="flex-1 truncate cursor-pointer font-medium"
                                onClick={() => handleItemClick(step, 'step')}
                              >
                                {step.title}
                              </span>
                            </div>
                            <div className="flex items-center justify-between mt-1">
                              <div className="text-xs text-gray-400">
                                {step.goal?.title && `Cíl: ${step.goal.title}`}
                              </div>
                              {stepDate && (() => {
                                const daysDiff = Math.ceil((stepDateOnly!.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
                                let dateText = ''
                                if (daysDiff < 0) {
                                  dateText = `Pozdě o ${Math.abs(daysDiff)} ${Math.abs(daysDiff) === 1 ? 'den' : Math.abs(daysDiff) < 5 ? 'dny' : 'dní'}`
                                } else if (daysDiff === 0) {
                                  dateText = 'Dnes'
                                } else if (daysDiff === 1) {
                                  dateText = 'Zítra'
                                } else {
                                  dateText = `Za ${daysDiff} ${daysDiff === 2 || daysDiff === 3 || daysDiff === 4 ? 'dny' : 'dní'}`
                                }
                                return (
                                  <div className={`text-xs ${
                                    isOverdue ? 'text-red-600 font-semibold' : 
                                    isToday ? 'text-orange-600' : 
                                    'text-gray-500'
                                  }`}>
                                    {dateText}
                                  </div>
                                )
                              })()}
                            </div>
                          </div>
                        )
                      })
                    })()}
                    {(() => {
                      const today = new Date()
                      today.setHours(0, 0, 0, 0)
                      const filteredCount = dailySteps
                        .filter(step => !step.completed).length
                      
                      if (filteredCount === 0) {
                        return (
                          <div className="text-gray-400 text-sm text-center py-4">
                            Všechny kroky dokončeny
                          </div>
                        )
                      }
                      
                      if (filteredCount > 5) {
                        return (
                          <div className="text-center text-gray-400 text-sm py-2">
                            +{filteredCount - 5} dalších kroků
                          </div>
                        )
                      }
                      return null
                    })()}
                  </div>
                )}
              </div>
                  </div>
                )}
              </div>
            </div>


            {/* Center Area - Dynamic Display */}
            {leftSidebarWidth === '0px' && rightSidebarWidth === '0px' ? (
              <div className="flex items-center justify-center h-full w-full">
                <div className="text-center p-8 bg-white bg-opacity-95 rounded-2xl shadow-xl border border-orange-200">
                  <h2 className="text-2xl font-bold text-orange-800 mb-4">Rozlišení je příliš malé</h2>
                  <p className="text-gray-600">
                    Pro správný běh aplikace je potřeba větší rozlišení.
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    Minimální šířka okna: {(430 + 288 + 288 + 40).toLocaleString('cs-CZ')}px
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-start justify-center flex-1 overflow-hidden" style={{
                marginLeft: parseInt(leftSidebarWidth) > 48 ? '280px' : '48px',
                marginRight: parseInt(rightSidebarWidth) > 48 ? '280px' : '48px'
              }}>
                <div className="text-center w-full">
                  {/* Display Monitor */}
                  <div className="bg-white bg-opacity-95 rounded-2xl p-4 shadow-xl backdrop-blur-sm border border-orange-200" style={{
                    boxShadow: '0 12px 24px rgba(251, 146, 60, 0.15), 0 4px 8px rgba(0, 0, 0, 0.05)'
                  }}>
                    {/* Monitor Screen */}
                    <div className="bg-orange-100 rounded-xl p-4 min-h-80 flex items-center justify-center border border-orange-300" style={{
                      boxShadow: 'inset 0 2px 4px rgba(251, 146, 60, 0.1)'
                    }}>
                      {renderDisplayContent()}
                    </div>
                  
                  {/* Program Selector - Moved to bottom */}
                  <div className="flex justify-center items-center gap-2 mt-4">
                    {/* Power Button - Left side */}
                    <button
                      onClick={() => {
                        setSelectedItem(null)
                        setSelectedItemType(null)
                        setCurrentProgram('chill')
                      }}
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                        !selectedItem && currentProgram === 'chill' 
                          ? 'bg-orange-500 text-white shadow-md' 
                          : 'bg-gray-100 text-gray-600 hover:bg-orange-100 hover:text-orange-700'
                      }`}
                      style={{
                        boxShadow: !selectedItem && currentProgram === 'chill' ? '0 4px 12px rgba(251, 146, 60, 0.3)' : '0 2px 4px rgba(0, 0, 0, 0.05)'
                      }}
                      title="Chill místa"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                      </svg>
                    </button>
                    <button
                      onClick={() => {
                        setSelectedItem(null)
                        setSelectedItemType(null)
                        setCurrentProgram('daily-plan')
                      }}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                        !selectedItem && currentProgram === 'daily-plan' 
                          ? 'bg-orange-500 text-white shadow-md' 
                          : 'bg-gray-100 text-gray-600 hover:bg-orange-100 hover:text-orange-700'
                      }`}
                      style={{
                        boxShadow: !selectedItem && currentProgram === 'daily-plan' ? '0 4px 12px rgba(251, 146, 60, 0.3)' : '0 2px 4px rgba(0, 0, 0, 0.05)'
                      }}
                    >
                      Denní plán
                    </button>
                    <button
                      onClick={() => {
                        setSelectedItem(null)
                        setSelectedItemType(null)
                        setCurrentProgram('statistics')
                      }}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                        !selectedItem && currentProgram === 'statistics' 
                          ? 'bg-orange-500 text-white shadow-md' 
                          : 'bg-gray-100 text-gray-600 hover:bg-orange-100 hover:text-orange-700'
                      }`}
                      style={{
                        boxShadow: !selectedItem && currentProgram === 'statistics' ? '0 4px 12px rgba(251, 146, 60, 0.3)' : '0 2px 4px rgba(0, 0, 0, 0.05)'
                      }}
                    >
                      Statistiky
                    </button>
                    <button
                      onClick={() => {
                        setSelectedItem(null)
                        setSelectedItemType(null)
                        setCurrentProgram('calendar')
                      }}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                        !selectedItem && currentProgram === 'calendar' 
                          ? 'bg-orange-500 text-white shadow-md' 
                          : 'bg-gray-100 text-gray-600 hover:bg-orange-100 hover:text-orange-700'
                      }`}
                      style={{
                        boxShadow: !selectedItem && currentProgram === 'calendar' ? '0 4px 12px rgba(251, 146, 60, 0.3)' : '0 2px 4px rgba(0, 0, 0, 0.05)'
                      }}
                    >
                      📅 Kalendář
                    </button>
                  </div>
                </div>
              </div>
              </div>
            )}
          </>
        )
    }
  }

  return (
    <div className="bg-white overflow-hidden min-h-screen w-full" style={{
      fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      fontSize: '14px',
      background: 'linear-gradient(135deg, #FFFAF5 0%, #fef3e7 50%, #fde4c4 100%)',
      boxShadow: '0 20px 40px rgba(0, 0, 0, 0.08), 0 8px 16px rgba(0, 0, 0, 0.04)'
    }}>
      {/* Header */}
      <div className="relative overflow-hidden w-full" style={{
        background: 'linear-gradient(135deg, #fb923c 0%, #ea580c 100%)',
        boxShadow: '0 4px 12px rgba(251, 146, 60, 0.3)'
      }}>
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-4 left-6 w-8 h-8 bg-yellow-300 rounded-full animate-bounce opacity-15"></div>
          <div className="absolute top-8 right-8 w-4 h-4 bg-orange-200 rounded-full animate-pulse opacity-15"></div>
          <div className="absolute bottom-4 left-1/4 w-6 h-6 bg-pink-300 rounded-full animate-bounce opacity-15"></div>
          <div className="absolute top-4 right-6 w-4 h-4 bg-yellow-300 rounded-full animate-bounce opacity-15"></div>
          <div className="absolute bottom-2 left-1/4 w-6 h-6 bg-pink-300 rounded-full animate-pulse opacity-15"></div>
        </div>
        
        <div className="relative z-10 py-5 px-6">
          {/* Top Row: Menu Icons */}
          <div className="flex items-center justify-between mb-3">
            {/* Left - Menu Icons */}
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setCurrentPage('main')}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white hover:bg-opacity-20 transition-all duration-200 text-white ${currentPage === 'main' ? 'bg-white bg-opacity-25' : ''}`}
                title="Hlavní panel"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                  <polyline points="9,22 9,12 15,12 15,22"/>
                </svg>
                <span className="text-sm font-medium">Hlavní panel</span>
              </button>
            </div>

            {/* Right - Menu Icons */}
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setCurrentPage('goals')}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white hover:bg-opacity-20 transition-all duration-200 text-white ${currentPage === 'goals' ? 'bg-white bg-opacity-25' : ''}`}
                title="Cíle"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
                <span className="text-sm font-medium">Cíle</span>
              </button>
              
              <button
                onClick={() => setCurrentPage('habits')}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white hover:bg-opacity-20 transition-all duration-200 text-white ${currentPage === 'habits' ? 'bg-white bg-opacity-25' : ''}`}
                title="Návyky"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
                </svg>
                <span className="text-sm font-medium">Návyky</span>
              </button>
              
              <button
                onClick={() => setCurrentPage('steps')}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white hover:bg-opacity-20 transition-all duration-200 text-white ${currentPage === 'steps' ? 'bg-white bg-opacity-25' : ''}`}
                title="Kroky"
              >
                <Footprints className="w-5 h-5" strokeWidth="2" />
                <span className="text-sm font-medium">Kroky</span>
              </button>
              
              <button
                onClick={() => setCurrentPage('daily-plan')}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white hover:bg-opacity-20 transition-all duration-200 text-white ${currentPage === 'daily-plan' ? 'bg-white bg-opacity-25' : ''}`}
                title="Poznámky"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14,2 14,8 20,8"/>
                  <line x1="16" y1="13" x2="8" y2="13" strokeWidth="2"/>
                  <line x1="16" y1="17" x2="8" y2="17" strokeWidth="2"/>
                  <polyline points="10,9 9,9 8,9"/>
                </svg>
                <span className="text-sm font-medium">Poznámky</span>
              </button>
              
              <button
                onClick={() => setCurrentPage('settings')}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white hover:bg-opacity-20 transition-all duration-200 text-white ${currentPage === 'settings' ? 'bg-white bg-opacity-25' : ''}`}
                title="Nastavení"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="3"/>
                  <path d="M12 1v6m0 6v6m9-9h-6M9 12H3m13.66-5.66l-4.24 4.24m0 4.48l4.24 4.24M4.34 18.66l4.24-4.24m0-4.48L4.34 5.66"/>
                </svg>
                <span className="text-sm font-medium">Nastavení</span>
              </button>
            </div>
          </div>

          {/* Divider between menu and statistics */}
          <div className="border-t border-white border-opacity-30 my-3"></div>

          {/* Bottom Row: Statistics */}
          <div className="flex items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-white opacity-90" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
              </svg>
              <span className="text-white font-semibold text-sm">{totalXp}</span>
              <span className="text-white opacity-75 text-xs">XP</span>
            </div>

            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-white opacity-90" fill="currentColor" viewBox="0 0 24 24">
                <path d="M13.5.67s.74 2.65.74 4.8c0 2.06-1.35 3.73-3.41 3.73-2.07 0-3.63-1.67-3.63-3.73l.03-.36C5.21 7.51 4 10.62 4 14c0 4.42 3.58 8 8 8s8-3.58 8-8C20 8.61 17.41 3.8 13.5.67zM11.71 19c-1.78 0-3.22-1.4-3.22-3.14 0-1.62 1.05-2.76 2.81-3.12 1.77-.36 3.6-1.21 4.62-2.58.39 1.29.59 2.65.59 4.04 0 2.65-2.15 4.8-4.8 4.8z"/>
              </svg>
              <span className="text-white font-semibold text-sm">{loginStreak}</span>
              <span className="text-white opacity-75 text-xs">Streak</span>
            </div>

            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-white opacity-90" fill="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none"/>
                <circle cx="12" cy="12" r="3" fill="currentColor"/>
              </svg>
              <span className="text-white font-semibold text-sm">{totalCompletedGoals}</span>
              <span className="text-white opacity-75 text-xs">Cíle</span>
            </div>

            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-white opacity-90" fill="currentColor" viewBox="0 0 24 24">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
              </svg>
              <span className="text-white font-semibold text-sm">{totalCompletedHabits}</span>
              <span className="text-white opacity-75 text-xs">Návyky</span>
            </div>

            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-white opacity-90" fill="currentColor" viewBox="0 0 24 24">
                <path d="M3 12h2l3-9 6 18 3-9h2"/>
              </svg>
              <span className="text-white font-semibold text-sm">{totalCompletedSteps}</span>
              <span className="text-white opacity-75 text-xs">Kroky</span>
            </div>
          </div>
        </div>
        
        {/* Bottom divider line - separates menu from page content */}
        <div className="h-px bg-orange-300 opacity-50 w-full"></div>
      </div>

      {/* Main Content Area */}
      <div className="p-8 relative flex flex-col h-full">
        {renderPageContent()}
      </div>

    </div>
  )
}