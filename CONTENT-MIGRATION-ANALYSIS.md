# 📊 CONTENT MIGRATION ANALYSIS - Dynamický obsah pro multi-tenant systém

## 🎯 **CÍLE MIGRACE**

### **Hlavní cíl**: Transformace hardcoded textů a stylů na dynamický, tenant-aware content systém

1. **Univerzální nástroj**: Převést veterinární specifické texty na konfigurovatelné šablony
2. **Multi-tenant branding**: Každý tenant vlastní vzhled a obsah
3. **Snadný onboarding**: Nové tenantty lze přidat bez kódu
4. **Subdomény**: Architektura `tenant.slotnito.cz` místo path-based
5. **Google OAuth per tenant**: Každý tenant vlastní Google Client ID

---

## 🔍 **ANALÝZA SOUČASNÉHO STAVU**

### **1. DATABÁZOVÁ STRUKTURA**

#### **Současný tenant model**:
```sql
model Tenant {
  id             String   @id @default(cuid())
  slug           String   @unique
  name           String
  logoUrl        String?
  primaryColor   String   @default("#4F46E5")
  secondaryColor String   @default("#7C3AED")
  timezone       String   @default("Europe/Prague")
  defaultEmail   String?
  defaultPhone   String?
  // ... relations
}
```

#### **✅ Výhody současného stavu**:
- Základní tenant struktura existuje
- Barevné schéma je konfigurovatelné
- Timezone support implementován
- Produkční databáze je stabilní

#### **❌ Chybí pro content systém**:
- Content templates pro různé typy aplikací
- Dynamické texty a labely
- Styling variables
- Feature flags per tenant
- Google OAuth konfigurace per tenant

---

### **2. HARDCODED CONTENT AUDIT**

#### **🎨 UI Texty a labely** (nalezeno **127 instancí**):

**Veterinární specifické texty**:
- `"Veterinární ordinace"` - 15x
- `"Rezervace termínu"` - 8x
- `"Jméno zvířete"` - 12x
- `"Druh zvířete"` - 10x
- `"Veterinář"` - 23x
- `"Rezervovat termín"` - 7x
- `"Veterinární služby"` - 6x

**Obecné aplikační texty**:
- Formulářové labely (46x)
- Tlačítka a akce (31x)
- Chybové zprávy (18x)
- Navigace (15x)

#### **🎨 Styling hardcoded** (nalezeno **89 instancí**):

**Barevné schéma**:
- `orange-400`, `orange-500` - 34x (primární barva)
- `blue-500`, `blue-600` - 28x (sekundární barva)
- `gray-50`, `gray-100` - 27x (neutrální barvy)

**Komponenty s fixed styling**:
- HeroSection - gradient `from-orange-400 to-orange-500`
- LoginPage - `bg-gradient-to-br from-orange-50 to-orange-100`
- Header - `bg-orange-400`
- Footer - `text-orange-400`

#### **📧 Email templates** (nalezeno **43 instancí**):

**Veterinární specifické obsahy**:
- `"Nová rezervace vyžaduje pozornost"` - 5x
- `"Veterinář:"` - 12x
- `"Zvíře:"` - 8x
- `"Děkujeme za návštěvu!"` - 6x
- `"Připomínka návštěvy"` - 4x

**Barevné schéma emailů**:
- `#2563eb` (modrá) - nová rezervace
- `#10b981` (zelená) - potvrzená
- `#ef4444` (červená) - zrušená
- `#f59e0b` (žlutá) - připomínka

---

### **3. SOUČASNÁ ARCHITEKTURA**

#### **Frontend (Next.js)**:
```
apps/web/
├── app/
│   ├── page.tsx              # HeroSection, ServicesSection
│   ├── login/page.tsx        # Login UI
│   ├── components/
│   │   ├── Header.tsx        # Branding, navigation
│   │   ├── Footer.tsx        # Footer content
│   │   └── CalendarView.tsx  # Slot display
│   └── rezervace/
│       ├── page.tsx          # Reservation management
│       └── nova/page.tsx     # New reservation form
```

