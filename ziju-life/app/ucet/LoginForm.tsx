'use client'

import { useState, useRef, useEffect } from 'react'

const CODE_LENGTH = 6

export default function LoginForm({ tokenError }: { tokenError?: boolean }) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [digits, setDigits] = useState<string[]>(Array(CODE_LENGTH).fill(''))
  const [verifying, setVerifying] = useState(false)
  const [codeError, setCodeError] = useState('')
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

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

  const handleDigitChange = (index: number, value: string) => {
    const digit = value.replace(/[^0-9]/g, '').slice(-1)
    const newDigits = [...digits]
    newDigits[index] = digit
    setDigits(newDigits)
    setCodeError('')

    if (digit && index < CODE_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus()
    }

    const fullCode = newDigits.join('')
    if (fullCode.length === CODE_LENGTH) {
      handleVerifyCode(fullCode)
    }
  }

  const handleKeyDown = (index: number, key: string) => {
    if (key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
      const newDigits = [...digits]
      newDigits[index - 1] = ''
      setDigits(newDigits)
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const text = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, CODE_LENGTH)
    if (text.length === CODE_LENGTH) {
      setDigits(text.split(''))
      inputRefs.current[CODE_LENGTH - 1]?.focus()
      handleVerifyCode(text)
    }
  }

  const handleVerifyCode = async (code: string) => {
    if (verifying) return
    setVerifying(true)
    setCodeError('')

    try {
      const res = await fetch('/api/auth/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code, source: 'web' }),
      })
      const data = await res.json()
      if (!res.ok) {
        setCodeError(data.error || 'Neplatný kód.')
        setDigits(Array(CODE_LENGTH).fill(''))
        inputRefs.current[0]?.focus()
        setVerifying(false)
        return
      }
      // Success — redirect to account page
      window.location.href = '/ucet'
    } catch {
      setCodeError('Nepodařilo se ověřit kód. Zkus to znovu.')
      setVerifying(false)
    }
  }

  const handleResend = async () => {
    setLoading(true)
    setCodeError('')
    try {
      await fetch('/api/auth/magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      setDigits(Array(CODE_LENGTH).fill(''))
      inputRefs.current[0]?.focus()
    } catch {}
    setLoading(false)
  }

  useEffect(() => {
    if (sent) {
      inputRefs.current[0]?.focus()
    }
  }, [sent])

  if (sent) {
    return (
      <div className="space-y-6">
        <div className="text-center space-y-3">
          <div className="text-4xl">✉️</div>
          <h2 className="text-xl font-bold text-foreground">Zkontroluj svůj e-mail</h2>
          <p className="text-foreground/70 leading-relaxed">
            Poslali jsme kód a odkaz na{' '}
            <strong className="text-foreground">{email}</strong>
          </p>
        </div>

        <div className="space-y-3">
          <p className="text-sm font-semibold text-foreground text-center">
            Zadej 6místný kód z e-mailu:
          </p>
          <div className="flex justify-center gap-2">
            {digits.map((digit, i) => (
              <input
                key={i}
                ref={(ref) => { inputRefs.current[i] = ref }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleDigitChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e.key)}
                onPaste={handlePaste}
                disabled={verifying}
                className={`w-12 h-14 text-center text-2xl font-bold rounded-xl border-2 transition-colors focus:outline-none focus:ring-0 ${
                  digit
                    ? 'border-accent bg-accent/5 text-foreground'
                    : 'border-black/10 bg-white text-foreground'
                } focus:border-accent`}
              />
            ))}
          </div>

          {verifying && (
            <p className="text-sm text-accent text-center">Ověřuji...</p>
          )}
          {codeError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm text-center">
              {codeError}
            </div>
          )}
        </div>

        <div className="text-center space-y-2 pt-2">
          <p className="text-xs text-foreground/45">
            Kód je platný 5 minut. Nebo klikni na odkaz v e-mailu.
          </p>
          <div className="flex items-center justify-center gap-3 text-sm text-foreground/50">
            <button
              onClick={handleResend}
              disabled={loading}
              className="underline hover:text-foreground transition-colors disabled:opacity-50"
            >
              {loading ? 'Odesílám...' : 'Odeslat znovu'}
            </button>
            <span>·</span>
            <button
              onClick={() => { setSent(false); setLoading(false); setDigits(Array(CODE_LENGTH).fill('')) }}
              className="underline hover:text-foreground transition-colors"
            >
              Změnit e-mail
            </button>
          </div>
        </div>
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
          Zadej svůj e-mail a pošleme ti kód pro přihlášení. Žádné heslo.
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
          {loading ? 'Odesíláme...' : 'Poslat kód pro přihlášení'}
        </button>
      </form>
    </div>
  )
}
