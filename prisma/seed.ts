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
  const adminPassword = 'K9mX2nP7qE' // Náhodné 10místné heslo
  const adminHashedPassword = await bcrypt.hash(adminPassword, 12)
  // console.log('🔐 Admin heslo:', adminPassword) // BEZPEČNOST: Nelogovat plaintext hesla
  console.log('✅ Admin uživatel bude vytvořen s heslem z kódu')
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@veterina-svahy.cz' },
    update: {},
    create: {
      email: 'admin@veterina-svahy.cz',
      name: 'Administrátor',
      password: adminHashedPassword,
      role: UserRole.ADMIN,
      tenantId: mainTenant.id,
    },
  })

  console.log('✅ Admin uživatel vytvořen:', adminUser.email)

  // Vytvoření doktorů s hesly
  const doctorPassword = await bcrypt.hash('doktor123', 12)
  
  const doctorsData = [
    {
      email: 'lucia.friedlaenderova@veterina-svahy.cz',
      name: 'MVDr. Lucia Friedlaenderová',
      specialization: 'Malá zvířata',
      description: 'Specializace na psy a kočky, chirurgie',
    },
    {
      email: 'jana.ambruzova@veterina-svahy.cz',
      name: 'MVDr. Jana Ambruzová',
      specialization: 'Malá zvířata',
      description: 'Všeobecná veterinární praxe',
    },
    {
      email: 'klara.navratilova@veterina-svahy.cz',
      name: 'MVDr. Klára Navrátilová',
      specialization: 'Malá zvířata',
      description: 'Preventivní péče a vakcinace',
    },
    {
      email: 'martina.simkova@veterina-svahy.cz',
      name: 'MVDr. Martina Šimková',
      specialization: 'Malá zvířata',
      description: 'Dermatologie a alergologie',
    },
  ]

  const createdDoctors = []
  for (const doctorData of doctorsData) {
    const doctorUser = await prisma.user.upsert({
      where: { email: doctorData.email },
      update: {},
      create: {
        email: doctorData.email,
        name: doctorData.name,
        password: doctorPassword,
        role: UserRole.DOCTOR,
        tenantId: mainTenant.id,
      },
    })

    const doctor = await prisma.doctor.upsert({
      where: { userId: doctorUser.id },
      update: {},
      create: {
        userId: doctorUser.id,
        specialization: doctorData.specialization,
        description: doctorData.description,
        tenantId: mainTenant.id,
      },
    })

    createdDoctors.push(doctor)
    console.log('✅ Doktor vytvořen:', doctorUser.name)
  }

  // Vytvoření ordinací/místností
  const roomsData = [
    {
      name: 'Ordinace 1',
      description: 'Hlavní vyšetřovna pro základní vyšetření',
      capacity: 1,
    },
    {
      name: 'Ordinace 2',
      description: 'Vedlejší ordinace pro rutinní výkony',
      capacity: 1,
    },
    {
      name: 'Operační sál',
      description: 'Sterilní prostředí pro chirurgické zákroky',
      capacity: 1,
    },
    {
      name: 'RTG místnost',
      description: 'Rentgenové vyšetření',
      capacity: 1,
    },
  ]

  const createdRooms = []
  for (const roomData of roomsData) {
    const room = await prisma.room.upsert({
      where: { 
        tenantId_name: {
          tenantId: mainTenant.id,
          name: roomData.name
        }
      },
      update: {},
      create: {
        ...roomData,
        tenantId: mainTenant.id,
      },
    })
    createdRooms.push(room)
    console.log('✅ Místnost vytvořena:', room.name)
  }

  // Vytvoření typů služeb/úkonů
  const serviceTypesData = [
    {
      name: 'Základní vyšetření',
      description: 'Rutinní kontrola zdravotního stavu',
      duration: 30, // 30 minut
      price: 500.00,
      color: '#10B981', // zelená
    },
    {
      name: 'Očkování',
      description: 'Preventivní očkování podle věku',
      duration: 15, // 15 minut
      price: 300.00,
      color: '#3B82F6', // modrá
    },
    {
      name: 'Chirurgický zákrok',
      description: 'Operativní výkony',
      duration: 90, // 90 minut
      price: 2000.00,
      color: '#EF4444', // červená
    },
    {
      name: 'RTG vyšetření',
      description: 'Rentgenové snímkování',
      duration: 20, // 20 minut
      price: 800.00,
      color: '#8B5CF6', // fialová
    },
    {
      name: 'Ultrazvuk',
      description: 'Ultrazvukové vyšetření',
      duration: 25, // 25 minut
      price: 600.00,
      color: '#F59E0B', // oranžová
    },
    {
      name: 'Dentální péče',
      description: 'Ošetření zubů a dásní',
      duration: 45, // 45 minut
      price: 1200.00,
      color: '#06B6D4', // tyrkysová
    },
  ]

  const createdServiceTypes = []
  for (const serviceData of serviceTypesData) {
    const serviceType = await prisma.serviceType.upsert({
      where: { 
        tenantId_name: {
          tenantId: mainTenant.id,
          name: serviceData.name
        }
      },
      update: {},
      create: {
        ...serviceData,
        tenantId: mainTenant.id,
      },
    })
    createdServiceTypes.push(serviceType)
    console.log('✅ Typ služby vytvořen:', serviceType.name)
  }

  // Základní databáze je připravena - sloty budou vytvářeny doktory přímo v aplikaci

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
