# DEPLOYMENT RUNBOOK - SECURITY & PHONE FEATURES

## 📋 PŘEHLED ZMĚN OD POSLEDNÍHO COMMITU

### 🔒 BEZPEČNOSTNÍ VYLEPŠENÍ
1. **Kompletní security audit systém**
   - Implementace brute force protection
   - Rate limiting pro různé typy operací
   - Audit logging pro kritické akce
   - HTTPS enforcement v produkci
   - Bezpečnostní headers
   - Input validation a XSS protection

2. **Autentizační systém**
   - Přepracování na username-based pro INTERNAL provider
   - JWT token security improvements
   - Session handling vylepšení

### 📞 PHONE FIELD IMPLEMENTACE
1. **Database schema změny**
   - Přidání `phone` field do User modelu (nullable)
   - `username` field s unique constraint
   - `authProvider` enum (INTERNAL/GOOGLE)
   - Tenant defaults: `defaultEmail` a `defaultPhone`
   - Email field je nyní nullable pro INTERNAL users

2. **Contact Resolution System**
   - `apps/api/src/utils/contact.ts` - utility pro získání kontaktů
   - Tenant fallback system pro komunikaci
   - Caching mechanism pro performance

3. **Notification System**
   - `apps/api/src/services/` - kompletní notifikační systém
   - Email service s Gmail SMTP
   - Automatic reservation reminders

### 🛠️ MODIFIKOVANÉ SOUBORY

#### Database & Schema
- `prisma/schema.prisma` - ⚠️ BREAKING CHANGES
- `prisma/seed.ts` - nová test data s phone fields
- `prisma/migrations/` - 2 nové migrace

#### API Backend
- `apps/api/package.json` - nové dependencies (nodemailer, rate-limiter-flexible)
- `apps/api/src/index.ts` - security middleware, HTTPS enforcement
- `apps/api/src/routes/auth.ts` - username-based auth, security enhancements
- `apps/api/src/routes/protected.ts` - notification integration

#### Frontend
- `apps/web/auth.ts` - JWT improvements, username support
- `apps/web/types/next-auth.d.ts` - TypeScript definitions
- `apps/web/app/portal/team/page.tsx` - team management updates

#### Configuration
- `.env.example` - nové ENV variables pro Gmail SMTP

#### Documentation & Security
- `SECURITY-AUDIT-REPORT.md` - kompletní bezpečnostní audit
- `NOTIFICATION-SYSTEM.md` - dokumentace notifikačního systému
- `PHONE-AND-CONTACT-MIGRATION.md` - dokumentace phone field implementace
- `api-endpoints-audit.js` - automatizovaný security test
- `security-test.js` - security testing script

---

## 🚀 DEPLOYMENT RUNBOOK

### PŘEDPOKLADY
- [ ] Přístup k Railway/Vercel admin
- [ ] Google OAuth credentials pro produkci
- [ ] Gmail App Password pro SMTP
- [ ] Backup současné databáze (pokud potřeba)

### FÁZE 1: PŘÍPRAVA PROSTŘEDÍ

#### 1.1 Environment Variables (Railway)
```bash
# Nové povinné ENV variables
GMAIL_USER=veterina-svahy@gmail.com
GMAIL_APP_PASSWORD=xxxx-xxxx-xxxx-xxxx
NEXTAUTH_SECRET=<64-char-production-secret>

# Bezpečnost
NODE_ENV=production
RATE_LIMIT_ENABLED=true
AUDIT_LOG_ENABLED=true

# Stávající
DATABASE_URL=<production-db-url>
GOOGLE_CLIENT_ID=<production-oauth-id>
GOOGLE_CLIENT_SECRET=<production-oauth-secret>
```

#### 1.2 Generování nového NEXTAUTH_SECRET
```bash
# Spustit lokálně
node generate-secrets.js
# Výstup: 64-character secret pro produkci
```

### FÁZE 2: DATABÁZE - KRITICKÉ ROZHODNUTÍ

#### ⚠️ VOLBA A: CLEAN DEPLOYMENT (DOPORUČENO)
**Pokud lze akceptovat ztrátu dat:**

```bash
# 1. Backup aktuální DB (pokud potřeba)
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql

# 2. Reset databáze
source ~/.nvm/nvm.sh
npx prisma db push --force-reset

# 3. Generování klienta
npx prisma generate

# 4. Seed nových dat
npx tsx prisma/seed.ts
```

**Výhody:**
- ✅ Čisté prostředí bez konfliktů
- ✅ Všechny nové features fungují okamžitě
- ✅ Žádné migrace problémy

**Nevýhody:**
- ❌ Ztráta všech existujících dat
- ❌ Nutnost znovu vytvořit test účty

#### 🔄 VOLBA B: MIGRACE POSTUPNÁ (RIZIKOVÉ)
**Pokud musíme zachovat data:**

