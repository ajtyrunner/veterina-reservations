import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function updateSvahyLogo() {
  console.log('🏥 Přidávání loga pro Veterina Svahy...')

  try {
    await prisma.tenant.update({
      where: { slug: 'svahy' },
      data: {
        contentData: {
          ...(await prisma.tenant.findUnique({ where: { slug: 'svahy' } }))?.contentData as any || {},
          branding: {
            logoUrl: '/images/tenants/svahy-logo.png',
            logoAlt: 'Veterinární klinika Svahy'
          }
        }
      }
    })

    console.log('✅ Logo pro Svahy úspěšně přidáno')
  } catch (error) {
    console.error('❌ Chyba při aktualizaci loga:', error)
  } finally {
    await prisma.$disconnect()
  }
}

updateSvahyLogo()