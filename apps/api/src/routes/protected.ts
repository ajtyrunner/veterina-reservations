import { Router, Request, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { parsePragueDateTime, parseTimezoneDateTime, logTimezoneDebug, getStartOfDayInTimezone, getEndOfDayInTimezone } from '../utils/timezone'
import { getCachedTenantTimezone } from '../utils/tenant'
import { normalizePhoneNumber } from '../utils/contact'
import { NotificationService } from '../services/notificationService'
import { bulkOperationLimit, createOperationLimit } from '../middleware/rateLimiter'
import { 
  validateCreateReservation, 
  validateCreateSlot, 
  validateBulkSlotGeneration,
  validateUpdateReservationStatus,
  validateCreateRoom,
  validateCreateServiceType,
  validateQueryParams,
  validateReservationTiming
} from '../middleware/validation'
import { prisma, notificationService } from '../index'

const router = Router()

// Získání rezervací (uživatelské pro CLIENT, všechny pro DOCTOR/ADMIN)
router.get('/reservations', validateQueryParams, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.sub
    const tenantId = req.user?.tenantId || req.user?.tenantId || req.user?.tenant
    const userRole = req.user?.role
    const { status } = req.query

    if (process.env.NODE_ENV === 'development') {
      console.log('=== DEBUG: GET /reservations ===')
      console.log('userId:', userId)
      console.log('tenantId:', tenantId)
      console.log('userRole:', userRole)
      console.log('status filter:', status)
    }

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

    if (process.env.NODE_ENV === 'development') {
      console.log('Where condition:', JSON.stringify(whereCondition, null, 2))
    }

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

    if (process.env.NODE_ENV === 'development') {
      console.log(`Found ${reservations.length} reservations`)
    }
    res.json(reservations)
  } catch (error) {
    console.error('Chyba při načítání rezervací:', error)
    res.status(500).json({ error: 'Interní chyba serveru' })
  }
})

// Získání profilu aktuálního uživatele
router.get('/user/profile', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.sub
    const tenantId = req.user?.tenantId || req.user?.tenant

    if (!userId || !tenantId) {
      return res.status(400).json({ error: 'Chybí uživatelské údaje' })
    }

    const user = await prisma.user.findFirst({
      where: { id: userId, tenantId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        image: true,
      },
    })

    if (!user) {
      return res.status(404).json({ error: 'Uživatel nenalezen' })
    }

    res.json(user)
  } catch (error) {
    console.error('Chyba při načítání profilu uživatele:', error)
    res.status(500).json({ error: 'Interní chyba serveru' })
  }
})

// Vytvoření nové rezervace
router.post('/reservations', createOperationLimit, validateCreateReservation, validateReservationTiming, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.sub
    const tenantId = req.user?.tenantId || req.user?.tenant
    const { slotId, petName, petType, description, phone } = req.body

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
        reservations: {
          where: {
            status: {
              in: ['PENDING', 'CONFIRMED']
            }
          }
        },
        serviceType: true,
      },
    })

    if (!slot) {
      return res.status(404).json({ error: 'Slot nenalezen nebo není dostupný' })
    }

    if (slot.reservations.length > 0) {
      return res.status(409).json({ error: 'Slot je již rezervovaný' })
    }

    // Kontrola existující rezervace pro stejný typ služby
    if (slot.serviceType) {
      const existingReservation = await prisma.reservation.findFirst({
        where: {
          userId,
          tenantId,
          status: {
            in: ['PENDING', 'CONFIRMED']
          },
          slot: {
            serviceTypeId: slot.serviceType.id
          }
        },
        include: {
          slot: {
            include: {
              serviceType: true
            }
          }
        }
      })

      if (existingReservation) {
        return res.status(409).json({ 
          error: `Již máte aktivní rezervaci na službu "${slot.serviceType.name}". Před vytvořením nové rezervace musíte počkat na dokončení stávající rezervace nebo ji zrušit.` 
        })
      }
    }

    // Aktualizovat telefon uživatele, pokud je zadán
    if (phone) {
      await prisma.user.update({
        where: { id: userId },
        data: { phone: normalizePhoneNumber(phone.trim()) },
      })
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

    // 📧 Send notification to doctor about new reservation
    try {
      await notificationService.sendReservationStatusNotification({
        reservationId: reservation.id,
        tenantId,
        newStatus: 'PENDING',
        notifyBoth: false
      })
    } catch (notificationError) {
      console.error('❌ Failed to send new reservation notification:', notificationError)
      // Don't fail the request if notification fails
    }

    res.status(201).json(reservation)
  } catch (error) {
    console.error('Chyba při vytváření rezervace:', error)
    res.status(500).json({ error: 'Interní chyba serveru' })
  }
})

