import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../../auth'
import jwt from 'jsonwebtoken'

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    
    // Pouze doktoři a admini mohou upravovat rezervace
    if (!session || (session.user.role !== 'DOCTOR' && session.user.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized - pouze doktoři a admini' }, { status: 401 })
    }

    const reservationId = params.id
    const body = await request.json()

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

    // Volej Express API
    const response = await fetch(`http://localhost:4000/api/reservations/${reservationId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      let errorMessage = 'Chyba při aktualizaci rezervace'
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
    console.error('Error in update reservation API:', error)
    return NextResponse.json({ error: 'Interní chyba serveru' }, { status: 500 })
  }
}

// DELETE /api/reservations/[id] - Zrušit rezervaci
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Nepřihlášen' }, { status: 401 })
    }

    const reservationId = params.id

    // Vytvoř JWT token pro Express API
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

    // Volej Express API
    const response = await fetch(`http://localhost:4000/api/reservations/${reservationId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const error = await response.json()
      return NextResponse.json({ error: error.error || 'Chyba při rušení rezervace' }, { status: response.status })
    }

    return NextResponse.json({ message: 'Rezervace byla zrušena' })
  } catch (error) {
    console.error('Chyba při rušení rezervace:', error)
    return NextResponse.json({ error: 'Chyba serveru' }, { status: 500 })
  }
} 