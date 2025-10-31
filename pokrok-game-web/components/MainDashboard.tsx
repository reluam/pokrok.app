'use client'

import { useState, useEffect, memo } from 'react'
import { useRouter } from 'next/navigation'
import { Goal, Value, DailyStep, Event } from '@/lib/cesta-db'
import { GameCenter } from './GameCenter'
import DailyCheckIn from './DailyCheckIn'
import { NewGoalOnboarding } from './NewGoalOnboarding'
import { GoalDetailModal } from './GoalDetailModal'
import { OverviewPanel } from './OverviewPanel'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { usePageContext } from './PageContext'
import { getIconEmoji } from '@/lib/icon-utils'
import { useTranslations } from '@/lib/use-translations'

export const MainDashboard = memo(function MainDashboard() {
  const router = useRouter()
  const { setTitle, setSubtitle } = usePageContext()
  const { translations } = useTranslations()

  const [goals, setGoals] = useState<Goal[]>([])
  const [values, setValues] = useState<Value[]>([])
  const [dailySteps, setDailySteps] = useState<DailyStep[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const [showGoalOnboarding, setShowGoalOnboarding] = useState(false)
  const [showGoalDetails, setShowGoalDetails] = useState(false)
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null)

  const [editingProgress, setEditingProgress] = useState(false)
  const [progressValue, setProgressValue] = useState('')

  const [selectedStep, setSelectedStep] = useState<DailyStep | null>(null)
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [plannedStepIds, setPlannedStepIds] = useState<string[]>([])
  const [expandedColumn, setExpandedColumn] = useState<'goals' | 'steps' | null>(null)
  const [showDailyCheckInAddModal, setShowDailyCheckInAddModal] = useState(false)
  const [selectedGoalForStep, setSelectedGoalForStep] = useState<string | null>(null)

  useEffect(() => {
    if (translations) {
      fetchData()
    }
  }, [translations])

  // Listen for storage changes to sync values across tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'cesta-values-updated') {
        fetchData()
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  const fetchData = async () => {
    try {
      const [goalsRes, valuesRes, stepsRes, eventsRes, planningRes] = await Promise.all([
        fetch('/api/cesta/goals', { cache: 'no-store' }),
        fetch('/api/cesta/values', { cache: 'no-store' }),
        fetch('/api/cesta/daily-steps', { cache: 'no-store' }),
        fetch('/api/cesta/smart-events', { cache: 'no-store' }),
        fetch(`/api/cesta/daily-planning?date=${new Date().toISOString().split('T')[0]}`, { cache: 'no-store' })
      ])

      const safeJson = async (res: Response) => {
        try {
          return await res.json()
        } catch {
          return {}
        }
      }

      const [goalsData, valuesData, stepsData, eventsData, planningData] = await Promise.all([
        safeJson(goalsRes),
        safeJson(valuesRes),
        safeJson(stepsRes),
        safeJson(eventsRes),
        safeJson(planningRes)
      ])

      const nextGoals: Goal[] = Array.isArray(goalsData)
        ? goalsData
        : Array.isArray(goalsData?.goals)
          ? goalsData.goals
          : []

      const nextValues: Value[] = Array.isArray(valuesData)
        ? valuesData
        : Array.isArray(valuesData?.values)
          ? valuesData.values
          : []

      const nextSteps: DailyStep[] = Array.isArray(stepsData)
        ? stepsData
        : Array.isArray(stepsData?.steps)
          ? stepsData.steps
          : []

      const nextEvents: Event[] = Array.isArray(eventsData)
        ? eventsData
        : Array.isArray(eventsData?.events)
          ? eventsData.events
          : []

      setGoals(nextGoals)
      setValues(nextValues)
      setDailySteps(nextSteps)
      setEvents(nextEvents)
      if (Array.isArray(planningData?.planning?.planned_steps)) {
        setPlannedStepIds(planningData.planning.planned_steps)
      }

      setTitle(translations?.app.mainDashboard || 'Hlavní panel')
      setSubtitle(`${nextGoals.length} ${translations?.app.goalsCount || 'cílů'}, ${nextSteps.length} ${translations?.app.stepsCount || 'kroků'}`)

      if (selectedGoal) {
        const updatedSelectedGoal = nextGoals.find((g) => g.id === selectedGoal.id)
        if (updatedSelectedGoal) setSelectedGoal(updatedSelectedGoal)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getDaysRemaining = (targetDate: string | Date) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const target = new Date(targetDate)
    target.setHours(0, 0, 0, 0)
    const diffTime = target.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const getDaysRemainingText = (targetDate: string | Date) => {
    const days = getDaysRemaining(targetDate)
    if (days < 0) {
      return `${Math.abs(days)} ${translations?.app.daysOverdue || 'dní zpožděno'}`
    } else if (days === 0) {
      return translations?.app.today || 'Dnes'
    } else if (days === 1) {
      return translations?.app.tomorrow || 'Zítra'
    } else {
      return `${days} ${translations?.app.days || 'dní'}`
    }
  }

  const getDaysRemainingColor = (targetDate: string | Date) => {
    const days = getDaysRemaining(targetDate)
    if (days < 0) {
      return 'text-red-600'
    } else if (days <= 7) {
      return 'text-orange-600'
    } else {
      return 'text-gray-600'
    }
  }

  const handleStepComplete = async (stepId: string) => {
    try {
      // Set loading state for this specific step
      setDailySteps(prev => 
        prev.map(step => 
          step.id === stepId 
            ? { ...step, isCompleting: true }
            : step
        )
      )
      
      await fetch(`/api/cesta/daily-steps/${stepId}/complete`, {
        method: 'PATCH'
      })
      
      // Update daily steps
      setDailySteps(prev => 
        prev.map(step => 
          step.id === stepId 
            ? { ...step, completed: true, completed_at: new Date(), isCompleting: false }
            : step
        )
      )
      
      // Update goals to refresh progress
      setGoals(prev => 
        prev.map(goal => {
          // Find the step to get its goal_id
          const step = dailySteps.find(s => s.id === stepId)
          if (step && step.goal_id === goal.id) {
            // For steps-based goals, we need to recalculate progress
            if (goal.progress_type === 'steps') {
              const allStepsForGoal = dailySteps.filter(s => s.goal_id === goal.id)
              const completedSteps = allStepsForGoal.filter(s => s.id === stepId ? true : s.completed).length
              const totalSteps = allStepsForGoal.length
              const newProgressPercentage = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0
              
              return {
                ...goal,
                progress_percentage: newProgressPercentage
              }
            }
          }
          return goal
        })
      )
    } catch (error) {
      console.error('Error completing step:', error)
      // Remove loading state on error
      setDailySteps(prev => 
        prev.map(step => 
          step.id === stepId 
            ? { ...step, isCompleting: false }
            : step
        )
      )
    }
  }

  const handleAddStep = (goalId: string) => {
    setSelectedGoalForStep(goalId)
    setShowDailyCheckInAddModal(true)
  }

  const handleSaveStep = async (stepData: any) => {
    try {
      const response = await fetch('/api/cesta/daily-steps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          goalId: selectedGoalForStep,
          ...stepData
        })
      })
      
      if (response.ok) {
        await fetchData() // Refresh data
        setShowDailyCheckInAddModal(false)
        setSelectedGoalForStep(null)
      }
    } catch (error) {
      console.error('Error adding step:', error)
    }
  }

  // Create a step and DO add it to today's plan immediately
  const handleStepAddToPlan = async (stepData: Partial<DailyStep>) => {
    try {
      const response = await fetch('/api/cesta/daily-steps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          goalId: stepData.goal_id,
          title: stepData.title,
          description: stepData.description,
          date: stepData.date,
          is_important: stepData.is_important,
          is_urgent: stepData.is_urgent
        })
      })

      if (response.ok) {
        const data = await response.json()
        const createdStep: DailyStep = (data && (data.step || data)) as DailyStep
        setDailySteps(prev => [...prev, createdStep])

        // Immediately add to today's plan in UI and persist server-side
        if (createdStep?.id) {
          const updatedPlanned = [...plannedStepIds, createdStep.id]
          setPlannedStepIds(updatedPlanned)
          try {
            await fetch('/api/cesta/daily-planning', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                date: new Date().toISOString().split('T')[0],
                planned_steps: updatedPlanned
              })
            })
          } catch (e) {
            console.error('Error persisting planned steps after create:', e)
          }
        }

        return createdStep
      } else {
        throw new Error('Failed to add step')
      }
    } catch (error) {
      console.error('Error adding step:', error)
      throw error
    }
  }

  // Create a step and DO NOT add it to the daily plan (stays in "Další kroky")
  const handleStepAddNoPlan = async (stepData: Partial<DailyStep>) => {
    try {
      const response = await fetch('/api/cesta/daily-steps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          goalId: stepData.goal_id,
          title: stepData.title,
          description: stepData.description,
          date: stepData.date,
          is_important: stepData.is_important,
          is_urgent: stepData.is_urgent
        })
      })

      if (response.ok) {
        const data = await response.json()
        const createdStep: DailyStep = (data && (data.step || data)) as DailyStep
        setDailySteps(prev => [...prev, createdStep])
        // Do not touch plannedStepIds here
        return createdStep
      } else {
        throw new Error('Failed to add step')
      }
    } catch (error) {
      console.error('Error adding step (no plan):', error)
      throw error
    }
  }

  const handleStepPostpone = async (stepId: string) => {
    try {
      const response = await fetch(`/api/cesta/daily-steps/${stepId}/postpone`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' }
      })
      
      if (response.ok) {
        // Update local state immediately
        const tomorrow = new Date()
        tomorrow.setDate(tomorrow.getDate() + 1)
        tomorrow.setHours(0, 0, 0, 0)
        
        setDailySteps(prev => prev.map(step => 
          step.id === stepId 
            ? { ...step, date: tomorrow }
            : step
        ))
        
        // Also refresh data to ensure consistency
        await fetchData()
      } else {
        const errorData = await response.json()
        console.error('Error postponing step:', errorData)
      }
    } catch (error) {
      console.error('Error postponing step:', error)
    }
  }

  const handleEventComplete = async (eventId: string) => {
    try {
      const response = await fetch('/api/cesta/smart-events/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ interactionId: eventId })
      })
      
      if (response.ok) {
        // Update local state immediately
        setEvents(prev => prev.map(event => 
          event.id === eventId 
            ? { ...event, completed: true, completed_at: new Date() }
            : event
        ))
        
        // Also refresh data to ensure consistency
        await fetchData()
      } else {
        const errorData = await response.json()
        console.error('Error completing event:', errorData)
      }
    } catch (error) {
      console.error('Error completing event:', error)
    }
  }

  const handleEventPostpone = async (eventId: string) => {
    try {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      tomorrow.setHours(0, 0, 0, 0)
      
      const response = await fetch('/api/cesta/smart-events/postpone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          interactionId: eventId,
          postponedTo: tomorrow.toISOString().split('T')[0]
        })
      })
      
      if (response.ok) {
        // Update local state immediately - remove from today's events
        setEvents(prev => prev.filter(event => event.id !== eventId))
        
        // Also refresh data to ensure consistency
        await fetchData()
      } else {
        const errorData = await response.json()
        console.error('Error postponing event:', errorData)
      }
    } catch (error) {
      console.error('Error postponing event:', error)
    }
  }

  const handleEventSelect = (event: Event) => {
    setSelectedEvent(event)
    setSelectedStep(null) // Clear selected step when selecting event
  }

  const handleGoalOnboardingComplete = async (goalData: any) => {
    console.log('Frontend: Starting goal creation with data:', goalData)
    try {
      const response = await fetch('/api/cesta/goals-with-steps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(goalData)
      })
      
      console.log('Frontend: API response status:', response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log('Frontend: Goal created successfully:', data)
        if (data?.goal) setGoals(prev => [...prev, data.goal])
        if (Array.isArray(data?.steps)) setDailySteps(prev => [...prev, ...data.steps])
        setShowGoalOnboarding(false)
        
        // Refresh data to ensure all changes are reflected
        console.log('Frontend: Refreshing data...')
        fetchData()
      } else {
        const errorData = await response.json()
        console.error('Frontend: API error:', errorData)
      }
    } catch (error) {
      console.error('Frontend: Error adding goal:', error)
    }
  }

  const handleGoalClick = (goal: Goal) => {
    setSelectedGoal(goal)
    setShowGoalDetails(true)
  }

  const handleGoalUpdate = async (updatedGoal: Goal) => {
    try {
      // Prepare goal data for API
      const goalData = {
        title: updatedGoal.title,
        description: updatedGoal.description,
        targetDate: updatedGoal.target_date ? 
          (typeof updatedGoal.target_date === 'string' ? 
            new Date(updatedGoal.target_date) : 
            updatedGoal.target_date
          ) : null,
        priority: updatedGoal.priority,
        status: updatedGoal.status
      }

      // First update basic goal info
      const response = await fetch(`/api/cesta/goals/${updatedGoal.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(goalData)
      })
      
      if (response.ok) {
        // Update progress using combined formula (50% metrics + 50% steps)
        await fetch(`/api/cesta/goals/${updatedGoal.id}/progress-combined`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        })

        // Refresh data to ensure all changes are reflected
        await fetchData()
      }
    } catch (error) {
      console.error('Error updating goal:', error)
    }
  }

  const handleGoalDelete = async (goalId: string) => {
    try {
      const response = await fetch(`/api/cesta/goals/${goalId}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        setGoals(prev => prev.filter(goal => goal.id !== goalId))
        setShowGoalDetails(false)
        setSelectedGoal(null)
        
        // Refresh data to ensure all changes are reflected
        fetchData()
      }
    } catch (error) {
      console.error('Error deleting goal:', error)
    }
  }

  const handleStepSelect = (step: DailyStep) => {
    if (selectedStep && selectedStep.id === step.id) {
      // If clicking the same step, deselect it
      setSelectedStep(null)
    } else {
      // Select the new step
      setSelectedStep(step)
      setSelectedEvent(null) // Clear selected event when selecting step
    }
  }


  const handleValueUpdate = (updatedValue: Value) => {
    setValues(prev => {
      const existing = prev.find(value => value.id === updatedValue.id)
      if (existing) {
        return prev.map(value => value.id === updatedValue.id ? updatedValue : value)
      } else {
        return [...prev, updatedValue]
      }
    })
  }

  const handleStepAddToDailyPlan = async (stepId: string) => {
    const newPlannedSteps = [...plannedStepIds, stepId]
    setPlannedStepIds(newPlannedSteps)
    
    // Update daily planning via API
    try {
      await fetch('/api/cesta/daily-planning', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: new Date().toISOString().split('T')[0],
          planned_steps: newPlannedSteps
        })
      })
    } catch (error) {
      console.error('Error updating daily planning:', error)
    }
  }

  const handleStepDelete = async (stepId: string) => {
    try {
      const response = await fetch(`/api/cesta/daily-steps/${stepId}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        setDailySteps(prev => prev.filter(step => step.id !== stepId))
        // Remove from planned steps if it was there
        setPlannedStepIds(prev => prev.filter(id => id !== stepId))
      }
    } catch (error) {
      console.error('Error deleting step:', error)
    }
  }

  const handleStepUpdate = (stepId: string, updates: Partial<DailyStep>) => {
    return new Promise<void>((resolve, reject) => {
      fetch(`/api/cesta/daily-steps/${stepId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      })
      .then(response => {
        if (response.ok) {
          setDailySteps(prev => 
            prev.map(step => 
              step.id === stepId ? { ...step, ...updates } : step
            )
          )
          resolve()
        } else {
          reject(new Error('Failed to update step'))
        }
      })
      .catch(reject)
    })
  }

  const handleValueDelete = (valueId: string) => {
    setValues(prev => prev.filter(value => value.id !== valueId))
  }


  const handleStepToggle = async (stepId: string, completed: boolean) => {
    try {
      const response = await fetch(`/api/cesta/daily-steps/${stepId}/toggle`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed })
      })
      
      if (response.ok) {
        // Update daily steps
        setDailySteps(prev => prev.map(step => 
          step.id === stepId ? { ...step, completed, completed_at: completed ? new Date() : undefined } : step
        ))
        
        // Update goals to refresh progress
        setGoals(prev => 
          prev.map(goal => {
            // Find the step to get its goal_id
            const step = dailySteps.find(s => s.id === stepId)
            if (step && step.goal_id === goal.id) {
              // For steps-based goals, we need to recalculate progress
              if (goal.progress_type === 'steps') {
                const allStepsForGoal = dailySteps.filter(s => s.goal_id === goal.id)
                const completedSteps = allStepsForGoal.filter(s => s.id === stepId ? completed : s.completed).length
                const totalSteps = allStepsForGoal.length
                const newProgressPercentage = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0
                
                return {
                  ...goal,
                  progress_percentage: newProgressPercentage
                }
              }
            }
            return goal
          })
        )
      } else {
        console.error('Error toggling step:', await response.text())
      }
    } catch (error) {
      console.error('Error updating step:', error)
    }
  }

  const handleEditGoal = (goal: Goal) => {
    setGoals(prevGoals => prevGoals.map(g => g.id === goal.id ? goal : g))
  }

  const handleProgressUpdate = async () => {
    if (!selectedGoal || !progressValue) return

    try {
      const response = await fetch(`/api/cesta/goals/${selectedGoal.id}/update-progress`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          progressType: selectedGoal.progress_type || 'percentage',
          value: parseFloat(progressValue)
        })
      })

      if (response.ok) {
        // Update local state
        setGoals(prev => prev.map(goal => 
          goal.id === selectedGoal.id 
            ? { 
                ...goal, 
                progress_current: parseFloat(progressValue),
                progress_percentage: selectedGoal.progress_type === 'percentage' 
                  ? parseFloat(progressValue) 
                  : selectedGoal.progress_target 
                    ? Math.round((parseFloat(progressValue) / selectedGoal.progress_target) * 100)
                    : 0
              }
            : goal
        ))
        
        setSelectedGoal(prev => prev ? {
          ...prev,
          progress_current: parseFloat(progressValue),
          progress_percentage: prev.progress_type === 'percentage' 
            ? parseFloat(progressValue) 
            : prev.progress_target 
              ? Math.round((parseFloat(progressValue) / prev.progress_target) * 100)
              : 0
        } : null)
        
        setEditingProgress(false)
        setProgressValue('')
        alert(translations?.app.progressUpdated || 'Pokrok byl úspěšně aktualizován!')
      } else {
        const error = await response.json()
        alert(`${translations?.app.errorUpdatingProgress || 'Chyba při aktualizaci pokroku'}: ${error.error || (translations?.common.unknownError || 'Neznámá chyba')}`)
      }
    } catch (error) {
      console.error('Error updating progress:', error)
      alert(translations?.app.errorUpdatingProgress || 'Chyba při aktualizaci pokroku')
    }
  }

  // Removed unused in-place edit modal logic; edits flow via GoalDetailModal or GameCenter

  const getProgressDisplay = (goal: Goal) => {
    const goalSteps = dailySteps.filter(step => step.goal_id === goal.id)
    
    switch (goal.progress_type) {
      case 'count':
        return `${goal.progress_current || 0} / ${goal.progress_target || 0} ${goal.progress_unit || 'krát'}`
      case 'amount':
        return `${(goal.progress_current || 0).toLocaleString()} / ${(goal.progress_target || 0).toLocaleString()} ${goal.progress_unit || 'Kč'}`
      case 'steps':
        const completedSteps = goalSteps.filter(s => s.completed).length
        const totalSteps = goalSteps.length
        return `${completedSteps} / ${totalSteps} kroků`
      default:
        return `${goal.progress_percentage || 0}%`
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Načítám vaši cestu...</p>
        </div>
      </div>
    )
  }

  const getGoalSortPriority = (goal: Goal) => {
    const goalSteps = dailySteps.filter(step => step.goal_id === goal.id)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    // Calculate overdue steps
    const overdueSteps = goalSteps.filter(step => {
      if (step.completed) return false
      const stepDate = new Date(step.date)
      stepDate.setHours(0, 0, 0, 0)
      return stepDate < today
    })
    
    // Find most overdue step
    const mostOverdueStep = overdueSteps.length > 0 
      ? overdueSteps.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0]
      : null
    
    // Calculate how many days overdue the most overdue step is
    const mostOverdueDays = mostOverdueStep 
      ? Math.ceil((today.getTime() - new Date(mostOverdueStep.date).getTime()) / (1000 * 60 * 60 * 24))
      : 0
    
    // Calculate days remaining to goal deadline
    const daysRemaining = goal.target_date 
      ? Math.ceil((new Date(goal.target_date).getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
      : 999999 // Very far future if no target date
    
    return { mostOverdueDays, daysRemaining }
  }

  const sortGoalsByPriority = (goals: Goal[]) => {
    return goals.sort((a, b) => {
      const priorityA = getGoalSortPriority(a)
      const priorityB = getGoalSortPriority(b)
      
      // Priority 1: Goals with overdue steps
      if (priorityA.mostOverdueDays > 0 && priorityB.mostOverdueDays === 0) return -1
      if (priorityB.mostOverdueDays > 0 && priorityA.mostOverdueDays === 0) return 1
      
      // Priority 2: Among goals with overdue steps, sort by most overdue days
      if (priorityA.mostOverdueDays > 0 && priorityB.mostOverdueDays > 0) {
        return priorityB.mostOverdueDays - priorityA.mostOverdueDays
      }
      
      // Priority 3: Among goals without overdue steps, sort by closest deadline
      return priorityA.daysRemaining - priorityB.daysRemaining
    })
  }

  const activeGoals = goals.filter(goal => goal.status === 'active')
  const completedSteps = dailySteps.filter(step => step.completed).length
  
  // Calculate overdue steps (not completed and date is before today)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const overdueSteps = dailySteps.filter(step => {
    if (step.completed) return false
    const stepDate = new Date(step.date)
    stepDate.setHours(0, 0, 0, 0)
    return stepDate < today
  }).length
  
  // Total steps includes overdue steps
  const totalSteps = dailySteps.length + overdueSteps

  return (
    <div className="h-full bg-background flex flex-col">
      <style jsx>{`
        @keyframes progressFill {
          0% {
            width: 0%;
            opacity: 0.7;
          }
          100% {
            opacity: 1;
          }
        }
        
        .progress-bar-animated {
          animation: progressFill 1s ease-out forwards;
        }
      `}</style>
      {/* Main Content - 3 Column Layout */}
      <main className="flex-1 flex min-h-0">
                    {/* Left Column - Goals */}
                    <div className={`${expandedColumn === 'goals' ? 'w-full' : 'w-16 lg:w-80'} bg-white border-r border-gray-200 flex flex-col transition-all duration-300`}>
                     <div className="p-2 lg:p-6 border-b border-gray-200 flex-shrink-0">
                     <div className="flex items-center justify-between mb-2">
                       <div className="flex items-center space-x-3">
                         <div className="flex items-center space-x-2">
                           <h2 className="text-xl font-bold text-gray-900 hidden lg:block">Přehled</h2>
                           <h2 className="text-lg font-bold text-gray-900 lg:hidden">📊</h2>
                           <button
                             onClick={() => setExpandedColumn(expandedColumn === 'goals' ? null : 'goals')}
                             className="p-1 hover:bg-gray-100 rounded transition-colors"
                             title={expandedColumn === 'goals' ? (translations?.common.close || 'Zavřít') : (translations?.common.expand || 'Rozbalit')}
                           >
                             {expandedColumn === 'goals' ? (
                               <ChevronLeft className="w-4 h-4 text-gray-600" />
                             ) : (
                               <ChevronRight className="w-4 h-4 text-gray-600" />
                             )}
                           </button>
                         </div>
                       </div>
                       <button
                         onClick={() => setShowGoalOnboarding(true)}
                         className="inline-flex items-center justify-center w-8 h-8 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
                         title="Přidat cíl"
                       >
                         <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                         </svg>
                       </button>
                     </div>
                     <p className="text-sm text-gray-600 hidden lg:block">Přehled cílů podle životních oblastí</p>
                   </div>
                  <div className="flex-1 overflow-y-auto p-2 lg:p-6">
                    <OverviewPanel 
                      goals={goals}
                      onGoalClick={handleGoalClick}
                    />
                  </div>
                </div>

                    {/* Center Column - Game Center */}
                    <div className={`${expandedColumn ? 'hidden' : 'flex-1'} bg-background transition-all duration-300`}>
                      <GameCenter 
                        values={values}
                        dailySteps={dailySteps}
                        events={events}
                        goals={goals}
                        plannedStepIds={plannedStepIds}
                        selectedStep={selectedStep}
                        selectedEvent={selectedEvent}
                        onValueUpdate={handleValueUpdate}
                        onGoalUpdate={handleGoalUpdate}
                        onStepUpdate={handleStepUpdate}
                        onStepDelete={handleStepDelete}
                        onStepComplete={handleStepComplete}
                        onStepRemoveFromPlan={handleStepAddToDailyPlan}
                        onEventComplete={handleEventComplete}
                        onEventPostpone={handleEventPostpone}
                        onPlannedStepsChange={setPlannedStepIds}
                        onStepAdd={handleStepAddToPlan}
                      />
                    </div>

                {/* Right Column - Daily Steps */}
                <div className={`${expandedColumn === 'steps' ? 'w-full' : 'w-80'} bg-white border-l border-gray-200 flex flex-col transition-all duration-300`}>
                 <div className="p-6 border-b border-gray-200 flex-shrink-0">
                   <div className="flex items-center justify-between mb-2">
                     <div className="flex items-center space-x-3">
                       <button
                         onClick={() => setExpandedColumn(expandedColumn === 'steps' ? null : 'steps')}
                         className="p-1 hover:bg-gray-100 rounded transition-colors"
                         title={expandedColumn === 'steps' ? (translations?.common.close || 'Zavřít') : (translations?.common.expand || 'Rozbalit')}
                       >
                         {expandedColumn === 'steps' ? (
                           <ChevronRight className="w-4 h-4 text-gray-600" />
                         ) : (
                           <ChevronLeft className="w-4 h-4 text-gray-600" />
                         )}
                       </button>
                       <h2 className="text-xl font-bold text-gray-900">{translations?.app.nextSteps || 'Další kroky'}</h2>
                     </div>
                     <button
                       onClick={() => setShowDailyCheckInAddModal(true)}
                       className="inline-flex items-center justify-center w-8 h-8 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
                       title="Přidat krok"
                     >
                       <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                       </svg>
                     </button>
                   </div>
                   <p className="text-sm text-gray-600">{translations?.app.whatWillYouDoToday || 'Co dnes uděláte?'}</p>
                 </div>
                  <div className="flex-1 overflow-y-auto">
                    {expandedColumn === 'steps' ? (
                      // EXPANDOVANÉ ZOBRAZENÍ - Rozdělení kroků podle stavu do 3 sloupců
                      <div className="grid grid-cols-3 gap-6 h-full p-6">
                        
                        {/* ZPOŽDĚNÉ KROKY */}
                        <div className="space-y-4">
                          <h3 className="text-lg font-semibold text-red-600 border-b border-red-200 pb-2">
                            Zpožděné kroky ({dailySteps.filter(step => {
                              const stepDate = new Date(step.date)
                              stepDate.setHours(0, 0, 0, 0)
                              const today = new Date()
                              today.setHours(0, 0, 0, 0)
                              return stepDate < today && !step.completed
                            }).length})
                          </h3>
                          <div className="space-y-3">
                            {dailySteps
                              .filter(step => {
                                const stepDate = new Date(step.date)
                                stepDate.setHours(0, 0, 0, 0)
                                const today = new Date()
                                today.setHours(0, 0, 0, 0)
                                return stepDate < today && !step.completed
                              })
                              .map((step) => {
                                const goal = goals.find(g => g.id === step.goal_id)
                                return (
                                  <div
                                    key={step.id}
                                    className="bg-red-50 border border-red-200 rounded-lg p-3 cursor-pointer hover:bg-red-100 transition-colors"
                                    onClick={() => handleStepSelect(step)}
                                  >
                                    <div className="flex items-start space-x-2">
                                      <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <span className="text-white text-xs">!</span>
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <h4 className="text-sm font-medium text-gray-900 truncate">
                                          {step.title}
                                        </h4>
                                        {goal && (
                                          <p className="text-xs text-gray-500 truncate">
                                            {goal.icon && `${getIconEmoji(goal.icon)} `}{goal.title}
                                          </p>
                                        )}
                                        <p className="text-xs text-red-600 mt-1">
                                          {translations?.app.overdue || 'Zpožděno'}: {new Date(step.date).toLocaleDateString('cs-CZ')}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                )
                              })}
                            {dailySteps.filter(step => {
                              const stepDate = new Date(step.date)
                              stepDate.setHours(0, 0, 0, 0)
                              const today = new Date()
                              today.setHours(0, 0, 0, 0)
                              return stepDate < today && !step.completed
                            }).length === 0 && (
                              <p className="text-sm text-gray-500 text-center py-4">Žádné zpožděné kroky</p>
                            )}
                          </div>
                        </div>

                        {/* ČEKAJÍCÍ KROKY */}
                        <div className="space-y-4">
                          <h3 className="text-lg font-semibold text-primary-600 border-b border-primary-200 pb-2">
                            Čekající kroky ({dailySteps.filter(step => {
                              const stepDate = new Date(step.date)
                              stepDate.setHours(0, 0, 0, 0)
                              const today = new Date()
                              today.setHours(0, 0, 0, 0)
                              return stepDate >= today && !step.completed
                            }).length})
                          </h3>
                          <div className="space-y-3">
                            {dailySteps
                              .filter(step => {
                                const stepDate = new Date(step.date)
                                stepDate.setHours(0, 0, 0, 0)
                                const today = new Date()
                                today.setHours(0, 0, 0, 0)
                                return stepDate >= today && !step.completed
                              })
                              .map((step) => {
                                const goal = goals.find(g => g.id === step.goal_id)
                                const stepDate = new Date(step.date)
                                stepDate.setHours(0, 0, 0, 0)
                                const today = new Date()
                                today.setHours(0, 0, 0, 0)
                                const isToday = stepDate.getTime() === today.getTime()
                                
                                return (
                                  <div
                                    key={step.id}
                                    className={`rounded-lg p-3 cursor-pointer transition-colors ${
                                      isToday 
                                        ? 'bg-primary-50 border border-primary-200 hover:bg-primary-100' 
                                        : 'bg-gray-50 border border-gray-200 hover:bg-gray-100'
                                    }`}
                                    onClick={() => handleStepSelect(step)}
                                  >
                                    <div className="flex items-start space-x-2">
                                      <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                                        isToday ? 'bg-primary-500' : 'bg-gray-400'
                                      }`}>
                                        <span className="text-white text-xs">📅</span>
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <h4 className={`text-sm font-medium truncate ${
                                          isToday ? 'text-gray-900' : 'text-gray-600'
                                        }`}>
                                          {step.title}
                                        </h4>
                                        {goal && (
                                          <p className="text-xs text-gray-500 truncate">
                                            {goal.icon && `${getIconEmoji(goal.icon)} `}{goal.title}
                                          </p>
                                        )}
                                        <p className={`text-xs mt-1 ${
                                          isToday ? 'text-primary-600' : 'text-gray-500'
                                        }`}>
                                          {isToday ? (translations?.app.today || 'Dnes') + ': ' : (translations?.app.future || 'Budoucí') + ': '}{new Date(step.date).toLocaleDateString('cs-CZ')}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                )
                              })}
                            {dailySteps.filter(step => {
                              const stepDate = new Date(step.date)
                              stepDate.setHours(0, 0, 0, 0)
                              const today = new Date()
                              today.setHours(0, 0, 0, 0)
                              return stepDate >= today && !step.completed
                            }).length === 0 && (
                              <p className="text-sm text-gray-500 text-center py-4">Žádné čekající kroky</p>
                            )}
                          </div>
                        </div>

                        {/* DOKONČENÉ KROKY */}
                        <div className="space-y-4">
                          <h3 className="text-lg font-semibold text-green-600 border-b border-green-200 pb-2">
                            Dokončené kroky ({dailySteps.filter(step => step.completed).length})
                          </h3>
                          <div className="space-y-3">
                            {dailySteps
                              .filter(step => step.completed)
                              .slice(0, 10) // Zobrazit pouze posledních 10 dokončených kroků
                              .map((step) => {
                                const goal = goals.find(g => g.id === step.goal_id)
                                return (
                                  <div
                                    key={step.id}
                                    className="bg-green-50 border border-green-200 rounded-lg p-3 cursor-pointer hover:bg-green-100 transition-colors"
                                    onClick={() => handleStepSelect(step)}
                                  >
                                    <div className="flex items-start space-x-2">
                                      <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <span className="text-white text-xs">✓</span>
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <h4 className="text-sm font-medium text-gray-900 truncate line-through">
                                          {step.title}
                                        </h4>
                                        {goal && (
                                          <p className="text-xs text-gray-500 truncate">
                                            {goal.icon && `${getIconEmoji(goal.icon)} `}{goal.title}
                                          </p>
                                        )}
                                        <p className="text-xs text-green-600 mt-1">
                                          {translations?.app.completed || 'Dokončeno'}: {new Date(step.date).toLocaleDateString('cs-CZ')}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                )
                              })}
                            {dailySteps.filter(step => step.completed).length === 0 && (
                              <p className="text-sm text-gray-500 text-center py-4">Žádné dokončené kroky</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : (
                      // NORMÁLNÍ ZOBRAZENÍ - Pouze DailyCheckIn
                      <DailyCheckIn
                        dailySteps={dailySteps}
                        events={events}
                        goals={goals}
                        values={values}
                        plannedStepIds={plannedStepIds}
                        onStepAdd={handleStepAddNoPlan}
                        onStepUpdate={handleStepUpdate}
                        onStepDelete={handleStepDelete}
                        onStepComplete={handleStepComplete}
                        onStepAddToDailyPlan={handleStepAddToDailyPlan}
                        showAddStepModal={showDailyCheckInAddModal}
                        onAddStepModalClose={() => setShowDailyCheckInAddModal(false)}
                      />
                    )}
                  </div>
                </div>
              </main>

      {/* Goal Details Dialog */}
      {showGoalDetails && selectedGoal && (
        <GoalDetailModal
          goal={selectedGoal}
          steps={dailySteps.filter(step => step.goal_id === selectedGoal.id)}
          onClose={() => {
            setShowGoalDetails(false)
            setSelectedGoal(null)
          }}
          onStepClick={(step) => {
            // TODO: Implement step click functionality
            console.log('Step clicked:', step)
          }}
          onStepComplete={handleStepComplete}
          onStepEdit={(step: DailyStep) => {
            // TODO: Implement step edit functionality
            console.log('Step edit:', step)
          }}
          onStepAdd={handleAddStep}
          onEdit={handleEditGoal}
          onDelete={handleGoalDelete}
        />
      )}

      {/* Progress Edit Modal */}
      {editingProgress && selectedGoal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">{translations?.app.editGoalProgress || 'Upravit pokrok cíle'}</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {selectedGoal.progress_type === 'percentage' ? (translations?.app.progressPercentage || 'Pokrok (%)') : 
                   selectedGoal.progress_type === 'count' ? (translations?.app.count || `Počet (${selectedGoal.progress_unit || 'krát'})`) :
                   selectedGoal.progress_type === 'amount' ? (translations?.app.amount || `Částka (${selectedGoal.progress_unit || 'Kč'})`) :
                   (translations?.app.progress || 'Pokrok')}
                </label>
                <input
                  type="number"
                  value={progressValue}
                  onChange={(e) => setProgressValue(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder={selectedGoal.progress_type === 'percentage' ? '0-100' : '0'}
                  min="0"
                  max={selectedGoal.progress_type === 'percentage' ? '100' : undefined}
                />
                {selectedGoal.progress_target && (
                  <p className="text-xs text-gray-500 mt-1">
                    {translations?.app.goal || 'Cíl'}: {selectedGoal.progress_target} {selectedGoal.progress_unit || ''}
                  </p>
                )}
              </div>
            </div>
            
            <div className="flex space-x-3 mt-6">
              <button
                onClick={handleProgressUpdate}
                className="flex-1 bg-primary-500 hover:bg-primary-600 text-white py-2 px-4 rounded-lg font-medium transition-colors"
              >
                {translations?.common.save || 'Uložit'}
              </button>
              <button
                onClick={() => setEditingProgress(false)}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 px-4 rounded-lg font-medium transition-colors"
              >
                {translations?.common.cancel || 'Zrušit'}
              </button>
            </div>
          </div>
        </div>
      )}

        {/* Goal Onboarding Modal */}
        {showGoalOnboarding && (
          <NewGoalOnboarding
            onComplete={handleGoalOnboardingComplete}
            onCancel={() => setShowGoalOnboarding(false)}
          />
        )}

        {/* Add Step Modal - removed, using inline modal instead */}
    </div>
  )
})

export default MainDashboard
