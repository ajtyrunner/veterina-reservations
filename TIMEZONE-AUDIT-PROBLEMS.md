# Audit timezone konzistence - Kritické problémy

## 🚨 ZÁVAŽNÉ PROBLÉMY NALEZENÉ

### 1. **API filtrování podle data - NESPRÁVNÉ timezone handling**

**Problém v `apps/api/src/index.ts:127-137`:**
```typescript
if (date) {
  const startDate = new Date(date as string)  // ❌ Používá systémový timezone!
  const endDate = new Date(startDate)
  endDate.setDate(startDate.getDate() + 1)
  
  where.startTime = {
    gte: startDate,  // ❌ Porovnává s místním časem místo UTC
    lt: endDate,
  }
}
```

**Problém:** Když frontend pošle datum `2024-01-15`, API vytvoří `new Date('2024-01-15')` který se interpretuje podle timezone serveru. Pokud server běží v jiném timezone než Prague, filtrování nebude fungovat správně.

### 2. **Frontend filtrování podle data - NESPRÁVNÉ timezone handling**

**Problém v `apps/web/app/slots/page.tsx:341-347`:**
```typescript
if (filters.date) {
  const filterDate = new Date(filters.date)  // ❌ Lokální timezone
  filtered = filtered.filter(slot => {
    const slotDate = new Date(slot.startTime)  // ❌ UTC -> lokální bez Prague timezone
    return slotDate.toDateString() === filterDate.toDateString()
  })
}
```

**Problém:** Porovnává data v různých timezone bez explicitního Prague timezone handling.

### 3. **Nekonzistentní formátovací funkce**

**Problémy s duplicitními funkcemi:**
- `apps/web/app/rezervace/page.tsx:75-85` - lokální `formatTime`, `formatDate`
- `apps/web/app/rezervace/sprava/page.tsx:121-135` - lokální `formatDateTime`, `formatTime`
- `apps/web/app/rezervace/nova/page.tsx:116-125` - lokální `formatDateTime`

**Problém:** Každá komponenta má vlastní implementaci bez explicitního Prague timezone.

### 4. **Nekonzistentní datetime-local handling**

**Problémy v různých komponentách:**
- Frontend používá `datetime-local` inputy
- Některé komponenty používají `toISOString().slice(0,16)` (nesprávně)
- Jiné používají `formatDateTimeFromAPI()` (správně)
- Chybí konzistentní handling při odesílání na API

### 5. **API nekonzistentní timezone handling**

**Vytváření slotů:**
- ✅ Používá `parsePragueDateTime()` - SPRÁVNĚ

**Editace slotů:**
- ✅ Nyní opraveno na `parsePragueDateTime()` - SPRÁVNĚ

**Kontrola existujících slotů při vytváření:**
```typescript
startTime: new Date(startTime),  // ❌ STÁLE NESPRÁVNĚ!
endTime: new Date(endTime),      // ❌ STÁLE NESPRÁVNĚ!
```

## 🎯 Dopad na různé timezone databáze

### Scénář: DB běží v UTC, server v EST, uživatel v Prague

1. **Uživatel vytvoří slot na 8:00 Prague**
2. **Frontend pošle** `2024-01-15T08:00` 
3. **API správně konvertuje** na UTC pomocí `parsePragueDateTime()`
4. **DB uloží** správně v UTC
5. **Ale filtrování** selhává kvůli `new Date(date)` na serveru v EST
6. **Zobrazení** je nekonzistentní kvůli různým formátovacím funkcím

### Výsledek:
- ✅ Slot se vytvoří správně
- ❌ Slot se nezobrazí při filtrování podle data
- ❌ Čas se zobrazuje nekonzistentně v různých komponentách

## 📋 Prioritní opravy

### KRITICKÉ (musí být opraveno):
1. **API filtrování podle data** - používat Prague timezone
2. **Frontend filtrování podle data** - používat Prague timezone
3. **API kontrola existujících slotů** - používat `parsePragueDateTime()`

### VYSOKÉ (mělo by být opraveno):
4. **Unifikace formátovacích funkcí** ve všech komponentách
5. **Konzistentní datetime-local handling**

### STŘEDNÍ (vylepšení):
6. **Centralizace timezone konfigace**
7. **Lepší error handling pro timezone**
8. **Unit testy pro timezone handling**

## 🧪 Test scénáře pro ověření

### Test 1: Různé timezone serveru
1. Změnit `TZ=America/New_York` na API serveru
2. Vytvořit slot v Prague timezone
3. Ověřit že se zobrazuje správně
4. Ověřit filtrování podle data

### Test 2: Letní/zimní čas přechod
1. Vytvořit sloty kolem přechodu DST
2. Ověřit správné zobrazování
3. Ověřit správné filtrování

### Test 3: Produkční DB v jiném timezone
1. Simulovat UTC databázi
2. Server v Prague timezone
3. Ověřit kompletní CRUD operace

## 🔧 Navrhované řešení

1. **Centralizované timezone utility** pro API i frontend
2. **Explicitní Prague timezone** ve všech operacích
3. **Unifikované formátovací funkce**
4. **Timezone-safe filtrování**
5. **Comprehensive testing** 