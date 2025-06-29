import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../../auth'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user.role !== 'DOCTOR' && session.user.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Neautorizováno' }, { status: 401 })
    }

    const serviceTypes = await prisma.serviceType.findMany({
      where: {
        tenantId: session.user.tenantId,
      },
      orderBy: {
        name: 'asc',
      },
    })

    return NextResponse.json(serviceTypes)
  } catch (error) {
    console.error('Chyba při načítání druhů služeb:', error)
    return NextResponse.json({ error: 'Chyba serveru' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user.role !== 'DOCTOR' && session.user.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Neautorizováno' }, { status: 401 })
    }

    const body = await request.json()
    const { name, description, durationMinutes, price, color } = body

    if (!name || !durationMinutes) {
      return NextResponse.json({ error: 'Název a doba trvání jsou povinné' }, { status: 400 })
    }

    const serviceType = await prisma.serviceType.create({
      data: {
        name,
        description,
        duration: parseInt(durationMinutes),
        price: price ? parseFloat(price) : null,
        color: color || '#3B82F6',
        tenantId: session.user.tenantId,
      },
    })

    return NextResponse.json(serviceType)
  } catch (error) {
    console.error('Chyba při vytváření druhu služby:', error)
    return NextResponse.json({ error: 'Chyba serveru' }, { status: 500 })
  }
} 