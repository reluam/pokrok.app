import { redirect } from 'next/navigation'
import { verifySession } from '@/lib/auth'
import AdminNavigation from '@/components/admin/AdminNavigation'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const isAuthenticated = await verifySession()

  if (!isAuthenticated) {
    redirect('/admin/login')
  }

  return (
    <div className="flex min-h-screen bg-[#FFFAF5]">
      <AdminNavigation />
      <main className="flex-1 ml-64 p-8 min-h-screen">
        {children}
      </main>
    </div>
  )
}
