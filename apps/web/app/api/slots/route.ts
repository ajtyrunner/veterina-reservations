import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../auth'
import jwt from 'jsonwebtoken'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    console.log('=== DEBUG: Next.js GET session ===')
    console.log('session.user:', JSON.stringify(session?.user, null, 2))
    
    if (!session || !['DOCTOR', 'ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Vytvoř JWT token pro API
    const token = jwt.sign(
      {
        sub: session.user.userId,
        email: session.user.email,
        role: session.user.role,
        tenant: session.user.tenantId, // Používej tenantId (skutečné ID, ne slug)
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (60 * 60), // 1 hodina
      },
      process.env.NEXTAUTH_SECRET!
    )

    // Volej Express API
    const response = await fetch(`${process.env.API_URL}/api/doctor/slots`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      let errorMessage = 'Chyba při komunikaci s API'
      try {
        const errorData = await response.json()
        errorMessage = errorData.error || errorMessage
      } catch (parseError) {
        const errorText = await response.text()
        errorMessage = errorText || errorMessage
      }
      return NextResponse.json({ error: errorMessage }, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error in slots API:', error)
    return NextResponse.json({ error: 'Interní chyba serveru' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    console.log('=== DEBUG: Next.js session ===')
    console.log('session.user:', JSON.stringify(session?.user, null, 2))
    
    if (!session || !['DOCTOR', 'ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    // Vytvoř JWT token pro API
    const token = jwt.sign(
      {
        sub: session.user.userId,
        email: session.user.email,
        role: session.user.role,
        tenant: session.user.tenantId, // Používej tenantId (skutečné ID, ne slug)
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (60 * 60), // 1 hodina
      },
      process.env.NEXTAUTH_SECRET!
    )

    // Volej Express API
    const response = await fetch(`${process.env.API_URL}/api/doctor/slots`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      let errorMessage = 'Chyba při komunikaci s API'
      try {
        const errorData = await response.json()
        errorMessage = errorData.error || errorMessage
      } catch (parseError) {
        const errorText = await response.text()
        errorMessage = errorText || errorMessage
      }
      return NextResponse.json({ error: errorMessage }, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error in slots API:', error)
    return NextResponse.json({ error: 'Interní chyba serveru' }, { status: 500 })
  }
} 