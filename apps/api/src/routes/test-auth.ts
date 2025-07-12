import { Router } from 'express'
import jwt from 'jsonwebtoken'
import { PrismaClient, AuthProvider, UserRole } from '@prisma/client'

const router = Router()
const prisma = new PrismaClient()

/**
 * TEST-ONLY endpoint pro mockování Google OAuth
 * Vytvoří nebo najde uživatele s GOOGLE providerem a vrátí JWT token
 * 
 * BEZPEČNOST: Tento endpoint MUSÍ být dostupný pouze v TEST prostředí!
 */
router.post('/test/mock-google-login', async (req, res) => {
  // Povolit pouze v test prostředí
  if (process.env.NODE_ENV !== 'test' && process.env.NODE_ENV !== 'development') {
    return res.status(403).json({ error: 'Forbidden in production' })
  }

  const { email, name, tenantSlug = 'svahy' } = req.body

  if (!email) {
    return res.status(400).json({ error: 'Email is required' })
  }

  try {
    // Najdi tenant
    const tenant = await prisma.tenant.findUnique({
      where: { slug: tenantSlug }
    })

    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' })
    }

    // Vytvoř nebo najdi uživatele s GOOGLE providerem
    // DŮLEŽITÉ: Google OAuth je VŽDY pouze pro roli CLIENT
    const user = await prisma.user.upsert({
      where: {
        unique_email_provider_tenant: {
          email,
          authProvider: AuthProvider.GOOGLE,
          tenantId: tenant.id
        }
      },
      update: {
        lastLoginAt: new Date(),
        loginCount: { increment: 1 },
        lastLoginIp: req.ip || 'test',
        name: name || user.name
      },
      create: {
        email,
        name: name || 'Test Google User',
        authProvider: AuthProvider.GOOGLE,
        role: UserRole.CLIENT, // Google OAuth je VŽDY CLIENT
        tenantId: tenant.id,
        isActive: true,
        image: `https://ui-avatars.com/api/?name=${encodeURIComponent(name || email)}`,
        // Google users nemají username ani password
        username: null,
        password: null,
        phone: null,
        lastLoginAt: new Date(),
        loginCount: 1,
        lastLoginIp: req.ip || 'test'
      },
      include: {
        tenant: true,
        doctor: false // Google users nemohou být doktoři
      }
    })

    // Vytvoř JWT token stejný jako by vytvořil NextAuth
    const token = jwt.sign(
      {
        sub: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
        role: UserRole.CLIENT, // Google OAuth je VŽDY CLIENT
        tenant: tenant.slug,
        tenantId: tenant.id,
        isDoctor: false, // Google users nemohou být doktoři
        preferred_username: user.email, // Google users používají email jako username
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 hodin
        // Google OAuth specific claims
        provider: 'google',
        providerAccountId: `google-test-${user.id}`,
        // OAuth token info (mock)
        access_token: 'mock-google-access-token',
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        token_type: 'Bearer',
        scope: 'openid email profile'
      },
      process.env.NEXTAUTH_SECRET || 'test-secret'
    )

    // Vrať response podobnou NextAuth
    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
        role: user.role,
        tenant: tenant.slug,
        tenantId: tenant.id,
        authProvider: user.authProvider
      },
      token,
      // Session cookie info pro Playwright
      sessionCookie: {
        name: 'next-auth.session-token',
        value: token,
        domain: '.lvh.me',
        path: '/',
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hodin
      }
    })

  } catch (error) {
    console.error('Mock Google login error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

/**
 * Test endpoint pro vytvoření Google test uživatelů
 * POZNÁMKA: Google OAuth podporuje pouze roli CLIENT
 */
router.post('/test/create-google-test-users', async (req, res) => {
  if (process.env.NODE_ENV !== 'test' && process.env.NODE_ENV !== 'development') {
    return res.status(403).json({ error: 'Forbidden in production' })
  }

  const { tenantSlug = 'svahy' } = req.body

  const tenant = await prisma.tenant.findUnique({
    where: { slug: tenantSlug }
  })

  if (!tenant) {
    return res.status(404).json({ error: 'Tenant not found' })
  }

  // Google OAuth podporuje pouze CLIENT roli
  const testUsers = [
    {
      email: 'google.client1@example.com',
      name: 'Google Test Client 1'
    },
    {
      email: 'google.client2@example.com',
      name: 'Google Test Client 2'
    },
    {
      email: 'google.client3@example.com',
      name: 'Google Test Client 3'
    }
  ]

  const createdUsers = []

  for (const userData of testUsers) {
    const user = await prisma.user.upsert({
      where: {
        unique_email_provider_tenant: {
          email: userData.email,
          authProvider: AuthProvider.GOOGLE,
          tenantId: tenant.id
        }
      },
      update: {
        name: userData.name
      },
      create: {
        email: userData.email,
        name: userData.name,
        authProvider: AuthProvider.GOOGLE,
        role: UserRole.CLIENT, // Google OAuth je VŽDY CLIENT
        tenantId: tenant.id,
        isActive: true,
        image: `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.name)}`
      }
    })

    createdUsers.push(user)
  }

  res.json({ 
    message: 'Test Google CLIENT users created',
    users: createdUsers,
    note: 'Google OAuth podporuje pouze roli CLIENT. Pro DOCTOR/ADMIN použijte INTERNAL provider.'
  })
})

export default router