import { PrismaClient, UserRole, AuthProvider } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

/**
 * Vytvoří testovací uživatele pro E2E testy
 * Používá INTERNAL auth provider místo Google OAuth
 */
export async function seedTestUsers() {
  const tenantSlug = 'svahy'
  
  // Najdi tenant
  const tenant = await prisma.tenant.findUnique({
    where: { slug: tenantSlug }
  })
  
  if (!tenant) {
    console.error(`Tenant ${tenantSlug} neexistuje!`)
    return
  }

  const hashedPassword = await bcrypt.hash('TestPassword123!', 12)
  
  // Test users data
  const testUsers = [
    {
      username: 'test.client',
      email: 'test.client@example.com',
      name: 'Test Klient',
      role: UserRole.CLIENT,
      phone: '+420777888999'
    },
    {
      username: 'test.doctor',
      email: 'test.doctor@example.com', 
      name: 'Test Doktor',
      role: UserRole.DOCTOR,
      phone: '+420777888998'
    },
    {
      username: 'test.admin',
      email: 'test.admin@example.com',
      name: 'Test Admin',
      role: UserRole.ADMIN,
      phone: '+420777888997'
    }
  ]

  for (const userData of testUsers) {
    // Vytvoř nebo aktualizuj uživatele
    const user = await prisma.user.upsert({
      where: {
        unique_username_tenant: {
          username: userData.username,
          tenantId: tenant.id
        }
      },
      update: {
        password: hashedPassword,
        isActive: true
      },
      create: {
        ...userData,
        password: hashedPassword,
        authProvider: AuthProvider.INTERNAL,
        tenantId: tenant.id,
        isActive: true
      }
    })

    console.log(`✅ Vytvořen testovací uživatel: ${userData.username}`)

    // Pro doktora vytvoř Doctor profil
    if (userData.role === UserRole.DOCTOR) {
      await prisma.doctor.upsert({
        where: { userId: user.id },
        update: {
          specialization: 'Všeobecný veterinář',
          description: 'Testovací doktor pro E2E testy'
        },
        create: {
          userId: user.id,
          tenantId: tenant.id,
          specialization: 'Všeobecný veterinář',
          description: 'Testovací doktor pro E2E testy'
        }
      })
      console.log(`✅ Vytvořen doktorský profil pro: ${userData.username}`)
    }
  }

  // Vytvoř testovací sloty pro doktora
  const doctor = await prisma.doctor.findFirst({
    where: {
      user: {
        username: 'test.doctor',
        tenantId: tenant.id
      }
    }
  })

  if (doctor) {
    // Vytvoř sloty na příští týden
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(9, 0, 0, 0)

    for (let i = 0; i < 5; i++) {
      const slotDate = new Date(tomorrow)
      slotDate.setDate(slotDate.getDate() + i)
      
      // Ranní sloty
      for (let hour = 9; hour < 12; hour++) {
        const startTime = new Date(slotDate)
        startTime.setHours(hour, 0, 0, 0)
        
        const endTime = new Date(startTime)
        endTime.setMinutes(30)

        await prisma.slot.create({
          data: {
            doctorId: doctor.id,
            tenantId: tenant.id,
            startTime,
            endTime,
            isAvailable: true
          }
        })
      }
    }
    console.log(`✅ Vytvořeny testovací sloty pro doktora`)
  }
}

// Spustit seed
seedTestUsers()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })