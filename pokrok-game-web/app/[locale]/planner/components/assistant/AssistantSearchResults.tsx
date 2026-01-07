'use client'

import { useTranslations } from 'next-intl'
import { Footprints, Target, Folder, CheckSquare } from 'lucide-react'

interface SearchResult {
  id: string
  type: 'step' | 'goal' | 'area' | 'habit'
  title: string
  description?: string
  metadata?: any
}

interface AssistantSearchResultsProps {
  results: SearchResult[]
  onResultClick: (result: SearchResult) => void
}

const typeIcons = {
  step: Footprints,
  goal: Target,
  area: Folder,
  habit: CheckSquare
}

const typeColors = {
  step: 'text-blue-600',
  goal: 'text-purple-600',
  area: 'text-green-600',
  habit: 'text-orange-600'
}

export function AssistantSearchResults({
  results,
  onResultClick
}: AssistantSearchResultsProps) {
  const t = useTranslations()

  if (results.length === 0) {
    return null
  }

  return (
    <div className="space-y-2 px-4 pt-2 pb-4">
      {results.map((result) => {
        const Icon = typeIcons[result.type]
        const isCompleted = result.type === 'step' && result.metadata?.completed === true
        
        return (
          <button
            key={`${result.type}-${result.id}`}
            onClick={() => onResultClick(result)}
            className={`w-full text-left p-2 rounded-lg border transition-colors ${
              isCompleted
                ? 'bg-primary-100 border-primary-300 hover:bg-primary-200'
                : 'bg-white border-primary-200 hover:bg-primary-50 hover:border-primary-300'
            }`}
          >
            <div className="flex items-start gap-2">
              <Icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${typeColors[result.type]} ${isCompleted ? 'opacity-60' : ''}`} />
              <div className="flex-1 min-w-0">
                <div className={`text-sm font-semibold text-primary-900 truncate ${isCompleted ? 'line-through opacity-70' : ''}`}>
                  {result.title}
                </div>
                {result.description && (
                  <div className={`text-xs text-primary-600 line-clamp-2 mt-0.5 ${isCompleted ? 'line-through opacity-60' : ''}`}>
                    {result.description}
                  </div>
                )}
                {result.metadata && result.type === 'step' && result.metadata.date && (
                  <div className="text-xs text-primary-500 mt-1">
                    {new Date(result.metadata.date).toLocaleDateString()}
                  </div>
                )}
              </div>
            </div>
          </button>
        )
      })}
    </div>
  )
}

