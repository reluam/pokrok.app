'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Newspaper, KanbanSquare, BarChart3, Rss, ArrowLeft } from 'lucide-react'

const NAV_ITEMS = [
  { href: '/admin/pipeline', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/pipeline/feed', label: 'Feed', icon: Newspaper },
  { href: '/admin/pipeline/kanban', label: 'Pipeline', icon: KanbanSquare },
  { href: '/admin/pipeline/stats', label: 'Statistiky', icon: BarChart3 },
  { href: '/admin/pipeline/sources', label: 'Zdroje', icon: Rss },
]

export default function PipelineLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="min-h-screen">
      {/* Sub-navigation */}
      <div className="border-b-2 border-black/10 bg-white/60 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 flex items-center gap-6 h-12">
          <Link
            href="/admin"
            className="flex items-center gap-1.5 text-sm text-foreground/50 hover:text-foreground transition-colors"
          >
            <ArrowLeft size={15} />
            Admin
          </Link>

          <div className="h-5 w-px bg-black/10" />

          <span className="text-sm font-bold text-foreground">Knowledge Pipeline</span>

          <nav className="flex items-center gap-1 ml-4">
            {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
              const isActive = pathname === href
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold transition-colors ${
                    isActive
                      ? 'bg-accent text-white'
                      : 'text-foreground/60 hover:bg-black/5 hover:text-foreground'
                  }`}
                >
                  <Icon size={14} />
                  {label}
                </Link>
              )
            })}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-6 py-6">
        {children}
      </div>
    </div>
  )
}
