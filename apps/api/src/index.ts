import * as dotenv from 'dotenv'
import path from 'path'
import fs from 'fs'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { PrismaClient } from '@prisma/client'
import jwt from 'jsonwebtoken'
import { authMiddleware } from './middleware/auth'
import { basicRateLimit, strictRateLimit } from './middleware/rateLimiter'
import protectedRouter from './routes/protected'
import authRouter from './routes/auth'
import { parsePragueDateTime, parseTimezoneDateTime, getStartOfDayInTimezone, getEndOfDayInTimezone } from './utils/timezone'
import { getCachedTenantTimezone } from './utils/tenant'
import { NotificationService } from './services/notificationService'

// Načtení .env souboru pouze v development prostředí
if (process.env.NODE_ENV !== 'production') {
  const envPath = path.resolve(__dirname, '../../../.env')
  if (process.env.NODE_ENV === 'development') {
    console.log('Current directory:', __dirname)
    console.log('Loading .env from:', envPath)
    console.log('File exists:', fs.existsSync(envPath))
  }
  
  const result = dotenv.config({ path: envPath })
  if (result.error) {
    console.error('Error loading .env:', result.error)
  } else if (process.env.NODE_ENV === 'development') {
    console.log('.env loaded successfully')
  }
} else {
  console.log('Production mode - using Railway environment variables')
}

// Debug výpis pro kontrolu proměnných prostředí - pouze v development
if (process.env.NODE_ENV === 'development') {
  console.log('Environment variables:')
  console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'is set' : 'is not set')
  console.log('NEXTAUTH_SECRET:', process.env.NEXTAUTH_SECRET ? 'is set' : 'is not set')
  console.log('PORT:', process.env.PORT)
}

const app = express()
const PORT = parseInt(process.env.PORT || '8080', 10)

// CORS konfigurace - podmíněná podle prostředí
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? [
        'https://veterina-reservations.vercel.app',
        process.env.FRONTEND_URL,
        process.env.NEXTAUTH_URL,
        'https://veterina-reservations-production.up.railway.app'  // Přidáme Railway URL
      ].filter((url): url is string => Boolean(url))
    : [
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

// Trust proxy - MUST be before rate limit middleware
app.set('trust proxy', 1)

// Apply CORS to all routes
app.use(cors(corsOptions))

// Healthcheck endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'veterina-api',
    port: PORT
  })
})

// BEZPEČNOSTNÍ MIDDLEWARE - aplikovat jako první
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false, // Pro development compatibility
}))

// Rate limiting pro všechny requesty
app.use(basicRateLimit)

// Inicializace Prisma klienta až po načtení proměnných prostředí
const prisma = new PrismaClient()

// Inicializace notification service
const notificationService = new NotificationService(prisma)

// GLOBAL HTTPS ENFORCEMENT - před všemi ostatními middleware
app.use((req, res, next) => {
  if (process.env.NODE_ENV === 'production' && !req.secure && req.get('x-forwarded-proto') !== 'https') {
    return res.redirect(301, `https://${req.headers.host}${req.url}`)
  }
  next()
})

// Global security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('X-Frame-Options', 'DENY')
  res.setHeader('X-XSS-Protection', '1; mode=block')
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), location=()')
  next()
})

// Timezone nastavení pro server
process.env.TZ = 'Europe/Prague'

// Debug logging pro CORS a timezone - pouze v development
app.use((req, res, next) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`🌐 ${req.method} ${req.path} from origin: ${req.get('origin') || 'no-origin'}`)
    console.log(`🕐 Server time: ${new Date().toISOString()} (${new Date().toLocaleString('cs-CZ', { timeZone: 'Europe/Prague' })})`)
  }
  next()
})

app.use(express.json())

// Explicitní OPTIONS handler pro preflight requests
app.options('*', (req, res) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`✈️ PREFLIGHT: ${req.method} ${req.path}`)
  }
  res.status(200).end()
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
        timezone: true,
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

// Chráněné API pro získání dostupných slotů
app.get('/api/slots/:tenantId', authMiddleware, async (req, res) => {
  try {
    const { tenantId } = req.params
    const { doctorId, serviceTypeId, date } = req.query

    const where: any = {
      tenantId,
      isAvailable: true,
      doctor: {
        user: {
          isActive: true
        }
      }
    }

    if (doctorId) {
      where.doctorId = doctorId
    }

    if (serviceTypeId) {
      where.serviceTypeId = serviceTypeId
    }

    if (date) {
      const inputDate = date as string
      const tenantTimezone = await getCachedTenantTimezone(prisma, tenantId)
      const startDateUTC = getStartOfDayInTimezone(inputDate, tenantTimezone)
      const endDateUTC = getEndOfDayInTimezone(inputDate, tenantTimezone)
      
      // Rozšířené debug logování i pro produkci
      console.log('🔍 Timezone filtering debug:')
      console.log('- Input date:', inputDate)
      console.log('- Tenant timezone:', tenantTimezone)
      console.log('- Start UTC:', startDateUTC.toISOString())
      console.log('- End UTC:', endDateUTC.toISOString())
      console.log('- Server TZ:', process.env.TZ)
      console.log('- Current server time:', new Date().toISOString())
      console.log('- Where condition:', JSON.stringify({
        startTime: {
          gte: startDateUTC,
          lte: endDateUTC,
        }
      }, null, 2))

      where.startTime = {
        gte: startDateUTC,
        lte: endDateUTC,
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
        room: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
        serviceType: {
          select: {
            id: true,
            name: true,
            description: true,
            duration: true,
            color: true,
          },
        },
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

    const availableSlots = slots.filter((slot: any) => slot.reservations.length === 0)

    res.json(availableSlots)
  } catch (error) {
    console.error('Chyba při načítání slotů:', error)
    res.status(500).json({ error: 'Interní chyba serveru' })
  }
})

// Poznámka: Endpoint pro doktory je nyní v protected.ts jako /api/doctors s role-based přístupem

// Chráněné API pro získání service types
app.get('/api/service-types/:tenantId', authMiddleware, async (req, res) => {
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

// Auth routes - bez autentizace, ale s přísným rate limitingem
app.use('/api/auth', strictRateLimit, authRouter)

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

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 API server běží na portu ${PORT}`)
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`)
  if (process.env.NODE_ENV === 'production') {
    console.log(`💚 Health check endpoint: ${process.env.FRONTEND_URL}/health`)
  } else {
    console.log(`💚 Health check: http://localhost:${PORT}/health`)
  }

  startDatabaseKeepalive(prisma)
})

// Export pro použití v routách
export { prisma, notificationService }

export default app
