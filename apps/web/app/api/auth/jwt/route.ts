import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/auth'
import jwt from 'jsonwebtoken'
import { getTenantSlugFromHostname } from '@/lib/tenant'
import { getToken } from 'next-auth/jwt'

// Endpoint pro získání JWT tokenu pro volání Railway API
export async function GET(request: NextRequest) {
  try {
    // Použij getToken místo getServerSession pro kontrolu tenant shody
    const token = await getToken({ 
      req: request,
      secret: process.env.NEXTAUTH_SECRET
    })
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized - nejste přihlášeni' }, { status: 401 })
    }
    
    // Získej aktuální tenant z URL
    const hostname = request.headers.get('host') || ''
    const currentTenant = getTenantSlugFromHostname(hostname)
    
    // Zkontroluj tenant shodu
    if (token.tenant && currentTenant && token.tenant !== currentTenant) {
      console.log('🚫 Tenant mismatch in JWT endpoint:', {
        currentTenant,
        userTenant: token.tenant
      })
      return NextResponse.json({ error: 'Unauthorized - tenant mismatch' }, { status: 401 })
    }

    console.log('🔐 JWT session data:', {
      userId: token.userId,
      tenant: token.tenant,
      tenantId: token.tenantId,
      role: token.role
    })

    // Vytvoř JWT token pro Railway API
    const jwtToken = jwt.sign(
      {
        sub: token.userId,
        email: token.email,
        role: token.role,
        tenant: token.tenant, // Použij tenant slug, ne tenantId
        tenantId: token.tenantId, // Přidej i tenantId pro kompatibilitu
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (60 * 60), // 1 hodina
      },
      process.env.NEXTAUTH_SECRET!
    )

    return NextResponse.json({ 
      token: jwtToken,
      user: {
        userId: token.userId,
        email: token.email,
        role: token.role,
        tenantId: token.tenantId
      }
    })
  } catch (error) {
    console.error('Chyba při generování JWT:', error)
    return NextResponse.json({ error: 'Interní chyba serveru' }, { status: 500 })
  }
} 