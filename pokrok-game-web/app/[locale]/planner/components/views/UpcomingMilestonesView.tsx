'use client'

import { useState, useEffect, useRef } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { ChevronLeft, ChevronRight, Calendar, ChevronDown } from 'lucide-react'
import { getLocalDateString } from '../utils/dateHelpers'
import { getIconComponent } from '@/lib/icon-utils'

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

interface UpcomingMilestonesViewProps {
  userId: string | null | undefined
  areas?: any[]
}

export function UpcomingMilestonesView({ userId, areas = [] }: UpcomingMilestonesViewProps) {
  const t = useTranslations()
  const locale = useLocale()
  const localeCode = locale === 'cs' ? 'cs-CZ' : 'en-US'
  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [loading, setLoading] = useState(true)
  const timelineRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)
  const [editingTitleId, setEditingTitleId] = useState<string | null>(null)
  const [editingDescriptionId, setEditingDescriptionId] = useState<string | null>(null)
  const [editingDateId, setEditingDateId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editCompletedDate, setEditCompletedDate] = useState('')
  const [datePickerOpen, setDatePickerOpen] = useState<string | null>(null)
  const [datePickerPosition, setDatePickerPosition] = useState<{ top: number; left: number } | null>(null)
  const [datePickerMonth, setDatePickerMonth] = useState<Record<string, Date>>({})

  useEffect(() => {
    if (userId) {
      loadMilestones()
    }
  }, [userId])

  useEffect(() => {
    checkScrollButtons()
  }, [milestones])

  const loadMilestones = async () => {
    setLoading(true)
    try {
      // Fetch all milestones for user (no areaId filter)
      const response = await fetch(`/api/milestones`)
      if (response.ok) {
        const data = await response.json()
        // Filter out milestones without completed_date (only show milestones with dates)
        const milestonesWithDates = data.filter((m: Milestone) => m.completed_date)
        setMilestones(milestonesWithDates)
      }
    } catch (error) {
      console.error('Error loading milestones:', error)
    } finally {
      setLoading(false)
    }
  }

  const checkScrollButtons = () => {
    if (timelineRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = timelineRef.current
      setCanScrollLeft(scrollLeft > 0)
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10)
    }
  }

  const scrollLeft = () => {
    if (timelineRef.current) {
      timelineRef.current.scrollBy({ left: -300, behavior: 'smooth' })
      setTimeout(checkScrollButtons, 300)
    }
  }

  const scrollRight = () => {
    if (timelineRef.current) {
      timelineRef.current.scrollBy({ left: 300, behavior: 'smooth' })
      setTimeout(checkScrollButtons, 300)
    }
  }

  const formatDateShort = (date: string | Date | undefined) => {
    if (!date) return ''
    const d = typeof date === 'string' ? new Date(date) : date
    if (isNaN(d.getTime())) return ''
    return d.toLocaleDateString(localeCode, { day: 'numeric', month: 'short' })
  }

  const getArea = (areaId: string) => {
    return areas.find(a => a.id === areaId) || null
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
          completedDate: milestone?.completed_date || null,
          progress: milestone?.progress || 0
        })
      })

      if (response.ok) {
        setEditingTitleId(null)
        loadMilestones()
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
          completedDate: milestone?.completed_date || null,
          progress: milestone?.progress || 0
        })
      })

      if (response.ok) {
        setEditingDescriptionId(null)
        loadMilestones()
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
      }
    } catch (error) {
      console.error('Error updating milestone date:', error)
    }
  }

  if (!userId || loading) {
    return null
  }

  if (milestones.length === 0) {
    return null
  }

  return (
    <div className="mb-2">
      {/* Horizontal timeline */}
      <div className="relative px-4 sm:px-6 lg:px-8">
          {/* Scroll buttons */}
          {canScrollLeft && (
            <button
              onClick={scrollLeft}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white border-2 border-primary-500 rounded-full p-1.5 shadow-lg hover:bg-primary-50 transition-colors"
            >
              <ChevronLeft className="w-4 h-4 text-primary-600" />
            </button>
          )}
          {canScrollRight && (
            <button
              onClick={scrollRight}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white border-2 border-primary-500 rounded-full p-1.5 shadow-lg hover:bg-primary-50 transition-colors"
            >
              <ChevronRight className="w-4 h-4 text-primary-600" />
            </button>
          )}

          {/* Timeline container */}
          <div
            ref={timelineRef}
            onScroll={checkScrollButtons}
            className="overflow-x-auto pb-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
          >
            <div className="flex items-start gap-4 px-2 relative pt-8 pb-4" style={{ minWidth: 'max-content' }}>
              {/* Timeline line - aligned with center of dots (pt-8 = 32px, dot center at 32px + 12px = 44px, so top-11 = 44px) */}
              <div className="absolute top-11 left-0 right-0 h-0.5 bg-primary-300 z-0" style={{ margin: '0 2rem' }} />
              
              {/* Milestones */}
              {milestones.map((milestone, index) => {
                const area = getArea(milestone.area_id)
                
                return (
                  <div key={milestone.id} className="flex flex-col items-center relative z-20" style={{ minWidth: '200px' }}>
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
                      {milestone.completed_date ? formatDateShort(milestone.completed_date) : ''}
                    </button>
                    
                    {/* Dot - center aligned with timeline line */}
                    <div className="w-6 h-6 bg-primary-500 rounded-full border-4 border-white flex items-center justify-center shadow-lg relative z-10">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                    
                    {/* Milestone card - simplified (only title and description) */}
                    <div className="bg-white rounded-lg border-2 border-gray-200 p-3 hover:border-primary-300 transition-colors w-full shadow-sm mt-5">
                      {/* Area with color and icon */}
                      {area && (
                        <div 
                          className="text-xs mb-1 font-medium flex items-center gap-1.5 px-2 py-0.5 rounded-playful-sm inline-block"
                          style={{ 
                            backgroundColor: area.color ? `${area.color}20` : '#E8871E20',
                            color: area.color || '#E8871E'
                          }}
                        >
                          {area.icon && (() => {
                            const IconComponent = getIconComponent(area.icon)
                            return <IconComponent className="w-3 h-3" />
                          })()}
                          <span>{area.name}</span>
                        </div>
                      )}
                      
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
                          className="w-full px-2 py-1 border-2 border-primary-500 rounded-lg focus:ring-2 focus:ring-primary-500 font-semibold text-sm mb-1"
                          autoFocus
                        />
                      ) : (
                        <h4
                          onClick={() => {
                            setEditingTitleId(milestone.id)
                            setEditTitle(milestone.title)
                          }}
                          className="font-semibold text-gray-900 text-sm mb-1 cursor-pointer hover:text-primary-600 transition-colors"
                        >
                          {milestone.title}
                        </h4>
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
                          className="w-full px-2 py-1 border-2 border-primary-500 rounded-lg focus:ring-2 focus:ring-primary-500 resize-none text-xs"
                          rows={2}
                          autoFocus
                        />
                      ) : (
                        <p
                          onClick={() => {
                            setEditingDescriptionId(milestone.id)
                            setEditDescription(milestone.description || '')
                          }}
                          className={`text-xs text-gray-600 cursor-pointer hover:text-primary-600 transition-colors ${
                            !milestone.description ? 'italic text-gray-400' : ''
                          }`}
                        >
                          {milestone.description || (t('common.clickToAddDescription') || 'Klikni pro přidání popisu')}
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

      {/* Date Picker Modal - same as in MilestonesTimelineView */}
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
    </div>
  )
}