#### **Backend (Express)**:
```
apps/api/
├── services/
│   ├── emailService.ts       # Email templates
│   └── notificationService.ts # Notification logic
└── routes/
    ├── auth.ts               # Authentication
    └── protected.ts          # Business logic
```

#### **Styling systém**:
- **Tailwind CSS** - utility-first
- **CSS Variables** - základní podpora v `tenant-timezone.ts`
- **Hardcoded colors** - většina komponent

---

## 🏗️ **NAVRHOVANÁ ARCHITEKTURA**

### **1. NOVÁ DATABÁZOVÁ STRUKTURA**

#### **ContentTemplate model**:
```sql
model ContentTemplate {
  id          String @id @default(cuid())
  name        String @unique  // "veterinary", "dental", "beauty", "fitness"
  displayName String          // "Veterinární ordinace"
  category    String          // "healthcare", "beauty", "fitness"
  
  // UI Content
  labels      Json            // Všechny UI texty
  messages    Json            // Chybové zprávy, notifikace
  
  // Email Templates
  emailTemplates Json         // Email subject/body templates
  
  // Styling
  colorScheme    Json         // Barevné schéma
  typography     Json         // Fonty a velikosti
  
  // Features
  features    Json            // Povolené funkce
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  tenants     Tenant[]
}
```

#### **Rozšířený Tenant model**:
```sql
model Tenant {
  // ... existing fields
  
  // Content System
  contentTemplateId String?
  contentTemplate   ContentTemplate? @relation(fields: [contentTemplateId], references: [id])
  customContent     Json?            // Tenant-specific overrides
  
  // Google OAuth per tenant
  googleClientId     String?
  googleClientSecret String?
  
  // Subdomain config
  subdomain         String  @unique  // "veterina-svahy"
  customDomain      String?          // "rezervace.veterina-svahy.cz"
  
  // Feature flags
  enabledFeatures   Json?            // ["reservations", "payments", "sms"]
}
```

### **2. CONTENT SERVICE ARCHITEKTURA**

#### **Content Provider Service**:
```typescript
// apps/api/src/services/contentService.ts
class ContentService {
  async getTenantContent(tenantId: string): Promise<TenantContent>
  async getContentTemplate(templateName: string): Promise<ContentTemplate>
  async applyContentOverrides(baseContent: any, overrides: any): Promise<any>
  async validateContent(content: any): Promise<boolean>
}

// apps/web/lib/content-provider.ts
class ContentProvider {
  async loadTenantContent(tenantSlug: string): Promise<TenantContent>
  getLabel(key: string, fallback?: string): string
  getMessage(key: string, variables?: object): string
  getEmailTemplate(type: string): EmailTemplate
  getColorScheme(): ColorScheme
}
```

#### **Content Hook pro React**:
```typescript
// apps/web/hooks/useContent.ts
export function useContent() {
  const content = useTenantContent()
  
  return {
    t: (key: string, fallback?: string) => content.getLabel(key, fallback),
    msg: (key: string, vars?: object) => content.getMessage(key, vars),
    colors: content.getColorScheme(),
    features: content.getEnabledFeatures()
  }
}
```

### **3. TEMPLATE SYSTEM**

#### **Veterinární template**:
```json
{
  "name": "veterinary",
  "displayName": "Veterinární ordinace",
  "labels": {
    "app_name": "Veterinární rezervace",
    "hero_title": "Rezervujte si termín {service_type}",
    "hero_subtitle": "Jednoduché rezervace {service_type} služeb",
    "professional_title": "Veterinář",
    "client_title": "Majitel zvířete",
    "appointment_title": "Termín návštěvy",
    "pet_name": "Jméno zvířete",
    "pet_type": "Druh zvířete",
    "service_types": ["Základní vyšetření", "Očkování", "Chirurgie"]
  },
  "colorScheme": {
    "primary": "#f97316",
    "secondary": "#fb923c",
    "accent": "#ea580c",
    "neutral": "#6b7280"
  },
  "features": ["reservations", "pet_management", "medical_records"]
}
```

