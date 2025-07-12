import { getToken } from 'next-auth/jwt'
import { NextRequest, NextResponse } from 'next/server'
import { getTenantSlugFromHostname } from '@/lib/tenant'

export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ 
      req: request,
      secret: process.env.NEXTAUTH_SECRET
    })
    
    if (!token) {
      return NextResponse.json(null)
    }
    
    // Získej aktuální tenant z URL
    const hostname = request.headers.get('host') || ''
    const currentTenant = getTenantSlugFromHostname(hostname)
    
    // Zkontroluj tenant shodu
    if (token.tenant && currentTenant && token.tenant !== currentTenant) {
      console.log('🚫 Tenant mismatch in session endpoint:', {
        currentTenant,
        userTenant: token.tenant
      })
      // Vrať null = žádná session
      return NextResponse.json(null)
    }
    
    // Return session data from JWT token
    return NextResponse.json({
      user: {
        email: token.email,
        name: token.name,
        role: token.role,
        tenant: token.tenant,
        tenantId: token.tenantId,
        userId: token.userId,
        username: token.preferred_username
      },
      expires: new Date(token.exp! * 1000).toISOString()
    })
  } catch (error) {
    console.error('Session endpoint error:', error)
    return NextResponse.json(null)
  }
}