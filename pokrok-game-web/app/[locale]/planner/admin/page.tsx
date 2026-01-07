'use client'

import { useState } from 'react'
import { AdminTipsView } from '../components/admin/AdminTipsView'
import { AdminHelpView } from '../components/admin/AdminHelpView'

type TabKey = 'tips' | 'help'

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('tips')

  return (
    <div className="w-full h-full bg-primary-50 p-4">
      <div className="max-w-7xl mx-auto h-full flex flex-col">
        {/* Tabs */}
        <div className="flex items-center gap-2 border-b-2 border-primary-500 mb-4">
          <button
            className={`px-4 py-2 font-semibold ${activeTab === 'tips' ? 'text-primary-700 border-b-4 border-primary-500' : 'text-gray-600'}`}
            onClick={() => setActiveTab('tips')}
          >
            Tips
          </button>
          <button
            className={`px-4 py-2 font-semibold ${activeTab === 'help' ? 'text-primary-700 border-b-4 border-primary-500' : 'text-gray-600'}`}
            onClick={() => setActiveTab('help')}
          >
            Help
          </button>
        </div>

        <div className="flex-1 min-h-0">
          {activeTab === 'tips' ? <AdminTipsView /> : <AdminHelpView />}
        </div>
      </div>
    </div>
  )
}


