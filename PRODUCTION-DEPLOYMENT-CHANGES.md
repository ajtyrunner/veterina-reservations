# 🚀 Production Deployment Changes

Tento dokument obsahuje všechny změny, které je potřeba aplikovat při produkčním nasazení multitenant systému.

## 📅 Datum: 12.7.2025

## ⚠️ KRITICKÉ UPOZORNĚNÍ
- **NIKDY** nepoužívat destruktivní příkazy na produkční databázi
- **VŽDY** používat `upsert` místo `create` v seed souborech
- **Tenant svahy** musí zůstat nedotčený - pouze rozšíření o nové funkce
- **Tenant agility-nikol** bude nově založený

## 1. Databázové změny

### 1.1 Migrace databáze
```bash
# Spustit migrace (bezpečné pro produkci - pouze přidávají nové sloupce jako nullable)
npx prisma migrate deploy
```

### 1.2 Nové/upravené tabulky
- `tenants` - přidány sloupce pro content system (všechny nullable)
- `content_templates` - nová tabulka pro šablony obsahu
- Všechny migrace jsou zpětně kompatibilní

### 1.3 Seed skripty (používají UPSERT - bezpečné opakované spuštění)

#### a) Aktualizace tenanta Svahy (POVINNÉ)
```bash
# Přidá content template k existujícímu tenantovi
npx ts-node prisma/update-svahy-tenant.ts
```

#### b) Vytvoření tenanta Agility Nikol (POVINNÉ pro multitenant demo)
```bash
# Vytvoří nový tenant s uživateli
npx ts-node prisma/seed-agility-tenant.ts
```

#### c) Vytvoření testovacích uživatelů (VOLITELNÉ)
```bash
# Pouze pro testování
npx ts-node prisma/seed-test-users.ts
```

## 2. API změny (Railway)

### 2.1 Nové soubory
- `/apps/api/src/routes/public.ts` - Public API endpointy
- `/apps/api/src/routes/test-auth.ts` - Test endpointy (lze odstranit po testování)
- `/apps/api/src/services/contentService.ts` - Služba pro content management
- `/apps/api/src/middleware/authSecurity.ts` - Vylepšená bezpečnost autentizace
- `/apps/api/src/middleware/rateLimiter.ts` - Rate limiting

### 2.2 Upravené soubory
- `/apps/api/src/index.ts` - Přidány nové routery, middleware, CORS konfigurace
- `/apps/api/src/routes/auth.ts` - Oprava tenant filtrování pro user-info endpoint
- `/apps/api/src/middleware/auth.ts` - Přidána kontrola tenant access
- Všechny route soubory - upraveny pro multitenant podporu

### 2.3 Environment variables (Railway)
```env
# Existující
DATABASE_URL=postgresql://...
JWT_SECRET=...
NODE_ENV=production

# Nové/upravené
CORS_ORIGINS=https://*.slotnito.cz,https://slotnito.cz
DISABLE_RATE_LIMIT=false
```

### 2.4 Nové API endpointy
- `GET /api/public/tenant/:slug` - Info o tenantovi
- `GET /api/public/tenant/:slug/content` - Content data tenanta
- `POST /api/auth/google-user` - Google OAuth user creation
- `POST /api/auth/user-info` - User info s tenant filtrováním

## 3. Frontend změny (Vercel)

### 3.1 Nové soubory
- `/apps/web/lib/content-context.tsx` - React Context pro content management
- `/apps/web/lib/timezone.ts` - Timezone utilities
- `/apps/web/app/components/ContentStyleApplier.tsx` - Dynamické styly
- `/apps/web/app/components/HeaderWithContent.tsx` - Header s content podporou
- `/apps/web/app/components/FooterWithContent.tsx` - Footer s content podporou
- `/apps/web/app/HomePageWithContent.tsx` - Homepage s content podporou
- `/apps/web/app/*/[component]WithContent.tsx` - Další komponenty s content podporou
- `/apps/web/middleware.ts` - Next.js middleware pro tenant routing

### 3.2 Kriticky upravené soubory
- `/apps/web/auth.ts` - **KRITICKÉ**: Multitenant autentizace, dynamické NEXTAUTH_URL
- `/apps/web/app/api/auth/[...nextauth]/route.ts` - Dynamické nastavení auth URL
- `/apps/web/next.config.js` - API rewrites, image domény
- `/apps/web/app/layout.tsx` - ContentProvider wrapper
- `/apps/web/lib/api-client.ts` - JWT autentizace, tenant hlavičky

### 3.3 Environment variables (Vercel)
```env
# Povinné
NEXTAUTH_SECRET=... (stejný jako na lokálu)
NEXT_PUBLIC_API_URL=https://veterina-reservations-production.up.railway.app
API_URL=https://veterina-reservations-production.up.railway.app

# Google OAuth
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...

# ZAKÁZÁNO - musí být dynamické pro multitenant
# NEXTAUTH_URL=https://slotnito.cz
```

### 3.4 Vercel konfigurace
- **Wildcard domain**: `*.slotnito.cz` → projekt
- **Root domain**: `slotnito.cz` → projekt
- **Framework Preset**: Next.js
- **Build Command**: `cd apps/web && npm run build`
- **Output Directory**: `apps/web/.next`
- **Install Command**: `npm install`

## 4. Infrastruktura a bezpečnost

