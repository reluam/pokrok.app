"use client";

import { SignInButton, SignedIn, SignedOut } from "@clerk/nextjs";

export default function HomePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-sky-50 via-slate-50 to-emerald-50">
      <div className="max-w-xl rounded-xl border border-slate-200 bg-white p-8">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          Coach CRM & Klientský portál
        </h1>
        <p className="mt-3 text-sm text-slate-600">
          Nová oddělená appka pro leady, klienty a schůzky.
        </p>
        <div className="mt-6 flex gap-3">
          <SignedOut>
            <SignInButton mode="modal">
              <button className="inline-flex items-center justify-center rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800">
                Přihlásit se
              </button>
            </SignInButton>
          </SignedOut>
          <SignedIn>
            <a
              href="/crm"
              className="inline-flex items-center justify-center rounded-full bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-emerald-500"
            >
              Přejít do CRM
            </a>
          </SignedIn>
          <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
            MVP / vlastní DB (Neon)
          </span>
        </div>
      </div>
    </main>
  );
}