```bash
# 1. Backup
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql

# 2. Spustit migrace postupně
source ~/.nvm/nvm.sh
npx prisma migrate deploy

# 3. Kontrola stavu
npx prisma db seed --preview-feature
```

**⚠️ RIZIKA:**
- Možné konflikty kvůli změně email→username logiky
- Nutnost manuální migrace existujících INTERNAL userů
- Možné problémy s unique constraints

### FÁZE 3: DEPLOYMENT APLIKACE

#### 3.1 Railway API Deployment
```bash
# 1. Commit všech změn
git add .
git commit -m "feat: Security audit, phone fields, notification system

- Add brute force protection and rate limiting
- Implement username-based auth for INTERNAL providers  
- Add phone field with tenant fallbacks
- Complete notification system with Gmail SMTP
- Security headers and HTTPS enforcement
- Comprehensive audit logging
- Clean database schema with migrations"

# 2. Push na main
git push origin main

# 3. Railway auto-deploy proces se spustí
```

#### 3.2 Vercel Frontend Deployment
```bash
# Frontend se nasadí automaticky z main branch
# Ověřit ENV variables ve Vercel dashboard:
NEXT_PUBLIC_API_URL=https://veterina-reservations-production.up.railway.app
NEXTAUTH_URL=https://veterina-reservations.vercel.app
NEXTAUTH_SECRET=<stejný-jako-railway>
```

### FÁZE 4: POST-DEPLOYMENT OVĚŘENÍ

#### 4.1 Základní funkčnost
```bash
# Health check
curl https://veterina-reservations-production.up.railway.app/health

# Public endpoints
curl https://veterina-reservations-production.up.railway.app/api/public/tenant/svahy
```

#### 4.2 Security audit
```bash
# Spustit bezpečnostní testy
source ~/.nvm/nvm.sh
node security-test.js
node api-endpoints-audit.js
```

#### 4.3 Autentizace test
1. **Google OAuth test**: https://veterina-reservations.vercel.app/login
2. **INTERNAL login test**: username `lucia.friedlaenderova`, heslo `doktor123`
3. **Notifikace test**: Vytvořit rezervaci a ověřit email

#### 4.4 Phone & Contact Resolution Test
```bash
# Test contact utility
node test-contact-utility.js
```

### FÁZE 5: MONITORING & ROLLBACK PLÁN

#### 5.1 Monitoring
- [ ] Railway aplikace běží bez chyb
- [ ] Vercel frontend loading správně  
- [ ] Database připojení funguje
- [ ] Email notifikace odesílány
- [ ] Rate limiting aktivní

#### 5.2 Rollback v případě problémů
```bash
# 1. Rollback Railway na předchozí commit
git revert HEAD
git push origin main

# 2. Obnovit databázi z backup (pokud nutné)
psql $DATABASE_URL < backup_YYYYMMDD_HHMMSS.sql

# 3. Ověřit ENV variables stav
```

---

## 📊 TESTOVACÍ CHECKLIST

### Pre-deployment
- [ ] Lokální testy prošly
- [ ] Security audit: 97%+ skóre
- [ ] Database migrace testovány
- [ ] Email SMTP funkční

### Post-deployment  
- [ ] Health endpoints dostupné
- [ ] Google OAuth funguje
- [ ] Username login funguje
- [ ] Email notifikace odesílány
- [ ] Rate limiting aktivní
- [ ] Security headers aplikovány
- [ ] HTTPS enforcement funguje

### Datové testy
- [ ] Tenant data načtena
- [ ] Doktoři s contact info
- [ ] Phone fallback na tenant defaults
- [ ] Test rezervace → notification

---

## ⚠️ KRITICKÉ POZNÁMKY

1. **Database Schema**: Změny jsou BREAKING - doporučuji clean deployment
2. **Auth System**: Username-based login nahrazuje email pro INTERNAL
3. **Security**: Rate limiting může ovlivnit API performance - monitoring nutný
4. **Gmail SMTP**: Nutné App Password, ne běžné heslo
5. **Environment**: Všechny nové ENV variables musí být nastavené

---

## 🎯 EXPECTED BENEFITS POST-DEPLOYMENT

### Bezpečnost
- ✅ 97% security score
- ✅ Brute force protection
- ✅ Comprehensive audit logging
- ✅ Rate limiting protection

### Funkčnost
- ✅ Phone field pro kontakty
- ✅ Tenant fallback komunikace
- ✅ Automatic email notifications
- ✅ Username-based profesional login

### Monitoring
- ✅ Security event logging
- ✅ Performance monitoring
- ✅ Audit trail pro compliance

**Odhadovaný čas deployment: 30-45 minut**
**Doporučené okno: maintenance window během nízkého provozu** 