'use client'

import React, { useState, useMemo } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent, DragOverlay, useDroppable } from '@dnd-kit/core'
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Plus, X, Target, Pause } from 'lucide-react'
import { getIconEmoji } from '@/lib/icon-utils'

interface FocusManagementViewProps {
  goals: any[]
  onGoalsUpdate?: (goals: any[]) => void
  userId?: string | null
  player?: any
}

interface SortableGoalItemProps {
  goal: any
  isActive: boolean
  onRemoveFromFocus: () => void
  onDefer: () => void
  onActivate: () => void
}

function SortableGoalItem({ 
  goal, 
  isActive,
  onRemoveFromFocus, 
  onDefer,
  onActivate
}: SortableGoalItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: goal.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const progressPercentage = goal.progress_percentage || 0
  const icon = getIconEmoji(goal.icon) || '🎯'

  // Active goals - orange colors
  if (isActive) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className={`bg-white rounded-xl border-2 border-orange-200 p-4 mb-3 shadow-sm hover:shadow-md transition-all ${
          isDragging ? 'border-orange-400' : ''
        }`}
      >
        <div className="flex items-start gap-3">
          {/* Drag handle */}
          <button
            {...attributes}
            {...listeners}
            className="mt-1 p-1 text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing"
          >
            <GripVertical className="w-5 h-5" />
          </button>

          {/* Goal icon and info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">{icon}</span>
              <h3 className="font-semibold text-gray-900 truncate">{goal.title}</h3>
              <span className="text-xs font-medium text-orange-600 bg-orange-100 px-2 py-0.5 rounded-full">
                #{goal.focus_order}
              </span>
            </div>
            
            {goal.description && (
              <p className="text-sm text-gray-600 mb-2 line-clamp-2">{goal.description}</p>
            )}

            {/* Progress bar */}
            <div className="mb-2">
              <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                <span>Pokrok</span>
                <span className="font-medium">{progressPercentage}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-orange-500 h-2 rounded-full transition-all"
                  style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 mt-3">
              <button
                onClick={onDefer}
                className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-1.5"
              >
                <Pause className="w-4 h-4" />
                <span>Odložit</span>
              </button>
              <button
                onClick={onRemoveFromFocus}
                className="px-3 py-1.5 text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-1.5"
              >
                <X className="w-4 h-4" />
                <span>Odebrat</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Deferred goals - gray colors
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-gray-50 rounded-xl border-2 border-gray-200 p-4 mb-3 shadow-sm hover:shadow-md transition-all ${
        isDragging ? 'border-gray-400' : ''
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Drag handle */}
        <button
          {...attributes}
          {...listeners}
          className="mt-1 p-1 text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing"
        >
          <GripVertical className="w-5 h-5" />
        </button>

        {/* Goal icon and info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">{icon}</span>
            <h3 className="font-semibold text-gray-700 truncate">{goal.title}</h3>
          </div>
          
          {goal.description && (
            <p className="text-sm text-gray-500 mb-2 line-clamp-2">{goal.description}</p>
          )}

          {/* Progress bar */}
          <div className="mb-2">
            <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
              <span>Pokrok</span>
              <span className="font-medium">{progressPercentage}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-gray-400 h-2 rounded-full transition-all"
                style={{ width: `${Math.min(progressPercentage, 100)}%` }}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 mt-3">
            <button
              onClick={onActivate}
              className="px-3 py-1.5 text-sm text-orange-600 hover:text-orange-700 hover:bg-orange-50 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <Target className="w-4 h-4" />
              <span>Aktivovat</span>
            </button>
            <button
              onClick={onRemoveFromFocus}
              className="px-3 py-1.5 text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <X className="w-4 h-4" />
              <span>Odebrat</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function DroppableColumn({ id, isActive, children }: { id: string; isActive: boolean; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({
    id,
  })

  return (
    <div
      ref={setNodeRef}
      className={`flex-1 min-h-[200px] rounded-xl p-4 border-2 border-dashed transition-colors ${
        isActive
          ? `bg-orange-50/30 ${isOver ? 'border-orange-400 bg-orange-100/50' : 'border-orange-200'}`
          : `bg-gray-100/50 ${isOver ? 'border-gray-400 bg-gray-200/50' : 'border-gray-300'}`
      }`}
    >
      {children}
    </div>
  )
}

export function FocusManagementView({
  goals = [],
  onGoalsUpdate,
  userId,
  player
}: FocusManagementViewProps) {
  const t = useTranslations()
  const locale = useLocale()
  
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showAddGoalModal, setShowAddGoalModal] = useState(false)
  const [newGoalTitle, setNewGoalTitle] = useState('')
  const [newGoalDescription, setNewGoalDescription] = useState('')
  const [newGoalFocusStatus, setNewGoalFocusStatus] = useState<'active_focus' | 'deferred'>('active_focus')
  const [activeId, setActiveId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Filter goals by focus status
  const activeFocusGoals = useMemo(() => {
    return goals
      .filter(g => g.focus_status === 'active_focus')
      .sort((a, b) => (a.focus_order || 999) - (b.focus_order || 999))
  }, [goals])

  const deferredGoals = useMemo(() => {
    return goals.filter(g => g.focus_status === 'deferred')
  }, [goals])

  // Handle drag end - can move within column or between columns
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)

    if (!over) {
      return
    }

    const goalId = active.id as string
    const goal = goals.find(g => g.id === goalId)
    if (!goal) return

    const overId = over.id as string
    
    // Check if dropped on a column drop zone
    if (overId === 'active-column' || overId === 'deferred-column') {
      const targetStatus = overId === 'active-column' ? 'active_focus' : 'deferred'
      if (goal.focus_status !== targetStatus) {
        await handleChangeStatus(goalId, targetStatus)
      }
      return
    }

    // Dropped on another goal - determine target status by goal's current status
    const targetGoal = goals.find(g => g.id === overId)
    if (!targetGoal) return

    const targetStatus = targetGoal.focus_status === 'active_focus' ? 'active_focus' : 'deferred'

    // If status changed, update status
    if (goal.focus_status !== targetStatus) {
      await handleChangeStatus(goalId, targetStatus)
      return
    }

    // If same column and same status, reorder (only for active_focus)
    if (goal.focus_status === 'active_focus' && targetStatus === 'active_focus') {
      const oldIndex = activeFocusGoals.findIndex(g => g.id === goalId)
      const newIndex = activeFocusGoals.findIndex(g => g.id === overId)
      
      if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
        const newOrder = arrayMove(activeFocusGoals, oldIndex, newIndex)
        const goalIds = newOrder.map(g => g.id)
        await handleReorder(goalIds)
      }
    }
  }

  const handleDragStart = (event: any) => {
    setActiveId(event.active.id)
  }

  // Change goal focus status
  const handleChangeStatus = async (goalId: string, status: 'active_focus' | 'deferred') => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/goals/focus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          goalId,
          focusStatus: status
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to change goal status')
      }

      const { goal } = await response.json()
      
      if (onGoalsUpdate) {
        const updatedGoals = goals.map(g => g.id === goalId ? goal : g)
        onGoalsUpdate(updatedGoals)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to change goal status')
      console.error('Error changing goal status:', err)
    } finally {
      setIsLoading(false)
    }
  }

  // Reorder active goals
  const handleReorder = async (goalIds: string[]) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/goals/focus', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goalIds })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to reorder goals')
      }

      const { goals: updatedGoals } = await response.json()
      
      if (onGoalsUpdate) {
        const updatedAllGoals = goals.map(g => {
          const updated = updatedGoals.find((ug: any) => ug.id === g.id)
          return updated || g
        })
        onGoalsUpdate(updatedAllGoals)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reorder goals')
      console.error('Error reordering goals:', err)
    } finally {
      setIsLoading(false)
    }
  }

  // Remove goal from focus
  const handleRemoveFromFocus = async (goalId: string) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/goals/focus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          goalId,
          focusStatus: null
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to remove goal from focus')
      }

      const { goal } = await response.json()
      
      if (onGoalsUpdate) {
        const updatedGoals = goals.map(g => g.id === goalId ? goal : g)
        onGoalsUpdate(updatedGoals)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove goal from focus')
      console.error('Error removing goal from focus:', err)
    } finally {
      setIsLoading(false)
    }
  }

  // Create new goal
  const handleCreateGoal = async () => {
    if (!newGoalTitle.trim()) {
      alert('Název cíle je povinný')
      return
    }

    const currentUserId = userId || player?.user_id
    if (!currentUserId) {
      alert('Chyba: Uživatel není nalezen')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // Create goal
      const createResponse = await fetch('/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUserId,
          title: newGoalTitle.trim(),
          description: newGoalDescription.trim() || undefined,
          status: 'active'
        })
      })

      if (!createResponse.ok) {
        const errorData = await createResponse.json()
        throw new Error(errorData.error || 'Failed to create goal')
      }

      const newGoal = await createResponse.json()

      // Set focus status
      if (newGoalFocusStatus) {
        const focusResponse = await fetch('/api/goals/focus', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            goalId: newGoal.id,
            focusStatus: newGoalFocusStatus
          })
        })

        if (focusResponse.ok) {
          const { goal } = await focusResponse.json()
          if (onGoalsUpdate) {
            onGoalsUpdate([...goals, goal])
          }
        } else {
          // Goal created but focus failed - still add goal
          if (onGoalsUpdate) {
            onGoalsUpdate([...goals, newGoal])
          }
        }
      } else {
        if (onGoalsUpdate) {
          onGoalsUpdate([...goals, newGoal])
        }
      }

      // Reset form
      setNewGoalTitle('')
      setNewGoalDescription('')
      setNewGoalFocusStatus('active_focus')
      setShowAddGoalModal(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create goal')
      console.error('Error creating goal:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const activeGoal = activeId ? goals.find(g => g.id === activeId) : null

  return (
    <div className="w-full h-full flex flex-col p-6 bg-gray-50">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">🎯 Fokus</h1>
          <p className="text-gray-600">
            Řídte priority svých cílů. Cíle v aktivním fokusu se zobrazují v hlavním panelu.
          </p>
        </div>
        <button
          onClick={() => setShowAddGoalModal(true)}
          className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors flex items-center gap-2 font-medium"
        >
          <Plus className="w-5 h-5" />
          <span>Přidat cíl</span>
        </button>
      </div>

      {/* Error message */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Two Column Layout */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex-1 grid grid-cols-2 gap-6 overflow-y-auto">
          {/* Active Focus Column */}
          <div className="flex flex-col">
            <div className="mb-4">
              <h2 className="text-lg font-bold text-orange-800 mb-1">
                Aktivní fokus ({activeFocusGoals.length})
              </h2>
              <p className="text-sm text-gray-600">Cíle, na které se soustředíte teď</p>
            </div>
            
            <DroppableColumn id="active-column" isActive={true}>
              {activeFocusGoals.length > 0 ? (
                <SortableContext
                  items={activeFocusGoals.map(g => g.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {activeFocusGoals.map((goal) => (
                    <SortableGoalItem
                      key={goal.id}
                      goal={goal}
                      isActive={true}
                      onRemoveFromFocus={() => handleRemoveFromFocus(goal.id)}
                      onDefer={() => handleChangeStatus(goal.id, 'deferred')}
                      onActivate={() => handleChangeStatus(goal.id, 'active_focus')}
                    />
                  ))}
                </SortableContext>
              ) : (
                <div className="text-center py-12 text-gray-400">
                  <Target className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Žádné aktivní cíle</p>
                  <p className="text-xs mt-1">Přetáhněte cíle sem nebo přidejte nový</p>
                </div>
              )}
            </DroppableColumn>
          </div>

          {/* Deferred Column */}
          <div className="flex flex-col">
            <div className="mb-4">
              <h2 className="text-lg font-bold text-gray-700 mb-1">
                Odložené ({deferredGoals.length})
              </h2>
              <p className="text-sm text-gray-600">Cíle, které jsou dočasně pozastavené</p>
            </div>
            
            <DroppableColumn id="deferred-column" isActive={false}>
              {deferredGoals.length > 0 ? (
                <SortableContext
                  items={deferredGoals.map(g => g.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {deferredGoals.map((goal) => (
                    <SortableGoalItem
                      key={goal.id}
                      goal={goal}
                      isActive={false}
                      onRemoveFromFocus={() => handleRemoveFromFocus(goal.id)}
                      onDefer={() => handleChangeStatus(goal.id, 'deferred')}
                      onActivate={() => handleChangeStatus(goal.id, 'active_focus')}
                    />
                  ))}
                </SortableContext>
              ) : (
                <div className="text-center py-12 text-gray-400">
                  <Pause className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Žádné odložené cíle</p>
                  <p className="text-xs mt-1">Přetáhněte cíle sem</p>
                </div>
              )}
            </DroppableColumn>
          </div>
        </div>

        <DragOverlay>
          {activeGoal ? (
            <div className="bg-white rounded-xl border-2 border-orange-300 p-4 shadow-lg opacity-90">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{getIconEmoji(activeGoal.icon) || '🎯'}</span>
                <h3 className="font-semibold text-gray-900">{activeGoal.title}</h3>
              </div>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-white bg-opacity-50 flex items-center justify-center z-10">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-orange-500 border-t-transparent"></div>
        </div>
      )}

      {/* Add Goal Modal */}
      {showAddGoalModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Přidat nový cíl</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Název cíle *
                </label>
                <input
                  type="text"
                  value={newGoalTitle}
                  onChange={(e) => setNewGoalTitle(e.target.value)}
                  className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-orange-500 focus:outline-none"
                  placeholder="Např. Naučit se programovat"
                  maxLength={100}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Popis (volitelné)
                </label>
                <textarea
                  value={newGoalDescription}
                  onChange={(e) => setNewGoalDescription(e.target.value)}
                  className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-orange-500 focus:outline-none resize-none"
                  rows={3}
                  placeholder="Podrobnější popis cíle..."
                  maxLength={500}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Stav fokusu
                </label>
                <select
                  value={newGoalFocusStatus}
                  onChange={(e) => setNewGoalFocusStatus(e.target.value as 'active_focus' | 'deferred')}
                  className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-orange-500 focus:outline-none"
                >
                  <option value="active_focus">Aktivní fokus</option>
                  <option value="deferred">Odložené</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowAddGoalModal(false)
                  setNewGoalTitle('')
                  setNewGoalDescription('')
                  setNewGoalFocusStatus('active_focus')
                }}
                className="flex-1 px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Zrušit
              </button>
              <button
                onClick={handleCreateGoal}
                disabled={isLoading || !newGoalTitle.trim()}
                className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Vytváření...' : 'Vytvořit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