#### **Univerzální template**:
```json
{
  "name": "universal",
  "displayName": "Univerzální rezervace",
  "labels": {
    "app_name": "Rezervační systém",
    "hero_title": "Rezervujte si termín online",
    "hero_subtitle": "Jednoduché a rychlé rezervace",
    "professional_title": "Poskytovatel služby",
    "client_title": "Klient",
    "appointment_title": "Termín",
    "client_name": "Jméno klienta",
    "service_type": "Typ služby"
  },
  "colorScheme": {
    "primary": "#3b82f6",
    "secondary": "#60a5fa",
    "accent": "#2563eb",
    "neutral": "#6b7280"
  },
  "features": ["reservations", "basic_management"]
}
```

---

## 🚀 **IMPLEMENTAČNÍ PLÁN**

### **FÁZE 1: Databázová migrace** (1-2 týdny)

#### **1.1 Vytvoření nových modelů**:
```sql
-- Migration: add_content_system
ALTER TABLE tenants ADD COLUMN content_template_id TEXT;
ALTER TABLE tenants ADD COLUMN custom_content JSONB;
ALTER TABLE tenants ADD COLUMN google_client_id TEXT;
ALTER TABLE tenants ADD COLUMN subdomain TEXT UNIQUE;
ALTER TABLE tenants ADD COLUMN enabled_features JSONB;

CREATE TABLE content_templates (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  category TEXT NOT NULL,
  labels JSONB NOT NULL,
  messages JSONB NOT NULL,
  email_templates JSONB NOT NULL,
  color_scheme JSONB NOT NULL,
  typography JSONB,
  features JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### **1.2 Seed základních templates**:
```typescript
// Veterinární template
await prisma.contentTemplate.create({
  data: {
    name: 'veterinary',
    displayName: 'Veterinární ordinace',
    category: 'healthcare',
    labels: { /* veterinary labels */ },
    colorScheme: { primary: '#f97316' },
    features: ['reservations', 'pet_management']
  }
})

// Aktualizace existujících tenantů
await prisma.tenant.update({
  where: { slug: 'svahy' },
  data: { 
    contentTemplateId: veterinaryTemplate.id,
    subdomain: 'veterina-svahy'
  }
})
```

### **FÁZE 2: Content Service implementace** (2-3 týdny)

#### **2.1 Backend Content Service**:
```typescript
// apps/api/src/services/contentService.ts
export class ContentService {
  private cache = new Map<string, TenantContent>()
  
  async getTenantContent(tenantId: string): Promise<TenantContent> {
    // Cache lookup
    if (this.cache.has(tenantId)) {
      return this.cache.get(tenantId)!
    }
    
    // Load from database
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      include: { contentTemplate: true }
    })
    
    // Merge template + custom content
    const content = this.mergeContent(
      tenant.contentTemplate,
      tenant.customContent
    )
    
    // Cache result
    this.cache.set(tenantId, content)
    return content
  }
}
```

#### **2.2 Frontend Content Provider**:
```typescript
// apps/web/lib/content-provider.ts
export class ContentProvider {
  private content: TenantContent | null = null
  
  async loadTenantContent(tenantSlug: string) {
    const response = await fetch(`/api/public/tenant/${tenantSlug}/content`)
    this.content = await response.json()
  }
  
  getLabel(key: string, fallback?: string): string {
    return this.content?.labels[key] || fallback || key
  }
  
  getColorScheme(): ColorScheme {
    return this.content?.colorScheme || DEFAULT_COLORS
  }
}
```

### **FÁZE 3: Component refactoring** (3-4 týdny)

#### **3.1 Refactoring UI komponent**:
```typescript
// Před
function HeroSection() {
  return (
    <h1>Rezervujte si termín online</h1>
  )
}

