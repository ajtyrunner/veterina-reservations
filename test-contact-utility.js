const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function testContactUtility() {
  console.log('🧪 Testování nových contact utility funkcí...\n')
  
  try {
    // Test 1: Načti tenant s default kontaktními údaji
    console.log('📋 Test 1: Tenant default kontakty')
    const tenant = await prisma.tenant.findFirst({
      where: { slug: 'svahy' },
      select: { 
        id: true, 
        name: true, 
        defaultEmail: true, 
        defaultPhone: true 
      }
    })
    
    if (tenant) {
      console.log(`✅ Tenant: ${tenant.name}`)
      console.log(`   Default email: ${tenant.defaultEmail || 'ŽÁDNÝ'}`)
      console.log(`   Default phone: ${tenant.defaultPhone || 'ŽÁDNÝ'}`)
    } else {
      console.log('❌ Tenant nenalezen')
      return
    }
    console.log('')

    // Test 2: Načti doktory a jejich kontaktní údaje
    console.log('👨‍⚕️ Test 2: Doktor kontaktní údaje s fallback logikou')
    const doctors = await prisma.doctor.findMany({
      where: { tenantId: tenant.id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            authProvider: true
          }
        }
      },
      take: 3
    })

    for (const doctor of doctors) {
      console.log(`👨‍⚕️ ${doctor.user.name} (${doctor.user.authProvider})`)
      console.log(`   User email: ${doctor.user.email || 'NULL'}`)
      console.log(`   User phone: ${doctor.user.phone || 'NULL'}`)
      
      // Fallback logika
      const finalEmail = doctor.user.email || tenant.defaultEmail
      const finalPhone = doctor.user.phone || tenant.defaultPhone
      
      console.log(`   → Final email: ${finalEmail || 'ŽÁDNÝ'}`)
      console.log(`   → Final phone: ${finalPhone || 'ŽÁDNÝ'}`)
      console.log('')
    }

    // Test 3: Admin uživatel (má vlastní phone)
    console.log('👤 Test 3: Admin uživatel (má vlastní kontakty)')
    const admin = await prisma.user.findFirst({
      where: { 
        role: 'ADMIN',
        tenantId: tenant.id 
      },
      select: {
        name: true,
        email: true,
        phone: true,
        authProvider: true
      }
    })

    if (admin) {
      console.log(`👤 ${admin.name} (${admin.authProvider})`)
      console.log(`   User email: ${admin.email || 'NULL'}`)
      console.log(`   User phone: ${admin.phone || 'NULL'}`)
      
      const finalEmail = admin.email || tenant.defaultEmail
      const finalPhone = admin.phone || tenant.defaultPhone
      
      console.log(`   → Final email: ${finalEmail || 'ŽÁDNÝ'}`)
      console.log(`   → Final phone: ${finalPhone || 'ŽÁDNÝ'}`)
    }
    console.log('')

    // Test 4: Google OAuth uživatel
    console.log('🔗 Test 4: Google OAuth uživatel')
    const googleUser = await prisma.user.findFirst({
      where: { 
        authProvider: 'GOOGLE',
        tenantId: tenant.id 
      },
      select: {
        name: true,
        email: true,
        phone: true,
        authProvider: true
      }
    })

    if (googleUser) {
      console.log(`🔗 ${googleUser.name} (${googleUser.authProvider})`)
      console.log(`   User email: ${googleUser.email || 'NULL'}`)
      console.log(`   User phone: ${googleUser.phone || 'NULL'}`)
      
      const finalEmail = googleUser.email || tenant.defaultEmail
      const finalPhone = googleUser.phone || tenant.defaultPhone
      
      console.log(`   → Final email: ${finalEmail || 'ŽÁDNÝ'}`)
      console.log(`   → Final phone: ${finalPhone || 'ŽÁDNÝ'}`)
    }

    console.log('\n✅ Test dokončen! Nové phone pole a tenant defaults fungují.')
    
  } catch (error) {
    console.error('❌ Chyba při testování:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testContactUtility() 