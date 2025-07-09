import { body, param, query, validationResult } from 'express-validator'
import { Request, Response, NextFunction } from 'express'
import validator from 'validator'
import { PrismaClient } from '@prisma/client'
import { getCachedTenantTimezone } from '../utils/tenant'
import { getStartOfDayInTimezone } from '../utils/timezone'

const prisma = new PrismaClient()

// Middleware pro handling validation errors
export const handleValidationErrors = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    console.log('🚫 Validation failed:', errors.array())
    return res.status(400).json({
      error: 'Neplatná data',
      details: errors.array().map(err => ({
        field: err.type === 'field' ? err.path : 'unknown',
        message: err.msg
      }))
    })
  }
  next()
}

// Validace pro vytvoření rezervace
export const validateCreateReservation = [
  body('slotId')
    .isString()
    .isLength({ min: 1, max: 100 })
    .withMessage('SlotId je povinný a musí být platný string'),
  
  body('petName')
    .optional()
    .isString()
    .isLength({ min: 1, max: 100 })
    .custom((value) => {
      // XSS ochrana - nepovolí HTML tagy
      if (value && value !== validator.escape(value)) {
        throw new Error('Jméno zvířete obsahuje nepovolené znaky')
      }
      return true
    })
    .withMessage('Jméno zvířete musí být 1-100 znaků a nesmí obsahovat HTML'),
  
  body('petType')
    .optional()
    .isString()
    .isLength({ min: 1, max: 50 })
    .isIn(['pes', 'kočka', 'králík', 'pták', 'hlodavec', 'plaz', 'jiné'])
    .withMessage('Druh zvířete musí být z povoleného seznamu'),
  
  body('description')
    .optional()
    .isString()
    .isLength({ max: 1000 })
    .custom((value) => {
      if (value && value !== validator.escape(value)) {
        throw new Error('Popis obsahuje nepovolené znaky')
      }
      return true
    })
    .withMessage('Popis nesmí být delší než 1000 znaků a nesmí obsahovat HTML'),
  
  body('phone')
    .optional()
    .isString()
    .isLength({ max: 20 })
    .custom((value) => {
      if (value) {
        // Odebereme mezery, pomlčky a závorky pro validaci
        const cleaned = value.replace(/[\s\-\(\)]/g, '')
        
        // Kontrola základní délky
        if (cleaned.length < 7) {
          throw new Error('Telefonní číslo je příliš krátké. Minimálně 7 číslic.')
        }
        
        if (cleaned.length > 15) {
          throw new Error('Telefonní číslo je příliš dlouhé. Maximálně 15 číslic.')
        }
        
        // Kontrola, že obsahuje pouze číslice a povolené znaky
        if (!/^[\+\d]+$/.test(cleaned)) {
          throw new Error('Telefonní číslo může obsahovat pouze číslice a znak +.')
        }
        
        // České telefonní číslo - různé formáty
        const czechPatterns = [
          /^[67]\d{8}$/,                    // 777456789 (9 číslic, začíná 6 nebo 7)
          /^0[67]\d{8}$/,                   // 0777456789 (10 číslic, začíná 06 nebo 07)
          /^\+420[67]\d{8}$/,               // +420777456789 (mezinárodní s +)
          /^420[67]\d{8}$/,                 // 420777456789 (mezinárodní bez +)
          /^00420[67]\d{8}$/,               // 00420777456789 (mezinárodní s 00)
        ]
        
        // Mezinárodní čísla (základní validace)
        const internationalPattern = /^\+[1-9]\d{6,14}$/
        
        // Odebereme + pro testování vzorů bez +
        const cleanedWithoutPlus = cleaned.startsWith('+') ? cleaned.substring(1) : cleaned
        
        // Testujeme české vzory
        const isCzechValid = czechPatterns.some(pattern => 
          pattern.test(cleaned) || pattern.test(cleanedWithoutPlus)
        )
        
        // Testujeme mezinárodní vzor
        const isInternationalValid = internationalPattern.test(cleaned)
        
        if (!isCzechValid && !isInternationalValid) {
          // Specifická diagnostika pro české číslo
          if (cleaned.length === 9 || cleaned.length === 10 || 
              cleaned.startsWith('420') || cleaned.startsWith('+420') || cleaned.startsWith('00420')) {
            
            // Extrahujeme základní číslo pro diagnostiku
            let coreNumber = cleaned
            if (cleaned.startsWith('+420')) coreNumber = cleaned.substring(4)
            else if (cleaned.startsWith('420')) coreNumber = cleaned.substring(3)
            else if (cleaned.startsWith('00420')) coreNumber = cleaned.substring(5)
            else if (cleaned.startsWith('0')) coreNumber = cleaned.substring(1)
            
            if (coreNumber.length !== 9) {
              throw new Error(`České číslo má nesprávnou délku. Má ${coreNumber.length} číslic, ale očekává se 9. Příklad: 777123456`)
            }
            
            if (!/^[67]/.test(coreNumber)) {
              throw new Error(`České mobilní číslo musí začínat číslicí 6 nebo 7. Vaše číslo začíná ${coreNumber[0]}. Příklad: 777123456`)
            }
          }
          
          throw new Error('Neplatný formát telefonního čísla. Podporované formáty:\n• České: 777123456, 0777123456, +420777123456\n• Mezinárodní: +49123456789, +33123456789')
        }
        
        // Další validace pro české čísla
        if (isCzechValid) {
          // Extrahujeme čísla bez předvolby pro dodatečnou validaciju
          let coreNumber = cleaned
          if (cleaned.startsWith('+420')) coreNumber = cleaned.substring(4)
          else if (cleaned.startsWith('420')) coreNumber = cleaned.substring(3)
          else if (cleaned.startsWith('00420')) coreNumber = cleaned.substring(5)
          else if (cleaned.startsWith('0')) coreNumber = cleaned.substring(1)
          
          // České mobilní čísla musí začínat 6 nebo 7
          if (coreNumber.length === 9 && !/^[67]/.test(coreNumber)) {
            throw new Error(`České mobilní číslo musí začínat číslicí 6 nebo 7. Vaše číslo začíná ${coreNumber[0]}. Příklad: 777123456`)
          }
        }
      }
      return true
    }),
  
  handleValidationErrors
]

