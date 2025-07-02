import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Cache pro tenant údaje
const tenantContactCache = new Map<string, { defaultEmail: string | null, defaultPhone: string | null }>()

/**
 * Získá email pro uživatele s fallback na tenant default
 */
export async function getUserEmail(userId: string, tenantId: string): Promise<string | null> {
  try {
    // Načti uživatele
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true }
    })

    if (!user) return null

    // Pokud má uživatel email, použij ho
    if (user.email) {
      return user.email
    }

    // Jinak použij tenant default
    const tenantContact = await getTenantContactInfo(tenantId)
    return tenantContact.defaultEmail
  } catch (error) {
    console.error('Chyba při získávání user emailu:', error)
    return null
  }
}

/**
 * Získá telefon pro uživatele s fallback na tenant default
 */
export async function getUserPhone(userId: string, tenantId: string): Promise<string | null> {
  try {
    // Načti uživatele
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { phone: true }
    })

    if (!user) return null

    // Pokud má uživatel phone, použij ho
    if (user.phone) {
      return user.phone
    }

    // Použij tenant default
    const tenantContact = await getTenantContactInfo(tenantId)
    return tenantContact.defaultPhone
  } catch (error) {
    console.error('Chyba při získávání user telefonu:', error)
    return null
  }
}

/**
 * Získá kontaktní údaje pro doktora s fallback na tenant defaults
 */
export async function getDoctorContactInfo(doctorId: string, tenantId: string): Promise<{
  email: string | null
  phone: string | null
}> {
  try {
    // Načti doktora a jeho uživatele
    const doctor = await prisma.doctor.findUnique({
      where: { id: doctorId },
      include: {
        user: {
          select: { 
            id: true,
            email: true,
            phone: true
          }
        }
      }
    })

    if (!doctor) {
      const tenantContact = await getTenantContactInfo(tenantId)
      return {
        email: tenantContact.defaultEmail,
        phone: tenantContact.defaultPhone
      }
    }

    const tenantContact = await getTenantContactInfo(tenantId)

    return {
      email: doctor.user.email || tenantContact.defaultEmail,
      phone: doctor.user.phone || tenantContact.defaultPhone
    }
  } catch (error) {
    console.error('Chyba při získávání doktor kontaktu:', error)
    return { email: null, phone: null }
  }
}

/**
 * Získá tenant kontaktní informace (s cache)
 */
async function getTenantContactInfo(tenantId: string): Promise<{
  defaultEmail: string | null
  defaultPhone: string | null
}> {
  // Zkontroluj cache
  if (tenantContactCache.has(tenantId)) {
    return tenantContactCache.get(tenantId)!
  }

  try {
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { 
        id: true,
        defaultEmail: true,
        defaultPhone: true
      }
    })

    const result = {
      defaultEmail: tenant?.defaultEmail || null,
      defaultPhone: tenant?.defaultPhone || null
    }

    // Cache na 5 minut
    tenantContactCache.set(tenantId, result)
    setTimeout(() => tenantContactCache.delete(tenantId), 5 * 60 * 1000)

    return result
  } catch (error) {
    console.error('Chyba při získávání tenant kontaktu:', error)
    return { defaultEmail: null, defaultPhone: null }
  }
}

/**
 * Vymaže cache pro tenant
 */
export function clearTenantContactCache(tenantId?: string) {
  if (tenantId) {
    tenantContactCache.delete(tenantId)
  } else {
    tenantContactCache.clear()
  }
} 