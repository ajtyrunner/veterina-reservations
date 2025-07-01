import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { parsePragueDateTime, logTimeDebug } from '../utils/timezone'

const router = Router()
const prisma = new PrismaClient()

// Získání rezervací (uživatelské pro CLIENT, všechny pro DOCTOR/ADMIN)
router.get('/reservations', async (req, res) => {
  try {
    const userId = req.user?.sub
    const tenantId = req.user?.tenant
    const userRole = req.user?.role
    const { status } = req.query

    console.log('=== DEBUG: GET /reservations ===')
    console.log('userId:', userId)
    console.log('tenantId:', tenantId)
    console.log('userRole:', userRole)
    console.log('status filter:', status)

    if (!userId || !tenantId) {
      return res.status(400).json({ error: 'Chybí uživatelské údaje' })
    }

    let whereCondition: any = { tenantId }

    // Pro CLIENT role - pouze vlastní rezervace
    if (userRole === 'CLIENT') {
      whereCondition.userId = userId
    } else if (userRole === 'DOCTOR') {
      // Pro DOCTOR - pouze rezervace pro jeho sloty
      const doctor = await prisma.doctor.findFirst({
        where: { userId, tenantId },
      })

      if (!doctor) {
        return res.status(404).json({ error: 'Profil doktora nenalezen' })
      }

      whereCondition.doctorId = doctor.id
    }
    // Pro ADMIN - všechny rezervace v tenantovi (žádné další omezení)

    // Filtrování podle stavu, pokud je zadáno
    if (status) {
      whereCondition.status = status
    }

    console.log('Where condition:', JSON.stringify(whereCondition, null, 2))

    const reservations = await prisma.reservation.findMany({
      where: whereCondition,
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        doctor: {
          include: {
            user: {
              select: {
                name: true,
              },
            },
          },
        },
        slot: {
          include: {
            doctor: {
              include: {
                user: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    console.log(`Found ${reservations.length} reservations`)
    res.json(reservations)
  } catch (error) {
    console.error('Chyba při načítání rezervací:', error)
    res.status(500).json({ error: 'Interní chyba serveru' })
  }
})

// Vytvoření nové rezervace
router.post('/reservations', async (req, res) => {
  try {
    const userId = req.user?.sub
    const tenantId = req.user?.tenant
    const { slotId, petName, petType, description } = req.body

    if (!userId || !tenantId) {
      return res.status(400).json({ error: 'Chybí uživatelské údaje' })
    }

    if (!slotId) {
      return res.status(400).json({ error: 'SlotId je povinný' })
    }

    // Ověřit, že slot existuje a je dostupný
    const slot = await prisma.slot.findFirst({
      where: {
        id: slotId,
        tenantId,
        isAvailable: true,
      },
      include: {
        reservations: true,
      },
    })

    if (!slot) {
      return res.status(404).json({ error: 'Slot nenalezen nebo není dostupný' })
    }

    if (slot.reservations.length > 0) {
      return res.status(409).json({ error: 'Slot je již rezervovaný' })
    }

    // Vytvořit rezervaci
    const reservation = await prisma.reservation.create({
      data: {
        userId,
        doctorId: slot.doctorId,
        slotId,
        petName,
        petType,
        description,
        tenantId,
      },
      include: {
        slot: {
          include: {
            doctor: {
              include: {
                user: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    })

    res.status(201).json(reservation)
  } catch (error) {
    console.error('Chyba při vytváření rezervace:', error)
    res.status(500).json({ error: 'Interní chyba serveru' })
  }
})

// Aktualizace stavu rezervace (pro doktory/adminy)
router.patch('/reservations/:id', async (req, res) => {
  try {
    const userId = req.user?.sub
    const tenantId = req.user?.tenant
    const userRole = req.user?.role
    const { id } = req.params
    const { status } = req.body

    console.log('=== DEBUG: PATCH /reservations/:id ===')
    console.log('userId:', userId)
    console.log('tenantId:', tenantId)
    console.log('userRole:', userRole)
    console.log('reservationId:', id)
    console.log('new status:', status)

    if (!userId || !tenantId) {
      return res.status(400).json({ error: 'Chybí uživatelské údaje' })
    }

    // Pouze doktoři a admini mohou upravovat stav rezervací
    if (userRole !== 'DOCTOR' && userRole !== 'ADMIN') {
      return res.status(403).json({ error: 'Nedostatečná oprávnění' })
    }

    // Validace stavu
    const validStatuses = ['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED']
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Neplatný stav rezervace' })
    }

    let whereCondition: any = { id, tenantId }

    // DOCTOR může upravovat pouze rezervace pro své sloty
    if (userRole === 'DOCTOR') {
      const doctor = await prisma.doctor.findFirst({
        where: { userId, tenantId },
      })

      if (!doctor) {
        return res.status(404).json({ error: 'Profil doktora nenalezen' })
      }

      whereCondition.doctorId = doctor.id
    }
    // ADMIN může upravovat všechny rezervace v tenantovi

    const reservation = await prisma.reservation.findFirst({
      where: whereCondition,
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        doctor: {
          include: {
            user: {
              select: {
                name: true,
              },
            },
          },
        },
        slot: {
          select: {
            startTime: true,
            endTime: true,
            equipment: true,
          },
        },
      },
    })

    if (!reservation) {
      return res.status(404).json({ error: 'Rezervace nenalezena' })
    }

    const updatedReservation = await prisma.reservation.update({
      where: { id },
      data: { status },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        doctor: {
          include: {
            user: {
              select: {
                name: true,
              },
            },
          },
        },
        slot: {
          select: {
            startTime: true,
            endTime: true,
            equipment: true,
          },
        },
      },
    })

    res.json(updatedReservation)
  } catch (error) {
    console.error('Chyba při aktualizaci rezervace:', error)
    res.status(500).json({ error: 'Interní chyba serveru' })
  }
})

// Zrušení rezervace
router.delete('/reservations/:id', async (req, res) => {
  try {
    const userId = req.user?.sub
    const tenantId = req.user?.tenant
    const { id } = req.params

    if (!userId || !tenantId) {
      return res.status(400).json({ error: 'Chybí uživatelské údaje' })
    }

    const reservation = await prisma.reservation.findFirst({
      where: {
        id,
        userId,
        tenantId,
      },
    })

    if (!reservation) {
      return res.status(404).json({ error: 'Rezervace nenalezena' })
    }

    await prisma.reservation.update({
      where: { id },
      data: { status: 'CANCELLED' },
    })

    res.json({ message: 'Rezervace zrušena' })
  } catch (error) {
    console.error('Chyba při rušení rezervace:', error)
    res.status(500).json({ error: 'Interní chyba serveru' })
  }
})

// Routes pro doktory - vytváření slotů
router.post('/doctor/slots', async (req, res) => {
  try {
    const userId = req.user?.sub
    const tenantId = req.user?.tenant
    const userRole = req.user?.role
    const { startTime, endTime, equipment, doctorId, roomId, serviceTypeId } = req.body

    console.log('=== DEBUG: Creating slot ===')
    console.log('userId:', userId)
    console.log('tenantId:', tenantId)
    console.log('userRole:', userRole)
    console.log('body:', req.body)

    if (!userId || !tenantId) {
      return res.status(400).json({ error: 'Chybí uživatelské údaje' })
    }

    if (userRole !== 'DOCTOR' && userRole !== 'ADMIN') {
      return res.status(403).json({ error: 'Nedostatečná oprávnění' })
    }

    let targetDoctorId: string

    if (userRole === 'ADMIN') {
      if (doctorId) {
        // ADMIN může specifikovat doktora
        const doctor = await prisma.doctor.findFirst({
          where: { id: doctorId, tenantId },
        })
        if (!doctor) {
          return res.status(404).json({ error: 'Specifikovaný doktor nenalezen' })
        }
        targetDoctorId = doctorId
      } else {
        // Pokud ADMIN nespecifikuje doktora, najdeme prvního dostupného doktora v tenantovi
        const firstDoctor = await prisma.doctor.findFirst({
          where: { tenantId },
        })
        if (!firstDoctor) {
          return res.status(404).json({ error: 'Žádný doktor nenalezen v této ordinaci' })
        }
        targetDoctorId = firstDoctor.id
      }
    } else {
      // Pro DOCTOR role najdeme profil doktora podle userId
      const doctor = await prisma.doctor.findFirst({
        where: {
          userId,
          tenantId,
        },
      })

      if (!doctor) {
        return res.status(404).json({ error: 'Profil doktora nenalezen' })
      }
      targetDoctorId = doctor.id
    }

    // Kontrola, zda slot už neexistuje
    const existingSlot = await prisma.slot.findFirst({
      where: {
        doctorId: targetDoctorId,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
      },
    })

    if (existingSlot) {
      return res.status(409).json({ 
        error: `Slot pro tento čas už existuje (${new Date(startTime).toLocaleString('cs-CZ')} - ${new Date(endTime).toLocaleString('cs-CZ')})` 
      })
    }

    // Timezone handling - převedeme frontend čas na UTC
    const startTimeUTC = parsePragueDateTime(startTime)
    const endTimeUTC = parsePragueDateTime(endTime)
    
    console.log('Creating slot with timezone handling:')
    console.log('- doctorId:', targetDoctorId)
    logTimeDebug('Original startTime', startTime)
    logTimeDebug('Parsed startTime UTC', startTimeUTC)
    logTimeDebug('Original endTime', endTime)
    logTimeDebug('Parsed endTime UTC', endTimeUTC)
    console.log('- roomId:', roomId)
    console.log('- serviceTypeId:', serviceTypeId)

    const slot = await prisma.slot.create({
      data: {
        doctorId: targetDoctorId,
        startTime: startTimeUTC,
        endTime: endTimeUTC,
        roomId: roomId || null,
        serviceTypeId: serviceTypeId || null,
        equipment,
        tenantId,
      },
      include: {
        doctor: {
          include: {
            user: {
              select: {
                name: true,
              },
            },
          },
        },
        room: true,
        serviceType: true,
        reservations: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
      },
    })

    res.status(201).json(slot)
  } catch (error) {
    console.error('Chyba při vytváření slotu:', error)
    res.status(500).json({ error: 'Interní chyba serveru' })
  }
})

// Získání slotů doktora
router.get('/doctor/slots', async (req, res) => {
  try {
    const userId = req.user?.sub
    const tenantId = req.user?.tenant
    const userRole = req.user?.role

    if (!userId || !tenantId) {
      return res.status(400).json({ error: 'Chybí uživatelské údaje' })
    }

    if (userRole !== 'DOCTOR' && userRole !== 'ADMIN') {
      return res.status(403).json({ error: 'Nedostatečná oprávnění' })
    }

    let whereCondition: any = { tenantId }

    if (userRole === 'ADMIN') {
      // ADMIN vidí všechny sloty v tenantovi
      whereCondition = { tenantId }
    } else {
      // DOCTOR vidí pouze své sloty
      const doctor = await prisma.doctor.findFirst({
        where: {
          userId,
          tenantId,
        },
      })

      if (!doctor) {
        return res.status(404).json({ error: 'Profil doktora nenalezen' })
      }
      whereCondition.doctorId = doctor.id
    }

    const slots = await prisma.slot.findMany({
      where: whereCondition,
      include: {
        doctor: {
          include: {
            user: {
              select: {
                name: true,
              },
            },
          },
        },
        room: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
        serviceType: {
          select: {
            id: true,
            name: true,
            description: true,
            duration: true,
            color: true,
          },
        },
        reservations: {
          where: {
            status: {
              in: ['PENDING', 'CONFIRMED']
            }
          },
          include: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: {
        startTime: 'asc',
      },
    })

    res.json(slots)
  } catch (error) {
    console.error('Chyba při načítání slotů doktora:', error)
    res.status(500).json({ error: 'Interní chyba serveru' })
  }
})

// Úprava slotu
router.put('/doctor/slots/:id', async (req, res) => {
  try {
    const userId = req.user?.sub
    const tenantId = req.user?.tenant
    const userRole = req.user?.role
    const { id } = req.params
    const { startTime, endTime, equipment, roomId, serviceTypeId } = req.body

    if (!userId || !tenantId) {
      return res.status(400).json({ error: 'Chybí uživatelské údaje' })
    }

    if (userRole !== 'DOCTOR' && userRole !== 'ADMIN') {
      return res.status(403).json({ error: 'Nedostatečná oprávnění' })
    }

    // Najdi slot a ověř oprávnění
    const existingSlot = await prisma.slot.findFirst({
      where: { id, tenantId },
      include: { reservations: true },
    })

    if (!existingSlot) {
      return res.status(404).json({ error: 'Slot nenalezen' })
    }

    // Nelze upravit slot s rezervacemi
    if (existingSlot.reservations.length > 0) {
      return res.status(409).json({ error: 'Nelze upravit slot s existujícími rezervacemi' })
    }

    // Pro DOCTOR role ověř, že je to jeho slot
    if (userRole === 'DOCTOR') {
      const doctor = await prisma.doctor.findFirst({
        where: { userId, tenantId },
      })

      if (!doctor || existingSlot.doctorId !== doctor.id) {
        return res.status(403).json({ error: 'Nemáte oprávnění upravit tento slot' })
      }
    }

    // Kontrola, zda nový čas nekoliduje s jiným slotem
    if (startTime !== existingSlot.startTime.toISOString() || endTime !== existingSlot.endTime.toISOString()) {
      const conflictingSlot = await prisma.slot.findFirst({
        where: {
          id: { not: id },
          doctorId: existingSlot.doctorId,
          startTime: new Date(startTime),
          endTime: new Date(endTime),
        },
      })

      if (conflictingSlot) {
        return res.status(409).json({ 
          error: `Slot pro tento čas už existuje (${new Date(startTime).toLocaleString('cs-CZ')} - ${new Date(endTime).toLocaleString('cs-CZ')})` 
        })
      }
    }

    const updatedSlot = await prisma.slot.update({
      where: { id },
      data: {
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        roomId: roomId || null,
        serviceTypeId: serviceTypeId || null,
        equipment,
      },
      include: {
        doctor: {
          include: {
            user: {
              select: {
                name: true,
              },
            },
          },
        },
        room: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
        serviceType: {
          select: {
            id: true,
            name: true,
            description: true,
            duration: true,
            color: true,
          },
        },
        reservations: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
      },
    })

    res.json(updatedSlot)
  } catch (error) {
    console.error('Chyba při úpravě slotu:', error)
    res.status(500).json({ error: 'Interní chyba serveru' })
  }
})

// Smazání slotu
router.delete('/doctor/slots/:id', async (req, res) => {
  try {
    const userId = req.user?.sub
    const tenantId = req.user?.tenant
    const userRole = req.user?.role
    const { id } = req.params

    if (!userId || !tenantId) {
      return res.status(400).json({ error: 'Chybí uživatelské údaje' })
    }

    if (userRole !== 'DOCTOR' && userRole !== 'ADMIN') {
      return res.status(403).json({ error: 'Nedostatečná oprávnění' })
    }

    // Najdi slot a ověř oprávnění
    const existingSlot = await prisma.slot.findFirst({
      where: { id, tenantId },
      include: { reservations: true },
    })

    if (!existingSlot) {
      return res.status(404).json({ error: 'Slot nenalezen' })
    }

    // Nelze smazat slot s rezervacemi
    if (existingSlot.reservations.length > 0) {
      return res.status(409).json({ error: 'Nelze smazat slot s existujícími rezervacemi' })
    }

    // Pro DOCTOR role ověř, že je to jeho slot
    if (userRole === 'DOCTOR') {
      const doctor = await prisma.doctor.findFirst({
        where: { userId, tenantId },
      })

      if (!doctor || existingSlot.doctorId !== doctor.id) {
        return res.status(403).json({ error: 'Nemáte oprávnění smazat tento slot' })
      }
    }

    await prisma.slot.delete({
      where: { id },
    })

    res.json({ message: 'Slot byl úspěšně smazán' })
  } catch (error) {
    console.error('Chyba při mazání slotu:', error)
    res.status(500).json({ error: 'Interní chyba serveru' })
  }
})

// === SPRÁVA REZERVACÍ ===

// Získání všech rezervací pro doktora/admina
router.get('/doctor/reservations', async (req, res) => {
  try {
    const userId = req.user?.sub
    const tenantId = req.user?.tenant
    const userRole = req.user?.role
    const { status } = req.query

    if (!userId || !tenantId) {
      return res.status(400).json({ error: 'Chybí uživatelské údaje' })
    }

    if (userRole !== 'DOCTOR' && userRole !== 'ADMIN') {
      return res.status(403).json({ error: 'Nedostatečná oprávnění' })
    }

    let whereCondition: any = { tenantId }

    // Filtrovat podle statusu pokud je zadán
    if (status && ['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED'].includes(status as string)) {
      whereCondition.status = status
    }

    if (userRole === 'DOCTOR') {
      // DOCTOR vidí pouze své rezervace
      const doctor = await prisma.doctor.findFirst({
        where: { userId, tenantId },
      })

      if (!doctor) {
        return res.status(404).json({ error: 'Profil doktora nenalezen' })
      }
      whereCondition.doctorId = doctor.id
    }

    const reservations = await prisma.reservation.findMany({
      where: whereCondition,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        doctor: {
          include: {
            user: {
              select: {
                name: true,
              },
            },
          },
        },
        slot: {
          include: {
            room: {
              select: {
                name: true,
                description: true,
              },
            },
            serviceType: {
              select: {
                name: true,
                duration: true,
                color: true,
              },
            },
          },
        },
      },
      orderBy: [
        { status: 'asc' }, // PENDING první
        { slot: { startTime: 'asc' } }, // pak podle času
      ],
    })

    res.json(reservations)
  } catch (error) {
    console.error('Chyba při načítání rezervací:', error)
    res.status(500).json({ error: 'Interní chyba serveru' })
  }
})

// Aktualizace statusu rezervace
router.put('/doctor/reservations/:id/status', async (req, res) => {
  try {
    const userId = req.user?.sub
    const tenantId = req.user?.tenant
    const userRole = req.user?.role
    const { id } = req.params
    const { status, notes } = req.body

    if (!userId || !tenantId) {
      return res.status(400).json({ error: 'Chybí uživatelské údaje' })
    }

    if (userRole !== 'DOCTOR' && userRole !== 'ADMIN') {
      return res.status(403).json({ error: 'Nedostatečná oprávnění' })
    }

    if (!['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED'].includes(status)) {
      return res.status(400).json({ error: 'Neplatný status rezervace' })
    }

    // Najdi rezervaci a ověř oprávnění
    const existingReservation = await prisma.reservation.findFirst({
      where: { id, tenantId },
      include: { doctor: true },
    })

    if (!existingReservation) {
      return res.status(404).json({ error: 'Rezervace nenalezena' })
    }

    // Pro DOCTOR role ověř, že je to jeho rezervace
    if (userRole === 'DOCTOR') {
      const doctor = await prisma.doctor.findFirst({
        where: { userId, tenantId },
      })

      if (!doctor || existingReservation.doctorId !== doctor.id) {
        return res.status(403).json({ error: 'Nemáte oprávnění upravit tuto rezervaci' })
      }
    }

    const updatedReservation = await prisma.reservation.update({
      where: { id },
      data: {
        status,
        ...(notes && { description: notes }), // Aktualizuj poznámky pokud jsou poskytnuty
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        doctor: {
          include: {
            user: {
              select: {
                name: true,
              },
            },
          },
        },
        slot: {
          include: {
            room: {
              select: {
                name: true,
                description: true,
              },
            },
            serviceType: {
              select: {
                name: true,
                duration: true,
                color: true,
              },
            },
          },
        },
      },
    })

    res.json(updatedReservation)
  } catch (error) {
    console.error('Chyba při úpravě rezervace:', error)
    res.status(500).json({ error: 'Interní chyba serveru' })
  }
})

// Přidání poznámky k rezervaci
router.put('/doctor/reservations/:id/notes', async (req, res) => {
  try {
    const userId = req.user?.sub
    const tenantId = req.user?.tenant
    const userRole = req.user?.role
    const { id } = req.params
    const { notes } = req.body

    if (!userId || !tenantId) {
      return res.status(400).json({ error: 'Chybí uživatelské údaje' })
    }

    if (userRole !== 'DOCTOR' && userRole !== 'ADMIN') {
      return res.status(403).json({ error: 'Nedostatečná oprávnění' })
    }

    // Najdi rezervaci a ověř oprávnění
    const existingReservation = await prisma.reservation.findFirst({
      where: { id, tenantId },
    })

    if (!existingReservation) {
      return res.status(404).json({ error: 'Rezervace nenalezena' })
    }

    // Pro DOCTOR role ověř, že je to jeho rezervace
    if (userRole === 'DOCTOR') {
      const doctor = await prisma.doctor.findFirst({
        where: { userId, tenantId },
      })

      if (!doctor || existingReservation.doctorId !== doctor.id) {
        return res.status(403).json({ error: 'Nemáte oprávnění upravit tuto rezervaci' })
      }
    }

    const updatedReservation = await prisma.reservation.update({
      where: { id },
      data: { description: notes },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        slot: {
          select: {
            startTime: true,
            endTime: true,
          },
        },
      },
    })

    res.json(updatedReservation)
  } catch (error) {
    console.error('Chyba při úpravě poznámek:', error)
    res.status(500).json({ error: 'Interní chyba serveru' })
  }
})

// === SPRÁVA ROOMS (ORDINACÍ) ===

// Získání všech rooms
router.get('/rooms', async (req, res) => {
  try {
    const tenantId = req.user?.tenant
    const userRole = req.user?.role

    if (!tenantId) {
      return res.status(400).json({ error: 'Chybí tenant ID' })
    }

    if (userRole !== 'DOCTOR' && userRole !== 'ADMIN') {
      return res.status(403).json({ error: 'Nedostatečná oprávnění' })
    }

    const rooms = await prisma.room.findMany({
      where: { tenantId },
      orderBy: { name: 'asc' },
    })

    res.json(rooms)
  } catch (error) {
    console.error('Chyba při načítání ordinací:', error)
    res.status(500).json({ error: 'Interní chyba serveru' })
  }
})

// Vytvoření nové room
router.post('/rooms', async (req, res) => {
  try {
    const tenantId = req.user?.tenant
    const userRole = req.user?.role
    const { name, description, capacity, isActive } = req.body

    if (!tenantId) {
      return res.status(400).json({ error: 'Chybí tenant ID' })
    }

    if (userRole !== 'DOCTOR' && userRole !== 'ADMIN') {
      return res.status(403).json({ error: 'Nedostatečná oprávnění' })
    }

    if (!name) {
      return res.status(400).json({ error: 'Název ordinace je povinný' })
    }

    const room = await prisma.room.create({
      data: {
        name,
        description,
        capacity: capacity || 1,
        isActive: isActive !== undefined ? isActive : true,
        tenantId,
      },
    })

    res.status(201).json(room)
  } catch (error) {
    console.error('Chyba při vytváření ordinace:', error)
    res.status(500).json({ error: 'Interní chyba serveru' })
  }
})

// Aktualizace room
router.put('/rooms/:id', async (req, res) => {
  try {
    const tenantId = req.user?.tenant
    const userRole = req.user?.role
    const { id } = req.params
    const { name, description, capacity, isActive } = req.body

    if (!tenantId) {
      return res.status(400).json({ error: 'Chybí tenant ID' })
    }

    if (userRole !== 'DOCTOR' && userRole !== 'ADMIN') {
      return res.status(403).json({ error: 'Nedostatečná oprávnění' })
    }

    const existingRoom = await prisma.room.findFirst({
      where: { id, tenantId },
    })

    if (!existingRoom) {
      return res.status(404).json({ error: 'Ordinace nenalezena' })
    }

    const room = await prisma.room.update({
      where: { id },
      data: {
        name,
        description,
        capacity,
        isActive,
      },
    })

    res.json(room)
  } catch (error) {
    console.error('Chyba při aktualizaci ordinace:', error)
    res.status(500).json({ error: 'Interní chyba serveru' })
  }
})

// === SPRÁVA SERVICE TYPES (DRUHŮ SLUŽEB) ===

// Získání všech service types
router.get('/service-types', async (req, res) => {
  try {
    const tenantId = req.user?.tenant
    const userRole = req.user?.role

    if (!tenantId) {
      return res.status(400).json({ error: 'Chybí tenant ID' })
    }

    if (userRole !== 'DOCTOR' && userRole !== 'ADMIN') {
      return res.status(403).json({ error: 'Nedostatečná oprávnění' })
    }

    const serviceTypes = await prisma.serviceType.findMany({
      where: { tenantId },
      orderBy: { name: 'asc' },
    })

    res.json(serviceTypes)
  } catch (error) {
    console.error('Chyba při načítání druhů služeb:', error)
    res.status(500).json({ error: 'Interní chyba serveru' })
  }
})

// Vytvoření nového service type
router.post('/service-types', async (req, res) => {
  try {
    const tenantId = req.user?.tenant
    const userRole = req.user?.role
    const { name, description, duration, durationMinutes, price, color, isActive } = req.body

    if (!tenantId) {
      return res.status(400).json({ error: 'Chybí tenant ID' })
    }

    if (userRole !== 'DOCTOR' && userRole !== 'ADMIN') {
      return res.status(403).json({ error: 'Nedostatečná oprávnění' })
    }

    if (!name) {
      return res.status(400).json({ error: 'Název služby je povinný' })
    }

    // Podpora pro oba formáty - duration nebo durationMinutes
    const finalDuration = durationMinutes || duration || 30

    const serviceType = await prisma.serviceType.create({
      data: {
        name,
        description,
        duration: finalDuration,
        price: price ? parseFloat(price) : null,
        color: color || '#3B82F6',
        isActive: isActive !== undefined ? isActive : true,
        tenantId,
      },
    })

    res.status(201).json(serviceType)
  } catch (error) {
    console.error('Chyba při vytváření druhu služby:', error)
    res.status(500).json({ error: 'Interní chyba serveru' })
  }
})

// Aktualizace service type
router.put('/service-types/:id', async (req, res) => {
  try {
    const tenantId = req.user?.tenant
    const userRole = req.user?.role
    const { id } = req.params
    const { name, description, duration, durationMinutes, price, color, isActive } = req.body

    if (!tenantId) {
      return res.status(400).json({ error: 'Chybí tenant ID' })
    }

    if (userRole !== 'DOCTOR' && userRole !== 'ADMIN') {
      return res.status(403).json({ error: 'Nedostatečná oprávnění' })
    }

    const existingServiceType = await prisma.serviceType.findFirst({
      where: { id, tenantId },
    })

    if (!existingServiceType) {
      return res.status(404).json({ error: 'Druh služby nenalezen' })
    }

    // Podpora pro oba formáty - duration nebo durationMinutes
    const finalDuration = durationMinutes || duration

    const serviceType = await prisma.serviceType.update({
      where: { id },
      data: {
        name,
        description,
        duration: finalDuration,
        price: price ? parseFloat(price) : null,
        color,
        isActive,
      },
    })

    res.json(serviceType)
  } catch (error) {
    console.error('Chyba při aktualizaci druhu služby:', error)
    res.status(500).json({ error: 'Interní chyba serveru' })
  }
})

export default router
