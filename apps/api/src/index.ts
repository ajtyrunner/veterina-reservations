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
import testAuthRouter from './routes/test-auth'
import publicRouter from './routes/public'
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
        'http://veterina-svahy.lvh.me:3000',
        'http://agility-nikol.lvh.me:3000',
        'https://veterina-reservations.vercel.app',
        process.env.FRONTEND_URL,
        process.env.NEXTAUTH_URL
      ].filter((url): url is string => Boolean(url)),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With', 'x-tenant-slug'],
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
app.get('/api/slots/:tenantSlug', authMiddleware, async (req, res) => {
  try {
    const { tenantSlug } = req.params
    const { doctorId, serviceTypeId, date, startDate, endDate } = req.query
    const userRole = req.user?.role
    const userTenantSlug = req.user?.tenant

    // Debug info
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 Slots endpoint debug:', {
        urlTenantSlug: tenantSlug,
        userTenantSlug,
        jwtTenant: req.user?.tenant,
        jwtTenantId: req.user?.tenantId
      })
    }

    // Kontrola, že uživatel má přístup k tomuto tenantovi
    if (userTenantSlug !== tenantSlug) {
      return res.status(403).json({ error: `Přístup odepřen - nesprávný tenant (user: ${userTenantSlug}, requested: ${tenantSlug})` })
    }

    // Najdi tenant podle slug
    const tenant = await prisma.tenant.findUnique({
      where: { slug: tenantSlug },
      select: { id: true, timezone: true }
    })

    if (!tenant) {
      return res.status(404).json({ error: 'Tenant nenalezen' })
    }

    const tenantId = tenant.id
    const tenantTimezone = tenant.timezone

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

    // Role-based filtrování času
    const isClient = userRole === 'CLIENT'
    
    if (isClient) {
      // KLIENTI - pouze sloty od zítřka
      const now = new Date()
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)
      const tomorrowDateStr = tomorrow.toLocaleDateString('sv-SE', { timeZone: tenantTimezone })
      const tomorrowStartUTC = getStartOfDayInTimezone(tomorrowDateStr, tenantTimezone)

      if (startDate && endDate) {
        // Date range query for calendar view
        const startDateUTC = getStartOfDayInTimezone(startDate as string, tenantTimezone)
        const endDateUTC = getEndOfDayInTimezone(endDate as string, tenantTimezone)
        
        const effectiveStartDate = startDateUTC >= tomorrowStartUTC ? startDateUTC : tomorrowStartUTC
        
        if (process.env.NODE_ENV === 'development') {
          console.log('🔍 CLIENT date range filtering:')
          console.log('- Start date:', startDate)
          console.log('- End date:', endDate)
          console.log('- Effective start UTC:', effectiveStartDate.toISOString())
          console.log('- End UTC:', endDateUTC.toISOString())
        }

        where.startTime = {
          gte: effectiveStartDate,
          lte: endDateUTC,
        }
      } else if (date) {
        // Single day query
        const inputDate = date as string
        const startDateUTC = getStartOfDayInTimezone(inputDate, tenantTimezone)
        const endDateUTC = getEndOfDayInTimezone(inputDate, tenantTimezone)
        
        const effectiveStartDate = startDateUTC >= tomorrowStartUTC ? startDateUTC : tomorrowStartUTC
        
        if (process.env.NODE_ENV === 'development') {
          console.log('🔍 CLIENT filtering debug:')
          console.log('- User role:', userRole)
          console.log('- Input date:', inputDate)
          console.log('- Tomorrow start UTC:', tomorrowStartUTC.toISOString())
          console.log('- Effective start UTC:', effectiveStartDate.toISOString())
        }

        where.startTime = {
          gte: effectiveStartDate,
          lte: endDateUTC,
        }
      } else {
        // Bez specifikovaného data - pouze od zítřka
        where.startTime = {
          gte: tomorrowStartUTC,
        }
        
        if (process.env.NODE_ENV === 'development') {
          console.log('🔍 CLIENT default filtering - from tomorrow:')
          console.log('- User role:', userRole)
          console.log('- Tomorrow start UTC:', tomorrowStartUTC.toISOString())
        }
      }
    } else {
      // DOKTOŘI a ADMINI - všechny sloty (včetně minulých pro správu)
      if (startDate && endDate) {
        // Date range query for calendar view
        const startDateUTC = getStartOfDayInTimezone(startDate as string, tenantTimezone)
        const endDateUTC = getEndOfDayInTimezone(endDate as string, tenantTimezone)
        
        if (process.env.NODE_ENV === 'development') {
          console.log('🔍 DOCTOR/ADMIN date range filtering:')
          console.log('- Start date:', startDate)
          console.log('- End date:', endDate)
          console.log('- Start UTC:', startDateUTC.toISOString())
          console.log('- End UTC:', endDateUTC.toISOString())
        }

        where.startTime = {
          gte: startDateUTC,
          lte: endDateUTC,
        }
      } else if (date) {
        // Single day query
        const inputDate = date as string
        const startDateUTC = getStartOfDayInTimezone(inputDate, tenantTimezone)
        const endDateUTC = getEndOfDayInTimezone(inputDate, tenantTimezone)
        
        if (process.env.NODE_ENV === 'development') {
          console.log('🔍 DOCTOR/ADMIN filtering debug:')
          console.log('- User role:', userRole)
          console.log('- Input date:', inputDate)
          console.log('- Start UTC:', startDateUTC.toISOString())
          console.log('- End UTC:', endDateUTC.toISOString())
        }

        where.startTime = {
          gte: startDateUTC,
          lte: endDateUTC,
        }
      }
      // Bez date filtru - všechny sloty (žádné časové omezení)
      
      if (process.env.NODE_ENV === 'development') {
        console.log('🔍 DOCTOR/ADMIN - no time restrictions')
        console.log('- User role:', userRole)
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
app.get('/api/service-types/:tenantSlug', authMiddleware, async (req, res) => {
  try {
    const { tenantSlug } = req.params
    const userTenantSlug = req.user?.tenant

    // Debug info
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 Service types endpoint debug:', {
        urlTenantSlug: tenantSlug,
        userTenantSlug,
        jwtTenant: req.user?.tenant,
        jwtTenantId: req.user?.tenantId
      })
    }

    // Kontrola, že uživatel má přístup k tomuto tenantovi
    if (userTenantSlug !== tenantSlug) {
      return res.status(403).json({ error: `Přístup odepřen - nesprávný tenant (user: ${userTenantSlug}, requested: ${tenantSlug})` })
    }

    // Najdi tenant podle slug
    const tenant = await prisma.tenant.findUnique({
      where: { slug: tenantSlug },
      select: { id: true }
    })

    if (!tenant) {
      return res.status(404).json({ error: 'Tenant nenalezen' })
    }

    const tenantId = tenant.id

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

// Public routes - bez autentizace
app.use('/api/public', publicRouter)

// Auth routes - bez autentizace, ale s přísným rate limitingem
app.use('/api/auth', strictRateLimit, authRouter)

// Test routes - pouze v development/test prostředí
if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
  app.use('/', testAuthRouter)
  console.log('⚠️  Test auth routes enabled - DO NOT USE IN PRODUCTION')
}

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
