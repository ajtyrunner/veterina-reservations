/**
 * Tenant utilities pro multi-tenant architekturu
 */

export interface TenantInfo {
  slug: string
  name: string
  logoUrl?: string
  primaryColor: string
  secondaryColor: string
}

/**
 * Získá slug tenanta z hostname
 */
export function getTenantSlugFromHostname(hostname: string): string {
  // lvh.me development
  if (hostname.includes('lvh.me')) {
    const parts = hostname.split('.')
    const subdomain = parts[0]
    
    // Pokud je to přímo lvh.me nebo www.lvh.me, použij defaultní tenant
    if (subdomain === 'lvh' || subdomain === 'www') {
      return 'svahy'
    }
    
    return subdomain
  }
  
  // Pro localhost fallback
  if (hostname.includes('localhost')) {
    return 'svahy'
  }
  
  // Pro produkční domény
  if (hostname.includes('veterina-svahy.cz')) {
    return 'svahy'
  }
  
  // Default tenant
  return 'svahy'
}

/**
 * Získá slug tenanta z aktuální URL (client-side)
 */
export function getTenantSlugFromUrl(): string {
  if (typeof window !== 'undefined') {
    return getTenantSlugFromHostname(window.location.hostname)
  }
  return 'svahy'
}

/**
 * Získá slug tenanta z headers (server-side)
 */
export function getTenantSlugFromHeaders(headers: Headers): string {
  const host = headers.get('host') || headers.get('x-forwarded-host')
  if (host) {
    return getTenantSlugFromHostname(host)
  }
  return 'svahy'
}

/**
 * Vytvoří URL pro konkrétní tenant
 */
export function createTenantUrl(tenantSlug: string, path: string = ''): string {
  if (typeof window !== 'undefined') {
    const protocol = window.location.protocol
    const port = window.location.port ? `:${window.location.port}` : ''
    
    if (window.location.hostname.includes('lvh.me')) {
      return `${protocol}//${tenantSlug}.lvh.me${port}${path}`
    }
    
    if (window.location.hostname.includes('localhost')) {
      return `${protocol}//localhost${port}${path}`
    }
  }
  
  return path
}

/**
 * Zkontroluje, zda je aktuální request pro správný tenant
 */
export function isValidTenantRequest(expectedSlug: string, actualSlug: string): boolean {
  return expectedSlug === actualSlug
}

/**
 * Cache pro tenant informace
 */
const tenantCache = new Map<string, TenantInfo>()

/**
 * Načte informace o tenantovi z API
 */
export async function fetchTenantInfo(slug: string): Promise<TenantInfo | null> {
  // Zkontroluj cache
  if (tenantCache.has(slug)) {
    return tenantCache.get(slug)!
  }
  
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://lvh.me:4000'
    const response = await fetch(`${apiUrl}/api/public/tenant/${slug}`)
    
    if (response.ok) {
      const data = await response.json()
      const tenantInfo: TenantInfo = {
        slug: data.slug,
        name: data.name,
        logoUrl: data.logoUrl,
        primaryColor: data.primaryColor,
        secondaryColor: data.secondaryColor,
      }
      
      // Ulož do cache
      tenantCache.set(slug, tenantInfo)
      return tenantInfo
    }
  } catch (error) {
    console.error('Chyba při načítání tenant info:', error)
  }
  
  return null
}

/**
 * Vymaže cache pro tenant
 */
export function clearTenantCache(slug?: string) {
  if (slug) {
    tenantCache.delete(slug)
  } else {
    tenantCache.clear()
  }
} 