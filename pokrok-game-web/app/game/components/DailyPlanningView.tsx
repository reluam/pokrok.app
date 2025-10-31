'use client'

import { useState, useEffect } from 'react'
import { DndContext, DragEndEvent, closestCenter } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GameLayout } from './GameLayout'
import { SettingsView } from './SettingsView'
import { GoalsManagementView } from './GoalsManagementView'
import { HabitsManagementView } from './HabitsManagementView'
import { StatisticsView } from './StatisticsView'
import { AchievementsView } from './AchievementsView'

interface DailyPlanningViewProps {
  player: any
  goals: any[]
  habits: any[]
  onGoalsUpdate: (goals: any[]) => void
  onHabitsUpdate: (habits: any[]) => void
  onPlayerUpdate: (player: any) => void
  onBack?: () => void
  onDailyStepsUpdate?: (steps: any[]) => void
}

type ViewMode = 'daily-planning' | 'current-step' | 'goals' | 'habits' | 'statistics' | 'achievements' | 'settings'

interface DailyStep {
  id: string
  title: string
  description?: string
  goalId: string
  completed: boolean
  isImportant: boolean
  isUrgent: boolean
  estimatedTime?: number // in minutes
}

// Sortable Step Component
function SortableStep({ step, index, onRemove, isCurrent }: { 
  step: DailyStep, 
  index: number, 
  onRemove: (id: string) => void,
  isCurrent?: boolean 
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: step.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`p-4 bg-gray-50 rounded-lg border-2 transition-all cursor-move ${
        isCurrent
          ? 'border-purple-500 bg-purple-50'
          : step.completed
          ? 'border-green-500 bg-green-50'
          : 'border-gray-200 hover:border-purple-300'
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold text-gray-500">#{index + 1}</span>
          <div>
            <h4 className="font-bold text-gray-900">{step.title}</h4>
            {step.description && (
              <p className="text-sm text-gray-600">{step.description}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {step.completed && <span className="text-xs bg-green-500 text-white px-2 py-1 rounded">✓</span>}
          {isCurrent && <span className="text-xs bg-purple-500 text-white px-2 py-1 rounded">Aktuální</span>}
          <button
            onClick={() => onRemove(step.id)}
            className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
          >
            Odebrat
          </button>
        </div>
      </div>
      <div className="mt-2 text-xs text-gray-500">
        ⏱️ {step.estimatedTime}min
      </div>
    </div>
  )
}

export function DailyPlanningView({ 
  player, 
  goals, 
  habits, 
  onGoalsUpdate, 
  onHabitsUpdate, 
  onPlayerUpdate,
  onBack,
  onDailyStepsUpdate
}: DailyPlanningViewProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('daily-planning')
  const [dailySteps, setDailySteps] = useState<DailyStep[]>([])
  const [allSteps, setAllSteps] = useState<DailyStep[]>([])
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [isPlanningMode, setIsPlanningMode] = useState(false)
  const [newStepTitle, setNewStepTitle] = useState('')
  const [newStepDescription, setNewStepDescription] = useState('')
  const [selectedGoalId, setSelectedGoalId] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [currentDate] = useState(new Date().toISOString().split('T')[0]) // Today's date

  // Load daily steps from database
  useEffect(() => {
    const loadDailySteps = async () => {
      if (!player?.user_id) return

      setIsLoading(true)
      try {
        const response = await fetch(`/api/daily-steps?userId=${player.user_id}&date=${currentDate}`)
        if (response.ok) {
          const steps = await response.json()
          setDailySteps(steps)
          onDailyStepsUpdate?.(steps)
        }
      } catch (error) {
        console.error('Error loading daily steps:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadDailySteps()
  }, [player?.user_id, currentDate])

  // Load steps from goals for sidebar
  useEffect(() => {
    const stepsFromGoals: DailyStep[] = goals.flatMap(goal => 
      goal.steps?.map((step: any) => ({
        id: `${goal.id}-${step.id}`,
        title: step.title || step.name || 'Krok',
        description: step.description,
        goalId: goal.id,
        completed: false,
        isImportant: step.isImportant || false,
        isUrgent: step.isUrgent || false,
        estimatedTime: step.estimatedTime || 30
      })) || []
    )
    setAllSteps(stepsFromGoals)
  }, [goals])

  const handleAddStepToDaily = async (step: DailyStep) => {
    if (!player?.user_id || dailySteps.find(s => s.id === step.id)) return

    try {
      const response = await fetch('/api/daily-steps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: player.user_id,
          goalId: step.goalId,
          title: step.title,
          description: step.description,
          date: currentDate,
          isImportant: step.isImportant,
          isUrgent: step.isUrgent,
          stepType: 'custom',
          customTypeName: step.goalId ? 'goal-step' : 'custom-step',
          estimatedTime: step.estimatedTime
        })
      })

      if (response.ok) {
        const createdStep = await response.json()
        setDailySteps(prev => [...prev, createdStep])
      }
    } catch (error) {
      console.error('Error adding step to daily plan:', error)
    }
  }

  const handleRemoveStepFromDaily = async (stepId: string) => {
    try {
      const response = await fetch(`/api/daily-steps?stepId=${stepId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setDailySteps(prev => prev.filter(s => s.id !== stepId))
      }
    } catch (error) {
      console.error('Error removing step from daily plan:', error)
    }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (active.id !== over?.id) {
      setDailySteps((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id)
        const newIndex = items.findIndex((item) => item.id === over?.id)
        return arrayMove(items, oldIndex, newIndex)
      })
    }
  }

  const handleCompleteStep = async (stepId: string) => {
    try {
      const response = await fetch('/api/daily-steps', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stepId,
          completed: true,
          completedAt: new Date().toISOString()
        })
      })

      if (response.ok) {
        setDailySteps(prev => 
          prev.map(step => 
            step.id === stepId 
              ? { ...step, completed: true, completed_at: new Date() }
              : step
          )
        )
        
        // Move to next step if current step was completed
        const currentStep = dailySteps[currentStepIndex]
        if (currentStep && currentStep.id === stepId) {
          const nextIndex = dailySteps.findIndex(s => !s.completed && s.id !== stepId)
          if (nextIndex !== -1) {
            setCurrentStepIndex(nextIndex)
          }
        }
      }
    } catch (error) {
      console.error('Error completing step:', error)
    }
  }

  const handleCreateNewStep = async () => {
    if (!newStepTitle.trim() || !player?.user_id) return

    try {
      const response = await fetch('/api/daily-steps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: player.user_id,
          goalId: selectedGoalId || null,
          title: newStepTitle.trim(),
          description: newStepDescription.trim(),
          date: currentDate,
          isImportant: false,
          isUrgent: false,
          stepType: 'custom',
          customTypeName: 'custom-step',
          estimatedTime: 30
        })
      })

      if (response.ok) {
        const createdStep = await response.json()
        setAllSteps(prev => [...prev, createdStep])
        setNewStepTitle('')
        setNewStepDescription('')
        setSelectedGoalId('')
      }
    } catch (error) {
      console.error('Error creating new step:', error)
    }
  }

  const handleStartDailyPlanning = () => {
    setIsPlanningMode(true)
    setDailySteps([])
  }

  const handleFinishPlanning = () => {
    setIsPlanningMode(false)
    if (dailySteps.length > 0) {
      setCurrentStepIndex(0)
      setViewMode('current-step')
    }
  }

  const renderCurrentView = () => {
    switch (viewMode) {
      case 'daily-planning':
        return (
          <div className="flex h-full">
            {/* Main Content */}
            <div className="flex-1 pr-4">
              <div className="bg-white rounded-xl shadow-lg p-6 mb-4">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-bold text-gray-900">📅 DENNÍ PLÁNOVÁNÍ</h2>
                  {onBack && (
                    <button
                      onClick={onBack}
                      className="px-4 py-2 rounded-lg bg-gray-500 text-white hover:bg-gray-600 transition-colors"
                    >
                      ← Zpět
                    </button>
                  )}
                </div>
                
                {isLoading ? (
                  <div className="text-center py-8">
                    <p className="text-lg text-gray-600 mb-6">
                      Načítání denních kroků...
                    </p>
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto"></div>
                  </div>
                ) : !isPlanningMode ? (
                  <div className="text-center py-8">
                    <p className="text-lg text-gray-600 mb-6">
                      Připravte si svůj denní plán a začněte dosahovat svých cílů!
                    </p>
                    <button
                      onClick={handleStartDailyPlanning}
                      className="px-8 py-4 rounded-xl font-bold bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 shadow-lg transition-all duration-300"
                    >
                      🚀 ZAČÍT PLÁNOVÁNÍ
                    </button>
                  </div>
                ) : (
                  <div>
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-xl font-bold text-gray-900">Sestavte svůj denní plán</h3>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setIsPlanningMode(false)}
                          className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                        >
                          Zrušit
                        </button>
                        <button
                          onClick={handleFinishPlanning}
                          disabled={dailySteps.length === 0}
                          className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Dokončit plán ({dailySteps.length})
                        </button>
                      </div>
                    </div>

                    {/* Daily Steps List */}
                    <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                      <SortableContext items={dailySteps.map(s => s.id)} strategy={verticalListSortingStrategy}>
                        <div className="space-y-3 mb-6">
                          {dailySteps.map((step, index) => (
                            <SortableStep
                              key={step.id}
                              step={step}
                              index={index}
                              onRemove={handleRemoveStepFromDaily}
                            />
                          ))}
                        </div>
                      </SortableContext>
                    </DndContext>

                    {/* Add Custom Step */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-bold text-gray-900 mb-3">Přidat vlastní krok</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-1">Název kroku</label>
                          <input
                            type="text"
                            value={newStepTitle}
                            onChange={(e) => setNewStepTitle(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none"
                            placeholder="Např. Cvičit 30 minut"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-1">Cíl</label>
                          <select
                            value={selectedGoalId}
                            onChange={(e) => setSelectedGoalId(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none"
                          >
                            <option value="">Vyberte cíl</option>
                            {goals.map(goal => (
                              <option key={goal.id} value={goal.id}>{goal.title}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div className="mt-3">
                        <label className="block text-sm font-bold text-gray-700 mb-1">Popis (volitelné)</label>
                        <textarea
                          value={newStepDescription}
                          onChange={(e) => setNewStepDescription(e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none resize-none"
                          rows={2}
                          placeholder="Podrobnější popis kroku..."
                        />
                      </div>
                      <button
                        onClick={handleCreateNewStep}
                        disabled={!newStepTitle.trim() || !selectedGoalId}
                        className="mt-3 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Přidat krok
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Steps Sidebar */}
            <div className="w-80 bg-white rounded-xl shadow-lg p-4">
              <h3 className="text-lg font-bold text-gray-900 mb-4">📋 VŠECHNY KROKY</h3>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {allSteps.map((step) => {
                  const isInDaily = dailySteps.some(s => s.id === step.id)
                  return (
                    <div
                      key={step.id}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        isInDaily 
                          ? 'border-green-500 bg-green-50' 
                          : 'border-gray-200 bg-gray-50 hover:border-purple-300'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-bold text-sm text-gray-900">{step.title}</h4>
                        {isInDaily ? (
                          <span className="text-xs bg-green-500 text-white px-2 py-1 rounded">V plánu</span>
                        ) : (
                          <button
                            onClick={() => handleAddStepToDaily(step)}
                            className="text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600 transition-colors"
                          >
                            Přidat
                          </button>
                        )}
                      </div>
                      {step.description && (
                        <p className="text-xs text-gray-600 mb-2">{step.description}</p>
                      )}
                      <div className="flex gap-2 text-xs text-gray-500">
                        <span>⏱️ {step.estimatedTime}min</span>
                        {step.isImportant && <span>⭐ Důležité</span>}
                        {step.isUrgent && <span>🔥 Urgentní</span>}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )

      case 'current-step':
        const currentStep = dailySteps[currentStepIndex]
        if (!currentStep) {
          return (
            <div className="text-center py-16">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">🎉 Všechny kroky dokončeny!</h2>
              <p className="text-lg text-gray-600 mb-6">Skvělá práce! Můžete začít nový den.</p>
              <button
                onClick={() => setViewMode('daily-planning')}
                className="px-8 py-4 rounded-xl font-bold bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 shadow-lg transition-all duration-300"
              >
                🚀 Nový den
              </button>
            </div>
          )
        }

        return (
          <div className="flex h-full">
            {/* Main Content - Current Step */}
            <div className="flex-1 pr-4">
              <div className="bg-white rounded-xl shadow-lg p-6 mb-4">
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">🎯 AKTUÁLNÍ KROK</h2>
                  <p className="text-gray-600">Krok {currentStepIndex + 1} z {dailySteps.length}</p>
                </div>

                <div className="bg-gradient-to-r from-purple-100 to-blue-100 rounded-lg p-6 mb-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{currentStep.title}</h3>
                  {currentStep.description && (
                    <p className="text-gray-700 mb-4">{currentStep.description}</p>
                  )}
                  <div className="flex gap-4 text-sm text-gray-600">
                    <span>⏱️ Odhadovaný čas: {currentStep.estimatedTime} minut</span>
                    {currentStep.isImportant && <span>⭐ Důležité</span>}
                    {currentStep.isUrgent && <span>🔥 Urgentní</span>}
                  </div>
                </div>

                <div className="text-center">
                  <button
                    onClick={() => handleCompleteStep(currentStep.id)}
                    className="px-8 py-4 rounded-xl font-bold bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 shadow-lg transition-all duration-300"
                  >
                    ✅ DOKONČIT KROK
                  </button>
                </div>
              </div>
            </div>

            {/* Steps Sidebar */}
            <div className="w-80 bg-white rounded-xl shadow-lg p-4">
              <h3 className="text-lg font-bold text-gray-900 mb-4">📋 DENNÍ PLÁN</h3>
              <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={dailySteps.map(s => s.id)} strategy={verticalListSortingStrategy}>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {dailySteps.map((step, index) => (
                      <SortableStep
                        key={step.id}
                        step={step}
                        index={index}
                        onRemove={handleRemoveStepFromDaily}
                        isCurrent={index === currentStepIndex}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            </div>
          </div>
        )

      case 'goals':
        return <GoalsManagementView player={player} goals={goals} onGoalsUpdate={onGoalsUpdate} />
      case 'habits':
        return <HabitsManagementView player={player} habits={habits} onHabitsUpdate={onHabitsUpdate} />
      case 'statistics':
        return (
          <StatisticsView
            player={player}
            goals={goals}
            habits={habits}
            level={player?.level || 1}
            experience={player?.experience || 0}
            completedTasks={dailySteps.filter(s => s.completed).length}
            currentDay={player?.current_day || 1}
          />
        )
      case 'achievements':
        return (
          <AchievementsView
            player={player}
            goals={goals}
            habits={habits}
            level={player?.level || 1}
            experience={player?.experience || 0}
            completedTasks={dailySteps.filter(s => s.completed).length}
          />
        )
      case 'settings':
        return (
          <SettingsView 
            player={player}
            onPlayerUpdate={onPlayerUpdate}
          />
        )

      default:
        return null
    }
  }

  return (
    <GameLayout
      player={player}
      level={player?.level || 1}
      experience={player?.experience || 0}
      onBackToGame={() => setViewMode('daily-planning')}
      onNavigateToGoals={() => setViewMode('goals')}
      onNavigateToHabits={() => setViewMode('habits')}
      onNavigateToStatistics={() => setViewMode('statistics')}
      onNavigateToAchievements={() => setViewMode('achievements')}
      onNavigateToSettings={() => setViewMode('settings')}
    >
      {renderCurrentView()}
    </GameLayout>
  )
}
