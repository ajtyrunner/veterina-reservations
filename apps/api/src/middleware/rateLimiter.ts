import rateLimit from 'express-rate-limit'
import { Request, Response } from 'express'

// Základní rate limiter pro všechny API endpointy
export const basicRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minut
  max: process.env.NODE_ENV === 'development' ? 1000 : 500, // Development: 1000, Production: 500 požadavků
  message: {
    error: 'Příliš mnoho požadavků. Zkuste to prosím později.',
    retryAfter: 15 * 60 // 15 minut v sekundách
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Custom key generator pro lepší tracking - per IP + tenant
  keyGenerator: (req: Request) => {
    const tenantSlug = req.headers['x-tenant-slug'] || 'default'
    const ip = req.ip || 'unknown'
    return `${ip}-${tenantSlug}`
  },
  // V development skipujeme rate limiting pro localhost a lvh.me
  skip: (req: Request) => {
    if (process.env.NODE_ENV === 'development') {
      const ip = req.ip || ''
      const host = req.get('host') || ''
      return ip.includes('127.0.0.1') || 
             ip.includes('::1') || 
             ip.includes('localhost') ||
             host.includes('lvh.me') ||
             host.includes('localhost')
    }
    return false
  }
})

// Přísný limiter pro citlivé operace (přihlášení, registrace)
export const strictRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minut
  max: process.env.DISABLE_RATE_LIMIT === 'true' ? 1000 : 10, // Disabled: 1000, Normal: 10 pokusů za 15 minut
  message: {
    error: 'Příliš mnoho pokusů o přihlášení. Zkuste to prosím za 15 minut.',
    retryAfter: 15 * 60
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Nepočítej úspěšné požadavky
  keyGenerator: (req: Request) => {
    const tenantSlug = req.headers['x-tenant-slug'] || 'default'
    const ip = req.ip || 'unknown'
    return `${ip}-${tenantSlug}-auth`
  },
  skip: (req: Request) => {
    // Skip rate limiting if disabled in development
    return process.env.NODE_ENV === 'development' && process.env.DISABLE_RATE_LIMIT === 'true'
  }
})

// Limiter pro bulk operace
export const bulkOperationLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hodina
  max: 10, // max 10 bulk operací za hodinu
  message: {
    error: 'Limit pro hromadné operace byl překročen. Zkuste to prosím za hodinu.',
    retryAfter: 60 * 60
  },
  standardHeaders: true,
  legacyHeaders: false,
})

// Limiter pro vytváření slotů/rezervací
export const createOperationLimit = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minut
  max: process.env.NODE_ENV === 'development' ? 100 : 50, // Development: 100, Production: 50 vytvoření za 5 minut
  message: {
    error: 'Příliš rychlé vytváření. Zkuste to prosím za chvíli.',
    retryAfter: 5 * 60
  },
  standardHeaders: true,
  legacyHeaders: false,
  // V development skipujeme rate limiting pro localhost
  skip: (req: Request) => {
    if (process.env.NODE_ENV === 'development') {
      const ip = req.ip || ''
      return ip.includes('127.0.0.1') || ip.includes('::1') || ip.includes('localhost')
    }
    return false
  }
}) 