import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../../auth'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// PUT /api/rooms/[id] - Aktualizovat ordinaci
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Nepřihlášen' }, { status: 401 })
    }

    if (session.user.role !== 'DOCTOR' && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Nedostatečná oprávnění' }, { status: 403 })
    }

    const roomId = params.id
    const body = await request.json()
    const { name, description, capacity, isActive } = body

    if (!name) {
      return NextResponse.json({ error: 'Název je povinný' }, { status: 400 })
    }

    // Kontrola existence ordinace
    const existingRoom = await prisma.room.findFirst({
      where: {
        id: roomId,
        tenantId: session.user.tenantId,
      },
    })

    if (!existingRoom) {
      return NextResponse.json({ error: 'Ordinace nenalezena' }, { status: 404 })
    }

    // Kontrola duplicitního názvu (kromě aktuální ordinace)
    const duplicateRoom = await prisma.room.findFirst({
      where: {
        tenantId: session.user.tenantId,
        name: name,
        id: { not: roomId },
      },
    })

    if (duplicateRoom) {
      return NextResponse.json({ error: 'Ordinace s tímto názvem již existuje' }, { status: 400 })
    }

    const room = await prisma.room.update({
      where: { id: roomId },
      data: {
        name,
        description: description || null,
        capacity: capacity || 1,
        isActive: isActive !== undefined ? isActive : true,
      },
    })

    return NextResponse.json(room)
  } catch (error) {
    console.error('Chyba při aktualizaci ordinace:', error)
    return NextResponse.json({ error: 'Chyba serveru' }, { status: 500 })
  }
}

// DELETE /api/rooms/[id] - Smazat ordinaci
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Nepřihlášen' }, { status: 401 })
    }

    if (session.user.role !== 'DOCTOR' && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Nedostatečná oprávnění' }, { status: 403 })
    }

    const roomId = params.id

    // Kontrola existence ordinace
    const existingRoom = await prisma.room.findFirst({
      where: {
        id: roomId,
        tenantId: session.user.tenantId,
      },
    })

    if (!existingRoom) {
      return NextResponse.json({ error: 'Ordinace nenalezena' }, { status: 404 })
    }

    // Kontrola, zda ordinace není používána v slotech
    const slotsUsingRoom = await prisma.slot.findFirst({
      where: {
        roomId: roomId,
      },
    })

    if (slotsUsingRoom) {
      return NextResponse.json({ 
        error: 'Nelze smazat ordinaci, která je používána v rezervačních slotech' 
      }, { status: 400 })
    }

    await prisma.room.delete({
      where: { id: roomId },
    })

    return NextResponse.json({ message: 'Ordinace byla smazána' })
  } catch (error) {
    console.error('Chyba při mazání ordinace:', error)
    return NextResponse.json({ error: 'Chyba serveru' }, { status: 500 })
  }
} 