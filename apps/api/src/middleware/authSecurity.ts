import { Request, Response, NextFunction } from 'express'
import validator from 'validator'
import bcrypt from 'bcryptjs'

// In-memory store pro tracking neúspěšných pokusů
const failedAttempts = new Map<string, { count: number, lastAttempt: Date, blocked: boolean }>()
const blockedIPs = new Map<string, Date>()

// Cleanup každých 15 minut
setInterval(() => {
  const now = new Date()
  const cleanupTime = 15 * 60 * 1000 // 15 minut
  
  // Vyčisti staré failed attempts
  for (const [key, data] of failedAttempts.entries()) {
    if (now.getTime() - data.lastAttempt.getTime() > cleanupTime) {
      failedAttempts.delete(key)
    }
  }
  
  // Vyčisti staré blokované IP
  for (const [ip, blockTime] of blockedIPs.entries()) {
    if (now.getTime() - blockTime.getTime() > cleanupTime) {
      blockedIPs.delete(ip)
    }
  }
}, 15 * 60 * 1000)

// Brute force ochrana
export const bruteForceProtection = (req: Request, res: Response, next: NextFunction) => {
  const clientIP = req.ip || req.connection.remoteAddress || 'unknown'
  const email = req.body.email?.toLowerCase()
  const key = `${clientIP}:${email}`
  
  console.log(`🛡️ Brute force check for: ${key}`)
  
  // Zkontroluj zda je IP blokované
  if (blockedIPs.has(clientIP)) {
    const blockTime = blockedIPs.get(clientIP)!
    const timeLeft = Math.ceil((blockTime.getTime() + 15 * 60 * 1000 - Date.now()) / 1000 / 60)
    console.log(`🚫 IP ${clientIP} is blocked for ${timeLeft} minutes`)
    return res.status(429).json({ 
      error: `IP adresa je dočasně blokována. Zkuste to za ${timeLeft} minut.`,
      retryAfter: timeLeft * 60
    })
  }
  
  // Zkontroluj failed attempts pro tuto kombinaci IP+email
  const attempts = failedAttempts.get(key)
  if (attempts) {
    const timeSinceLastAttempt = Date.now() - attempts.lastAttempt.getTime()
    
    // Reset pokud uplynulo více než 15 minut
    if (timeSinceLastAttempt > 15 * 60 * 1000) {
      failedAttempts.delete(key)
    } else if (attempts.count >= 5) {
      // Blokuj na 15 minut po 5 neúspěšných pokusech
      const timeLeft = Math.ceil((15 * 60 * 1000 - timeSinceLastAttempt) / 1000 / 60)
      console.log(`🚫 Too many attempts for ${key}, blocked for ${timeLeft} minutes`)
      return res.status(429).json({ 
        error: `Příliš mnoho neúspěšných pokusů. Zkuste to za ${timeLeft} minut.`,
        retryAfter: timeLeft * 60
      })
    }
  }
  
  // Přidej middleware pro tracking neúspěšných pokusů
  res.locals.trackFailedAttempt = () => {
    const current = failedAttempts.get(key) || { count: 0, lastAttempt: new Date(), blocked: false }
    current.count++
    current.lastAttempt = new Date()
    
    failedAttempts.set(key, current)
    
    // Blokuj IP po 10 neúspěšných pokusech z různých emailů
    const ipAttempts = Array.from(failedAttempts.entries())
      .filter(([k]) => k.startsWith(clientIP + ':'))
      .reduce((sum, [, data]) => sum + data.count, 0)
    
    if (ipAttempts >= 10) {
      blockedIPs.set(clientIP, new Date())
      console.log(`🚫 IP ${clientIP} blocked due to multiple failed attempts`)
    }
    
    console.log(`📊 Failed attempt recorded: ${key} (${current.count}/5)`)
  }
  
  res.locals.clearFailedAttempts = () => {
    failedAttempts.delete(key)
    console.log(`✅ Failed attempts cleared for: ${key}`)
  }
  
  next()
}

