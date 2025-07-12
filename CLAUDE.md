# Claude Development Guide

This document contains important information for development sessions with Claude.

## Local Development Setup

To run the application locally, follow these steps:

1. Navigate to the root directory of the project
2. Run the development command:
   ```bash
   npm run dev
   ```

This command starts both the frontend (FE) and backend (API) services together:

- **Frontend**: Runs on port 3000 (http://localhost:3000)
- **API**: Runs on port 4000 (http://localhost:4000)

**Important**: Both services must be running for the system to work properly. The frontend depends on the API for all data operations and authentication.

### Development Configuration

For testing purposes, you can disable rate limiting by adding to your `.env` file:
```
DISABLE_RATE_LIMIT=true
```

This will prevent the "429 Too Many Requests" errors during development and testing.

**Note**: If you still get rate limit errors after setting this:
1. Restart the development server to clear in-memory rate limit stores
2. Use the provided script: `./reset-dev.sh`
3. This is because NextAuth maintains its own rate limiting that requires a server restart to clear

## Project Structure

This is a monorepo project with the following structure:
- `/apps/web/` - Frontend Next.js application
- `/apps/api/` - Backend API application
- `/prisma/` - Database schema and migrations

## Key Technologies

- Frontend: Next.js, React, TypeScript, Tailwind CSS
- Backend: Node.js, Express, Prisma
- Database: PostgreSQL
- Authentication: NextAuth.js with Google OAuth and local credentials

## Rezervační systém - Koncepce a architektura

### Hlavní cíl
Vytvořit **univerzální multitenant multipurpose rezervační systém** založený na alokaci slotů, který není vázán na konkrétní doménu (veterina) a může být použit pro jakýkoliv typ rezervací.

### Klíčové principy

1. **Multitenant architektura**
   - Každý tenant má vlastní subdoménu (např. `svahy.lvh.me`, `ordinace.lvh.me`)
   - Data jsou striktně oddělena pomocí `tenantId`
   - Tenant může mít vlastní branding, texty a styly

2. **Slot-based rezervační systém**
   - Základem jsou časové sloty (ne události nebo služby)
   - Doktor vytváří dostupné sloty
   - Klient si rezervuje slot
   - Univerzální model nezávislý na typu businessu

3. **Role-based access control (RBAC)**
   - **CLIENT** - může vytvářet a spravovat rezervace
   - **DOCTOR** - může spravovat sloty a vidět rezervace (TODO: přejmenovat na STAFF)
   - **ADMIN** - plná správa systému
   - **DŮLEŽITÉ**: Google OAuth je VŽDY pouze pro roli CLIENT
   - **POŽADAVEK**: Implementovat multi-role systém - uživatel může mít více rolí současně

4. **Autentizace a autorizace**
   - **INTERNAL provider** - lokální registrace, všechny role
   - **GOOGLE provider** - OAuth přihlášení, pouze role CLIENT
   - JWT tokeny s informacemi o roli a tenantovi
   - Per-tenant Google OAuth konfigurace

### Content Migration System

Pro dosažení univerzálnosti implementujeme Content Migration System ve fázích:

**Placeholder systém pro dynamické termíny:**
```typescript
// Příklad content struktury s placeholdery
contentData: {
  roles: {
    STAFF: "Doktor",        // Veterina: "Doktor", Kadeřnictví: "Kadeřník", Fitness: "Trenér"
    STAFF_PLURAL: "Doktoři", // Veterina: "Doktoři", Kadeřnictví: "Kadeřníci"
    CLIENT: "Klient",       // Univerzální
    ADMIN: "Správce"        // Univerzální
  },
  entities: {
    SLOT: "Termín",         // Univerzální
    RESERVATION: "Rezervace", // Univerzální
    SERVICE_SUBJECT: "Mazlíček" // Veterina: "Mazlíček", Kadeřnictví: "Účes", Fitness: "Trénink"
  },
  actions: {
    BOOK_WITH_STAFF: "Objednat se k {{STAFF}}", // "Objednat se k doktorovi"
    SELECT_STAFF: "Vyberte {{STAFF}}"           // "Vyberte doktora"
  }
}

// Použití v komponentách
const { t } = useContent();
<button>{t('actions.BOOK_WITH_STAFF')}</button> // Automaticky nahradí {{STAFF}}
```

#### Fáze 0: Infrastruktura ✅
- Rozšíření Tenant modelu o content fields (contentData, customStyles, subdomain, etc.)
- ContentTemplate model pro různé typy businessů
- ContentService pro backend
- Bezpečná migrace databáze s nullable sloupci

#### Fáze 1: Extrakce hardcoded obsahu
- Vytvoření `veterinaryContent.ts` s všemi texty
- Vytvoření `veterinaryStyles.ts` se styly
- Seed existujícího tenantu defaultním obsahem

#### Fáze 2: API a načítání obsahu
- API endpoint `/api/public/content/:slug`
- Cache mechanismus
- Fallback na hardcoded hodnoty

#### Fáze 3: Migrace UI komponent
- ContentProvider a useContent hook
- Postupná migrace všech komponent
- Email šablony s dynamickým obsahem
- Implementace placeholder systému pro role-specific termíny

#### Fáze 4: Template systém
- Vytvoření univerzálních templates
- Možnost výběru template při založení tenantu

#### Fáze 5: Finalizace
- Odstranění všech hardcoded hodnot
- Performance optimalizace
- Dokumentace

### Budoucí vylepšení pro univerzální systém

1. **Multi-role systém (PRIORITA)**
   - Implementovat many-to-many vztah User ↔ Role
   - Uživatel může mít libovolnou kombinaci rolí
   - JWT token bude obsahovat pole rolí: `roles: ['CLIENT', 'STAFF', 'ADMIN']`
   - Autorizace bude kontrolovat, zda uživatel má alespoň jednu z požadovaných rolí
   - Migrace stávajících dat: současná single role → array s jednou rolí
   
   **Reálné use-cases:**
   - STAFF + ADMIN: Vedoucí pracovník, který spravuje systém a zároveň poskytuje služby
   - STAFF + CLIENT: Zaměstnanec, který také využívá služby (např. veterinář se psem)
   - CLIENT + ADMIN: Majitel firmy, který je zákazníkem a spravuje systém
   - Všechny tři role: Majitel malé firmy, který je současně poskytovatelem i zákazníkem

2. **Generalizace rolí**
   - DOCTOR → STAFF (obecný zaměstnanec/poskytovatel služeb)
   - CLIENT zůstává (zákazník/klient)
   - ADMIN zůstává (správce systému)
   - Model Doctor → Staff s obecnými atributy

3. **Odstranění domain-specific konceptů**
   - `petName` → `additionalInfo` nebo konfigurovatelné pole
   - `veterinar` → `staff` v emailových šablonách  
   - Veterinární terminologie → obecné termíny

4. **Příklad multi-role použití**
   ```typescript
   // Uživatel může mít více rolí
   user.roles = ['CLIENT', 'STAFF', 'ADMIN']
   
   // Kontrola oprávnění
   hasAnyRole(user, ['STAFF', 'ADMIN']) // true - má alespoň jednu
   hasAllRoles(user, ['STAFF', 'ADMIN']) // true - má obě
   hasRole(user, 'CLIENT') // true
   
   // V UI zobrazit všechny dostupné funkce podle všech rolí
   if (hasRole(user, 'ADMIN')) showAdminPanel()
   if (hasRole(user, 'STAFF')) showSlotManagement()
   if (hasRole(user, 'CLIENT')) showReservationBooking()
   ```
   
5. **Implementační detaily multi-role**
   - Prisma schema: Junction table `UserRole` (userId, role)
   - JWT token: `roles: string[]` místo `role: string`
   - Middleware: Upravit na kontrolu pole rolí
   - UI: Dynamické zobrazení funkcí podle všech rolí uživatele
   - Role switcher: Možnost přepínat kontext (jako STAFF vidím sloty, jako CLIENT rezervace)

### Bezpečnostní pravidla

1. **Databázová bezpečnost**
   - NIKDY nepoužívat destruktivní příkazy (--force-reset, DROP TABLE)
   - Všechny migrace musí být bezpečné pro produkční data
   - Nové sloupce vždy jako nullable
   - **Seed soubory MUSÍ používat `upsert` místo `create` aby nedocházelo k duplikaci dat**
   - Při opakovaném spuštění seed musí pouze aktualizovat existující data

2. **Autentizační pravidla**
   - Google OAuth = VŽDY CLIENT role
   - Doktoři a admini pouze přes INTERNAL provider
   - Striktní validace JWT tokenů

3. **Tenant isolation**
   - Veškerá data filtrována podle tenantId
   - Žádný cross-tenant přístup
   - Subdoména určuje kontext

### Testing strategie

1. **E2E testy s Playwright**
   - Mock Google OAuth pro testování
   - Zachování JWT struktury jako v produkci
   - Testy pro různé role a providery

2. **Rychlé timeouty pro debugging**
   - Test timeout: 10 sekund
   - Action timeout: 5 sekund
   - Navigation timeout: 10 sekund

### Projektová pravidla

1. **Migrace databáze**
   - Formát: `YYYYMMDDHHMMSS_popis_zmeny`
   - Používat aktuální rok (2025)
   - Vždy zpětně kompatibilní

2. **Commit konvence**
   - Jasné a stručné commit messages
   - Commits končí podpisem Claude
   - Používat české popisky pro českou aplikaci

3. **Code style**
   - ŽÁDNÉ komentáře v kódu (pokud není explicitně požadováno)
   - Následovat existující konvence projektu
   - TypeScript pro typovou bezpečnost

4. **API endpointy a JWT logika**
   - Při tvorbě endpointů vždy využívat informace z JWT tokenu
   - Autorizace založená na `req.user` z JWT (role, tenantId, userId)
   - Nepoužívat dodatečné parametry pro tenant/user identifikaci, když jsou v JWT
   - Příklad: místo `/api/tenant/:tenantId/reservations` použít `/api/reservations` a tenantId vzít z JWT