import { PrismaClient, UserRole } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Začínám seedování databáze...')

  // Vytvoření více testovacích tenantů
  const tenants = [
    {
      slug: 'svahy',
      name: 'Veterinární ordinace Svahy',
      logoUrl: 'https://veterina-svahy.cz/logo.png',
      primaryColor: '#4F46E5',
      secondaryColor: '#7C3AED',
    },
    {
      slug: 'brno-vet',
      name: 'Veterinární klinika Brno',
      logoUrl: null,
      primaryColor: '#059669',
      secondaryColor: '#047857',
    },
    {
      slug: 'psikocky',
      name: 'Ordinace pro psy a kočky',
      logoUrl: null,
      primaryColor: '#DC2626',
      secondaryColor: '#B91C1C',
    },
    {
      slug: 'test',
      name: 'Testovací veterinární ordinace',
      logoUrl: null,
      primaryColor: '#7C2D12',
      secondaryColor: '#92400E',
    },
  ]

  const createdTenants = []
  for (const tenantData of tenants) {
    const tenant = await prisma.tenant.upsert({
      where: { slug: tenantData.slug },
      update: {},
      create: tenantData,
    })
    createdTenants.push(tenant)
    console.log('✅ Tenant vytvořen:', tenant.name)
  }

  // Hlavní tenant pro další seed data
  const mainTenant = createdTenants[0] // svahy

  // Vytvoření admin uživatele
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@veterina-svahy.cz' },
    update: {},
    create: {
      email: 'admin@veterina-svahy.cz',
      name: 'Administrátor',
      role: UserRole.ADMIN,
      tenantId: mainTenant.id,
    },
  })

  console.log('✅ Admin uživatel vytvořen:', adminUser.email)

  // Vytvoření doktora s heslem
  const hashedPassword = await bcrypt.hash('doktor123', 12)
  const doctorUser = await prisma.user.upsert({
    where: { email: 'lucia.friedlaenderova@veterina-svahy.cz' },
    update: {},
    create: {
      email: 'lucia.friedlaenderova@veterina-svahy.cz',
      name: 'MVDr. Lucia Friedlaenderová',
      password: hashedPassword,
      role: UserRole.DOCTOR,
      tenantId: mainTenant.id,
    },
  })

  const doctor = await prisma.doctor.upsert({
    where: { userId: doctorUser.id },
    update: {},
    create: {
      userId: doctorUser.id,
      specialization: 'Malá zvířata',
      description: 'Specializace na psy a kočky, chirurgie',
      tenantId: mainTenant.id,
    },
  })

  console.log('✅ Doktor vytvořen:', doctorUser.name)

  // Vytvoření testovacího klienta
  const clientUser = await prisma.user.upsert({
    where: { email: 'klient@test.cz' },
    update: {},
    create: {
      email: 'klient@test.cz',
      name: 'Testovací Klient',
      role: UserRole.CLIENT,
      tenantId: mainTenant.id,
    },
  })

  console.log('✅ Klient vytvořen:', clientUser.name)

  // Vytvoření ukázkových časových slotů pro doktora
  const now = new Date()
  const tomorrow = new Date(now)
  tomorrow.setDate(tomorrow.getDate() + 1)
  tomorrow.setHours(9, 0, 0, 0)

  const slotsData = [
    { start: 9, end: 10, room: 'Ordinace 1' },
    { start: 10, end: 11, room: 'Ordinace 1' },
    { start: 11, end: 12, room: 'Ordinace 1' },
    { start: 14, end: 15, room: 'Ordinace 2' },
    { start: 15, end: 16, room: 'Ordinace 2' },
    { start: 16, end: 17, room: 'Ordinace 2' },
  ]

  for (const slotData of slotsData) {
    const startTime = new Date(tomorrow)
    startTime.setHours(slotData.start, 0, 0, 0)
    
    const endTime = new Date(tomorrow)
    endTime.setHours(slotData.end, 0, 0, 0)

    await prisma.slot.upsert({
      where: {
        doctorId_startTime_endTime: {
          doctorId: doctor.id,
          startTime,
          endTime,
        }
      },
      update: {},
      create: {
        doctorId: doctor.id,
        startTime,
        endTime,
        room: slotData.room,
        equipment: 'Základní vyšetření',
        tenantId: mainTenant.id,
      },
    })
  }

  console.log('✅ Ukázkové sloty vytvořeny pro zítřek')

  console.log('🎉 Seedování dokončeno!')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error('❌ Chyba při seedování:', e)
    await prisma.$disconnect()
    process.exit(1)
  })
