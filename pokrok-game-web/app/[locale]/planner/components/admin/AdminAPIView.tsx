'use client'

import { useState, useEffect } from 'react'
import { Loader2, XCircle } from 'lucide-react'

interface MigrationResult {
  success: boolean
  summary?: {
    total: number
    encrypted: number
    skipped: number
    errors: number
  }
  errors?: string[]
  error?: string
  details?: string
}

export function AdminAPIView() {
  const [migrationLoading, setMigrationLoading] = useState(false)
  const [migrationResult, setMigrationResult] = useState<MigrationResult | null>(null)
  const [goalsMigrationLoading, setGoalsMigrationLoading] = useState(false)
  const [goalsMigrationResult, setGoalsMigrationResult] = useState<MigrationResult | null>(null)
  const [stepsMigrationLoading, setStepsMigrationLoading] = useState(false)
  const [stepsMigrationResult, setStepsMigrationResult] = useState<MigrationResult | null>(null)
  const [habitsMigrationLoading, setHabitsMigrationLoading] = useState(false)
  const [habitsMigrationResult, setHabitsMigrationResult] = useState<MigrationResult | null>(null)
  const [goalMetricsMigrationLoading, setGoalMetricsMigrationLoading] = useState(false)
  const [goalMetricsMigrationResult, setGoalMetricsMigrationResult] = useState<MigrationResult | null>(null)
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)

  // Check admin status (same as AdminTipsView)
  useEffect(() => {
    const checkAdminAccess = async () => {
      try {
        // Try to call an admin endpoint to check access
        const response = await fetch('/api/admin/tips')
        if (response.status === 403) {
          setIsAdmin(false)
          setLoading(false)
          return
        }
        if (!response.ok) {
          throw new Error('Failed to check admin access')
        }
        setIsAdmin(true)
      } catch (error) {
        console.error('Error checking admin access:', error)
        setIsAdmin(false)
      } finally {
        setLoading(false)
      }
    }

    checkAdminAccess()
  }, [])

  if (loading) {
    return (
      <div className="w-full h-full bg-white rounded-lg shadow-sm p-6 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    )
  }

  if (isAdmin === false) {
    return (
      <div className="w-full h-full bg-white rounded-lg shadow-sm p-6 flex items-center justify-center">
        <div className="text-center">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">You do not have permission to access this page.</p>
        </div>
      </div>
    )
  }

  const handleRunMigration = async () => {
    if (!confirm('Opravdu chcete spustit migraci šifrování areas? Tato operace může trvat několik sekund.')) {
      return
    }

    setMigrationLoading(true)
    setMigrationResult(null)

    try {
      const response = await fetch('/api/admin/migrate-encrypt-areas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()

      if (!response.ok) {
        setMigrationResult({
          success: false,
          error: data.error || 'Neznámá chyba',
          details: data.details,
        })
      } else {
        setMigrationResult({
          success: true,
          summary: data.summary,
          errors: data.errors,
        })
      }
    } catch (error: any) {
      setMigrationResult({
        success: false,
        error: 'Chyba při komunikaci s API',
        details: error.message,
      })
    } finally {
      setMigrationLoading(false)
    }
  }

  const handleRunGoalsMigration = async () => {
    if (!confirm('Opravdu chcete spustit migraci šifrování goals? Tato operace může trvat několik sekund.')) {
      return
    }

    setGoalsMigrationLoading(true)
    setGoalsMigrationResult(null)

    try {
      const response = await fetch('/api/admin/migrate-encrypt-goals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()

      if (!response.ok) {
        setGoalsMigrationResult({
          success: false,
          error: data.error || 'Neznámá chyba',
          details: data.details,
        })
      } else {
        setGoalsMigrationResult({
          success: true,
          summary: data.summary,
          errors: data.errors,
        })
      }
    } catch (error: any) {
      setGoalsMigrationResult({
        success: false,
        error: 'Chyba při komunikaci s API',
        details: error.message,
      })
    } finally {
      setGoalsMigrationLoading(false)
    }
  }

  const handleRunStepsMigration = async () => {
    if (!confirm('Opravdu chcete spustit migraci šifrování daily steps? Tato operace může trvat několik sekund.')) {
      return
    }

    setStepsMigrationLoading(true)
    setStepsMigrationResult(null)

    try {
      const response = await fetch('/api/admin/migrate-encrypt-steps', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()

      if (!response.ok) {
        setStepsMigrationResult({
          success: false,
          error: data.error || 'Neznámá chyba',
          details: data.details,
        })
      } else {
        setStepsMigrationResult({
          success: true,
          summary: data.summary,
          errors: data.errors,
        })
      }
    } catch (error: any) {
      setStepsMigrationResult({
        success: false,
        error: 'Chyba při komunikaci s API',
        details: error.message,
      })
    } finally {
      setStepsMigrationLoading(false)
    }
  }

  const handleRunHabitsMigration = async () => {
    if (!confirm('Opravdu chcete spustit migraci šifrování habits? Tato operace může trvat několik sekund.')) {
      return
    }

    setHabitsMigrationLoading(true)
    setHabitsMigrationResult(null)

    try {
      const response = await fetch('/api/admin/migrate-encrypt-habits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()

      if (!response.ok) {
        setHabitsMigrationResult({
          success: false,
          error: data.error || 'Neznámá chyba',
          details: data.details,
        })
      } else {
        setHabitsMigrationResult({
          success: true,
          summary: data.summary,
          errors: data.errors,
        })
      }
    } catch (error: any) {
      setHabitsMigrationResult({
        success: false,
        error: 'Chyba při komunikaci s API',
        details: error.message,
      })
    } finally {
      setHabitsMigrationLoading(false)
    }
  }

  const handleRunGoalMetricsMigration = async () => {
    if (!confirm('Opravdu chcete spustit migraci šifrování goal metrics? Tato operace může trvat několik sekund.')) {
      return
    }

    setGoalMetricsMigrationLoading(true)
    setGoalMetricsMigrationResult(null)

    try {
      const response = await fetch('/api/admin/migrate-encrypt-goal-metrics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()

      if (!response.ok) {
        setGoalMetricsMigrationResult({
          success: false,
          error: data.error || 'Neznámá chyba',
          details: data.details,
        })
      } else {
        setGoalMetricsMigrationResult({
          success: true,
          summary: data.summary,
          errors: data.errors,
        })
      }
    } catch (error: any) {
      setGoalMetricsMigrationResult({
        success: false,
        error: 'Chyba při komunikaci s API',
        details: error.message,
      })
    } finally {
      setGoalMetricsMigrationLoading(false)
    }
  }

  return (
    <div className="w-full h-full bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">API Scripts</h2>

      <div className="space-y-6">
        {/* Migration Script */}
        <div className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Encrypt Areas Migration</h3>
              <p className="text-sm text-gray-600 mt-1">
                Zašifruje všechny areas (name a description) pomocí aktuálního ENCRYPTION_MASTER_KEY
              </p>
            </div>
            <button
              onClick={handleRunMigration}
              disabled={migrationLoading}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {migrationLoading ? 'Spouštím...' : 'Spustit migraci'}
            </button>
          </div>

          {migrationResult && (
            <div className={`mt-4 p-4 rounded-lg ${
              migrationResult.success 
                ? 'bg-green-50 border border-green-200' 
                : 'bg-red-50 border border-red-200'
            }`}>
              {migrationResult.success ? (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-green-600 font-semibold">✅ Migrace proběhla úspěšně</span>
                  </div>
                  {migrationResult.summary && (
                    <div className="text-sm text-gray-700 space-y-1">
                      <p>Celkem areas: {migrationResult.summary.total}</p>
                      <p>Zašifrováno: {migrationResult.summary.encrypted}</p>
                      <p>Přeskočeno: {migrationResult.summary.skipped}</p>
                      {migrationResult.summary.errors > 0 && (
                        <p className="text-red-600">Chyby: {migrationResult.summary.errors}</p>
                      )}
                    </div>
                  )}
                  {migrationResult.errors && migrationResult.errors.length > 0 && (
                    <div className="mt-3">
                      <p className="text-sm font-semibold text-gray-700 mb-1">Chyby:</p>
                      <ul className="text-sm text-gray-600 list-disc list-inside space-y-1">
                        {migrationResult.errors.map((error, index) => (
                          <li key={index}>{error}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-red-600 font-semibold">❌ Migrace selhala</span>
                  </div>
                  <p className="text-sm text-gray-700">{migrationResult.error}</p>
                  {migrationResult.details && (
                    <p className="text-sm text-gray-600 mt-1">{migrationResult.details}</p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Goals Migration Script */}
        <div className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Encrypt Goals Migration</h3>
              <p className="text-sm text-gray-600 mt-1">
                Zašifruje všechny goals (title a description) pomocí aktuálního ENCRYPTION_MASTER_KEY
              </p>
            </div>
            <button
              onClick={handleRunGoalsMigration}
              disabled={goalsMigrationLoading}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {goalsMigrationLoading ? 'Spouštím...' : 'Spustit migraci'}
            </button>
          </div>

          {goalsMigrationResult && (
            <div className={`mt-4 p-4 rounded-lg ${
              goalsMigrationResult.success 
                ? 'bg-green-50 border border-green-200' 
                : 'bg-red-50 border border-red-200'
            }`}>
              {goalsMigrationResult.success ? (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-green-600 font-semibold">✅ Migrace proběhla úspěšně</span>
                  </div>
                  {goalsMigrationResult.summary && (
                    <div className="text-sm text-gray-700 space-y-1">
                      <p>Celkem goals: {goalsMigrationResult.summary.total}</p>
                      <p>Zašifrováno: {goalsMigrationResult.summary.encrypted}</p>
                      <p>Přeskočeno: {goalsMigrationResult.summary.skipped}</p>
                      {goalsMigrationResult.summary.errors > 0 && (
                        <p className="text-red-600">Chyby: {goalsMigrationResult.summary.errors}</p>
                      )}
                    </div>
                  )}
                  {goalsMigrationResult.errors && goalsMigrationResult.errors.length > 0 && (
                    <div className="mt-3">
                      <p className="text-sm font-semibold text-gray-700 mb-1">Chyby:</p>
                      <ul className="text-sm text-gray-600 list-disc list-inside space-y-1">
                        {goalsMigrationResult.errors.map((error, index) => (
                          <li key={index}>{error}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-red-600 font-semibold">❌ Migrace selhala</span>
                  </div>
                  <p className="text-sm text-gray-700">{goalsMigrationResult.error}</p>
                  {goalsMigrationResult.details && (
                    <p className="text-sm text-gray-600 mt-1">{goalsMigrationResult.details}</p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Steps Migration Script */}
        <div className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Encrypt Daily Steps Migration</h3>
              <p className="text-sm text-gray-600 mt-1">
                Zašifruje všechny daily steps (title, description a checklist) pomocí aktuálního ENCRYPTION_MASTER_KEY
              </p>
            </div>
            <button
              onClick={handleRunStepsMigration}
              disabled={stepsMigrationLoading}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {stepsMigrationLoading ? 'Spouštím...' : 'Spustit migraci'}
            </button>
          </div>

          {stepsMigrationResult && (
            <div className={`mt-4 p-4 rounded-lg ${
              stepsMigrationResult.success 
                ? 'bg-green-50 border border-green-200' 
                : 'bg-red-50 border border-red-200'
            }`}>
              {stepsMigrationResult.success ? (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-green-600 font-semibold">✅ Migrace proběhla úspěšně</span>
                  </div>
                  {stepsMigrationResult.summary && (
                    <div className="text-sm text-gray-700 space-y-1">
                      <p>Celkem steps: {stepsMigrationResult.summary.total}</p>
                      <p>Zašifrováno: {stepsMigrationResult.summary.encrypted}</p>
                      <p>Přeskočeno: {stepsMigrationResult.summary.skipped}</p>
                      {stepsMigrationResult.summary.errors > 0 && (
                        <p className="text-red-600">Chyby: {stepsMigrationResult.summary.errors}</p>
                      )}
                    </div>
                  )}
                  {stepsMigrationResult.errors && stepsMigrationResult.errors.length > 0 && (
                    <div className="mt-3">
                      <p className="text-sm font-semibold text-gray-700 mb-1">Chyby:</p>
                      <ul className="text-sm text-gray-600 list-disc list-inside space-y-1">
                        {stepsMigrationResult.errors.map((error, index) => (
                          <li key={index}>{error}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-red-600 font-semibold">❌ Migrace selhala</span>
                  </div>
                  <p className="text-sm text-gray-700">{stepsMigrationResult.error}</p>
                  {stepsMigrationResult.details && (
                    <p className="text-sm text-gray-600 mt-1">{stepsMigrationResult.details}</p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Habits Migration Script */}
        <div className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Encrypt Habits Migration</h3>
              <p className="text-sm text-gray-600 mt-1">
                Zašifruje všechny habits (name a description) pomocí aktuálního ENCRYPTION_MASTER_KEY
              </p>
            </div>
            <button
              onClick={handleRunHabitsMigration}
              disabled={habitsMigrationLoading}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {habitsMigrationLoading ? 'Spouštím...' : 'Spustit migraci'}
            </button>
          </div>

          {habitsMigrationResult && (
            <div className={`mt-4 p-4 rounded-lg ${
              habitsMigrationResult.success 
                ? 'bg-green-50 border border-green-200' 
                : 'bg-red-50 border border-red-200'
            }`}>
              {habitsMigrationResult.success ? (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-green-600 font-semibold">✅ Migrace proběhla úspěšně</span>
                  </div>
                  {habitsMigrationResult.summary && (
                    <div className="text-sm text-gray-700 space-y-1">
                      <p>Celkem habits: {habitsMigrationResult.summary.total}</p>
                      <p>Zašifrováno: {habitsMigrationResult.summary.encrypted}</p>
                      <p>Přeskočeno: {habitsMigrationResult.summary.skipped}</p>
                      {habitsMigrationResult.summary.errors > 0 && (
                        <p className="text-red-600">Chyby: {habitsMigrationResult.summary.errors}</p>
                      )}
                    </div>
                  )}
                  {habitsMigrationResult.errors && habitsMigrationResult.errors.length > 0 && (
                    <div className="mt-3">
                      <p className="text-sm font-semibold text-gray-700 mb-1">Chyby:</p>
                      <ul className="text-sm text-gray-600 list-disc list-inside space-y-1">
                        {habitsMigrationResult.errors.map((error, index) => (
                          <li key={index}>{error}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-red-600 font-semibold">❌ Migrace selhala</span>
                  </div>
                  <p className="text-sm text-gray-700">{habitsMigrationResult.error}</p>
                  {habitsMigrationResult.details && (
                    <p className="text-sm text-gray-600 mt-1">{habitsMigrationResult.details}</p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Goal Metrics Migration Script */}
        <div className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Encrypt Goal Metrics Migration</h3>
              <p className="text-sm text-gray-600 mt-1">
                Zašifruje všechny goal metrics (name, description a unit) pomocí aktuálního ENCRYPTION_MASTER_KEY
              </p>
            </div>
            <button
              onClick={handleRunGoalMetricsMigration}
              disabled={goalMetricsMigrationLoading}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {goalMetricsMigrationLoading ? 'Spouštím...' : 'Spustit migraci'}
            </button>
          </div>

          {goalMetricsMigrationResult && (
            <div className={`mt-4 p-4 rounded-lg ${
              goalMetricsMigrationResult.success 
                ? 'bg-green-50 border border-green-200' 
                : 'bg-red-50 border border-red-200'
            }`}>
              {goalMetricsMigrationResult.success ? (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-green-600 font-semibold">✅ Migrace proběhla úspěšně</span>
                  </div>
                  {goalMetricsMigrationResult.summary && (
                    <div className="text-sm text-gray-700 space-y-1">
                      <p>Celkem goal metrics: {goalMetricsMigrationResult.summary.total}</p>
                      <p>Zašifrováno: {goalMetricsMigrationResult.summary.encrypted}</p>
                      <p>Přeskočeno: {goalMetricsMigrationResult.summary.skipped}</p>
                      {goalMetricsMigrationResult.summary.errors > 0 && (
                        <p className="text-red-600">Chyby: {goalMetricsMigrationResult.summary.errors}</p>
                      )}
                    </div>
                  )}
                  {goalMetricsMigrationResult.errors && goalMetricsMigrationResult.errors.length > 0 && (
                    <div className="mt-3">
                      <p className="text-sm font-semibold text-gray-700 mb-1">Chyby:</p>
                      <ul className="text-sm text-gray-600 list-disc list-inside space-y-1">
                        {goalMetricsMigrationResult.errors.map((error, index) => (
                          <li key={index}>{error}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-red-600 font-semibold">❌ Migrace selhala</span>
                  </div>
                  <p className="text-sm text-gray-700">{goalMetricsMigrationResult.error}</p>
                  {goalMetricsMigrationResult.details && (
                    <p className="text-sm text-gray-600 mt-1">{goalMetricsMigrationResult.details}</p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-semibold text-blue-900 mb-2">ℹ️ Informace</h4>
          <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
            <li>Migrace zašifruje pouze areas, které ještě nejsou zašifrované</li>
            <li>Přeskočí areas s hodnotami "{}" (poškozená data)</li>
            <li>Použije aktuální ENCRYPTION_MASTER_KEY z environment variables</li>
            <li>Migrace je idempotentní - můžete ji spustit vícekrát bezpečně</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