### 4.1 DNS konfigurace (Cloudflare/jiný provider)
```
# A záznamy
slotnito.cz → Vercel IP
*.slotnito.cz → Vercel IP

# Pro testování specifických tenantů
svahy.slotnito.cz → Vercel IP
agility-nikol.slotnito.cz → Vercel IP
```

### 4.2 CORS konfigurace (Railway API)
```javascript
// Již implementováno v API
corsOptions: {
  origin: (origin, callback) => {
    // Povoluje všechny *.slotnito.cz subdomény
  },
  credentials: true
}
```

### 4.3 Bezpečnostní opatření
- JWT tokeny obsahují tenant informaci
- Tenant isolation na úrovni databáze
- Rate limiting (lze vypnout DISABLE_RATE_LIMIT=true)
- Audit logging všech přihlášení
- Cross-tenant access protection

## 5. Deployment checklist

### Pre-deployment (1-2 dny před)
- [ ] Backup produkční databáze
- [ ] Test kompletní migrace na staging/dev prostředí
- [ ] Ověřit všechny seed skripty lokálně
- [ ] Připravit rollback SQL skripty
- [ ] Informovat uživatele o plánované údržbě

### Railway (API) deployment
1. [ ] Nastavit environment variables
2. [ ] Deploy nový kód (automaticky přes GitHub)
3. [ ] Počkat na úspěšný build a start
4. [ ] Spustit databázové migrace:
   ```bash
   railway run npx prisma migrate deploy
   ```
5. [ ] Spustit seed skripty:
   ```bash
   # POVINNÉ - update existujícího tenanta
   railway run npx ts-node prisma/update-svahy-tenant.ts
   
   # POVINNÉ - vytvoření demo tenanta
   railway run npx ts-node prisma/seed-agility-tenant.ts
   ```
6. [ ] Ověřit API health check endpoint
7. [ ] Otestovat public endpointy

### Vercel (Frontend) deployment
1. [ ] Nastavit environment variables
2. [ ] Přidat domény ve Vercel dashboardu:
   - `slotnito.cz`
   - `*.slotnito.cz`
3. [ ] Deploy (automaticky přes GitHub)
4. [ ] Ověřit build byl úspěšný

### Post-deployment testy
- [ ] Test přihlášení na `svahy.slotnito.cz`:
  - [ ] Interní uživatel (svahy.doktor)
  - [ ] Google OAuth
- [ ] Test přihlášení na `agility-nikol.slotnito.cz`:
  - [ ] Admin uživatel (nikol.admin)
  - [ ] Doktor (nikol.trener)
  - [ ] Google OAuth
- [ ] Ověřit cross-tenant security:
  - [ ] Uživatel z jednoho tenanta nemůže přistupovat k druhému
- [ ] Test rezervačního systému:
  - [ ] Zobrazení slotů
  - [ ] Vytvoření rezervace (modal)
  - [ ] Správa rezervací
- [ ] Test správy (DOCTOR/ADMIN role):
  - [ ] Číselníky → Služby
  - [ ] Správa slotů
  - [ ] Generování slotů

## 6. Rollback plán

### Rychlý rollback (< 5 minut)
1. Vercel: Revert na předchozí deployment
2. Railway: Revert na předchozí deployment

### Databázový rollback (pokud nutné)
```sql
-- Odstranit content template asociaci
UPDATE tenants 
SET content_template_id = NULL,
    custom_content = NULL,
    custom_styles = NULL 
WHERE slug = 'svahy';

-- Odstranit nový tenant (pokud byl vytvořen)
DELETE FROM users WHERE email LIKE '%@bordercollie.cz';
DELETE FROM tenants WHERE slug = 'agility-nikol';
```

### Monitoring po rollbacku
- [ ] Ověřit, že svahy.slotnito.cz funguje
- [ ] Zkontrolovat, že se uživatelé mohou přihlásit
- [ ] Monitorovat error logy

## 7. Známé problémy a řešení

### 7.1 OAuth tenant mismatch
- **Problém**: Po Google OAuth přihlášení se ukládá špatný tenant
- **Řešení**: Implementováno v auth.ts - tenant se předává přes cookie

### 7.2 Service types API
- **Problém**: Některé stránky volaly API s tenantId místo tenant slug
- **Řešení**: Opraveno ve všech dotčených komponentách

### 7.3 Modal vs. separate page
- **Problém**: Rezervační formulář byl na samostatné stránce
- **Řešení**: Vráceno původní modal řešení v HomePageWithContent

## 8. Testovací údaje

### Tenant: svahy.slotnito.cz
- **Doktor**: username: `svahy.doktor`, password: `svahy123`
- **Google OAuth**: jakýkoliv Google účet → role CLIENT

### Tenant: agility-nikol.slotnito.cz
- **Admin**: username: `nikol.admin`, password: `nikol123`
- **Trenér**: username: `nikol.trener`, password: `nikol123`
- **Google OAuth**: jakýkoliv Google účet → role CLIENT

## 9. Důležité poznámky

1. **NEXTAUTH_URL nesmí být nastaveno** - musí být dynamické
2. **Všechny seed skripty používají upsert** - bezpečné opakované spuštění
3. **Content system je plně funkční** - barvy, texty, loga
4. **Multitenant izolace funguje** - cross-tenant přístup je blokován
5. **OAuth funguje per-tenant** - uživatel může mít účet v každém tenantovi

---

**Poslední aktualizace:** 12.7.2025
**Připraveno pro produkční nasazení**