'use client'

import { useState } from 'react'
import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { useTranslations, useLocale } from 'next-intl'
import { Check, Target, Clock, Calendar, Star, Zap } from 'lucide-react'

interface DraggableStepProps {
  step: any
  isEditing: boolean
  initializeEditingStep: (step: any) => void
  handleStepToggle: (stepId: string, completed: boolean) => void
  goals: any[]
  editingStep: any
  setEditingStep: (step: any) => void
  handleUpdateStep: () => void
  dailySteps: any[]
  onDailyStepsUpdate?: (steps: any[]) => void
  isLoading: boolean
}

export function DraggableStep({
  step,
  isEditing,
  initializeEditingStep,
  handleStepToggle,
  goals,
  editingStep,
  setEditingStep,
  handleUpdateStep,
  dailySteps,
  onDailyStepsUpdate,
  isLoading
}: DraggableStepProps) {
  const t = useTranslations()
  const locale = useLocale()
  const localeCode = locale === 'cs' ? 'cs-CZ' : 'en-US'

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
      className={`p-3 rounded-lg border border-gray-200 bg-white hover:bg-orange-50/30 hover:border-orange-200 transition-all relative shadow-sm ${
        step.completed ? 'bg-green-50/50 border-green-200' : ''
      }`}
    >
      <div className="flex items-start gap-2">
        <button
          onClick={(e) => {
            e.stopPropagation()
            if (!isLoading) {
              handleStepToggle(step.id, !step.completed)
            }
          }}
          onPointerDown={(e) => {
            e.stopPropagation() // Prevent drag when clicking checkbox
          }}
          disabled={isLoading}
          className="flex items-center justify-center transition-all duration-200 cursor-pointer hover:scale-110 flex-shrink-0"
        >
          {isLoading ? (
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
        <div 
          className="flex-1 min-w-0 cursor-pointer"
          onClick={() => isEditing ? setEditingStep(null) : initializeEditingStep(step)}
        >
          <div className={`font-semibold text-sm ${step.completed ? 'line-through text-gray-500' : 'text-gray-900'}`}>
            {step.title}
          </div>
          {step.description && (
            <div className="text-xs text-gray-500 mt-1 line-clamp-1">
              {step.description}
            </div>
          )}
          <div className="flex items-center gap-1.5 mt-2 flex-wrap">
            {step.goal_id && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  initializeEditingStep(step)
                }}
                className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg bg-purple-50 border border-purple-100 cursor-pointer hover:bg-purple-100 hover:border-purple-200 transition-all duration-200 shadow-sm"
                title="Kliknutím otevřete úpravu"
              >
                <Target className="w-3.5 h-3.5 text-purple-600" />
                <span className="text-purple-700 font-medium truncate max-w-[100px]">
                  {goals.find((g: any) => g.id === step.goal_id)?.title || 'Cíl'}
                </span>
              </button>
            )}
            {step.estimated_time && (
              <div className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg bg-blue-50 border border-blue-100 shadow-sm">
                <Clock className="w-3.5 h-3.5 text-blue-600" />
                <span className="text-blue-700 font-medium">{step.estimated_time || 0} min</span>
              </div>
            )}
            {step.date && (
              <div className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg bg-gray-50 border border-gray-200 shadow-sm">
                <Calendar className="w-3.5 h-3.5 text-gray-600" />
                <span className="text-gray-700 font-medium">
                  {new Date(step.date).toLocaleDateString(localeCode)}
                </span>
              </div>
            )}
            {step.is_important && (
              <div className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg bg-yellow-50 border border-yellow-200 shadow-sm">
                <Star className="w-3.5 h-3.5 text-yellow-600 fill-yellow-600" />
                <span className="text-yellow-700 font-medium">Důležité</span>
              </div>
            )}
            {step.is_urgent && (
              <div className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg bg-orange-50 border border-orange-200 shadow-sm">
                <Zap className="w-3.5 h-3.5 text-orange-600 fill-orange-600" />
                <span className="text-orange-700 font-medium">Urgentní</span>
              </div>
            )}
            {false && step.xp_reward > 0 && (
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
                        {t('common.back')}
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
                className="px-3 py-1 bg-orange-600 text-white text-xs rounded hover:bg-orange-600"
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

