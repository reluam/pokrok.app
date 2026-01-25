'use client'

import { useState, useEffect } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { useRouter } from 'next/navigation'
import { MessageSquare, Bug, Lightbulb, ExternalLink, Calendar, User } from 'lucide-react'

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

export function AdminFeedbackView() {
  const t = useTranslations()
  const locale = useLocale()
  const router = useRouter()
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filterType, setFilterType] = useState<'all' | 'feedback' | 'bug'>('all')
  const [showResolved, setShowResolved] = useState(false)

  useEffect(() => {
    loadFeedbacks()
  }, [filterType, showResolved])

  const loadFeedbacks = async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (filterType !== 'all') {
        params.append('type', filterType)
      }
      if (showResolved) {
        params.append('includeResolved', 'true')
      }
      const queryString = params.toString()
      const url = `/api/feedback${queryString ? `?${queryString}` : ''}`
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error('Failed to load feedbacks')
      }
      const data = await response.json()
      setFeedbacks(data.feedbacks || [])
    } catch (error) {
      console.error('Error loading feedbacks:', error)
      setError('Failed to load feedbacks')
    } finally {
      setLoading(false)
    }
  }

  const handleResolve = async (id: string, resolved: boolean) => {
    try {
      const response = await fetch(`/api/feedback/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resolved })
      })
      if (!response.ok) {
        throw new Error('Failed to update feedback')
      }
      // Reload feedbacks
      loadFeedbacks()
    } catch (error) {
      console.error('Error updating feedback:', error)
      alert('Chyba při aktualizaci feedbacku')
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat(locale === 'cs' ? 'cs-CZ' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
  }

  const truncateText = (text: string, maxLength: number = 100) => {
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength) + '...'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
        {error}
      </div>
    )
  }

  return (
    <div className="w-full h-full flex flex-col">
      {/* Header with filters */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Feedback</h2>
        <div className="flex items-center gap-2">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as 'all' | 'feedback' | 'bug')}
            className="px-3 py-2 border-2 border-primary-500 rounded-lg focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">Všechny</option>
            <option value="feedback">Feedback</option>
            <option value="bug">Chyby</option>
          </select>
          <label className="flex items-center gap-2 px-3 py-2 border-2 border-primary-500 rounded-lg cursor-pointer">
            <input
              type="checkbox"
              checked={showResolved}
              onChange={(e) => setShowResolved(e.target.checked)}
              className="w-4 h-4"
            />
            <span className="text-sm">Zobrazit resolved</span>
          </label>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto bg-white rounded-lg border-2 border-primary-500">
        <table className="w-full">
          <thead className="bg-primary-50 sticky top-0">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Typ</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Zpráva</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Uživatel</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">URL</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Datum</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Logy</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Akce</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {feedbacks.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                  Žádné feedbacky
                </td>
              </tr>
            ) : (
              feedbacks.map((feedback) => (
                <tr key={feedback.id} className={`transition-colors ${
                  feedback.resolved 
                    ? 'bg-green-50 hover:bg-green-100' 
                    : 'hover:bg-gray-50'
                }`}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {feedback.type === 'bug' ? (
                        <Bug className="w-5 h-5 text-red-600" />
                      ) : (
                        <Lightbulb className="w-5 h-5 text-primary-600" />
                      )}
                      <span className={`text-sm font-medium ${feedback.resolved ? 'line-through text-gray-400' : ''}`}>
                        {feedback.type === 'bug' ? 'Chyba' : 'Feedback'}
                      </span>
                      {feedback.resolved && (
                        <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                          Resolved
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm text-gray-900 max-w-md">
                      {truncateText(feedback.feedback, 150)}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {feedback.user_email ? (
                      <div className="text-sm">
                        <div className="font-medium text-gray-900">{feedback.user_name || feedback.user_email}</div>
                        <div className="text-gray-500 text-xs">{feedback.user_email}</div>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-500">Anonymní</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {feedback.url ? (
                      <a
                        href={feedback.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
                      >
                        <span className="truncate max-w-xs">{feedback.url}</span>
                        <ExternalLink className="w-3 h-3 flex-shrink-0" />
                      </a>
                    ) : (
                      <span className="text-sm text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <Calendar className="w-4 h-4" />
                      {formatDate(feedback.created_at)}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {feedback.include_logs && feedback.logs && feedback.logs.length > 0 ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        {feedback.logs.length} logů
                      </span>
                    ) : (
                      <span className="text-sm text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {!feedback.resolved && (
                        <button
                          onClick={() => handleResolve(feedback.id, true)}
                          className="px-3 py-1.5 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm font-medium"
                          title="Označit jako resolved"
                        >
                          ✓
                        </button>
                      )}
                      {feedback.resolved && (
                        <button
                          onClick={() => handleResolve(feedback.id, false)}
                          className="px-3 py-1.5 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm font-medium"
                          title="Označit jako neresolved"
                        >
                          ↺
                        </button>
                      )}
                      <button
                        onClick={() => router.push(`/${locale}/planner/admin/feedback/${feedback.id}`)}
                        className="px-3 py-1.5 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors text-sm font-medium"
                      >
                        Zobrazit
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Stats */}
      <div className="mt-4 flex items-center gap-4 text-sm text-gray-600">
        <span>Celkem: <strong>{feedbacks.length}</strong></span>
        <span>Feedback: <strong>{feedbacks.filter(f => f.type === 'feedback').length}</strong></span>
        <span>Chyby: <strong>{feedbacks.filter(f => f.type === 'bug').length}</strong></span>
      </div>
    </div>
  )
}
