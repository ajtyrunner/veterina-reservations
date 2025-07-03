/**
 * Frontend timezone utility functions
 * Konfigurovatelné timezone pro každého tenanta
 */

/**
 * Validní timezone identifikátory podle IANA Time Zone Database
 */
export const VALID_TIMEZONES = [
  'Europe/Prague',
  'Europe/Vienna', 
  'Europe/Berlin',
  'Europe/Warsaw',
  'Europe/Budapest',
  'Europe/Rome',
  'Europe/Paris',
  'Europe/London',
  'America/New_York',
  'America/Los_Angeles',
  'Asia/Tokyo',
  'Australia/Sydney',
] as const

export type TimezoneId = typeof VALID_TIMEZONES[number]

/**
 * Defaultní timezone pro fallback
 */
export const DEFAULT_TIMEZONE: TimezoneId = 'Europe/Prague'

/**
 * Validuje timezone identifikátor
 */
export function isValidTimezone(timezone: string): timezone is TimezoneId {
  return VALID_TIMEZONES.includes(timezone as TimezoneId)
}

/**
 * Tenant timezone context - bude načten při inicializaci aplikace
 */
let currentTenantTimezone: TimezoneId = DEFAULT_TIMEZONE

/**
 * Nastaví timezone tenanta pro celou aplikaci
 */
export function setTenantTimezone(timezone: TimezoneId): void {
  if (!isValidTimezone(timezone)) {
    console.warn(`🚨 Neplatný timezone '${timezone}', používám default: ${DEFAULT_TIMEZONE}`)
    currentTenantTimezone = DEFAULT_TIMEZONE
    return
  }
  
  if (process.env.NODE_ENV === 'development') {
    console.log(`🌍 Nastaven tenant timezone: ${timezone}`)
  }
  currentTenantTimezone = timezone
}

/**
 * Získá aktuální timezone tenanta
 */
export function getTenantTimezone(): TimezoneId {
  return currentTenantTimezone
}

/**
 * Převede UTC Date na datetime-local string pro aktuální tenant timezone
 * Vrací formát 'YYYY-MM-DDTHH:mm' pro datetime-local input
 */
export function formatTimezoneDateTime(date: Date, timezone?: TimezoneId): string {
  const tz = timezone || currentTenantTimezone
  
  if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
    throw new Error(`Invalid date: ${date}`)
  }

  // Převedeme UTC čas na target timezone
  const localTime = date.toLocaleString('sv-SE', { 
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  })

  // sv-SE formát je už 'YYYY-MM-DD HH:mm', jen nahradíme mezeru za T
  return localTime.replace(' ', 'T')
}

/**
 * Převede datetime-local string na format pro API (zůstává v local timezone)
 */
export function formatDateTimeForAPI(datetimeStr: string): string {
  // Pro datetime-local formát jen předáme string - API bude parsovat podle tenant timezone
  return datetimeStr
}

/**
 * Získá zítřejší datum v datetime-local formátu pro aktuální timezone
 */
export function getTomorrowDateTime(timezone?: TimezoneId): string {
  const tz = timezone || currentTenantTimezone
  const now = new Date()
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)
  
  // Převedeme na target timezone a nastavíme čas na 10:00
  const tomorrowDateStr = tomorrow.toLocaleDateString('sv-SE', { timeZone: tz })
  
  return `${tomorrowDateStr}T10:00`
}

/**
 * Formátuje čas pro zobrazení
 */
export function formatDisplayTime(date: Date, timezone?: TimezoneId): string {
  const tz = timezone || currentTenantTimezone
  
  return date.toLocaleTimeString('cs-CZ', {
    timeZone: tz,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  })
}

/**
 * Formátuje datum pro zobrazení
 */
export function formatDisplayDate(date: Date, timezone?: TimezoneId): string {
  const tz = timezone || currentTenantTimezone
  
  return date.toLocaleDateString('cs-CZ', {
    timeZone: tz,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

/**
 * Formátuje kompletní datum a čas pro zobrazení
 */
export function formatDisplayDateTime(date: Date, timezone?: TimezoneId): string {
  const tz = timezone || currentTenantTimezone
  
  return date.toLocaleString('cs-CZ', {
    timeZone: tz,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  })
}

/**
 * Získá aktuální den ve formátu YYYY-MM-DD pro daný timezone
 */
export function getTodayDateString(timezone?: TimezoneId): string {
  const tz = timezone || currentTenantTimezone
  const now = new Date()
  
  return now.toLocaleDateString('sv-SE', { timeZone: tz })
}

/**
 * Porovná dva datumy ve stejném dni pro daný timezone
 */
export function isSameDayInTimezone(date1: Date, date2: Date, timezone?: TimezoneId): boolean {
  const tz = timezone || currentTenantTimezone
  
  const day1 = date1.toLocaleDateString('sv-SE', { timeZone: tz })
  const day2 = date2.toLocaleDateString('sv-SE', { timeZone: tz })
  
  return day1 === day2
}

/**
 * Debug logging pro timezone operace
 */
export function logTimezoneDebug(label: string, value: any, timezone?: TimezoneId): void {
  if (process.env.NODE_ENV === 'development') {
    const tz = timezone || currentTenantTimezone
    console.log(`🕐 ${label}:`, value)
    if (value instanceof Date) {
      console.log(`   -> ${tz}: ${value.toLocaleString('cs-CZ', { timeZone: tz })}`)
    }
  }
}

// === LEGACY SUPPORT ===
// Zachováváme kompatibilitu se stávajícím kódem

/**
 * @deprecated Používej formatTimezoneDateTime s explicitním timezone
 */
export function formatDateTimeFromAPI(date: Date): string {
  return formatTimezoneDateTime(date)
} 