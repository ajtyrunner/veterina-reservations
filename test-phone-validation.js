// Test script pro validaci telefonních čísel
// Simuluje stejnou logiku jako v backend middleware

function validatePhone(phone) {
  if (!phone || !phone.trim()) return { valid: true, message: '' }
  
  const cleaned = phone.replace(/[\s\-\(\)]/g, '')
  
  // Kontrola základní délky
  if (cleaned.length < 7) {
    return { valid: false, message: 'Telefonní číslo je příliš krátké. Minimálně 7 číslic.' }
  }
  
  if (cleaned.length > 15) {
    return { valid: false, message: 'Telefonní číslo je příliš dlouhé. Maximálně 15 číslic.' }
  }
  
  // Kontrola, že obsahuje pouze číslice a povolené znaky
  if (!/^[\+\d]+$/.test(cleaned)) {
    return { valid: false, message: 'Telefonní číslo může obsahovat pouze číslice a znak +.' }
  }
  
  // České telefonní číslo - různé formáty
  const czechPatterns = [
    /^[67]\d{8}$/,                    // 777456789 (9 číslic, začíná 6 nebo 7)
    /^0[67]\d{8}$/,                   // 0777456789 (10 číslic, začíná 06 nebo 07)
    /^\+420[67]\d{8}$/,               // +420777456789 (mezinárodní s +)
    /^420[67]\d{8}$/,                 // 420777456789 (mezinárodní bez +)
    /^00420[67]\d{8}$/,               // 00420777456789 (mezinárodní s 00)
  ]
  
  // Mezinárodní čísla (základní validace)
  const internationalPattern = /^\+[1-9]\d{6,14}$/
  
  // Odebereme + pro testování vzorů bez +
  const cleanedWithoutPlus = cleaned.startsWith('+') ? cleaned.substring(1) : cleaned
  
  // Testujeme české vzory
  const isCzechValid = czechPatterns.some(pattern => 
    pattern.test(cleaned) || pattern.test(cleanedWithoutPlus)
  )
  
  // Testujeme mezinárodní vzor
  const isInternationalValid = internationalPattern.test(cleaned)
  
  if (!isCzechValid && !isInternationalValid) {
    // Specifická diagnostika pro české číslo
    if (cleaned.length === 9 || cleaned.length === 10 || 
        cleaned.startsWith('420') || cleaned.startsWith('+420') || cleaned.startsWith('00420')) {
      
      // Extrahujeme základní číslo pro diagnostiku
      let coreNumber = cleaned
      if (cleaned.startsWith('+420')) coreNumber = cleaned.substring(4)
      else if (cleaned.startsWith('420')) coreNumber = cleaned.substring(3)
      else if (cleaned.startsWith('00420')) coreNumber = cleaned.substring(5)
      else if (cleaned.startsWith('0')) coreNumber = cleaned.substring(1)
      
      if (coreNumber.length !== 9) {
        return { 
          valid: false, 
          message: `České číslo má nesprávnou délku. Má ${coreNumber.length} číslic, ale očekává se 9. Příklad: 777123456` 
        }
      }
      
      if (!/^[67]/.test(coreNumber)) {
        return { 
          valid: false, 
          message: `České mobilní číslo musí začínat číslicí 6 nebo 7. Vaše číslo začíná ${coreNumber[0]}. Příklad: 777123456` 
        }
      }
    }
    
    return { 
      valid: false, 
      message: 'Neplatný formát telefonního čísla. Podporované formáty:\n• České: 777123456, 0777123456, +420777123456\n• Mezinárodní: +49123456789, +33123456789' 
    }
  }
  
  // Další validace pro české čísla
  if (isCzechValid) {
    // Extrahujeme čísla bez předvolby pro dodatečnou validaciju
    let coreNumber = cleaned
    if (cleaned.startsWith('+420')) coreNumber = cleaned.substring(4)
    else if (cleaned.startsWith('420')) coreNumber = cleaned.substring(3)
    else if (cleaned.startsWith('00420')) coreNumber = cleaned.substring(5)
    else if (cleaned.startsWith('0')) coreNumber = cleaned.substring(1)
    
    // České mobilní čísla musí začínat 6 nebo 7
    if (coreNumber.length === 9 && !/^[67]/.test(coreNumber)) {
      return { 
        valid: false, 
        message: `České mobilní číslo musí začínat číslicí 6 nebo 7. Vaše číslo začíná ${coreNumber[0]}. Příklad: 777123456` 
      }
    }
  }
  
  return { valid: true, message: 'OK' }
}

