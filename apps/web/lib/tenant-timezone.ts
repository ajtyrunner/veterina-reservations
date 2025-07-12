/**
 * Tenant timezone management pro frontend
 */

import { TimezoneId, DEFAULT_TIMEZONE, isValidTimezone, setTenantTimezone } from './timezone'

export interface TenantInfo {
  id: string
  slug: string
  name: string
  timezone: TimezoneId
  logoUrl?: string
  primaryColor?: string
  secondaryColor?: string
}

/**
 * Načte informace o tenantovi včetně timezone z API
 */
export async function loadTenantInfo(tenantSlug: string): Promise<TenantInfo | null> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/public/tenant/${tenantSlug}`)
    
    if (!response.ok) {
      console.error(`❌ Tenant '${tenantSlug}' nenalezen`)
      return null
    }

    const tenantData = await response.json()
    
    // Validujeme timezone
    const timezone = isValidTimezone(tenantData.timezone) 
      ? tenantData.timezone as TimezoneId 
      : DEFAULT_TIMEZONE
    
    if (tenantData.timezone && !isValidTimezone(tenantData.timezone)) {
      console.warn(`🚨 Tenant má neplatný timezone '${tenantData.timezone}', používám default: ${DEFAULT_TIMEZONE}`)
    }

    const tenantInfo: TenantInfo = {
      id: tenantData.id,
      slug: tenantData.slug,
      name: tenantData.name,
      timezone,
      logoUrl: tenantData.logoUrl,
      primaryColor: tenantData.primaryColor,
      secondaryColor: tenantData.secondaryColor
    }

    // Nastavíme globální timezone pro aplikaci
    setTenantTimezone(timezone)
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`🌍 Načten tenant timezone: ${timezone} pro ${tenantData.name}`)
    }
    
    return tenantInfo

  } catch (error) {
    console.error('❌ Chyba při načítání tenant info:', error)
    return null
  }
}

/**
 * Načte timezone z NextAuth session (pokud je dostupný)
 */
export async function loadTenantTimezoneFromSession(): Promise<TimezoneId> {
  try {
    // V budoucnu můžeme mít timezone v session
    // Pro teď vracíme default
    return DEFAULT_TIMEZONE
  } catch (error) {
    console.error('❌ Chyba při načítání timezone ze session:', error)
    return DEFAULT_TIMEZONE
  }
}

/**
 * Aplikuje tenant branding podle načtených informací
 */
export function applyTenantBranding(tenantInfo: TenantInfo): void {
  try {
    // Nastavení CSS proměnných pro theming
    if (tenantInfo.primaryColor) {
      document.documentElement.style.setProperty('--color-primary', tenantInfo.primaryColor)
    }
    
    if (tenantInfo.secondaryColor) {
      document.documentElement.style.setProperty('--color-secondary', tenantInfo.secondaryColor)
    }

    // Nastavení title
    document.title = `${tenantInfo.name} - Rezervační systém`

  } catch (error) {
    console.error('❌ Chyba při aplikování tenant brandingu:', error)
  }
}

/**
 * Načte a aplikuje kompletní tenant konfiguraci
 */
export async function initializeTenant(tenantSlug: string): Promise<TenantInfo | null> {
  if (process.env.NODE_ENV === 'development') {
    console.log('🌍 Inicializuji tenant timezone pro:', tenantSlug)
  }
  
  const tenantInfo = await loadTenantInfo(tenantSlug)
  
  if (tenantInfo) {
    applyTenantBranding(tenantInfo)
  }
  
  return tenantInfo
}

export async function initializeTenantTimezone(tenantSlug: string) {
  if (process.env.NODE_ENV === 'development') {
    console.log('🌍 Inicializuji tenant timezone pro:', tenantSlug)
  }
  
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://veterina-reservations-production.up.railway.app';
    const response = await fetch(`${apiUrl}/api/public/tenant/${tenantSlug}`)
    if (!response.ok) {
      throw new Error(`Failed to fetch tenant info: ${response.status}`)
    }
    
    const tenant = await response.json()
    const timezone = tenant.timezone || 'Europe/Prague'
    
    if (process.env.NODE_ENV === 'development') {
      console.log('🌍 Nastaven tenant timezone:', timezone)
    }
    
    return timezone
  } catch (error) {
    console.error('Chyba při načítání tenant timezone:', error)
    return 'Europe/Prague' // Fallback na Prague timezone
  }
} 