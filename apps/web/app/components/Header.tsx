'use client'

import { useSession, signIn, signOut } from 'next-auth/react'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { fetchTenantInfo, getTenantSlugFromUrl, TenantInfo } from '@/lib/tenant'

export default function Header() {
  const { data: session, status } = useSession()
  const [tenantInfo, setTenantInfo] = useState<TenantInfo | null>(null)

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

  const handleAuth = () => {
    if (session) {
      signOut()
    } else {
      signIn('google')
    }
  }

  return (
    <>
      {/* Top contact bar */}
      <div className="bg-orange-400 text-white text-sm py-2">
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
          <div className="flex items-center space-x-2">
            <span>👥</span>
            <span>Facebook</span>
          </div>
        </div>
      </div>

      {/* Main header */}
      <header className="bg-orange-400 shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo a název */}
            <div className="flex items-center space-x-4">
              <Link href="/" className="flex items-center space-x-3">
                <div className="w-16 h-16 rounded-full overflow-hidden shadow-lg">
                  <img 
                    src="/images/veterina-logo.png" 
                    alt="Veterina Svahy Logo" 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="text-white">
                  <h1 className="text-2xl font-bold">
                    {tenantInfo?.name || 'Veterina Svahy'}
                  </h1>
                  <p className="text-orange-100 text-sm">Veterinární ordinace</p>
                </div>
              </Link>
            </div>

            {/* Navigace */}
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
                      <Link 
                        href="/slots" 
                        className="text-white hover:text-orange-100 font-medium transition-colors"
                      >
                        Správa slotů
                      </Link>
                      <Link 
                        href="/rezervace/sprava" 
                        className="text-white hover:text-orange-100 font-medium transition-colors"
                      >
                        Správa rezervací
                      </Link>
                      <Link 
                        href="/ciselnik/ordinace" 
                        className="text-white hover:text-orange-100 font-medium transition-colors"
                      >
                        Číselníky
                      </Link>
                    </>
                  )}
                </>
              )}
            </nav>

            {/* Uživatelské menu */}
            <div className="flex items-center space-x-4">
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
                    className="bg-white text-orange-400 hover:bg-orange-50 px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-md"
                  >
                    Odhlásit se
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
          </div>
        </div>
      </header>
    </>
  )
} 