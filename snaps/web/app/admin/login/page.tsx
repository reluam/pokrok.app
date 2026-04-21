'use client';

import { useCallback, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, ShieldCheck } from 'lucide-react';

const CODE_LENGTH = 6;

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState('');
  const codeRef = useRef<HTMLInputElement>(null);

  const handleSendCode = async () => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !trimmed.includes('@')) {
      setError('Zadej platný e-mail');
      return;
    }
    setLoading(true);
    setError('');
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'request', email: trimmed }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? 'Nepodařilo se odeslat kód');
      return;
    }
    setStep('code');
    setTimeout(() => codeRef.current?.focus(), 100);
  };

  const handleVerify = useCallback(
    async (fullCode: string) => {
      if (verifying) return;
      setVerifying(true);
      setError('');
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'verify', email: email.trim().toLowerCase(), code: fullCode }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? 'Neplatný kód');
        setCode('');
        setVerifying(false);
        return;
      }
      router.replace('/admin');
    },
    [email, verifying, router],
  );

  const handleCodeChange = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, CODE_LENGTH);
    setCode(digits);
    if (digits.length === CODE_LENGTH) handleVerify(digits);
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-surface px-md py-lg">
      <div className="w-full max-w-md rounded-2xl border-2 border-[#E5E7EB] bg-card p-xl shadow-[2px_4px_0_0_#D1D5DB]">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-light">
          <ShieldCheck className="h-7 w-7 text-primary" />
        </div>
        <h1 className="mt-md text-center text-2xl font-extrabold text-ink-primary">
          Admin přihlášení
        </h1>
        <p className="mt-xs text-center text-sm text-ink-secondary">
          Přístup jen pro povolené e-maily.
        </p>

        {step === 'email' ? (
          <div className="mt-lg space-y-md">
            <div>
              <label className="text-xs font-bold text-ink-muted">E-mail</label>
              <div className="mt-xs flex items-center gap-sm rounded-xl border-2 border-[#E5E7EB] bg-white px-md py-sm focus-within:border-primary">
                <Mail className="h-4 w-4 text-ink-muted" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendCode()}
                  placeholder="admin@example.com"
                  className="flex-1 bg-transparent text-sm text-ink-primary outline-none"
                  autoFocus
                />
              </div>
            </div>
            {error && <p className="text-xs font-bold text-red-500">{error}</p>}
            <button
              onClick={handleSendCode}
              disabled={loading}
              className="w-full rounded-xl bg-primary px-md py-sm text-sm font-extrabold text-white transition-all hover:-translate-y-0.5 disabled:opacity-50"
            >
              {loading ? 'Odesílám…' : 'Poslat kód'}
            </button>
          </div>
        ) : (
          <div className="mt-lg space-y-md">
            <p className="text-center text-sm text-ink-secondary">
              Kód jsme poslali na <span className="font-bold text-ink-primary">{email}</span>
            </p>
            <input
              ref={codeRef}
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={code}
              onChange={(e) => handleCodeChange(e.target.value)}
              maxLength={CODE_LENGTH}
              placeholder="______"
              className="w-full rounded-xl border-2 border-[#E5E7EB] bg-white px-md py-md text-center text-2xl font-extrabold tracking-widest text-ink-primary outline-none focus:border-primary"
            />
            {error && <p className="text-center text-xs font-bold text-red-500">{error}</p>}
            <button
              onClick={() => {
                setStep('email');
                setCode('');
                setError('');
              }}
              className="w-full text-xs font-bold text-ink-muted hover:text-ink-primary"
            >
              Změnit e-mail
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
