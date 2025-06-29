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
      <header className="bg-white shadow-md">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-orange-400 rounded-full flex items-center justify-center">
                  <span className="text-white text-xl">🐕</span>
                </div>
                <Link href="/" className="text-2xl font-bold text-gray-800">
                  {tenantInfo?.name || 'Veterina Svahy'}
                </Link>
              </div>
            </div>

            <nav className="hidden md:flex items-center space-x-8">
              <Link href="/" className="text-gray-700 hover:text-orange-500 font-medium transition-colors">
                Domů
              </Link>
              {session && (
                <>
                  <Link 
                    href="/rezervace" 
                    className="text-green-600 hover:text-green-700 font-medium transition-colors"
                  >
                    Rezervace
                  </Link>
                  
                  {(session.user.role === 'DOCTOR' || session.user.role === 'ADMIN') && (
                    <>
                      <Link 
                        href="/slots" 
                        className="text-green-600 hover:text-green-700 font-medium transition-colors"
                      >
                        Správa slotů
                      </Link>
                      <Link 
                        href="/rezervace/sprava" 
                        className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
                      >
                        Správa rezervací
                      </Link>
                    </>
                  )}
                </>
              )}
            </nav>

            <div className="flex items-center space-x-4">
              {session ? (
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    {session.user?.image && (
                      <img 
                        src={session.user.image} 
                        alt={session.user.name || 'Uživatel'}
                        className="h-8 w-8 rounded-full"
                      />
                    )}
                    <span className="text-sm text-gray-600">
                      {session.user?.name}
                    </span>
                    <span className="text-xs px-2 py-1 rounded bg-green-500 text-white">
                      {session.user.role}
                    </span>
                  </div>
                  <button
                    onClick={handleAuth}
                    className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                  >
                    Odhlásit se
                  </button>
                </div>
              ) : (
                <Link
                  href="/login"
                  className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-md text-sm font-medium transition-colors"
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