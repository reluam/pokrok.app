import { verifyUserSession, getUserPurchases, type Purchase } from '@/lib/user-auth'
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

function AuditCard({ purchase }: { purchase: Purchase }) {
  const isCompleted = !!purchase.completed_at

  return (
    <div className="paper-card rounded-[20px] px-6 py-5 flex items-start gap-4">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent/10 text-xl">
        🧭
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="text-base font-bold text-foreground">Tvůj kompas</h3>
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

async function Dashboard({ userId, email }: { userId: string; email: string }) {
  const purchases = await getUserPurchases(userId)
  const audits = purchases.filter((p) => p.product_slug === 'audit-zivota')
  const activeAudit = audits.find((p) => !p.completed_at)
  const completedAudits = audits.filter((p) => !!p.completed_at)

  return (
    <div className="space-y-6">
      {/* Hlavička */}
      <div className="paper-card rounded-[28px] px-6 py-8 md:px-10 md:py-8 flex items-start justify-between gap-4 flex-wrap">
        <div className="space-y-1">
          <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-foreground/40">
            Můj účet
          </div>
          <p className="text-lg font-semibold text-foreground">{email}</p>
        </div>
        <LogoutButton />
      </div>

      {/* Tvůj kompas */}
      <div className="space-y-3">
        <h2 className="text-xl font-extrabold tracking-tight text-foreground px-1">
          Tvůj kompas
        </h2>

        {/* Aktivní cesta */}
        {activeAudit && <AuditCard purchase={activeAudit} />}

        {/* Dokončené cesty */}
        {completedAudits.length > 0 && (
          <div className="space-y-3">
            {completedAudits.map((p) => (
              <AuditCard key={p.id} purchase={p} />
            ))}
          </div>
        )}

        {/* Žádný audit */}
        {audits.length === 0 && (
          <div className="paper-card rounded-[24px] px-6 py-10 text-center space-y-4">
            <div className="text-4xl">🗺️</div>
            <div className="space-y-1">
              <p className="font-semibold text-foreground">Zatím jsi nezahájil/a žádný Tvůj kompas</p>
              <p className="text-sm text-foreground/55 leading-relaxed">
                Tvůj kompas tě provede sedmi kroky od upřímného pohledu na sebe až po vlastní plán.
              </p>
            </div>
            <Link
              href="/tvuj-kompas"
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-accent text-white rounded-full text-sm font-bold hover:bg-accent-hover transition-colors"
            >
              Zahájit →
            </Link>
          </div>
        )}

        {/* Po dokončení – nabídka nové cesty */}
        {!activeAudit && completedAudits.length > 0 && (
          <div className="paper-card rounded-[20px] px-5 py-4 flex items-center justify-between gap-4 border border-dashed border-black/10 bg-transparent">
            <p className="text-sm text-foreground/60 leading-relaxed">
              Chceš projít audit znovu — s čistým listem?
            </p>
            <Link
              href="/tvuj-kompas"
              className="flex-shrink-0 px-4 py-2 bg-accent text-white rounded-full text-sm font-bold hover:bg-accent-hover transition-colors"
            >
              Zahájit nový
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
