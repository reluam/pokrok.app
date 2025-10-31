'use client'

import { useState, useEffect } from 'react'
import { AlertTriangle, X } from 'lucide-react'

export default function AdminDatabaseBanner() {
  const [isDismissed, setIsDismissed] = useState(false)
  const [showBanner, setShowBanner] = useState(false)

  useEffect(() => {
    // Check if banner was previously dismissed
    const dismissed = localStorage.getItem('admin-db-banner-dismissed')
    if (dismissed) {
      setIsDismissed(true)
      return
    }

    // Test if database is available by making a simple API call
    const testDatabase = async () => {
      try {
        const response = await fetch('/api/offer-sections')
        if (response.status === 500) {
          // Database error, show banner
          setShowBanner(true)
        }
      } catch (error) {
        // Network error or other issue
        setShowBanner(true)
      }
    }

    testDatabase()
  }, [])

  const handleDismiss = () => {
    setIsDismissed(true)
    setShowBanner(false)
    localStorage.setItem('admin-db-banner-dismissed', 'true')
  }

  if (isDismissed || !showBanner) {
    return null
  }

  return (
    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
      <div className="flex">
        <div className="flex-shrink-0">
          <AlertTriangle className="h-5 w-5 text-yellow-400" />
        </div>
        <div className="ml-3 flex-1">
          <p className="text-sm text-yellow-700">
            <strong>Databáze není nakonfigurována.</strong> Admin rozhraní funguje v demo režimu s výchozími daty. 
            Pro plnou funkcionalnost (vytváření, úpravy, mazání) je potřeba nastavit databázové připojení.
          </p>
          <p className="text-xs text-yellow-600 mt-1">
            Přidejte POSTGRES_URL do vašich environment variables.
          </p>
        </div>
        <div className="ml-auto pl-3">
          <div className="-mx-1.5 -my-1.5">
            <button
              onClick={handleDismiss}
              className="inline-flex rounded-md bg-yellow-50 p-1.5 text-yellow-500 hover:bg-yellow-100 focus:outline-none focus:ring-2 focus:ring-yellow-600 focus:ring-offset-2 focus:ring-offset-yellow-50"
            >
              <span className="sr-only">Dismiss</span>
              <X className="h-3 w-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
