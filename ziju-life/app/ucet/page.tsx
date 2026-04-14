import { verifyUserSession } from '@/lib/user-auth'
import LoginForm from './LoginForm'
import LogoutButton from './LogoutButton'

async function Dashboard({ email }: { email: string }) {
  return (
    <div className="space-y-6">
      <div className="paper-card rounded-[28px] px-6 py-6 md:px-10 md:py-7 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-foreground/40 mb-0.5">
            Můj účet
          </p>
          <p className="font-semibold text-foreground">{email}</p>
        </div>
        <LogoutButton />
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
              <Dashboard email={user.email} />
            )}
          </div>
        </div>
      </section>
    </main>
  )
}
