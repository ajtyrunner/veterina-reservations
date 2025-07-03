'use client'

import { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { getTenantSlugFromHeaders } from '../../lib/tenant'
import { initializeTenant } from '../../lib/tenant-timezone'

interface Props {
  children: React.ReactNode
}

export function TenantTimezoneInitializer({ children }: Props) {
  const { data: session } = useSession()

  useEffect(() => {
    const initTenant = async () => {
      try {
        // Získáme tenant slug z URL (pro teď použijeme fallback)
        const tenantSlug = 'svahy' // TODO: získat z URL path nebo subdomain

        if (process.env.NODE_ENV === 'development') {
          console.log(`🌍 Inicializuji tenant timezone pro: ${tenantSlug}`)
        }

        // Načteme a aplikujeme tenant konfiguraci
        const tenantInfo = await initializeTenant(tenantSlug)
        
        if (tenantInfo) {
          if (process.env.NODE_ENV === 'development') {
            console.log(`✅ Tenant timezone nastaven: ${tenantInfo.timezone}`)
          }
        } else {
          console.warn(`⚠️ Nepodařilo se načíst tenant info pro: ${tenantSlug}`)
        }
      } catch (error) {
        console.error('❌ Chyba při inicializaci tenant timezone:', error)
      }
    }

    initTenant()
  }, []) // Spustí se pouze jednou při mount

  return <>{children}</>
} 