'use client'

import { useSession, signIn, signOut } from 'next-auth/react'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useContent } from '../../lib/content-context'

export default function HeaderWithContent() {
  const { data: session, status } = useSession()
  const { content, loading: contentLoading, t, colors } = useContent()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isSigningOut, setIsSigningOut] = useState(false)
  const mobileMenuRef = useRef<HTMLDivElement>(null)
  const hamburgerButtonRef = useRef<HTMLButtonElement>(null)

  // Zavřít mobilní menu při kliknutí mimo nebo ESC
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      
      if (hamburgerButtonRef.current && hamburgerButtonRef.current.contains(target)) {
        return
      }
      
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(target)) {
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
      setIsSigningOut(true)
      
      try {
        await signOut({ redirect: false })
        window.location.href = '/'
      } catch (error) {
        console.error('❌ Chyba při odhlašování:', error)
        setIsSigningOut(false)
      }
    } else {
      signIn('google')
    }
  }

  const handleMenuToggle = (event: React.MouseEvent) => {
    event.preventDefault()
    event.stopPropagation()
    
    setTimeout(() => {
      setIsMobileMenuOpen(prev => !prev)
    }, 0)
  }

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false)
  }

  // Dynamické styly založené na content colors
  const headerStyle = {
    backgroundColor: colors.primary
  }

  const topBarStyle = {
    backgroundColor: colors.primary,
    filter: 'brightness(0.9)'
  }

  const buttonStyle = {
    backgroundColor: 'white',
    color: colors.primary
  }

  const hoverButtonStyle = {
    backgroundColor: colors.background,
    color: colors.primary
  }

  if (contentLoading) {
    return <div className="h-20 bg-gray-200 animate-pulse" />
  }

  return (
    <>
      {/* Top contact bar */}
      {content?.customContent?.contact && (
        <div className="text-white text-sm py-2 hidden md:block" style={topBarStyle}>
          <div className="container mx-auto px-4 flex justify-between items-center">
            <div className="flex items-center space-x-6">
              {content.customContent.contact.phone && (
                <div className="flex items-center space-x-2">
                  <span>📱</span>
                  <span>{content.customContent.contact.phone}</span>
                </div>
              )}
              {content.customContent.contact.email && (
                <div className="flex items-center space-x-2">
                  <span>✉️</span>
                  <span>{content.customContent.contact.email}</span>
                </div>
              )}
            </div>
            {content.customContent.social?.facebook && (
              <a 
                href={content.customContent.social.facebook}
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
              >
                <span>👥</span>
                <span>Facebook</span>
              </a>
            )}
          </div>
        </div>
      )}

      {/* Main header */}
      <header className="shadow-lg relative" style={headerStyle}>
        <div className="container mx-auto px-4 py-2 md:py-4">
          <div className="flex items-center justify-between">
            {/* Logo a název */}
            <div className="flex items-center space-x-4">
              <Link href="/" className="flex items-center space-x-3" onClick={closeMobileMenu}>
                <div className="w-12 h-12 md:w-16 md:h-16 rounded-full overflow-hidden shadow-lg bg-white/95 backdrop-blur-sm flex items-center justify-center">
                  {content?.customContent?.branding?.logoUrl ? (
                    <img 
                      src={content.customContent.branding.logoUrl} 
                      alt={content.customContent.branding.logoAlt || content?.name || 'Logo'}
                      className="w-full h-full object-contain p-2"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                  ) : null}
                  <span className={`text-2xl ${content?.customContent?.branding?.logoUrl ? 'hidden' : ''}`}>
                    {content?.slug === 'agility-nikol' ? '🐕' : '🏥'}
                  </span>
                </div>
                <div className="text-white">
                  <h1 className="text-lg md:text-2xl font-bold">
                    {t('app_name', content?.name || 'Rezervační systém')}
                  </h1>
                  <p className="text-xs md:text-sm hidden sm:block opacity-90">
                    {content?.slug === 'agility-nikol' ? 'Tréninky a pasení' : 'Online rezervace'}
                  </p>
                </div>
              </Link>
            </div>

            {/* Desktop navigace */}
            <nav className="hidden lg:flex items-center space-x-8">
              {session && (
                <>
                  <Link href="/" className="text-white hover:opacity-80 font-medium transition-opacity">
                    {t('book_appointment', t('book_training', 'Rezervovat termín'))}
                  </Link>
                  <Link 
                    href="/rezervace" 
                    className="text-white hover:opacity-80 font-medium transition-opacity"
                  >
                    {t('view_appointments', t('view_trainings', 'Moje rezervace'))}
                  </Link>
                  
                  {(session.user.role === 'DOCTOR' || session.user.role === 'ADMIN') && (
                    <>
                      <div className="h-6 border-l border-white opacity-30"></div>
                      <div className="relative group">
                        <Link 
                          href="/slots" 
                          className="text-white hover:opacity-80 font-medium transition-opacity"
                        >
                          Správa {t('SLOT', 'termínů').toLowerCase()}
                        </Link>
                        <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                          <div className="py-2">
                            <Link 
                              href="/slots" 
                              className="block px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors"
                                                          >
                              📋 Přehled {t('SLOT', 'termínů').toLowerCase()}
                            </Link>
                            <Link 
                              href="/slots/generovani" 
                              className="block px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors"
                                                          >
                              📅 Generovat {t('SLOT', 'termíny').toLowerCase()}
                            </Link>
                          </div>
                        </div>
                      </div>
                      <Link 
                        href="/rezervace/sprava" 
                        className="text-white hover:opacity-80 font-medium transition-opacity"
                      >
                        Správa {t('RESERVATION', 'rezervací').toLowerCase()}
                      </Link>
                      <div className="relative group">
                        <span className="text-white hover:opacity-80 font-medium transition-opacity cursor-pointer">
                          Číselníky
                        </span>
                        <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                          <div className="py-2">
                            <Link 
                              href="/ciselnik/ordinace" 
                              className="block px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                              🏥 {content?.slug === 'agility-nikol' ? 'Tréninková místa' : 'Ordinace'}
                            </Link>
                            <Link 
                              href="/ciselnik/sluzby" 
                              className="block px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                              🩺 Služby
                            </Link>
                          </div>
                        </div>
                      </div>
                      {session.user.role === 'ADMIN' && (
                        <>
                          <div className="h-6 border-l border-white opacity-30"></div>
                          <div className="relative group">
                            <span className="text-white hover:opacity-80 font-medium transition-opacity cursor-pointer">
                              Admin
                            </span>
                            <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                              <div className="py-2">
                                <Link 
                                  href="/admin/doctors" 
                                  className="block px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors"
                                >
                                  👨‍⚕️ Správa {t('STAFF_PLURAL', 'doktorů').toLowerCase()}
                                </Link>
                              </div>
                            </div>
                          </div>
                        </>
                      )}
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
                      <div className="text-xs opacity-90">
                        {session.user.role === 'DOCTOR' ? t('STAFF', 'Doktor') : 
                         session.user.role === 'CLIENT' ? t('CLIENT', 'Klient') : 
                         t('ADMIN', 'Admin')}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={handleAuth}
                    disabled={isSigningOut}
                    className="px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90"
                    style={buttonStyle}
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
                  className="px-6 py-2 rounded-lg text-sm font-medium transition-colors shadow-md hover:opacity-90"
                  style={buttonStyle}
                >
                  {status === 'loading' ? 'Načítám...' : 'Přihlásit se'}
                </Link>
              )}
            </div>

            {/* Mobile hamburger button */}
            <div className="lg:hidden flex items-center space-x-2">
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
          className={`lg:hidden border-t border-white border-opacity-20 overflow-hidden transition-all duration-300 ease-in-out ${
            isMobileMenuOpen ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'
          }`}
          style={{ backgroundColor: colors.primary, filter: 'brightness(1.1)' }}
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
                    <div className="text-xs opacity-90">
                      {session.user.role === 'DOCTOR' ? t('STAFF', 'Doktor') : 
                       session.user.role === 'CLIENT' ? t('CLIENT', 'Klient') : 
                       t('ADMIN', 'Admin')}
                    </div>
                  </div>
                </div>

                {/* Navigation links */}
                <div className="space-y-2">
                  <Link 
                    href="/" 
                    className="block text-white hover:opacity-80 font-medium py-2 px-3 rounded transition-opacity"
                    onClick={closeMobileMenu}
                  >
                    🏠 {t('book_appointment', t('book_training', 'Rezervovat termín'))}
                  </Link>
                  <Link 
                    href="/rezervace" 
                    className="block text-white hover:opacity-80 font-medium py-2 px-3 rounded transition-opacity"
                    onClick={closeMobileMenu}
                  >
                    📅 {t('view_appointments', t('view_trainings', 'Moje rezervace'))}
                  </Link>
                  
                  {(session.user.role === 'DOCTOR' || session.user.role === 'ADMIN') && (
                    <>
                      <div className="border-t border-white opacity-20 my-2"></div>
                      <div className="text-white opacity-70 text-xs uppercase tracking-wide px-3 py-1">
                        Správa
                      </div>
                      <Link 
                        href="/slots" 
                        className="block text-white hover:opacity-80 font-medium py-2 px-3 rounded transition-opacity"
                        onClick={closeMobileMenu}
                      >
                        🕐 Správa {t('SLOT', 'termínů').toLowerCase()}
                      </Link>
                      <Link 
                        href="/slots/generovani" 
                        className="block text-white hover:opacity-80 font-medium py-2 px-3 rounded transition-opacity ml-6"
                        onClick={closeMobileMenu}
                      >
                        📅 Generovat {t('SLOT', 'termíny').toLowerCase()}
                      </Link>
                      <Link 
                        href="/rezervace/sprava" 
                        className="block text-white hover:opacity-80 font-medium py-2 px-3 rounded transition-opacity"
                        onClick={closeMobileMenu}
                      >
                        📋 Správa {t('RESERVATION', 'rezervací').toLowerCase()}
                      </Link>
                      <Link 
                        href="/ciselnik/ordinace" 
                        className="block text-white hover:opacity-80 font-medium py-2 px-3 rounded transition-opacity"
                        onClick={closeMobileMenu}
                      >
                        🏥 {content?.slug === 'agility-nikol' ? 'Tréninková místa' : 'Ordinace'}
                      </Link>
                      <Link 
                        href="/ciselnik/sluzby" 
                        className="block text-white hover:opacity-80 font-medium py-2 px-3 rounded transition-opacity"
                        onClick={closeMobileMenu}
                      >
                        🩺 Služby
                      </Link>
                      {session.user.role === 'ADMIN' && (
                        <>
                          <div className="border-t border-white opacity-20 my-2"></div>
                          <div className="text-white opacity-70 text-xs uppercase tracking-wide px-3 py-1">
                            Admin
                          </div>
                          <Link 
                            href="/admin/doctors" 
                            className="block text-white hover:opacity-80 font-medium py-2 px-3 rounded transition-opacity"
                            onClick={closeMobileMenu}
                          >
                            👨‍⚕️ Správa {t('STAFF_PLURAL', 'doktorů').toLowerCase()}
                          </Link>
                        </>
                      )}
                    </>
                  )}
                </div>

                <div className="border-t border-white opacity-20 pt-4">
                  <button
                    onClick={() => {
                      handleAuth()
                      closeMobileMenu()
                    }}
                    disabled={isSigningOut}
                    className="w-full px-4 py-3 rounded-lg text-sm font-medium transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90"
                    style={buttonStyle}
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
                className="block w-full px-6 py-3 rounded-lg text-sm font-medium transition-colors shadow-md text-center hover:opacity-90"
                style={buttonStyle}
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