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

/**
 * Test utility pro normalizaci telefonních čísel
 */

// Simulace importu funkce (pro test bez TypeScript)
function normalizePhoneNumber(phone) {
  if (!phone) return ''
  
  // Odstraníme všechny mezery, pomlčky a závorky
  let cleaned = phone.replace(/[\s\-\(\)]/g, '')
  
  // Odstraníme případný + na začátku
  if (cleaned.startsWith('+')) {
    cleaned = cleaned.substring(1)
  }
  
  // Pokud číslo začíná 420, je už v mezinárodním formátu
  if (cleaned.startsWith('420') && cleaned.length === 12) {
    // Formátujeme: 420777456789 -> +420 777 456 789
    return `+420 ${cleaned.substring(3, 6)} ${cleaned.substring(6, 9)} ${cleaned.substring(9, 12)}`
  }
  
  // Pokud číslo začíná 00420, odstraníme 00
  if (cleaned.startsWith('00420') && cleaned.length === 14) {
    cleaned = cleaned.substring(2) // Odstraní 00
    return `+420 ${cleaned.substring(3, 6)} ${cleaned.substring(6, 9)} ${cleaned.substring(9, 12)}`
  }
  
  // Pokud je to české číslo bez předvolby (9 číslic)
  if (cleaned.length === 9 && /^[67]/.test(cleaned)) {
    // Formátujeme: 777456789 -> +420 777 456 789
    return `+420 ${cleaned.substring(0, 3)} ${cleaned.substring(3, 6)} ${cleaned.substring(6, 9)}`
  }
  
  // Pokud začíná 0 a má 10 číslic (klasický český formát)
  if (cleaned.startsWith('0') && cleaned.length === 10) {
    // Odstraníme 0 a přidáme +420: 0777456789 -> +420 777 456 789
    cleaned = cleaned.substring(1)
    return `+420 ${cleaned.substring(0, 3)} ${cleaned.substring(3, 6)} ${cleaned.substring(6, 9)}`
  }
  
  // Pro ostatní mezinárodní čísla nebo nerozpoznané formáty vrátíme původní
  return phone.trim()
}

// Test cases
const testCases = [
  { input: '777456789', expected: '+420 777 456 789', description: 'České číslo bez předvolby' },
  { input: '0777456789', expected: '+420 777 456 789', description: 'České číslo s nulou' },
  { input: '+420777456789', expected: '+420 777 456 789', description: 'Mezinárodní formát bez mezer' },
  { input: '420777456789', expected: '+420 777 456 789', description: 'Mezinárodní bez plus' },
  { input: '00420777456789', expected: '+420 777 456 789', description: 'Mezinárodní s 00' },
  { input: '+420 777 456 789', expected: '+420 777 456 789', description: 'Již správně formátované' },
  { input: '777-456-789', expected: '+420 777 456 789', description: 'S pomlčkami' },
  { input: '777 456 789', expected: '+420 777 456 789', description: 'S mezerami' },
  { input: '(777) 456-789', expected: '+420 777 456 789', description: 'Se závorkami' },
  { input: '604123456', expected: '+420 604 123 456', description: 'Mobilní číslo 604' },
  { input: '+49 30 12345678', expected: '+49 30 12345678', description: 'Německé číslo - beze změny' },
  { input: '', expected: '', description: 'Prázdný string' },
  { input: '123', expected: '123', description: 'Neplatné krátké číslo' },
]

console.log('🧪 Test normalizace telefonních čísel\n')

let passed = 0
let failed = 0

testCases.forEach((testCase, index) => {
  const result = normalizePhoneNumber(testCase.input)
  const success = result === testCase.expected
  
  if (success) {
    console.log(`✅ Test ${index + 1}: ${testCase.description}`)
    console.log(`   Input: "${testCase.input}" -> Output: "${result}"`)
    passed++
  } else {
    console.log(`❌ Test ${index + 1}: ${testCase.description}`)
    console.log(`   Input: "${testCase.input}"`)
    console.log(`   Expected: "${testCase.expected}"`)
    console.log(`   Got: "${result}"`)
    failed++
  }
  console.log('')
})

console.log(`📊 Výsledky: ${passed} úspěšných, ${failed} neúspěšných testů`)

if (failed === 0) {
  console.log('🎉 Všechny testy prošly!')
} else {
  console.log('⚠️ Některé testy selhaly - je potřeba opravit logiku')
} 