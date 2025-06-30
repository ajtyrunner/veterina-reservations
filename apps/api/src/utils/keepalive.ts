import { PrismaClient } from '@prisma/client'

// Keepalive pro Railway databázi s retry logikou
export function startDatabaseKeepalive(prisma: PrismaClient) {
  console.log('🔄 Spouštím database keepalive s probuzením...')
  
  // Nejdřív zkusíme probudit databázi
  let isConnected = false
  
  const pingDatabase = async () => {
    try {
      await prisma.$queryRaw`SELECT 1`
      if (!isConnected) {
        console.log('✅ Databáze probuzen! Keepalive běží')
        isConnected = true
      } else {
        console.log('💚 DB ping - OK')
      }
    } catch (error) {
      if (isConnected) {
        console.log('❌ DB ping - spadla, zkoušíme znovu...')
        isConnected = false
      } else {
        console.log('🔄 Probouzím databázi...')
      }
    }
  }
  
  // Okamžitý první pokus
  pingDatabase()
  
  // Pak každých 5 sekund
  setInterval(pingDatabase, 5000)
} 