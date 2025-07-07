'use client'

import { useState, useEffect } from 'react'
import { GA_TRACKING_ID, updateConsent } from '../../lib/analytics'

interface CookiePreferences {
  necessary: boolean
  analytics: boolean
  marketing: boolean
}

export default function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false)
  const [showPreferences, setShowPreferences] = useState(false)
  const [preferences, setPreferences] = useState<CookiePreferences>({
    necessary: true, // Vždy povolené
    analytics: false,
    marketing: false,
  })

  useEffect(() => {
    // Zkontroluj, zda už uživatel dal souhlas
    const consent = localStorage.getItem('cookie-consent')
    if (!consent) {
      setShowBanner(true)
    } else {
      const savedPreferences = JSON.parse(consent)
      setPreferences(savedPreferences)
      
      // Aktivuj Google Analytics pouze pokud je povoleno
      if (savedPreferences.analytics) {
        updateConsent(true)
      }
    }
  }, [])

  const handleAcceptAll = () => {
    const newPreferences = {
      necessary: true,
      analytics: true,
      marketing: false, // Nepoužíváme marketing cookies
    }
    
    setPreferences(newPreferences)
    localStorage.setItem('cookie-consent', JSON.stringify(newPreferences))
    localStorage.setItem('cookie-consent-date', new Date().toISOString())
    
    updateConsent(true)
    setShowBanner(false)
  }

  const handleRejectAll = () => {
    const newPreferences = {
      necessary: true,
      analytics: false,
      marketing: false,
    }
    
    setPreferences(newPreferences)
    localStorage.setItem('cookie-consent', JSON.stringify(newPreferences))
    localStorage.setItem('cookie-consent-date', new Date().toISOString())
    
    updateConsent(false)
    setShowBanner(false)
  }

  const handleSavePreferences = () => {
    localStorage.setItem('cookie-consent', JSON.stringify(preferences))
    localStorage.setItem('cookie-consent-date', new Date().toISOString())
    
    updateConsent(preferences.analytics)
    
    setShowBanner(false)
    setShowPreferences(false)
  }

  const handlePreferenceChange = (type: keyof CookiePreferences, value: boolean) => {
    if (type === 'necessary') return // Nelze vypnout nutné cookies
    
    setPreferences(prev => ({
      ...prev,
      [type]: value
    }))
  }

  if (!showBanner) return null

  return (
    <>
      {/* Cookie Banner */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Používáme cookies
              </h3>
              <p className="text-sm text-gray-600 max-w-3xl">
                Tento web používá cookies pro zajištění základní funkčnosti a analytické cookies 
                pro zlepšení uživatelského zážitku. Analytické cookies nám pomáhají pochopit, 
                jak návštěvníci používají náš web. Více informací najdete v našich{' '}
                <a href="/privacy" className="text-orange-600 hover:text-orange-700 underline">
                  zásadách ochrany osobních údajů
                </a>.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2 lg:ml-4">
              <button
                onClick={handleRejectAll}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                Odmítnout vše
              </button>
              
              <button
                onClick={() => setShowPreferences(true)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
              >
                Nastavit preference
              </button>
              
              <button
                onClick={handleAcceptAll}
                className="px-4 py-2 text-sm font-medium text-white bg-orange-600 border border-transparent rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
              >
                Přijmout vše
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Preferences Modal */}
      {showPreferences && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  Nastavení cookies
                </h2>
                <button
                  onClick={() => setShowPreferences(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-6">
                {/* Nutné cookies */}
                <div className="border-b border-gray-200 pb-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-medium text-gray-900">
                      Nutné cookies
                    </h3>
                    <div className="bg-gray-100 px-3 py-1 rounded-full text-sm text-gray-600">
                      Vždy aktivní
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">
                    Tyto cookies jsou nezbytné pro základní funkčnost webu, jako je přihlašování, 
                    bezpečnost a uchování vašich preferencí. Nelze je vypnout.
                  </p>
                  <div className="mt-2 text-xs text-gray-500">
                    <strong>Ukládáme:</strong> Přihlašovací tokeny, jazykové preference, 
                    bezpečnostní tokeny, nastavení cookies
                  </div>
                </div>

                {/* Analytické cookies */}
                <div className="border-b border-gray-200 pb-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-medium text-gray-900">
                      Analytické cookies
                    </h3>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={preferences.analytics}
                        onChange={(e) => handlePreferenceChange('analytics', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
                    </label>
                  </div>
                  <p className="text-sm text-gray-600">
                    Pomáhají nám pochopit, jak návštěvníci používají náš web, abychom mohli 
                    zlepšit uživatelský zážitek. Data jsou anonymní.
                  </p>
                  <div className="mt-2 text-xs text-gray-500">
                    <strong>Poskytovatel:</strong> Google Analytics (Google LLC)<br/>
                    <strong>Účel:</strong> Analýza návštěvnosti, chování uživatelů<br/>
                    <strong>Doba uchování:</strong> 26 měsíců<br/>
                    <strong>Tracking ID:</strong> {GA_TRACKING_ID}
                  </div>
                </div>

                {/* Marketingové cookies */}
                <div className="pb-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-medium text-gray-900">
                      Marketingové cookies
                    </h3>
                    <div className="bg-gray-100 px-3 py-1 rounded-full text-sm text-gray-600">
                      Nepoužíváme
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">
                    Momentálně nepoužíváme žádné marketingové nebo reklamní cookies.
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
                <button
                  onClick={() => setShowPreferences(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                >
                  Zrušit
                </button>
                <button
                  onClick={handleSavePreferences}
                  className="px-4 py-2 text-sm font-medium text-white bg-orange-600 border border-transparent rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                >
                  Uložit preference
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
} 