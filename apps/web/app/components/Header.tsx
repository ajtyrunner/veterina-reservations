'use client'

import { useSession, signIn, signOut } from 'next-auth/react'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { fetchTenantInfo, getTenantSlugFromUrl, TenantInfo } from '@/lib/tenant'

export default function Header() {
  const { data: session, status } = useSession()
  const [tenantInfo, setTenantInfo] = useState<TenantInfo | null>(null)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isSigningOut, setIsSigningOut] = useState(false)
  const mobileMenuRef = useRef<HTMLDivElement>(null)
  const hamburgerButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const loadTenantInfo = async () => {
      // Získej tenant slug z URL (pokud session ještě není k dispozici)
      const tenantSlug = session?.user?.tenant || getTenantSlugFromUrl()
      
      if (tenantSlug) {
        try {
          const info = await fetchTenantInfo(tenantSlug)
          if (info) {
            setTenantInfo(info)
          }
        } catch (error) {
          console.error('Chyba při načítání tenant info:', error)
        }
      }
    }

    loadTenantInfo()
  }, [session])

  // Zavřít mobilní menu při kliknutí mimo nebo ESC
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      
      console.log('Click outside detected')
      
      // Pokud klikneme na hamburger button nebo mobilní menu, nereagujeme
      if (hamburgerButtonRef.current && hamburgerButtonRef.current.contains(target)) {
        console.log('Click was on hamburger button, ignoring')
        return
      }
      
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(target)) {
        console.log('Click was outside menu, closing')
        setIsMobileMenuOpen(false)
      }
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsMobileMenuOpen(false)
      }
    }

    if (isMobileMenuOpen) {
      document.addEventListener('click', handleClickOutside)
      document.addEventListener('keydown', handleEscape)
    }

    return () => {
      document.removeEventListener('click', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isMobileMenuOpen])

  const handleAuth = async () => {
    if (session) {
      console.log('🔄 Zahajuji odhlášení uživatele:', session.user?.name)
      console.log('🔄 Session před odhlášením:', session)
      
      setIsSigningOut(true)
      
      try {
        const result = await signOut({ 
          redirect: false // Neředírektovat automaticky
        })
        console.log('✅ Odhlášení úspěšné:', result)
        
        // Redirect na homepage po úspěšném odhlášení
        window.location.href = '/'
      } catch (error) {
        console.error('❌ Chyba při odhlašování:', error)
        setIsSigningOut(false)
      }
    } else {
      console.log('🔄 Zahajuji přihlášení')
      signIn('google')
    }
  }

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false)
  }

  const handleMenuToggle = (event: React.MouseEvent) => {
    event.preventDefault()
    event.stopPropagation()
    
    console.log('Menu toggle clicked, current state:', isMobileMenuOpen)
    
    // Použít setTimeout pro oddělení od jiných event handlerů
    setTimeout(() => {
      setIsMobileMenuOpen(prev => {
        console.log('Toggling from', prev, 'to', !prev)
        return !prev
      })
    }, 0)
  }

  return (
    <>
      {/* Top contact bar */}
      <div className="bg-orange-400 text-white text-sm py-2 hidden md:block">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <span>📱</span>
              <span>Mobil: 721 049 699</span>
            </div>
            <div className="flex items-center space-x-2">
              <span>✉️</span>
              <span>veterina-svahy@email.cz</span>
            </div>
          </div>
          <a 
            href="https://www.facebook.com/people/Veterina-Svahy/100049515202415/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center space-x-2 hover:text-orange-100 transition-colors"
          >
            <span>👥</span>
            <span>Facebook</span>
          </a>
        </div>
      </div>

      {/* Main header */}
      <header className="bg-orange-400 shadow-lg relative">
        <div className="container mx-auto px-4 py-2 md:py-4">
          <div className="flex items-center justify-between">
            {/* Logo a název */}
            <div className="flex items-center space-x-4">
              <Link href="/" className="flex items-center space-x-3" onClick={closeMobileMenu}>
                <div className="w-12 h-12 md:w-16 md:h-16 rounded-full overflow-hidden shadow-lg">
                  <img 
                    src="/images/veterina-logo.png" 
                    alt="Veterina Svahy Logo" 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="text-white">
                  <h1 className="text-lg md:text-2xl font-bold">
                    {tenantInfo?.name || 'Veterina Svahy'}
                  </h1>
                  <p className="text-orange-100 text-xs md:text-sm hidden sm:block">Veterinární ordinace</p>
                </div>
              </Link>
            </div>

            {/* Desktop navigace */}
            <nav className="hidden lg:flex items-center space-x-8">
              {session && (
                <>
                  <Link href="/" className="text-white hover:text-orange-100 font-medium transition-colors">
                    Rezervovat termín
                  </Link>
                  <Link 
                    href="/rezervace" 
                    className="text-white hover:text-orange-100 font-medium transition-colors"
                  >
                    Moje rezervace
                  </Link>
                  
                  {(session.user.role === 'DOCTOR' || session.user.role === 'ADMIN') && (
                    <>
                      <div className="h-6 border-l border-orange-300"></div>
                      <div className="relative group">
                        <Link 
                          href="/slots" 
                          className="text-white hover:text-orange-100 font-medium transition-colors"
                        >
                          Správa slotů
                        </Link>
                        <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                          <div className="py-2">
                            <Link 
                              href="/slots" 
                              className="block px-4 py-2 text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition-colors"
                            >
                              📋 Přehled slotů
                            </Link>
                            <Link 
                              href="/slots/generovani" 
                              className="block px-4 py-2 text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition-colors"
                            >
                              📅 Generovat sloty
                            </Link>
                          </div>
                        </div>
                      </div>
                      <Link 
                        href="/rezervace/sprava" 
                        className="text-white hover:text-orange-100 font-medium transition-colors"
                      >
                        Správa rezervací
                      </Link>
                      <div className="relative group">
                        <span className="text-white hover:text-orange-100 font-medium transition-colors cursor-pointer">
                          Číselníky
                        </span>
                        <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                          <div className="py-2">
                            <Link 
                              href="/ciselnik/ordinace" 
                              className="block px-4 py-2 text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition-colors"
                            >
                              🏥 Ordinace
                            </Link>
                            <Link 
                              href="/ciselnik/sluzby" 
                              className="block px-4 py-2 text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition-colors"
                            >
                              🩺 Služby
                            </Link>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </>
              )}
            </nav>

            {/* Desktop uživatelské menu */}
            <div className="hidden lg:flex items-center space-x-4">
              {session ? (
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-3 bg-white bg-opacity-20 rounded-lg px-3 py-2">
                    {session.user?.image && (
                      <img 
                        src={session.user.image} 
                        alt={session.user.name || 'Uživatel'}
                        className="h-8 w-8 rounded-full border-2 border-white"
                      />
                    )}
                    <div className="text-white">
                      <div className="text-sm font-medium">
                        {session.user?.name}
                      </div>
                      <div className="text-xs text-orange-100">
                        {session.user.role}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={handleAuth}
                    disabled={isSigningOut}
                    className="bg-white text-orange-400 hover:bg-orange-50 px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSigningOut ? (
                      <span className="flex items-center space-x-2">
                        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>Odhlašuji...</span>
                      </span>
                    ) : (
                      'Odhlásit se'
                    )}
                  </button>
                </div>
              ) : (
                <Link
                  href="/login"
                  className="bg-white text-orange-400 hover:bg-orange-50 px-6 py-2 rounded-lg text-sm font-medium transition-colors shadow-md"
                >
                  {status === 'loading' ? 'Načítám...' : 'Přihlásit se'}
                </Link>
              )}
            </div>

            {/* Mobile hamburger button */}
            <div className="lg:hidden flex items-center space-x-2">
              {/* Mobile user avatar */}
              {session?.user?.image && (
                <img 
                  src={session.user.image} 
                  alt={session.user.name || 'Uživatel'}
                  className="h-8 w-8 rounded-full border-2 border-white"
                />
              )}
              
              <button
                ref={hamburgerButtonRef}
                onClick={handleMenuToggle}
                className="text-white p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
                aria-label={isMobileMenuOpen ? "Zavřít menu" : "Otevřít menu"}
              >
                <svg className={`w-6 h-6 transition-transform duration-200 ${isMobileMenuOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {isMobileMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        <div 
          ref={mobileMenuRef} 
          className={`lg:hidden bg-orange-500 border-t border-orange-300 overflow-hidden transition-all duration-300 ease-in-out ${
            isMobileMenuOpen ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
            <div className="container mx-auto px-4 py-4 space-y-4">
              {session ? (
                <>
                  {/* User info v mobile menu */}
                  <div className="flex items-center space-x-3 bg-white bg-opacity-20 rounded-lg px-3 py-2 mb-4">
                    {session.user?.image && (
                      <img 
                        src={session.user.image} 
                        alt={session.user.name || 'Uživatel'}
                        className="h-10 w-10 rounded-full border-2 border-white"
                      />
                    )}
                    <div className="text-white">
                      <div className="text-sm font-medium">
                        {session.user?.name}
                      </div>
                      <div className="text-xs text-orange-100">
                        {session.user.role}
                      </div>
                    </div>
                  </div>

                  {/* Navigation links */}
                  <div className="space-y-2">
                    <Link 
                      href="/" 
                      className="block text-white hover:text-orange-100 font-medium py-2 px-3 rounded transition-colors"
                      onClick={closeMobileMenu}
                    >
                      🏠 Rezervovat termín
                    </Link>
                    <Link 
                      href="/rezervace" 
                      className="block text-white hover:text-orange-100 font-medium py-2 px-3 rounded transition-colors"
                      onClick={closeMobileMenu}
                    >
                      📅 Moje rezervace
                    </Link>
                    
                    {(session.user.role === 'DOCTOR' || session.user.role === 'ADMIN') && (
                      <>
                        <div className="border-t border-orange-300 my-2"></div>
                        <div className="text-orange-100 text-xs uppercase tracking-wide px-3 py-1">
                          Správa
                        </div>
                        <Link 
                          href="/slots" 
                          className="block text-white hover:text-orange-100 font-medium py-2 px-3 rounded transition-colors"
                          onClick={closeMobileMenu}
                        >
                          🕐 Správa slotů
                        </Link>
                        <Link 
                          href="/slots/generovani" 
                          className="block text-white hover:text-orange-100 font-medium py-2 px-3 rounded transition-colors ml-6"
                          onClick={closeMobileMenu}
                        >
                          📅 Generovat sloty
                        </Link>
                        <Link 
                          href="/rezervace/sprava" 
                          className="block text-white hover:text-orange-100 font-medium py-2 px-3 rounded transition-colors"
                          onClick={closeMobileMenu}
                        >
                          📋 Správa rezervací
                        </Link>
                        <Link 
                          href="/ciselnik/ordinace" 
                          className="block text-white hover:text-orange-100 font-medium py-2 px-3 rounded transition-colors"
                          onClick={closeMobileMenu}
                        >
                          🏥 Ordinace
                        </Link>
                        <Link 
                          href="/ciselnik/sluzby" 
                          className="block text-white hover:text-orange-100 font-medium py-2 px-3 rounded transition-colors"
                          onClick={closeMobileMenu}
                        >
                          🩺 Služby
                        </Link>
                      </>
                    )}
                  </div>

                  <div className="border-t border-orange-300 pt-4">
                    <button
                      onClick={() => {
                        handleAuth()
                        closeMobileMenu()
                      }}
                      disabled={isSigningOut}
                      className="w-full bg-white text-orange-400 hover:bg-orange-50 px-4 py-3 rounded-lg text-sm font-medium transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSigningOut ? (
                        <span className="flex items-center justify-center space-x-2">
                          <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <span>Odhlašuji...</span>
                        </span>
                      ) : (
                        'Odhlásit se'
                      )}
                    </button>
                  </div>
                </>
              ) : (
                <Link
                  href="/login"
                  onClick={closeMobileMenu}
                  className="block w-full bg-white text-orange-400 hover:bg-orange-50 px-6 py-3 rounded-lg text-sm font-medium transition-colors shadow-md text-center"
                >
                  {status === 'loading' ? 'Načítám...' : 'Přihlásit se'}
                </Link>
              )}
            </div>
        </div>
      </header>
    </>
  )
} 