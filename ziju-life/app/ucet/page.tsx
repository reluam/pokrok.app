import { verifyUserSession, getUserPurchases, type Purchase } from '@/lib/user-auth'
import LoginForm from './LoginForm'
import LogoutButton from './LogoutButton'

const PRODUCT_LABELS: Record<string, { name: string; description: string; emoji: string }> = {
  'audit-zivota': {
    name: 'Audit života',
    description: 'Interaktivní průvodce, který ti pomůže zmapovat a zhodnotit klíčové oblasti tvého života.',
    emoji: '🔍',
  },
}

function PurchaseCard({ purchase }: { purchase: Purchase }) {
  const product = PRODUCT_LABELS[purchase.product_slug] ?? {
    name: purchase.product_slug,
    description: '',
    emoji: '📦',
  }
  const date = new Date(purchase.created_at).toLocaleDateString('cs-CZ', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  return (
    <div className="paper-card rounded-[20px] px-6 py-6 flex items-start gap-4">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-accent/10 text-2xl">
        {product.emoji}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <h3 className="text-lg font-bold text-foreground">{product.name}</h3>
          <span className="text-xs text-foreground/45 shrink-0 mt-1">Zakoupeno {date}</span>
        </div>
        {product.description && (
          <p className="text-sm text-foreground/65 mt-1 leading-relaxed">{product.description}</p>
        )}
        <a
          href={`/${purchase.product_slug}`}
          className="inline-block mt-3 px-4 py-1.5 bg-accent text-white text-sm font-semibold rounded-full hover:bg-accent-hover transition-colors"
        >
          Otevřít
        </a>
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
              /* ── Přihlášení ────────────────────────────────────── */
              <div className="paper-card rounded-[28px] px-6 py-8 md:px-10 md:py-10">
                <LoginForm tokenError={tokenError} />
              </div>
            ) : (
              /* ── Dashboard ─────────────────────────────────────── */
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

      {/* Produkty */}
      <div className="space-y-4">
        <h2 className="text-xl font-extrabold tracking-tight text-foreground px-1">
          Moje produkty
        </h2>

        {purchases.length === 0 ? (
          <div className="paper-card rounded-[24px] px-6 py-10 text-center space-y-3">
            <div className="text-4xl">📭</div>
            <p className="text-foreground/60 leading-relaxed">
              Zatím nemáš žádné zakoupené produkty.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {purchases.map((p) => (
              <PurchaseCard key={p.id} purchase={p} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
