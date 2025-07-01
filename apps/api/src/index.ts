import * as dotenv from 'dotenv'
import path from 'path'
import fs from 'fs'
import express from 'express'
import cors from 'cors'
import { PrismaClient } from '@prisma/client'
import jwt from 'jsonwebtoken'
import { authMiddleware } from './middleware/auth'
import protectedRouter from './routes/protected'
import authRouter from './routes/auth'

// Načtení .env souboru z kořenového adresáři projektu
const envPath = path.resolve(__dirname, '../../../.env')
console.log('Current directory:', __dirname)
console.log('Loading .env from:', envPath)
console.log('File exists:', fs.existsSync(envPath))
if (fs.existsSync(envPath)) {
  console.log('File contents:', fs.readFileSync(envPath, 'utf8'))
}

const result = dotenv.config({ path: envPath })
if (result.error) {
  console.error('Error loading .env:', result.error)
} else {
  console.log('.env loaded successfully')
}

// Debug výpis pro kontrolu proměnných prostředí
console.log('Environment variables:')
console.log('DATABASE_URL:', process.env.DATABASE_URL)
console.log('NEXTAUTH_SECRET:', process.env.NEXTAUTH_SECRET ? 'is set' : 'is not set')
console.log('PORT:', process.env.PORT)

// Až po načtení .env importujeme ostatní moduly
const app = express()

// Inicializace Prisma klienta až po načtení proměnných prostředí
const prisma = new PrismaClient()

// CORS konfigurace pro Vercel
const corsOptions = {
  origin: [
    'http://localhost:3000',
    'http://svahy.lvh.me:3000',
    'https://veterina-reservations.vercel.app',
    process.env.FRONTEND_URL,
    process.env.NEXTAUTH_URL
  ].filter((url): url is string => Boolean(url)),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With'],
}

// Middleware
app.use(cors(corsOptions))

// Timezone nastavení pro server
process.env.TZ = 'Europe/Prague'

// Debug logging pro CORS a timezone
app.use((req, res, next) => {
  console.log(`🌐 ${req.method} ${req.path} from origin: ${req.get('origin') || 'no-origin'}`)
  console.log(`🕐 Server time: ${new Date().toISOString()} (${new Date().toLocaleString('cs-CZ', { timeZone: 'Europe/Prague' })})`)
  next()
})

app.use(express.json())

// Explicitní OPTIONS handler pro preflight requests
app.options('*', (req, res) => {
  console.log(`✈️ PREFLIGHT: ${req.method} ${req.path}`)
  res.status(200).end()
})

// Healthcheck endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'veterina-api'
  })
})

// Veřejné API pro získání informací o tenantovi
app.get('/api/public/tenant/:slug', async (req, res) => {
  try {
    const { slug } = req.params
    const tenant = await prisma.tenant.findUnique({
      where: { slug },
      select: {
        id: true,
        slug: true,
        name: true,
        logoUrl: true,
        primaryColor: true,
        secondaryColor: true,
      },
    })

    if (!tenant) {
      return res.status(404).json({ error: 'Tenant nenalezen' })
    }

    res.json(tenant)
  } catch (error) {
    console.error('Chyba při načítání tenanta:', error)
    res.status(500).json({ error: 'Interní chyba serveru' })
  }
})

// Veřejné API pro získání dostupných slotů
app.get('/api/public/slots/:tenantId', async (req, res) => {
  try {
    const { tenantId } = req.params
    const { doctorId, serviceTypeId, date } = req.query

    const where: any = {
      tenantId,
      isAvailable: true,
    }

    if (doctorId) {
      where.doctorId = doctorId
    }

    if (serviceTypeId) {
      where.serviceTypeId = serviceTypeId
    }

    if (date) {
      const startDate = new Date(date as string)
      const endDate = new Date(startDate)
      endDate.setDate(startDate.getDate() + 1)
      
      where.startTime = {
        gte: startDate,
        lt: endDate,
      }
    }

    const slots = await prisma.slot.findMany({
      where,
      include: {
        doctor: {
          include: {
            user: {
              select: {
                name: true,
              },
            },
          },
        },
        // room a serviceType se načítají podle roomId a serviceTypeId
        reservations: {
          where: {
            status: {
              in: ['PENDING', 'CONFIRMED']
            }
          }
        },
      },
      orderBy: {
        startTime: 'asc',
      },
    })

    // Filtrovat pouze dostupné sloty (bez aktivních rezervací)
    const availableSlots = slots.filter((slot: any) => slot.reservations.length === 0)

    res.json(availableSlots)
  } catch (error) {
    console.error('Chyba při načítání slotů:', error)
    res.status(500).json({ error: 'Interní chyba serveru' })
  }
})

// Veřejné API pro získání doktorů
app.get('/api/public/doctors/:tenantId', async (req, res) => {
  try {
    const { tenantId } = req.params

    const doctors = await prisma.doctor.findMany({
      where: { tenantId },
      include: {
        user: {
          select: {
            name: true,
            image: true,
          },
        },
      },
    })

    res.json(doctors)
  } catch (error) {
    console.error('Chyba při načítání doktorů:', error)
    res.status(500).json({ error: 'Interní chyba serveru' })
  }
})

// Veřejné API pro získání service types
app.get('/api/public/service-types/:tenantId', async (req, res) => {
  try {
    const { tenantId } = req.params

    const serviceTypes = await prisma.serviceType.findMany({
      where: { 
        tenantId,
        isActive: true 
      },
      select: {
        id: true,
        name: true,
        description: true,
        duration: true,
        price: true,
        color: true,
      },
      orderBy: {
        name: 'asc',
      },
    })

    res.json(serviceTypes)
  } catch (error) {
    console.error('Chyba při načítání service types:', error)
    res.status(500).json({ error: 'Interní chyba serveru' })
  }
})

// Auth routes - bez autentizace  
app.use('/api/auth', authRouter)

// Chráněné routes - vše ostatní pod /api vyžaduje autentizaci
app.use('/api', authMiddleware, protectedRouter)

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Endpoint nenalezen' })
})

// Error handler
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Server error:', err)
  res.status(500).json({ error: 'Interní chyba serveru' })
})

// Keepalive pro Railway databázi
import { startDatabaseKeepalive } from './utils/keepalive'

const PORT = process.env.PORT || 8000

app.listen(PORT, () => {
  console.log(`🚀 API server běží na portu ${PORT}`)
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`)
  console.log(`💚 Health check: http://localhost:${PORT}/health`)
  
  // Spustit keepalive po startu serveru
  startDatabaseKeepalive(prisma)
})

export default app
