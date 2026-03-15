'use client'

import { useState } from 'react'

export default function LoginForm({ tokenError }: { tokenError?: boolean }) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Něco se pokazilo. Zkus to prosím znovu.')
        setLoading(false)
        return
      }
      setSent(true)
    } catch {
      setError('Nepodařilo se připojit. Zkus to prosím znovu.')
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div className="text-center space-y-4">
        <div className="text-4xl">✉️</div>
        <h2 className="text-xl font-bold text-foreground">Zkontroluj svůj e-mail</h2>
        <p className="text-foreground/70 leading-relaxed">
          Odkaz pro přihlášení jsme odeslali na{' '}
          <strong className="text-foreground">{email}</strong>.<br />
          Platí 5 minut.
        </p>
        <p className="text-sm text-foreground/50">
          Nepřišel e-mail?{' '}
          <button
            onClick={() => { setSent(false); setLoading(false) }}
            className="underline hover:text-foreground transition-colors"
          >
            Zkusit znovu
          </button>
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {tokenError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
          Odkaz pro přihlášení vypršel nebo byl již použit. Požádej o nový.
        </div>
      )}
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-foreground">Přihlásit se</h2>
        <p className="text-foreground/65 leading-relaxed">
          Zadej svůj e-mail a pošleme ti odkaz pro přihlášení. Žádné heslo.
        </p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-semibold text-foreground mb-2">
            E-mail
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tvuj@email.cz"
            className="w-full px-4 py-3 border border-black/10 rounded-xl focus:border-accent focus:ring-1 focus:ring-accent focus:outline-none text-foreground placeholder:text-foreground/35"
            required
            autoFocus
          />
        </div>
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
            {error}
          </div>
        )}
        <button
          type="submit"
          disabled={loading}
          className="w-full px-6 py-3 bg-accent text-white rounded-full font-semibold hover:bg-accent-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Odesíláme...' : 'Poslat odkaz pro přihlášení'}
        </button>
      </form>
    </div>
  )
}
