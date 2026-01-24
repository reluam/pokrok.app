import { redirect } from 'next/navigation'
import { verifySession } from '@/lib/auth'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const isAuthenticated = await verifySession()

  if (!isAuthenticated) {
    redirect('/admin/login')
  }

  return <>{children}</>
}
