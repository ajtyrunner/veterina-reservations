import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../../../auth'
import jwt from 'jsonwebtoken'

export async function GET(request: NextRequest, { params }: { params: { tenantId: string } }) {
  try {
    console.log('[Next.js API] Public doctors request started')
    const session = await getServerSession(authOptions)
    console.log('[Next.js API] Session:', session ? 'exists' : 'null')
    
    // Vyžaduj přihlášení, ale povoluj všechny role
    if (!session) {
      console.log('[Next.js API] No session found')
      return NextResponse.json({ error: 'Unauthorized - musíte být přihlášeni' }, { status: 401 })
    }

    const tenantId = params.tenantId
    console.log('[Next.js API] TenantId:', tenantId)

    // Vytvoř JWT token pro API
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

    // Volej Express API (použij localhost pro server-side kód)
    const response = await fetch(`${process.env.API_URL}/api/public/doctors/${tenantId}`, {
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
    console.error('Error in public doctors API:', error)
    return NextResponse.json({ error: 'Interní chyba serveru' }, { status: 500 })
  }
} 