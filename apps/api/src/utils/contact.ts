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

/**
 * Normalizuje české telefonní číslo do formátu +420 777 456 789
 */
export function normalizePhoneNumber(phone: string): string {
  if (!phone) return ''
  
  // Odstraníme všechny mezery, pomlčky a závorky
  let cleaned = phone.replace(/[\s\-\(\)]/g, '')
  
  // Odstraníme případný + na začátku
  if (cleaned.startsWith('+')) {
    cleaned = cleaned.substring(1)
  }
  
  // Pokud číslo začíná 420, je už v mezinárodním formátu
  if (cleaned.startsWith('420') && cleaned.length === 12) {
    // Formátujeme: 420777456789 -> +420 777 456 789
    return `+420 ${cleaned.substring(3, 6)} ${cleaned.substring(6, 9)} ${cleaned.substring(9, 12)}`
  }
  
  // Pokud číslo začíná 00420, odstraníme 00
  if (cleaned.startsWith('00420') && cleaned.length === 14) {
    cleaned = cleaned.substring(2) // Odstraní 00
    return `+420 ${cleaned.substring(3, 6)} ${cleaned.substring(6, 9)} ${cleaned.substring(9, 12)}`
  }
  
  // Pokud je to české číslo bez předvolby (9 číslic)
  if (cleaned.length === 9 && /^[67]/.test(cleaned)) {
    // Formátujeme: 777456789 -> +420 777 456 789
    return `+420 ${cleaned.substring(0, 3)} ${cleaned.substring(3, 6)} ${cleaned.substring(6, 9)}`
  }
  
  // Pokud začíná 0 a má 10 číslic (klasický český formát)
  if (cleaned.startsWith('0') && cleaned.length === 10) {
    // Odstraníme 0 a přidáme +420: 0777456789 -> +420 777 456 789
    cleaned = cleaned.substring(1)
    return `+420 ${cleaned.substring(0, 3)} ${cleaned.substring(3, 6)} ${cleaned.substring(6, 9)}`
  }
  
  // Pro ostatní mezinárodní čísla nebo nerozpoznané formáty vrátíme původní
  return phone.trim()
} 