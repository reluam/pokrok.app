'use client'

import { useTranslations } from 'next-intl'
import { useState, useMemo } from 'react'
import { PlayfulButton } from '@/components/design-system/Button'
import { ChevronLeft, ChevronRight, Check, X } from 'lucide-react'

interface MonthViewProps {
  // Placeholder props - will be implemented later
  [key: string]: any
}

export function MonthView(props: MonthViewProps) {
  const t = useTranslations()
  const [clickCount, setClickCount] = useState(0)
  const [selectedVariant, setSelectedVariant] = useState<'primary' | 'secondary' | 'outline'>('primary')
  
  // Week View State
  const getWeekStart = (date: Date): Date => {
    const d = new Date(date)
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1) // Monday = 0
    const weekStart = new Date(d)
    weekStart.setDate(diff)
    weekStart.setHours(0, 0, 0, 0)
    return weekStart
  }
  
  const today = useMemo(() => {
    const date = new Date()
    date.setHours(0, 0, 0, 0)
    return date
  }, [])
  
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => getWeekStart(new Date()))
  const [selectedDayDate, setSelectedDayDate] = useState<Date | null>(null)
  
  // Get week days
  const weekDays = useMemo(() => {
    const days: Date[] = []
    const start = new Date(currentWeekStart)
    for (let i = 0; i < 7; i++) {
      const date = new Date(start)
      date.setDate(start.getDate() + i)
      days.push(date)
    }
    return days
  }, [currentWeekStart])
  
  // Day names
  const dayNamesShort = ['Ne', 'Po', 'Út', 'St', 'Čt', 'Pá', 'So']
  
  // Mock stats for each day (in real app, this would come from props)
  const getDayStats = (date: Date) => {
    // Mock data - random completion for demo
    const dayOfWeek = date.getDay()
    const mockStats = [
      { total: 5, completed: 5 }, // Sunday
      { total: 8, completed: 6 }, // Monday
      { total: 6, completed: 6 }, // Tuesday
      { total: 7, completed: 3 }, // Wednesday
      { total: 5, completed: 0 }, // Thursday
      { total: 4, completed: 0 }, // Friday
      { total: 3, completed: 0 }, // Saturday
    ]
    return mockStats[dayOfWeek] || { total: 0, completed: 0 }
  }
  
  const handlePrevWeek = () => {
    const newStart = new Date(currentWeekStart)
    newStart.setDate(newStart.getDate() - 7)
    setCurrentWeekStart(newStart)
    setSelectedDayDate(null)
  }
  
  const handleNextWeek = () => {
    const newStart = new Date(currentWeekStart)
    newStart.setDate(newStart.getDate() + 7)
    setCurrentWeekStart(newStart)
    setSelectedDayDate(null)
  }
  
  const handleDayClick = (date: Date) => {
    const dateStr = date.toDateString()
    const currentSelectedStr = selectedDayDate?.toDateString() || null
    
    if (currentSelectedStr === dateStr) {
      setSelectedDayDate(null)
    } else {
      setSelectedDayDate(date)
    }
  }
  
  // Format week header
  const weekHeader = useMemo(() => {
    const startDay = currentWeekStart.getDate()
    const endDate = new Date(currentWeekStart)
    endDate.setDate(endDate.getDate() + 6)
    const endDay = endDate.getDate()
    const month = endDate.toLocaleDateString('cs-CZ', { month: 'long' })
    const year = endDate.getFullYear()
    return `${startDay}. - ${endDay}. ${month} ${year}`
  }, [currentWeekStart])
  
  return (
    <div className="w-full h-full flex flex-col p-4 sm:p-6 lg:p-8 bg-background overflow-y-auto">
      {/* Header */}
      <div className="text-center mb-6 sm:mb-8">
        <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-black mb-2 sm:mb-4 font-playful">
          Týdenní Focus View - Playful Design
        </h2>
        <p className="text-sm sm:text-base text-text-secondary">
          Mockup týdenního zobrazení v novém playful stylu
        </p>
      </div>

      {/* Week View Section */}
      <div className="max-w-6xl mx-auto w-full space-y-6 sm:space-y-8 mb-12">
        {/* Week Header */}
        <div className="box-playful-highlight">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl sm:text-2xl font-bold text-black font-playful">
              {weekHeader}
            </h3>
            <div className="flex gap-2">
              <button
                onClick={handlePrevWeek}
                className="w-10 h-10 flex items-center justify-center border-4 border-primary-500 rounded-playful-md bg-white hover:bg-primary-50 transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-black" />
              </button>
              <button
                onClick={handleNextWeek}
                className="w-10 h-10 flex items-center justify-center border-4 border-primary-500 rounded-playful-md bg-white hover:bg-primary-50 transition-colors"
              >
                <ChevronRight className="w-5 h-5 text-black" />
              </button>
            </div>
          </div>
          
          {/* Timeline */}
          <div className="card-playful-base bg-white p-4 sm:p-6">
            <div className="flex items-center justify-between gap-2 sm:gap-4">
              {/* Timeline line */}
              <div className="relative flex items-center w-full max-w-4xl mx-auto">
                <div className="absolute left-2 right-2 h-1 bg-primary-200 top-4" />
                
                <div className="relative flex justify-between w-full">
                  {weekDays.map((day) => {
                    const dateStr = day.toDateString()
                    const isToday = dateStr === today.toDateString()
                    const isSelected = selectedDayDate?.toDateString() === dateStr
                    const stats = getDayStats(day)
                    const isPast = day < today
                    const isFuture = day > today
                    
                    const completionPercentage = stats.total > 0
                      ? Math.round((stats.completed / stats.total) * 100)
                      : 0
                    
                    // Determine colors
                    let dotBg = 'bg-gray-200'
                    let dotBorder = 'border-4 border-gray-300'
                    let textColor = 'text-gray-500'
                    let dayNumberColor = 'text-gray-700'
                    
                    if (isToday) {
                      dotBg = isSelected ? 'bg-primary-500' : 'bg-primary-500'
                      dotBorder = isSelected ? 'border-4 border-primary-700' : 'border-4 border-primary-500'
                      textColor = isSelected ? 'text-primary-600' : 'text-black'
                      dayNumberColor = isSelected ? 'text-primary-600' : 'text-black'
                    } else if (isFuture) {
                      dotBg = 'bg-gray-200'
                      dotBorder = 'border-4 border-gray-300'
                      textColor = 'text-gray-500'
                      dayNumberColor = 'text-gray-700'
                    } else if (isPast) {
                      if (stats.total > 0) {
                        if (completionPercentage === 100) {
                          dotBg = isSelected ? 'bg-primary-600' : 'bg-primary-600'
                          dotBorder = isSelected ? 'border-4 border-primary-700' : 'border-4 border-primary-600'
                          textColor = isSelected ? 'text-primary-600' : 'text-black'
                          dayNumberColor = isSelected ? 'text-primary-600' : 'text-black'
                        } else if (completionPercentage === 0) {
                          dotBg = 'bg-white'
                          dotBorder = 'border-4 border-primary-500'
                          textColor = isSelected ? 'text-primary-600' : 'text-black'
                          dayNumberColor = isSelected ? 'text-primary-600' : 'text-black'
                        } else {
                          dotBg = 'bg-white'
                          dotBorder = 'border-4 border-primary-500'
                          textColor = isSelected ? 'text-primary-600' : 'text-black'
                          dayNumberColor = isSelected ? 'text-primary-600' : 'text-black'
                        }
                      } else {
                        dotBg = 'bg-gray-300'
                        dotBorder = 'border-4 border-gray-400'
                        textColor = 'text-gray-500'
                        dayNumberColor = 'text-gray-700'
                      }
                    }
                    
                    return (
                      <button
                        key={dateStr}
                        onClick={() => handleDayClick(day)}
                        className="flex flex-col items-center group"
                      >
                        {/* Dot */}
                        <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all relative z-10 ${dotBg} ${dotBorder}`}>
                          {isPast && stats.total > 0 && (
                            <>
                              {completionPercentage === 100 && (
                                <Check className="w-4 h-4 sm:w-5 sm:h-5 text-white" strokeWidth={3} />
                              )}
                              {completionPercentage === 0 && (
                                <X className="w-6 h-6 sm:w-7 sm:h-7 text-primary-600" strokeWidth={3} />
                              )}
                              {completionPercentage > 0 && completionPercentage < 100 && (
                                <div className="text-xs sm:text-sm font-bold text-primary-600">
                                  {completionPercentage}%
                                </div>
                              )}
                            </>
                          )}
                        </div>
                        
                        {/* Day name */}
                        <span className={`text-xs sm:text-sm font-semibold mt-2 uppercase ${textColor}`}>
                          {dayNamesShort[day.getDay()]}
                        </span>
                        
                        {/* Day number */}
                        <span className={`text-base sm:text-lg font-bold ${dayNumberColor}`}>
                          {day.getDate()}
                        </span>
                        
                        {/* Tasks count */}
                        {stats.total > 0 && (
                          <span className={`text-[10px] sm:text-xs ${textColor}`}>
                            {stats.completed}/{stats.total}
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
          
          {/* Selected Day Info */}
          {selectedDayDate && (
            <div className="mt-4 p-4 bg-primary-50 rounded-playful-md border-4 border-primary-500">
              <h4 className="text-base sm:text-lg font-bold text-black mb-2 font-playful">
                {selectedDayDate.toLocaleDateString('cs-CZ', { weekday: 'long', day: 'numeric', month: 'long' })}
              </h4>
              <p className="text-sm text-black">
                Klikni znovu pro zrušení výběru
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Test Section */}
      <div className="max-w-4xl mx-auto w-full space-y-6 sm:space-y-8">
        {/* Variant Selection */}
        <div className="card-playful-base bg-white p-4 sm:p-6">
          <h3 className="text-lg sm:text-xl font-bold text-text-primary mb-4 font-playful">
            Vyber variantu:
          </h3>
          <div className="flex flex-wrap gap-2 sm:gap-3">
            {(['primary', 'secondary', 'outline'] as const).map((variant) => (
              <PlayfulButton
                key={variant}
                variant={variant}
                size="sm"
                onClick={() => setSelectedVariant(variant)}
                className={selectedVariant === variant ? 'ring-2 ring-primary-500 ring-offset-2' : ''}
              >
                {variant}
              </PlayfulButton>
            ))}
          </div>
        </div>

        {/* Size Examples */}
        <div className="card-playful-base bg-white p-4 sm:p-6">
          <h3 className="text-lg sm:text-xl font-bold text-text-primary mb-4 font-playful">
            Velikosti:
          </h3>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-start sm:items-center">
            <PlayfulButton variant={selectedVariant} size="sm">
              Malé (sm)
            </PlayfulButton>
            <PlayfulButton variant={selectedVariant} size="md">
              Střední (md)
            </PlayfulButton>
            <PlayfulButton variant={selectedVariant} size="lg">
              Velké (lg)
            </PlayfulButton>
          </div>
        </div>

        {/* All Variants */}
        <div className="card-playful-base bg-white p-4 sm:p-6">
          <h3 className="text-lg sm:text-xl font-bold text-text-primary mb-4 font-playful">
            Všechny varianty:
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <PlayfulButton variant="primary" size="md">
              Primary
            </PlayfulButton>
            <PlayfulButton variant="secondary" size="md">
              Secondary
            </PlayfulButton>
            <PlayfulButton variant="outline" size="md">
              Outline
            </PlayfulButton>
          </div>
        </div>

        {/* Interactive Test */}
        <div className="card-playful-base bg-white p-4 sm:p-6">
          <h3 className="text-lg sm:text-xl font-bold text-text-primary mb-4 font-playful">
            Interaktivní test:
          </h3>
          <div className="space-y-4">
            <PlayfulButton
              variant={selectedVariant}
              size="md"
              onClick={() => setClickCount(prev => prev + 1)}
            >
              Klikni mě! (Počet kliků: {clickCount})
            </PlayfulButton>
            {clickCount > 0 && (
              <div className="p-3 sm:p-4 bg-primary-50 rounded-playful-md border-4 border-primary-500">
                <p className="text-sm sm:text-base text-black font-medium">
                  ✅ Animace funguje! Počet kliků: {clickCount}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Responsive Test */}
        <div className="card-playful-base bg-white p-4 sm:p-6">
          <h3 className="text-lg sm:text-xl font-bold text-text-primary mb-4 font-playful">
            Responsivní test:
          </h3>
          <p className="text-sm sm:text-base text-text-secondary mb-4">
            Tlačítka jsou plné šířky na mobilu, automatické na desktopu
          </p>
          <div className="space-y-3 sm:space-y-0 sm:flex sm:gap-3">
            <PlayfulButton variant="primary" size="md" className="sm:w-auto">
              Mobil: plná šířka
            </PlayfulButton>
            <PlayfulButton variant="secondary" size="md" className="sm:w-auto">
              Desktop: auto
            </PlayfulButton>
          </div>
        </div>

        {/* Simple Examples */}
        <div className="space-y-4 sm:space-y-6">
          <div className="card-playful-primary p-4 sm:p-6">
            <h3 className="text-lg sm:text-xl font-bold text-black mb-4 font-playful">
              Na světlém pozadí:
            </h3>
            <PlayfulButton variant="primary" size="md">
              Primary tlačítko
            </PlayfulButton>
          </div>
          
          <div className="card-playful-white p-4 sm:p-6">
            <PlayfulButton variant="outline" size="md">
              Outline tlačítko
            </PlayfulButton>
          </div>
        </div>

        {/* Highlighted Box with Primary "Shadow" */}
        <div className="box-playful-highlight">
          <h3 className="text-lg sm:text-xl font-bold text-black mb-4 font-playful">
            ⭐ Zvýrazněný box s primary &quot;stínem&quot;
          </h3>
          <p className="text-sm sm:text-base text-black mb-4">
            Tento box má primary oranžovou barvu jako &quot;stín&quot; pod sebou. 
            Vytváří to hezký zvýrazňující efekt bez použití skutečného stínu.
          </p>
          <div className="flex flex-wrap gap-3">
            <PlayfulButton variant="primary" size="md">
              Akce 1
            </PlayfulButton>
            <PlayfulButton variant="secondary" size="md">
              Akce 2
            </PlayfulButton>
          </div>
        </div>

        {/* Another example with light background */}
        <div className="box-playful-highlight-primary">
          <h3 className="text-lg sm:text-xl font-bold text-black mb-4 font-playful">
            📦 Další příklad s světlým pozadím
          </h3>
          <p className="text-sm sm:text-base text-black mb-4">
            Stejný efekt, ale se světlým pozadím místo bílého.
          </p>
          <PlayfulButton variant="outline" size="md">
            Zkus mě!
          </PlayfulButton>
        </div>

        {/* Info */}
        <div className="card-playful-primary p-4 sm:p-6">
          <h3 className="text-lg sm:text-xl font-bold text-black mb-2 sm:mb-3 font-playful">
            ✨ Simple Design
          </h3>
          <ul className="text-sm sm:text-base text-black space-y-2 list-disc list-inside">
            <li>Pouze projektové barvy (primary oranžová)</li>
            <li>Vysoký kontrast (černý border, černý text)</li>
            <li>Žádné stíny - flat design</li>
            <li>Žádné lesklé efekty - simple hover</li>
            <li>Responsivní na všech zařízeních</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
