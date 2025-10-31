'use client'

import Link from 'next/link'
import { 
  FileText, 
  Package, 
  Grid3X3, 
  Video, 
  Users,
  Settings,
  ArrowRight,
  TrendingUp,
  Eye,
  Edit
} from 'lucide-react'

const quickStats = [
  {
    title: 'Inspirace',
    value: '12',
    description: 'Publikovaných článků',
    icon: FileText,
    color: 'bg-blue-500',
    href: '/admin/articles'
  },
  {
    title: 'Koučovací balíčky',
    value: '3',
    description: 'Aktivních balíčků',
    icon: Package,
    color: 'bg-green-500',
    href: '/admin/coaching-packages'
  },
  {
    title: 'Workshopy',
    value: '0',
    description: 'Naplánovaných workshopů',
    icon: Users,
    color: 'bg-purple-500',
    href: '/admin/workshops'
  },
  {
    title: 'Služby',
    value: '3',
    description: 'Aktivních sekcí',
    icon: Grid3X3,
    color: 'bg-orange-500',
    href: '/admin/offer-sections'
  }
]

const recentActivity = [
  {
    action: 'Vytvořen nový článek',
    item: '"Jak najít smysl života"',
    time: 'Před 2 hodinami',
    icon: FileText,
    color: 'text-blue-600'
  },
  {
    action: 'Upraven koučovací balíček',
    item: '"Jednorázový koučing"',
    time: 'Včera',
    icon: Edit,
    color: 'text-green-600'
  },
  {
    action: 'Aktivováno video',
    item: '"Úvodní video"',
    time: 'Před 3 dny',
    icon: Video,
    color: 'text-purple-600'
  }
]

export default function AdminDashboard() {
  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-primary-50 to-primary-100 rounded-2xl p-8 border border-primary-200">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-primary-500 rounded-2xl flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-h3 text-primary-900 font-poppins">Vítejte v administraci</h2>
            <p className="text-asul16 text-primary-700 mt-1">
              Spravujte obsah svého webu pomocí levého menu
            </p>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 font-poppins">Rychlý přehled</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {quickStats.map((stat) => (
            <Link
              key={stat.title}
              href={stat.href}
              className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 group"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-xl ${stat.color} text-white group-hover:scale-110 transition-transform`}>
                  <stat.icon className="w-5 h-5" />
                </div>
                <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 group-hover:translate-x-1 transition-all" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900 font-poppins">{stat.value}</div>
                <div className="text-sm text-gray-600 font-asul">{stat.description}</div>
                <div className="text-sm font-medium text-gray-700 mt-2 font-poppins">{stat.title}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 font-poppins">Nedávná aktivita</h3>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="divide-y divide-gray-200">
            {recentActivity.map((activity, index) => (
              <div key={index} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start space-x-4">
                  <div className={`p-2 rounded-lg bg-gray-100 ${activity.color}`}>
                    <activity.icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 font-poppins">
                      {activity.action}
                    </p>
                    <p className="text-sm text-gray-600 font-asul mt-1">
                      {activity.item}
                    </p>
                    <p className="text-xs text-gray-400 mt-2">
                      {activity.time}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 font-poppins">Rychlé akce</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/admin/articles/new"
            className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 group text-center"
          >
            <FileText className="w-8 h-8 text-blue-500 mx-auto mb-3 group-hover:scale-110 transition-transform" />
            <div className="text-sm font-medium text-gray-900 font-poppins">Nový článek</div>
            <div className="text-xs text-gray-600 mt-1 font-asul">Vytvořit inspiraci</div>
          </Link>

          <Link
            href="/admin/coaching-packages/new"
            className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 group text-center"
          >
            <Package className="w-8 h-8 text-green-500 mx-auto mb-3 group-hover:scale-110 transition-transform" />
            <div className="text-sm font-medium text-gray-900 font-poppins">Nový balíček</div>
            <div className="text-xs text-gray-600 mt-1 font-asul">Přidat koučovací balíček</div>
          </Link>

          <Link
            href="/admin/workshops/new"
            className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 group text-center"
          >
            <Users className="w-8 h-8 text-purple-500 mx-auto mb-3 group-hover:scale-110 transition-transform" />
            <div className="text-sm font-medium text-gray-900 font-poppins">Nový workshop</div>
            <div className="text-xs text-gray-600 mt-1 font-asul">Vytvořit workshop</div>
          </Link>
        </div>
      </div>
    </div>
  )
}


