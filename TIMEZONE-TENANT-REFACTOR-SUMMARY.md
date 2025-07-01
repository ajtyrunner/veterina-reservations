# Timezone Refaktor - Konfigurovatelný timezone na tenant úrovni

## Přehled změn

Aplikace byla refaktorována pro podporu konfigurovatelných timezone na úrovni každého tenanta, namísto hardcoded Prague timezone.

## Databázové změny

### Prisma Schema
- **Přidán `timezone` field do Tenant modelu** s defaultní hodnotou `Europe/Prague`
- **Změněny `startTime` a `endTime` ve Slot modelu** na `@db.Timestamptz` pro přesnější timezone handling
- **Vytvoření migrace** `20250701091326_add_tenant_timezone_support`

### Nová migrace
```sql
-- Přidání timezone pole do tenant tabulky
ALTER TABLE "tenants" ADD COLUMN "timezone" TEXT NOT NULL DEFAULT 'Europe/Prague';

-- Změna datetime polí na TIMESTAMPTZ
ALTER TABLE "slots" ALTER COLUMN "startTime" TYPE TIMESTAMPTZ;
ALTER TABLE "slots" ALTER COLUMN "endTime" TYPE TIMESTAMPTZ;
```

## Backend (API) změny

### Nové utility soubory

#### `apps/api/src/utils/timezone.ts`
- **Univerzální timezone funkce** pro všechny IANA timezone
- **`parseTimezoneDateTime()`** - parsuje datetime string v daném timezone
- **`formatTimezoneDateTime()`** - formátuje UTC Date pro daný timezone
- **`getStartOfDayInTimezone()`** a **`getEndOfDayInTimezone()`** - timezone-aware day boundaries
- **Legacy podpora** - zachována kompatibilita s `parsePragueDateTime()`

#### `apps/api/src/utils/tenant.ts`
- **`getTenantTimezone()`** - načte timezone pro daný tenant
- **`getCachedTenantTimezone()`** - cachovaná verze pro optimalizaci
- **Validace timezone** a fallback na default hodnoty

### Upravené API endpointy

#### `apps/api/src/index.ts`
- **Public tenant API** nyní vrací `timezone` field
- **Date filtering** v public slots API používá tenant timezone
- **Timezone-aware day filtering** místo hardcoded Prague

#### `apps/api/src/routes/protected.ts`
- **Vytváření slotů** používá tenant timezone místo Prague
- **Úprava slotů** respektuje tenant timezone
- **Kontrola existujících slotů** timezone-aware

## Frontend změny

### Nové utility soubory

#### `apps/web/lib/timezone.ts`
- **Tenant timezone context** - globální timezone pro aplikaci
- **`setTenantTimezone()`** - nastavení timezone pro celou aplikaci
- **Timezone-aware formátovací funkce** pro zobrazení dat
- **Legacy podpora** - zachována kompatibilita

#### `apps/web/lib/tenant-timezone.ts`
- **`loadTenantInfo()`** - načte tenant informace včetně timezone
- **`initializeTenant()`** - kompletní inicializace tenant konfigurace
- **Tenant branding** - aplikuje barvy a logo

### Nové komponenty

#### `apps/web/app/components/TenantTimezoneInitializer.tsx`
- **Client-side inicializace** tenant timezone při načítání aplikace
- **Automatické načtení** timezone z API
- **Nastavení globálního timezone contextu**

### Upravené komponenty

#### Layout (`apps/web/app/layout.tsx`)
- **Přidán TenantTimezoneInitializer** pro automatickou inicializaci

#### CalendarView (`apps/web/app/components/CalendarView.tsx`)
- **Timezone-aware date filtering** místo hardcoded Prague
- **Správné předávání Date objektů** do formátovacích funkcí

#### Slots Page (`apps/web/app/slots/page.tsx`)
- **Timezone-aware datetime-local minimum** 
- **Opravené formátování datetime-local** pro editaci slotů
- **Timezone-aware date filtering** a quick filters

## Nová architektura

### Timezone Flow
1. **Frontend** načte tenant informace při inicializaci
2. **TenantTimezoneInitializer** nastaví globální timezone context
3. **Všechny timezone operace** používají tenant timezone místo hardcoded
4. **API** respektuje tenant timezone při parsování datetime

### Cachování
- **API cachuje** tenant timezone pro lepší výkon
- **Frontend uchovává** timezone v globálním contextu
- **Invalidace cache** při změnách tenant nastavení

## Podporované timezones

```typescript
const VALID_TIMEZONES = [
  'Europe/Prague',    // Česká republika
  'Europe/Vienna',    // Rakousko  
  'Europe/Berlin',    // Německo
  'Europe/Warsaw',    // Polsko
  'Europe/Budapest',  // Maďarsko
  'Europe/Rome',      // Itálie
  'Europe/Paris',     // Francie
  'Europe/London',    // Velká Británie
  'America/New_York', // USA Východ
  'America/Los_Angeles', // USA Západ
  'Asia/Tokyo',       // Japonsko
  'Australia/Sydney', // Austrálie
] as const
```

## Backward Compatibility

### Legacy funkce zachovány
- `parsePragueDateTime()` - označeno jako deprecated
- `formatDateTimeForAPI()` - kompatibilní interface
- `formatDateTimeFromAPI()` - používá nový timezone system

### Migration path
1. **Existující sloty** automaticky převedeny na TIMESTAMPTZ
2. **Defaultní timezone** je `Europe/Prague` pro všechny existující tenants
3. **API endpoint** vrací timezone informaci pro frontend

## Testování

### Po implementaci testovat:
1. **Vytváření slotů** v různých timezone
2. **Filtrování podle data** respektuje tenant timezone  
3. **Zobrazování časů** ve správném timezone
4. **Editace slotů** zachovává správný timezone
5. **Hranice dní** (start/end of day) v tenant timezone

## Budoucí rozšíření

### Možné vylepšení:
1. **UI pro změnu timezone** v admin rozhraní
2. **Více tenant brandingu** (fonts, layout)
3. **User-level timezone override** (uživatel v jiném timezone než tenant)
4. **Timezone migration tools** pro hromadné změny

## Migration Commands

```bash
# Spuštění migrace
npx prisma migrate dev --name add_tenant_timezone_support

# Vygenerování nového Prisma Client
npx prisma generate

# Obnovení seed dat s timezone
npx tsx prisma/seed.ts
```

## Důležité poznámky

- **Všechny datetime operations** nyní musí specifikovat timezone
- **Frontend automaticky** načte tenant timezone při startu
- **Legacy Prague timezone** kód označen jako deprecated
- **PostgreSQL TIMESTAMPTZ** zajišťuje přesné timezone handling v databázi
- **Cache invalidation** je důležitá při změnách tenant nastavení 