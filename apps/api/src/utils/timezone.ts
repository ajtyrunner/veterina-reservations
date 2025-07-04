/**
 * Timezone utility functions
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
 * Parsuje datetime string v daném timezone a převede na UTC
 * Podporuje formáty: 'YYYY-MM-DDTHH:mm' a 'YYYY-MM-DDTHH:mm:ss'
 */
export function parseTimezoneDateTime(datetimeStr: string, timezone: string = 'Europe/Prague'): Date {
  if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'production') {
    console.log(`🕐 parseTimezoneDateTime: ${datetimeStr} in ${timezone}`)
  }

  if (!datetimeStr || typeof datetimeStr !== 'string') {
    throw new Error(`Invalid datetime string: ${datetimeStr}`)
  }

  if (!isValidTimezone(timezone)) {
    throw new Error(`Invalid timezone: ${timezone}`)
  }

  // Jednoduché parsování - přidáme sekundy pokud chybí a převedeme na ISO format
  let isoString = datetimeStr
  if (isoString.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/)) {
    isoString += ':00'
  }
  
  try {
    // Spolehlivý způsob: použijeme Intl.DateTimeFormat pro převod
    // Nejprve vytvoříme datum jako by bylo v target timezone
    const inputDate = new Date(isoString)
    
    if (isNaN(inputDate.getTime())) {
      throw new Error(`Invalid date format: ${datetimeStr}`)
    }
    
    // Získáme formátování pro target timezone
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    }).formatToParts(inputDate)
    
    // Sestavíme string reprezentaci času v target timezone
    const tzYear = parts.find(p => p.type === 'year')?.value
    const tzMonth = parts.find(p => p.type === 'month')?.value
    const tzDay = parts.find(p => p.type === 'day')?.value
    const tzHour = parts.find(p => p.type === 'hour')?.value
    const tzMinute = parts.find(p => p.type === 'minute')?.value
    const tzSecond = parts.find(p => p.type === 'second')?.value
    
    const tzString = `${tzYear}-${tzMonth}-${tzDay}T${tzHour}:${tzMinute}:${tzSecond}`
    
    // Rozdíl mezi tím, co chceme (isoString) a tím, co by datum znamenalo v timezone
    const targetDate = new Date(tzString)
    const offset = inputDate.getTime() - targetDate.getTime()
    
    // Výsledek: původní datum minus offset
    const resultUTC = new Date(inputDate.getTime() - offset)
    
    if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'production') {
      console.log(`   Input: ${datetimeStr}`)
      console.log(`   ISO format: ${isoString}`)
      console.log(`   In ${timezone}: ${tzString}`)
      console.log(`   Offset: ${offset}ms`)
      console.log(`   Result UTC: ${resultUTC.toISOString()}`)
      console.log(`   Verification: ${resultUTC.toLocaleString('sv-SE', { timeZone: timezone })}`)
    }

    return resultUTC
  } catch (error) {
    console.error(`❌ Error in parseTimezoneDateTime:`, error)
    const errorMessage = error instanceof Error ? error.message : String(error)
    throw new Error(`Failed to parse datetime ${datetimeStr} in timezone ${timezone}: ${errorMessage}`)
  }
}

/**
 * Převede UTC Date na datetime-local string pro daný timezone
 * Vrací formát 'YYYY-MM-DDTHH:mm' pro datetime-local input
 */
export function formatTimezoneDateTime(date: Date, timezone: string = 'Europe/Prague'): string {
  if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
    throw new Error(`Invalid date: ${date}`)
  }

  if (!isValidTimezone(timezone)) {
    throw new Error(`Invalid timezone: ${timezone}`)
  }

  // Převedeme UTC čas na target timezone
  const localTime = date.toLocaleString('sv-SE', { 
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  })

  // sv-SE formát je už 'YYYY-MM-DD HH:mm', jen nahradíme mezeru za T
  const result = localTime.replace(' ', 'T')
  
  if (process.env.NODE_ENV === 'development') {
    console.log(`🕐 formatTimezoneDateTime: ${date.toISOString()} (UTC) -> ${result} (${timezone})`)
  }
  
  return result
}

/**
 * Získá začátek dne v daném timezone jako UTC Date
 */
export function getStartOfDayInTimezone(dateStr: string, timezone: string): Date {
  // Create date at start of day (00:00:00.000) in the target timezone
  const localDate = `${dateStr}T00:00:00`
  return parseTimezoneDateTime(localDate, timezone)
}

/**
 * Získá konec dne v daném timezone jako UTC Date
 */
export function getEndOfDayInTimezone(dateStr: string, timezone: string): Date {
  // Create date at start of next day in target timezone and subtract 1 millisecond
  const nextDay = new Date(dateStr)
  nextDay.setDate(nextDay.getDate() + 1)
  const nextDayStr = nextDay.toISOString().split('T')[0]
  const nextDayStart = `${nextDayStr}T00:00:00`
  
  // Get the UTC time for start of next day and subtract 1ms
  const nextDayUTC = parseTimezoneDateTime(nextDayStart, timezone)
  nextDayUTC.setMilliseconds(-1)
  return nextDayUTC
}

/**
 * Získá zítřejší datum v datetime-local formátu pro daný timezone
 */
export function getTomorrowDateTimeInTimezone(timezone: TimezoneId): string {
  const now = new Date()
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)
  
  // Převedeme na target timezone a nastavíme čas na 10:00
  const tomorrowDateStr = tomorrow.toLocaleDateString('sv-SE', { timeZone: timezone })
  
  return `${tomorrowDateStr}T10:00`
}

/**
 * Debug logging pro timezone operace
 */
export function logTimezoneDebug(label: string, value: Date, timezone?: TimezoneId): void {
  if (process.env.NODE_ENV === 'development') {
    console.log(`🕐 ${label}:`, value)
    if (timezone && value instanceof Date) {
      console.log(`   -> UTC: ${value.toISOString()}`)
      console.log(`   -> ${timezone}: ${value.toLocaleString('sv-SE', { timeZone: timezone })}`)
    }
  }
}

// === LEGACY SUPPORT ===
// Zachováváme kompatibilitu se stávajícím kódem

/**
 * @deprecated Používej parseTimezoneDateTime s explicitním timezone
 */
export function parsePragueDateTime(datetimeStr: string): Date {
  return parseTimezoneDateTime(datetimeStr, 'Europe/Prague')
}

/**
 * @deprecated Používej formatTimezoneDateTime s explicitním timezone
 */
export function formatDateTimeForAPI(datetimeStr: string): string {
  // Pro zpětnou kompatibilitu - jen předáme string
  return datetimeStr
}

/**
 * @deprecated Používej logTimezoneDebug
 */
export function logTimeDebug(label: string, value: any): void {
  logTimezoneDebug(label, value, 'Europe/Prague')
} 