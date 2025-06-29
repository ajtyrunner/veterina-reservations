import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../../../auth'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user.role !== 'DOCTOR' && session.user.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Neautorizováno' }, { status: 401 })
    }

    const body = await request.json()
    const { name, description, durationMinutes, price, color, isActive } = body

    if (!name || !durationMinutes) {
      return NextResponse.json({ error: 'Název a doba trvání jsou povinné' }, { status: 400 })
    }

    // Ověř, že service type patří k tomuto tenantovi
    const existingServiceType = await prisma.serviceType.findFirst({
      where: {
        id: params.id,
        tenantId: session.user.tenantId,
      },
    })

    if (!existingServiceType) {
      return NextResponse.json({ error: 'Druh služby nenalezen' }, { status: 404 })
    }

    const serviceType = await prisma.serviceType.update({
      where: { id: params.id },
      data: {
        name,
        description,
        duration: parseInt(durationMinutes),
        price: price ? parseFloat(price) : null,
        color: color || '#3B82F6',
        isActive: isActive !== undefined ? isActive : true,
      },
    })

    return NextResponse.json(serviceType)
  } catch (error) {
    console.error('Chyba při aktualizaci druhu služby:', error)
    return NextResponse.json({ error: 'Chyba serveru' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user.role !== 'DOCTOR' && session.user.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Neautorizováno' }, { status: 401 })
    }

    // Ověř, že service type patří k tomuto tenantovi
    const existingServiceType = await prisma.serviceType.findFirst({
      where: {
        id: params.id,
        tenantId: session.user.tenantId,
      },
    })

    if (!existingServiceType) {
      return NextResponse.json({ error: 'Druh služby nenalezen' }, { status: 404 })
    }

    // Zkontroluj, zda není používán v slotech
    const slotsCount = await prisma.slot.count({
      where: {
        serviceTypeId: params.id,
      },
    })

    if (slotsCount > 0) {
      return NextResponse.json({ 
        error: `Nelze smazat druh služby, protože je používán v ${slotsCount} slotech` 
      }, { status: 400 })
    }

    await prisma.serviceType.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: 'Druh služby smazán' })
  } catch (error) {
    console.error('Chyba při mazání druhu služby:', error)
    return NextResponse.json({ error: 'Chyba serveru' }, { status: 500 })
  }
} 