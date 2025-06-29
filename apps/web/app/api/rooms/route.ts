import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../auth'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET /api/rooms - Získat všechny ordinace
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Nepřihlášen' }, { status: 401 })
    }

    if (session.user.role !== 'DOCTOR' && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Nedostatečná oprávnění' }, { status: 403 })
    }

    const rooms = await prisma.room.findMany({
      where: {
        tenantId: session.user.tenantId,
      },
      orderBy: {
        name: 'asc',
      },
    })

    return NextResponse.json(rooms)
  } catch (error) {
    console.error('Chyba při načítání ordinací:', error)
    return NextResponse.json({ error: 'Chyba serveru' }, { status: 500 })
  }
}

// POST /api/rooms - Vytvořit novou ordinaci
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Nepřihlášen' }, { status: 401 })
    }

    if (session.user.role !== 'DOCTOR' && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Nedostatečná oprávnění' }, { status: 403 })
    }

    const body = await request.json()
    const { name, description, capacity, isActive } = body

    if (!name) {
      return NextResponse.json({ error: 'Název je povinný' }, { status: 400 })
    }

    // Kontrola duplicitního názvu
    const existingRoom = await prisma.room.findFirst({
      where: {
        tenantId: session.user.tenantId,
        name: name,
      },
    })

    if (existingRoom) {
      return NextResponse.json({ error: 'Ordinace s tímto názvem již existuje' }, { status: 400 })
    }

    const room = await prisma.room.create({
      data: {
        name,
        description: description || null,
        capacity: capacity || 1,
        isActive: isActive !== undefined ? isActive : true,
        tenantId: session.user.tenantId,
      },
    })

    return NextResponse.json(room, { status: 201 })
  } catch (error) {
    console.error('Chyba při vytváření ordinace:', error)
    return NextResponse.json({ error: 'Chyba serveru' }, { status: 500 })
  }
} 