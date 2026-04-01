import { verifyUserSession, getUserPurchases, type Purchase } from '@/lib/user-auth'
import { checkDilnaAccess } from '@/lib/dilna-auth'
import LoginForm from './LoginForm'
import LogoutButton from './LogoutButton'
import AuditPurchaseActions from './AuditPurchaseActions'
import Link from 'next/link'

function formatDate(date: Date) {
  return new Date(date).toLocaleDateString('cs-CZ', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

// ── Dílna card ────────────────────────────────────────────────────────────

function DilnaCard({ hasAccess }: { hasAccess: boolean }) {
  if (hasAccess) {
    return (
      <div className="paper-card rounded-[24px] px-6 py-6 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent/10 text-xl">
            🧪
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-foreground/40 mb-0.5">
              Aktivní předplatné
            </p>
            <p className="font-bold text-foreground">Dílna</p>
          </div>
        </div>
        <Link
          href="/dilna/dashboard"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-accent text-white rounded-full text-sm font-bold hover:bg-accent-hover transition-colors shrink-0"
        >
          Vstoupit →
        </Link>
      </div>
    )
  }

  return (
    <div className="paper-card rounded-[24px] px-6 py-6 flex items-center justify-between gap-4 flex-wrap border border-dashed border-black/10 bg-transparent">
      <div className="flex items-center gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-foreground/5 text-xl">
          🧪
        </div>
        <div>
          <p className="font-semibold text-foreground">Dílna</p>
          <p className="text-xs text-foreground/50 mt-0.5">
            Interaktivní nástroje a cvičení. 490 Kč / rok.
          </p>
        </div>
      </div>
      <Link
        href="/dilna"
        className="inline-flex items-center gap-2 px-5 py-2.5 border border-foreground/15 rounded-full text-sm font-semibold text-foreground/70 hover:border-foreground/30 hover:text-foreground transition-colors shrink-0"
      >
        Získat přístup
      </Link>
    </div>
  )
}

// ── Exercise result card ──────────────────────────────────────────────────────

function ExerciseCard({ purchase }: { purchase: Purchase }) {
  const isCompleted = !!purchase.completed_at

  return (
    <div className="paper-card rounded-[20px] px-6 py-5 flex items-start gap-4">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent/10 text-xl">
        🧭
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="text-base font-bold text-foreground">Kompas</h3>
          {isCompleted ? (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-foreground/8 text-foreground/50">
              Dokončeno
            </span>
          ) : (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-700 font-medium">
              Probíhá
            </span>
          )}
        </div>
        <p className="text-xs text-foreground/40 mt-0.5">
          {isCompleted
            ? `Dokončeno ${formatDate(purchase.completed_at!)}`
            : `Zahájeno ${formatDate(purchase.created_at)}`}
        </p>
        <AuditPurchaseActions purchaseId={purchase.id} isCompleted={isCompleted} />
      </div>
    </div>
  )
}

// ── Dashboard ─────────────────────────────────────────────────────────────────

async function Dashboard({ userId, email }: { userId: string; email: string }) {
  const [purchases, hasDilnaAccess] = await Promise.all([
    getUserPurchases(userId),
    checkDilnaAccess(),
  ])

  const audits = purchases.filter((p) => p.product_slug === 'audit-zivota')
  const activeAudit = audits.find((p) => !p.completed_at)
  const completedAudits = audits.filter((p) => !!p.completed_at)

  return (
    <div className="space-y-6">
      {/* Hlavička */}
      <div className="paper-card rounded-[28px] px-6 py-6 md:px-10 md:py-7 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-foreground/40 mb-0.5">
            Můj účet
          </p>
          <p className="font-semibold text-foreground">{email}</p>
        </div>
        <LogoutButton />
      </div>

      {/* Dílna */}
      <DilnaCard hasAccess={hasDilnaAccess} />

      {/* Výsledky cvičení */}
      {audits.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-[0.18em] text-foreground/40 px-1">
            Výsledky cvičení
          </h2>

          {activeAudit && <ExerciseCard purchase={activeAudit} />}

          {completedAudits.map((p) => (
            <ExerciseCard key={p.id} purchase={p} />
          ))}

          {!activeAudit && completedAudits.length > 0 && (
            <div className="paper-card rounded-[20px] px-5 py-4 flex items-center justify-between gap-4 border border-dashed border-black/10 bg-transparent">
              <p className="text-sm text-foreground/60">
                Chceš projít Kompas znovu — s čistým listem?
              </p>
              <Link
                href="/dilna/tvuj-kompas"
                className="shrink-0 px-4 py-2 bg-accent text-white rounded-full text-sm font-bold hover:bg-accent-hover transition-colors"
              >
                Zahájit nový
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function UcetPage({
  searchParams,
}: {
  searchParams: Promise<{ chyba?: string }>
}) {
  const params = await searchParams
  const tokenError = params.chyba === 'token'
  const user = await verifyUserSession()

  return (
    <main className="min-h-screen">
      <section className="pt-8 pb-16 md:pt-10 md:pb-20">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto">
            {!user ? (
              <div className="paper-card rounded-[28px] px-6 py-8 md:px-10 md:py-10">
                <LoginForm tokenError={tokenError} />
              </div>
            ) : (
              <Dashboard userId={user.id} email={user.email} />
            )}
          </div>
        </div>
      </section>
    </main>
  )
}
