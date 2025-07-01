import { PrismaClient } from '@prisma/client'
import { TimezoneId, DEFAULT_TIMEZONE, isValidTimezone } from './timezone'

/**
 * Tenant timezone utilities
 */

export interface TenantWithTimezone {
  id: string
  timezone: TimezoneId
  slug: string
  name: string
}

/**
 * Načte tenant s timezone informací
 */
export async function getTenantTimezone(prisma: PrismaClient, tenantId: string): Promise<TimezoneId> {
  try {
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { timezone: true }
    })

    if (!tenant?.timezone) {
      console.warn(`🚨 Tenant ${tenantId} nemá nastavený timezone, používám default: ${DEFAULT_TIMEZONE}`)
      return DEFAULT_TIMEZONE
    }

    if (!isValidTimezone(tenant.timezone)) {
      console.warn(`🚨 Tenant ${tenantId} má neplatný timezone '${tenant.timezone}', používám default: ${DEFAULT_TIMEZONE}`)
      return DEFAULT_TIMEZONE
    }

    return tenant.timezone as TimezoneId
  } catch (error) {
    console.error(`❌ Chyba při načítání timezone pro tenant ${tenantId}:`, error)
    return DEFAULT_TIMEZONE
  }
}

/**
 * Načte tenant s kompletními timezone informacemi
 */
export async function getTenantWithTimezone(prisma: PrismaClient, tenantId: string): Promise<TenantWithTimezone | null> {
  try {
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { 
        id: true,
        timezone: true,
        slug: true,
        name: true
      }
    })

    if (!tenant) {
      return null
    }

    const timezone = isValidTimezone(tenant.timezone) ? tenant.timezone as TimezoneId : DEFAULT_TIMEZONE

    return {
      id: tenant.id,
      timezone,
      slug: tenant.slug,
      name: tenant.name
    }
  } catch (error) {
    console.error(`❌ Chyba při načítání tenanta ${tenantId}:`, error)
    return null
  }
}

/**
 * Cache pro tenant timezone - optimalizace pro opakované dotazy
 */
const tenantTimezoneCache = new Map<string, { timezone: TimezoneId, timestamp: number }>()
const CACHE_TTL = 5 * 60 * 1000 // 5 minut

/**
 * Načte tenant timezone s cachováním
 */
export async function getCachedTenantTimezone(prisma: PrismaClient, tenantId: string): Promise<TimezoneId> {
  const now = Date.now()
  const cached = tenantTimezoneCache.get(tenantId)

  if (cached && (now - cached.timestamp) < CACHE_TTL) {
    return cached.timezone
  }

  const timezone = await getTenantTimezone(prisma, tenantId)
  tenantTimezoneCache.set(tenantId, { timezone, timestamp: now })
  
  return timezone
}

/**
 * Invaliduje cache pro daný tenant
 */
export function invalidateTenantTimezoneCache(tenantId?: string): void {
  if (tenantId) {
    tenantTimezoneCache.delete(tenantId)
  } else {
    tenantTimezoneCache.clear()
  }
} 