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

