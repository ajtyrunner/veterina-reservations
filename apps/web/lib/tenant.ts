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
  // Extrakce subdomény z hostname
  const parts = hostname.split('.')
  const subdomain = parts[0]
  
  // Pokud je subdoména platná (ne www, ne prázdná), použij ji
  if (subdomain && subdomain !== 'www' && subdomain !== 'localhost') {
    // Pro hlavní doménu (např. example.com) vrať null nebo speciální hodnotu
    if (parts.length === 2 || (parts.length === 3 && subdomain === 'www')) {
      return 'default' // Nebo můžete vrátit null a řešit to v aplikaci
    }
    return subdomain
  }
  
  // Pro localhost nebo když nelze určit tenant
  return 'default'
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