// Nová validace pro kontrolu časování rezervace (pouze pro klienty)
export const validateReservationTiming = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { slotId } = req.body
    const tenantId = req.user?.tenant
    const userRole = req.user?.role

    if (!slotId || !tenantId) {
      return next() // Základní validace se řeší jinde
    }

    // Pouze klienti mají omezení "od zítřka"
    if (userRole !== 'CLIENT') {
      if (process.env.NODE_ENV === 'development') {
        console.log('🕐 Validace časování: DOCTOR/ADMIN - bez omezení')
        console.log('- User role:', userRole)
      }
      return next() // Doktoři a admini mohou rezervovat kdykoliv
    }

    // Najdi slot a jeho čas
    const slot = await prisma.slot.findFirst({
      where: {
        id: slotId,
        tenantId,
      },
      select: {
        startTime: true,
        endTime: true,
      },
    })

    if (!slot) {
      return next() // Existence slotu se řeší jinde
    }

    // Získej timezone tenanta
    const tenantTimezone = await getCachedTenantTimezone(prisma, tenantId)
    
    // Získej začátek zítřejšího dne v tenant timezone
    const now = new Date()
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)
    const tomorrowDateStr = tomorrow.toLocaleDateString('sv-SE', { timeZone: tenantTimezone })
    const tomorrowStartUTC = getStartOfDayInTimezone(tomorrowDateStr, tenantTimezone)

    if (process.env.NODE_ENV === 'development') {
      console.log('🕐 Validace časování rezervace (CLIENT):')
      console.log('- User role:', userRole)
      console.log('- Aktuální čas:', now.toISOString())
      console.log('- Tenant timezone:', tenantTimezone)
      console.log('- Zítřejší datum:', tomorrowDateStr)
      console.log('- Začátek zítřka UTC:', tomorrowStartUTC.toISOString())
      console.log('- Slot začíná:', slot.startTime.toISOString())
      console.log('- Slot je od zítřka:', slot.startTime >= tomorrowStartUTC)
    }

    // Kontrola, že slot je nejdříve od zítřka (pouze pro klienty)
    if (slot.startTime < tomorrowStartUTC) {
      const slotDateInTimezone = slot.startTime.toLocaleDateString('cs-CZ', { 
        timeZone: tenantTimezone,
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
      
      return res.status(400).json({ 
        error: `Rezervace lze vytvářet nejdříve od následujícího dne. Vybraný termín (${slotDateInTimezone}) je příliš brzy. Prosím vyberte termín od zítřka.` 
      })
    }

    next()
  } catch (error) {
    console.error('Chyba při validaci časování rezervace:', error)
    return res.status(500).json({ error: 'Interní chyba serveru při validaci času' })
  }
}

