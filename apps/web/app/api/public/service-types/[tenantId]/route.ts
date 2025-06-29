import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../../../auth'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(request: NextRequest, { params }: { params: { tenantId: string } }) {
  try {
    const session = await getServerSession(authOptions)
    
    // Vyžaduj přihlášení, ale povoluj všechny role
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized - musíte být přihlášeni' }, { status: 401 })
    }

    const tenantId = params.tenantId

    // Načti všechny aktivní druhy služeb pro daný tenant
    const serviceTypes = await prisma.serviceType.findMany({
      where: {
        tenantId,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        description: true,
        duration: true,
        color: true,
      },
      orderBy: {
        name: 'asc',
      },
    })

    return NextResponse.json(serviceTypes)
  } catch (error) {
    console.error('Error in public service-types API:', error)
    return NextResponse.json({ error: 'Interní chyba serveru' }, { status: 500 })
  }
} 