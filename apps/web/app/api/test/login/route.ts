import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/auth'
import { encode } from 'next-auth/jwt'

export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Test endpoint not available in production' }, { status: 403 })
  }

  const body = await request.json()
  const { email, name, role = 'CLIENT', tenantSlug = 'svahy', authProvider = 'GOOGLE' } = body

  const token = await encode({
    token: {
      sub: `test-user-${Date.now()}`,
      email,
      name,
      role,
      tenant: tenantSlug,
      tenantId: 'cmcnc71yq000002d85r0vxnac',
      authProvider,
      isDoctor: role === 'DOCTOR',
      preferred_username: email,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60,
    },
    secret: process.env.NEXTAUTH_SECRET!,
  })

  const response = NextResponse.json({ success: true })
  
  response.cookies.set({
    name: 'next-auth.session-token',
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    domain: '.lvh.me',
    maxAge: 24 * 60 * 60
  })

  return response
}