// Validace pro vytvoření slotu
export const validateCreateSlot = [
  body('startTime')
    .isISO8601()
    .withMessage('Čas začátku musí být platný ISO8601 datum'),
  
  body('endTime')
    .isISO8601()
    .withMessage('Čas konce musí být platný ISO8601 datum')
    .custom((endTime, { req }) => {
      const startTime = new Date(req.body.startTime)
      const end = new Date(endTime)
      
      if (end <= startTime) {
        throw new Error('Čas konce musí být po času začátku')
      }
      
      // Max 8 hodin na slot
      const maxDuration = 8 * 60 * 60 * 1000 // 8 hodin v ms
      if (end.getTime() - startTime.getTime() > maxDuration) {
        throw new Error('Slot nesmí být delší než 8 hodin')
      }
      
      return true
    }),
  
  body('equipment')
    .optional()
    .isString()
    .isLength({ max: 500 })
    .custom((value) => {
      if (value && value !== validator.escape(value)) {
        throw new Error('Vybavení obsahuje nepovolené znaky')
      }
      return true
    })
    .withMessage('Vybavení nesmí být delší než 500 znaků'),
  
  body('roomId')
    .optional()
    .isString()
    .isLength({ min: 1, max: 100 })
    .withMessage('RoomId musí být platný string'),
  
  body('serviceTypeId')
    .optional()
    .isString()
    .isLength({ min: 1, max: 100 })
    .withMessage('ServiceTypeId musí být platný string'),
  
  handleValidationErrors
]

// Validace pro bulk generování slotů
export const validateBulkSlotGeneration = [
  body('weekdays')
    .isArray({ min: 1, max: 7 })
    .withMessage('Dny v týdnu musí být pole s 1-7 prvky')
    .custom((weekdays) => {
      if (!weekdays.every((day: any) => Number.isInteger(day) && day >= 0 && day <= 6)) {
        throw new Error('Dny v týdnu musí být čísla 0-6')
      }
      return true
    }),
  
  body('startTime')
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Čas začátku musí být ve formátu HH:MM'),
  
  body('endTime')
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Čas konce musí být ve formátu HH:MM')
    .custom((endTime, { req }) => {
      const [startHour, startMin] = req.body.startTime.split(':').map(Number)
      const [endHour, endMin] = endTime.split(':').map(Number)
      
      const startMinutes = startHour * 60 + startMin
      const endMinutes = endHour * 60 + endMin
      
      if (endMinutes <= startMinutes) {
        throw new Error('Čas konce musí být po času začátku')
      }
      
      return true
    }),
  
  body('interval')
    .isInt({ min: 0, max: 480 })
    .withMessage('Interval musí být číslo mezi 0-480 minutami'),
  
  body('weeksCount')
    .isInt({ min: 1, max: 26 }) // Sníženo z 52 na 26 pro bezpečnost
    .withMessage('Počet týdnů musí být mezi 1-26'),
  
  body('startDate')
    .isISO8601()
    .withMessage('Datum začátku musí být platný ISO8601 datum')
    .custom((startDate) => {
      const date = new Date(startDate)
      const now = new Date()
      const maxFuture = new Date()
      maxFuture.setFullYear(now.getFullYear() + 1) // Max rok dopředu
      
      if (date < now) {
        throw new Error('Datum začátku nemůže být v minulosti')
      }
      
      if (date > maxFuture) {
        throw new Error('Datum začátku nemůže být více než rok dopředu')
      }
      
      return true
    }),
  
  body('breakTimes')
    .optional()
    .isArray({ max: 10 })
    .withMessage('Přestávky musí být pole s max 10 prvky')
    .custom((breakTimes) => {
      if (breakTimes) {
        for (const breakTime of breakTimes) {
          if (!breakTime.start || !breakTime.end) {
            throw new Error('Každá přestávka musí mít start a end')
          }
          if (!/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(breakTime.start) ||
              !/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(breakTime.end)) {
            throw new Error('Časy přestávek musí být ve formátu HH:MM')
          }
        }
      }
      return true
    }),
  
  body('doctorId')
    .optional()
    .isString()
    .isLength({ min: 1, max: 100 })
    .withMessage('DoctorId musí být platný string'),
  
  handleValidationErrors
]

