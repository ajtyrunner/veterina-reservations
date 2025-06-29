# 🏥 Veterinární rezervační systém

Multi-tenant rezervační systém pro veterinární ordinace s podporou Google OAuth a role-based přístupu.

## 🌟 Funkcionalities

- ✅ **Multi-tenant architektura** - každá ordinace má vlastní subdoménu
- ✅ **Google OAuth přihlašování** - bezpečná autentizace
- ✅ **Role-based přístup** - CLIENT, DOCTOR, ADMIN
- ✅ **Slot management** - doktors mohou vytvářet časové sloty
- ✅ **Rezervační systém** - klienti si rezervují termíny  
- ✅ **Tenant branding** - vlastní logo a barvy pro každou ordinaci
- ✅ **Real-time dostupnost** - validace kolizí rezervací

## 🏗️ Multi-tenant architektura

Systém používá **lvh.me** pro lokální multi-tenant vývoj:

```
svahy.lvh.me:3000        # Veterinární ordinace Svahy
brno-vet.lvh.me:3000     # Veterinární klinika Brno
psikocky.lvh.me:3000     # Ordinace pro psy a kočky
```

## 🚀 Rychlé spuštění

### 1. **Klonování a závislosti**
```bash
git clone <repository>
cd veterina-reservations

# Nainstaluj závislosti
cd apps/web && npm install
cd ../api && npm install
cd ../../prisma && npm install
```

### 2. **Databáze setup**
```bash
# Spusť PostgreSQL
docker-compose up -d db

# Prisma setup
cd prisma
npx prisma generate
npx prisma db push
npx prisma db seed
```

### 3. **Proměnné prostředí**
Vytvoř `.env` soubor v root adresáři:

```env
# Databáze  
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/veterina"

# NextAuth.js
NEXTAUTH_URL="http://svahy.lvh.me:3000"
NEXTAUTH_SECRET="super-secret-key-at-least-32-characters"

# Google OAuth
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# API  
NEXT_PUBLIC_API_URL="http://lvh.me:4000"
PORT=4000
```

### 4. **Google OAuth setup**
V [Google Cloud Console](https://console.cloud.google.com/):

**Authorized JavaScript origins:**
```
http://lvh.me:3000
http://*.lvh.me:3000
```

**Authorized redirect URIs:**
```
http://svahy.lvh.me:3000/api/auth/callback/google
http://brno-vet.lvh.me:3000/api/auth/callback/google
```

### 5. **Spuštění**
```bash
# Terminal 1 - API server
cd apps/api
npm run dev

# Terminal 2 - Next.js aplikace  
cd apps/web
npm run dev
```

### 6. **Přístup k aplikaci**
```
http://svahy.lvh.me:3000      # Ordinace Svahy (default)
http://test.lvh.me:3000       # Testovací tenant
```

## 👥 Testovací účty

Po spuštění seed skriptu:

- **Admin:** `admin@veterina-svahy.cz` (role: ADMIN)
- **Doktor:** `doktor@veterina-svahy.cz` (role: DOCTOR)  
- **Klient:** `klient@test.cz` (role: CLIENT)

## 📁 Struktura projektu

```
veterina-reservations/
├── apps/
│   ├── web/                 # Next.js frontend
│   │   ├── app/             # App Router
│   │   ├── lib/             # Utilities (tenant management)
│   │   └── middleware.ts    # Tenant routing middleware
│   └── api/                 # Express backend
│       ├── src/
│       ├── middleware/      # JWT auth middleware
│       └── routes/          # API routes
├── prisma/                  # Database schema & migrations
│   ├── schema.prisma
│   └── seed.ts
└── docker-compose.yml       # PostgreSQL database
```

## 🔧 Tenant Management

Systém automaticky rozpoznává tenant z URL:

```typescript
// Příklad tenant utility
import { getTenantSlugFromUrl } from '@/lib/tenant'

const tenantSlug = getTenantSlugFromUrl() // 'svahy' pro svahy.lvh.me
```

## 🎨 Branding per tenant

Každý tenant může mít:
- Vlastní logo (`logoUrl`)
- Vlastní primární barvu (`primaryColor`)
- Vlastní sekundární barvu (`secondaryColor`)
- Vlastní název (`name`)

## 📱 API Endpoints

### Veřejné API
- `GET /api/public/tenant/:slug` - Informace o tenantovi
- `GET /api/public/doctors/:tenantId` - Seznam doktorů
- `GET /api/public/slots/:tenantId` - Dostupné sloty

### Chráněné API (vyžaduje JWT)
- `GET /api/reservations` - Uživatelské rezervace
- `POST /api/reservations` - Vytvoření rezervace
- `DELETE /api/reservations/:id` - Zrušení rezervace
- `GET /api/doctor/slots` - Sloty doktora
- `POST /api/doctor/slots` - Vytvoření slotu

## 🏃‍♂️ Development workflow

1. **Přidej nový tenant** do seed skriptu
2. **Vytvoř subdoména** `new-tenant.lvh.me:3000`
3. **Nastav Google OAuth** pro novou doménu
4. **Testuj multi-tenant funkcionality**

## 📚 Technologie

- **Frontend:** Next.js 14, Tailwind CSS, TypeScript
- **Backend:** Express.js, Node.js
- **Databáze:** PostgreSQL, Prisma ORM
- **Auth:** NextAuth.js, Google OAuth, JWT
- **Development:** Docker, lvh.me
- **Deployment:** Ready for Vercel/Railway

## 🎯 Další kroky

- [ ] Socket.IO chat mezi klientem a doktorem
- [ ] Email notifikace
- [ ] SMS notifikace  
- [ ] Kalendářní integrace
- [ ] Mobile aplikace
- [ ] Analytics dashboard

---

**Tip:** Pro produkční nasazení změň `lvh.me` domény na vlastní domény a nastav SSL certifikáty.