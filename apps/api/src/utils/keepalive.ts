import { PrismaClient } from '@prisma/client'

// Keepalive pro Railway databázi s agresivnějším probouzením
export function startDatabaseKeepalive(prisma: PrismaClient) {
  if (process.env.NODE_ENV === 'development') {
    console.log('🔄 Spouštím agresivní database keepalive...')
  }
  
  let isConnected = false
  let retryCount = 0
  
  const keepalive = async () => {
    try {
      await prisma.$queryRaw`SELECT 1`
      if (!isConnected) {
        isConnected = true
        if (process.env.NODE_ENV === 'development') {
          console.log(`✅ Databáze probuzen po ${retryCount} pokusech! Keepalive běží`)
        }
      }
      if (process.env.NODE_ENV === 'development') {
        console.log('💚 DB ping - OK')
      }
    } catch (error) {
      isConnected = false
      retryCount++
      if (process.env.NODE_ENV === 'development') {
        console.log('❌ DB ping - spadla, restartuji spojení...')
        console.log(`🔄 Probouzím databázi... (pokus ${retryCount})`)
      }
      try {
        await prisma.$disconnect()
        await prisma.$connect()
      } catch (reconnectError) {
        // Tiché selhání - další pokus za 5s
      }
    }
  }
  
  // Spustit keepalive každých 5 sekund
  setInterval(keepalive, 5000)
} 