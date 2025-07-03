# Analýza systému managementu rezervací

## Přehled systému

Veterinární rezervační systém používá kombinaci slotů a rezervací pro správu termínů. Systém podporuje multiple tenants s timezone-aware handling a automatickými notifikacemi.

## Klíčové komponenty

### 1. Datový model
```
Slot (1) <---> (0..1) Reservation
- slotId v Reservation je UNIQUE
- Jeden slot může mít maximálně jednu aktivní rezervaci
- Slot.isAvailable kontroluje základní dostupnost
```

### 2. Stavy rezervací
- **PENDING** - Nová rezervace čeká na potvrzení doktora
- **CONFIRMED** - Doktor potvrdil rezervaci
- **CANCELLED** - Rezervace zrušena (klientem nebo doktorem)
- **COMPLETED** - Rezervace dokončena

## Algoritmus dostupnosti slotů

### Veřejné API (`/api/public/slots/:tenantId`)
```typescript
// Podmínka dostupnosti
const availableSlots = slots.filter(slot => 
  slot.isAvailable === true && 
  slot.reservations.length === 0
)

// Rezervace se počítají pouze se statusem PENDING nebo CONFIRMED
reservations.where({
  status: { in: ['PENDING', 'CONFIRMED'] }
})
```

### ✅ **POZITIVNÍ: Automatická recyklace**
Zrušené rezervace (CANCELLED) **automaticky uvolňují slot**, protože:
1. Filtr ignoruje rezervace se statusem CANCELLED
2. Slot se okamžitě stává dostupným pro nové rezervace
3. Žádný manuální cleanup není potřeba

## Scénáře použití

### 1. 🎯 Happy Path Scenario
1. **Zobrazení slotů**: Klient vidí dostupné sloty
2. **Rezervace**: POST `/api/reservations` s validací dostupnosti
3. **Notifikace**: Automatická notifikace doktorovi
4. **Potvrzení**: Doktor mění status na CONFIRMED
5. **Dokončení**: Po termínu status COMPLETED

### 2. 🔄 Zrušení a recyklace
1. **Zrušení klientem**: DELETE `/api/reservations/:id` → status CANCELLED
2. **Zrušení doktorem**: PATCH `/api/reservations/:id` → status CANCELLED  
3. **Automatické uvolnění**: Slot okamžitě dostupný pro nové rezervace
4. **Frontend refresh**: Nové zobrazení dostupných slotů

### 3. ⚡ Race Conditions
```typescript
// Současná ochrana
const slot = await prisma.slot.findFirst({
  where: { id: slotId, tenantId, isAvailable: true },
  include: { reservations: true }
})

if (slot.reservations.length > 0) {
  return res.status(409).json({ error: 'Slot je již rezervovaný' })
}
```

## 🚨 Identifikované problémy

### 1. **KRITICKÉ: Race Condition v rezervaci**
**Problém**: Mezi kontrolou dostupnosti a vytvořením rezervace může jiný uživatel rezervovat stejný slot.

**Současné řešení**: Základní kontrola `slot.reservations.length > 0`

**Doporučení**: Implementovat database-level locking
```sql
-- PostgreSQL approach
SELECT * FROM slots WHERE id = ? FOR UPDATE;
```

### 2. **STŘEDNÍ: Nekonzistentní timeout handling**
**Problém**: PENDING rezervace mohou zůstat věčně bez automatického cleanup.

**Impact**: Slot zůstává "blokovaný" i když doktor nereaguje.

**Doporučení**: 
- Automatický timeout PENDING → CANCELLED po 24 hodinách
- Scheduled job pro cleanup starých PENDING rezervací

### 3. **NÍZKÉ: Chybí audit trail**
**Problém**: Není úplný log změn statusů rezervací.

**Doporučení**: Implementovat ReservationHistory tabulku.

### 4. **NÍZKÉ: Frontend refresh latency**
**Problém**: Po zrušení rezervace se sloty neobnovují automaticky.

**Současné řešení**: Manuální refresh nebo page reload.

**Doporučení**: WebSocket real-time updates nebo polling.

## 🔧 Doporučené vylepšení

### 1. Database Transactions pro rezervace
```typescript
await prisma.$transaction(async (tx) => {
  const slot = await tx.slot.findFirst({
    where: { id: slotId, isAvailable: true },
    include: { reservations: true }
  })
  
  if (slot.reservations.length > 0) {
    throw new Error('Slot již rezervován')
  }
  
  return tx.reservation.create({ data: reservationData })
})
```

### 2. Automatický cleanup job
```typescript
// Denní cleanup starých PENDING rezervací
const expiredReservations = await prisma.reservation.updateMany({
  where: {
    status: 'PENDING',
    createdAt: { lte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
  },
  data: { status: 'CANCELLED' }
})
```

### 3. Optimistické locking
```typescript
// Použití updatedAt pro optimistické locking
const reservation = await prisma.reservation.update({
  where: { 
    id: reservationId,
    updatedAt: expectedUpdatedAt // Prevent concurrent updates
  },
  data: { status: newStatus }
})
```

## 📊 Metriky pro monitoring

### 1. Business metriky
- Počet úspěšných rezervací vs. race conditions (409 errors)
- Průměrná doba od PENDING → CONFIRMED
- Procento zrušených rezervací

### 2. Technical metriky  
- Latence API endpointů
- Database lock contention
- Notification delivery rate

## 🏗️ Architektura současného řešení

### Silné stránky
✅ **Automatická recyklace slotů** - zrušené rezervace okamžitě uvolňují slot
✅ **Timezone-aware handling** - správná práce s časovými zónami
✅ **Role-based access** - různá oprávnění pro klienty/doktory/adminy
✅ **Comprehensive notifications** - e-mailové notifikace všech změn
✅ **Unique constraints** - databázové omezení zabraňují duplicitním rezervacím

### Oblasti pro zlepšení
⚠️ **Race conditions** - potřeba lepšího lockingu
⚠️ **PENDING timeout** - automatický cleanup
⚠️ **Real-time updates** - okamžité obnovení frontend
⚠️ **Audit logging** - kompletní historie změn

## 🔄 Flowchart popis

Vytvořený flowchart zobrazuje:
1. **Zelené kroky** - úspěšné operace
2. **Červené kroky** - chybové stavy a race conditions  
3. **Žluté kroky** - varování a timeout situace
4. **Šedé kroky** - běžné procesní kroky

Klíčové pozorování: **Systém dobře řeší recyklaci slotů**, ale má mezery v concurrent access handling.

---

*Tento dokument slouží jako referenční materiál pro budoucí vývoj a optimalizace systému rezervací.* 