// Aktualizace stavu rezervace (pro doktory/adminy)
router.patch('/reservations/:id', validateUpdateReservationStatus, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.sub
    const tenantId = req.user?.tenantId || req.user?.tenant
    const userRole = req.user?.role
    const { id } = req.params
    const { status } = req.body

    if (process.env.NODE_ENV === 'development') {
      console.log('=== DEBUG: PATCH /reservations/:id ===')
      console.log('userId:', userId)
      console.log('tenantId:', tenantId)
      console.log('userRole:', userRole)
      console.log('reservationId:', id)
      console.log('new status:', status)
    }

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

    const oldStatus = reservation.status
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

    // 📧 Send notification about status change
    try {
      await notificationService.sendReservationStatusNotification({
        reservationId: id,
        tenantId,
        oldStatus: oldStatus as any,
        newStatus: status as any,
        notifyBoth: status === 'CANCELLED' // Notify both for cancellations
      })
    } catch (notificationError) {
      console.error('❌ Failed to send status change notification:', notificationError)
      // Don't fail the request if notification fails
    }

    res.json(updatedReservation)
  } catch (error) {
    console.error('Chyba při aktualizaci rezervace:', error)
    res.status(500).json({ error: 'Interní chyba serveru' })
  }
})

// Zrušení rezervace
router.delete('/reservations/:id', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.sub
    const tenantId = req.user?.tenantId || req.user?.tenant
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

    // 📧 Send cancellation notification
    try {
      await notificationService.sendReservationStatusNotification({
        reservationId: id,
        tenantId,
        oldStatus: reservation.status as any,
        newStatus: 'CANCELLED',
        notifyBoth: true // Client cancelled, notify both client and doctor
      })
    } catch (notificationError) {
      console.error('❌ Failed to send cancellation notification:', notificationError)
      // Don't fail the request if notification fails
    }

    res.json({ message: 'Rezervace zrušena' })
  } catch (error) {
    console.error('Chyba při rušení rezervace:', error)
    res.status(500).json({ error: 'Interní chyba serveru' })
  }
})

