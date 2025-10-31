'use client'

import { useState, useEffect, useRef, memo } from 'react'
import { Goal } from '@/lib/cesta-db'
import { X, Calendar, Target } from 'lucide-react'
import { getTodayString } from '@/lib/utils'

interface UnifiedStepModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (stepData: StepData) => Promise<void>
  goals: Goal[]
  preselectedGoalId?: string | null
  width?: 'narrow' | 'medium' | 'wide'
  initialTitle?: string
  disableGoalSelection?: boolean // New prop to disable goal selection
}

interface StepData {
  title: string
  description: string
  goalId: string | null
  date: string
}

export const UnifiedStepModal = memo(function UnifiedStepModal({
  isOpen,
  onClose,
  onSave,
  goals,
  preselectedGoalId = null,
  width = 'medium',
  initialTitle = '',
  disableGoalSelection = false
}: UnifiedStepModalProps) {
  const [formData, setFormData] = useState<StepData>({
    title: initialTitle,
    description: '',
    goalId: preselectedGoalId || '',
    date: getTodayString()
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setFormData({
        title: initialTitle,
        description: '',
        goalId: preselectedGoalId || '',
        date: getTodayString()
      })
      setIsExpanded(!!initialTitle)
      // Focus input after a short delay to ensure modal is rendered
      setTimeout(() => {
        inputRef.current?.focus()
      }, 100)
    } else {
      setIsExpanded(false)
    }
  }, [isOpen, initialTitle, preselectedGoalId])

  // Handle input focus to expand modal
  const handleInputFocus = () => {
    setIsExpanded(true)
  }

  // Handle clicks outside to close if no content
  const handleClickOutside = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !formData.title.trim()) {
      onClose()
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title.trim()) return

    setIsSubmitting(true)
    try {
      // Convert empty goalId to null
      const stepData = {
        ...formData,
        goalId: formData.goalId && formData.goalId.trim() !== '' ? formData.goalId : null
      }
      await onSave(stepData)
      onClose()
    } catch (error) {
      console.error('Error saving step:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e as any)
    }
  }

  const getWidthClass = () => {
    switch (width) {
      case 'narrow':
        return 'max-w-sm'
      case 'wide':
        return 'max-w-lg'
      default:
        return 'max-w-md'
    }
  }

  if (!isOpen) return null

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleClickOutside}
    >
      <div className={`bg-white rounded-2xl shadow-xl w-full ${getWidthClass()} transition-all duration-300 ${
        isExpanded ? 'animate-in slide-in-from-top-2' : ''
      }`}>
        {/* Input Field */}
        <div className="px-4 py-3">
          <input
            ref={inputRef}
            type="text"
            value={formData.title}
            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
            onFocus={handleInputFocus}
            onKeyPress={handleKeyPress}
            className="w-full px-4 py-2 rounded-full bg-transparent border-0 focus:ring-0 focus:outline-none text-lg placeholder-gray-400"
            placeholder="Přidat nový krok"
            disabled={isSubmitting}
          />
        </div>
        
        {/* Expanded Options */}
        {isExpanded && (
          <div className="border-t border-gray-100 px-4 pb-4">
            <div className="space-y-4 pt-4">
              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Popis (volitelné)
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 focus:ring-0 focus:outline-none focus:border-primary-300 rounded-lg transition-colors resize-none"
                  rows={2}
                  placeholder="Popište krok podrobněji..."
                  disabled={isSubmitting}
                />
              </div>
              
              {/* Goal and Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Target className="w-4 h-4 inline mr-1" />
                    Přiřadit k cíli
                  </label>
                  {disableGoalSelection ? (
                    <div className="w-full px-3 py-2 bg-gray-100 border border-gray-200 rounded-lg text-gray-600">
                      {goals.find(goal => goal.id === formData.goalId)?.title || 'Nepřiřazený cíl'}
                    </div>
                  ) : (
                    <select
                      value={formData.goalId || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, goalId: e.target.value || null }))}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 focus:ring-0 focus:outline-none focus:border-primary-300 rounded-lg transition-colors"
                      disabled={isSubmitting}
                    >
                      <option value="">Bez přiřazení k cíli</option>
                      {goals.filter(goal => goal.status === 'active').map((goal) => (
                        <option key={goal.id} value={goal.id}>
                          {goal.title}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Calendar className="w-4 h-4 inline mr-1" />
                    Datum
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 focus:ring-0 focus:outline-none focus:border-primary-300 rounded-lg transition-colors"
                    disabled={isSubmitting}
                  />
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex space-x-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors disabled:opacity-50"
                >
                  Zrušit
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!formData.title.trim() || isSubmitting}
                  className="flex-1 bg-primary-500 text-white py-2 px-4 rounded-lg hover:bg-primary-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center space-x-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Ukládám...</span>
                    </>
                  ) : (
                    <span>Přidat krok</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
})

export default UnifiedStepModal