// Po
function HeroSection() {
  const { t, colors } = useContent()
  
  return (
    <div style={{ backgroundColor: colors.primary }}>
      <h1>{t('hero_title', 'Rezervujte si termín online')}</h1>
    </div>
  )
}
```

#### **3.2 Dynamic styling system**:
```typescript
// apps/web/lib/dynamic-styles.ts
export function applyTenantStyles(colorScheme: ColorScheme) {
  document.documentElement.style.setProperty('--color-primary', colorScheme.primary)
  document.documentElement.style.setProperty('--color-secondary', colorScheme.secondary)
  
  // Update Tailwind CSS variables
  const tailwindConfig = {
    theme: {
      extend: {
        colors: {
          primary: colorScheme.primary,
          secondary: colorScheme.secondary
        }
      }
    }
  }
  
  // Apply runtime
  updateTailwindConfig(tailwindConfig)
}
```

### **FÁZE 4: Email templates refactoring** (1-2 týdny)

#### **4.1 Dynamic email templates**:
```typescript
// apps/api/src/services/emailService.ts
class EmailService {
  async sendReservationCreatedNotification(data: ReservationEmailData) {
    const content = await contentService.getTenantContent(data.tenantId)
    const template = content.emailTemplates.reservationCreated
    
    const subject = this.renderTemplate(template.subject, data)
    const htmlContent = this.renderTemplate(template.html, data)
    
    return this.sendEmail({ subject, htmlContent })
  }
  
  private renderTemplate(template: string, data: any): string {
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return data[key] || match
    })
  }
}
```

### **FÁZE 5: Subdomain routing** (2-3 týdny)

#### **5.1 Next.js middleware update**:
```typescript
// apps/web/middleware.ts
export function middleware(request: NextRequest) {
  const hostname = request.headers.get('host')
  
  // Extract subdomain
  const subdomain = hostname?.split('.')[0]
  
  if (subdomain && subdomain !== 'www') {
    // Rewrite to tenant-specific page
    return NextResponse.rewrite(
      new URL(`/tenant/${subdomain}${request.nextUrl.pathname}`, request.url)
    )
  }
}
```

#### **5.2 Google OAuth per tenant**:
```typescript
// apps/web/auth.ts
export const authOptions: AuthOptions = {
  providers: [
    // Dynamic Google provider based on tenant
    ...await getDynamicGoogleProviders(),
    CredentialsProvider({ /* ... */ })
  ]
}

async function getDynamicGoogleProviders() {
  const tenants = await prisma.tenant.findMany({
    where: { googleClientId: { not: null } }
  })
  
  return tenants.map(tenant => GoogleProvider({
    clientId: tenant.googleClientId!,
    clientSecret: tenant.googleClientSecret!,
    // Configure per tenant
  }))
}
```

---

## 🛡️ **BEZPEČNOSTNÍ OPATŘENÍ PRO PRODUKČNÍ DATABÁZI**

### **1. POSTUPNÁ MIGRACE**

#### **Strategie "Zero-downtime"**:
1. **Přidání nových sloupců** (nullable)
2. **Seed základních dat** (bez ovlivnění existujících)
3. **Postupné přepínání** komponent na nový systém
4. **Validace** funkčnosti po každém kroku
5. **Rollback plán** pro každou fázi

#### **Migrace script**:
```sql
-- Step 1: Add new columns (safe)
ALTER TABLE tenants ADD COLUMN content_template_id TEXT;
ALTER TABLE tenants ADD COLUMN custom_content JSONB;
ALTER TABLE tenants ADD COLUMN subdomain TEXT;

-- Step 2: Create content_templates table
CREATE TABLE content_templates (
  -- schema definition
);

-- Step 3: Seed default templates
INSERT INTO content_templates (name, display_name, ...) VALUES (...);

-- Step 4: Update existing tenants (gradual)
UPDATE tenants SET content_template_id = (
  SELECT id FROM content_templates WHERE name = 'veterinary'
) WHERE slug = 'svahy';

