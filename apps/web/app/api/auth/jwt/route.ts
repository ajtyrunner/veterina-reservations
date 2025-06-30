import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../../auth'
import jwt from 'jsonwebtoken'

// Endpoint pro získání JWT tokenu pro volání Railway API
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized - nejste přihlášeni' }, { status: 401 })
    }

    // Vytvoř JWT token pro Railway API
    const token = jwt.sign(
      {
        sub: session.user.userId,
        email: session.user.email,
        role: session.user.role,
        tenant: session.user.tenantId,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (60 * 60), // 1 hodina
      },
      process.env.NEXTAUTH_SECRET!
    )

    return NextResponse.json({ 
      token,
      user: {
        userId: session.user.userId,
        email: session.user.email,
        role: session.user.role,
        tenantId: session.user.tenantId
      }
    })
  } catch (error) {
    console.error('Chyba při generování JWT:', error)
    return NextResponse.json({ error: 'Interní chyba serveru' }, { status: 500 })
  }
} 