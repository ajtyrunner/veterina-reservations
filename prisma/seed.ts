import { PrismaClient, UserRole, AuthProvider } from '@prisma/client'
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
      defaultEmail: 'veterina-svahy@email.cz', // Fallback email pro notifikace
      defaultPhone: '+420 721 049 699', // Hlavní telefon ordinace
    },
    {
      slug: 'brno-vet',
      name: 'Veterinární klinika Brno',
      logoUrl: null,
      primaryColor: '#059669',
      secondaryColor: '#047857',
      defaultEmail: 'info@brno-vet.cz',
      defaultPhone: '+420 555 123 456',
    },
    {
      slug: 'psikocky',
      name: 'Ordinace pro psy a kočky',
      logoUrl: null,
      primaryColor: '#DC2626',
      secondaryColor: '#B91C1C',
      defaultEmail: 'kontakt@psikocky.cz',
      defaultPhone: '+420 555 234 567',
    },
    {
      slug: 'test',
      name: 'Testovací veterinární ordinace',
      logoUrl: null,
      primaryColor: '#7C2D12',
      secondaryColor: '#92400E',
      defaultEmail: 'test@example.com',
      defaultPhone: '+420 555 999 888',
    },
  ]

  const createdTenants = []
  for (const tenantData of tenants) {
    const tenant = await prisma.tenant.upsert({
      where: { slug: tenantData.slug },
      update: {
        defaultEmail: tenantData.defaultEmail,
        defaultPhone: tenantData.defaultPhone,
      },
      create: tenantData,
    })
    createdTenants.push(tenant)
    console.log('✅ Tenant vytvořen/aktualizován:', tenant.name)
  }

  // Hlavní tenant pro další seed data
  const mainTenant = createdTenants[0] // svahy

  // Vytvoření admin uživatele
  const adminPassword = 'K9mX2nP7qE' // Náhodné 10místné heslo
  const adminHashedPassword = await bcrypt.hash(adminPassword, 12)
  // console.log('🔐 Admin heslo:', adminPassword) // BEZPEČNOST: Nelogovat plaintext hesla
  console.log('✅ Admin uživatel bude vytvořen s heslem z kódu')
  const adminUser = await prisma.user.upsert({
    where: { 
      unique_email_provider_tenant: {
        email: 'admin@veterina-svahy.cz',
        authProvider: AuthProvider.INTERNAL,
        tenantId: mainTenant.id
      }
    },
    update: {},
          create: {
        email: 'admin@veterina-svahy.cz',
        username: 'admin', // INTERNAL provider MUSÍ mít username
        name: 'Administrátor',
        phone: '+420 777 123 456', // Admin má vlastní phone
        password: adminHashedPassword,
        authProvider: AuthProvider.INTERNAL,
        role: UserRole.ADMIN,
        tenantId: mainTenant.id,
      },
  })

  console.log('✅ Admin uživatel vytvořen:', adminUser.email)

  // Vytvoření testovacího Google OAuth klienta (NEMÁ username - pouze pro INTERNAL)
  const googleUser = await prisma.user.upsert({
    where: { 
      unique_email_provider_tenant: {
        email: 'test@gmail.com',
        authProvider: AuthProvider.GOOGLE,
        tenantId: mainTenant.id
      }
    },
    update: {},
          create: {
        email: 'test@gmail.com',
        name: 'Testovací Google uživatel',
        phone: '+420 777 999 888', // Phone z Google OAuth profilu
        authProvider: AuthProvider.GOOGLE,
        role: UserRole.CLIENT,
        tenantId: mainTenant.id,
        // username: null - Google OAuth uživatelé NEMAJÍ username
      },
  })

  console.log('✅ Google OAuth testovací uživatel vytvořen:', googleUser.email)

  // Vytvoření doktorů s hesly
  const doctorPassword = await bcrypt.hash('doktor123', 12)
  
  const doctorsData = [
    {
      email: 'lucia.friedlaenderova@email.cz', // PŮVODNÍ: Lucia s vlastním emailem
      username: 'lucia.friedlaenderova',
      name: 'MVDr. Lucia Friedlaenderová',
      phone: '+420 737 518 187', // PŮVODNÍ telefon Lucie
      specialization: 'Malá zvířata',
      description: 'Specializace na psy a kočky, chirurgie',
    },
    {
      email: 'milankopp@seznam.cz', // Milan Kopp pro testování
      username: 'milan.kopp',
      name: 'MVDr. Milan Kopp',
      phone: '+420 777 456 789', // Vlastní telefon
      specialization: 'Malá zvířata',
      description: 'Testovací doktor pro vývoj',
    },
    {
      email: null, // Null - bude použit tenant default email
      username: 'jana.ambruzova',
      name: 'MVDr. Jana Ambruzová',
      phone: null, // Null - bude použit tenant default phone
      specialization: 'Malá zvířata',
      description: 'Všeobecná veterinární praxe',
    },
    {
      email: null, // Null - bude použit tenant default email
      username: 'klara.navratilova',
      name: 'MVDr. Klára Navrátilová',
      phone: null, // Null - bude použit tenant default phone
      specialization: 'Malá zvířata',
      description: 'Preventivní péče a vakcinace',
    },
    {
      email: null, // Null - bude použit tenant default email
      username: 'martina.simkova',
      name: 'MVDr. Martina Šimková',
      phone: null, // Null - bude použit tenant default phone
      specialization: 'Malá zvířata',
      description: 'Dermatologie a alergologie',
    },
  ]

    const createdDoctors = []
  for (const doctorData of doctorsData) {
    // Pro uživatele s null email použijeme username pro unikátní identifikaci
    const whereCondition = doctorData.email 
      ? { 
          unique_email_provider_tenant: {
            email: doctorData.email,
            authProvider: AuthProvider.INTERNAL,
            tenantId: mainTenant.id
          }
        }
      : {
          unique_username_tenant: {
            username: doctorData.username!,
            tenantId: mainTenant.id
          }
        }

    const doctorUser = await prisma.user.upsert({
      where: whereCondition,
      update: {},
      create: {
        email: doctorData.email,
        username: doctorData.username, // INTERNAL provider MUSÍ mít username (formát: jmeno.prijmeni)
        name: doctorData.name,
        phone: doctorData.phone, // Phone pole nyní funguje po migraci
        password: doctorPassword,
        authProvider: AuthProvider.INTERNAL,
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
  console.log('')
  console.log('📋 Pravidla pro username:')
  console.log('   - INTERNAL provider: POVINNÝ (formát: jmeno.prijmeni)')
  console.log('   - GOOGLE/OAuth: NENÍ POTŘEBA (null)')
  console.log('   - Unique constraint: username + tenantId')
  console.log('')
  console.log('📞 Kontaktní údaje:')
  console.log('   - User.phone: volitelné pro všechny uživatele')
  console.log('   - Tenant.defaultEmail/defaultPhone: fallback pro komunikaci')
  console.log('   - Doktoři: ZÁMĚRNĚ prázdné phone pro testování fallback')
  console.log('   - Využití: getDoctorContactInfo() utility pro notifikace')
  console.log('')
  console.log('⚠️  POZOR: Po změnách schématu spusťte migraci!')
  console.log('   npx prisma migrate dev --name add_phone_and_tenant_defaults')
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
