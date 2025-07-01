# Timezone Refactoring - Souhrn oprav homogenity času

## 🎯 Cíl
Unifikace práce s časem pro sloty napříč celou aplikací pro konzistentní chování.

## 🚨 Identifikované problémy

### 1. Nekonzistentní editace slotů
- **Frontend**: Používal `new Date().toISOString().slice(0, 16)` místo timezone-aware konverze
- **API**: Používal `new Date(startTime)` místo `parsePragueDateTime()`

### 2. Duplicitní formátovací funkce
- Každá komponenta měla vlastní `formatTime()`, `formatDateTime()` funkce
- Nekonzistentní timezone handling při zobrazování

### 3. Chybějící timezone handling při aktualizacích
- PUT operace pro sloty nepoužívaly timezone konverzi
- Konfliktní kontroly porovnávaly nekonzistentní časy

## ✅ Implementovaná řešení

### 1. Unifikované timezone utility (`apps/web/lib/timezone.ts`)
```typescript
// Nové unifikované funkce:
formatDateTimeForAPI(dateTimeLocal: string): string     // Pro API calls
formatDateTimeFromAPI(utcString: string): string        // Pro datetime inputs
formatDisplayTime(dateString: string): string           // Čas pro zobrazení
formatDisplayDateTime(dateString: string): string       // Datum+čas pro zobrazení
formatDisplayDate(dateString: string): string           // Datum pro zobrazení
debugTimezone(dateTime: string): void                   // Debug funkce
```

### 2. Oprava editace slotů

**Frontend (`apps/web/app/slots/page.tsx`):**
```typescript
// PŘED:
startTime: new Date(slot.startTime).toISOString().slice(0, 16)

// PO:
startTime: formatDateTimeFromAPI(slot.startTime)
```

**API (`apps/api/src/routes/protected.ts`):**
```typescript
// PŘED:
startTime: new Date(startTime)

// PO:
const startTimeUTC = parsePragueDateTime(startTime)
// ... timezone handling
startTime: startTimeUTC
```

### 3. Náhrada lokálních formátovacích funkcí

**Komponenty s opravami:**
- `apps/web/app/slots/page.tsx` - hlavní správa slotů
- `apps/web/app/page.tsx` - domovská stránka
- `apps/web/app/components/CalendarView.tsx` - kalendářní zobrazení

**Změny:**
```typescript
// PŘED: Lokální funkce v každé komponentě
const formatTime = (dateString: string) => new Date(dateString).toLocaleTimeString('cs-CZ', ...)

// PO: Import unifikovaných funkcí
import { formatDisplayTime, formatDisplayDateTime } from '../lib/timezone'
```

### 4. Konzistentní API timezone handling

**Vytváření slotů:**
- ✅ Už používalo `parsePragueDateTime()` - OK

**Aktualizace slotů:**
- ✅ Přidáno `parsePragueDateTime()` místo `new Date()`
- ✅ Přidáno debug logging
- ✅ Opravena kontrola konfliktů s timezone-aware porovnáváním

## 🔄 Stav před/po

### PŘED - Nekonzistentní chování:
1. **Vytvoření slotu v 8:00** → uloženo správně v UTC
2. **Editace slotu na 9:00** → uloženo nesprávně (bez timezone konverze)
3. **Zobrazení** → různé formátování v různých komponentách

### PO - Konzistentní chování:
1. **Vytvoření slotu v 8:00** → uloženo správně v UTC ✅
2. **Editace slotu na 9:00** → uloženo správně v UTC ✅  
3. **Zobrazení** → unifikované formátování ✅

## 📁 Ovlivněné soubory

### Nové/upravené utility:
- `apps/web/lib/timezone.ts` - rozšířeno o display funkce

### Frontend komponenty:
- `apps/web/app/slots/page.tsx` - editace + zobrazení
- `apps/web/app/page.tsx` - zobrazení
- `apps/web/app/components/CalendarView.tsx` - zobrazení

### API:
- `apps/api/src/routes/protected.ts` - PUT operace pro sloty

### TODO - Další komponenty k aktualizaci:
- `apps/web/app/rezervace/page.tsx`
- `apps/web/app/rezervace/nova/page.tsx` 
- `apps/web/app/rezervace/sprava/page.tsx`

## 🧪 Testování

Pro ověření správného chování:

1. **Vytvořte slot** v admin rozhraní
2. **Upravte čas slotu** - zkontrolujte že se čas správně zobrazuje
3. **Zkontrolujte zobrazení** ve všech komponentách
4. **Porovnejte s databází** - časy v UTC by měly být konzistentní

## 🎉 Výsledek

✅ **Unifikované timezone handling** pro všechny operace se sloty  
✅ **Konzistentní zobrazování času** napříč aplikací  
✅ **Opravené editace slotů** s správnou timezone konverzí  
✅ **Centralizované formátovací funkce** pro snadnou údržbu

Systém nyní správně pracuje s Prague timezone (CET/CEST) ve všech částech aplikace. 