'use client'

import { useState } from 'react'
import { Play, CheckCircle, XCircle, Loader2, AlertCircle } from 'lucide-react'

interface MigrationStatus {
  status: 'idle' | 'running' | 'success' | 'error'
  message?: string
  summary?: {
    goalsProcessed: number
    areasCreated: number
    milestonesCreated: number
    stepsUpdated: number
    metricsDeleted: number
  }
  error?: string
}

export function AdminMigrationView() {
  const [migrationStatus, setMigrationStatus] = useState<MigrationStatus>({ status: 'idle' })

  const runMigration = async () => {
    if (!confirm('Opravdu chcete spustit migraci Goals → Milestones?\n\nTato akce je nevratná!')) {
      return
    }

    setMigrationStatus({ status: 'running', message: 'Migrace probíhá...' })

    try {
      const response = await fetch('/api/admin/migrate-goals-to-milestones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setMigrationStatus({
          status: 'success',
          message: 'Migrace úspěšně dokončena!',
          summary: data.summary
        })
      } else {
        setMigrationStatus({
          status: 'error',
          message: 'Migrace selhala',
          error: data.error || data.details || 'Neznámá chyba'
        })
      }
    } catch (error) {
      setMigrationStatus({
        status: 'error',
        message: 'Chyba při spuštění migrace',
        error: error instanceof Error ? error.message : String(error)
      })
    }
  }

  return (
    <div className="w-full h-full flex flex-col p-6">
      <div className="max-w-2xl mx-auto w-full">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Migrace: Goals → Milestones</h2>

        {/* Info Box */}
        <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-900">
              <p className="font-semibold mb-2">Co tato migrace dělá:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Vytvoří novou tabulku <code className="bg-blue-100 px-1 rounded">milestones</code></li>
                <li>Z cílů bez <code className="bg-blue-100 px-1 rounded">area_id</code> vytvoří nové oblasti</li>
                <li>Ze všech cílů vytvoří milníky (název, popis, target_date → completed_date)</li>
                <li>Přesune kroky z <code className="bg-blue-100 px-1 rounded">goal_id</code> na <code className="bg-blue-100 px-1 rounded">area_id</code></li>
                <li>Smaže všechny <code className="bg-blue-100 px-1 rounded">goal_metrics</code></li>
              </ul>
              <p className="mt-3 font-semibold text-red-700">⚠️ Tato akce je nevratná!</p>
            </div>
          </div>
        </div>

        {/* Migration Button */}
        <div className="mb-6">
          <button
            onClick={runMigration}
            disabled={migrationStatus.status === 'running'}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all ${
              migrationStatus.status === 'running'
                ? 'bg-gray-400 cursor-not-allowed'
                : migrationStatus.status === 'success'
                ? 'bg-green-500 hover:bg-green-600'
                : 'bg-primary-500 hover:bg-primary-600 text-white'
            }`}
          >
            {migrationStatus.status === 'running' ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Migrace probíhá...</span>
              </>
            ) : migrationStatus.status === 'success' ? (
              <>
                <CheckCircle className="w-5 h-5" />
                <span>Migrace dokončena</span>
              </>
            ) : (
              <>
                <Play className="w-5 h-5" />
                <span>Spustit migraci</span>
              </>
            )}
          </button>
        </div>

        {/* Status Display */}
        {migrationStatus.status !== 'idle' && (
          <div className={`rounded-lg border-2 p-4 ${
            migrationStatus.status === 'success'
              ? 'bg-green-50 border-green-200'
              : migrationStatus.status === 'error'
              ? 'bg-red-50 border-red-200'
              : 'bg-blue-50 border-blue-200'
          }`}>
            <div className="flex items-start gap-3">
              {migrationStatus.status === 'running' && (
                <Loader2 className="w-5 h-5 text-blue-600 animate-spin mt-0.5" />
              )}
              {migrationStatus.status === 'success' && (
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
              )}
              {migrationStatus.status === 'error' && (
                <XCircle className="w-5 h-5 text-red-600 mt-0.5" />
              )}
              <div className="flex-1">
                <p className={`font-semibold mb-2 ${
                  migrationStatus.status === 'success' ? 'text-green-900' :
                  migrationStatus.status === 'error' ? 'text-red-900' :
                  'text-blue-900'
                }`}>
                  {migrationStatus.message}
                </p>

                {migrationStatus.summary && (
                  <div className="mt-4 space-y-2">
                    <p className="text-sm font-semibold text-gray-700">Výsledky migrace:</p>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="bg-white rounded p-2">
                        <span className="text-gray-600">Zpracováno cílů:</span>
                        <span className="font-semibold ml-2">{migrationStatus.summary.goalsProcessed}</span>
                      </div>
                      <div className="bg-white rounded p-2">
                        <span className="text-gray-600">Vytvořeno oblastí:</span>
                        <span className="font-semibold ml-2">{migrationStatus.summary.areasCreated}</span>
                      </div>
                      <div className="bg-white rounded p-2">
                        <span className="text-gray-600">Vytvořeno milníků:</span>
                        <span className="font-semibold ml-2">{migrationStatus.summary.milestonesCreated}</span>
                      </div>
                      <div className="bg-white rounded p-2">
                        <span className="text-gray-600">Aktualizováno kroků:</span>
                        <span className="font-semibold ml-2">{migrationStatus.summary.stepsUpdated}</span>
                      </div>
                      <div className="bg-white rounded p-2 col-span-2">
                        <span className="text-gray-600">Smazáno goal_metrics:</span>
                        <span className="font-semibold ml-2">{migrationStatus.summary.metricsDeleted}</span>
                      </div>
                    </div>
                  </div>
                )}

                {migrationStatus.error && (
                  <div className="mt-3 p-3 bg-red-100 rounded border border-red-300">
                    <p className="text-sm text-red-800 font-mono">{migrationStatus.error}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
