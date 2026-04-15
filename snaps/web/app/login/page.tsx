'use client';

import { useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, ArrowLeft } from 'lucide-react';
import { Calibrate } from '@web/components/mascot/Calibrate';
import { useWebUserStore } from '@web/lib/user-store';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const CODE_LENGTH = 6;

async function requestOtp(email: string, locale: string) {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/request-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, locale }),
  });
  const data = await res.json();
  if (!res.ok) return { success: false as const, error: data.error ?? 'Failed to send code' };
  return { success: true as const };
}

async function verifyOtp(email: string, code: string) {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, code }),
  });
  const data = await res.json();
  if (!res.ok) return { success: false as const, error: data.error ?? 'Verification failed' };
  return { success: true as const, user_id: data.user_id as string, is_new_user: data.is_new_user as boolean | undefined };
}

export default function LoginPage() {
  const router = useRouter();
  const login = useWebUserStore((s) => s.login);

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

    const result = await requestOtp(trimmed, 'cs');
    if (!result.success) {
      setError(result.error ?? 'Nepodařilo se odeslat kód');
      setLoading(false);
      return;
    }
    setStep('code');
    setLoading(false);
    setTimeout(() => codeRef.current?.focus(), 100);
  };

  const handleVerify = useCallback(
    async (fullCode: string) => {
      if (verifying) return;
      const trimmed = email.trim().toLowerCase();
      setVerifying(true);
      setError('');

      const result = await verifyOtp(trimmed, fullCode);
      if (!result.success) {
        setError(result.error ?? 'Neplatný kód');
        setVerifying(false);
        setCode('');
        return;
      }

      login(result.user_id, trimmed, trimmed.split('@')[0]);
      router.push('/dashboard');
    },
    [email, verifying, login, router],
  );

  const handleCodeChange = useCallback(
    (value: string) => {
      const cleaned = value.replace(/[^0-9]/g, '').slice(0, CODE_LENGTH);
      setCode(cleaned);
      setError('');
      if (cleaned.length === CODE_LENGTH) {
        handleVerify(cleaned);
      }
    },
    [handleVerify],
  );

  const handleResend = async () => {
    setError('');
    setCode('');
    const result = await requestOtp(email.trim().toLowerCase(), 'cs');
    if (!result.success) {
      setError(result.error ?? 'Nepodařilo se odeslat kód');
    }
  };

  const handleDemoLogin = () => {
    login('demo-user', 'demo@calibrate.app', 'Demo');
    router.push('/dashboard');
  };

  if (step === 'code') {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background p-lg">
        <div className="w-full max-w-[420px] space-y-lg">
          <div className="text-center">
            <Mail className="mx-auto h-14 w-14 text-primary" />
            <h1 className="mt-md text-2xl font-extrabold text-ink-primary">
              Zadej kód
            </h1>
            <p className="mt-xs text-sm text-ink-secondary">
              Poslali jsme 6místný kód na{' '}
              <span className="font-bold text-primary">{email.trim()}</span>
            </p>
          </div>

          <div className="space-y-md">
            <input
              ref={codeRef}
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={CODE_LENGTH}
              placeholder="000000"
              value={code}
              onChange={(e) => handleCodeChange(e.target.value)}
              disabled={verifying}
              autoFocus
              className="w-full rounded-xl border-2 border-border bg-card px-lg py-md text-center text-[32px] font-extrabold tracking-[12px] text-ink-primary placeholder:text-ink-muted focus:border-primary focus:outline-none disabled:opacity-50"
            />

            {verifying && (
              <div className="flex items-center justify-center gap-sm">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                <span className="text-sm text-ink-secondary">Ověřuji...</span>
              </div>
            )}

            {error && (
              <p className="text-center text-sm text-error">{error}</p>
            )}

            <button
              type="button"
              onClick={handleResend}
              className="w-full rounded-xl py-sm text-sm font-bold text-ink-secondary transition-colors hover:text-primary"
            >
              Poslat kód znovu
            </button>

            <button
              type="button"
              onClick={() => {
                setStep('email');
                setCode('');
                setError('');
              }}
              className="flex w-full items-center justify-center gap-xs rounded-xl py-sm text-sm font-bold text-ink-secondary transition-colors hover:text-primary"
            >
              <ArrowLeft className="h-4 w-4" />
              Změnit e-mail
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-background p-lg">
      <div className="w-full max-w-[420px] space-y-lg">
        <div className="flex flex-col items-center text-center">
          <Calibrate size={120} mood="happy" />
          <h1 className="mt-md text-[36px] font-extrabold text-ink-primary">
            Calibrate
          </h1>
          <p className="mt-xs text-md text-ink-secondary">
            Trénuj mysl. Ovládni modely.
          </p>
        </div>

        <div className="space-y-md">
          <p className="text-center text-sm text-ink-secondary">
            Zadej e-mail a pošleme ti přihlašovací kód. Žádné heslo.
          </p>

          <input
            type="email"
            placeholder="tvůj@email.cz"
            autoComplete="email"
            autoFocus
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setError('');
            }}
            onKeyDown={(e) => e.key === 'Enter' && handleSendCode()}
            className="w-full rounded-xl border-2 border-border bg-card px-md py-md text-md text-ink-primary placeholder:text-ink-secondary focus:border-primary focus:outline-none"
          />

          {error && (
            <p className="text-center text-sm text-error">{error}</p>
          )}

          <button
            type="button"
            onClick={handleSendCode}
            disabled={loading}
            className="w-full rounded-full bg-primary py-md text-md font-bold text-white transition-all hover:-translate-y-0.5 hover:bg-primary-dark hover:shadow-card active:translate-y-0 disabled:opacity-50 disabled:hover:translate-y-0"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-sm">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Odesílám...
              </span>
            ) : (
              'Poslat kód'
            )}
          </button>

          <div className="flex items-center gap-md">
            <div className="h-px flex-1 bg-border" />
            <span className="text-sm text-ink-secondary">nebo</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <button
            type="button"
            onClick={handleDemoLogin}
            className="w-full rounded-full border-2 border-border-light bg-card py-md text-md font-bold text-ink-primary transition-colors hover:border-primary"
          >
            Vyzkoušet bez registrace
          </button>
        </div>
      </div>
    </div>
  );
}
