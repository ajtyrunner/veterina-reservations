import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const router = Router()
const prisma = new PrismaClient()

// Endpoint pro NextAuth credentials ověření
router.post('/credentials', async (req, res) => {
  console.log('🔐 AUTH REQUEST:', {
    email: req.body.email,
    tenantSlug: req.body.tenantSlug,
    hasPassword: !!req.body.password
  })
  
  try {
    const { email, password, tenantSlug } = req.body

    if (!email || !password) {
      console.log('❌ Chybí email nebo heslo')
      return res.status(400).json({ error: 'Email a heslo jsou povinné' })
    }

    // Najdi uživatele v databázi (s heslem pro ověření)
    const userRecord = await prisma.user.findUnique({
      where: { email },
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
      return res.status(401).json({ error: 'Neplatné přihlašovací údaje' })
    }

    // Ověř heslo
    console.log('🔑 Checking password...')
    const passwordMatch = await bcrypt.compare(password, userRecord.password)
    console.log('🔑 Password match:', passwordMatch ? 'YES' : 'NO')
    
    if (!passwordMatch) {
      console.log('❌ Password mismatch')
      return res.status(401).json({ error: 'Neplatné přihlašovací údaje' })
    }

    // Ověř, že se přihlašuje ke správnému tenantovi
    if (tenantSlug && userRecord.tenant.slug !== tenantSlug) {
      return res.status(401).json({ error: 'Nepatříte k této ordinaci' })
    }

    // Pouze doktoři a admini můžou používat credentials
    if (userRecord.role !== 'DOCTOR' && userRecord.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Nedostatečná oprávnění' })
    }

    // Vrať údaje pro NextAuth
    console.log('✅ Auth successful for:', userRecord.email)
    res.json({
      id: userRecord.id,
      email: userRecord.email,
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
    const { email, name, image, tenantSlug } = req.body

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
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      // Ověř, že patří ke správnému tenantovi
      if (existingUser.tenantId === tenant.id) {
        return res.json({ success: true })
      } else {
        return res.status(403).json({ error: 'Uživatel patří k jinému tenantovi' })
      }
    }

    // Vytvoř nového uživatele
    await prisma.user.create({
      data: {
        email,
        name,
        image,
        tenantId: tenant.id,
        role: 'CLIENT',
      },
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

    const user = await prisma.user.findUnique({
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