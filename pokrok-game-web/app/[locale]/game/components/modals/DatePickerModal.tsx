'use client'

import { useTranslations, useLocale } from 'next-intl'
import { getLocalDateString } from '../utils/dateHelpers'

interface DatePickerModalProps {
  show: boolean
  onClose: () => void
  currentProgram: 'day' | 'week' | 'month' | 'year'
  selectedDayDate: Date
  setSelectedDayDate: (date: Date) => void
  selectedWeek: Date
  setSelectedWeek: (date: Date) => void
  selectedMonth: Date
  setSelectedMonth: (date: Date) => void
  selectedYear: number
  setSelectedYear: (year: number) => void
}

export function DatePickerModal({
  show,
  onClose,
  currentProgram,
  selectedDayDate,
  setSelectedDayDate,
  selectedWeek,
  setSelectedWeek,
  selectedMonth,
  setSelectedMonth,
  selectedYear,
  setSelectedYear,
}: DatePickerModalProps) {
  const t = useTranslations()
  const locale = useLocale()
  const localeCode = locale === 'cs' ? 'cs-CZ' : 'en-US'

  if (!show) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-gray-900">
              {currentProgram === 'day' ? 'Vyberte den' : 
               currentProgram === 'week' ? 'Vyberte týden' :
               currentProgram === 'month' ? 'Vyberte měsíc' :
               'Vyberte rok'}
            </h3>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Day Picker - Calendar */}
          {currentProgram === 'day' && (
            <div className="space-y-4">
              <div className="grid grid-cols-7 gap-2 mb-4">
                {['Po', 'Út', 'St', 'Čt', 'Pá', 'So', 'Ne'].map(day => (
                  <div key={day} className="text-center text-sm font-semibold text-gray-600 py-2">
                    {day}
                  </div>
                ))}
              </div>
              {(() => {
                const today = new Date()
                const currentMonth = selectedDayDate.getMonth()
                const currentYear = selectedDayDate.getFullYear()
                const firstDay = new Date(currentYear, currentMonth, 1)
                const lastDay = new Date(currentYear, currentMonth + 1, 0)
                const daysInMonth = lastDay.getDate()
                const startingDayOfWeek = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1
                const todayStr = getLocalDateString()
                
                const days = []
                // Empty cells for days before month starts
                for (let i = 0; i < startingDayOfWeek; i++) {
                  days.push(null)
                }
                // Days of the month
                for (let day = 1; day <= daysInMonth; day++) {
                  const date = new Date(currentYear, currentMonth, day)
                  days.push(date)
                }

                return (
                  <div className="grid grid-cols-7 gap-2">
                    {days.map((date, index) => {
                      if (!date) {
                        return <div key={`empty-${index}`} className="h-10"></div>
                      }
                      
                      const dateStr = getLocalDateString(date)
                      const isSelected = dateStr === getLocalDateString(selectedDayDate)
                      const isToday = dateStr === todayStr
                      
                      return (
                        <button
                          key={dateStr}
                          onClick={() => {
                            setSelectedDayDate(date)
                            onClose()
                          }}
                          className={`h-10 rounded-lg transition-all ${
                            isSelected 
                              ? 'bg-orange-600 text-white font-bold' 
                              : isToday
                                ? 'bg-orange-100 text-orange-700 font-semibold'
                                : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          {date.getDate()}
                        </button>
                      )
                    })}
                  </div>
                )
              })()}
              
              {/* Month/Year Navigation */}
              <div className="flex items-center justify-between mt-4 pt-4 border-t">
                <button
                  onClick={() => {
                    const prevMonth = new Date(selectedDayDate)
                    prevMonth.setMonth(prevMonth.getMonth() - 1)
                    setSelectedDayDate(prevMonth)
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <span className="text-lg font-semibold text-gray-800">
                  {selectedDayDate.toLocaleDateString(localeCode, { month: 'long', year: 'numeric' })}
                </span>
                <button
                  onClick={() => {
                    const nextMonth = new Date(selectedDayDate)
                    nextMonth.setMonth(nextMonth.getMonth() + 1)
                    setSelectedDayDate(nextMonth)
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          )}

          {/* Week Picker - Weeks and Year */}
          {currentProgram === 'week' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={() => {
                    const prevYear = selectedWeek.getFullYear() - 1
                    setSelectedWeek(new Date(prevYear, 0, 1))
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <span className="text-xl font-semibold text-gray-800">
                  {selectedWeek.getFullYear()}
                </span>
                <button
                  onClick={() => {
                    const nextYear = selectedWeek.getFullYear() + 1
                    setSelectedWeek(new Date(nextYear, 0, 1))
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
              
              <div className="grid grid-cols-1 gap-2 max-h-96 overflow-y-auto">
                {(() => {
                  const year = selectedWeek.getFullYear()
                  const weeks = []
                  
                  // Get all weeks in the year
                  const startOfYear = new Date(year, 0, 1)
                  const endOfYear = new Date(year, 11, 31)
                  
                  // Find first Monday of year
                  let currentDate = new Date(startOfYear)
                  const dayOfWeek = currentDate.getDay()
                  const daysToMonday = dayOfWeek === 0 ? 1 : (dayOfWeek === 1 ? 0 : 8 - dayOfWeek)
                  currentDate.setDate(currentDate.getDate() + daysToMonday)
                  
                  while (currentDate <= endOfYear) {
                    const weekEnd = new Date(currentDate)
                    weekEnd.setDate(weekEnd.getDate() + 6)
                    
                    weeks.push({
                      start: new Date(currentDate),
                      end: weekEnd
                    })
                    
                    currentDate.setDate(currentDate.getDate() + 7)
                  }
                  
                  // Get current week for comparison
                  const today = new Date()
                  const todayDay = today.getDay()
                  const todayDiff = today.getDate() - todayDay + (todayDay === 0 ? -6 : 1)
                  const currentWeekStart = new Date(today)
                  currentWeekStart.setDate(todayDiff)
                  currentWeekStart.setHours(0, 0, 0, 0)
                  
                  return weeks.map((week, index) => {
                    const weekStartStr = getLocalDateString(week.start)
                    const currentWeekStartStr = getLocalDateString(currentWeekStart)
                    const isSelected = weekStartStr === getLocalDateString(selectedWeek)
                    const isCurrentWeek = weekStartStr === currentWeekStartStr
                    
                    return (
                      <button
                        key={index}
                        onClick={() => {
                          setSelectedWeek(week.start)
                          onClose()
                        }}
                        className={`p-4 rounded-lg text-left transition-all ${
                          isSelected 
                            ? 'bg-orange-600 text-white' 
                            : isCurrentWeek
                              ? 'bg-orange-100 text-orange-700 border-2 border-orange-300'
                              : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        <div className="font-semibold">
                          Týden {index + 1} ({week.start.getDate()}. {week.start.getMonth() + 1}. - {week.end.getDate()}. {week.end.getMonth() + 1}. {week.end.getFullYear()})
                        </div>
                      </button>
                    )
                  })
                })()}
              </div>
            </div>
          )}

          {/* Month Picker - Months and Year */}
          {currentProgram === 'month' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={() => {
                    const prevYear = selectedMonth.getFullYear() - 1
                    setSelectedMonth(new Date(prevYear, selectedMonth.getMonth(), 1))
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <span className="text-xl font-semibold text-gray-800">
                  {selectedMonth.getFullYear()}
                </span>
                <button
                  onClick={() => {
                    const nextYear = selectedMonth.getFullYear() + 1
                    setSelectedMonth(new Date(nextYear, selectedMonth.getMonth(), 1))
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {['Leden', 'Únor', 'Březen', 'Duben', 'Květen', 'Červen', 'Červenec', 'Srpen', 'Září', 'Říjen', 'Listopad', 'Prosinec'].map((month, index) => {
                  const today = new Date()
                  const isSelected = selectedMonth.getMonth() === index
                  const isCurrentMonth = today.getMonth() === index && today.getFullYear() === selectedMonth.getFullYear()
                  
                  return (
                    <button
                      key={index}
                      onClick={() => {
                        const newDate = new Date(selectedMonth.getFullYear(), index, 1)
                        setSelectedMonth(newDate)
                        onClose()
                      }}
                      className={`p-4 rounded-lg font-semibold transition-all ${
                        isSelected 
                          ? 'bg-orange-600 text-white' 
                          : isCurrentMonth
                            ? 'bg-orange-100 text-orange-700 border-2 border-orange-300'
                            : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {month}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Year Picker - Years */}
          {currentProgram === 'year' && (
            <div className="space-y-4">
              <div className="grid grid-cols-4 gap-3 max-h-96 overflow-y-auto">
                {(() => {
                  const currentYear = new Date().getFullYear()
                  const startYear = currentYear - 10
                  const endYear = currentYear + 10
                  const years = []
                  
                  for (let year = startYear; year <= endYear; year++) {
                    years.push(year)
                  }
                  
                  return years.map(year => {
                    const isSelected = year === selectedYear
                    const isCurrentYear = year === currentYear
                    
                    return (
                      <button
                        key={year}
                        onClick={() => {
                          setSelectedYear(year)
                          onClose()
                        }}
                        className={`p-4 rounded-lg font-semibold transition-all ${
                          isSelected 
                            ? 'bg-orange-600 text-white' 
                            : isCurrentYear
                              ? 'bg-orange-100 text-orange-700 border-2 border-orange-300'
                              : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        {year}
                      </button>
                    )
                  })
                })()}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

