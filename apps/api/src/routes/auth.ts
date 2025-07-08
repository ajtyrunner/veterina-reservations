import { Router, Request, Response, NextFunction } from 'express'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { 
  bruteForceProtection, 
  validateAuthInput, 
  auditLog,
  enforceSecureSession 
} from '../middleware/authSecurity'

const router = Router()
const prisma = new PrismaClient()

// Validace pro username-based přihlášení
const validateCredentialsInput = (req: Request, res: Response, next: NextFunction) => {
  const { username, tenantSlug } = req.body
  
  // Username validace
  if (!username || typeof username !== 'string') {
    return res.status(400).json({ error: 'Username je povinný' })
  }
  
  if (username.length < 3 || username.length > 50) {
    return res.status(400).json({ error: 'Username musí mít 3-50 znaků' })
  }
  
  // Formát: jmeno.prijmeni - pouze malá písmena, čísla, tečky a pomlčky
  if (!/^[a-z0-9.-]+$/.test(username)) {
    return res.status(400).json({ error: 'Username může obsahovat pouze malá písmena, čísla, tečky a pomlčky' })
  }
  
  // Nesmí začínat nebo končit tečkou/pomlčkou
  if (/^[.-]|[.-]$/.test(username)) {
    return res.status(400).json({ error: 'Username nesmí začínat nebo končit tečkou či pomlčkou' })
  }
  
  // TenantSlug validace
  if (tenantSlug && (typeof tenantSlug !== 'string' || !/^[a-z0-9-]+$/.test(tenantSlug))) {
    return res.status(400).json({ error: 'Neplatný slug ordinace' })
  }
  
  console.log(`✅ Username validated: ${username}`)
  next()
}

// Endpoint pro NextAuth credentials ověření
router.post('/credentials', 
  enforceSecureSession,
  validateCredentialsInput,
  bruteForceProtection, 
  async (req, res) => {
  console.log('🔐 AUTH REQUEST:', {
    username: req.body.username,
    tenantSlug: req.body.tenantSlug,
    hasPassword: !!req.body.password
  })
  
  try {
    const { username, password, tenantSlug } = req.body

    if (!username || !password) {
      console.log('❌ Chybí username nebo heslo')
      return res.status(400).json({ error: 'Username a heslo jsou povinné' })
    }

    // Najdi tenant nejprve
    const tenant = await prisma.tenant.findUnique({
      where: { slug: tenantSlug },
      select: { id: true, slug: true }
    })

    if (!tenant) {
      console.log('❌ Tenant not found:', tenantSlug)
      auditLog('LOGIN_FAILED', { username, reason: 'tenant_not_found', tenantSlug }, req)
      res.locals.trackFailedAttempt?.()
      return res.status(401).json({ error: 'Neplatné přihlašovací údaje' })
    }

    // Najdi uživatele podle username a tenant (pouze INTERNAL provider)
    const userRecord = await prisma.user.findFirst({
      where: { 
        username: username,
        tenantId: tenant.id,
        authProvider: 'INTERNAL',
        isActive: true
      },
      include: {
        tenant: {
          select: {
            slug: true
          }
        }
      }
    })
    
    console.log('🔍 User found:', userRecord ? 'YES' : 'NO')

    if (!userRecord || !userRecord.password) {
      console.log('❌ User not found or no password')
      // Zaloguj neúspěšný pokus
      auditLog('LOGIN_FAILED', { username, reason: 'user_not_found', tenantSlug }, req)
      res.locals.trackFailedAttempt?.()
      return res.status(401).json({ error: 'Neplatné přihlašovací údaje' })
    }

    // Ověř heslo
    if (process.env.NODE_ENV === 'development') {
      console.log('🔑 Checking password...')
    }
    const passwordMatch = await bcrypt.compare(password, userRecord.password)
    if (process.env.NODE_ENV === 'development') {
      console.log('🔑 Password match:', passwordMatch ? 'YES' : 'NO')
    }
    
    if (!passwordMatch) {
      if (process.env.NODE_ENV === 'development') {
        console.log('❌ Password mismatch')
      }
      // Zaloguj neúspěšný pokus
      auditLog('LOGIN_FAILED', { username, reason: 'password_mismatch', tenantSlug }, req)
      res.locals.trackFailedAttempt?.()
      return res.status(401).json({ error: 'Neplatné přihlašovací údaje' })
    }

    // Pouze doktoři a admini můžou používat credentials
    if (userRecord.role !== 'DOCTOR' && userRecord.role !== 'ADMIN') {
      auditLog('LOGIN_FAILED', { username, reason: 'insufficient_permissions', role: userRecord.role, tenantSlug }, req)
      res.locals.trackFailedAttempt?.()
      return res.status(403).json({ error: 'Nedostatečná oprávnění' })
    }

    // Aktualizuj auditní informace při úspěšném přihlášení
    const clientIp = req.ip || req.socket.remoteAddress || req.headers['x-forwarded-for'] as string || 'unknown'
    
    await prisma.user.update({
      where: { id: userRecord.id },
      data: {
        lastLoginAt: new Date(),
        lastLoginIp: clientIp,
        loginCount: {
          increment: 1
        }
      }
    })

    // Úspěšné přihlášení - clear failed attempts a zaloguj
    res.locals.clearFailedAttempts?.()
    auditLog('LOGIN_SUCCESS', { 
      username, 
      role: userRecord.role, 
      tenant: userRecord.tenant.slug,
      ip: clientIp
    }, req)
    
    // Vrať údaje pro NextAuth
    console.log('✅ Auth successful for:', userRecord.username)
    res.json({
      id: userRecord.id,
      email: userRecord.email,
      username: userRecord.username,
      name: userRecord.name,
      image: userRecord.image,
      role: userRecord.role,
      tenant: userRecord.tenant.slug,
      tenantId: userRecord.tenantId,
    })
  } catch (error) {
    console.error('Chyba při ověřování credentials:', error)
    res.status(500).json({ error: 'Interní chyba serveru' })
  }
})

