'use client'

import { useState, useEffect, useRef } from 'react'
import { MessageSquare, X, Send, Bug, Lightbulb, AlertCircle } from 'lucide-react'
import { useTranslations } from 'next-intl'

interface ConsoleLog {
  level: string
  message: string
  timestamp: number
  stack?: string
}

interface FeedbackButtonProps {
  compact?: boolean // If true, show only icon
  onOpenChange?: (isOpen: boolean) => void // Callback for when modal opens/closes
}

// Export a hook to manage feedback modal state
export function useFeedbackModal() {
  const [isOpen, setIsOpen] = useState(false)
  return { isOpen, setIsOpen }
}

export function FeedbackButton({ compact = false, onOpenChange }: FeedbackButtonProps = {}) {
  const [isOpen, setIsOpen] = useState(false)
  
  useEffect(() => {
    onOpenChange?.(isOpen)
  }, [isOpen, onOpenChange])
  const [feedback, setFeedback] = useState('')
  const [feedbackType, setFeedbackType] = useState<'feedback' | 'bug'>('feedback')
  const [includeLogs, setIncludeLogs] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [logs, setLogs] = useState<ConsoleLog[]>([])
  const logsRef = useRef<ConsoleLog[]>([])
  const t = useTranslations()

  // Capture console logs
  useEffect(() => {
    const originalLog = console.log
    const originalError = console.error
    const originalWarn = console.warn
    const originalInfo = console.info

    const captureLog = (level: string, ...args: any[]) => {
      const message = args.map(arg => {
        if (typeof arg === 'object') {
          try {
            return JSON.stringify(arg, null, 2)
          } catch {
            return String(arg)
          }
        }
        return String(arg)
      }).join(' ')

      const logEntry: ConsoleLog = {
        level,
        message,
        timestamp: Date.now(),
        stack: new Error().stack
      }

      logsRef.current.push(logEntry)
      // Keep only last 100 logs
      if (logsRef.current.length > 100) {
        logsRef.current.shift()
      }
    }

    console.log = (...args: any[]) => {
      captureLog('log', ...args)
      originalLog.apply(console, args)
    }

    console.error = (...args: any[]) => {
      captureLog('error', ...args)
      originalError.apply(console, args)
    }

    console.warn = (...args: any[]) => {
      captureLog('warn', ...args)
      originalWarn.apply(console, args)
    }

    console.info = (...args: any[]) => {
      captureLog('info', ...args)
      originalInfo.apply(console, args)
    }

    return () => {
      console.log = originalLog
      console.error = originalError
      console.warn = originalWarn
      console.info = originalInfo
    }
  }, [])

  // Update logs when opening modal
  useEffect(() => {
    if (isOpen) {
      setLogs([...logsRef.current])
    }
  }, [isOpen])

  // Keyboard shortcut (F key) to open feedback
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Only trigger if not typing in an input/textarea
      if (e.key === 'f' || e.key === 'F') {
        const target = e.target as HTMLElement
        const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable
        if (!isInput && !isOpen) {
          e.preventDefault()
          setIsOpen(true)
        }
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [isOpen])

  const handleSubmit = async () => {
    if (!feedback.trim()) return

    setIsSubmitting(true)
    try {
      const payload = {
        feedback,
        type: feedbackType,
        includeLogs,
        logs: includeLogs ? logs : [],
        userAgent: navigator.userAgent,
        url: window.location.href,
        timestamp: new Date().toISOString(),
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight
        }
      }

      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        setFeedback('')
        setIsOpen(false)
        setIncludeLogs(false)
        // Show success message (you can add a toast notification here)
        alert('Děkujeme za váš feedback!')
      } else {
        throw new Error('Failed to submit feedback')
      }
    } catch (error) {
      console.error('Error submitting feedback:', error)
      alert('Chyba při odesílání feedbacku. Zkuste to prosím znovu.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false)
    }
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      handleSubmit()
    }
  }

  // Expose setIsOpen for external use (e.g., from header button)
  const openModal = () => setIsOpen(true)
  
  // Make setIsOpen available via ref or expose function
  if (compact) {
    return (
      <>
        {/* Compact button - styled differently like Resend */}
        <button
          onClick={openModal}
          className="flex items-center gap-2 px-3 py-2 text-sm font-medium bg-gray-100 text-gray-700 rounded-lg border border-gray-200 hover:bg-gray-200 transition-colors"
          title="Feedback (F)"
        >
          <MessageSquare className="w-4 h-4" />
          <span className="hidden lg:inline">Feedback</span>
          <span className="ml-1 px-1.5 py-0.5 bg-gray-200 text-gray-600 rounded text-xs font-mono">F</span>
        </button>
        
        {/* Modal */}
        {isOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black/20 z-[100]"
              onClick={() => setIsOpen(false)}
            />
            {/* Modal Content - same as below */}
            {renderModal()}
          </>
        )}
      </>
    )
  }

  return (
    <>
      {/* Feedback Button - Full version */}
      <button
        onClick={openModal}
        className="fixed top-4 right-4 z-50 flex items-center gap-2 px-3 py-2 bg-white text-gray-700 rounded-lg shadow-md hover:shadow-lg border border-gray-200 hover:border-gray-300 transition-all font-medium text-sm"
        title="Feedback (F)"
      >
        <MessageSquare className="w-4 h-4" />
        <span>Feedback</span>
        <span className="ml-1 px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-xs font-mono">F</span>
      </button>

      {/* Modal */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/20 z-[100]"
            onClick={() => setIsOpen(false)}
          />
          {/* Modal Content */}
          {renderModal()}
        </>
      )}
    </>
  )
  
  function renderModal() {
    return (
      <div
        className="fixed inset-0 z-[101] flex items-center justify-center p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              {feedbackType === 'bug' ? (
                <Bug className="w-5 h-5 text-red-600" />
              ) : (
                <Lightbulb className="w-5 h-5 text-primary-600" />
              )}
              <h2 className="text-xl font-bold text-gray-900">
                {feedbackType === 'bug' ? 'Nahlásit chybu' : 'Feedback'}
              </h2>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {/* Type Selector */}
            <div className="flex gap-2">
              <button
                onClick={() => setFeedbackType('feedback')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  feedbackType === 'feedback'
                    ? 'bg-primary-100 text-primary-700 border-2 border-primary-500'
                    : 'bg-gray-100 text-gray-700 border-2 border-transparent hover:bg-gray-200'
                }`}
              >
                <Lightbulb className="w-4 h-4" />
                <span className="font-medium">Feedback</span>
              </button>
              <button
                onClick={() => setFeedbackType('bug')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  feedbackType === 'bug'
                    ? 'bg-red-100 text-red-700 border-2 border-red-500'
                    : 'bg-gray-100 text-gray-700 border-2 border-transparent hover:bg-gray-200'
                }`}
              >
                <Bug className="w-4 h-4" />
                <span className="font-medium">Chyba</span>
              </button>
            </div>

            {/* Textarea */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {feedbackType === 'bug' 
                  ? 'Popište chybu, kterou jste našli...' 
                  : 'Nápady na vylepšení této stránky...'}
              </label>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={feedbackType === 'bug' 
                  ? 'Popište chybu, kterou jste našli...' 
                  : 'Ideas to improve this page...'}
                className="w-full h-32 px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none font-playful"
                autoFocus
              />
            </div>

            {/* Include Logs Checkbox (only for bugs) */}
            {feedbackType === 'bug' && (
              <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg border-2 border-gray-200">
                <input
                  type="checkbox"
                  id="includeLogs"
                  checked={includeLogs}
                  onChange={(e) => setIncludeLogs(e.target.checked)}
                  className="mt-1 w-4 h-4 text-primary-600 border-2 border-primary-500 rounded focus:ring-primary-500"
                />
                <div className="flex-1">
                  <label htmlFor="includeLogs" className="block text-sm font-medium text-gray-700 cursor-pointer">
                    Odeslat prohlížečové logy
                  </label>
                  <p className="text-xs text-gray-600 mt-1">
                    Pomůže nám to lépe diagnostikovat problém. Zahrnuje console logy, chyby a varování.
                  </p>
                  {includeLogs && logs.length > 0 && (
                    <div className="mt-2 p-2 bg-white rounded border border-gray-300 max-h-32 overflow-y-auto">
                      <p className="text-xs text-gray-600 mb-1">
                        <strong>{logs.length}</strong> logů bude odesláno:
                      </p>
                      <div className="text-xs font-mono text-gray-700 space-y-1">
                        {logs.slice(-5).map((log, idx) => (
                          <div key={idx} className="truncate">
                            <span className={`font-semibold ${
                              log.level === 'error' ? 'text-red-600' :
                              log.level === 'warn' ? 'text-yellow-600' :
                              'text-gray-600'
                            }`}>
                              [{log.level}]
                            </span>
                            {' '}
                            {log.message.substring(0, 100)}
                            {log.message.length > 100 ? '...' : ''}
                          </div>
                        ))}
                        {logs.length > 5 && (
                          <div className="text-gray-500 italic">
                            ... a {logs.length - 5} dalších
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Help Text */}
            <div className="text-sm text-gray-600">
              Potřebujete pomoc?{' '}
              <a href="/help" className="text-primary-600 hover:text-primary-700 underline">
                Kontaktujte nás
              </a>
              {' '}nebo{' '}
              <a href="/help" className="text-primary-600 hover:text-primary-700 underline">
                zobrazte dokumentaci
              </a>
              .
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
            <div className="text-xs text-gray-500">
              Stiskněte <kbd className="px-1.5 py-0.5 bg-white border border-gray-300 rounded">⌘</kbd> + <kbd className="px-1.5 py-0.5 bg-white border border-gray-300 rounded">Enter</kbd> pro odeslání
            </div>
            <button
              onClick={handleSubmit}
              disabled={!feedback.trim() || isSubmitting}
              className="flex items-center gap-2 px-6 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Odesílám...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Odeslat</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    )
  }
}
