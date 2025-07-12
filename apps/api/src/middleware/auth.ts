import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

interface JWTPayload {
  sub: string
  email: string
  role: string
  tenant: string
  tenantId?: string
  iat: number
  exp: number
}

declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload
    }
  }
}

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Chybí nebo neplatný authorization header' })
    }

    const token = authHeader.substring(7) // Odstraní "Bearer " prefix
    const secret = process.env.NEXTAUTH_SECRET

    if (!secret) {
      console.error('NEXTAUTH_SECRET není nastavený')
      return res.status(500).json({ error: 'Chyba konfigurace serveru' })
    }

    const decoded = jwt.verify(token, secret) as JWTPayload
    req.user = decoded
    
    if (process.env.NODE_ENV === 'development') {
      console.log('🔐 JWT decoded:', {
        sub: decoded.sub,
        tenant: decoded.tenant,
        tenantId: decoded.tenantId,
        role: decoded.role
      })
    }
    
    // Kontrola tenant přístupu
    const requestedTenantSlug = req.headers['x-tenant-slug'] as string
    if (requestedTenantSlug && decoded.tenant !== requestedTenantSlug) {
      console.error('🚫 Tenant mismatch:', {
        requestedTenant: requestedTenantSlug,
        userTenant: decoded.tenant,
        userId: decoded.sub
      })
      return res.status(403).json({ error: 'Přístup zamítnut - nesprávný tenant' })
    }
    
    next()
  } catch (error) {
    console.error('JWT verification error:', error)
    return res.status(401).json({ error: 'Neplatný token' })
  }
}
