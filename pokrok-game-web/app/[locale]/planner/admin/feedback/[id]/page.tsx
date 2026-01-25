'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useTranslations, useLocale } from 'next-intl'
import { ArrowLeft, Bug, Lightbulb, Calendar, User, Globe, Monitor, FileText } from 'lucide-react'

interface Feedback {
  id: string
  user_id: string | null
  type: 'feedback' | 'bug'
  feedback: string
  include_logs: boolean
  logs: any[] | null
  user_agent: string | null
  url: string | null
  viewport: any | null
  resolved: boolean
  resolved_at: string | null
  created_at: string
  user_email: string | null
  user_name: string | null
}

export default function FeedbackDetailPage() {
  const params = useParams()
  const router = useRouter()
  const t = useTranslations()
  const locale = useLocale()
  const [feedback, setFeedback] = useState<Feedback | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    if (params.id) {
      loadFeedback(params.id as string)
    }
  }, [params.id])

  const handleResolve = async (resolved: boolean) => {
    if (!feedback) return
    
    setUpdating(true)
    try {
      const response = await fetch(`/api/feedback/${feedback.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resolved })
      })
      if (!response.ok) {
        throw new Error('Failed to update feedback')
      }
      const updated = await response.json()
      setFeedback(updated)
    } catch (error) {
      console.error('Error updating feedback:', error)
      alert('Chyba při aktualizaci feedbacku')
    } finally {
      setUpdating(false)
    }
  }

  const loadFeedback = async (id: string) => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/feedback/${id}`)
      if (!response.ok) {
        throw new Error('Failed to load feedback')
      }
      const data = await response.json()
      setFeedback(data)
    } catch (error) {
      console.error('Error loading feedback:', error)
      setError('Failed to load feedback')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat(locale === 'cs' ? 'cs-CZ' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
  }

  if (loading) {
    return (
      <div className="w-full h-full bg-primary-50 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !feedback) {
    return (
      <div className="w-full h-full bg-primary-50 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
            {error || 'Feedback nenalezen'}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full h-full bg-primary-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Zpět</span>
          </button>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {feedback.type === 'bug' ? (
                <Bug className="w-8 h-8 text-red-600" />
              ) : (
                <Lightbulb className="w-8 h-8 text-primary-600" />
              )}
              <h1 className={`text-3xl font-bold ${feedback.resolved ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                {feedback.type === 'bug' ? 'Nahlášená chyba' : 'Feedback'}
              </h1>
              {feedback.resolved && (
                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                  Resolved
                </span>
              )}
            </div>
            {!feedback.resolved ? (
              <button
                onClick={() => handleResolve(true)}
                disabled={updating}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {updating ? 'Ukládám...' : 'Označit jako resolved'}
              </button>
            ) : (
              <button
                onClick={() => handleResolve(false)}
                disabled={updating}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {updating ? 'Ukládám...' : 'Označit jako neresolved'}
              </button>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-lg border-2 border-primary-500 p-6 space-y-6">
          {/* Feedback Content */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Zpráva</h2>
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <p className="text-gray-900 whitespace-pre-wrap">{feedback.feedback}</p>
            </div>
          </div>

          {/* Metadata */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <User className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <div className="text-sm font-medium text-gray-500">Uživatel</div>
                <div className="text-gray-900">
                  {feedback.user_name || feedback.user_email || 'Anonymní'}
                  {feedback.user_email && (
                    <div className="text-sm text-gray-500">{feedback.user_email}</div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <div className="text-sm font-medium text-gray-500">Datum</div>
                <div className="text-gray-900">{formatDate(feedback.created_at)}</div>
              </div>
            </div>

            {feedback.url && (
              <div className="flex items-start gap-3">
                <Globe className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <div className="text-sm font-medium text-gray-500">URL</div>
                  <a
                    href={feedback.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary-600 hover:text-primary-700 break-all"
                  >
                    {feedback.url}
                  </a>
                </div>
              </div>
            )}

            {feedback.viewport && (
              <div className="flex items-start gap-3">
                <Monitor className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <div className="text-sm font-medium text-gray-500">Viewport</div>
                  <div className="text-gray-900">
                    {feedback.viewport.width} × {feedback.viewport.height}px
                  </div>
                </div>
              </div>
            )}

            {feedback.resolved && feedback.resolved_at && (
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-green-500 mt-0.5" />
                <div>
                  <div className="text-sm font-medium text-gray-500">Resolved</div>
                  <div className="text-gray-900">{formatDate(feedback.resolved_at)}</div>
                </div>
              </div>
            )}

            {feedback.user_agent && (
              <div className="flex items-start gap-3 md:col-span-2">
                <FileText className="w-5 h-5 text-gray-400 mt-0.5" />
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-500">User Agent</div>
                  <div className="text-sm text-gray-900 break-all">{feedback.user_agent}</div>
                </div>
              </div>
            )}
          </div>

          {/* Logs */}
          {feedback.include_logs && feedback.logs && feedback.logs.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">
                Prohlížečové logy ({feedback.logs.length})
              </h2>
              <div className="bg-gray-900 rounded-lg p-4 max-h-96 overflow-y-auto">
                <div className="space-y-2 font-mono text-xs">
                  {feedback.logs.map((log: any, index: number) => (
                    <div key={index} className="flex items-start gap-2">
                      <span className={`font-semibold flex-shrink-0 ${
                        log.level === 'error' ? 'text-red-400' :
                        log.level === 'warn' ? 'text-yellow-400' :
                        log.level === 'info' ? 'text-blue-400' :
                        'text-gray-400'
                      }`}>
                        [{log.level.toUpperCase()}]
                      </span>
                      <span className="text-gray-300 flex-1 break-words">{log.message}</span>
                      {log.stack && (
                        <details className="w-full mt-1">
                          <summary className="text-gray-500 cursor-pointer hover:text-gray-400">
                            Stack trace
                          </summary>
                          <pre className="mt-2 text-gray-500 whitespace-pre-wrap text-xs">
                            {log.stack}
                          </pre>
                        </details>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
