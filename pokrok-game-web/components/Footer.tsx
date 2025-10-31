'use client'

import { getBaseUrl } from '@/lib/utils'

export default function Footer() {
  return (
        <footer className="bg-primary-500 relative border-t">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo */}
          <div className="md:col-span-1">
            <div className="w-12 h-12 bg-primary-500 rounded-lg flex items-center justify-center mb-4">
              <span className="text-white font-bold text-xl">H</span>
            </div>
                <p className="text-white text-sm">
                  © 2025 Pokrok
                </p>
          </div>

          {/* About Column */}
          <div className="md:col-span-1">
                <h3 className="text-h4 text-white mb-4">O aplikaci</h3>
                <ul className="space-y-2">
                  <li>
                    <a href="/o-mne" className="text-asul16 text-white hover:text-gray-200 transition-colors">
                      O aplikaci
                    </a>
                  </li>
                  <li>
                    <a href="/materialy" className="text-asul16 text-white hover:text-gray-200 transition-colors">
                      Materiály
                    </a>
                  </li>
                  <li>
                    <a href={`${getBaseUrl()}/muj`} target="_blank" rel="noopener noreferrer" className="text-asul16 text-white hover:text-gray-200 transition-colors">
                      Otevřít aplikaci
                    </a>
                  </li>
                </ul>
          </div>

          {/* Contact Column */}
          <div className="md:col-span-1">
            <h3 className="text-h4 text-white mb-4">Kontakt</h3>
            <ul className="space-y-2">
              <li>
                <a href="mailto:info@pokrok.app" className="text-asul16 text-white hover:text-gray-200 transition-colors">
                  info@pokrok.app
                </a>
              </li>
              <li>
                <a href="/kontakt" className="text-asul16 text-white hover:text-gray-200 transition-colors font-medium">
                  Kontaktujte nás
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  )
}
