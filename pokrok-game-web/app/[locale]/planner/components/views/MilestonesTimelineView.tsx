'use client'

import { useState, useEffect, useRef } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { Calendar, Plus, Check, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Footprints } from 'lucide-react'
import { getLocalDateString } from '../utils/dateHelpers'

interface Milestone {
  id: string
  area_id: string
  title: string
  description?: string
  completed_date?: string | Date
  progress?: number
  created_at: string | Date
  updated_at: string | Date
}

interface MilestonesTimelineViewProps {
  areaId: string
  userId: string
  area?: any // Area object with color and icon
  onMilestoneUpdate?: () => void
  onCreateMilestoneTrigger?: number
  onMilestoneCreated?: () => void
}

export function MilestonesTimelineView({ areaId, userId, area, onMilestoneUpdate, onCreateMilestoneTrigger, onMilestoneCreated }: MilestonesTimelineViewProps) {
  const t = useTranslations()
  const locale = useLocale()
  const localeCode = locale === 'cs' ? 'cs-CZ' : 'en-US'
  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [loading, setLoading] = useState(true)
  const [editingTitleId, setEditingTitleId] = useState<string | null>(null)
  const [editingDescriptionId, setEditingDescriptionId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [newCompletedDate, setNewCompletedDate] = useState('')
  const [isCollapsed, setIsCollapsed] = useState(false)
  const timelineRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)
  const [datePickerOpen, setDatePickerOpen] = useState<string | null>(null)
  const [datePickerPosition, setDatePickerPosition] = useState<{ top: number; left: number } | null>(null)
  const [datePickerMonth, setDatePickerMonth] = useState<Record<string, Date>>({})
  const [showCompleteModal, setShowCompleteModal] = useState<string | null>(null)

  useEffect(() => {
    loadMilestones()
  }, [areaId])

  useEffect(() => {
    if (onCreateMilestoneTrigger && onCreateMilestoneTrigger > 0) {
      setShowAddForm(true)
      setIsCollapsed(false)
    }
  }, [onCreateMilestoneTrigger])

  const loadMilestones = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/milestones?areaId=${areaId}`)
      if (response.ok) {
        const data = await response.json()
        setMilestones(data)
      }
    } catch (error) {
      console.error('Error loading milestones:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async () => {
    if (!newTitle.trim()) return

    try {
      const response = await fetch('/api/milestones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          areaId,
          title: newTitle.trim(),
          description: newDescription.trim() || null,
          completedDate: newCompletedDate || null,
          progress: 0
        })
      })

      if (response.ok) {
        setNewTitle('')
        setNewDescription('')
        setNewCompletedDate('')
        setShowAddForm(false)
        setIsCollapsed(false)
        loadMilestones()
        onMilestoneUpdate?.()
        onMilestoneCreated?.()
      }
    } catch (error) {
      console.error('Error creating milestone:', error)
    }
  }

  const handleUpdateTitle = async (id: string) => {
    if (!editTitle.trim()) {
      setEditingTitleId(null)
      return
    }
    
    try {
      const milestone = milestones.find(m => m.id === id)
      const response = await fetch(`/api/milestones/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editTitle.trim(),
          description: milestone?.description,
          completedDate: milestone?.completed_date ? new Date(milestone.completed_date).toISOString().split('T')[0] : null,
          progress: milestone?.progress || 0
        })
      })

      if (response.ok) {
        setEditingTitleId(null)
        loadMilestones()
        onMilestoneUpdate?.()
      }
    } catch (error) {
      console.error('Error updating milestone title:', error)
    }
  }

  const handleUpdateDescription = async (id: string) => {
    try {
      const milestone = milestones.find(m => m.id === id)
      const response = await fetch(`/api/milestones/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: milestone?.title,
          description: editDescription.trim() || null,
          completedDate: milestone?.completed_date ? new Date(milestone.completed_date).toISOString().split('T')[0] : null,
          progress: milestone?.progress || 0
        })
      })

      if (response.ok) {
        setEditingDescriptionId(null)
        loadMilestones()
        onMilestoneUpdate?.()
      }
    } catch (error) {
      console.error('Error updating milestone description:', error)
    }
  }

  const handleUpdateDate = async (id: string, dateStr: string) => {
    try {
      const milestone = milestones.find(m => m.id === id)
      const response = await fetch(`/api/milestones/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: milestone?.title,
          description: milestone?.description,
          completedDate: dateStr || null,
          progress: milestone?.progress || 0
        })
      })

      if (response.ok) {
        loadMilestones()
        onMilestoneUpdate?.()
      }
    } catch (error) {
      console.error('Error updating milestone date:', error)
    }
  }

  const handleProgressUpdate = async (id: string, progress: number) => {
    try {
      const response = await fetch(`/api/milestones/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ progress })
      })

      if (response.ok) {
        loadMilestones()
        onMilestoneUpdate?.()
      }
    } catch (error) {
      console.error('Error updating progress:', error)
    }
  }

  const handleComplete = async (id: string) => {
    try {
      const response = await fetch(`/api/milestones/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setShowCompleteModal(null)
        loadMilestones()
        onMilestoneUpdate?.()
      }
    } catch (error) {
      console.error('Error completing milestone:', error)
    }
  }


  const formatDate = (date: string | Date | undefined) => {
    if (!date) return null
    const d = new Date(date)
    return d.toLocaleDateString('cs-CZ', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  const formatDateShort = (date: string | Date | undefined) => {
    if (!date) return null
    const d = new Date(date)
    return d.toLocaleDateString('cs-CZ', { day: 'numeric', month: 'short' })
  }

  const updateScrollButtons = () => {
    if (timelineRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = timelineRef.current
      setCanScrollLeft(scrollLeft > 0)
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10)
    }
  }

  useEffect(() => {
    updateScrollButtons()
    const handleResize = () => updateScrollButtons()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [milestones])

  const scrollLeft = () => {
    if (timelineRef.current) {
      timelineRef.current.scrollBy({ left: -300, behavior: 'smooth' })
      setTimeout(updateScrollButtons, 300)
    }
  }

  const scrollRight = () => {
    if (timelineRef.current) {
      timelineRef.current.scrollBy({ left: 300, behavior: 'smooth' })
      setTimeout(updateScrollButtons, 300)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  // Sort milestones by completed_date (ascending), then by created_at
  const sortedMilestones = [...milestones].sort((a, b) => {
    if (!a.completed_date && !b.completed_date) {
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    }
    if (!a.completed_date) return 1
    if (!b.completed_date) return -1
    return new Date(a.completed_date).getTime() - new Date(b.completed_date).getTime()
  })

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 px-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="flex items-center gap-1.5 px-2 py-1 hover:bg-gray-100 rounded-lg transition-colors"
            title={isCollapsed ? 'Rozbalit milníky' : 'Zabalit milníky'}
          >
            {isCollapsed ? (
              <ChevronDown className="w-4 h-4 text-gray-600" />
            ) : (
              <ChevronUp className="w-4 h-4 text-gray-600" />
            )}
            <h2 className="text-xl font-bold text-black font-playful">Milníky</h2>
          </button>
        </div>
        {!showAddForm && !isCollapsed && (
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2 px-3 py-1.5 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            Přidat milník
          </button>
        )}
      </div>

      {/* Add Form */}
      {showAddForm && !isCollapsed && (
        <div className="mb-4 p-4 bg-white rounded-lg border-2 border-primary-500">
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Název milníku"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              autoFocus
            />
            <textarea
              placeholder="Popis (volitelné)"
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
              rows={2}
            />
            <input
              type="date"
              placeholder="Datum dokončení"
              value={newCompletedDate}
              onChange={(e) => setNewCompletedDate(e.target.value)}
              className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
            <div className="flex items-center gap-2">
              <button
                onClick={handleCreate}
                disabled={!newTitle.trim()}
                className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
              >
                Vytvořit
              </button>
              <button
                onClick={() => {
                  setShowAddForm(false)
                  setNewTitle('')
                  setNewDescription('')
                  setNewCompletedDate('')
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm font-medium"
              >
                Zrušit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Horizontal Timeline */}
      {!isCollapsed && (
        <>
          {sortedMilestones.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>Žádné milníky</p>
            </div>
          ) : (
            <div className="relative">
              {/* Navigation arrows */}
              {sortedMilestones.length > 3 && (
                <>
                  {canScrollLeft && (
                    <button
                      onClick={scrollLeft}
                      className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white border-2 border-primary-500 rounded-full p-2 hover:bg-primary-50 transition-colors shadow-lg"
                      title="Posunout doleva"
                    >
                      <ChevronLeft className="w-5 h-5 text-primary-600" />
                    </button>
                  )}
                  {canScrollRight && (
                    <button
                      onClick={scrollRight}
                      className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white border-2 border-primary-500 rounded-full p-2 hover:bg-primary-50 transition-colors shadow-lg"
                      title="Posunout doprava"
                    >
                      <ChevronRight className="w-5 h-5 text-primary-600" />
                    </button>
                  )}
                </>
              )}

              {/* Timeline container */}
              <div 
                ref={timelineRef}
                className="overflow-x-auto pb-4 px-12"
                onScroll={updateScrollButtons}
                style={{
                  scrollbarWidth: 'thin',
                  scrollbarColor: 'var(--color-primary-500, #E8871E) transparent'
                }}
              >
                <div className="relative flex items-start gap-8 min-w-max pb-16 pt-8">
                  {/* Timeline line - aligned with center of dots (pt-8 = 32px, dot center at 32px + 12px = 44px) */}
                  <div className="absolute top-11 left-0 right-0 h-0.5 bg-primary-200 z-0"></div>

                  {sortedMilestones.map((milestone, index) => (
                    <div key={milestone.id} className="relative flex flex-col items-center min-w-[200px] max-w-[200px]">
                      {/* Timeline dot with date */}
                      <div className="relative z-10">
                        {/* Date above dot - clickable */}
                        <button
                          onClick={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect()
                            setDatePickerPosition({ top: rect.bottom + 5, left: rect.left + rect.width / 2 })
                            setDatePickerOpen(milestone.id)
                            const currentDate = milestone.completed_date ? new Date(milestone.completed_date) : new Date()
                            setDatePickerMonth(prev => ({
                              ...prev,
                              [milestone.id]: currentDate
                            }))
                          }}
                          className="absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs text-gray-700 font-bold hover:text-primary-600 transition-colors cursor-pointer z-20"
                        >
                          {milestone.completed_date ? formatDateShort(milestone.completed_date) : 'Klikni pro datum'}
                        </button>
                        {/* Dot - center aligned with timeline line */}
                        <div className="w-6 h-6 bg-primary-500 rounded-full border-4 border-white flex items-center justify-center shadow-lg relative z-10">
                          <div className="w-2 h-2 bg-white rounded-full"></div>
                        </div>
                      </div>

                      {/* Milestone card - positioned 20px below dot */}
                      <div 
                        className="rounded-lg border-2 p-4 transition-colors w-full shadow-sm mt-5 max-w-full overflow-hidden"
                        style={{ 
                          backgroundColor: area?.color ? `${area.color}10` : '#E8871E10',
                          borderColor: area?.color ? `${area.color}40` : '#E8871E40'
                        }}
                        onMouseEnter={(e) => {
                          if (area?.color) {
                            e.currentTarget.style.borderColor = `${area.color}60`
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (area?.color) {
                            e.currentTarget.style.borderColor = `${area.color}40`
                          }
                        }}
                      >
                        <>
                            <div className="mb-2">
                              {/* Title - inline editable */}
                              {editingTitleId === milestone.id ? (
                                <input
                                  type="text"
                                  value={editTitle}
                                  onChange={(e) => setEditTitle(e.target.value)}
                                  onBlur={() => {
                                    if (editTitle.trim() !== milestone.title) {
                                      handleUpdateTitle(milestone.id)
                                    } else {
                                      setEditingTitleId(null)
                                    }
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      if (editTitle.trim() !== milestone.title) {
                                        handleUpdateTitle(milestone.id)
                                      } else {
                                        setEditingTitleId(null)
                                      }
                                    } else if (e.key === 'Escape') {
                                      setEditTitle(milestone.title)
                                      setEditingTitleId(null)
                                    }
                                  }}
                                  className="w-full px-2 py-1 border-2 border-primary-500 rounded-lg focus:ring-2 focus:ring-primary-500 font-semibold text-sm break-words bg-white"
                                  autoFocus
                                />
                              ) : (
                                <h3 
                                  onClick={() => {
                                    setEditingTitleId(milestone.id)
                                    setEditTitle(milestone.title)
                                  }}
                                  className="font-semibold text-gray-900 text-sm mb-1 cursor-pointer hover:opacity-80 transition-opacity break-words word-wrap"
                                >
                                  {milestone.title}
                                </h3>
                              )}
                              
                              {/* Description - inline editable */}
                              {editingDescriptionId === milestone.id ? (
                                <textarea
                                  value={editDescription}
                                  onChange={(e) => setEditDescription(e.target.value)}
                                  onBlur={() => {
                                    if (editDescription.trim() !== (milestone.description || '')) {
                                      handleUpdateDescription(milestone.id)
                                    } else {
                                      setEditingDescriptionId(null)
                                    }
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Escape') {
                                      setEditDescription(milestone.description || '')
                                      setEditingDescriptionId(null)
                                    }
                                  }}
                                  className="w-full px-2 py-1 border-2 border-primary-500 rounded-lg focus:ring-2 focus:ring-primary-500 resize-none text-xs mt-1 break-words bg-white"
                                  rows={2}
                                  autoFocus
                                />
                              ) : (
                                <p 
                                  onClick={() => {
                                    setEditingDescriptionId(milestone.id)
                                    setEditDescription(milestone.description || '')
                                  }}
                                  className={`text-xs text-gray-700 mb-2 cursor-pointer hover:opacity-80 transition-opacity break-words word-wrap ${
                                    !milestone.description ? 'italic text-gray-500' : ''
                                  }`}
                                >
                                  {milestone.description || (t('common.clickToAddDescription') || 'Klikni pro přidání popisu')}
                                </p>
                              )}
                            </div>

                            {/* Progress section */}
                            <div className="mt-3 pt-3" style={{ borderTopColor: area?.color ? `${area.color}40` : '#E8871E40', borderTopWidth: '1px', borderTopStyle: 'solid' }}>
                              <div className="text-xs text-gray-700 mb-3 font-medium">Jak daleko jsi?</div>
                              {/* 10 step icons for progress */}
                              <div className="flex items-center gap-0.5 mb-2 overflow-hidden w-full">
                                {[0, 10, 20, 30, 40, 50, 60, 70, 80, 90].map((progressValue, index) => {
                                  const currentProgress = milestone.progress || 0
                                  const stepProgress = progressValue + 10
                                  const isActive = currentProgress >= stepProgress
                                  const isPartial = currentProgress > progressValue && currentProgress < stepProgress
                                  const isEven = index % 2 === 0
                                  
                                  return (
                                    <button
                                      key={progressValue}
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        handleProgressUpdate(milestone.id, stepProgress)
                                      }}
                                      className={`flex-shrink-0 transition-all hover:scale-110 cursor-pointer touch-manipulation ${
                                        isActive
                                          ? 'text-primary-600'
                                          : isPartial
                                            ? 'text-primary-400 opacity-75'
                                            : 'text-gray-300 hover:text-gray-400'
                                      } ${isEven ? 'translate-y-0.5' : '-translate-y-0.5'}`}
                                      style={{ flex: '0 0 auto' }}
                                      title={`${stepProgress}%`}
                                    >
                                      {/* Full Footprints icon */}
                                      <Footprints 
                                        className={`w-3.5 h-3.5 rotate-90 transition-all ${
                                          isActive ? 'text-primary-600' : ''
                                        }`}
                                        fill={isActive ? 'currentColor' : 'none'}
                                        strokeWidth={isActive ? 2 : 1.5}
                                      />
                                    </button>
                                  )
                                })}
                              </div>
                              {/* Progress percentage and complete icon */}
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-xs font-bold text-primary-600">
                                  {milestone.progress || 0}%
                                </span>
                                <button
                                  onClick={() => setShowCompleteModal(milestone.id)}
                                  className="p-1.5 border-2 border-primary-500 text-primary-600 rounded-full hover:bg-primary-50 transition-colors"
                                  title="Dokončit milník"
                                >
                                  <Check className="w-3 h-3" strokeWidth={2.5} />
                                </button>
                              </div>
                            </div>
                        </>
                      </div>
                      
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Date Picker Modal - same as in StepModal */}
      {datePickerOpen && datePickerPosition && (() => {
        const milestoneId = datePickerOpen
        const milestone = milestones.find(m => m.id === milestoneId)
        if (!milestone) return null
        
        const currentMonth = datePickerMonth[milestoneId] || (milestone.completed_date ? new Date(milestone.completed_date) : new Date())
        
        return (
          <>
            <div 
              className="fixed inset-0 z-40"
              onClick={() => {
                setDatePickerOpen(null)
                setDatePickerPosition(null)
              }}
            />
            <div 
              className="fixed z-50 box-playful-highlight p-4 bg-white"
              style={{
                top: `${Math.min(datePickerPosition.top, window.innerHeight - 380)}px`,
                left: `${datePickerPosition.left}px`,
                width: '230px',
                transform: 'translateX(-50%)'
              }}
            >
              <div className="text-sm font-bold text-black mb-3 font-playful">{t('steps.date') || 'Datum'}</div>
              
              {/* Month navigation */}
              <div className="flex items-center justify-between mb-3">
                <button
                  onClick={() => {
                    const newMonth = new Date(currentMonth)
                    newMonth.setMonth(newMonth.getMonth() - 1)
                    setDatePickerMonth(prev => ({
                      ...prev,
                      [milestoneId]: newMonth
                    }))
                  }}
                  className="p-1 hover:bg-primary-50 rounded-playful-sm border-2 border-primary-500 transition-colors"
                >
                  <ChevronDown className="w-4 h-4 rotate-90 text-black" />
                </button>
                <span className="text-xs font-semibold text-black">
                  {currentMonth.toLocaleDateString(localeCode, { month: 'long', year: 'numeric' })}
                </span>
                <button
                  onClick={() => {
                    const newMonth = new Date(currentMonth)
                    newMonth.setMonth(newMonth.getMonth() + 1)
                    setDatePickerMonth(prev => ({
                      ...prev,
                      [milestoneId]: newMonth
                    }))
                  }}
                  className="p-1 hover:bg-primary-50 rounded-playful-sm border-2 border-primary-500 transition-colors"
                >
                  <ChevronDown className="w-4 h-4 -rotate-90 text-black" />
                </button>
              </div>
              
              {/* Day names */}
              <div className="grid grid-cols-7 gap-0.5 mb-1">
                {locale === 'cs' 
                  ? ['Po', 'Út', 'St', 'Čt', 'Pá', 'So', 'Ne'].map(day => (
                      <div key={day} className="text-center text-xs text-gray-600 font-medium py-1">
                        {day}
                      </div>
                    ))
                  : ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map(day => (
                      <div key={day} className="text-center text-xs text-gray-600 font-medium py-1">
                        {day}
                      </div>
                    ))
                }
              </div>
              
              {/* Calendar days */}
              <div className="grid grid-cols-7 gap-0.5">
                {(() => {
                  const year = currentMonth.getFullYear()
                  const month = currentMonth.getMonth()
                  const firstDay = new Date(year, month, 1)
                  const lastDay = new Date(year, month + 1, 0)
                  const startDay = (firstDay.getDay() + 6) % 7 // Monday = 0
                  const days: (Date | null)[] = []
                  
                  // Empty cells before first day
                  for (let i = 0; i < startDay; i++) {
                    days.push(null)
                  }
                  
                  // Days of month
                  for (let d = 1; d <= lastDay.getDate(); d++) {
                    days.push(new Date(year, month, d))
                  }
                  
                  const today = new Date()
                  today.setHours(0, 0, 0, 0)
                  const selectedDateValue = milestone.completed_date ? new Date(milestone.completed_date) : null
                  if (selectedDateValue) selectedDateValue.setHours(0, 0, 0, 0)
                  
                  return days.map((day, i) => {
                    if (!day) {
                      return <div key={`empty-${i}`} className="w-7 h-7" />
                    }
                    
                    const isToday = day.getTime() === today.getTime()
                    const isSelected = selectedDateValue && day.getTime() === selectedDateValue.getTime()
                    
                    return (
                      <button
                        key={day.getTime()}
                        onClick={() => {
                          const dateStr = getLocalDateString(day)
                          handleUpdateDate(milestoneId, dateStr)
                          setDatePickerOpen(null)
                          setDatePickerPosition(null)
                        }}
                        className={`w-7 h-7 rounded-playful-sm text-xs font-medium transition-colors border-2 ${
                          isSelected
                            ? 'bg-white text-black font-bold border-primary-500'
                            : isToday
                              ? 'bg-primary-100 text-primary-600 font-bold border-primary-500'
                              : 'hover:bg-primary-50 text-black border-gray-300'
                        }`}
                      >
                        {day.getDate()}
                      </button>
                    )
                  })
                })()}
              </div>
            </div>
          </>
        )
      })()}

      {/* Complete Milestone Modal */}
      {showCompleteModal && (() => {
        const milestone = milestones.find(m => m.id === showCompleteModal)
        if (!milestone) return null
        
        return (
          <>
            <div 
              className="fixed inset-0 z-40 bg-black bg-opacity-50"
              onClick={() => setShowCompleteModal(null)}
            />
            <div 
              className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white border-2 border-primary-500 rounded-playful-lg p-6 shadow-lg max-w-md w-full mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-bold text-black mb-4 font-playful">
                Dokončit milník?
              </h3>
              <p className="text-sm text-gray-600 mb-6">
                Opravdu chcete dokončit milník "{milestone.title}"? Milník bude smazán.
              </p>
              <div className="flex items-center gap-3 justify-end">
                <button
                  onClick={() => setShowCompleteModal(null)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-playful-md hover:bg-gray-300 transition-colors text-sm font-medium"
                >
                  Zrušit
                </button>
                <button
                  onClick={() => handleComplete(milestone.id)}
                  className="px-4 py-2 bg-primary-500 text-white rounded-playful-md hover:bg-primary-600 transition-colors text-sm font-medium"
                >
                  Dokončit
                </button>
              </div>
            </div>
          </>
        )
      })()}
    </div>
  )
}