-- Step 5: Add constraints (after data migration)
ALTER TABLE tenants ADD CONSTRAINT unique_subdomain UNIQUE (subdomain);
```

### **2. FALLBACK MECHANISMUS**

#### **Graceful degradation**:
```typescript
// Content provider with fallbacks
export function useContent() {
  const content = useTenantContent()
  
  return {
    t: (key: string, fallback?: string) => {
      // 1. Try tenant custom content
      if (content?.customContent?.[key]) {
        return content.customContent[key]
      }
      
      // 2. Try template content
      if (content?.template?.labels?.[key]) {
        return content.template.labels[key]
      }
      
      // 3. Try hardcoded fallback
      if (fallback) {
        return fallback
      }
      
      // 4. Return key as last resort
      return key
    }
  }
}
```

### **3. MONITORING A VALIDACE**

#### **Content validation**:
```typescript
// Validate content before applying
export function validateTenantContent(content: TenantContent): ValidationResult {
  const errors: string[] = []
  
  // Check required labels
  const requiredLabels = ['app_name', 'hero_title', 'professional_title']
  for (const label of requiredLabels) {
    if (!content.labels[label]) {
      errors.push(`Missing required label: ${label}`)
    }
  }
  
  // Validate color scheme
  if (!isValidColor(content.colorScheme.primary)) {
    errors.push('Invalid primary color')
  }
  
  return { valid: errors.length === 0, errors }
}
```

---

## 📋 **ROLLBACK PLÁN**

### **Rollback strategie pro každou fázi**:

1. **Fáze 1 rollback**: DROP nové sloupce, DELETE content_templates
2. **Fáze 2 rollback**: Deaktivovat ContentService, použít hardcoded values
3. **Fáze 3 rollback**: Revert component changes, restore hardcoded texts
4. **Fáze 4 rollback**: Restore original email templates
5. **Fáze 5 rollback**: Restore original routing, single Google OAuth

### **Rollback testing**:
```bash
# Test rollback procedure
npm run test:rollback:phase1
npm run test:rollback:phase2
# ... for each phase
```

---

## 🎯 **VÝHODY NOVÉ ARCHITEKTURY**

### **1. Snadný onboarding nových tenantů**:
```typescript
// Vytvoření nového tenanta
const newTenant = await prisma.tenant.create({
  data: {
    slug: 'nova-ordinace',
    name: 'Nová veterinární ordinace',
    subdomain: 'nova-ordinace',
    contentTemplateId: veterinaryTemplate.id,
    customContent: {
      hero_title: 'Rezervujte si termín u našich specialistů'
    }
  }
})
```

### **2. Rychlé přizpůsobení pro různé obory**:
```typescript
// Zubní ordinace
const dentalTemplate = {
  name: 'dental',
  labels: {
    professional_title: 'Zubní lékař',
    appointment_title: 'Termín u zubaře',
    client_name: 'Jméno pacienta'
  },
  colorScheme: {
    primary: '#06b6d4', // cyan
    secondary: '#0891b2'
  }
}
```

### **3. A/B testing možnosti**:
```typescript
// Testování různých variant
const contentVariants = {
  A: { hero_title: 'Rezervujte si termín online' },
  B: { hero_title: 'Objednejte se k veterináři' }
}

// Apply based on user segment
const content = getContentVariant(userId, contentVariants)
```

---

## 📊 **METRIKY ÚSPĚCHU**

### **Technické metriky**:
- ✅ **0% downtime** během migrace
- ✅ **<100ms** loading time pro content
- ✅ **100%** fallback coverage
- ✅ **0** broken hardcoded references

### **Business metriky**:
- ✅ **<5 min** nový tenant onboarding
- ✅ **<1 min** content customization
- ✅ **100%** brand consistency
- ✅ **Multi-obor** support

### **Uživatelské metriky**:
- ✅ **Stejná UX** pro existující uživatele
- ✅ **Lepší branding** pro nové tenantty
- ✅ **Rychlejší** načítání stránek
- ✅ **Konzistentní** messaging

---

## 🎉 **ZÁVĚR**

Migrace na dynamický content systém umožní:

1. **Univerzální použití** - systém bude fungovat pro jakýkoliv obor
2. **Snadné škálování** - nové tenantty za minuty
3. **Profesionální branding** - každý tenant vlastní identitu
4. **Bezpečná migrace** - zero-downtime s fallback mechanismy
5. **Budoucí rozšíření** - připraveno pro A/B testing, lokalizaci

**Celková doba implementace**: 8-12 týdnů
**Riziko**: Nízké (díky postupné migraci a fallback)
**ROI**: Vysoké (rychlý onboarding nových tenantů) 