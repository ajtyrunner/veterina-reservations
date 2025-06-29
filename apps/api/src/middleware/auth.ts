import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

interface JWTPayload {
  sub: string
  email: string
  role: string
  tenant: string
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
    
    next()
  } catch (error) {
    console.error('JWT verification error:', error)
    return res.status(401).json({ error: 'Neplatný token' })
  }
}
