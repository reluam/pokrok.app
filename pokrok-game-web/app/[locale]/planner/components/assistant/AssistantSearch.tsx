'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useTranslations } from 'next-intl'
import { Sparkles, Loader2, X, Send, Check, XCircle } from 'lucide-react'

interface AssistantSearchProps {
  userId: string | null
  onOpenStepModal: (step?: any) => void
  onNavigateToGoal: (goalId: string) => void
  onNavigateToArea: (areaId: string) => void
  onNavigateToHabits: (habitId?: string) => void
  shouldFocus?: boolean
  onFocusHandled?: () => void
  onResultChange?: (result: { message: string; success: boolean; actions?: any[]; pendingActions?: any[]; requiresConfirmation?: boolean } | null) => void
}

export function AssistantSearch({
  userId,
  onOpenStepModal,
  onNavigateToGoal,
  onNavigateToArea,
  onNavigateToHabits,
  shouldFocus = false,
  onFocusHandled,
  onResultChange
}: AssistantSearchProps) {
  const t = useTranslations()
  const [query, setQuery] = useState('')
  const [originalQuery, setOriginalQuery] = useState('')
  const [isExecuting, setIsExecuting] = useState(false)
  const [result, setResult] = useState<{ message: string; success: boolean; actions?: any[]; preview?: { items: any[]; summary: string }; instructions?: any[]; requiresConfirmation?: boolean } | null>(null)
  const [isConfirming, setIsConfirming] = useState(false)
  const [habitChoices, setHabitChoices] = useState<{ [key: number]: 'all' | 'scheduled' }>({})
  const [editableData, setEditableData] = useState<{ [key: number]: any }>({})
  const [expandedStepIndex, setExpandedStepIndex] = useState<number | null>(null)
  const [pendingInstructions, setPendingInstructions] = useState<any[]>([]) // Store pending instructions for context
  const [goals, setGoals] = useState<any[]>([])
  const [areas, setAreas] = useState<any[]>([])
  const inputRef = useRef<HTMLInputElement | null>(null)
  
  // Načíst cíle a oblasti pro selecty
  useEffect(() => {
    if (!userId) return
    
    const loadData = async () => {
      try {
        const [goalsRes, areasRes] = await Promise.all([
          fetch('/api/goals'),
          fetch('/api/cesta/areas')
        ])
        
        if (goalsRes.ok) {
          const goalsData = await goalsRes.json()
          setGoals(Array.isArray(goalsData) ? goalsData : [])
        }
        
        if (areasRes.ok) {
          const areasData = await areasRes.json()
          setAreas(Array.isArray(areasData) ? areasData : [])
        }
      } catch (error) {
        console.error('Error loading goals/areas:', error)
      }
    }
    
    loadData()
  }, [userId])

  // Focus input when shouldFocus is true
  useEffect(() => {
    if (shouldFocus && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus()
        if (onFocusHandled) {
          onFocusHandled()
        }
      }, 100)
    }
  }, [shouldFocus, onFocusHandled])

  // Notify parent about result changes
  useEffect(() => {
    if (onResultChange) {
      onResultChange(result)
      }
  }, [result, onResultChange])

  const executeCommand = useCallback(async () => {
    if (!userId || !query.trim() || isExecuting) {
      return
    }

    setIsExecuting(true)
    setOriginalQuery(query.trim())
    
    // Merge current editable data into pending instructions if they exist
    const contextInstructions = pendingInstructions.length > 0 
      ? pendingInstructions.map((instruction: any, index: number) => {
          if (editableData[index] && instruction.operation === 'create' && instruction.data) {
            return {
              ...instruction,
              data: {
                ...instruction.data,
                ...editableData[index]
              }
            }
          }
          return instruction
        })
      : []
    
    try {
      const response = await fetch('/api/assistant/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          query: query.trim(),
          contextInstructions: contextInstructions.length > 0 ? contextInstructions : undefined
        })
      })
      
      if (response.ok) {
        const data = await response.json()
        const newResult = {
          message: data.message || 'Akce byla provedena.',
          success: data.success !== false,
          actions: data.actions || [],
          preview: data.preview,
          instructions: data.instructions || [],
          requiresConfirmation: data.requiresConfirmation !== false
        }
        
        // Debug logging
        if (process.env.NODE_ENV === 'development') {
          console.log('Assistant response:', {
            message: newResult.message,
            hasPreview: !!newResult.preview,
            previewItems: newResult.preview?.items?.length || 0,
            hasInstructions: !!newResult.instructions,
            instructionsCount: newResult.instructions?.length || 0,
            requiresConfirmation: newResult.requiresConfirmation
          })
        }
        
        setResult(newResult)
        
        // Store pending instructions for context
        if (data.instructions && data.instructions.length > 0) {
          setPendingInstructions(data.instructions)
        }
        
        // Initialize editable data from preview items
        if (data.preview?.items && (data.requiresConfirmation || data.preview.items.length > 0)) {
          const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD format
          const initialEditableData: { [key: number]: any } = {}
          data.preview.items.forEach((item: any, index: number) => {
            if (item.operation === 'create' && item.data) {
              initialEditableData[index] = { 
                ...item.data,
                // Set default date to today if not provided
                date: item.data.date || (item.type === 'step' ? today : item.data.date),
                targetDate: item.data.targetDate || (item.type === 'goal' ? item.data.targetDate : undefined)
              }
            } else if (item.operation === 'update' && item.newData) {
              // For update operations, use newData as editable
              // Map goal_id/area_id to goalId/areaId for consistency
              initialEditableData[index] = {
                goalId: item.newData.goalId !== undefined ? item.newData.goalId : (item.currentData?.goal_id || null),
                areaId: item.newData.areaId !== undefined ? item.newData.areaId : (item.currentData?.area_id || null),
                title: item.newData.title,
                description: item.newData.description,
                date: item.newData.date
              }
            }
          })
          setEditableData(initialEditableData)
          
          // Debug logging
          if (process.env.NODE_ENV === 'development') {
            console.log('Preview items:', data.preview.items)
            console.log('Requires confirmation:', data.requiresConfirmation)
            console.log('Initial editable data:', initialEditableData)
            console.log('Pending instructions:', data.instructions)
          }
        }
        
        // Pokud byly provedeny akce (ne pending), refreshneme data
        if (data.actions && data.actions.length > 0 && !data.requiresConfirmation) {
          // Dispatch event pro refresh dat
          window.dispatchEvent(new CustomEvent('assistantActionCompleted', { detail: data.actions }))
          
          // Navigace podle typu akce
          for (const action of data.actions) {
            if (action.type === 'goal' && action.data?.goal) {
              // Pokud byla vytvořena metrika, navigujeme na cíl
              const hasMetric = data.actions.some((a: any) => a.type === 'metric' && a.data?.metric)
              if (hasMetric) {
                setTimeout(() => {
                  onNavigateToGoal(action.data.goal.id)
                }, 1500)
              }
              break
            }
          }
          
          // Vyčistit input po úspěšném provedení
          setQuery('')
        }
      } else {
        const errorData = await response.json().catch(() => ({}))
        setResult({
          message: errorData.error || 'Chyba při provádění příkazu.',
          success: false,
          actions: []
        })
      }
    } catch (error: any) {
      console.error('Error executing command:', error)
      setResult({
        message: error.message || 'Chyba při provádění příkazu.',
        success: false,
        actions: []
      })
    } finally {
      setIsExecuting(false)
    }
  }, [query, userId, isExecuting, onNavigateToGoal])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && query.trim() && !isExecuting) {
      e.preventDefault()
      executeCommand()
    }
  }

  const handleConfirm = useCallback(async () => {
    if (!result?.instructions || result.instructions.length === 0 || isConfirming) {
      return
    }

    // Validate required fields
    const validationErrors: string[] = []
    result.instructions.forEach((instruction: any, index: number) => {
      if (instruction.operation === 'create') {
        const data = editableData[index] || instruction.data || {}
        
        if (instruction.type === 'step') {
          if (!data.title || data.title.trim() === '') {
            validationErrors.push(`Krok ${index + 1}: Název je povinný`)
        }
          if (!data.date || data.date.trim() === '') {
            validationErrors.push(`Krok ${index + 1}: Datum je povinné`)
          }
        } else if (instruction.type === 'goal') {
          if (!data.title || data.title.trim() === '') {
            validationErrors.push(`Cíl ${index + 1}: Název je povinný`)
          }
        }
      }
    })
    
    if (validationErrors.length > 0) {
      setResult({
        ...result,
        message: `Chyby ve formuláři:\n${validationErrors.join('\n')}`,
        success: false
      })
      return
    }

    setIsConfirming(true)
    
    // Merge editable data into instructions
    const updatedInstructions = result.instructions.map((instruction: any, index: number) => {
      if (editableData[index]) {
        if (instruction.operation === 'create' && instruction.data) {
          return {
            ...instruction,
            data: {
              ...instruction.data,
              ...editableData[index]
        }
      }
        } else if (instruction.operation === 'update' && instruction.data) {
          return {
            ...instruction,
            data: {
              ...instruction.data,
              ...editableData[index]
            }
          }
        }
      }
      return instruction
    })
    
    try {
      const response = await fetch('/api/assistant/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          query: originalQuery,
          confirm: true,
          pendingActions: updatedInstructions,
          userChoices: habitChoices
        })
      })
      
      if (response.ok) {
        const data = await response.json()
        const newResult = {
          message: data.message || 'Akce byla provedena.',
          success: data.success !== false,
          actions: data.actions || []
        }
        setResult(newResult)
        
        // Refreshneme data
        if (data.actions && data.actions.length > 0) {
          window.dispatchEvent(new CustomEvent('assistantActionCompleted', { detail: data.actions }))
          
          // Navigace podle typu akce
          for (const action of data.actions) {
            if (action.type === 'goal' && action.data?.goal) {
              const hasMetric = data.actions.some((a: any) => a.type === 'metric' && a.data?.metric)
              if (hasMetric) {
                setTimeout(() => {
                  onNavigateToGoal(action.data.goal.id)
                }, 1500)
              }
              break
            }
          }
        }
        
        // Clear pending instructions and editable data after successful execution
        setPendingInstructions([])
        setEditableData({})
        setExpandedStepIndex(null)
        
        // Vyčistit input po úspěšném provedení
        setQuery('')
      } else {
        const errorData = await response.json().catch(() => ({}))
        setResult({
          message: errorData.error || 'Chyba při provádění akcí.',
          success: false,
          actions: []
        })
      }
    } catch (error: any) {
      console.error('Error confirming actions:', error)
      setResult({
        message: error.message || 'Chyba při provádění akcí.',
        success: false,
        actions: []
      })
    } finally {
      setIsConfirming(false)
    }
  }, [result, originalQuery, isConfirming, habitChoices, onNavigateToGoal])

  const handleCancel = () => {
    setResult(null)
    setQuery('')
    setHabitChoices({})
    setEditableData({})
    setPendingInstructions([])
    setExpandedStepIndex(null)
    if (onResultChange) {
      onResultChange(null)
    }
  }

  const handleClear = () => {
    setQuery('')
    setResult(null)
    if (onResultChange) {
      onResultChange(null)
    }
  }

  return (
    <div className="border-b-2 border-primary-200 flex-shrink-0">
      <div className="p-4">
          <div className="relative">
          <Sparkles className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-primary-400" />
            <input
            ref={inputRef}
              type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t('assistant.prompt.placeholder') || 'Napiš, co chceš udělat...'}
            disabled={isExecuting || isConfirming}
            className="w-full pl-10 pr-20 py-2.5 bg-primary-50 border-2 border-primary-200 rounded-lg focus:outline-none focus:border-primary-500 focus:bg-white text-sm text-primary-900 placeholder:text-primary-400 disabled:opacity-50 disabled:cursor-not-allowed"
            />
          {isExecuting || isConfirming ? (
              <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-primary-400 animate-spin" />
          ) : (
            <>
              {query.trim() && (
                <button
                  onClick={executeCommand}
                  disabled={isExecuting}
                  className="absolute right-10 top-1/2 transform -translate-y-1/2 p-1.5 hover:bg-primary-100 rounded transition-colors disabled:opacity-50"
                  title={t('assistant.prompt.send') || 'Odeslat'}
                >
                  <Send className="w-4 h-4 text-primary-500" />
                </button>
              )}
              {query && (
              <button
                  onClick={handleClear}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-primary-100 rounded transition-colors"
                  title={t('common.clear') || 'Vymazat'}
              >
                <X className="w-4 h-4 text-primary-400" />
              </button>
            )}
            </>
          )}
        </div>
      </div>
      {result?.preview && result.preview.items && result.preview.items.length > 0 && (
        <div className="px-4 pb-4 space-y-3">
          {result.message && (
            <div className="text-sm text-primary-700 bg-primary-100 p-3 rounded-lg">
              {result.message}
            </div>
          )}
          
          {/* Zobrazit preview položek */}
          <div className="space-y-2">
            {result.preview.items.map((item: any, index: number) => (
              <div key={index} className="bg-white border border-primary-200 rounded-lg p-3">
                {item.type === 'habit' && item.operation === 'complete' && item.requiresChoice && (
                  <div>
                    <div className="font-medium text-sm text-primary-900 mb-3">
                      Označit návyky jako dokončené:
                    </div>
                    
                    {/* Výběr: Všechny vs. Pouze naplánované */}
                    <div className="space-y-2 mb-3">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name={`habit-choice-${index}`}
                          value="scheduled"
                          checked={habitChoices[index] === 'scheduled'}
                          onChange={() => setHabitChoices({ ...habitChoices, [index]: 'scheduled' })}
                          className="w-4 h-4 text-primary-500"
                        />
                        <span className="text-sm text-primary-700">
                          Pouze naplánované na dnes ({item.scheduledCount})
                        </span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name={`habit-choice-${index}`}
                          value="all"
                          checked={habitChoices[index] === 'all' || !habitChoices[index]}
                          onChange={() => setHabitChoices({ ...habitChoices, [index]: 'all' })}
                          className="w-4 h-4 text-primary-500"
                        />
                        <span className="text-sm text-primary-700">
                          Všechny ({item.allCount})
                        </span>
                      </label>
          </div>

                    {/* Zobrazit seznam podle výběru */}
                    <div className="space-y-1 mt-3 pt-3 border-t border-primary-200">
                      <div className="text-xs text-primary-500 mb-2">
                        {habitChoices[index] === 'scheduled' ? 'Naplánované návyky:' : 'Všechny návyky:'}
                      </div>
                      {(habitChoices[index] === 'scheduled' ? item.scheduledItems : item.allItems).map((habit: any) => (
                        <div key={habit.id} className="text-xs text-primary-600 flex items-center gap-2">
                          <span className="w-2 h-2 bg-primary-400 rounded-full"></span>
                          {habit.name}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {item.type === 'habit' && item.operation === 'complete' && !item.requiresChoice && (
                  <div>
                    <div className="font-medium text-sm text-primary-900 mb-2">
                      Označím jako dokončené ({item.count}):
                    </div>
                    <div className="space-y-1">
                      {item.items.map((habit: any) => (
                        <div key={habit.id} className="text-xs text-primary-600 flex items-center gap-2">
                          <span className="w-2 h-2 bg-primary-400 rounded-full"></span>
                          {habit.name}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {item.operation === 'create' && (
                  <div className="space-y-3">
                    {item.error && (
                      <div className="text-red-600 font-medium text-sm">
                        ⚠️ {item.error}
                      </div>
                    )}
                    
                    {/* Editovatelná pole pro kroky */}
                    {item.type === 'step' && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="font-medium text-sm text-primary-900">
                            Vytvořím krok:
                          </div>
          <button
                            onClick={() => setExpandedStepIndex(expandedStepIndex === index ? null : index)}
                            className="text-xs text-primary-600 hover:text-primary-700 px-2 py-1 hover:bg-primary-50 rounded transition-colors"
          >
                            {expandedStepIndex === index ? 'Skrýt' : 'Upravit'}
          </button>
                        </div>
                        {expandedStepIndex === index ? (
                          <div className="space-y-2 pt-2 border-t border-primary-200">
                            <div>
                              <label className="block text-xs text-primary-600 mb-1">Název *</label>
                              <input
                                type="text"
                                value={editableData[index]?.title ?? item.data?.title ?? ''}
                                onChange={(e) => setEditableData({
                                  ...editableData,
                                  [index]: { ...editableData[index], title: e.target.value }
                                })}
                                className="w-full px-3 py-2 text-sm border border-primary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                placeholder="Název kroku"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-primary-600 mb-1">Popis</label>
                              <textarea
                                value={editableData[index]?.description ?? item.data?.description ?? ''}
                                onChange={(e) => setEditableData({
                                  ...editableData,
                                  [index]: { ...editableData[index], description: e.target.value }
                                })}
                                className="w-full px-3 py-2 text-sm border border-primary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                                rows={2}
                                placeholder="Popis kroku (volitelné)"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-primary-600 mb-1">Datum *</label>
                              <input
                                type="date"
                                value={editableData[index]?.date ?? item.data?.date ?? new Date().toISOString().split('T')[0]}
                                onChange={(e) => setEditableData({
                                  ...editableData,
                                  [index]: { ...editableData[index], date: e.target.value }
                                })}
                                className="w-full px-3 py-2 text-sm border border-primary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="text-sm text-primary-700 space-y-1">
                            <div><strong>Název:</strong> {editableData[index]?.title ?? item.data?.title ?? '(chybí název)'}</div>
                            {editableData[index]?.description || item.data?.description ? (
                              <div><strong>Popis:</strong> {editableData[index]?.description ?? item.data?.description}</div>
                            ) : null}
                            <div><strong>Datum:</strong> {editableData[index]?.date ?? item.data?.date ?? new Date().toISOString().split('T')[0]}</div>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Editovatelná pole pro cíle */}
                    {item.type === 'goal' && (
                      <div className="space-y-2">
                        <div className="font-medium text-sm text-primary-900">
                          Vytvořím cíl:
                        </div>
                        <div className="space-y-2">
                          <div>
                            <label className="block text-xs text-primary-600 mb-1">Název *</label>
                            <input
                              type="text"
                              value={editableData[index]?.title ?? item.data?.title ?? ''}
                              onChange={(e) => setEditableData({
                                ...editableData,
                                [index]: { ...editableData[index], title: e.target.value }
                              })}
                              className="w-full px-3 py-2 text-sm border border-primary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                              placeholder="Název cíle"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-primary-600 mb-1">Popis</label>
                            <textarea
                              value={editableData[index]?.description ?? item.data?.description ?? ''}
                              onChange={(e) => setEditableData({
                                ...editableData,
                                [index]: { ...editableData[index], description: e.target.value }
                              })}
                              className="w-full px-3 py-2 text-sm border border-primary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                              rows={2}
                              placeholder="Popis cíle (volitelné)"
                            />
                          </div>
              <div>
                            <label className="block text-xs text-primary-600 mb-1">Cílové datum</label>
                            <input
                              type="date"
                              value={editableData[index]?.targetDate ?? item.data?.targetDate ?? ''}
                              onChange={(e) => setEditableData({
                                ...editableData,
                                [index]: { ...editableData[index], targetDate: e.target.value }
                              })}
                              className="w-full px-3 py-2 text-sm border border-primary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Jednoduché zobrazení pro ostatní typy */}
                    {item.type === 'habit' && (
                      <div className="text-sm text-primary-700">
                        Vytvořím návyk: "{item.data?.name || '(chybí název)'}"
                      </div>
                    )}
                    {item.type === 'area' && (
                      <div className="text-sm text-primary-700">
                        Vytvořím oblast: "{item.data?.name || '(chybí název)'}"
                      </div>
                    )}
                    {item.type === 'metric' && (
                      <div className="text-sm text-primary-700">
                        Vytvořím metriku: "{item.data?.name || '(chybí název)'}"
                      </div>
                    )}
                  </div>
                )}
                
                {/* Zobrazení pro update operace */}
                {item.operation === 'update' && (
                  <div className="space-y-3">
                    {item.type === 'step' && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="font-medium text-sm text-primary-900">
                            Upravím krok: "{item.stepTitle}"
                </div>
                    <button
                            onClick={() => setExpandedStepIndex(expandedStepIndex === index ? null : index)}
                            className="text-xs text-primary-600 hover:text-primary-700 px-2 py-1 hover:bg-primary-50 rounded transition-colors"
                    >
                            {expandedStepIndex === index ? 'Skrýt' : 'Upravit'}
                    </button>
                        </div>
                        {expandedStepIndex === index ? (
                          <div className="space-y-2 pt-2 border-t border-primary-200">
                            <div>
                              <label className="block text-xs text-primary-600 mb-1">Cíl</label>
                              <select
                                value={editableData[index]?.goalId ?? item.newData?.goalId ?? ''}
                                onChange={(e) => setEditableData({
                                  ...editableData,
                                  [index]: { ...editableData[index], goalId: e.target.value || null }
                                })}
                                className="w-full px-3 py-2 text-sm border border-primary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                              >
                                <option value="">Bez cíle</option>
                                {goals?.map((goal: any) => (
                                  <option key={goal.id} value={goal.id}>{goal.title}</option>
                                ))}
                              </select>
                </div>
                            <div>
                              <label className="block text-xs text-primary-600 mb-1">Oblast</label>
                              <select
                                value={editableData[index]?.areaId ?? item.newData?.areaId ?? ''}
                                onChange={(e) => setEditableData({
                                  ...editableData,
                                  [index]: { ...editableData[index], areaId: e.target.value || null }
                                })}
                                className="w-full px-3 py-2 text-sm border border-primary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                              >
                                <option value="">Bez oblasti</option>
                                {areas?.map((area: any) => (
                                  <option key={area.id} value={area.id}>{area.name}</option>
                                ))}
                              </select>
              </div>
                <div>
                              <label className="block text-xs text-primary-600 mb-1">Datum</label>
                    <input
                                type="date"
                                value={editableData[index]?.date ?? item.newData?.date ?? item.currentData?.date ?? new Date().toISOString().split('T')[0]}
                                onChange={(e) => setEditableData({
                                  ...editableData,
                                  [index]: { ...editableData[index], date: e.target.value }
                                })}
                                className="w-full px-3 py-2 text-sm border border-primary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-2 text-sm bg-primary-50 p-2 rounded">
                            {item.newData.goalId !== item.currentData.goal_id && (
                              <div className="flex items-center gap-2">
                                <span className="text-primary-600">Cíl:</span>
                                <span className="text-primary-900 line-through">{item.currentData.goal_id ? 'Má cíl' : 'Bez cíle'}</span>
                                <span className="text-primary-500">→</span>
                                <span className="text-primary-900 font-medium">
                                  {item.newData.goalId ? (goals?.find((g: any) => g.id === item.newData.goalId)?.title || item.newData.goalId) : 'Bez cíle'}
                                </span>
                              </div>
                            )}
                            {item.newData.areaId !== item.currentData.area_id && (
                              <div className="flex items-center gap-2">
                                <span className="text-primary-600">Oblast:</span>
                                <span className="text-primary-900 line-through">{item.currentData.area_id ? 'Má oblast' : 'Bez oblasti'}</span>
                                <span className="text-primary-500">→</span>
                                <span className="text-primary-900 font-medium">
                                  {item.newData.areaId ? (areas?.find((a: any) => a.id === item.newData.areaId)?.name || item.newData.areaId) : 'Bez oblasti'}
                                </span>
                              </div>
                            )}
                            {item.newData.date !== item.currentData.date && (
                              <div className="flex items-center gap-2">
                                <span className="text-primary-600">Datum:</span>
                                <span className="text-primary-900 line-through">{item.currentData.date}</span>
                                <span className="text-primary-500">→</span>
                                <span className="text-primary-900 font-medium">{item.newData.date}</span>
                              </div>
                            )}
                            {item.newData.goalId === item.currentData.goal_id && 
                             item.newData.areaId === item.currentData.area_id && 
                             item.newData.date === item.currentData.date && (
                              <div className="text-primary-600 italic">Žádné změny</div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                    {item.type === 'goal' && (
                      <div className="text-sm text-primary-700">
                        Upravím cíl: "{item.goalTitle}"
                      </div>
                    )}
                    {item.type === 'habit' && (
                      <div className="text-sm text-primary-700">
                        Upravím návyk: "{item.habitName}"
                </div>
              )}
            </div>
          )}
              </div>
            ))}
        </div>

          <div className="flex gap-2">
            <button
              onClick={handleConfirm}
              disabled={isConfirming}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 active:bg-primary-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm"
            >
              <Check className="w-4 h-4" />
              Ano
            </button>
            <button
              onClick={handleCancel}
              disabled={isConfirming}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-200 hover:bg-gray-300 active:bg-gray-400 text-gray-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm"
            >
              <XCircle className="w-4 h-4" />
              Ne
            </button>
          </div>
        </div>
      )}
      </div>
  )
}
