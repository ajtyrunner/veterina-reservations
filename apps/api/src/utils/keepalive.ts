import { PrismaClient } from '@prisma/client'

// Keepalive pro Railway databázi s agresivnějším probouzením
export function startDatabaseKeepalive(prisma: PrismaClient) {
  console.log('🔄 Spouštím agresivní database keepalive...')
  
  let isConnected = false
  let retryCount = 0
  
  const pingDatabase = async () => {
    try {
      // Zkusíme se připojit a restartovat Prisma
      await prisma.$connect()
      await prisma.$queryRaw`SELECT 1`
      
      if (!isConnected) {
        console.log(`✅ Databáze probuzen po ${retryCount} pokusech! Keepalive běží`)
        isConnected = true
        retryCount = 0
      } else {
        console.log('💚 DB ping - OK')
      }
    } catch (error: any) {
      retryCount++
      
      if (isConnected) {
        console.log('❌ DB ping - spadla, restartuji spojení...')
        isConnected = false
      } else {
        console.log(`🔄 Probouzím databázi... (pokus ${retryCount})`)
      }
      
      // Pokus o odpojení a připojení
      try {
        await prisma.$disconnect()
        await new Promise(resolve => setTimeout(resolve, 1000))
      } catch (e) {
        // Ignoruj chyby při odpojování
      }
    }
  }
  
  // Okamžitý první pokus
  pingDatabase()
  
  // Pak každých 10 sekund (místo 5)
  setInterval(pingDatabase, 10000)
} 