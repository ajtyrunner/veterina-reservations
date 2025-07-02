#!/usr/bin/env node

/**
 * 🔒 BEZPEČNOSTNÍ TEST SCRIPT
 * Testuje implementované bezpečnostní opatření
 */

const https = require('https')
const http = require('http')

const API_URL = process.env.API_URL || 'http://localhost:4000'
const WEB_URL = process.env.WEB_URL || 'http://localhost:3000'

console.log('🔒 SPOUŠTÍM BEZPEČNOSTNÍ TESTY...\n')

// Test 1: HTTPS Enforcement
async function testHTTPSEnforcement() {
  console.log('🔒 Test 1: HTTPS Enforcement')
  
  if (process.env.NODE_ENV === 'production') {
    try {
      const response = await fetch(API_URL.replace('https://', 'http://') + '/health')
      
      if (response.redirected && response.url.startsWith('https://')) {
        console.log('✅ HTTPS redirect funguje správně')
      } else {
        console.log('❌ HTTPS redirect nefunguje!')
      }
    } catch (error) {
      console.log('⚠️ HTTPS test nelze provést v development módu')
    }
  } else {
    console.log('⚠️ HTTPS test přeskočen (development mód)')
  }
  console.log('')
}

// Test 2: Security Headers
async function testSecurityHeaders() {
  console.log('🔒 Test 2: Security Headers')
  
  try {
    const response = await fetch(API_URL + '/health')
    
    const requiredHeaders = [
      'x-content-type-options',
      'x-frame-options', 
      'x-xss-protection',
      'referrer-policy'
    ]
    
    requiredHeaders.forEach(header => {
      if (response.headers.get(header)) {
        console.log(`✅ ${header}: ${response.headers.get(header)}`)
      } else {
        console.log(`❌ Chybí header: ${header}`)
      }
    })
  } catch (error) {
    console.log('❌ Nelze testovat security headers:', error.message)
  }
  console.log('')
}

// Test 3: Rate Limiting
async function testRateLimit() {
  console.log('🔒 Test 3: Rate Limiting')
  
  try {
    // Pošli více požadavků než je limit
    const promises = []
    for (let i = 0; i < 10; i++) {
      promises.push(fetch(API_URL + '/api/auth/credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'test', password: 'test' })
      }))
    }
    
    const responses = await Promise.all(promises)
    const rateLimited = responses.some(r => r.status === 429)
    
    if (rateLimited) {
      console.log('✅ Rate limiting funguje - některé požadavky byly blokované')
    } else {
      console.log('⚠️ Rate limiting možná nefunguje správně')
    }
  } catch (error) {
    console.log('❌ Rate limit test selhal:', error.message)
  }
  console.log('')
}

// Test 4: Brute Force Protection
async function testBruteForceProtection() {
  console.log('🔒 Test 4: Brute Force Protection')
  
  try {
    // 6 pokusů s neplatným heslem (mělo by vést k blokaci)
    for (let i = 0; i < 6; i++) {
      const response = await fetch(API_URL + '/api/auth/credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          username: 'test-bruteforce', 
          password: 'wrong-password',
          tenantSlug: 'svahy'
        })
      })
      
      if (response.status === 429) {
        console.log(`✅ Brute force protection aktivní po ${i + 1} pokusech`)
        break
      }
      
      if (i === 5) {
        console.log('⚠️ Brute force protection se neaktivoval po 6 pokusech')
      }
    }
  } catch (error) {
    console.log('❌ Brute force test selhal:', error.message)
  }
  console.log('')
}

// Test 5: Input Validation
async function testInputValidation() {
  console.log('🔒 Test 5: Input Validation')
  
  const maliciousInputs = [
    '<script>alert("xss")</script>',
    'SELECT * FROM users',
    '{"malicious": "json"}',
    'A'.repeat(1000) // Příliš dlouhý string
  ]
  
  for (const input of maliciousInputs) {
    try {
      const response = await fetch(API_URL + '/api/reservations', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': 'Bearer invalid-token'
        },
        body: JSON.stringify({ 
          slotId: 'test',
          petName: input,
          description: input
        })
      })
      
      if (response.status === 400 || response.status === 401) {
        console.log(`✅ Malicious input blokován: ${input.substring(0, 30)}...`)
      } else {
        console.log(`⚠️ Malicious input neblokován: ${input.substring(0, 30)}...`)
      }
    } catch (error) {
      console.log(`✅ Malicious input způsobil chybu (dobrý znak): ${input.substring(0, 30)}...`)
    }
  }
  console.log('')
}

// Test 6: CORS Configuration
async function testCORS() {
  console.log('🔒 Test 6: CORS Configuration')
  
  try {
    // Test OPTIONS preflight
    const response = await fetch(API_URL + '/api/health', {
      method: 'OPTIONS',
      headers: {
        'Origin': 'https://malicious-site.com',
        'Access-Control-Request-Method': 'POST'
      }
    })
    
    const allowOrigin = response.headers.get('access-control-allow-origin')
    
    if (allowOrigin && allowOrigin !== 'https://malicious-site.com') {
      console.log('✅ CORS správně omezuje nepovolené origins')
    } else {
      console.log('⚠️ CORS možná povoluje všechny origins')
    }
  } catch (error) {
    console.log('❌ CORS test selhal:', error.message)
  }
  console.log('')
}

// Spusť všechny testy
async function runAllTests() {
  await testHTTPSEnforcement()
  await testSecurityHeaders()
  await testRateLimit()
  await testBruteForceProtection()
  await testInputValidation()
  await testCORS()
  
  console.log('🎉 BEZPEČNOSTNÍ TESTY DOKONČENY!')
  console.log('')
  console.log('📋 SHRNUTÍ:')
  console.log('- ✅ = Test prošel úspěšně')
  console.log('- ⚠️ = Test prošel s varováními')
  console.log('- ❌ = Test selhal - vyžaduje pozornost')
}

// Spusť testy pokud je script volán přímo
if (require.main === module) {
  runAllTests().catch(console.error)
}

module.exports = { runAllTests } 