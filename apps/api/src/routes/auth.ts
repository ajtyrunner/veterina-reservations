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
    const user = await prisma.$queryRaw<Array<{
      id: string
      email: string
      name: string | null
      image: string | null
      password: string | null
      role: string
      tenantId: string
      tenantSlug: string
    }>>`
      SELECT u.id, u.email, u.name, u.image, u.password, u.role, u."tenantId", t.slug as "tenantSlug"
      FROM "User" u
      JOIN "Tenant" t ON u."tenantId" = t.id
      WHERE u.email = ${email}
    `
    
    const userRecord = user[0]
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
    if (tenantSlug && userRecord.tenantSlug !== tenantSlug) {
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
      tenant: userRecord.tenantSlug,
      tenantId: userRecord.tenantId,
    })
  } catch (error) {
    console.error('Chyba při ověřování credentials:', error)
    res.status(500).json({ error: 'Interní chyba serveru' })
  }
})

export default router 