// Test cases
const testCases = [
  // Problematické číslo z logu
  { input: '444444444444', expectValid: false, description: 'Problematické číslo z logu - 12 číslic začínající 4' },
  
  // Validní české formáty
  { input: '777123456', expectValid: true, description: 'Validní české číslo (9 číslic, začíná 7)' },
  { input: '607123456', expectValid: true, description: 'Validní české číslo (9 číslic, začíná 6)' },
  { input: '0777123456', expectValid: true, description: 'České číslo s nulou' },
  { input: '+420777123456', expectValid: true, description: 'Mezinárodní české s +' },
  { input: '420777123456', expectValid: true, description: 'Mezinárodní české bez +' },
  { input: '00420777123456', expectValid: true, description: 'Mezinárodní české s 00' },
  
  // Validní mezinárodní formáty
  { input: '+49123456789', expectValid: true, description: 'Německé číslo' },
  { input: '+33123456789', expectValid: true, description: 'Francouzské číslo' },
  
  // Nevalidní české formáty
  { input: '507123456', expectValid: false, description: 'České číslo začínající 5 (neplatné)' },
  { input: '123456789', expectValid: false, description: 'České číslo začínající 1 (neplatné)' },
  { input: '77712345', expectValid: false, description: 'Příliš krátké české číslo (8 číslic)' },
  { input: '7771234567', expectValid: false, description: 'Příliš dlouhé české číslo (10 číslic)' },
  
  // Nevalidní formáty obecně
  { input: '123', expectValid: false, description: 'Příliš krátké číslo' },
  { input: '1234567890123456', expectValid: false, description: 'Příliš dlouhé číslo' },
  { input: '777-123-456', expectValid: true, description: 'České číslo s pomlčkami (mělo by být očištěno)' },
  { input: '777 123 456', expectValid: true, description: 'České číslo s mezerami (mělo by být očištěno)' },
  { input: '777abc456', expectValid: false, description: 'Číslo s písmeny' },
  { input: '+49abc123456', expectValid: false, description: 'Mezinárodní číslo s písmeny' },
  
  // Edge cases
  { input: '', expectValid: true, description: 'Prázdné číslo (volitelné pole)' },
  { input: '   ', expectValid: true, description: 'Pouze mezery (volitelné pole)' },
  { input: '+', expectValid: false, description: 'Pouze znak +' },
  { input: '777', expectValid: false, description: 'Příliš krátké pro validní číslo' },
]

console.log('🧪 Testování validace telefonních čísel\n')

let passedTests = 0
let failedTests = 0

testCases.forEach((testCase, index) => {
  const result = validatePhone(testCase.input)
  const passed = result.valid === testCase.expectValid
  
  if (passed) {
    passedTests++
    console.log(`✅ Test ${index + 1}: ${testCase.description}`)
    console.log(`   Input: "${testCase.input}"`)
    console.log(`   Result: ${result.valid ? 'VALID' : 'INVALID'}`)
    if (!result.valid) {
      console.log(`   Message: ${result.message}`)
    }
  } else {
    failedTests++
    console.log(`❌ Test ${index + 1}: ${testCase.description}`)
    console.log(`   Input: "${testCase.input}"`)
    console.log(`   Expected: ${testCase.expectValid ? 'VALID' : 'INVALID'}`)
    console.log(`   Got: ${result.valid ? 'VALID' : 'INVALID'}`)
    console.log(`   Message: ${result.message}`)
  }
  console.log('')
})

console.log(`\n📊 Výsledky testů:`)
console.log(`✅ Úspěšné: ${passedTests}`)
console.log(`❌ Neúspěšné: ${failedTests}`)
console.log(`📈 Úspěšnost: ${((passedTests / (passedTests + failedTests)) * 100).toFixed(1)}%`)

// Specifický test pro problematické číslo z logu
console.log('\n🔍 Detailní analýza problematického čísla:')
const problematicNumber = '444444444444'
const result = validatePhone(problematicNumber)
console.log(`Číslo: ${problematicNumber}`)
console.log(`Délka: ${problematicNumber.length} číslic`)
console.log(`Začíná číslicí: ${problematicNumber[0]}`)
console.log(`Validní: ${result.valid}`)
console.log(`Zpráva: ${result.message}`)

if (result.message.includes('České mobilní číslo musí začínat číslicí 6 nebo 7')) {
  console.log('✅ Správná specifická chyba pro české číslo!')
} else if (result.message.includes('Telefonní číslo je příliš dlouhé')) {
  console.log('✅ Správná chyba pro délku!')
} else {
  console.log('❓ Neočekávaná chybová zpráva')
} 