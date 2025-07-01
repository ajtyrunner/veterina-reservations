/**
 * Frontend timezone utilities pro správné posílání časů na Railway API
 */

export const PRAGUE_TIMEZONE = 'Europe/Prague'

/**
 * Převede local datetime input na ISO string s Prague timezone
 */
export function formatDateTimeForAPI(dateTimeLocal: string): string {
  // Input z datetime-local: "2024-01-15T08:00"
  // Output pro API: "2024-01-15T08:00+01:00" (CET) nebo "2024-01-15T08:00+02:00" (CEST)
  
  if (!dateTimeLocal) return ''
  
  // Vytvoříme Date objekt s lokálním časem
  const localDate = new Date(dateTimeLocal)
  
  // Získáme offset pro Prague timezone
  const pragueDate = new Date(localDate.toLocaleString('sv-SE', { timeZone: PRAGUE_TIMEZONE }))
  const pragueOffset = getPragueOffset(localDate)
  
  // Vrátíme ISO string s Prague timezone offsetem
  return dateTimeLocal + pragueOffset
}

/**
 * Získá aktuální timezone offset pro Prague (CET/CEST)
 */
function getPragueOffset(date: Date): string {
  const january = new Date(date.getFullYear(), 0, 1)
  const july = new Date(date.getFullYear(), 6, 1)
  
  const januaryOffset = january.getTimezoneOffset()
  const julyOffset = july.getTimezoneOffset()
  
  // Pokud je offset v létě jiný než v zimě, je to DST
  const isDST = Math.max(januaryOffset, julyOffset) !== date.getTimezoneOffset()
  
  // CET = UTC+1, CEST = UTC+2
  return isDST ? '+02:00' : '+01:00'
}

/**
 * Převede UTC čas z API na local datetime pro input
 */
export function formatDateTimeFromAPI(utcString: string): string {
  if (!utcString) return ''
  
  const utcDate = new Date(utcString)
  
  // Převedeme na Prague timezone a vrátíme pro datetime-local input
  return utcDate.toLocaleString('sv-SE', { 
    timeZone: PRAGUE_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).replace(' ', 'T')
}

/**
 * Debug funkce pro frontend
 */
export function logTimezoneDebug(label: string, dateTime: string) {
  console.log(`🕐 ${label}:`)
  console.log(`  Input: ${dateTime}`)
  console.log(`  For API: ${formatDateTimeForAPI(dateTime)}`)
  console.log(`  Browser timezone: ${Intl.DateTimeFormat().resolvedOptions().timeZone}`)
} 