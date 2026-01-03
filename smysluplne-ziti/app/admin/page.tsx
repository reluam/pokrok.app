'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Book, Video, FileText, Lock, LogOut, Loader2 } from 'lucide-react'
import Link from 'next/link'

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/auth/login')
      const data = await res.json()
      setIsAuthenticated(data.authenticated)
    } catch (error) {
      setIsAuthenticated(false)
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })

      const data = await res.json()

      if (res.ok && data.success) {
        setIsAuthenticated(true)
        setPassword('')
      } else {
        setError(data.error || 'Nesprávné heslo')
      }
    } catch (error) {
      setError('Chyba při přihlášení')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      setIsAuthenticated(false)
    } catch (error) {
      console.error('Error logging out:', error)
    }
  }

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="animate-spin text-primary-600" size={32} />
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="max-w-md w-full bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-8 md:p-12 border border-primary-100">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-100 mb-4">
              <Lock className="text-primary-600" size={32} />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-text-primary mb-2">
              Admin přístup
            </h1>
            <p className="text-text-secondary">Zadejte heslo pro přístup do administrace</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-text-primary mb-2">
                Heslo
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border-2 border-primary-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all bg-white"
                placeholder="Zadejte heslo"
                required
                autoFocus
              />
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-50 text-red-800 border border-red-200 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary-600 text-white py-3 px-6 rounded-full font-semibold hover:bg-primary-700 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  Přihlašování...
                </>
              ) : (
                <>
                  <Lock size={18} />
                  Přihlásit se
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="section-padding">
        <div className="max-w-7xl mx-auto container-padding">
          {/* Header */}
          <div className="flex items-center justify-between mb-12">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-text-primary mb-2">
                Administrace
              </h1>
              <p className="text-text-secondary text-lg">
                Správa obsahu webu Smyslužití
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-full font-semibold hover:bg-gray-300 transition-colors"
            >
              <LogOut size={18} />
              Odhlásit se
            </button>
          </div>

          {/* Admin sections */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Inspirace */}
            <Link
              href="/admin/inspirace"
              className="group bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-8 border border-primary-100 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="bg-primary-100 p-4 rounded-xl group-hover:bg-primary-200 transition-colors">
                  <Book className="text-primary-600" size={32} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-text-primary">Inspirace</h2>
                  <p className="text-text-secondary text-sm">Články, videa, knihy</p>
                </div>
              </div>
              <p className="text-text-secondary">
                Spravujte obsah sekce inspirace - přidávejte, upravujte a mažte články, videa a knihy.
              </p>
            </Link>

            {/* Články */}
            <Link
              href="/admin/clanky"
              className="group bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-8 border border-primary-100 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="bg-primary-100 p-4 rounded-xl group-hover:bg-primary-200 transition-colors">
                  <FileText className="text-primary-600" size={32} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-text-primary">Články</h2>
                  <p className="text-text-secondary text-sm">Vlastní články</p>
                </div>
              </div>
              <p className="text-text-secondary">
                Vytvářejte a spravujte vlastní články, které budou zobrazeny na webu.
              </p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