// Validace pro aktualizaci statusu rezervace
export const validateUpdateReservationStatus = [
  param('id')
    .isString()
    .isLength({ min: 1, max: 100 })
    .withMessage('ID rezervace musí být platný string'),
  
  body('status')
    .isIn(['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED'])
    .withMessage('Status musí být jeden z: PENDING, CONFIRMED, CANCELLED, COMPLETED'),
  
  body('notes')
    .optional()
    .isString()
    .isLength({ max: 2000 })
    .custom((value) => {
      if (value && value !== validator.escape(value)) {
        throw new Error('Poznámky obsahují nepovolené znaky')
      }
      return true
    })
    .withMessage('Poznámky nesmí být delší než 2000 znaků'),
  
  handleValidationErrors
]

// Validace pro vytvoření room/service type
export const validateCreateRoom = [
  body('name')
    .isString()
    .isLength({ min: 1, max: 100 })
    .custom((value) => {
      if (value !== validator.escape(value)) {
        throw new Error('Název obsahuje nepovolené znaky')
      }
      return true
    })
    .withMessage('Název je povinný, 1-100 znaků, bez HTML'),
  
  body('description')
    .optional()
    .isString()
    .isLength({ max: 500 })
    .custom((value) => {
      if (value && value !== validator.escape(value)) {
        throw new Error('Popis obsahuje nepovolené znaky')
      }
      return true
    })
    .withMessage('Popis nesmí být delší než 500 znaků'),
  
  body('capacity')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Kapacita musí být číslo mezi 1-100'),
  
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('IsActive musí být boolean'),
  
  handleValidationErrors
]

// Validace pro vytvoření service type
export const validateCreateServiceType = [
  body('name')
    .isString()
    .isLength({ min: 1, max: 100 })
    .custom((value) => {
      if (value !== validator.escape(value)) {
        throw new Error('Název obsahuje nepovolené znaky')
      }
      return true
    })
    .withMessage('Název je povinný, 1-100 znaků, bez HTML'),
  
  body('description')
    .optional()
    .isString()
    .isLength({ max: 500 })
    .custom((value) => {
      if (value && value !== validator.escape(value)) {
        throw new Error('Popis obsahuje nepovolené znaky')
      }
      return true
    })
    .withMessage('Popis nesmí být delší než 500 znaků'),
  
  body('duration')
    .optional()
    .isInt({ min: 5, max: 480 })
    .withMessage('Délka musí být mezi 5-480 minutami'),
  
  body('durationMinutes')
    .optional()
    .isInt({ min: 5, max: 480 })
    .withMessage('Délka musí být mezi 5-480 minutami'),
  
  body('price')
    .optional()
    .isFloat({ min: 0, max: 999999 })
    .withMessage('Cena musí být kladné číslo do 999999'),
  
  body('color')
    .optional()
    .matches(/^#[0-9A-Fa-f]{6}$/)
    .withMessage('Barva musí být platný hex kód (#RRGGBB)'),
  
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('IsActive musí být boolean'),
  
  handleValidationErrors
]

// Validace pro query parametry
export const validateQueryParams = [
  query('status')
    .optional()
    .isIn(['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED'])
    .withMessage('Status musí být jeden z povolených'),
  
  query('doctorId')
    .optional()
    .isString()
    .isLength({ min: 1, max: 100 })
    .withMessage('DoctorId musí být platný string'),
  
  query('date')
    .optional()
    .isDate()
    .withMessage('Datum musí být platné'),
  
  handleValidationErrors
] 