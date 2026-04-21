import Link from 'next/link';
import { redirect } from 'next/navigation';
import { LogOut, LayoutDashboard, BookOpen, Users, ShieldCheck } from 'lucide-react';
import { getAdminSession } from '@web/lib/admin-auth';

export const dynamic = 'force-dynamic';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getAdminSession();
  if (!session) redirect('/admin/login');

  return (
    <div className="min-h-screen bg-surface">
      <aside className="fixed left-0 top-0 flex h-screen w-60 flex-col border-r-2 border-[#E5E7EB] bg-card">
        <div className="border-b-2 border-[#E5E7EB] p-md">
          <div className="flex items-center gap-sm">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-light">
              <ShieldCheck className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-extrabold text-ink-primary">Calibrate Admin</p>
              <p className="truncate text-[11px] text-ink-muted">{session.email}</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 space-y-1 p-sm">
          <AdminNavLink href="/admin" icon={<LayoutDashboard className="h-4 w-4" />}>
            Přehled
          </AdminNavLink>
          <AdminNavLink href="/admin/content" icon={<BookOpen className="h-4 w-4" />}>
            Obsah
          </AdminNavLink>
          <AdminNavLink href="/admin/users" icon={<Users className="h-4 w-4" />}>
            Uživatelé
          </AdminNavLink>
        </nav>

        <form action="/api/admin/logout" method="post" className="border-t-2 border-[#E5E7EB] p-sm">
          <button
            type="submit"
            formAction="/api/admin/logout"
            className="flex w-full items-center gap-sm rounded-xl px-md py-sm text-sm font-bold text-ink-secondary transition-colors hover:bg-surface hover:text-ink-primary"
          >
            <LogOut className="h-4 w-4" />
            Odhlásit
          </button>
        </form>
      </aside>

      <main className="ml-60 p-lg">{children}</main>
    </div>
  );
}

function AdminNavLink({
  href,
  icon,
  children,
}: {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-sm rounded-xl px-md py-sm text-sm font-bold text-ink-secondary transition-colors hover:bg-surface hover:text-ink-primary"
    >
      {icon}
      {children}
    </Link>
  );
}
