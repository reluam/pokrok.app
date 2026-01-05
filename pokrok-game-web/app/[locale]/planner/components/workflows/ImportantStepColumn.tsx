'use client'

import { useDroppable, useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { Trash2, Plus } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { getLocalDateString } from '../utils/dateHelpers'

interface DailyStep {
  id: string
  title: string
  description?: string
  date: string
  completed: boolean
  goal_id?: string
  planning_id?: string
  order_index?: number
}

interface ImportantStepColumnProps {
  id: string
  title: string
  steps: DailyStep[]
  category: 'important' | 'other' | 'backlog'
  maxCount?: number
  onDeleteStep: (stepId: string) => void
  allStepIds: string[]
  availableSteps?: DailyStep[]
  onAddStep?: () => void
}

function DraggableStepItem({ 
  step, 
  category, 
  onDelete 
}: { 
  step: DailyStep
  category: 'important' | 'other' | 'backlog'
  onDelete: (stepId: string) => void
}) {
  const t = useTranslations()
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({ id: step.id })

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
    boxShadow: 'none',
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`p-3 bg-white rounded-playful-md border-2 cursor-move transition-all ${
        category === 'important'
          ? 'border-primary-400 bg-primary-50/50 hover:border-primary-500 hover:bg-primary-50'
          : category === 'other'
          ? 'border-primary-300 bg-white hover:border-primary-400 hover:bg-primary-50/50'
          : 'border-gray-300 bg-gray-50/50 hover:border-gray-400 hover:bg-gray-50'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h4 className={`font-bold font-playful text-sm mb-1 truncate ${
            category === 'other' ? 'text-primary-600' : 'text-black'
          }`}>
            {step.title}
          </h4>
          {step.description && (
            <p className={`text-xs font-playful line-clamp-2 ${
              category === 'other' ? 'text-primary-500' : 'text-gray-600'
            }`}>
              {step.description}
            </p>
          )}
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation()
            onDelete(step.id)
          }}
          className="flex-shrink-0 p-1.5 text-red-600 hover:bg-red-50 rounded-playful-sm transition-colors"
          title={t('common.delete')}
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

export function ImportantStepColumn({
  id,
  title,
  steps,
  category,
  maxCount,
  onDeleteStep,
  allStepIds,
  availableSteps = [],
  onAddStep
}: ImportantStepColumnProps) {
  const t = useTranslations()
  
  const { setNodeRef, isOver } = useDroppable({
    id,
  })

  // For backlog, combine steps and availableSteps and sort by date
  const displaySteps = category === 'backlog' 
    ? (() => {
        const combined = [...steps, ...availableSteps.filter(s => !steps.find(step => step.id === s.id))]
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const todayStr = getLocalDateString(today)
        
        return combined.sort((a, b) => {
          const dateA = a.date || ''
          const dateB = b.date || ''
          
          // Today's steps first
          if (dateA === todayStr && dateB !== todayStr) return -1
          if (dateA !== todayStr && dateB === todayStr) return 1
          
          // If both are today, keep original order
          if (dateA === todayStr && dateB === todayStr) return 0
          
          // Overdue (before today) before future (after today)
          if (dateA < todayStr && dateB >= todayStr) return -1
          if (dateA >= todayStr && dateB < todayStr) return 1
          
          // Within same category (overdue or future), sort by date
          if (dateA < todayStr && dateB < todayStr) {
            // Overdue: older first (descending date)
            return dateB.localeCompare(dateA)
          }
          if (dateA >= todayStr && dateB >= todayStr) {
            // Future: newer first (ascending date)
            return dateA.localeCompare(dateB)
          }
          
          return 0
        })
      })()
    : steps

  const stepIds = displaySteps.map(s => s.id)
  const allIdsInColumn = stepIds

  return (
    <div className={`h-full flex flex-col border-2 rounded-playful-md overflow-hidden ${
        category === 'important'
          ? 'border-primary-500 bg-white'
          : category === 'other'
          ? 'border-primary-500 bg-white'
          : 'border-gray-400 bg-white'
      }`} style={{ maxHeight: '100%', boxShadow: 'none' }}>
      {/* Header */}
      <div className={`p-4 border-b-2 flex items-center justify-between flex-shrink-0 ${
        category === 'important'
          ? 'bg-primary-500 border-primary-500'
          : category === 'other'
          ? 'bg-white border-primary-500'
          : 'bg-gray-500 border-gray-500'
      }`}>
        <h3 className={`font-bold font-playful text-base ${
          category === 'other' ? 'text-primary-500' : 'text-white'
        }`}>
          {title}
        </h3>
        <div className="flex items-center gap-2">
          {maxCount && (
            <span className={`text-sm font-bold font-playful px-3 py-1 rounded-playful-sm ${
              category === 'other'
                ? 'text-primary-500 bg-primary-50 border-2 border-primary-500'
                : 'text-white bg-white/25'
            }`}>
              {steps.length}/{maxCount}
            </span>
          )}
          {onAddStep && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onAddStep()
              }}
              className={`p-1.5 rounded-playful-sm transition-colors ${
                category === 'other'
                  ? 'bg-primary-50 hover:bg-primary-100 text-primary-500 border-2 border-primary-500'
                  : 'bg-white/20 hover:bg-white/30 text-white'
              }`}
              title={t('workflows.onlyTheImportant.planning.addNewStep')}
            >
              <Plus className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Drop Zone */}
      <div
        ref={setNodeRef}
        className={`flex-1 overflow-y-auto min-h-0 p-4 space-y-3 ${
          isOver
            ? category === 'important'
              ? 'bg-primary-50'
              : category === 'other'
              ? 'bg-primary-50'
              : 'bg-gray-50'
            : 'bg-white'
        } transition-colors`}
        style={{ maxHeight: '100%', overflowY: 'auto' }}
      >
        {/* For backlog, show sections: Today, Overdue, Future */}
        {category === 'backlog' ? (() => {
          const today = new Date()
          today.setHours(0, 0, 0, 0)
          const todayStr = getLocalDateString(today)
          
          const todaySteps = displaySteps.filter(s => s.date === todayStr)
          const overdueSteps = displaySteps.filter(s => s.date && s.date < todayStr)
          const futureSteps = displaySteps.filter(s => s.date && s.date > todayStr)
          
          return (
            <>
              {/* Today's steps */}
              {todaySteps.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-bold text-gray-700 font-playful mb-2">
                    {t('workflows.onlyTheImportant.planning.today')}
                  </h4>
                  {todaySteps.map((step) => (
                    <DraggableStepItem
                      key={step.id}
                      step={step}
                      category={category}
                      onDelete={onDeleteStep}
                    />
                  ))}
                </div>
              )}
              
              {/* Overdue steps */}
              {overdueSteps.length > 0 && (
                <div className="space-y-2">
                  {(todaySteps.length > 0 || futureSteps.length > 0) && (
                    <div className="border-t-2 border-gray-300 my-4"></div>
                  )}
                  <h4 className="text-sm font-bold text-gray-700 font-playful mb-2">
                    {t('workflows.onlyTheImportant.planning.overdue')}
                  </h4>
                  {overdueSteps.map((step) => (
                    <DraggableStepItem
                      key={step.id}
                      step={step}
                      category={category}
                      onDelete={onDeleteStep}
                    />
                  ))}
                </div>
              )}
              
              {/* Future steps */}
              {futureSteps.length > 0 && (
                <div className="space-y-2">
                  {(todaySteps.length > 0 || overdueSteps.length > 0) && (
                    <div className="border-t-2 border-gray-300 my-4"></div>
                  )}
                  <h4 className="text-sm font-bold text-gray-700 font-playful mb-2">
                    {t('workflows.onlyTheImportant.planning.future')}
                  </h4>
                  {futureSteps.map((step) => (
                    <DraggableStepItem
                      key={step.id}
                      step={step}
                      category={category}
                      onDelete={onDeleteStep}
                    />
                  ))}
                </div>
              )}
              
              {/* Empty state */}
              {displaySteps.length === 0 && (
                <div className="text-center py-12 text-gray-400 font-playful text-sm">
                  <p>{t('workflows.onlyTheImportant.planning.emptyColumn')}</p>
                </div>
              )}
            </>
          )
        })() : (
          <>
            {/* Show all steps for other categories */}
            {displaySteps.map((step) => (
              <DraggableStepItem
                key={step.id}
                step={step}
                category={category}
                onDelete={onDeleteStep}
              />
            ))}

            {steps.length === 0 && (
              <div className={`text-center py-12 font-playful text-sm ${
                category === 'other' ? 'text-primary-400' : 'text-gray-400'
              }`}>
                <p>{t('workflows.onlyTheImportant.planning.emptyColumn')}</p>
              </div>
            )}

            {maxCount && steps.length >= maxCount && (
              <div className="text-sm font-bold text-red-600 font-playful mt-3 text-center bg-red-50 border-2 border-red-300 rounded-playful-sm p-2.5">
                {t('workflows.onlyTheImportant.planning.maxSteps', { count: maxCount })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

