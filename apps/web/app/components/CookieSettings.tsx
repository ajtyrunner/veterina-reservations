'use client'

import { useState, useEffect } from 'react'
import { GA_TRACKING_ID, updateConsent } from '../../lib/analytics'

interface CookiePreferences {
  necessary: boolean
  analytics: boolean
  marketing: boolean
}

export default function CookieSettings() {
  const [preferences, setPreferences] = useState<CookiePreferences>({
    necessary: true,
    analytics: false,
    marketing: false,
  })
  const [consentDate, setConsentDate] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Načti uložené preference
    const consent = localStorage.getItem('cookie-consent')
    const consentDateStr = localStorage.getItem('cookie-consent-date')
    
    if (consent) {
      setPreferences(JSON.parse(consent))
    }
    
    if (consentDateStr) {
      setConsentDate(new Date(consentDateStr).toLocaleString('cs-CZ'))
    }
    
    setIsLoading(false)
  }, [])

  const handleSave = () => {
    localStorage.setItem('cookie-consent', JSON.stringify(preferences))
    localStorage.setItem('cookie-consent-date', new Date().toISOString())
    
    // Aktualizuj Google Analytics consent
    updateConsent(preferences.analytics)
    
    setConsentDate(new Date().toLocaleString('cs-CZ'))
    
    // Zobraz potvrzení
    alert('Nastavení cookies bylo uloženo!')
  }

  const handleReset = () => {
    if (confirm('Opravdu chcete smazat všechna nastavení cookies? Budete znovu požádáni o souhlas.')) {
      localStorage.removeItem('cookie-consent')
      localStorage.removeItem('cookie-consent-date')
      
      // Resetuj na výchozí
      setPreferences({
        necessary: true,
        analytics: false,
        marketing: false,
      })
      setConsentDate('')
      
      // Resetuj Google Analytics
      updateConsent(false)
      
      alert('Nastavení cookies bylo resetováno!')
    }
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">
        Nastavení cookies
      </h2>

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
          <p className="text-sm text-gray-600 mb-2">
            Tyto cookies jsou nezbytné pro základní funkčnost webu a nelze je vypnout.
          </p>
          <div className="text-xs text-gray-500">
            <strong>Zahrnuje:</strong> Přihlašovací tokeny, bezpečnostní tokeny, nastavení cookies
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
                onChange={(e) => setPreferences(prev => ({ ...prev, analytics: e.target.checked }))}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
            </label>
          </div>
          <p className="text-sm text-gray-600 mb-2">
            Pomáhají nám pochopit, jak návštěvníci používají náš web.
          </p>
          <div className="text-xs text-gray-500">
            <strong>Poskytovatel:</strong> Google Analytics<br/>
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
            Momentálně nepoužíváme žádné marketingové cookies.
          </p>
        </div>
      </div>

      {/* Informace o souhlasu */}
      {consentDate && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-2">Informace o souhlasu</h4>
          <p className="text-sm text-gray-600">
            Poslední aktualizace: {consentDate}
          </p>
        </div>
      )}

      {/* Akce */}
      <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-200">
        <button
          onClick={handleReset}
          className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-md hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
        >
          Resetovat nastavení
        </button>
        
        <button
          onClick={handleSave}
          className="px-6 py-2 text-sm font-medium text-white bg-orange-600 border border-transparent rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
        >
          Uložit změny
        </button>
      </div>

      {/* Odkazy */}
      <div className="mt-4 text-center">
        <p className="text-xs text-gray-500">
          Více informací najdete v našich{' '}
          <a href="/privacy" className="text-orange-600 hover:text-orange-700 underline">
            zásadách ochrany osobních údajů
          </a>
        </p>
      </div>
    </div>
  )
} 