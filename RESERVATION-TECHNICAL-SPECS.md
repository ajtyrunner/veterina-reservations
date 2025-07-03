# Technická specifikace - Management rezervací

## API Endpointy

### 1. Vytvoření rezervace
```http
POST /api/reservations
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "slotId": "clxxx...",
  "petName": "Rex",
  "petType": "Pes",
  "description": "Očkování",
  "phone": "+420 777 123 456"
}
```

**Validace při vytváření:**
```typescript
// 1. Ověření existence slotu
const slot = await prisma.slot.findFirst({
  where: { id: slotId, tenantId, isAvailable: true },
  include: { reservations: true }
})

// 2. Kontrola dostupnosti
if (slot.reservations.length > 0) {
  return 409 // Conflict
}

// 3. Vytvoření rezervace
const reservation = await prisma.reservation.create({
  data: { userId, doctorId: slot.doctorId, slotId, ... }
})
```

### 2. Získání dostupných slotů
```http
GET /api/public/slots/:tenantId?date=2024-01-15&doctorId=xxx
```

**Algoritmus filtrace:**
```typescript
// 1. Základní filtr
const slots = await prisma.slot.findMany({
  where: {
    tenantId,
    isAvailable: true,
    // timezone-aware date filtering
    startTime: { gte: startDateUTC, lte: endDateUTC }
  },
  include: {
    reservations: {
      where: { status: { in: ['PENDING', 'CONFIRMED'] } }
    }
  }
})

// 2. Filtrace dostupných
const availableSlots = slots.filter(slot => 
  slot.reservations.length === 0
)
```

### 3. Zrušení rezervace
```http
DELETE /api/reservations/:id
Authorization: Bearer <jwt_token>
```

**Logika zrušení:**
```typescript
// 1. Ověření oprávnění (pouze vlastník)
const reservation = await prisma.reservation.findFirst({
  where: { id, userId, tenantId }
})

// 2. Změna statusu
await prisma.reservation.update({
  where: { id },
  data: { status: 'CANCELLED' }
})

// 3. Slot se automaticky uvolní při dalším dotazu
// (filtr ignoruje CANCELLED rezervace)
```

## Datové struktury

### Slot Model
```typescript
interface Slot {
  id: string
  doctorId: string
  roomId?: string
  serviceTypeId?: string
  startTime: Date // UTC timestamp
  endTime: Date   // UTC timestamp
  isAvailable: boolean // Může doktor přijímat rezervace?
  equipment?: string
  tenantId: string
  
  // Relations
  reservations: Reservation[] // 0..1 aktivní rezervace
}
```

### Reservation Model
```typescript
interface Reservation {
  id: string
  userId: string
  doctorId: string
  slotId: string // UNIQUE constraint
  petName?: string
  petType?: string
  description?: string
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED'
  tenantId: string
  createdAt: Date
  updatedAt: Date
}
```

## Algoritmy

### 1. Kontrola dostupnosti slotu
```typescript
function isSlotAvailable(slot: Slot): boolean {
  return slot.isAvailable && 
         slot.reservations.filter(r => 
           r.status === 'PENDING' || r.status === 'CONFIRMED'
         ).length === 0
}
```

### 2. Timezone-aware filtering
```typescript
function getDateFilterUTC(date: string, timezone: string): [Date, Date] {
  const startOfDay = getStartOfDayInTimezone(date, timezone)
  const endOfDay = getEndOfDayInTimezone(date, timezone)
  return [startOfDay, endOfDay]
}
```

### 3. Race condition protection
```typescript
async function createReservationSafely(slotId: string, data: ReservationData) {
  return await prisma.$transaction(async (tx) => {
    // 1. Lock slot for update
    const slot = await tx.slot.findFirst({
      where: { id: slotId, isAvailable: true },
      include: { reservations: true }
    })
    
    // 2. Double-check availability
    if (slot.reservations.length > 0) {
      throw new Error('Slot již rezervován')
    }
    
    // 3. Create reservation atomically
    return tx.reservation.create({ data })
  })
}
```

## Notifikační systém

### Workflow notifikací
```typescript
// Po vytvoření rezervace
await notificationService.sendReservationStatusNotification({
  reservationId,
  tenantId,
  newStatus: 'PENDING',
  notifyBoth: false // Pouze doktor
})

// Po potvrzení doktorem
await notificationService.sendReservationStatusNotification({
  reservationId,
  tenantId,
  oldStatus: 'PENDING',
  newStatus: 'CONFIRMED',
  notifyBoth: false // Pouze klient
})

// Po zrušení
await notificationService.sendReservationStatusNotification({
  reservationId,
  tenantId,
  oldStatus: 'PENDING',
  newStatus: 'CANCELLED',
  notifyBoth: true // Oba - klient i doktor
})
```

## Debugging a monitoring

### Klíčové logy
```typescript
// V development módu
if (process.env.NODE_ENV === 'development') {
  console.log('=== DEBUG: Creating reservation ===')
  console.log('slotId:', slotId)
  console.log('slot availability:', slot.isAvailable)
  console.log('existing reservations:', slot.reservations.length)
}
```

### Důležité metriky
```typescript
// Business metriky
const metrics = {
  totalReservations: count,
  successfulBookings: confirmed + completed,
  cancellationRate: cancelled / total,
  averageConfirmationTime: avgTime,
  raceConditionErrors: error409Count
}
```

## Frontend integrace

### Real-time updates
```typescript
// Po zrušení rezervace
const confirmCancelReservation = async (reservationId: string) => {
  await deleteReservation(reservationId)
  
  // Aktualizace local state
  setReservations(prev => prev.filter(r => r.id !== reservationId))
  
  // TODO: WebSocket notifikace ostatním uživatelům
}
```

### Slot refresh logika
```typescript
// Automatický refresh po změnách
useEffect(() => {
  const interval = setInterval(() => {
    if (selectedDate) {
      loadSlots() // Znovu načte dostupné sloty
    }
  }, 30000) // Každých 30 sekund
  
  return () => clearInterval(interval)
}, [selectedDate])
```

## Bezpečnostní aspekty

### Rate limiting
```typescript
// Pro vytváření rezervací
export const createOperationLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minut
  max: process.env.NODE_ENV === 'development' ? 1000 : 10,
  message: { error: 'Příliš mnoho pokusů o rezervaci' }
})
```

### Validace oprávnění
```typescript
// Pouze vlastník může rušit rezervaci
const reservation = await prisma.reservation.findFirst({
  where: { id, userId, tenantId } // userId z JWT tokenu
})

// Pouze doktor může měnit status svých rezervací
if (userRole === 'DOCTOR') {
  whereCondition.doctorId = doctor.id
}
```

## Známé limitace a TODO

### 1. ⚠️ Race Conditions
- **Problem**: Window mezi check a create
- **Solution**: Database transactions + FOR UPDATE lock

### 2. ⚠️ PENDING Timeout
- **Problem**: Rezervace může zůstat PENDING navždy
- **Solution**: Scheduled cleanup job

### 3. ⚠️ Optimistic concurrency
- **Problem**: Concurrent updates rezervací
- **Solution**: updatedAt versioning

### 4. 🔄 Real-time updates
- **Current**: Manual refresh
- **Needed**: WebSocket notifications

---

*Tento dokument obsahuje implementační detaily pro vývojáře pracující na systému rezervací.* 