// Vytvoření uživatele pro Google OAuth
router.post('/google-user', async (req, res) => {
  try {
    const { email, name, image, phone, tenantSlug } = req.body

    if (!email) {
      return res.status(400).json({ error: 'Email je povinný' })
    }

    // Najdi tenant
    const tenant = await prisma.tenant.findUnique({
      where: { slug: tenantSlug || 'svahy' },
    })

    if (!tenant) {
      return res.status(404).json({ error: 'Tenant nenalezen' })
    }

    // Zkontroluj, jestli uživatel už existuje
    const existingUser = await prisma.user.findFirst({
      where: { 
        email,
        authProvider: 'GOOGLE',
        tenantId: tenant.id
      },
    })

    if (existingUser) {
      // Aktualizuj auditní informace při přihlášení přes Google
      const clientIp = req.ip || req.socket.remoteAddress || req.headers['x-forwarded-for'] as string || 'unknown'
      
      await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          lastLoginAt: new Date(),
          lastLoginIp: clientIp,
          loginCount: {
            increment: 1
          },
          name: name || existingUser.name, // Aktualizuj jméno pokud se změnilo
          image: image || existingUser.image, // Aktualizuj avatar pokud se změnil
        }
      })

      // Zaloguj úspěšné přihlášení
      auditLog('LOGIN_SUCCESS', { 
        email, 
        role: existingUser.role, 
        tenant: tenant.slug,
        provider: 'GOOGLE',
        ip: clientIp
      }, req)

      return res.json(existingUser)
    }

    // Vytvoř nového uživatele s phone z OAuth
    const clientIp = req.ip || req.socket.remoteAddress || req.headers['x-forwarded-for'] as string || 'unknown'
    
    const newUser = await prisma.user.create({
      data: {
        email,
        name,
        image,
        phone, // Phone z Google OAuth profilu
        authProvider: 'GOOGLE',
        tenantId: tenant.id,
        role: 'CLIENT',
        // ✅ OPRAVA: Nastavit auditní informace při prvotním přihlášení
        lastLoginAt: new Date(),
        lastLoginIp: clientIp,
        loginCount: 1,
      },
    })

    // ✅ OPRAVA: Zaloguj úspěšné přihlášení i pro nové uživatele
    auditLog('LOGIN_SUCCESS', { 
      email, 
      role: 'CLIENT', 
      tenant: tenant.slug,
      provider: 'GOOGLE',
      ip: clientIp,
      isNewUser: true
    }, req)

    console.log('✅ Created Google OAuth user with audit info:', { 
      email, 
      phone: phone || 'none',
      lastLoginAt: newUser.lastLoginAt,
      loginCount: newUser.loginCount 
    })
    res.json({ success: true })
  } catch (error) {
    console.error('Chyba při vytváření Google uživatele:', error)
    res.status(500).json({ error: 'Interní chyba serveru' })
  }
})

// Načtení informací o uživateli
router.post('/user-info', async (req, res) => {
  try {
    const { email } = req.body

    if (!email) {
      return res.status(400).json({ error: 'Email je povinný' })
    }

    const user = await prisma.user.findFirst({
      where: { email },
      include: { 
        tenant: true, 
        doctor: true 
      },
    })

    if (!user) {
      return res.status(404).json({ error: 'Uživatel nenalezen' })
    }

    res.json({
      id: user.id,
      role: user.role,
      tenant: user.tenant.slug,
      tenantId: user.tenantId,
      isDoctor: !!user.doctor,
    })
  } catch (error) {
    console.error('Chyba při načítání uživatele:', error)
    res.status(500).json({ error: 'Interní chyba serveru' })
  }
})

export default router 