import rateLimit from 'express-rate-limit'
import { Request, Response } from 'express'

// Základní rate limiter pro všechny API endpointy
export const basicRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minut
  max: process.env.NODE_ENV === 'development' ? 1000 : 100, // Development: 1000, Production: 100 požadavků
  message: {
    error: 'Příliš mnoho požadavků. Zkuste to prosím později.',
    retryAfter: 15 * 60 // 15 minut v sekundách
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Custom key generator pro lepší tracking
  keyGenerator: (req: Request) => {
    return req.ip || 'unknown'
  },
  // V development skipujeme rate limiting pro localhost
  skip: (req: Request) => {
    if (process.env.NODE_ENV === 'development') {
      const ip = req.ip || ''
      return ip.includes('127.0.0.1') || ip.includes('::1') || ip.includes('localhost')
    }
    return false
  }
})

// Přísný limiter pro citlivé operace (přihlášení, registrace)
export const strictRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minut
  max: 5, // max 5 pokusů za 15 minut
  message: {
    error: 'Příliš mnoho pokusů o přihlášení. Zkuste to prosím za 15 minut.',
    retryAfter: 15 * 60
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Nepočítej úspěšné požadavky
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
  max: process.env.NODE_ENV === 'development' ? 100 : 20, // Development: 100, Production: 20 vytvoření za 5 minut
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