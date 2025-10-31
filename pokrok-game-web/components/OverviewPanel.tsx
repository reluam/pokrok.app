'use client'

import React, { useState, useEffect, memo } from 'react'
import { Goal, Area } from '@/lib/cesta-db'
import { ChevronDown, ChevronRight, Target, Calendar } from 'lucide-react'
import { getIconEmoji } from '@/lib/icon-utils'
import { useTranslations } from '@/lib/use-translations'

interface OverviewPanelProps {
  goals: Goal[]
  onGoalClick: (goal: Goal) => void
}

export const OverviewPanel = memo(function OverviewPanel({ 
  goals, 
  onGoalClick 
}: OverviewPanelProps) {
  const { translations } = useTranslations()
  const [areas, setAreas] = useState<Area[]>([])
  const [expandedAreas, setExpandedAreas] = useState<Set<string>>(new Set())

  // Load areas
  useEffect(() => {
    const loadAreas = async () => {
      try {
        const response = await fetch('/api/cesta/areas')
        if (response.ok) {
          const data = await response.json()
          setAreas(data.areas || [])
        }
      } catch (error) {
        console.error('Error loading areas:', error)
      }
    }
    loadAreas()
  }, [])

  // Get active goals only
  const activeGoals = goals.filter(goal => goal.status === 'active')

  // Group goals by area
  const goalsByArea = areas.reduce((acc, area) => {
    const areaGoals = activeGoals.filter(goal => goal.area_id === area.id)
    if (areaGoals.length > 0) {
      acc[area.id] = {
        area,
        goals: areaGoals.sort((a, b) => {
          // Sort by priority: meaningful first, then by target date
          const aPriority = a.priority === 'meaningful' ? 1 : 0
          const bPriority = b.priority === 'meaningful' ? 1 : 0
          if (aPriority !== bPriority) return bPriority - aPriority
          
          // Then by target date (closest first)
          if (a.target_date && b.target_date) {
            const aDate = typeof a.target_date === 'string' ? new Date(a.target_date) : a.target_date
            const bDate = typeof b.target_date === 'string' ? new Date(b.target_date) : b.target_date
            return aDate.getTime() - bDate.getTime()
          }
          return 0
        })
      }
    }
    return acc
  }, {} as Record<string, { area: Area; goals: Goal[] }>)

  // Goals without area
  const goalsWithoutArea = activeGoals.filter(goal => !goal.area_id)
  if (goalsWithoutArea.length > 0) {
    goalsByArea['no-area'] = {
      area: { id: 'no-area', name: 'Bez oblasti', color: '#6B7280' } as Area,
      goals: goalsWithoutArea
    }
  }

  const toggleArea = (areaId: string) => {
    setExpandedAreas(prev => {
      const newSet = new Set(prev)
      if (newSet.has(areaId)) {
        newSet.delete(areaId)
      } else {
        newSet.add(areaId)
      }
      return newSet
    })
  }

  const getDaysRemainingText = (targetDate: string | Date) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const target = typeof targetDate === 'string' ? new Date(targetDate) : targetDate
    target.setHours(0, 0, 0, 0)
    
    const diffTime = target.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays < 0) {
      return `${Math.abs(diffDays)} dní po termínu`
    } else if (diffDays === 0) {
      return 'Dnes'
    } else if (diffDays === 1) {
      return 'Zítra'
    } else {
      return `Za ${diffDays} dní`
    }
  }

  const getProgressDisplay = (goal: Goal) => {
    if (goal.progress_percentage === null || goal.progress_percentage === undefined) {
      return '0%'
    }
    return `${goal.progress_percentage}%`
  }

  return (
    <div className="space-y-4">
      {Object.entries(goalsByArea).map(([areaId, { area, goals: areaGoals }]) => {
        const isExpanded = expandedAreas.has(areaId)
        const nearestGoal = areaGoals[0] // First goal is the nearest due to sorting
        
        return (
          <div key={areaId} className="border border-gray-200 rounded-lg overflow-hidden">
            {/* Area Header */}
            <div 
              className="p-4 bg-gray-50 border-b border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors"
              onClick={() => toggleArea(areaId)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: area.color }}
                  />
                  <h3 className="font-semibold text-gray-900">{area.name}</h3>
                  <span className="text-sm text-gray-500">({areaGoals.length})</span>
                </div>
                <div className="flex items-center space-x-2">
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4 text-gray-500" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-gray-500" />
                  )}
                </div>
              </div>
            </div>

            {/* Nearest Goal Preview (when collapsed) */}
            {!isExpanded && nearestGoal && (
              <div 
                className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => onGoalClick(nearestGoal)}
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                    nearestGoal.status === 'completed' 
                      ? 'bg-green-500' 
                      : nearestGoal.status === 'active'
                      ? 'bg-primary-500'
                      : 'bg-gray-400'
                  }`}>
                    {nearestGoal.status === 'completed' ? '✓' : (nearestGoal.icon ? getIconEmoji(nearestGoal.icon) : '🎯')}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 text-sm">{nearestGoal.title}</h4>
                    {nearestGoal.target_date && (
                      <p className="text-xs text-primary-600">
                        {getDaysRemainingText(nearestGoal.target_date)}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-gray-500 mb-1">
                      {getProgressDisplay(nearestGoal)}
                    </div>
                    <div className="w-16 bg-gray-200 rounded-full h-1.5 overflow-hidden">
                      <div 
                        className={`h-1.5 rounded-full transition-all duration-500 ${
                          nearestGoal.status === 'completed' 
                            ? 'bg-green-500' 
                            : 'bg-primary-500'
                        }`}
                        style={{ 
                          width: `${nearestGoal.progress_percentage || 0}%`
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* All Goals (when expanded) */}
            {isExpanded && (
              <div className="p-4 space-y-3">
                {areaGoals.map((goal, index) => (
                  <div
                    key={goal.id}
                    className="bg-white rounded-lg p-3 border border-gray-200 hover:border-primary-300 transition-colors cursor-pointer"
                    onClick={() => onGoalClick(goal)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                          goal.status === 'completed' 
                            ? 'bg-green-500' 
                            : goal.status === 'active'
                            ? 'bg-primary-500'
                            : 'bg-gray-400'
                        }`}>
                          {goal.status === 'completed' ? '✓' : (goal.icon ? getIconEmoji(goal.icon) : index + 1)}
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900 text-sm">{goal.title}</h4>
                          {goal.target_date && (
                            <p className="text-xs text-primary-600">
                              {getDaysRemainingText(goal.target_date)}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {goal.description && (
                      <p className="text-xs text-gray-600 mb-2">{goal.description}</p>
                    )}
                    
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>Pokrok</span>
                        <span>{getProgressDisplay(goal)}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                        <div 
                          className={`h-1.5 rounded-full transition-all duration-500 ${
                            goal.status === 'completed' 
                              ? 'bg-green-500' 
                              : 'bg-primary-500'
                          }`}
                          style={{ 
                            width: `${goal.progress_percentage || 0}%`
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })}

      {Object.keys(goalsByArea).length === 0 && (
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Target className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-500 text-sm">Zatím nemáte žádné aktivní cíle</p>
          <p className="text-gray-400 text-xs mt-1">Přidejte svůj první cíl</p>
        </div>
      )}
    </div>
  )
})
