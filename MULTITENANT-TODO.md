# 🏢 Multitenant Transformace - TODO List

## ✅ Co už máme hotové

### Databáze
- ✅ Tenant model s content fields (contentData, customStyles, subdomain)
- ✅ ContentTemplate model pro různé typy businessů
- ✅ Per-tenant Google OAuth fields (googleClientId, googleClientSecret)
- ✅ Feature flags (enabledFeatures)
- ✅ Timezone support

### Základní struktura
- ✅ Multitenant architektura s tenant isolací
- ✅ Role-based access control (CLIENT, DOCTOR, ADMIN)
- ✅ Auth providers (INTERNAL, GOOGLE)
- ✅ Subdomain routing připraveno v DB

## 📋 TODO - Prioritní úkoly

### 1. Multi-role systém (VYSOKÁ PRIORITA)
- [ ] **Upravit databázový model**
  ```prisma
  model UserRole {
    id      String   @id @default(cuid())
    userId  String
    role    UserRole
    user    User     @relation(fields: [userId], references: [id])
    
    @@unique([userId, role])
  }
  ```
- [ ] **Migrace stávajících dat** - převést single role na multi-role
- [ ] **Upravit JWT token strukturu** - `roles: string[]` místo `role: string`
- [ ] **Upravit autorizační middleware** pro kontrolu pole rolí
- [ ] **UI pro správu rolí** - přiřazování více rolí uživatelům
- [ ] **Role switcher v UI** - přepínání kontextu (jako STAFF/CLIENT)

### 2. Content System - Dokončení implementace
- [ ] **Backend ContentService**
  - [ ] API endpoint `/api/public/content/:subdomain`
  - [ ] Cache mechanismus (Redis/in-memory)
  - [ ] Merge template + custom content logic
  - [ ] Validace content struktury
  
- [ ] **Frontend Content Provider**
  - [ ] React Context pro content
  - [ ] useContent hook
  - [ ] Placeholder system ({{STAFF}}, {{SERVICE}})
  - [ ] Fallback mechanismus
  
- [ ] **Seed základních templates**
  - [ ] Veterinární template
  - [ ] Univerzální template
  - [ ] Kadeřnický template
  - [ ] Fitness template

### 3. Subdomain routing
- [ ] **Next.js middleware** pro subdomain detection
- [ ] **Tenant resolution** z subdomény
- [ ] **Dynamic tenant loading**
- [ ] **Fallback pro neexistující subdomény**
- [ ] **Local development** s .lvh.me doménami

### 4. Migrace UI komponent
- [ ] **Header.tsx** - dynamické logo a branding
- [ ] **HeroSection** - content z template
- [ ] **LoginPage** - tenant-specific styling
- [ ] **CalendarView** - lokalizované texty
- [ ] **Reservation forms** - konfigurovatelná pole
- [ ] **Email templates** - dynamický obsah

### 5. Per-tenant Google OAuth
- [ ] **Dynamic OAuth providers** podle tenanta
- [ ] **Callback URL handling** pro subdomény
- [ ] **OAuth config UI** pro adminy
- [ ] **Testování s různými Google Client IDs**

### 6. Generalizace rolí
- [ ] **Přejmenovat DOCTOR → STAFF**
  - [ ] Databázové migrace
  - [ ] Update všech referencí v kódu
  - [ ] Zachovat zpětnou kompatibilitu
- [ ] **Odstranit veterinární terminologii**
  - [ ] petName → additionalInfo
  - [ ] veterinar → staff
  - [ ] zvíře → předmět služby

### 7. Tenant onboarding
- [ ] **Signup flow**
  - [ ] Výběr typu businessu (template)
  - [ ] Základní informace o firmě
  - [ ] Výběr subdomény
  - [ ] Automatické vytvoření základních dat
  
- [ ] **Setup wizard**
  - [ ] Nastavení pracovní doby
  - [ ] Import služeb
  - [ ] První uživatelé (STAFF)
  - [ ] Branding (logo, barvy)

### 8. Performance optimalizace
- [ ] **Content caching strategie**
- [ ] **Lazy loading per-tenant assets**
- [ ] **Database indexy** pro tenant queries
- [ ] **Connection pooling** optimalizace

### 9. Testing
- [ ] **Unit testy** pro ContentService
- [ ] **Integration testy** pro multi-role
- [ ] **E2E testy** pro subdomain routing
- [ ] **Performance testy** pro multi-tenant

### 10. Dokumentace
- [ ] **API dokumentace** s tenant kontextem
- [ ] **Onboarding guide** pro nové tenanty
- [ ] **Migration guide** ze single na multi-tenant
- [ ] **Best practices** pro tenant isolation

## 🚀 Quick Wins (lze udělat hned)

1. **Seed veterinární template** (1-2 hodiny)
   ```typescript
   await prisma.contentTemplate.create({
     data: {
       name: 'veterinary',
       displayName: 'Veterinární ordinace',
       category: 'healthcare',
       labels: { /* ... */ },
       colorScheme: { primary: '#f97316' },
       features: ['reservations', 'pet_management']
     }
   })
   ```

2. **Basic ContentService** (2-3 hodiny)
   - Jednoduchý endpoint pro načtení content
   - In-memory cache
   - Fallback na hardcoded hodnoty

3. **Update existujícího tenanta** (30 minut)
   ```sql
   UPDATE tenants 
   SET subdomain = 'veterina-svahy',
       content_template_id = (SELECT id FROM content_templates WHERE name = 'veterinary')
   WHERE slug = 'svahy';
   ```

4. **Jednoduchý useContent hook** (1-2 hodiny)
   - Načtení content z API
   - Helper funkce pro texty
   - Základní placeholder náhrady

## 📅 Doporučené pořadí implementace

1. **Týden 1**: Multi-role systém (databáze + backend)
2. **Týden 2**: Content System (service + API)
3. **Týden 3**: Frontend Content Provider + migrace komponent
4. **Týden 4**: Subdomain routing + per-tenant OAuth
5. **Týden 5**: Generalizace rolí + odstranění hardcoded textů
6. **Týden 6**: Tenant onboarding + setup wizard
7. **Týden 7**: Testing + dokumentace
8. **Týden 8**: Performance optimalizace + finální úpravy

## ⚠️ Kritické body

1. **Bezpečná migrace** - žádné destruktivní změny v produkci
2. **Fallback vždy** - aplikace musí fungovat i bez content systému
3. **Postupná migrace** - po komponentách, ne vše najednou
4. **Zpětná kompatibilita** - stávající data musí fungovat
5. **Performance** - content nesmí zpomalit aplikaci

## 📊 Metriky úspěchu

- [ ] 0% downtime během migrace
- [ ] <100ms latence pro content loading
- [ ] 100% pokrytí fallbacky
- [ ] Funkční multi-role pro všechny uživatele
- [ ] 3+ aktivní tenanty s různými templates
- [ ] <10 minut onboarding nového tenanta

---

*Aktualizováno: Leden 2025*