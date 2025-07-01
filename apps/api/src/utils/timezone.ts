/**
 * Timezone utility functions pro Českou republiku
 * Řeší problémy s časovými zónami mezi Vercel frontend a Railway backend
 */

export const PRAGUE_TIMEZONE = 'Europe/Prague'

/**
 * Převede frontend čas (browser timezone) na UTC pro databázi
 */
export function toUTC(dateString: string): Date {
  // Předpokládáme, že frontend pošle čas v lokální timezone (Europe/Prague)
  const date = new Date(dateString)
  
  // Pokud už je čas v UTC, vrátíme ho jak je
  if (dateString.endsWith('Z') || dateString.includes('+')) {
    return date
  }
  
  // Jinak interpretujeme jako Prague time a převedeme na UTC
  const pragueDate = new Date(dateString + ' GMT+0100') // CET
  return pragueDate
}

/**
 * Převede UTC čas z databáze na Prague timezone pro frontend
 */
export function toPragueTime(utcDate: Date): string {
  return utcDate.toLocaleString('sv-SE', { 
    timeZone: PRAGUE_TIMEZONE,
    year: 'numeric',
    month: '2-digit', 
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }).replace(' ', 'T')
}

/**
 * Vytvoří Date objekt z frontend času s explicitní Prague timezone
 */
export function parsePragueDateTime(dateTimeString: string): Date {
  // Pokud frontend pošle např. "2024-01-15T08:00"
  // Interpretujeme to jako Prague time a převedeme na UTC
  
  if (!dateTimeString.includes('T')) {
    throw new Error('DateTime string must include time part (T)')
  }
  
  // Přidáme timezone info pro Prague
  const [date, time] = dateTimeString.split('T')
  const pragueDateTime = `${date}T${time}+01:00` // CET (nebo +02:00 pro CEST)
  
  return new Date(pragueDateTime)
}

/**
 * Debug funkce pro logování časů
 */
export function logTimeDebug(label: string, date: Date | string) {
  const d = typeof date === 'string' ? new Date(date) : date
  
  console.log(`🕐 ${label}:`)
  console.log(`   UTC: ${d.toISOString()}`)
  console.log(`   Prague: ${d.toLocaleString('cs-CZ', { timeZone: PRAGUE_TIMEZONE })}`)
  console.log(`   Raw: ${d.toString()}`)
} 