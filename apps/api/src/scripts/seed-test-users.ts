import { PrismaClient, UserRole, AuthProvider } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding test users...')
  
  const tenant = await prisma.tenant.findUnique({
    where: { slug: 'svahy' }
  })
  
  if (!tenant) {
    throw new Error('Tenant "svahy" not found!')
  }
  
  const password = await bcrypt.hash('TestPassword123!', 10)
  
  const testUsers = [
    {
      username: 'test.client',
      email: 'test.client@internal.test',
      name: 'Test Client User',
      role: UserRole.CLIENT,
      authProvider: AuthProvider.INTERNAL
    },
    {
      username: 'test.doctor',
      email: 'test.doctor@internal.test', 
      name: 'Test Doctor User',
      role: UserRole.DOCTOR,
      authProvider: AuthProvider.INTERNAL
    },
    {
      username: 'test.admin',
      email: 'test.admin@internal.test',
      name: 'Test Admin User',
      role: UserRole.ADMIN,
      authProvider: AuthProvider.INTERNAL
    }
  ]
  
  for (const userData of testUsers) {
    const user = await prisma.user.upsert({
      where: {
        unique_email_provider_tenant: {
          email: userData.email,
          authProvider: userData.authProvider,
          tenantId: tenant.id
        }
      },
      update: {
        username: userData.username,
        password,
        name: userData.name,
        role: userData.role
      },
      create: {
        ...userData,
        password,
        tenantId: tenant.id,
        isActive: true
      }
    })
    
    console.log(`✅ Created/updated test user: ${user.username} (${user.role})`)
    
    if (userData.role === UserRole.DOCTOR) {
      await prisma.doctor.upsert({
        where: { userId: user.id },
        update: {},
        create: {
          userId: user.id,
          specialization: 'Test Veterinář',
          description: 'Testovací doktor pro vývoj'
        }
      })
      console.log(`   👨‍⚕️ Created doctor profile for ${user.username}`)
    }
  }
  
  console.log('✅ Test users seeded successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding test users:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })