import { body, param, query, validationResult } from 'express-validator'
import { Request, Response, NextFunction } from 'express'
import validator from 'validator'

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
  
  handleValidationErrors
]

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