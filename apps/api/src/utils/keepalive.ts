import { PrismaClient } from '@prisma/client'

// Keepalive pro Railway databázi - ping každých 5 sekund aby se neuspala
export function startDatabaseKeepalive(prisma: PrismaClient) {
  console.log('🔄 Spouštím database keepalive (ping každých 5s)')
  
  setInterval(async () => {
    try {
      // Jednoduchý SELECT 1 dotaz pro udržení spojení
      await prisma.$queryRaw`SELECT 1`
      console.log('💚 DB ping - OK')
    } catch (error) {
      console.log('❌ DB ping - CHYBA:', error)
    }
  }, 5000) // 5 sekund
} 