// Validace a sanitizace auth inputů
export const validateAuthInput = (req: Request, res: Response, next: NextFunction) => {
  const { email, password, tenantSlug } = req.body
  
  // Email validace
  if (!email || typeof email !== 'string') {
    return res.status(400).json({ error: 'Email je povinný' })
  }
  
  if (!validator.isEmail(email)) {
    return res.status(400).json({ error: 'Neplatný formát emailu' })
  }
  
  if (email.length > 254) { // RFC 5321 limit
    return res.status(400).json({ error: 'Email je příliš dlouhý' })
  }
  
  // Password validace
  if (!password || typeof password !== 'string') {
    return res.status(400).json({ error: 'Heslo je povinné' })
  }
  
  if (password.length < 8) {
    return res.status(400).json({ error: 'Heslo musí mít alespoň 8 znaků' })
  }
  
  if (password.length > 128) { // Prevent DoS
    return res.status(400).json({ error: 'Heslo je příliš dlouhé' })
  }
  
  // TenantSlug validace
  if (tenantSlug && (typeof tenantSlug !== 'string' || !/^[a-z0-9-]+$/.test(tenantSlug))) {
    return res.status(400).json({ error: 'Neplatný slug ordinace' })
  }
  
  // Sanitizace
  req.body.email = validator.normalizeEmail(email, { 
    gmail_remove_dots: false,
    outlookdotcom_remove_subaddress: false 
  }) || email.toLowerCase()
  
  // Odstranění potential XSS
  req.body.email = validator.escape(req.body.email)
  
  console.log(`✅ Auth input validated for: ${req.body.email}`)
  next()
}

// Password strength checker
export const checkPasswordStrength = (password: string): { 
  score: number, 
  feedback: string[],
  isStrong: boolean 
} => {
  const feedback: string[] = []
  let score = 0
  
  // Délka
  if (password.length >= 12) score += 2
  else if (password.length >= 8) score += 1
  else feedback.push('Heslo by mělo mít alespoň 8 znaků')
  
  // Malá písmena
  if (/[a-z]/.test(password)) score += 1
  else feedback.push('Přidejte malá písmena')
  
  // Velká písmena
  if (/[A-Z]/.test(password)) score += 1
  else feedback.push('Přidejte velká písmena')
  
  // Čísla
  if (/\d/.test(password)) score += 1
  else feedback.push('Přidejte čísla')
  
  // Speciální znaky
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 1
  else feedback.push('Přidejte speciální znaky (!@#$%^&*)')
  
  // Žádné opakující se znaky
  if (!/(.)\1{2,}/.test(password)) score += 1
  else feedback.push('Vyhněte se opakujícím se znakům')
  
  // Žádné běžné vzory
  const commonPatterns = ['123', 'abc', 'qwe', 'password', 'admin']
  if (!commonPatterns.some(pattern => password.toLowerCase().includes(pattern))) {
    score += 1
  } else {
    feedback.push('Vyhněte se běžným vzorům')
  }
  
  return {
    score,
    feedback,
    isStrong: score >= 6
  }
}

// Bezpečné hashování hesel
export const hashPassword = async (password: string): Promise<string> => {
  // Používej vysoký salt rounds pro admin/doctor hesla
  const saltRounds = 14 // Vyšší než standardní 12
  return bcrypt.hash(password, saltRounds)
}

// Audit logging pro bezpečnostní události
export const auditLog = (event: string, details: any, req: Request) => {
  const logEntry = {
    timestamp: new Date().toISOString(),
    event,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.get('User-Agent'),
    details: typeof details === 'object' ? JSON.stringify(details) : details
  }
  
  // V produkci by se logoval do bezpečného audit systému
  console.log(`🔒 AUDIT: ${JSON.stringify(logEntry)}`)
  
  // Pro kritické události okamžitě alert
  if (['ADMIN_LOGIN_FAILED', 'BRUTEFORCE_ATTACK', 'SUSPICIOUS_ACTIVITY'].includes(event)) {
    console.error(`🚨 SECURITY ALERT: ${event} - ${JSON.stringify(details)}`)
  }
}

// Session security middleware
export const enforceSecureSession = (req: Request, res: Response, next: NextFunction) => {
  // Vynucuj HTTPS v produkci
  if (process.env.NODE_ENV === 'production' && !req.secure && req.get('x-forwarded-proto') !== 'https') {
    return res.status(403).json({ error: 'HTTPS je povinné' })
  }
  
  // Security headers
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('X-Frame-Options', 'DENY')
  res.setHeader('X-XSS-Protection', '1; mode=block')
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
  
  next()
} 