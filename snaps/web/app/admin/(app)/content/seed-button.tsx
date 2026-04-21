'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Database, Loader2 } from 'lucide-react';

export function SeedButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async () => {
    if (!confirm('Naimportovat bundled obsah do databáze? Přepíše existující položky se stejným ID.')) return;
    setLoading(true);
    setError(null);
    const res = await fetch('/api/admin/seed', { method: 'POST' });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? 'Seed selhal');
      return;
    }
    router.refresh();
  };

  return (
    <div>
      <button
        onClick={run}
        disabled={loading}
        className="inline-flex items-center gap-sm rounded-xl bg-primary px-md py-sm text-sm font-extrabold text-white transition-all hover:-translate-y-0.5 disabled:opacity-50"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Database className="h-4 w-4" />}
        {loading ? 'Importuji…' : 'Naimportovat bundled obsah'}
      </button>
      {error && <p className="mt-xs text-xs font-bold text-red-500">{error}</p>}
    </div>
  );
}
