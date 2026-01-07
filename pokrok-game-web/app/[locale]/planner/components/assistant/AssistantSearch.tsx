'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useTranslations } from 'next-intl'
import { Search, Loader2, Filter, X } from 'lucide-react'
import { AssistantSearchResults } from './AssistantSearchResults'

interface AssistantSearchProps {
  userId: string | null
  onOpenStepModal: (step?: any) => void
  onNavigateToGoal: (goalId: string) => void
  onNavigateToArea: (areaId: string) => void
  onNavigateToHabits: (habitId?: string) => void
  shouldFocus?: boolean
  onFocusHandled?: () => void
  onResultsChange?: (hasResults: boolean) => void
  onSearchResultsChange?: (results: any[]) => void
}

interface SearchFilters {
  types: ('step' | 'goal' | 'area' | 'habit')[]
  completed?: boolean // For steps
  status?: string[] // For goals
  dateFrom?: string
  dateTo?: string
  areaId?: string
  goalId?: string
}

export function AssistantSearch({
  userId,
  onOpenStepModal,
  onNavigateToGoal,
  onNavigateToArea,
  onNavigateToHabits,
  shouldFocus = false,
  onFocusHandled,
  onResultsChange,
  onSearchResultsChange
}: AssistantSearchProps) {
  const t = useTranslations()
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  const [filters, setFilters] = useState<SearchFilters>({
    types: ['step', 'goal', 'area', 'habit']
  })
  const searchInputRef = useRef<HTMLInputElement | null>(null)

  // Focus input when shouldFocus is true
  useEffect(() => {
    if (shouldFocus && searchInputRef.current) {
      // Small delay to ensure panel is expanded
      setTimeout(() => {
        searchInputRef.current?.focus()
        if (onFocusHandled) {
          onFocusHandled()
        }
      }, 100)
    }
  }, [shouldFocus, onFocusHandled])

  // Debounced search
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setSearchResults([])
      if (onResultsChange) {
        onResultsChange(false)
      }
      if (onSearchResultsChange) {
        onSearchResultsChange([])
      }
      return
    }

    const timeoutId = setTimeout(() => {
      performSearch()
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [searchQuery, filters]) // Removed callback functions from dependencies

  // Notify parent about results changes immediately when results array changes
  useEffect(() => {
    if (onResultsChange) {
      onResultsChange(searchResults.length > 0)
    }
    // Note: onResultsChange is intentionally not in dependencies to avoid re-renders
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchResults])

  const performSearch = useCallback(async () => {
    if (!userId || !searchQuery.trim() || searchQuery.length < 2) {
      return
    }

    setIsSearching(true)
    try {
      const filtersParam = encodeURIComponent(JSON.stringify(filters))
      const response = await fetch(
        `/api/assistant/search?q=${encodeURIComponent(searchQuery)}&userId=${userId}&filters=${filtersParam}`
      )
      
      if (response.ok) {
        const data = await response.json()
        const results = data.results || []
        setSearchResults(results)
        if (onResultsChange) {
          onResultsChange(results.length > 0)
        }
        if (onSearchResultsChange) {
          onSearchResultsChange(results)
        }
      } else {
        console.error('Search failed')
        setSearchResults([])
        if (onResultsChange) {
          onResultsChange(false)
        }
        if (onSearchResultsChange) {
          onSearchResultsChange([])
        }
      }
    } catch (error) {
      console.error('Error searching:', error)
      setSearchResults([])
      if (onSearchResultsChange) {
        onSearchResultsChange([])
      }
    } finally {
      setIsSearching(false)
    }
    // Note: callback functions are intentionally not in dependencies to avoid re-renders
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, filters, userId])

  const handleResultClick = (result: any) => {
    switch (result.type) {
      case 'step':
        onOpenStepModal(result)
        break
      case 'goal':
        onNavigateToGoal(result.id)
        break
      case 'area':
        onNavigateToArea(result.id)
        break
      case 'habit':
        onNavigateToHabits(result.id)
        break
    }
    // Clear search after click
    setSearchQuery('')
    setSearchResults([])
    if (onResultsChange) {
      onResultsChange(false)
    }
  }

  const toggleTypeFilter = (type: 'step' | 'goal' | 'area' | 'habit') => {
    setFilters(prev => {
      const newTypes = prev.types.includes(type)
        ? prev.types.filter(t => t !== type)
        : [...prev.types, type]
      return { ...prev, types: newTypes }
    })
  }

  // Show backdrop on large screens when focused or has search query
  const showBackdrop = isFocused || searchQuery.length > 0

  return (
    <>
      {showBackdrop && typeof window !== 'undefined' && window.innerWidth >= 1024 && (
        <div 
          className="fixed inset-0 right-72 bg-black bg-opacity-50 z-30"
          onClick={() => {
            setIsFocused(false)
            setSearchQuery('')
            setSearchResults([])
          }}
        />
      )}
      <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
        <div className="border-b-2 border-primary-200 p-4 relative z-50 flex-shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-primary-400" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => {
                // Delay blur to allow clicking on results
                setTimeout(() => setIsFocused(false), 200)
              }}
              placeholder={t('assistant.search.placeholder')}
              className="w-full pl-10 pr-10 py-2 bg-primary-50 border-2 border-primary-200 rounded-lg focus:outline-none focus:border-primary-500 focus:bg-white text-sm text-primary-900 placeholder:text-primary-400"
            />
            {isSearching && (
              <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-primary-400 animate-spin" />
            )}
            {searchQuery && !isSearching && (
              <button
                onClick={() => {
                  setSearchQuery('')
                  setSearchResults([])
                }}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-primary-100 rounded"
              >
                <X className="w-4 h-4 text-primary-400" />
              </button>
            )}
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className="mt-2 flex items-center gap-2 text-xs text-primary-600 hover:text-primary-700"
          >
            <Filter className="w-3 h-3" />
            {t('assistant.search.filters')}
          </button>

          {showFilters && (
            <div className="mt-3 p-3 bg-primary-50 rounded-lg border border-primary-200 space-y-3">
              <div>
                <div className="text-xs font-semibold text-primary-700 mb-2">
                  {t('assistant.search.filterTypes')}
                </div>
                <div className="flex flex-wrap gap-2">
                  {(['step', 'goal', 'area', 'habit'] as const).map(type => (
                    <button
                      key={type}
                      onClick={() => toggleTypeFilter(type)}
                      className={`px-2 py-1 rounded text-xs ${
                        filters.types.includes(type)
                          ? 'bg-primary-500 text-white'
                          : 'bg-primary-100 text-primary-700 hover:bg-primary-200'
                      }`}
                    >
                      {t(`assistant.search.${type}s`)}
                    </button>
                  ))}
                </div>
              </div>

              {filters.types.includes('step') && (
                <div>
                  <label className="flex items-center gap-2 text-xs">
                    <input
                      type="checkbox"
                      checked={filters.completed === false}
                      onChange={(e) =>
                        setFilters(prev => ({
                          ...prev,
                          completed: e.target.checked ? false : undefined
                        }))
                      }
                      className="rounded"
                    />
                    {t('assistant.search.onlyIncomplete')}
                  </label>
                </div>
              )}
            </div>
          )}
        </div>

      </div>
    </>
  )
}

