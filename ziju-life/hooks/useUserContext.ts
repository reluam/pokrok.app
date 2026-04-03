"use client"

import { useState, useEffect, useCallback, useRef } from "react"

/**
 * API-first hook for user context data with localStorage fallback.
 *
 * Load order:
 * 1. If user is authenticated → fetch from API, cache to localStorage
 * 2. If API fails or user is anonymous → fall back to localStorage
 * 3. Auto-migrate: if API is empty but localStorage has data → sync to API
 *
 * Save order:
 * 1. POST to API (if authenticated)
 * 2. Also write to localStorage as cache
 */

interface UseUserContextOptions<T> {
  /** API context type (compass, values, rituals) */
  contextType: string
  /** localStorage key for cache/fallback */
  lsKey: string
  /** Convert API response data to local type */
  fromApi: (data: unknown) => T | null
  /** Convert local type to API format */
  toApi: (data: T) => unknown
  /** Parse raw localStorage JSON string */
  fromLs: (raw: string) => T | null
}

interface UseUserContextResult<T> {
  data: T | null
  loading: boolean
  save: (data: T) => Promise<void>
  clear: () => Promise<void>
}

export function useUserContext<T>(opts: UseUserContextOptions<T>): UseUserContextResult<T> {
  const { contextType, lsKey, fromApi, toApi, fromLs } = opts
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const optsRef = useRef(opts)
  optsRef.current = opts

  useEffect(() => {
    let cancelled = false

    async function load() {
      // Try API first
      try {
        const res = await fetch("/api/manual/user-context")
        if (res.ok) {
          const json = await res.json()
          const apiData = json.context?.[contextType]
          const parsed = fromApi(apiData)

          if (parsed) {
            if (!cancelled) {
              setData(parsed)
              setLoading(false)
              // Cache to localStorage
              try { localStorage.setItem(lsKey, JSON.stringify(parsed)) } catch {}
            }
            return
          }

          // API returned empty — check localStorage for migration
          try {
            const lsRaw = localStorage.getItem(lsKey)
            if (lsRaw) {
              const lsData = fromLs(lsRaw)
              if (lsData) {
                if (!cancelled) {
                  setData(lsData)
                  setLoading(false)
                }
                // Auto-migrate localStorage data to API
                const apiPayload = optsRef.current.toApi(lsData)
                try {
                  await fetch("/api/manual/user-context", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ type: contextType, data: apiPayload }),
                  })
                } catch {}
                return
              }
            }
          } catch {}

          // Neither API nor localStorage has data
          if (!cancelled) {
            setData(null)
            setLoading(false)
          }
          return
        }
      } catch {
        // API failed — network error or not authenticated
      }

      // Fall back to localStorage
      try {
        const lsRaw = localStorage.getItem(lsKey)
        if (lsRaw) {
          const lsData = fromLs(lsRaw)
          if (!cancelled) {
            setData(lsData)
            setLoading(false)
          }
          return
        }
      } catch {}

      if (!cancelled) {
        setData(null)
        setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [contextType, lsKey, fromApi, fromLs])

  const save = useCallback(async (newData: T) => {
    setData(newData)

    // Cache to localStorage
    try { localStorage.setItem(lsKey, JSON.stringify(newData)) } catch {}

    // POST to API
    const apiPayload = optsRef.current.toApi(newData)
    try {
      await fetch("/api/manual/user-context", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: contextType, data: apiPayload }),
      })
    } catch {}
  }, [contextType, lsKey])

  const clear = useCallback(async () => {
    setData(null)
    try { localStorage.removeItem(lsKey) } catch {}

    // Clear in API by saving empty object
    try {
      await fetch("/api/manual/user-context", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: contextType, data: {} }),
      })
    } catch {}
  }, [contextType, lsKey])

  return { data, loading, save, clear }
}
