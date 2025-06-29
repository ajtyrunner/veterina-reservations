import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../../../auth'
import jwt from 'jsonwebtoken'

export async function GET(request: NextRequest, { params }: { params: { tenantId: string } }) {
  try {
    console.log('[Next.js API] Public slots request started')
    const session = await getServerSession(authOptions)
    console.log('[Next.js API] Session:', session ? 'exists' : 'null')
    
    // Vyžaduj přihlášení, ale povoluj všechny role
    if (!session) {
      console.log('[Next.js API] No session found')
      return NextResponse.json({ error: 'Unauthorized - musíte být přihlášeni' }, { status: 401 })
    }

    const tenantId = params.tenantId
    console.log('[Next.js API] TenantId:', tenantId)
    
    const { searchParams } = new URL(request.url)
    const doctorId = searchParams.get('doctorId')
    const date = searchParams.get('date')
    console.log('[Next.js API] Query params - doctorId:', doctorId, 'date:', date)

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
    console.log('[Next.js API] JWT token created')

    // Sestavit URL s parametry (použij localhost pro server-side kód)
    const apiUrl = `http://localhost:4000/api/public/slots/${tenantId}`
    const queryParams = new URLSearchParams()
    if (doctorId) queryParams.append('doctorId', doctorId)
    if (date) queryParams.append('date', date)
    
    const fullUrl = queryParams.toString() ? `${apiUrl}?${queryParams}` : apiUrl
    console.log('[Next.js API] Calling Express API:', fullUrl)

    // Volej Express API
    const response = await fetch(fullUrl, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })
    console.log('[Next.js API] Express API response status:', response.status)

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
    console.error('Error in public slots API:', error)
    return NextResponse.json({ error: 'Interní chyba serveru' }, { status: 500 })
  }
}