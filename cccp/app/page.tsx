export default function HomePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-sky-50 via-slate-50 to-emerald-50">
      <div className="max-w-xl rounded-2xl bg-white/80 p-8 shadow-lg shadow-sky-100 ring-1 ring-slate-100">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          Coach CRM & Klientský portál
        </h1>
        <p className="mt-3 text-sm text-slate-600">
          Nová oddělená appka pro leady, klienty a schůzky.
        </p>
        <div className="mt-6 flex gap-3">
          <a
            href="/login"
            className="inline-flex items-center justify-center rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800"
          >
            Přihlásit se
          </a>
          <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
            MVP / vlastní DB (Neon)
          </span>
        </div>
      </div>
    </main>
  );
}