// Routes pro doktory - vytváření slotů
router.post('/doctor/slots', createOperationLimit, validateCreateSlot, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.sub
    const tenantId = req.user?.tenantId || req.user?.tenant
    const userRole = req.user?.role
    const { startTime, endTime, equipment, doctorId, roomId, serviceTypeId } = req.body

    if (process.env.NODE_ENV === 'development') {
      console.log('=== DEBUG: Creating slot ===')
      console.log('userId:', userId)
      console.log('tenantId:', tenantId)
      console.log('userRole:', userRole)
      console.log('body:', req.body)
    }

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

    // Timezone-aware kontrola, zda slot už neexistuje
    const tenantTimezone = await getCachedTenantTimezone(prisma, tenantId)
    const startTimeUTCCheck = parseTimezoneDateTime(startTime, tenantTimezone)
    const endTimeUTCCheck = parseTimezoneDateTime(endTime, tenantTimezone)
    
    const existingSlot = await prisma.slot.findFirst({
      where: {
        doctorId: targetDoctorId,
        startTime: startTimeUTCCheck,
        endTime: endTimeUTCCheck,
      },
    })

    if (existingSlot) {
      return res.status(409).json({ 
        error: `Slot pro tento čas už existuje (${startTimeUTCCheck.toLocaleString('cs-CZ', { timeZone: 'Europe/Prague' })} - ${endTimeUTCCheck.toLocaleString('cs-CZ', { timeZone: 'Europe/Prague' })})` 
      })
    }

    // Timezone handling - převedeme frontend čas na UTC podle tenant timezone
    const startTimeUTC = parseTimezoneDateTime(startTime, tenantTimezone)
    const endTimeUTC = parseTimezoneDateTime(endTime, tenantTimezone)
    
    if (process.env.NODE_ENV === 'development') {
      console.log('Creating slot with timezone handling:')
      console.log('- doctorId:', targetDoctorId)
      console.log('- tenantTimezone:', tenantTimezone)
      logTimezoneDebug('Original startTime', startTime)
      logTimezoneDebug('Parsed startTime UTC', startTimeUTC, tenantTimezone)
      logTimezoneDebug('Original endTime', endTime)
      logTimezoneDebug('Parsed endTime UTC', endTimeUTC, tenantTimezone)
      console.log('- roomId:', roomId)
      console.log('- serviceTypeId:', serviceTypeId)
    }

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
router.get('/doctor/slots', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.sub
    const tenantId = req.user?.tenantId || req.user?.tenant
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
      where: {
        ...whereCondition,
        doctor: {
          user: {
            isActive: true
          }
        }
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
router.put('/doctor/slots/:id', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.sub
    const tenantId = req.user?.tenantId || req.user?.tenant
    const userRole = req.user?.role
    const { id } = req.params
    const { startTime, endTime, equipment, roomId, serviceTypeId } = req.body

    if (process.env.NODE_ENV === 'development') {
      console.log('=== DEBUG: PUT /doctor/slots/:id ===')
      console.log('userId:', userId)
      console.log('tenantId:', tenantId)
      console.log('userRole:', userRole)
      console.log('slotId:', id)
      console.log('body:', req.body)
    }

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
    const tenantTimezone = await getCachedTenantTimezone(prisma, tenantId)
    const startTimeUTCForCheck = parseTimezoneDateTime(startTime, tenantTimezone)
    const endTimeUTCForCheck = parseTimezoneDateTime(endTime, tenantTimezone)
    
    if (startTimeUTCForCheck.getTime() !== existingSlot.startTime.getTime() || 
        endTimeUTCForCheck.getTime() !== existingSlot.endTime.getTime()) {
      const conflictingSlot = await prisma.slot.findFirst({
        where: {
          id: { not: id },
          doctorId: existingSlot.doctorId,
          startTime: startTimeUTCForCheck,
          endTime: endTimeUTCForCheck,
        },
      })

      if (conflictingSlot) {
        return res.status(409).json({ 
          error: `Slot pro tento čas už existuje (${startTimeUTCForCheck.toLocaleString('cs-CZ', { timeZone: 'Europe/Prague' })} - ${endTimeUTCForCheck.toLocaleString('cs-CZ', { timeZone: 'Europe/Prague' })})` 
        })
      }
    }

    // Timezone handling - převedeme frontend čas na UTC podle tenant timezone
    const startTimeUTC = parseTimezoneDateTime(startTime, tenantTimezone)
    const endTimeUTC = parseTimezoneDateTime(endTime, tenantTimezone)
    
    if (process.env.NODE_ENV === 'development') {
      console.log('Updating slot with timezone handling:')
      console.log('- tenantTimezone:', tenantTimezone)
      logTimezoneDebug('Original startTime', startTime)
      logTimezoneDebug('Parsed startTime UTC', startTimeUTC, tenantTimezone)
      logTimezoneDebug('Original endTime', endTime)
      logTimezoneDebug('Parsed endTime UTC', endTimeUTC, tenantTimezone)
    }

    const updatedSlot = await prisma.slot.update({
      where: { id },
      data: {
        startTime: startTimeUTC,
        endTime: endTimeUTC,
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
router.delete('/doctor/slots/:id', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.sub
    const tenantId = req.user?.tenantId || req.user?.tenant
    const userRole = req.user?.role
    const { id } = req.params

    if (process.env.NODE_ENV === 'development') {
      console.log('=== DEBUG: DELETE /doctor/slots/:id ===')
      console.log('userId:', userId)
      console.log('tenantId:', tenantId)
      console.log('userRole:', userRole)
      console.log('slotId:', id)
    }

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
router.get('/doctor/reservations', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.sub
    const tenantId = req.user?.tenantId || req.user?.tenant
    const userRole = req.user?.role
    const { status } = req.query

    if (process.env.NODE_ENV === 'development') {
      console.log('=== DEBUG: GET /doctor/reservations ===')
      console.log('userId:', userId)
      console.log('tenantId:', tenantId)
      console.log('userRole:', userRole)
      console.log('status filter:', status)
    }

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

    if (process.env.NODE_ENV === 'development') {
      console.log(`Found ${reservations.length} reservations`)
    }
    res.json(reservations)
  } catch (error) {
    console.error('Chyba při načítání rezervací:', error)
    res.status(500).json({ error: 'Interní chyba serveru' })
  }
})

// Aktualizace statusu rezervace
router.put('/doctor/reservations/:id/status', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.sub
    const tenantId = req.user?.tenantId || req.user?.tenant
    const userRole = req.user?.role
    const { id } = req.params
    const { status, notes } = req.body

    if (process.env.NODE_ENV === 'development') {
      console.log('=== DEBUG: PUT /doctor/reservations/:id/status ===')
      console.log('userId:', userId)
      console.log('tenantId:', tenantId)
      console.log('userRole:', userRole)
      console.log('reservationId:', id)
      console.log('new status:', status)
    }

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

    const oldStatus = existingReservation.status
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

    // 📧 Send notification about status change (doctor route)
    try {
      await notificationService.sendReservationStatusNotification({
        reservationId: id,
        tenantId: existingReservation.tenantId,
        oldStatus: oldStatus as any,
        newStatus: status as any,
        notifyBoth: status === 'CANCELLED' // Notify both for cancellations
      })
    } catch (notificationError) {
      console.error('❌ Failed to send doctor status change notification:', notificationError)
      // Don't fail the request if notification fails
    }

    res.json(updatedReservation)
  } catch (error) {
    console.error('Chyba při úpravě rezervace:', error)
    res.status(500).json({ error: 'Interní chyba serveru' })
  }
})

// Přidání poznámky k rezervaci
router.put('/doctor/reservations/:id/notes', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.sub
    const tenantId = req.user?.tenantId || req.user?.tenant
    const userRole = req.user?.role
    const { id } = req.params
    const { notes } = req.body

    if (process.env.NODE_ENV === 'development') {
      console.log('=== DEBUG: PUT /doctor/reservations/:id/notes ===')
      console.log('userId:', userId)
      console.log('tenantId:', tenantId)
      console.log('userRole:', userRole)
      console.log('reservationId:', id)
      console.log('notes:', notes)
    }

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
router.get('/rooms', async (req: Request, res: Response) => {
  try {
    const tenantId = req.user?.tenantId || req.user?.tenant
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
router.post('/rooms', async (req: Request, res: Response) => {
  try {
    const tenantId = req.user?.tenantId || req.user?.tenant
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
router.put('/rooms/:id', async (req: Request, res: Response) => {
  try {
    const tenantId = req.user?.tenantId || req.user?.tenant
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

// POZOR: Endpoint pro čtení service-types je v index.ts jako /api/service-types/:tenantId
// Zde ponecháváme pouze POST a PUT endpointy pro správu

// Vytvoření nového service type
router.post('/service-types', async (req: Request, res: Response) => {
  try {
    const tenantId = req.user?.tenantId || req.user?.tenant
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
router.put('/service-types/:id', async (req: Request, res: Response) => {
  try {
    const tenantId = req.user?.tenantId || req.user?.tenant
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

// === SPRÁVA DOKTORŮ ===

// Získání doktorů podle role uživatele
router.get('/doctors', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.sub
    const tenantId = req.user?.tenantId || req.user?.tenant
    const userRole = req.user?.role

    if (process.env.NODE_ENV === 'development') {
      console.log('=== DEBUG: GET /doctors ===')
      console.log('userId:', userId)
      console.log('tenantId:', tenantId)
      console.log('userRole:', userRole)
    }

    if (!userId || !tenantId) {
      return res.status(400).json({ error: 'Chybí uživatelské údaje' })
    }

    // Role-based přístup
    let whereCondition: any = { tenantId }
    let userSelect: any = {
      id: true,
      name: true,
      image: true,
    }

    if (userRole === 'ADMIN') {
      // ADMIN vidí všechny doktory včetně neaktivních + kompletní údaje
      whereCondition = { tenantId }
      userSelect = {
        id: true,
        name: true,
        email: true,
        phone: true,
        username: true,
        isActive: true,
        image: true,
      }
    } else if (userRole === 'DOCTOR') {
      // DOCTOR vidí pouze aktivní doktory + základní údaje
      whereCondition = {
        tenantId,
        user: {
          isActive: true
        }
      }
    } else if (userRole === 'CLIENT') {
      // CLIENT vidí pouze aktivní doktory + základní údaje (pro rezervace)
      whereCondition = {
        tenantId,
        user: {
          isActive: true
        }
      }
    } else {
      return res.status(403).json({ error: 'Nedostatečná oprávnění' })
    }

    const doctors = await prisma.doctor.findMany({
      where: whereCondition,
      include: {
        user: {
          select: userSelect,
        },
      },
      orderBy: {
        user: {
          name: 'asc',
        },
      },
    })

    if (process.env.NODE_ENV === 'development') {
      console.log(`Found ${doctors.length} doctors for role ${userRole}`)
    }

    res.json(doctors)
  } catch (error) {
    console.error('Chyba při načítání doktorů:', error)
    res.status(500).json({ error: 'Interní chyba serveru' })
  }
})

// === BULK GENEROVÁNÍ SLOTŮ ===

// Bulk generování slotů podle rozvrhu
router.post('/doctor/slots/bulk-generate', bulkOperationLimit, validateBulkSlotGeneration, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.sub
    const tenantId = req.user?.tenantId || req.user?.tenant
    const userRole = req.user?.role
    const { 
      weekdays, 
      startTime, 
      endTime, 
      interval, 
      serviceTypeId, 
      roomId, 
      weeksCount, 
      startDate, 
      breakTimes = [],
      doctorId 
    } = req.body

    // BEZPEČNOST: Rate limiting check
    if (weeksCount > 52) {
      return res.status(400).json({ error: 'Maximální počet týdnů je 52' })
    }

    // BEZPEČNOST: Limit na počet generovaných slotů
    const estimatedSlots = weekdays.length * weeksCount * (Math.floor(480 / Math.max(interval, 15)))
    if (estimatedSlots > 1000) {
      return res.status(400).json({ error: 'Příliš mnoho slotů k vygenerování. Snižte počet týdnů nebo zvyšte interval.' })
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('=== DEBUG: Bulk slot generation ===')
      console.log('userId:', userId)
      console.log('tenantId:', tenantId)
      console.log('userRole:', userRole)
      // BEZPEČNOST: Nelogovat citlivé parametry
      console.log('estimatedSlots:', estimatedSlots)
    }

    if (!userId || !tenantId) {
      return res.status(400).json({ error: 'Chybí uživatelské údaje' })
    }

    if (userRole !== 'DOCTOR' && userRole !== 'ADMIN') {
      return res.status(403).json({ error: 'Nedostatečná oprávnění' })
    }

    // Validace povinných parametrů
    if (!weekdays || !Array.isArray(weekdays) || weekdays.length === 0) {
      return res.status(400).json({ error: 'Dny v týdnu jsou povinné' })
    }

    if (!startTime || !endTime || !weeksCount || !startDate) {
      return res.status(400).json({ error: 'Všechny časové parametry jsou povinné' })
    }

    if (interval < 0 || interval > 480) { // min 0 (nepřetržitý), max 8 hodin
      return res.status(400).json({ error: 'Interval musí být mezi 0-480 minutami' })
    }

    if (weeksCount <= 0 || weeksCount > 52) { // max rok
      return res.status(400).json({ error: 'Počet týdnů musí být mezi 1-52' })
    }

    // Určení target doktora
    let targetDoctorId: string

    if (userRole === 'ADMIN') {
      if (doctorId) {
        const doctor = await prisma.doctor.findFirst({
          where: { id: doctorId, tenantId },
        })
        if (!doctor) {
          return res.status(404).json({ error: 'Specifikovaný doktor nenalezen' })
        }
        targetDoctorId = doctorId
      } else {
        const firstDoctor = await prisma.doctor.findFirst({
          where: { tenantId },
        })
        if (!firstDoctor) {
          return res.status(404).json({ error: 'Žádný doktor nenalezen v této ordinaci' })
        }
        targetDoctorId = firstDoctor.id
      }
    } else {
      const doctor = await prisma.doctor.findFirst({
        where: { userId, tenantId },
      })
      if (!doctor) {
        return res.status(404).json({ error: 'Profil doktora nenalezen' })
      }
      targetDoctorId = doctor.id
    }

    // Timezone handling
    const tenantTimezone = await getCachedTenantTimezone(prisma, tenantId)
    
    // Získej délku služby pro inteligentní sloty
    let serviceTypeDuration: number | undefined = undefined
    if (serviceTypeId) {
      const serviceType = await prisma.serviceType.findFirst({
        where: { id: serviceTypeId, tenantId },
        select: { duration: true }
      })
      serviceTypeDuration = serviceType?.duration || undefined
      if (process.env.NODE_ENV === 'development') {
        console.log(`🔧 Služba má délku: ${serviceTypeDuration} minut`)
      }
    }
    
    // Generování slotů
    const slotsToCreate = []
    const conflicts = []
    
    const baseDate = new Date(startDate)
    
    for (let week = 0; week < weeksCount; week++) {
      for (const weekday of weekdays) {
        // Najdi první výskyt daného dne v týdnu
        const targetDate = new Date(baseDate)
        const daysToAdd = (weekday - baseDate.getDay() + 7) % 7 + (week * 7)
        targetDate.setDate(baseDate.getDate() + daysToAdd)
        
        const dateStr = targetDate.toISOString().split('T')[0] // YYYY-MM-DD
        
        // Generuj sloty pro tento den s inteligentní logikou
        const daySlots = generateDaySlots(
          dateStr, 
          startTime, 
          endTime, 
          interval, 
          breakTimes, 
          tenantTimezone,
          serviceTypeDuration
        )
        
        for (const slotTime of daySlots) {
          const slotData = {
            doctorId: targetDoctorId,
            startTime: slotTime.start,
            endTime: slotTime.end,
            roomId: roomId || null,
            serviceTypeId: serviceTypeId || null,
            tenantId,
          }
          
          // Kontrola konfliktů
          const existingSlot = await prisma.slot.findFirst({
            where: {
              doctorId: targetDoctorId,
              startTime: slotTime.start,
              endTime: slotTime.end,
            },
          })
          
          if (existingSlot) {
            conflicts.push({
              date: dateStr,
              startTime: slotTime.start.toLocaleString('cs-CZ', { timeZone: tenantTimezone }),
              endTime: slotTime.end.toLocaleString('cs-CZ', { timeZone: tenantTimezone }),
            })
          } else {
            slotsToCreate.push(slotData)
          }
        }
      }
    }
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`Generated ${slotsToCreate.length} slots, ${conflicts.length} conflicts`)
    }
    
    // Vytvoření slotů v databázi
    const createdSlots = []
    for (const slotData of slotsToCreate) {
      const slot = await prisma.slot.create({
        data: slotData,
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
        },
      })
      createdSlots.push(slot)
    }
    
    res.status(201).json({
      message: `Úspěšně vygenerováno ${createdSlots.length} slotů`,
      createdCount: createdSlots.length,
      conflictsCount: conflicts.length,
      conflicts,
      slots: createdSlots,
    })
    
  } catch (error) {
    console.error('Chyba při bulk generování slotů:', error)
    res.status(500).json({ error: 'Interní chyba serveru' })
  }
})

// Bulk smazání slotů podle kritérií
router.post('/doctor/slots/bulk-delete', bulkOperationLimit, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.sub
    const tenantId = req.user?.tenantId || req.user?.tenant
    const userRole = req.user?.role
    const { 
      dateFrom, 
      dateTo, 
      doctorId, 
      serviceTypeId, 
      roomId,
      onlyEmpty = true // Defaultně mazat pouze prázdné sloty
    } = req.body

    if (process.env.NODE_ENV === 'development') {
      console.log('=== DEBUG: Bulk slot deletion ===')
      console.log('userId:', userId)
      console.log('tenantId:', tenantId)
      console.log('userRole:', userRole)
      console.log('criteria:', { dateFrom, dateTo, doctorId, serviceTypeId, roomId, onlyEmpty })
    }

    if (!userId || !tenantId) {
      return res.status(400).json({ error: 'Chybí uživatelské údaje' })
    }

    if (userRole !== 'DOCTOR' && userRole !== 'ADMIN') {
      return res.status(403).json({ error: 'Nedostatečná oprávnění' })
    }

    // Validace povinných parametrů
    if (!dateFrom || !dateTo) {
      return res.status(400).json({ error: 'Datum od a do jsou povinné' })
    }

    // Určení target doktora
    let targetDoctorId: string | undefined

    if (userRole === 'ADMIN') {
      if (doctorId) {
        const doctor = await prisma.doctor.findFirst({
          where: { id: doctorId, tenantId },
        })
        if (!doctor) {
          return res.status(404).json({ error: 'Specifikovaný doktor nenalezen' })
        }
        targetDoctorId = doctorId
      }
      // Pokud admin nespecifikuje doktora, smaže sloty všech doktorů
    } else {
      const doctor = await prisma.doctor.findFirst({
        where: { userId, tenantId },
      })
      if (!doctor) {
        return res.status(404).json({ error: 'Profil doktora nenalezen' })
      }
      targetDoctorId = doctor.id
    }

    // Timezone handling
    const tenantTimezone = await getCachedTenantTimezone(prisma, tenantId)
    const startDateUTC = getStartOfDayInTimezone(dateFrom, tenantTimezone)
    const endDateUTC = getEndOfDayInTimezone(dateTo, tenantTimezone)

    // Sestavení where podmínek
    const whereCondition: any = {
      tenantId,
      startTime: {
        gte: startDateUTC,
        lte: endDateUTC,
      },
    }

    if (targetDoctorId) {
      whereCondition.doctorId = targetDoctorId
    }

    if (serviceTypeId) {
      whereCondition.serviceTypeId = serviceTypeId
    }

    if (roomId) {
      whereCondition.roomId = roomId
    }

    // Pokud onlyEmpty = true, najdeme pouze sloty bez rezervací
    if (onlyEmpty) {
      whereCondition.reservations = {
        none: {
          status: {
            in: ['PENDING', 'CONFIRMED']
          }
        }
      }
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('Where condition for bulk delete:', JSON.stringify(whereCondition, null, 2))
    }

    // Najdeme sloty k smazání
    const slotsToDelete = await prisma.slot.findMany({
      where: whereCondition,
      include: {
        reservations: {
          where: {
            status: {
              in: ['PENDING', 'CONFIRMED']
            }
          }
        }
      }
    })

    if (process.env.NODE_ENV === 'development') {
      console.log(`Found ${slotsToDelete.length} slots to delete`)
    }

    // Bezpečnostní kontrola - pokud onlyEmpty = false, zkontroluj rezervace
    if (!onlyEmpty) {
      const slotsWithReservations = slotsToDelete.filter(slot => slot.reservations.length > 0)
      if (slotsWithReservations.length > 0) {
        return res.status(409).json({ 
          error: `Nelze smazat ${slotsWithReservations.length} slotů s aktivními rezervacemi. Použijte možnost "Pouze prázdné sloty".`,
          slotsWithReservations: slotsWithReservations.length
        })
      }
    }

    // Smazání slotů
    const deleteResult = await prisma.slot.deleteMany({
      where: whereCondition
    })

    if (process.env.NODE_ENV === 'development') {
      console.log(`Deleted ${deleteResult.count} slots`)
    }

    res.json({
      message: `Úspěšně smazáno ${deleteResult.count} slotů`,
      deletedCount: deleteResult.count,
      criteria: {
        dateFrom,
        dateTo,
        doctorId: targetDoctorId,
        serviceTypeId,
        roomId,
        onlyEmpty
      }
    })

  } catch (error) {
    console.error('Chyba při bulk mazání slotů:', error)
    res.status(500).json({ error: 'Interní chyba serveru' })
  }
})

// Helper funkce pro generování slotů pro jeden den
function generateDaySlots(
  dateStr: string, 
  startTime: string, 
  endTime: string, 
  interval: number, 
  breakTimes: Array<{start: string, end: string}>, 
  timezone: any,
  serviceTypeDuration?: number
) {
  const slots = []
  
  // Určení skutečné délky slotu
  const actualSlotDuration = serviceTypeDuration || interval || 30 // fallback na 30 min
  const stepInterval = interval || actualSlotDuration // interval pro posun začátků
  
  // Speciální případ: interval 0 = jeden nepřetržitý slot
  if (interval === 0) {
    const slotStart = parseTimezoneDateTime(`${dateStr}T${startTime}:00`, timezone)
    const slotEnd = parseTimezoneDateTime(`${dateStr}T${endTime}:00`, timezone)
    
    // Kontrola, jestli celý rozsah nekoliduje s přestávkou
    let isInBreak = false
    for (const breakTime of breakTimes) {
      if (startTime >= breakTime.start && startTime < breakTime.end) {
        isInBreak = true
        break
      }
    }
    
    if (!isInBreak) {
      slots.push({
        start: slotStart,
        end: slotEnd,
      })
    }
    return slots
  }
  
  // Parse start a end času
  const [startHour, startMin] = startTime.split(':').map(Number)
  const [endHour, endMin] = endTime.split(':').map(Number)
  
  // Vytvoř Date objekty pro začátek a konec
  const currentSlot = parseTimezoneDateTime(`${dateStr}T${startTime}:00`, timezone)
  const endOfDay = parseTimezoneDateTime(`${dateStr}T${endTime}:00`, timezone)
  
  if (process.env.NODE_ENV === 'development') {
    console.log(`🧠 Inteligentní sloty: služba=${actualSlotDuration}min, interval=${stepInterval}min`)
  }
  
  while (currentSlot < endOfDay) {
    // INTELIGENTNÍ SLOTY: Délka slotu podle služby, interval podle nastavení
    const slotEnd = new Date(currentSlot.getTime() + actualSlotDuration * 60 * 1000)
    
    // Slot nesmí přesahovat konec pracovní doby
    if (slotEnd > endOfDay) break
    
    // Kontrola, jestli slot nekoliduje s přestávkou
    const slotStartTime = currentSlot.toLocaleTimeString('en-GB', { 
      timeZone: timezone, 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit' 
    })
    const slotEndTime = slotEnd.toLocaleTimeString('en-GB', { 
      timeZone: timezone, 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit' 
    })
    
    // Kontrola přestávek - slot nesmí začínat v přestávce
    let isInBreak = false
    for (const breakTime of breakTimes) {
      if (slotStartTime >= breakTime.start && slotStartTime < breakTime.end) {
        isInBreak = true
        break
      }
      // Také zkontroluj, jestli slot nezasahuje do přestávky
      if (slotStartTime < breakTime.start && slotEndTime > breakTime.start) {
        isInBreak = true
        break
      }
    }
    
    if (!isInBreak) {
      slots.push({
        start: new Date(currentSlot),
        end: new Date(slotEnd),
      })
      if (process.env.NODE_ENV === 'development') {
        console.log(`✅ Slot vytvořen: ${slotStartTime}-${slotEndTime} (${actualSlotDuration}min)`)
      }
    } else {
      if (process.env.NODE_ENV === 'development') {
        console.log(`⏸️ Slot přeskočen (přestávka): ${slotStartTime}-${slotEndTime}`)
      }
    }
    
    // Přejdi na další slot podle step intervalu (ne podle délky slotu!)
    currentSlot.setTime(currentSlot.getTime() + stepInterval * 60 * 1000)
  }
  
  return slots
}

// === NOTIFIKACE A TESTING ===

// Test endpoint pro notifikace (pouze pro ADMIN)
router.post('/test/notifications', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.sub
    const tenantId = req.user?.tenantId || req.user?.tenant
    const userRole = req.user?.role

    if (!userId || !tenantId) {
      return res.status(400).json({ error: 'Chybí uživatelské údaje' })
    }

    if (userRole !== 'ADMIN') {
      return res.status(403).json({ error: 'Nedostatečná oprávnění - pouze admin' })
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('🧪 Testing notification system...')
    }
    
    const testResult = await notificationService.testNotifications()
    
    res.json({
      success: testResult,
      message: testResult ? 'Notifikace fungují správně' : 'Chyba v notifikačním systému',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Chyba při testování notifikací:', error)
    res.status(500).json({ error: 'Interní chyba serveru' })
  }
})

// Manuální spuštění reminder notifikací (pouze pro ADMIN)
router.post('/notifications/send-reminders', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.sub
    const tenantId = req.user?.tenantId || req.user?.tenant
    const userRole = req.user?.role

    if (!userId || !tenantId) {
      return res.status(400).json({ error: 'Chybí uživatelské údaje' })
    }

    if (userRole !== 'ADMIN') {
      return res.status(403).json({ error: 'Nedostatečná oprávnění - pouze admin' })
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('📧 Manually triggering reminder notifications...')
    }
    
    const sentCount = await notificationService.sendReservationReminders()
    
    res.json({
      success: true,
      sentCount,
      message: `Odesláno ${sentCount} připomínek`,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Chyba při odesílání připomínek:', error)
    res.status(500).json({ error: 'Interní chyba serveru' })
  }
})

// === ADMIN SPRÁVA DOKTORŮ ===

// Vytvoření nového doktora (pouze pro ADMIN)
router.post('/admin/doctors', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.sub
    const tenantId = req.user?.tenantId || req.user?.tenant
    const userRole = req.user?.role
    const { name, email, username, phone, specialization, description, password } = req.body

    if (process.env.NODE_ENV === 'development') {
      console.log('=== DEBUG: POST /admin/doctors ===')
      console.log('userId:', userId)
      console.log('tenantId:', tenantId)
      console.log('userRole:', userRole)
    }

    if (!userId || !tenantId) {
      return res.status(400).json({ error: 'Chybí uživatelské údaje' })
    }

    if (userRole !== 'ADMIN') {
      return res.status(403).json({ error: 'Nedostatečná oprávnění - pouze admin' })
    }

    // Validace povinných polí
    if (!name || !username || !password) {
      return res.status(400).json({ error: 'Jméno, username a heslo jsou povinné' })
    }

    // Kontrola, zda username už neexistuje
    const existingUser = await prisma.user.findFirst({
      where: {
        username,
        tenantId,
      },
    })

    if (existingUser) {
      return res.status(409).json({ error: 'Username už existuje' })
    }

    // Kontrola, zda email už neexistuje (pokud je zadán)
    if (email) {
      const existingEmailUser = await prisma.user.findFirst({
        where: {
          email,
          tenantId,
        },
      })

      if (existingEmailUser) {
        return res.status(409).json({ error: 'Email už existuje' })
      }
    }

    // Hash hesla
    const hashedPassword = await bcrypt.hash(password, 12)

    // Vytvoření uživatele
    const doctorUser = await prisma.user.create({
      data: {
        email: email || null,
        username,
        name,
        phone: phone || null,
        password: hashedPassword,
        authProvider: 'INTERNAL',
        role: 'DOCTOR',
        tenantId,
      },
    })

    // Vytvoření doctor záznamu
    const doctor = await prisma.doctor.create({
      data: {
        userId: doctorUser.id,
        specialization: specialization || 'Malá zvířata',
        description: description || null,
        tenantId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            username: true,
            isActive: true,
          },
        },
      },
    })

    res.status(201).json(doctor)
  } catch (error) {
    console.error('Chyba při vytváření doktora:', error)
    res.status(500).json({ error: 'Interní chyba serveru' })
  }
})

// Aktualizace doktora (pouze pro ADMIN)
router.put('/admin/doctors/:id', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.sub
    const tenantId = req.user?.tenantId || req.user?.tenant
    const userRole = req.user?.role
    const { id } = req.params
    const { name, email, phone, specialization, description, password } = req.body

    if (process.env.NODE_ENV === 'development') {
      console.log('=== DEBUG: PUT /admin/doctors/:id ===')
      console.log('userId:', userId)
      console.log('tenantId:', tenantId)
      console.log('userRole:', userRole)
      console.log('doctorId:', id)
    }

    if (!userId || !tenantId) {
      return res.status(400).json({ error: 'Chybí uživatelské údaje' })
    }

    if (userRole !== 'ADMIN') {
      return res.status(403).json({ error: 'Nedostatečná oprávnění - pouze admin' })
    }

    // Najdi doktora
    const existingDoctor = await prisma.doctor.findFirst({
      where: { id, tenantId },
      include: { user: true },
    })

    if (!existingDoctor) {
      return res.status(404).json({ error: 'Doktor nenalezen' })
    }

    // Kontrola email konfliktu (pokud se mění)
    if (email && email !== existingDoctor.user.email) {
      const existingEmailUser = await prisma.user.findFirst({
        where: {
          email,
          tenantId,
          id: { not: existingDoctor.user.id },
        },
      })

      if (existingEmailUser) {
        return res.status(409).json({ error: 'Email už existuje' })
      }
    }

    // Příprava dat pro update uživatele
    const userUpdateData: any = {
      name,
      email: email || null,
      phone: phone || null,
    }

    // Hash nového hesla pokud je zadané
    if (password) {
      userUpdateData.password = await bcrypt.hash(password, 12)
    }

    // Aktualizace uživatele
    const updatedUser = await prisma.user.update({
      where: { id: existingDoctor.user.id },
      data: userUpdateData,
    })

    // Aktualizace doctor záznamu
    const updatedDoctor = await prisma.doctor.update({
      where: { id },
      data: {
        specialization: specialization || 'Malá zvířata',
        description: description || null,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            username: true,
            isActive: true,
          },
        },
      },
    })

    res.json(updatedDoctor)
  } catch (error) {
    console.error('Chyba při aktualizaci doktora:', error)
    res.status(500).json({ error: 'Interní chyba serveru' })
  }
})

// Změna stavu doktora (aktivní/neaktivní) - pouze pro ADMIN
router.patch('/admin/doctors/:id/status', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.sub
    const tenantId = req.user?.tenantId || req.user?.tenant
    const userRole = req.user?.role
    const { id } = req.params
    const { isActive } = req.body

    if (process.env.NODE_ENV === 'development') {
      console.log('=== DEBUG: PATCH /admin/doctors/:id/status ===')
      console.log('userId:', userId)
      console.log('tenantId:', tenantId)
      console.log('userRole:', userRole)
      console.log('doctorId:', id)
      console.log('isActive:', isActive)
    }

    if (!userId || !tenantId) {
      return res.status(400).json({ error: 'Chybí uživatelské údaje' })
    }

    if (userRole !== 'ADMIN') {
      return res.status(403).json({ error: 'Nedostatečná oprávnění - pouze admin' })
    }

    if (typeof isActive !== 'boolean') {
      return res.status(400).json({ error: 'isActive musí být boolean' })
    }

    // Najdi doktora
    const existingDoctor = await prisma.doctor.findFirst({
      where: { id, tenantId },
      include: { user: true },
    })

    if (!existingDoctor) {
      return res.status(404).json({ error: 'Doktor nenalezen' })
    }

    // Aktualizace stavu uživatele
    const updatedUser = await prisma.user.update({
      where: { id: existingDoctor.user.id },
      data: { isActive },
    })

    // Vrátíme aktualizovaného doktora
    const updatedDoctor = await prisma.doctor.findFirst({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            username: true,
            isActive: true,
          },
        },
      },
    })

    res.json(updatedDoctor)
  } catch (error) {
    console.error('Chyba při změně stavu doktora:', error)
    res.status(500).json({ error: 'Interní chyba serveru' })
  }
})

export default router
