'use client'

import Link from 'next/link'

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Hlavní info */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <span className="text-2xl">🏥</span>
              <h3 className="text-xl font-bold text-orange-400">Slotito</h3>
            </div>
            <p className="text-gray-300 text-sm leading-relaxed">
              Inteligentní rezervační systém pro efektivní správu termínů. 
              Rezervujte si čas rychle a jednoduše.
            </p>
            <div className="flex space-x-4">
              <a 
                href="mailto:koppito.solutions@gmail.com" 
                className="text-gray-400 hover:text-orange-400 transition-colors"
                title="Email"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"/>
                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Rychlé odkazy */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-orange-400">Rychlé odkazy</h4>
            <nav className="space-y-2">
              <Link 
                href="/" 
                className="block text-gray-300 hover:text-white transition-colors text-sm"
              >
                🏠 Domů
              </Link>
              <Link 
                href="/rezervace" 
                className="block text-gray-300 hover:text-white transition-colors text-sm"
              >
                📅 Rezervace
              </Link>
              <Link 
                href="/jak-to-funguje" 
                className="block text-gray-300 hover:text-white transition-colors text-sm"
              >
                ❓ Jak to funguje
              </Link>
              <Link 
                href="/login" 
                className="block text-gray-300 hover:text-white transition-colors text-sm"
              >
                🔐 Přihlášení
              </Link>
            </nav>
          </div>

          {/* Služby */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-orange-400">Naše služby</h4>
            <div className="space-y-2 text-sm text-gray-300">
              <div className="flex items-center space-x-2">
                <span>🔍</span>
                <span>Základní vyšetření</span>
              </div>
              <div className="flex items-center space-x-2">
                <span>💉</span>
                <span>Očkování</span>
              </div>
              <div className="flex items-center space-x-2">
                <span>🏥</span>
                <span>Chirurgické zákroky</span>
              </div>
              <div className="flex items-center space-x-2">
                <span>📸</span>
                <span>RTG vyšetření</span>
              </div>
              <div className="flex items-center space-x-2">
                <span>🦷</span>
                <span>Dentální péče</span>
              </div>
            </div>
          </div>

          {/* Kontakt */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-orange-400">Kontakt</h4>
            <div className="space-y-3 text-sm text-gray-300">
              <div className="flex items-start space-x-2">
                <svg className="w-4 h-4 mt-0.5 text-orange-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"/>
                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"/>
                </svg>
                <div>
                  <a 
                    href="mailto:koppito.solutions@gmail.com" 
                    className="hover:text-white transition-colors"
                  >
                    koppito.solutions@gmail.com
                  </a>
                </div>
              </div>
              
              <div className="flex items-start space-x-2">
                <svg className="w-4 h-4 mt-0.5 text-orange-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"/>
                </svg>
                <div>
                  <span>Zlín, Česká republika</span>
                </div>
              </div>

              <div className="flex items-start space-x-2">
                <svg className="w-4 h-4 mt-0.5 text-orange-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd"/>
                </svg>
                <div>
                  <div>Systém dostupný 24/7</div>
                  <div>Rezervace kdykoliv online</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Spodní část */}
        <div className="border-t border-gray-700 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="text-sm text-gray-400">
              © {currentYear} Slotito. Všechna práva vyhrazena.
            </div>
            
            <div className="flex items-center space-x-6 text-sm text-gray-400">
              <Link 
                href="/privacy" 
                className="hover:text-white transition-colors"
              >
                Ochrana osobních údajů
              </Link>
              <Link 
                href="/terms" 
                className="hover:text-white transition-colors"
              >
                Obchodní podmínky
              </Link>
              <div className="flex items-center space-x-1">
                <span>Vytvořeno s</span>
                <span className="text-red-400">❤️</span>
                <span>pomocí</span>
                <a 
                  href="mailto:koppito.solutions@gmail.com"
                  className="text-orange-400 hover:text-orange-300 transition-colors font-medium"
                >
                  Koppito Solutions
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
} 